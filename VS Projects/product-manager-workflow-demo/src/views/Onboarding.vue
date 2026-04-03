<template>
  <div class="onboarding">
    <div class="container">
      <div class="content-layout">
        <aside class="sidebar">
          <WorkflowNavbar />
        </aside>

        <main class="main-content">
          <div class="page-header">
            <h1>新用户激活优化</h1>
            <p class="subtitle">设计完整的新用户激活策略，提升用户留存率</p>
          </div>

          <div class="card">
            <h2>激活漏斗分析</h2>
            <div class="funnel-analysis">
              <div class="funnel-steps">
                <div v-for="(step, index) in onboarding.funnelSteps" :key="step.id" class="funnel-step">
                  <div class="step-content">
                    <div class="step-number">{{ index + 1 }}</div>
                    <div class="step-info">
                      <h3>{{ step.name }}</h3>
                      <div class="step-metrics">
                        <span class="user-count">{{ step.users }} 用户</span>
                        <span class="conversion-rate">{{ step.conversion }}</span>
                      </div>
                    </div>
                    <div class="step-indicator">
                      <span :class="step.improvement ? 'improvement' : 'drop'">
                        {{ step.improvement ? '+15%' : '-8%' }}
                      </span>
                    </div>
                  </div>
                  <div class="step-bar" :style="{ width: `${(100 - index * 15)}%` }">
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="card mt-lg">
            <h2>Aha 时刻识别</h2>
            <div class="aha-moments">
              <div v-for="moment in onboarding.ahaMoments" :key="moment.id" class="moment-card">
                <div class="moment-icon">{{ moment.icon }}</div>
                <div class="moment-content">
                  <h3>{{ moment.title }}</h3>
                  <p>{{ moment.description }}</p>
                  <div class="moment-metrics">
                    <span class="metric-item">
                      <strong>{{ moment.timeToAha }}</strong> 分钟
                    </span>
                    <span class="metric-item">
                      留存提升: <strong>{{ moment.retentionLift }}</strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="card mt-lg">
            <h2>触达策略设计</h2>
            <div class="touchpoints">
              <div v-for="touchpoint in onboarding.touchpoints" :key="touchpoint.id" class="touchpoint-card">
                <div class="touchpoint-timing">
                  <span class="timing-label">{{ touchpoint.timing }}</span>
                </div>
                <div class="touchpoint-content">
                  <h3>{{ touchpoint.title }}</h3>
                  <p>{{ touchpoint.description }}</p>
                  <div class="touchpoint-channels">
                    <span v-for="channel in touchpoint.channels" :key="channel" class="channel-tag">
                      {{ channel }}
                    </span>
                  </div>
                </div>
                <div class="touchpoint-goal">
                  <span class="goal-label">目标: {{ touchpoint.goal }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="card mt-lg">
            <h2>实验计划</h2>
            <div class="experiment-plans">
              <div v-for="exp in onboarding.experiments" :key="exp.id" class="experiment-plan">
                <h3>{{ exp.title }}</h3>
                <p class="exp-description">{{ exp.description }}</p>
                <div class="exp-details">
                  <div class="exp-detail">
                    <label>假设:</label>
                    <span>{{ exp.hypothesis }}</span>
                  </div>
                  <div class="exp-detail">
                    <label>主要指标:</label>
                    <span>{{ exp.primaryMetric }}</span>
                  </div>
                  <div class="exp-detail">
                    <label>预估效果:</label>
                    <span class="positive">{{ exp.expectedLift }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="action-buttons">
            <button class="btn btn-secondary" @click="regenerateOnboarding">
              重新设计策略
            </button>
            <button class="btn btn-primary" @click="completeWorkflow">
              完成工作流，查看成果
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

const onboarding = ref({
  funnelSteps: [
    { id: 1, name: '访问产品页面', users: '10,000', conversion: '100%', improvement: false },
    { id: 2, name: '浏览产品列表', users: '7,500', conversion: '75%', improvement: true },
    { id: 3, name: '查看产品详情', users: '5,000', conversion: '67%', improvement: false },
    { id: 4, name: '使用计算器', users: '3,500', conversion: '70%', improvement: true },
    { id: 5, name: '提交申请', users: '1,800', conversion: '51%', improvement: false }
  ],
  ahaMoments: [
    {
      id: 1,
      icon: '🔢',
      title: '首次完成金融计算',
      description: '用户首次成功使用计算器计算出月供金额',
      timeToAha: '3',
      retentionLift: '+25%'
    },
    {
      id: 2,
      icon: '🎯',
      title: '找到适合的产品',
      description: '用户筛选并找到最适合的金融产品',
      timeToAha: '8',
      retentionLift: '+20%'
    },
    {
      id: 3,
      icon: '📋',
      title: '完成申请信息填写',
      description: '用户成功填写完产品申请表单',
      timeToAha: '15',
      retentionLift: '+40%'
    }
  ],
  touchpoints: [
    {
      id: 1,
      timing: '即时',
      title: '欢迎体验',
      description: '向用户介绍产品核心价值和使用方法',
      channels: ['站内消息', '弹窗引导'],
      goal: '引导完成首次计算'
    },
    {
      id: 2,
      timing: '24小时',
      title: '使用提醒',
      description: '提醒未完成计算的用户继续使用产品',
      channels: ['邮件', '短信'],
      goal: '召回未激活用户'
    },
    {
      id: 3,
      timing: '72小时',
      title: '产品推荐',
      description: '基于用户偏好推荐最适合的金融产品',
      channels: ['邮件', '站内消息'],
      goal: '促进产品申请'
    },
    {
      id: 4,
      timing: '7天',
      title: '回访关怀',
      description: '收集用户反馈并提供进一步帮助',
      channels: ['邮件', '电话（可选）'],
      goal: '提升用户满意度'
    }
  ],
  experiments: [
    {
      id: 1,
      title: '引导流程优化',
      description: '测试两种不同的用户引导流程',
      hypothesis: '简化引导流程将提升完成率',
      primaryMetric: '引导完成率',
      expectedLift: '+18%'
    },
    {
      id: 2,
      title: '计算器突出',
      description: '在页面更显眼的位置展示计算器功能',
      hypothesis: '更明显的位置将增加使用率',
      primaryMetric: '计算器使用次数',
      expectedLift: '+25%'
    },
    {
      id: 3,
      title: '个性化推荐',
      description: '基于用户行为推荐产品',
      hypothesis: '个性化推荐将提升转化率',
      primaryMetric: '产品申请率',
      expectedLift: '+15%'
    }
  ]
})

onMounted(() => {
  const existingOutput = store.outputs[WORKFLOW_STAGES.ONBOARDING]
  if (existingOutput) {
    onboarding.value = existingOutput
  }
})

function regenerateOnboarding() {
  alert('激活策略已重新设计')
}

function completeWorkflow() {
  store.setStageOutput(WORKFLOW_STAGES.ONBOARDING, onboarding.value)
  if (store.goToNextStage()) {
    router.push('/summary')
  }
}
</script>

<style scoped>
.onboarding {
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

.funnel-analysis {
  margin-bottom: var(--spacing-xl);
}

.funnel-steps {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.funnel-step {
  margin-bottom: var(--spacing-md);
}

.step-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  background: var(--background-color);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
}

.step-number {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  flex-shrink: 0;
}

.step-info {
  flex: 1;
}

.step-info h3 {
  margin: 0;
  font-size: var(--font-base);
  color: var(--text-primary);
}

.step-metrics {
  display: flex;
  gap: var(--spacing-md);
  margin-top: var(--spacing-xs);
}

.user-count {
  font-size: var(--font-sm);
  color: var(--text-secondary);
}

.conversion-rate {
  font-size: var(--font-sm);
  font-weight: 600;
  color: var(--primary-color);
}

.step-indicator {
  font-weight: 600;
}

.improvement {
  color: var(--secondary-color);
}

.drop {
  color: var(--danger-color);
}

.step-bar {
  height: 8px;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  border-radius: 0 0 var(--radius-sm) var(--radius-sm);
  margin-top: var(--spacing-xs);
  opacity: 0.6;
}

.aha-moments {
  display: grid;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
}

.moment-card {
  display: flex;
  gap: var(--spacing-md);
  background: var(--background-color);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
}

.moment-icon {
  font-size: var(--font-2xl);
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary-light);
  border-radius: var(--radius-lg);
  flex-shrink: 0;
}

.moment-content {
  flex: 1;
}

.moment-content h3 {
  margin: 0 0 var(--spacing-sm);
  color: var(--text-primary);
}

.moment-content p {
  margin: 0 0 var(--spacing-md);
  color: var(--text-secondary);
  font-size: var(--font-sm);
}

.moment-metrics {
  display: flex;
  gap: var(--spacing-lg);
}

.metric-item {
  font-size: var(--font-sm);
  color: var(--text-secondary);
}

.metric-item strong {
  color: var(--primary-color);
  font-weight: 600;
}

.touchpoints {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
}

.touchpoint-card {
  display: flex;
  gap: var(--spacing-md);
  background: var(--background-color);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
}

.touchpoint-timing {
  width: 80px;
  flex-shrink: 0;
}

.timing-label {
  background: var(--warning-light);
  color: var(--warning-color);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: var(--font-xs);
  font-weight: 600;
}

.touchpoint-content {
  flex: 1;
}

.touchpoint-content h3 {
  margin: 0 0 var(--spacing-sm);
  color: var(--text-primary);
}

.touchpoint-content p {
  margin: 0 0 var(--spacing-md);
  color: var(--text-secondary);
  font-size: var(--font-sm);
}

.touchpoint-channels {
  display: flex;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
}

.channel-tag {
  background: var(--card-background);
  color: var(--primary-color);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: var(--font-xs);
  font-weight: 500;
}

.touchpoint-goal {
  width: 150px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.goal-label {
  font-size: var(--font-sm);
  color: var(--text-secondary);
}

.experiment-plans {
  display: grid;
  gap: var(--spacing-md);
}

.experiment-plan {
  background: var(--background-color);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
}

.experiment-plan h3 {
  margin: 0 0 var(--spacing-sm);
  color: var(--text-primary);
}

.exp-description {
  color: var(--text-secondary);
  font-size: var(--font-sm);
  margin-bottom: var(--spacing-md);
}

.exp-details {
  display: grid;
  gap: var(--spacing-sm);
}

.exp-detail {
  display: flex;
  gap: var(--spacing-sm);
  font-size: var(--font-sm);
}

.exp-detail label {
  color: var(--text-secondary);
  font-weight: 500;
  min-width: 80px;
}

.positive {
  color: var(--secondary-color);
  font-weight: 600;
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
  .moment-card,
  .touchpoint-card {
    flex-direction: column;
  }

  .moment-icon {
    width: 100%;
  }

  .touchpoint-timing,
  .touchpoint-goal {
    width: 100%;
  }
}
</style>
