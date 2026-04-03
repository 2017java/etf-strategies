<template>
  <div class="ab-test">
    <div class="container">
      <div class="content-layout">
        <aside class="sidebar">
          <WorkflowNavbar />
        </aside>

        <main class="main-content">
          <div class="page-header">
            <h1>A/B 实验设计</h1>
            <p class="subtitle">设计科学的实验方案来验证产品假设</p>
          </div>

          <div class="card">
            <h2>实验方案概览</h2>
            <div class="experiment-overview">
              <div class="overview-grid">
                <div class="overview-item">
                  <h3>实验名称</h3>
                  <p>{{ experiment.name }}</p>
                </div>
                <div class="overview-item">
                  <h3>实验假设</h3>
                  <p>{{ experiment.hypothesis }}</p>
                </div>
                <div class="overview-item">
                  <h3>实验目标</h3>
                  <div class="metrics-list">
                    <span v-for="metric in experiment.primaryMetrics" :key="metric" class="metric-tag">
                      {{ metric }}
                    </span>
                  </div>
                </div>
                <div class="overview-item">
                  <h3>预估周期</h3>
                  <p>{{ experiment.estimatedDuration }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="card mt-lg">
            <h2>实验变量设计</h2>
            <div class="variation-grid">
              <div class="variation-card control">
                <div class="variation-header">
                  <h3>对照组 (A)</h3>
                  <span class="control-label">原方案</span>
                </div>
                <div class="variation-content">
                  <p class="variation-description">{{ experiment.variations.control.description }}</p>
                  <div class="changes-list">
                    <span class="change-item">当前展示方式</span>
                  </div>
                </div>
                <div class="variation-preview">
                  {{ experiment.variations.control.preview }}
                </div>
              </div>

              <div class="variation-card treatment">
                <div class="variation-header">
                  <h3>实验组 (B)</h3>
                  <span class="treatment-label">新方案</span>
                </div>
                <div class="variation-content">
                  <p class="variation-description">{{ experiment.variations.treatment.description }}</p>
                  <div class="changes-list">
                    <span v-for="change in experiment.variations.treatment.changes" :key="change" class="change-item">
                      {{ change }}
                    </span>
                  </div>
                </div>
                <div class="variation-preview">
                  {{ experiment.variations.treatment.preview }}
                </div>
              </div>
            </div>
          </div>

          <div class="card mt-lg">
            <h2>样本量计算</h2>
            <div class="sample-calculation">
              <div class="sample-grid">
                <div class="sample-item">
                  <label>基准转化率</label>
                  <span class="value">{{ experiment.sampleCalculation.baselineRate }}</span>
                </div>
                <div class="sample-item">
                  <label>最小可检测效果 (MDE)</label>
                  <span class="value">{{ experiment.sampleCalculation.mde }}</span>
                </div>
                <div class="sample-item">
                  <label>置信水平</label>
                  <span class="value">{{ experiment.sampleCalculation.confidenceLevel }}</span>
                </div>
                <div class="sample-item">
                  <label>统计功效</label>
                  <span class="value">{{ experiment.sampleCalculation.power }}</span>
                </div>
                <div class="sample-item">
                  <label>每日流量</label>
                  <span class="value">{{ experiment.sampleCalculation.dailyTraffic }}</span>
                </div>
                <div class="sample-item">
                  <label>所需样本量</label>
                  <span class="value highlight">{{ experiment.sampleCalculation.requiredSample }}</span>
                </div>
                <div class="sample-item">
                  <label>预计周期</label>
                  <span class="value">{{ experiment.sampleCalculation.estimatedDays }} 天</span>
                </div>
              </div>
            </div>
          </div>

          <div class="card mt-lg">
            <h2>实验配置</h2>
            <div class="experiment-configuration">
              <div class="config-grid">
                <div class="config-item">
                  <label>流量分配</label>
                  <div class="traffic-allocation">
                    <div class="traffic-item control">
                      <span>对照组 {{ experiment.trafficAllocation.control }}%</span>
                    </div>
                    <div class="traffic-item treatment">
                      <span>实验组 {{ experiment.trafficAllocation.treatment }}%</span>
                    </div>
                  </div>
                </div>
                <div class="config-item">
                  <label>目标人群</label>
                  <div class="audience-targeting">
                    <span v-for="condition in experiment.audienceTargeting" :key="condition" class="audience-tag">
                      {{ condition }}
                    </span>
                  </div>
                </div>
                <div class="config-item">
                  <label>实验平台</label>
                  <span class="platform-name">{{ experiment.platform }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="action-buttons">
            <button class="btn btn-secondary" @click="regenerateExperiment">
              重新设计实验
            </button>
            <button class="btn btn-primary" @click="confirmExperiment">
              确认方案，进入数据埋点设计
            </button>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useWorkflowStore, WORKFLOW_STAGES } from '../store/workflow'
import WorkflowNavbar from '../components/WorkflowNavbar.vue'

const router = useRouter()
const store = useWorkflowStore()

const experiment = ref({
  name: '金融产品展示方式优化实验',
  hypothesis: '优化金融产品展示方式将提升产品详情页查看率和转化率',
  primaryMetrics: ['产品详情页查看率', '计算器使用次数', '产品申请成功率'],
  estimatedDuration: '14天',
  variations: {
    control: {
      description: '保持当前的产品展示方式',
      preview: '当前界面预览',
      changes: []
    },
    treatment: {
      description: '优化产品展示方式，突出关键信息',
      preview: '优化后界面预览',
      changes: [
        '调整产品排序算法',
        '优化价格展示方式',
        '增加产品对比功能',
        '改进计算器布局'
      ]
    }
  },
  sampleCalculation: {
    baselineRate: '3.2%',
    mde: '15%',
    confidenceLevel: '95%',
    power: '80%',
    dailyTraffic: '5,000',
    requiredSample: '28,000',
    estimatedDays: 14
  },
  trafficAllocation: {
    control: 50,
    treatment: 50
  },
  audienceTargeting: [
    '新访问用户',
    '浏览新能源车的用户',
    '搜索金融产品的用户'
  ],
  platform: 'Coze Analytics'
})

onMounted(() => {
  const existingOutput = store.outputs[WORKFLOW_STAGES.AB_TEST]
  if (existingOutput) {
    experiment.value = existingOutput
  }
})

function regenerateExperiment() {
  alert('实验方案已重新设计')
}

function confirmExperiment() {
  store.setStageOutput(WORKFLOW_STAGES.AB_TEST, experiment.value)
  if (store.goToNextStage()) {
    router.push('/analytics')
  }
}
</script>

<style scoped>
.ab-test {
  min-height: calc(100vh - 200px);
}

.content-layout {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: var(--spacing-lg);
  align-items: start;
}

.sidebar {
  position: sticky;
  top: 100px;
}

.main-content {
  max-width: 800px;
}

.page-header {
  margin-bottom: var(--spacing-xl);
}

.page-header h1 {
  font-size: var(--font-2xl);
  margin-bottom: var(--spacing-sm);
  color: var(--text-primary);
}

.subtitle {
  color: var(--text-secondary);
  margin: 0;
  font-size: var(--font-base);
}

.experiment-overview {
  margin-bottom: var(--spacing-xl);
}

.overview-grid {
  display: grid;
  gap: var(--spacing-lg);
}

.overview-item {
  background: var(--background-color);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
}

.overview-item h3 {
  margin-bottom: var(--spacing-sm);
  font-size: var(--font-base);
  color: var(--text-primary);
}

.overview-item p {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.6;
}

.metrics-list {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.metric-tag {
  background: var(--primary-light);
  color: var(--primary-color);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: var(--font-sm);
}

.variation-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.variation-card {
  background: var(--card-background);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: all var(--transition-normal);
}

.variation-card:hover {
  box-shadow: var(--shadow-md);
}

.variation-card.control {
  border-color: var(--border-color);
}

.variation-card.treatment {
  border-color: var(--primary-color);
}

.variation-header {
  padding: var(--spacing-lg);
  background: var(--background-color);
  border-bottom: 1px solid var(--border-color);
}

.variation-header h3 {
  margin: 0;
  font-size: var(--font-lg);
  color: var(--text-primary);
}

.control-label,
.treatment-label {
  display: inline-block;
  margin-left: var(--spacing-sm);
  background: var(--border-color);
  color: var(--text-secondary);
  padding: 2px var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: var(--font-xs);
  font-weight: 500;
}

.treatment-label {
  background: var(--primary-light);
  color: var(--primary-color);
}

.variation-content {
  padding: var(--spacing-lg);
}

.variation-description {
  margin-bottom: var(--spacing-md);
  color: var(--text-secondary);
  font-size: var(--font-sm);
}

.changes-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.change-item {
  display: flex;
  align-items: center;
  font-size: var(--font-sm);
  color: var(--text-secondary);
}

.variation-preview {
  margin-top: var(--spacing-md);
  padding: var(--spacing-lg);
  background: var(--background-color);
  border-radius: var(--radius-md);
  text-align: center;
  font-size: var(--font-sm);
  color: var(--text-tertiary);
  min-height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed var(--border-color);
}

.sample-calculation {
  margin-bottom: var(--spacing-xl);
}

.sample-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-md);
}

.sample-item {
  background: var(--background-color);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
}

.sample-item label {
  display: block;
  font-size: var(--font-sm);
  color: var(--text-secondary);
  margin-bottom: var(--spacing-xs);
}

.sample-item .value {
  font-size: var(--font-base);
  font-weight: 500;
  color: var(--text-primary);
}

.sample-item .value.highlight {
  color: var(--primary-color);
  font-size: var(--font-lg);
}

.experiment-configuration {
  margin-bottom: var(--spacing-xl);
}

.config-grid {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.config-item {
  background: var(--background-color);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
}

.config-item label {
  display: block;
  font-size: var(--font-sm);
  color: var(--text-secondary);
  margin-bottom: var(--spacing-md);
  font-weight: 500;
}

.traffic-allocation {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.traffic-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.traffic-item.control {
  color: var(--text-secondary);
}

.traffic-item.treatment {
  color: var(--primary-color);
}

.audience-targeting {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.audience-tag {
  background: var(--secondary-light);
  color: var(--secondary-color);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: var(--font-sm);
}

.platform-name {
  background: var(--warning-light);
  color: var(--warning-color);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: var(--font-sm);
  font-weight: 500;
}

.action-buttons {
  display: flex;
  gap: var(--spacing-md);
  justify-content: flex-end;
}

@media (max-width: 1024px) {
  .content-layout {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: static;
  }
}

@media (max-width: 768px) {
  .variation-grid,
  .sample-grid {
    grid-template-columns: 1fr;
  }

  .traffic-allocation,
  .audience-targeting {
    flex-direction: column;
  }
}
</style>
