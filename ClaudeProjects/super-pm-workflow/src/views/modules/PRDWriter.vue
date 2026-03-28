<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useProjectStore } from '@/stores/project'
import type { PRDData, UserStory, Feature } from '@/stores/project'
import { useAI } from '@/composables/useAI'
import { marked } from 'marked'
import { nanoid } from 'nanoid'

const route = useRoute()
const projectStore = useProjectStore()
const projectId = computed(() => route.params.id as string)
const project = computed(() => projectStore.projects.find(p => p.id === projectId.value))
const { generate, isStreaming } = useAI()

const emptyPRD = (): PRDData => ({
  problemBackground: '', productVision: '', userStories: [], features: [],
  technicalArchitecture: '', acceptanceCriteria: '', outOfScope: '', status: 'empty',
})

const data = ref<PRDData>(emptyPRD())

watch(project, (p) => {
  if (p?.modules.prd) data.value = JSON.parse(JSON.stringify(p.modules.prd))
  else if (p) {
    // Auto-fill from upstream
    data.value.problemBackground = p.requirement.problemStatement
  }
}, { immediate: true })

watch(data, () => projectStore.updateModule(projectId.value, 'prd', JSON.parse(JSON.stringify(data.value))), { deep: true })

function addStory() {
  data.value.userStories.push({
    id: nanoid(), role: '', want: '', benefit: '',
    acceptanceCriteria: [''], priority: 'medium',
  })
}
function removeStory(i: number) { data.value.userStories.splice(i, 1) }
function addCriteria(s: UserStory) { s.acceptanceCriteria.push('') }
function removeCriteria(s: UserStory, i: number) { s.acceptanceCriteria.splice(i, 1) }

function addFeature() {
  data.value.features.push({
    id: nanoid(), name: '', description: '',
    status: 'planning', priority: 'medium',
  })
}
function removeFeature(i: number) { data.value.features.splice(i, 1) }

const activeSection = ref<string>('problemBackground')
const sections = [
  { key: 'problemBackground', label: '问题背景' },
  { key: 'productVision', label: '产品愿景' },
  { key: 'userStories', label: '用户故事' },
  { key: 'features', label: '功能列表' },
  { key: 'technicalArchitecture', label: '技术架构' },
  { key: 'acceptanceCriteria', label: '验收标准' },
  { key: 'outOfScope', label: '不在范围内' },
]

const completedSections = computed(() => {
  const checks: Record<string, boolean> = {
    problemBackground: !!data.value.problemBackground,
    productVision: !!data.value.productVision,
    userStories: data.value.userStories.length > 0,
    features: data.value.features.length > 0,
    technicalArchitecture: !!data.value.technicalArchitecture,
    acceptanceCriteria: !!data.value.acceptanceCriteria,
    outOfScope: !!data.value.outOfScope,
  }
  return checks
})

const aiDraftText = ref<Record<string, string>>({})

async function generateSection(key: string) {
  if (!project.value) return
  const r = project.value.requirement
  const bs = project.value.modules.brainstorming

  const contextLines = [
    `业务背景: ${r.businessContext}`,
    `问题陈述: ${r.problemStatement}`,
    bs?.designScheme ? `产品方案: ${bs.designScheme.slice(0, 500)}` : '',
  ].filter(Boolean).join('\n')

  const sectionPrompts: Record<string, string> = {
    problemBackground: `基于以下背景，撰写PRD的"问题背景"章节（300-500字，中文）:\n${contextLines}`,
    productVision: `基于以下背景，撰写PRD的"产品愿景"章节（200-300字，包含用户价值主张和成功指标）:\n${contextLines}`,
    userStories: `基于以下背景，生成3-5个用户故事，格式: "作为[角色], 我希望[功能], 以便[价值]"，并给出2-3条验收标准:\n${contextLines}`,
    features: `基于以下背景，生成功能列表（5-8个功能点），每个包含名称和简短描述:\n${contextLines}`,
    technicalArchitecture: `基于以下背景，简要描述技术架构方案（200-300字）:\n${contextLines}`,
    acceptanceCriteria: `基于以下背景，生成项目整体验收标准（5-8条）:\n${contextLines}`,
    outOfScope: `基于以下背景，列出本期不在范围内的内容（3-5条）:\n${contextLines}`,
  }

  const result = await generate({
    systemPrompt: '你是一名专业的产品经理，擅长撰写高质量的PRD文档，使用中文，输出格式规范。',
    messages: [{ role: 'user', content: sectionPrompts[key] || '' }],
  })

  if (result) {
    // userStories and features are typed arrays — show AI output as draft text, not overwrite
    if (key === 'userStories' || key === 'features') {
      aiDraftText.value[key] = result
    } else if (key in data.value) {
      (data.value as any)[key] = result
    }
    data.value.status = 'draft'
  }
}

function markCompleted() { data.value.status = 'completed' }

const priorityColor: Record<string, string> = {
  high: 'var(--color-danger)', medium: 'var(--color-warning)', low: 'var(--color-success)',
}
const statusColor: Record<string, string> = {
  planning: 'var(--color-text-muted)', backlog: 'var(--color-warning)',
  development: 'var(--color-accent)', completed: 'var(--color-success)',
}
</script>

<template>
  <div class="module-page">
    <div class="module-header">
      <div>
        <h1 class="module-title">📄 PRD 撰写</h1>
        <p class="module-desc">编写专业的产品需求文档，明确功能边界和验收标准</p>
      </div>
      <button v-if="data.status !== 'completed'" class="btn-complete" @click="markCompleted">✓ 标记完成</button>
      <span v-else class="badge-completed">✓ 已完成</span>
    </div>

    <div class="prd-layout">
      <!-- Section Nav -->
      <div class="section-nav">
        <div class="nav-label">文档章节</div>
        <button
          v-for="s in sections" :key="s.key"
          class="nav-item"
          :class="{ active: activeSection === s.key, done: completedSections[s.key] }"
          @click="activeSection = s.key"
        >
          <span class="nav-check">{{ completedSections[s.key] ? '✓' : '○' }}</span>
          {{ s.label }}
        </button>
      </div>

      <!-- Section Content -->
      <div class="section-content">
        <!-- Text sections -->
        <template v-if="['problemBackground','productVision','technicalArchitecture','acceptanceCriteria','outOfScope'].includes(activeSection)">
          <div class="section-card">
            <div class="card-title-row">
              <span class="card-title">{{ sections.find(s => s.key === activeSection)?.label }}</span>
              <button class="btn-ai-section" @click="generateSection(activeSection)" :disabled="isStreaming">
                {{ isStreaming ? '生成中...' : '⚡ AI 生成' }}
              </button>
            </div>
            <textarea
              v-model="(data as any)[activeSection]"
              class="full-textarea section-textarea"
              :placeholder="`撰写${sections.find(s=>s.key===activeSection)?.label}...`"
              rows="12"
            ></textarea>
            <div v-if="(data as any)[activeSection]" class="markdown-preview markdown-body" v-html="marked((data as any)[activeSection])"></div>
          </div>
        </template>

        <!-- User Stories -->
        <template v-if="activeSection === 'userStories'">
          <div class="section-card">
            <div class="card-title-row">
              <span class="card-title">用户故事</span>
              <div class="btn-row">
                <button class="btn-ai-section" @click="generateSection('userStories')" :disabled="isStreaming">⚡ AI 生成</button>
                <button class="btn-sm" @click="addStory">＋ 添加</button>
              </div>
            </div>

            <div v-for="(s, i) in data.userStories" :key="s.id" class="story-card">
              <div class="story-header">
                <span class="story-num">{{ i + 1 }}</span>
                <select v-model="s.priority" class="priority-sel" :style="{ color: priorityColor[s.priority] }">
                  <option value="high">高优先级</option>
                  <option value="medium">中优先级</option>
                  <option value="low">低优先级</option>
                </select>
                <button class="remove-btn" @click="removeStory(i)">✕</button>
              </div>
              <div class="story-template">
                <span>作为</span>
                <input v-model="s.role" placeholder="用户角色" class="story-input" />
                <span>我希望</span>
                <input v-model="s.want" placeholder="功能描述" class="story-input flex2" />
                <span>以便</span>
                <input v-model="s.benefit" placeholder="用户价值" class="story-input" />
              </div>
              <div class="criteria-section">
                <div class="criteria-label">验收标准</div>
                <div v-for="(c, ci) in s.acceptanceCriteria" :key="ci" class="criteria-row">
                  <span class="crit-num">{{ ci + 1 }}.</span>
                  <input v-model="s.acceptanceCriteria[ci]" placeholder="验收标准描述..." class="crit-input" />
                  <button class="remove-btn-xs" @click="removeCriteria(s, ci)">✕</button>
                </div>
                <button class="add-inline" @click="addCriteria(s)">＋ 添加标准</button>
              </div>
            </div>

            <div v-if="data.userStories.length === 0" class="empty-hint">点击「添加」或使用 AI 生成用户故事</div>
            <div v-if="aiDraftText['userStories']" class="ai-draft">
              <div class="ai-draft-label">⚡ AI 生成草稿（请参考后手动添加用户故事）</div>
              <div class="markdown-preview markdown-body" v-html="marked(aiDraftText['userStories'])"></div>
            </div>
          </div>
        </template>

        <!-- Features -->
        <template v-if="activeSection === 'features'">
          <div class="section-card">
            <div class="card-title-row">
              <span class="card-title">功能列表</span>
              <div class="btn-row">
                <button class="btn-ai-section" @click="generateSection('features')" :disabled="isStreaming">⚡ AI 生成</button>
                <button class="btn-sm" @click="addFeature">＋ 添加</button>
              </div>
            </div>

            <div class="features-table" v-if="data.features.length > 0">
              <div class="feat-header">
                <span>功能名称</span><span>描述</span><span>优先级</span><span>状态</span><span></span>
              </div>
              <div v-for="(f, i) in data.features" :key="f.id" class="feat-row">
                <input v-model="f.name" placeholder="功能名称" class="feat-name" />
                <input v-model="f.description" placeholder="功能描述" class="feat-desc" />
                <select v-model="f.priority" class="feat-sel" :style="{ color: priorityColor[f.priority] }">
                  <option value="high">高</option>
                  <option value="medium">中</option>
                  <option value="low">低</option>
                </select>
                <select v-model="f.status" class="feat-sel" :style="{ color: statusColor[f.status] }">
                  <option value="planning">规划中</option>
                  <option value="backlog">待排期</option>
                  <option value="development">开发中</option>
                  <option value="completed">已完成</option>
                </select>
                <button class="remove-btn" @click="removeFeature(i)">✕</button>
              </div>
            </div>
            <div v-else class="empty-hint">点击「添加」或使用 AI 生成功能列表</div>
            <div v-if="aiDraftText['features']" class="ai-draft">
              <div class="ai-draft-label">⚡ AI 生成草稿（请参考后手动添加功能项）</div>
              <div class="markdown-preview markdown-body" v-html="marked(aiDraftText['features'])"></div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.module-page { padding: 28px 24px; display: flex; flex-direction: column; gap: 16px; }
.module-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 4px; }
.module-title { font-size: 22px; font-weight: 700; color: var(--color-text-heading); letter-spacing: -0.5px; }
.module-desc { color: var(--color-text-muted); font-size: 14px; margin-top: 4px; }
.btn-complete { padding: 7px 16px; background: var(--color-accent); color: white; border: none; border-radius: var(--radius-sm); font-size: 13px; cursor: pointer; }
.badge-completed { font-size: 13px; color: var(--color-success); background: var(--color-success-muted); border: 1px solid rgba(74,222,128,0.3); padding: 5px 12px; border-radius: 20px; }

.prd-layout { display: flex; gap: 16px; align-items: flex-start; }
.section-nav {
  width: 160px; flex-shrink: 0;
  background: var(--color-surface); border: 1px solid var(--color-border);
  border-radius: var(--radius-md); padding: 12px 8px;
  position: sticky; top: 16px;
}
.nav-label { font-size: 10px; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase; color: var(--color-text-muted); padding: 0 8px; margin-bottom: 6px; }
.nav-item {
  display: flex; align-items: center; gap: 6px;
  width: 100%; padding: 7px 8px; background: none; border: none;
  border-radius: var(--radius-sm); font-size: 12px; cursor: pointer;
  color: var(--color-text-muted); text-align: left; transition: 0.12s;
}
.nav-item:hover { background: var(--color-surface-2); color: var(--color-text); }
.nav-item.active { background: var(--color-accent-muted); color: var(--color-accent); font-weight: 500; }
.nav-check { font-size: 10px; width: 14px; }
.nav-item.done .nav-check { color: var(--color-success); }

.section-content { flex: 1; min-width: 0; }
.section-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 18px 20px; display: flex; flex-direction: column; gap: 12px; }
.card-title { font-size: 14px; font-weight: 600; color: var(--color-text-heading); }
.card-title-row { display: flex; align-items: center; justify-content: space-between; }
.btn-ai-section { padding: 6px 14px; background: var(--color-accent-muted); border: 1px solid rgba(108,138,255,0.3); border-radius: var(--radius-sm); font-size: 12px; cursor: pointer; color: var(--color-accent); transition: 0.15s; }
.btn-ai-section:hover { background: var(--color-accent); color: white; }
.btn-ai-section:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-sm { padding: 5px 12px; background: var(--color-surface-2); border: 1px solid var(--color-border); border-radius: var(--radius-sm); font-size: 12px; cursor: pointer; color: var(--color-text); }
.btn-row { display: flex; gap: 6px; }
.full-textarea { width: 100%; padding: 10px 12px; resize: vertical; line-height: 1.6; }
.section-textarea { min-height: 280px; }
.markdown-preview { margin-top: 8px; border-top: 1px solid var(--color-border); padding-top: 12px; }
.empty-hint { color: var(--color-text-muted); font-size: 13px; text-align: center; padding: 20px; }

/* User Stories */
.story-card { background: var(--color-surface-2); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; }
.story-header { display: flex; align-items: center; gap: 8px; }
.story-num { width: 24px; height: 24px; background: var(--color-accent-muted); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; color: var(--color-accent); font-weight: 600; }
.priority-sel { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 4px; padding: 3px 8px; font-size: 12px; flex: 1; }
.remove-btn { background: none; border: none; cursor: pointer; color: var(--color-text-muted); font-size: 14px; padding: 4px 6px; }
.remove-btn:hover { color: var(--color-danger); }
.story-template { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 13px; color: var(--color-text-muted); }
.story-input { flex: 1; min-width: 120px; padding: 6px 10px; font-size: 13px; }
.flex2 { flex: 2; }
.criteria-section { display: flex; flex-direction: column; gap: 6px; }
.criteria-label { font-size: 11px; font-weight: 600; color: var(--color-text-muted); letter-spacing: 0.5px; }
.criteria-row { display: flex; align-items: center; gap: 6px; }
.crit-num { font-size: 12px; color: var(--color-text-muted); width: 18px; }
.crit-input { flex: 1; padding: 5px 8px; font-size: 13px; }
.remove-btn-xs { background: none; border: none; cursor: pointer; color: var(--color-text-muted); font-size: 12px; padding: 2px; }
.add-inline { background: none; border: none; cursor: pointer; color: var(--color-text-muted); font-size: 12px; padding: 4px 0; }
.add-inline:hover { color: var(--color-accent); }

/* Features table */
.features-table { display: flex; flex-direction: column; gap: 4px; }
.feat-header { display: grid; grid-template-columns: 1fr 2fr 80px 90px 30px; gap: 8px; padding: 6px 10px; font-size: 11px; font-weight: 600; letter-spacing: 0.5px; color: var(--color-text-muted); text-transform: uppercase; }
.feat-row { display: grid; grid-template-columns: 1fr 2fr 80px 90px 30px; gap: 8px; align-items: center; background: var(--color-surface-2); border: 1px solid var(--color-border); border-radius: var(--radius-sm); padding: 6px 10px; }
.feat-name, .feat-desc { padding: 5px 8px; font-size: 13px; }
.feat-sel { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 4px; padding: 4px 6px; font-size: 12px; }
.ai-draft { margin-top: 12px; background: var(--color-accent-muted); border: 1px solid rgba(108,138,255,0.3); border-radius: var(--radius-sm); padding: 12px 16px; }
.ai-draft-label { font-size: 11px; font-weight: 600; color: var(--color-accent); letter-spacing: 0.5px; margin-bottom: 8px; }
</style>
