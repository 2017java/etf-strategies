<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useProjectStore } from '@/stores/project'
import type { ABTestData, ABVariant } from '@/stores/project'
import { useAI } from '@/composables/useAI'
import { nanoid } from 'nanoid'

const route = useRoute()
const projectStore = useProjectStore()
const projectId = computed(() => route.params.id as string)
const project = computed(() => projectStore.projects.find(p => p.id === projectId.value))
const { generate, isStreaming } = useAI()

const emptyAB = (): ABTestData => ({
  testName: '', hypothesis: '', observation: '', change: '', expectedOutcome: '', audience: '',
  primaryMetric: '', secondaryMetrics: [], duration: 14,
  variants: [
    { id: nanoid(), name: '对照组 (Control)', description: '当前版本，不做任何改变', changes: [], trafficPercent: 50 },
    { id: nanoid(), name: '实验组 A (Treatment)', description: '待测试的新版本', changes: [], trafficPercent: 50 },
  ],
  baselineRate: 5, mde: 2, confidence: 0.95, power: 0.8, dailyTraffic: 1000,
  sampleSizeRequired: 0, estimatedDays: 0, platform: '', checklist: [], status: 'empty',
})

const data = ref<ABTestData>(emptyAB())

watch(project, (p) => {
  if (p?.modules.abTest) data.value = JSON.parse(JSON.stringify(p.modules.abTest))
}, { immediate: true })

watch(data, () => projectStore.updateModule(projectId.value, 'abTest', JSON.parse(JSON.stringify(data.value))), { deep: true })

// Sample size calculator
function calcSampleSize() {
  const { baselineRate, mde, confidence, power } = data.value
  const z_alpha = confidence === 0.95 ? 1.96 : confidence === 0.99 ? 2.576 : 1.645
  const z_beta = power === 0.8 ? 0.84 : power === 0.9 ? 1.28 : 0.84
  const p1 = baselineRate / 100
  const p2 = (baselineRate + mde) / 100
  const p_bar = (p1 + p2) / 2
  const n = Math.ceil(
    2 * (z_alpha + z_beta) ** 2 * p_bar * (1 - p_bar) / (p2 - p1) ** 2
  )
  data.value.sampleSizeRequired = n
  data.value.estimatedDays = Math.ceil(n / (data.value.dailyTraffic * data.value.variants.length))
}

watch(() => [data.value.baselineRate, data.value.mde, data.value.confidence, data.value.power, data.value.dailyTraffic], calcSampleSize, { immediate: true })

function addVariant() {
  data.value.variants.push({ id: nanoid(), name: `实验组 ${String.fromCharCode(65 + data.value.variants.length - 1)}`, description: '', changes: [], trafficPercent: 0 })
}
function removeVariant(i: number) { if (data.value.variants.length > 2) data.value.variants.splice(i, 1) }
function addChange(v: ABVariant) { v.changes.push('') }
function removeChange(v: ABVariant, i: number) { v.changes.splice(i, 1) }
function addMetric() { data.value.secondaryMetrics.push('') }
function removeMetric(i: number) { data.value.secondaryMetrics.splice(i, 1) }

const defaultChecklist = [
  '已确认实验假设和指标',
  '样本量满足统计显著性要求',
  '已设置监控和告警',
  '已确认流量分配逻辑',
  '已准备回滚方案',
  '已通知相关团队',
]
function initChecklist() {
  if (data.value.checklist.length === 0)
    data.value.checklist = defaultChecklist.map(text => ({ text, checked: false }))
}

async function generateTest() {
  if (!project.value) return
  const prd = project.value.modules.prd
  const features = prd?.features.slice(0, 3).map(f => `- ${f.name}: ${f.description}`).join('\n') || ''
  const r = project.value.requirement

  const result = await generate({
    systemPrompt: '你是一名资深产品经理，擅长设计科学的A/B实验方案。使用中文，请严格按照JSON格式输出，不要有其他说明文字。',
    messages: [{ role: 'user', content: `请基于以下信息，设计A/B实验方案：\n业务背景: ${r.businessContext}\n功能列表:\n${features}\n\n请输出JSON格式（只输出JSON，不要markdown代码块）：\n{"testName":"...","observation":"...","change":"...","expectedOutcome":"...","audience":"...","primaryMetric":"..."}` }],
  })
  if (result) {
    try {
      const parsed = JSON.parse(result.trim())
      if (parsed.testName) data.value.testName = parsed.testName
      if (parsed.observation) data.value.observation = parsed.observation
      if (parsed.change) data.value.change = parsed.change
      if (parsed.expectedOutcome) data.value.expectedOutcome = parsed.expectedOutcome
      if (parsed.audience) data.value.audience = parsed.audience
      if (parsed.primaryMetric) data.value.primaryMetric = parsed.primaryMetric
    } catch {
      // AI returned non-JSON, put in hypothesis field as fallback
      data.value.hypothesis = result
    }
    data.value.status = 'draft'
  }
}

function markCompleted() { data.value.status = 'completed' }
const activeTab = ref<'hypothesis' | 'variants' | 'calculator' | 'checklist'>('hypothesis')
</script>

<template>
  <div class="module-page">
    <div class="module-header">
      <div>
        <h1 class="module-title">🧪 A/B 实验设计</h1>
        <p class="module-desc">设计科学的验证实验，确保产品决策有数据支撑</p>
      </div>
      <button v-if="data.status !== 'completed'" class="btn-complete" @click="markCompleted">✓ 标记完成</button>
      <span v-else class="badge-completed">✓ 已完成</span>
    </div>

    <div class="tab-bar">
      <button :class="['tab', { active: activeTab === 'hypothesis' }]" @click="activeTab = 'hypothesis'">实验假设</button>
      <button :class="['tab', { active: activeTab === 'variants' }]" @click="activeTab = 'variants'">实验组设计</button>
      <button :class="['tab', { active: activeTab === 'calculator' }]" @click="activeTab = 'calculator'">样本量计算</button>
      <button :class="['tab', { active: activeTab === 'checklist' }]" @click="activeTab = 'checklist'; initChecklist()">上线检查清单</button>
    </div>

    <!-- Hypothesis Tab -->
    <div v-if="activeTab === 'hypothesis'" class="section-card">
      <div class="card-title-row">
        <span class="card-title">实验假设</span>
        <button class="btn-ai-section" @click="generateTest" :disabled="isStreaming">{{ isStreaming ? '生成中...' : '⚡ AI 生成' }}</button>
      </div>

      <div class="hypothesis-builder">
        <div class="hyp-row">
          <span class="hyp-label">实验名称</span>
          <input v-model="data.testName" placeholder="例：金融产品首页改版实验" class="hyp-input" />
        </div>
        <div class="hyp-row">
          <span class="hyp-label">因为（观察）</span>
          <input v-model="data.observation" placeholder="用户在金融产品页停留时间短，转化率低..." class="hyp-input" />
        </div>
        <div class="hyp-row">
          <span class="hyp-label">我们相信（改变）</span>
          <input v-model="data.change" placeholder="将产品利益突出展示，优化CTA按钮位置..." class="hyp-input" />
        </div>
        <div class="hyp-row">
          <span class="hyp-label">将会导致（结果）</span>
          <input v-model="data.expectedOutcome" placeholder="提升金融产品点击率和申请转化..." class="hyp-input" />
        </div>
        <div class="hyp-row">
          <span class="hyp-label">目标受众</span>
          <input v-model="data.audience" placeholder="新能源车型页面访客，未申请过金融..." class="hyp-input" />
        </div>
        <div class="hyp-row">
          <span class="hyp-label">主要指标</span>
          <input v-model="data.primaryMetric" placeholder="金融申请转化率" class="hyp-input" />
        </div>
        <div class="hyp-row">
          <span class="hyp-label">次要指标</span>
          <div class="multi-input">
            <div v-for="(m, i) in data.secondaryMetrics" :key="i" class="inline-row">
              <input v-model="data.secondaryMetrics[i]" placeholder="指标名称" />
              <button class="remove-btn-xs" @click="removeMetric(i)">✕</button>
            </div>
            <button class="add-inline" @click="addMetric">＋</button>
          </div>
        </div>
        <div class="hyp-row">
          <span class="hyp-label">实验平台</span>
          <input v-model="data.platform" placeholder="例：内部AB平台、Firebase A/B Testing..." class="hyp-input" />
        </div>
      </div>

      <div class="hypothesis-preview" v-if="data.observation && data.change && data.expectedOutcome">
        <div class="preview-label">生成的假设陈述：</div>
        <div class="hypothesis-text">
          因为 <em>{{ data.observation }}</em>，我们相信 <em>{{ data.change }}</em>
          将会导致 <em>{{ data.expectedOutcome }}</em>，对 <em>{{ data.audience || '目标用户' }}</em> 而言。
        </div>
      </div>
    </div>

    <!-- Variants Tab -->
    <div v-if="activeTab === 'variants'" class="section-card">
      <div class="card-title-row">
        <span class="card-title">实验组设计</span>
        <button class="btn-sm" @click="addVariant" :disabled="data.variants.length >= 4">＋ 添加实验组</button>
      </div>

      <div class="variants-grid">
        <div v-for="(v, i) in data.variants" :key="v.id" class="variant-card" :class="{ control: i === 0 }">
          <div class="variant-header">
            <input v-model="v.name" class="variant-name" />
            <button v-if="i >= 2" class="remove-btn" @click="removeVariant(i)">✕</button>
          </div>
          <textarea v-model="v.description" rows="3" placeholder="描述这个变体的特征..." class="variant-desc"></textarea>
          <div class="traffic-row">
            <label>流量占比</label>
            <input v-model.number="v.trafficPercent" type="number" min="0" max="100" class="traffic-input" />
            <span>%</span>
          </div>
          <div class="changes-section">
            <div class="changes-label">具体改动</div>
            <div v-for="(c, ci) in v.changes" :key="ci" class="change-row">
              <input v-model="v.changes[ci]" placeholder="描述具体改动..." />
              <button class="remove-btn-xs" @click="removeChange(v, ci)">✕</button>
            </div>
            <button class="add-inline" @click="addChange(v)">＋ 添加改动</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Calculator Tab -->
    <div v-if="activeTab === 'calculator'" class="section-card">
      <div class="card-title">样本量计算器</div>
      <div class="calc-grid">
        <div class="calc-field">
          <label>基线转化率 (%)</label>
          <input v-model.number="data.baselineRate" type="number" min="0.1" max="100" step="0.1" />
          <span class="calc-hint">当前的转化率</span>
        </div>
        <div class="calc-field">
          <label>最小可检测效果 (MDE, %)</label>
          <input v-model.number="data.mde" type="number" min="0.1" max="100" step="0.1" />
          <span class="calc-hint">期望提升的最小变化量</span>
        </div>
        <div class="calc-field">
          <label>置信水平</label>
          <select v-model.number="data.confidence">
            <option :value="0.9">90%</option>
            <option :value="0.95">95% (推荐)</option>
            <option :value="0.99">99%</option>
          </select>
        </div>
        <div class="calc-field">
          <label>统计功效</label>
          <select v-model.number="data.power">
            <option :value="0.8">80% (推荐)</option>
            <option :value="0.9">90%</option>
          </select>
        </div>
        <div class="calc-field">
          <label>每日可用流量</label>
          <input v-model.number="data.dailyTraffic" type="number" min="1" />
          <span class="calc-hint">参与实验的每日用户数</span>
        </div>
      </div>

      <div class="calc-results">
        <div class="result-card highlight">
          <div class="result-num">{{ data.sampleSizeRequired.toLocaleString() }}</div>
          <div class="result-label">每组所需样本量</div>
        </div>
        <div class="result-card">
          <div class="result-num">{{ data.estimatedDays }}</div>
          <div class="result-label">预计实验天数</div>
        </div>
        <div class="result-card">
          <div class="result-num">{{ (data.baselineRate + data.mde).toFixed(1) }}%</div>
          <div class="result-label">目标转化率</div>
        </div>
        <div class="result-card">
          <div class="result-num">{{ data.variants.length }}</div>
          <div class="result-label">实验组数量</div>
        </div>
      </div>
    </div>

    <!-- Checklist Tab -->
    <div v-if="activeTab === 'checklist'" class="section-card">
      <div class="card-title">上线前检查清单</div>
      <div class="checklist">
        <label v-for="(item, i) in data.checklist" :key="i" class="check-item">
          <input type="checkbox" v-model="item.checked" />
          <span>{{ item.text }}</span>
        </label>
      </div>
    </div>
  </div>
</template>

<style scoped>
.module-page { padding: 28px 24px; display: flex; flex-direction: column; gap: 16px; }
.module-header { display: flex; align-items: flex-start; justify-content: space-between; }
.module-title { font-size: 22px; font-weight: 700; color: var(--color-text-heading); letter-spacing: -0.5px; }
.module-desc { color: var(--color-text-muted); font-size: 14px; margin-top: 4px; }
.btn-complete { padding: 7px 16px; background: var(--color-accent); color: white; border: none; border-radius: var(--radius-sm); font-size: 13px; cursor: pointer; }
.badge-completed { font-size: 13px; color: var(--color-success); background: var(--color-success-muted); border: 1px solid rgba(74,222,128,0.3); padding: 5px 12px; border-radius: 20px; }

.tab-bar { display: flex; gap: 2px; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 4px; width: fit-content; }
.tab { padding: 6px 16px; background: none; border: none; border-radius: var(--radius-sm); font-size: 13px; color: var(--color-text-muted); cursor: pointer; transition: 0.15s; }
.tab.active { background: var(--color-surface-2); color: var(--color-text); font-weight: 500; }

.section-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 18px 20px; display: flex; flex-direction: column; gap: 12px; }
.card-title { font-size: 14px; font-weight: 600; color: var(--color-text-heading); }
.card-title-row { display: flex; align-items: center; justify-content: space-between; }
.btn-ai-section { padding: 6px 14px; background: var(--color-accent-muted); border: 1px solid rgba(108,138,255,0.3); border-radius: var(--radius-sm); font-size: 12px; cursor: pointer; color: var(--color-accent); }
.btn-ai-section:hover { background: var(--color-accent); color: white; }
.btn-ai-section:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-sm { padding: 5px 12px; background: var(--color-surface-2); border: 1px solid var(--color-border); border-radius: var(--radius-sm); font-size: 12px; cursor: pointer; color: var(--color-text); }

.hypothesis-builder { display: flex; flex-direction: column; gap: 10px; }
.hyp-row { display: flex; align-items: center; gap: 12px; }
.hyp-label { width: 160px; flex-shrink: 0; font-size: 13px; color: var(--color-text-muted); text-align: right; }
.hyp-input { flex: 1; padding: 8px 12px; font-size: 13px; }
.multi-input { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.inline-row { display: flex; gap: 4px; align-items: center; }
.inline-row input { flex: 1; padding: 5px 8px; font-size: 13px; }
.remove-btn-xs { background: none; border: none; cursor: pointer; color: var(--color-text-muted); font-size: 12px; }
.add-inline { background: none; border: none; cursor: pointer; color: var(--color-text-muted); font-size: 18px; padding: 2px; }
.add-inline:hover { color: var(--color-accent); }

.hypothesis-preview { background: var(--color-accent-muted); border: 1px solid rgba(108,138,255,0.3); border-radius: var(--radius-sm); padding: 14px 16px; }
.preview-label { font-size: 11px; font-weight: 600; color: var(--color-accent); letter-spacing: 0.5px; margin-bottom: 6px; }
.hypothesis-text { font-size: 14px; color: var(--color-text); line-height: 1.7; }
.hypothesis-text em { color: var(--color-accent); font-style: normal; font-weight: 500; }

.variants-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; }
.variant-card { background: var(--color-surface-2); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 14px; display: flex; flex-direction: column; gap: 10px; }
.variant-card.control { border-color: rgba(74,222,128,0.4); }
.variant-header { display: flex; align-items: center; gap: 6px; }
.variant-name { flex: 1; padding: 5px 10px; font-size: 13px; font-weight: 600; }
.remove-btn { background: none; border: none; cursor: pointer; color: var(--color-text-muted); font-size: 14px; }
.variant-desc { width: 100%; padding: 8px 10px; resize: vertical; font-size: 13px; }
.traffic-row { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--color-text-muted); }
.traffic-input { width: 70px; padding: 5px 8px; font-size: 13px; }
.changes-section { display: flex; flex-direction: column; gap: 6px; }
.changes-label { font-size: 11px; font-weight: 600; color: var(--color-text-muted); letter-spacing: 0.5px; }
.change-row { display: flex; gap: 4px; align-items: center; }
.change-row input { flex: 1; padding: 5px 8px; font-size: 12px; }

.calc-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; }
.calc-field { display: flex; flex-direction: column; gap: 4px; }
.calc-field label { font-size: 12px; font-weight: 500; color: var(--color-text-muted); }
.calc-field input, .calc-field select { padding: 8px 10px; font-size: 13px; background: var(--color-surface-2); border: 1px solid var(--color-border); border-radius: var(--radius-sm); color: var(--color-text); }
.calc-hint { font-size: 11px; color: var(--color-text-muted); }

.calc-results { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.result-card { background: var(--color-surface-2); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 16px; text-align: center; }
.result-card.highlight { border-color: rgba(108,138,255,0.4); background: var(--color-accent-muted); }
.result-num { font-size: 28px; font-weight: 700; color: var(--color-text-heading); }
.result-card.highlight .result-num { color: var(--color-accent); }
.result-label { font-size: 12px; color: var(--color-text-muted); margin-top: 4px; }

.checklist { display: flex; flex-direction: column; gap: 10px; }
.check-item { display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: var(--color-surface-2); border: 1px solid var(--color-border); border-radius: var(--radius-sm); cursor: pointer; font-size: 14px; }
.check-item:has(input:checked) { text-decoration: line-through; color: var(--color-text-muted); border-color: var(--color-success); background: var(--color-success-muted); }
</style>
