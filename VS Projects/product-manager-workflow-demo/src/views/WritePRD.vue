<template>
  <div class="write-prd">
    <div class="container">
      <div class="content-layout">
        <aside class="sidebar">
          <WorkflowNavbar />
        </aside>

        <main class="main-content">
          <div class="page-header">
            <h1>PRD 撰写</h1>
            <p class="subtitle">基于方案设计，生成专业的产品需求文档</p>
          </div>

          <!-- PRD 文档预览 -->
          <div class="card prd-card">
            <div class="prd-header">
              <h2>{{ prd.title }}</h2>
              <div class="prd-meta">
                <span class="meta-item">产品版本 {{ prd.version }}</span>
                <span class="meta-item">创建日期 {{ prd.date }}</span>
              </div>
            </div>

            <div class="prd-content">
              <!-- 问题背景 -->
              <section class="prd-section">
                <h3>1. 问题背景</h3>
                <p>{{ prd.problemBackground }}</p>
              </section>

              <!-- 产品愿景 -->
              <section class="prd-section">
                <h3>2. 产品愿景</h3>
                <p>{{ prd.productVision }}</p>
              </section>

              <!-- 用户故事 -->
              <section class="prd-section">
                <h3>3. 用户故事</h3>
                <div class="user-stories">
                  <div v-for="story in prd.userStories" :key="story.id" class="user-story">
                    <div class="story-number">
                      <span class="number-circle">{{ story.id }}</span>
                    </div>
                    <div class="story-content">
                      <p class="story-text">{{ story.text }}</p>
                      <div class="story-details">
                        <span class="story-acceptance">验收标准：{{ story.acceptance }}</span>
                        <span class="story-priority" :class="`priority-${story.priority}`">
                          {{ story.priority }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <!-- 功能特性 -->
              <section class="prd-section">
                <h3>4. 功能特性</h3>
                <div class="features-table">
                  <div v-for="feature in prd.features" :key="feature.id" class="feature-row">
                    <div class="feature-name">{{ feature.name }}</div>
                    <div class="feature-description">{{ feature.description }}</div>
                    <div class="feature-status">
                      <span class="status-badge" :class="feature.status">{{ feature.status }}</span>
                    </div>
                  </div>
                </div>
              </section>

              <!-- 技术架构 -->
              <section class="prd-section">
                <h3>5. 技术架构</h3>
                <div class="architecture-section">
                  <h4>系统架构图</h4>
                  <div class="architecture-diagram">{{ prd.architecture }}</div>
                </div>
              </section>

              <!-- 验收标准 -->
              <section class="prd-section">
                <h3>6. 验收标准</h3>
                <div class="acceptance-criteria">
                  <div v-for="(criteria, index) in prd.acceptanceCriteria" :key="index" class="criteria-item">
                    {{ index + 1 }}. {{ criteria }}
                  </div>
                </div>
              </section>

              <!-- 成功指标 -->
              <section class="prd-section">
                <h3>7. 成功指标</h3>
                <div class="success-metrics">
                  <div v-for="metric in prd.successMetrics" :key="metric.name" class="metric-item">
                    <span class="metric-name">{{ metric.name }}</span>
                    <span class="metric-target">{{ metric.target }}</span>
                  </div>
                </div>
              </section>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="action-buttons">
            <button class="btn btn-secondary" @click="regeneratePRD">
              重新生成 PRD
            </button>
            <button class="btn btn-primary" @click="confirmPRD">
              确认 PRD，进入计划拆分
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

const prd = ref({
  title: '新能源车销售金融方案0息产品展示优化',
  version: '1.0',
  date: new Date().toLocaleDateString(),
  problemBackground: '目前新能源车型的金融产品竞争力不足，市场份额增长缓慢。现有产品在展示方式、计算便捷性和广告策略方面存在优化空间。',
  productVision: '为用户提供更直观、更有吸引力的金融产品展示，帮助用户理解产品价值，提升新能源车型的金融产品渗透率。',
  userStories: [
    {
      id: 1,
      text: '作为潜在购车用户，我希望能看到清晰的金融产品对比，以便快速找到最适合我的方案。',
      acceptance: '用户可以比较不同产品的首付、月供、利率等信息',
      priority: 'high'
    },
    {
      id: 2,
      text: '作为销售顾问，我希望能快速生成金融方案并展示给客户，以提高销售效率。',
      acceptance: '系统支持一键生成和分享金融方案',
      priority: 'medium'
    },
    {
      id: 3,
      text: '作为产品经理，我希望能通过数据了解用户对金融产品的偏好，以便优化产品策略。',
      acceptance: '收集用户行为数据，分析产品使用情况',
      priority: 'low'
    }
  ],
  features: [
    {
      id: 'F1',
      name: '产品计算器优化',
      description: '提供更直观的计算结果展示，支持多种场景的计算模式',
      status: 'planning'
    },
    {
      id: 'F2',
      name: '产品对比功能',
      description: '允许用户比较不同金融产品的详细信息',
      status: 'planning'
    },
    {
      id: 'F3',
      name: '智能推荐系统',
      description: '基于用户信息推荐合适的金融产品',
      status: 'planning'
    },
    {
      id: 'F4',
      name: '数据分析模块',
      description: '收集用户行为数据，分析产品使用情况',
      status: 'backlog'
    }
  ],
  architecture: '金融产品展示系统架构图',
  acceptanceCriteria: [
    '用户可以在30秒内找到并计算出适合自己的金融产品',
    '产品展示页面加载时间小于2秒',
    '计算器功能支持95%的常见金融计算场景',
    '数据收集系统能覆盖80%的用户交互',
    '系统稳定性达到99.9%的 uptime'
  ],
  successMetrics: [
    { name: '产品详情页查看率', target: '提升 25%' },
    { name: '计算器使用率', target: '提升 30%' },
    { name: '产品申请转化率', target: '提升 15%' },
    { name: '用户满意度', target: '达到 4.2/5.0' }
  ]
})

onMounted(() => {
  // 检查是否已有 PRD 输出
  const existingOutput = store.outputs[WORKFLOW_STAGES.WRITE_PRD]
  if (existingOutput) {
    prd.value = existingOutput
  }
})

function regeneratePRD() {
  // 模拟重新生成 PRD 的逻辑
  console.log('重新生成 PRD')
  alert('PRD 文档已重新生成')
}

function confirmPRD() {
  store.setStageOutput(WORKFLOW_STAGES.WRITE_PRD, prd.value)
  if (store.goToNextStage()) {
    router.push('/writing-plans')
  }
}
</script>

<style scoped>
.write-prd {
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

.prd-card {
  background: var(--card-background);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  overflow: hidden;
}

.prd-header {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  color: white;
  padding: var(--spacing-xl);
}

.prd-header h2 {
  margin: 0 0 var(--spacing-md);
  font-size: var(--font-2xl);
}

.prd-meta {
  display: flex;
  gap: var(--spacing-lg);
  font-size: var(--font-sm);
  opacity: 0.9;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.prd-content {
  padding: var(--spacing-xl);
}

.prd-section {
  margin-bottom: var(--spacing-xl);
}

.prd-section h3 {
  color: var(--primary-color);
  margin-bottom: var(--spacing-md);
  font-size: var(--font-lg);
  border-bottom: 2px solid var(--primary-color);
  padding-bottom: var(--spacing-xs);
}

.prd-section p {
  color: var(--text-secondary);
  line-height: 1.6;
}

.user-stories {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.user-story {
  display: flex;
  gap: var(--spacing-md);
  background: var(--background-color);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
}

.story-number {
  flex-shrink: 0;
}

.number-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  font-size: var(--font-sm);
}

.story-content {
  flex: 1;
}

.story-text {
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
}

.story-details {
  font-size: var(--font-sm);
  display: flex;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.story-acceptance {
  color: var(--text-secondary);
}

.story-priority {
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-weight: 500;
  font-size: var(--font-xs);
}

.priority-high {
  background: var(--danger-light);
  color: var(--danger-color);
}

.priority-medium {
  background: var(--warning-light);
  color: var(--warning-color);
}

.priority-low {
  background: var(--secondary-light);
  color: var(--secondary-color);
}

.features-table {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.feature-row {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  gap: var(--spacing-sm);
  background: var(--background-color);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  font-size: var(--font-sm);
}

.feature-name {
  font-weight: 500;
  color: var(--text-primary);
}

.feature-description {
  color: var(--text-secondary);
}

.status-badge {
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: var(--font-xs);
  font-weight: 500;
  text-align: center;
}

.status-badge.planning {
  background: var(--primary-light);
  color: var(--primary-color);
}

.status-badge.development {
  background: var(--warning-light);
  color: var(--warning-color);
}

.status-badge.completed {
  background: var(--secondary-light);
  color: var(--secondary-color);
}

.status-badge.backlog {
  background: var(--border-color);
  color: var(--text-tertiary);
}

.architecture-section h4 {
  color: var(--text-primary);
  margin-bottom: var(--spacing-md);
  font-size: var(--font-base);
}

.architecture-diagram {
  background: var(--card-background);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
  text-align: center;
  min-height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed var(--border-color);
  margin-bottom: var(--spacing-sm);
  color: var(--text-tertiary);
}

.acceptance-criteria {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  background: var(--background-color);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
}

.criteria-item {
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--border-color);
  color: var(--text-secondary);
  font-size: var(--font-sm);
}

.criteria-item:last-child {
  border-bottom: none;
}

.success-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-sm);
}

.metric-item {
  background: var(--card-background);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  text-align: center;
}

.metric-name {
  display: block;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
}

.metric-target {
  display: block;
  color: var(--primary-color);
  font-weight: 600;
  font-size: var(--font-lg);
}

.action-buttons {
  display: flex;
  gap: var(--spacing-md);
  justify-content: flex-end;
  margin-top: var(--spacing-xl);
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
  .prd-header h2 {
    font-size: var(--font-lg);
  }

  .prd-meta {
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .feature-row {
    grid-template-columns: 1fr;
  }

  .metric-item {
    padding: var(--spacing-md);
  }
}
</style>
