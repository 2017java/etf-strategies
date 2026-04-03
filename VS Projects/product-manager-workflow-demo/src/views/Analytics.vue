<template>
  <div class="analytics">
    <div class="container">
      <div class="content-layout">
        <aside class="sidebar">
          <WorkflowNavbar />
        </aside>

        <main class="main-content">
          <div class="page-header">
            <h1>数据埋点设计</h1>
            <p class="subtitle">设计用户行为追踪方案，建立数据驱动的决策基础</p>
          </div>

          <div class="card">
            <h2>追踪计划概览</h2>
            <div class="tracking-overview">
              <div class="overview-stats">
                <div class="stat-card">
                  <div class="stat-value">{{ analytics.totalEvents }}</div>
                  <div class="stat-label">埋点事件</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">{{ analytics.totalProperties }}</div>
                  <div class="stat-label">属性</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">{{ analytics.trackedPages }}</div>
                  <div class="stat-label">页面</div>
                </div>
              </div>
            </div>
          </div>

          <div class="card mt-lg">
            <h2>用户旅程追踪</h2>
            <div class="user-journey">
              <div v-for="step in analytics.journeySteps" :key="step.id" class="journey-step">
                <div class="step-number">{{ step.id }}</div>
                <div class="step-content">
                  <h3>{{ step.name }}</h3>
                  <p class="step-description">{{ step.description }}</p>
                  <div class="step-events">
                    <h4>追踪事件：</h4>
                    <div class="event-list">
                      <span v-for="event in step.events" :key="event" class="event-tag">
                        {{ event }}
                      </span>
                    </div>
                  </div>
                </div>
                <div v-if="step.id < analytics.journeySteps.length" class="step-arrow">→</div>
              </div>
            </div>
          </div>

          <div class="card mt-lg">
            <h2>事件规范详情</h2>
            <div class="event-details">
              <div v-for="event in analytics.events" :key="event.id" class="event-detail">
                <div class="event-header">
                  <h3>{{ event.name }}</h3>
                  <span class="event-category">{{ event.category }}</span>
                </div>
                <p class="event-description">{{ event.description }}</p>
                <div class="event-properties">
                  <h4>事件属性</h4>
                  <div class="property-table">
                    <div class="property-row" v-for="prop in event.properties" :key="prop.name">
                      <span class="property-name">{{ prop.name }}</span>
                      <span class="property-type">{{ prop.type }}</span>
                      <span class="property-description">{{ prop.description }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="card mt-lg">
            <h2>数据报告模板</h2>
            <div class="report-templates">
              <div class="report-card" v-for="report in analytics.reports" :key="report.id">
                <h4>{{ report.name }}</h4>
                <p class="report-description">{{ report.description }}</p>
                <div class="report-metrics">
                  <span v-for="metric in report.metrics" :key="metric" class="metric-tag">
                    {{ metric }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="action-buttons">
            <button class="btn btn-secondary" @click="regenerateAnalytics">
              重新设计埋点
            </button>
            <button class="btn btn-primary" @click="confirmAnalytics">
              确认方案，进入新用户激活优化
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

const analytics = ref({
  totalEvents: 12,
  totalProperties: 45,
  trackedPages: 6,
  journeySteps: [
    {
      id: 1,
      name: '产品列表访问',
      description: '用户访问金融产品列表页面',
      events: ['page_view', 'product_list_view']
    },
    {
      id: 2,
      name: '产品详情查看',
      description: '用户点击查看特定金融产品',
      events: ['product_detail_view', 'time_spent_on_page']
    },
    {
      id: 3,
      name: '计算器使用',
      description: '用户使用金融计算工具',
      events: ['calculator_open', 'calculation_performed', 'calculator_close']
    },
    {
      id: 4,
      name: '产品对比',
      description: '用户比较不同金融产品',
      events: ['comparison_start', 'product_added', 'product_removed', 'comparison_end']
    },
    {
      id: 5,
      name: '申请转化',
      description: '用户提交金融产品申请',
      events: ['application_start', 'form_step_complete', 'application_submit']
    }
  ],
  events: [
    {
      id: 'e1',
      name: 'product_detail_view',
      category: '浏览行为',
      description: '用户查看金融产品详情',
      properties: [
        { name: 'product_id', type: 'string', description: '产品ID' },
        { name: 'product_type', type: 'string', description: '产品类型' },
        { name: 'user_segment', type: 'string', description: '用户分群' },
        { name: 'source_channel', type: 'string', description: '来源渠道' }
      ]
    },
    {
      id: 'e2',
      name: 'calculation_performed',
      category: '工具使用',
      description: '用户完成一次金融计算',
      properties: [
        { name: 'calculation_type', type: 'string', description: '计算类型' },
        { name: 'input_values', type: 'object', description: '输入值' },
        { name: 'result_value', type: 'number', description: '计算结果' },
        { name: 'time_taken', type: 'number', description: '耗时(秒)' }
      ]
    },
    {
      id: 'e3',
      name: 'application_start',
      category: '转化行为',
      description: '用户开始产品申请流程',
      properties: [
        { name: 'product_id', type: 'string', description: '申请的产品ID' },
        { name: 'user_type', type: 'string', description: '用户类型' },
        { name: 'entry_point', type: 'string', description: '入口位置' }
      ]
    },
    {
      id: 'e4',
      name: 'application_submit',
      category: '转化行为',
      description: '用户提交产品申请',
      properties: [
        { name: 'product_id', type: 'string', description: '申请的产品ID' },
        { name: 'form_completion_time', type: 'number', description: '表单完成时间' },
        { name: 'is_complete', type: 'boolean', description: '是否完整提交' }
      ]
    }
  ],
  reports: [
    {
      id: 'r1',
      name: '产品效果报告',
      description: '各金融产品的展示、点击、转化效果',
      metrics: ['产品详情页查看率', '计算器使用率', '申请转化率']
    },
    {
      id: 'r2',
      name: '用户行为漏斗',
      description: '从访问到申请的完整转化漏斗',
      metrics: ['访问用户数', '产品详情查看', '计算器使用', '申请提交']
    },
    {
      id: 'r3',
      name: 'A/B 实验报告',
      description: '实验结果分析和统计显著性',
      metrics: ['转化率差异', '置信度', '样本量']
    }
  ]
})

onMounted(() => {
  const existingOutput = store.outputs[WORKFLOW_STAGES.ANALYTICS]
  if (existingOutput) {
    analytics.value = existingOutput
  }
})

function regenerateAnalytics() {
  alert('埋点方案已重新设计')
}

function confirmAnalytics() {
  store.setStageOutput(WORKFLOW_STAGES.ANALYTICS, analytics.value)
  if (store.goToNextStage()) {
    router.push('/onboarding')
  }
}
</script>

<style scoped>
.analytics {
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

.tracking-overview {
  margin-bottom: var(--spacing-xl);
}

.overview-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--spacing-md);
}

.stat-card {
  background: var(--primary-light);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
  text-align: center;
}

.stat-value {
  font-size: var(--font-2xl);
  font-weight: 700;
  color: var(--primary-color);
  margin-bottom: var(--spacing-xs);
}

.stat-label {
  font-size: var(--font-sm);
  color: var(--text-secondary);
}

.user-journey {
  margin-bottom: var(--spacing-xl);
}

.journey-step {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.step-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--warning-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  flex-shrink: 0;
}

.step-content {
  flex: 1;
  background: var(--background-color);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
}

.step-content h3 {
  margin-bottom: var(--spacing-sm);
  color: var(--text-primary);
}

.step-description {
  color: var(--text-secondary);
  margin-bottom: var(--spacing-md);
  font-size: var(--font-sm);
}

.step-events h4 {
  font-size: var(--font-sm);
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
}

.event-list {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.event-tag {
  background: var(--card-background);
  color: var(--primary-color);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: var(--font-xs);
  font-weight: 500;
}

.step-arrow {
  font-size: var(--font-xl);
  color: var(--text-tertiary);
  margin: auto;
}

.event-details {
  margin-bottom: var(--spacing-xl);
}

.event-detail {
  background: var(--background-color);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-md);
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.event-header h3 {
  font-family: monospace;
  color: var(--text-primary);
  margin: 0;
}

.event-category {
  background: var(--primary-light);
  color: var(--primary-color);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: var(--font-xs);
  font-weight: 500;
}

.event-description {
  color: var(--text-secondary);
  font-size: var(--font-sm);
  margin-bottom: var(--spacing-md);
}

.event-properties h4 {
  font-size: var(--font-sm);
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
}

.property-table {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.property-row {
  display: grid;
  grid-template-columns: 1fr 1fr 2fr;
  gap: var(--spacing-sm);
  background: var(--card-background);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: var(--font-xs);
}

.property-name {
  font-family: monospace;
  color: var(--text-primary);
}

.property-type {
  color: var(--warning-color);
}

.property-description {
  color: var(--text-secondary);
}

.report-templates {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-md);
}

.report-card {
  background: var(--background-color);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
}

.report-card h4 {
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
}

.report-description {
  color: var(--text-secondary);
  font-size: var(--font-sm);
  margin-bottom: var(--spacing-md);
}

.report-metrics {
  display: flex;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
}

.metric-tag {
  background: var(--secondary-light);
  color: var(--secondary-color);
  padding: 2px var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: var(--font-xs);
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
  .journey-step {
    flex-direction: column;
  }

  .step-arrow {
    transform: rotate(90deg);
  }

  .property-row {
    grid-template-columns: 1fr;
  }

  .report-templates {
    grid-template-columns: 1fr;
  }
}
</style>
