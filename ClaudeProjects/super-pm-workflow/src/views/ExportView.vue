<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectStore } from '@/stores/project'
import { marked } from 'marked'

const route = useRoute()
const router = useRouter()
const projectStore = useProjectStore()

const projectId = computed(() => route.params.id as string)
const project = computed(() => projectStore.projects.find(p => p.id === projectId.value))

const sectionDefs = [
  { key: 'requirement', label: '需求录入', icon: '📋' },
  { key: 'brainstorming', label: '方案头脑风暴', icon: '💡' },
  { key: 'prd', label: 'PRD 文档', icon: '📄' },
  { key: 'plans', label: '实施计划', icon: '🗂️' },
  { key: 'abTest', label: 'A/B 实验', icon: '🧪' },
  { key: 'analytics', label: '数据埋点', icon: '📊' },
  { key: 'onboarding', label: '新用户激活', icon: '🚀' },
]

function getRequirementMd(p: any): string {
  const r = p.requirement
  return `# 需求录入\n\n**业务背景：**\n${r.businessContext}\n\n**问题陈述：**\n${r.problemStatement}\n\n**成功指标：**\n${r.successMetrics.map((m: any) => `- ${m.name}: ${m.target}`).join('\n')}\n\n**目标用户：** ${r.targetUsers}\n\n**约束与范围：** ${r.constraints}\n\n**优先级：** ${r.priority}`
}

function getBrainstormingMd(p: any): string {
  const b = p.modules.brainstorming
  if (!b) return ''
  let md = `# 方案头脑风暴\n\n## 设计方案\n\n${b.designScheme}\n\n## 架构概览\n\n${b.architectureOverview}`
  if (b.solutionOptions.length > 0) {
    md += '\n\n## 解决方案选项\n\n'
    b.solutionOptions.forEach((opt: any, i: number) => {
      md += `### 方案 ${i + 1}: ${opt.title}${opt.recommended ? ' ⭐推荐' : ''}\n\n${opt.description}\n\n**优点：** ${opt.pros.join(', ')}\n\n**缺点：** ${opt.cons.join(', ')}\n\n**难度：** ${opt.difficulty}\n\n`
    })
  }
  return md
}

function getPRDMd(p: any): string {
  const prd = p.modules.prd
  if (!prd) return ''
  let md = `# PRD 文档\n\n## 问题背景\n\n${prd.problemBackground}\n\n## 产品愿景\n\n${prd.productVision}`
  if (prd.userStories.length > 0) {
    md += '\n\n## 用户故事\n\n'
    prd.userStories.forEach((s: any, i: number) => {
      md += `### US${i + 1} [${s.priority}]\n\n作为 **${s.role}**，我希望 **${s.want}**，以便 **${s.benefit}**\n\n**验收标准：**\n${s.acceptanceCriteria.map((c: string, ci: number) => `${ci + 1}. ${c}`).join('\n')}\n\n`
    })
  }
  if (prd.features.length > 0) {
    md += '## 功能列表\n\n| 功能 | 描述 | 优先级 | 状态 |\n|------|------|--------|------|\n'
    prd.features.forEach((f: any) => {
      md += `| ${f.name} | ${f.description} | ${f.priority} | ${f.status} |\n`
    })
    md += '\n'
  }
  md += `## 技术架构\n\n${prd.technicalArchitecture}\n\n## 验收标准\n\n${prd.acceptanceCriteria}\n\n## 不在范围内\n\n${prd.outOfScope}`
  return md
}

function getSectionMd(key: string): string {
  const p = project.value
  if (!p) return ''
  if (key === 'requirement') return getRequirementMd(p)
  if (key === 'brainstorming') return getBrainstormingMd(p)
  if (key === 'prd') return getPRDMd(p)

  const m = (p.modules as any)[key]
  if (!m) return ''

  if (key === 'plans') return getPlansMd(m)
  if (key === 'abTest') return getABTestMd(m)
  if (key === 'analytics') return getAnalyticsMd(m)
  if (key === 'onboarding') return getOnboardingMd(m)
  return `# ${sectionDefs.find(s => s.key === key)?.label}\n\n（该模块尚无内容）`
}

function getPlansMd(m: any): string {
  let md = `# 实施计划\n\n${m.overview || ''}`
  if (m.milestones?.length > 0) {
    m.milestones.forEach((ms: any, i: number) => {
      md += `\n\n## 里程碑 ${i + 1}: ${ms.title}（${ms.duration}）\n\n${ms.description || ''}`
      if (ms.tasks?.length > 0) {
        md += '\n\n| 任务 | 描述 | 负责人 | 预估 | 状态 |\n|------|------|--------|------|------|\n'
        ms.tasks.forEach((t: any) => {
          md += `| ${t.title} | ${t.description || ''} | ${t.assignee || ''} | ${t.estimate || ''} | ${t.status} |\n`
        })
      }
    })
  }
  return md
}

function getABTestMd(m: any): string {
  let md = `# A/B 实验\n\n**实验名称：** ${m.testName || ''}\n\n`
  if (m.observation && m.change && m.expectedOutcome) {
    md += `**假设：** 因为 ${m.observation}，我们相信 ${m.change} 将会导致 ${m.expectedOutcome}\n\n`
  }
  md += `**主要指标：** ${m.primaryMetric || ''}\n\n**实验平台：** ${m.platform || ''}\n\n`
  if (m.variants?.length > 0) {
    md += '## 实验组设计\n\n'
    m.variants.forEach((v: any) => {
      md += `### ${v.name}（流量 ${v.trafficPercent}%）\n\n${v.description || ''}\n\n`
      if (v.changes?.length > 0) md += `具体改动：\n${v.changes.map((c: string) => `- ${c}`).join('\n')}\n\n`
    })
  }
  md += `## 样本量计算\n\n- 基线转化率：${m.baselineRate}%\n- 最小可检测效果：${m.mde}%\n- 置信水平：${(m.confidence * 100).toFixed(0)}%\n- 每组所需样本量：${m.sampleSizeRequired.toLocaleString()}\n- 预计实验天数：${m.estimatedDays}\n`
  return md
}

function getAnalyticsMd(m: any): string {
  let md = `# 数据埋点\n\n${m.overview || ''}`
  if (m.events?.length > 0) {
    md += '\n\n## 事件规格\n\n| 事件名称 | 类别 | 描述 | 触发时机 |\n|---------|------|------|----------|\n'
    m.events.forEach((e: any) => {
      md += `| ${e.name} | ${e.category || ''} | ${e.description || ''} | ${e.trigger || ''} |\n`
    })
  }
  if (m.journeySteps?.length > 0) {
    md += '\n\n## 用户旅程\n\n'
    m.journeySteps.forEach((s: any, i: number) => {
      md += `${i + 1}. **${s.name}**：${s.description || ''}\n`
    })
  }
  return md
}

function getOnboardingMd(m: any): string {
  let md = `# 新用户激活\n\n**激活定义：** ${m.activationDefinition || ''}`
  if (m.funnelSteps?.length > 0) {
    md += '\n\n## 激活漏斗\n\n| 步骤 | 用户数 | 转化率 |\n|------|--------|--------|\n'
    m.funnelSteps.forEach((s: any) => {
      md += `| ${s.name} | ${s.userCount.toLocaleString()} | ${s.conversionRate}% |\n`
    })
  }
  if (m.ahaMoments?.length > 0) {
    md += '\n\n## Aha 时刻\n\n'
    m.ahaMoments.forEach((a: any) => {
      md += `- **${a.description}**（${a.timeToAha}，留存提升 ${a.retentionLift}%）\n`
    })
  }
  if (m.experimentPlan) md += `\n\n## 实验方案\n\n${m.experimentPlan}`
  return md
}

function fullReport(): string {
  if (!project.value) return ''
  const p = project.value
  const parts = [
    `# ${p.name} - 产品工作流报告\n\n生成时间: ${new Date().toLocaleString('zh-CN')}\n\n---`,
    getRequirementMd(p),
    getBrainstormingMd(p),
    getPRDMd(p),
    getSectionMd('plans'),
    getSectionMd('abTest'),
    getSectionMd('analytics'),
    getSectionMd('onboarding'),
  ].filter(Boolean)
  return parts.join('\n\n---\n\n')
}

function exportMd() {
  const content = fullReport()
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${project.value?.name || 'project'}-report.md`
  a.click()
  URL.revokeObjectURL(url)
}

function exportJSON() {
  const content = JSON.stringify(project.value, null, 2)
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${project.value?.name || 'project'}.pmw.json`
  a.click()
  URL.revokeObjectURL(url)
}

async function exportPDF() {
  const html2pdf = (await import('html2pdf.js')).default
  const el = document.getElementById('report-content')
  if (!el) return
  html2pdf().from(el).set({
    margin: [15, 15],
    filename: `${project.value?.name || 'project'}-report.pdf`,
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4' },
  }).save()
}

const reportHtml = computed(() => marked(fullReport()))
</script>

<template>
  <div class="export-page" v-if="project">
    <div class="export-header">
      <div>
        <h1 class="export-title">📋 导出报告</h1>
        <p class="export-desc">{{ project.name }}</p>
      </div>
      <div class="export-actions">
        <button class="btn-export" @click="exportMd">📄 Markdown</button>
        <button class="btn-export" @click="exportPDF">📑 PDF</button>
        <button class="btn-export primary" @click="exportJSON">💾 项目文件 (.pmw.json)</button>
      </div>
    </div>

    <div class="report-preview">
      <div class="preview-label">报告预览</div>
      <div id="report-content" class="report-content markdown-body" v-html="reportHtml"></div>
    </div>
  </div>
</template>

<style scoped>
.export-page { padding: 28px 32px; max-width: 900px; margin: 0 auto; }
.export-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
.export-title { font-size: 22px; font-weight: 700; color: var(--color-text-heading); }
.export-desc { font-size: 14px; color: var(--color-text-muted); margin-top: 4px; }
.export-actions { display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
.btn-export {
  padding: 8px 16px; background: var(--color-surface);
  border: 1px solid var(--color-border); border-radius: var(--radius-sm);
  font-size: 13px; cursor: pointer; color: var(--color-text); transition: 0.15s;
}
.btn-export:hover { border-color: var(--color-accent); color: var(--color-accent); }
.btn-export.primary { background: var(--color-accent); color: white; border-color: var(--color-accent); }
.btn-export.primary:hover { background: var(--color-accent-hover); }

.report-preview { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); overflow: hidden; }
.preview-label { padding: 12px 20px; border-bottom: 1px solid var(--color-border); font-size: 12px; font-weight: 600; letter-spacing: 0.6px; text-transform: uppercase; color: var(--color-text-muted); }
.report-content { padding: 32px 40px; }
</style>
