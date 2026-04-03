<template>
  <div class="writing-plans">
    <div class="container">
      <div class="content-layout">
        <aside class="sidebar">
          <WorkflowNavbar />
        </aside>

        <main class="main-content">
          <div class="page-header">
            <h1>实施计划拆分</h1>
            <p class="subtitle">将 PRD 拆解为可执行的任务清单</p>
          </div>

          <div class="plan-card card">
            <div class="plan-header">
              <h2>金融产品展示系统优化实施计划</h2>
              <div class="plan-meta">
                <span class="meta-item">预计周期：4周</span>
                <span class="meta-item">里程碑：5个</span>
              </div>
            </div>

            <div class="plan-content">
              <div class="plan-timeline">
                <div v-for="(milestone, index) in milestones" :key="index" class="timeline-item">
                  <div class="timeline-number">{{ index + 1 }}</div>
                  <div class="timeline-content">
                    <div class="milestone-header">
                      <h3>{{ milestone.title }}</h3>
                      <span class="duration">{{ milestone.duration }}</span>
                    </div>
                    <p class="milestone-description">{{ milestone.description }}</p>
                    <div class="task-list">
                      <div v-for="(task, taskIndex) in milestone.tasks" :key="taskIndex" class="task-item">
                        <div class="task-checkbox"></div>
                        <div class="task-content">
                          <h4>{{ task.title }}</h4>
                          <p class="task-description">{{ task.description }}</p>
                          <div class="task-details">
                            <span class="assignee">负责人：{{ task.assignee }}</span>
                            <span class="estimate">预估时间：{{ task.estimate }}</span>
                            <span class="status" :class="task.status">{{ task.status }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="plan-summary">
                <h4>项目总览</h4>
                <div class="summary-stats">
                  <div class="stat-item">
                    <div class="stat-value">{{ totalTasks }}</div>
                    <div class="stat-label">总任务数</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-value">{{ totalMilestones }}</div>
                    <div class="stat-label">里程碑</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-value">{{ totalWeeks }}周</div>
                    <div class="stat-label">预计周期</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="action-buttons">
            <button class="btn btn-secondary" @click="regeneratePlan">
              重新生成计划
            </button>
            <button class="btn btn-primary" @click="confirmPlan">
              确认计划，进入 A/B 实验设计
            </button>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useWorkflowStore, WORKFLOW_STAGES } from '../store/workflow'
import WorkflowNavbar from '../components/WorkflowNavbar.vue'

const router = useRouter()
const store = useWorkflowStore()

const milestones = ref([
  {
    title: '需求分析与架构设计',
    duration: '第1周',
    description: '深入理解需求，完成技术架构设计',
    tasks: [
      {
        title: 'PRD 评审与确认',
        description: '与相关方确认 PRD 内容，澄清疑问',
        assignee: '产品经理',
        estimate: '1天',
        status: 'pending'
      },
      {
        title: '技术架构设计',
        description: '设计系统架构，选择技术栈',
        assignee: '架构师',
        estimate: '2天',
        status: 'pending'
      },
      {
        title: '接口设计',
        description: '设计 API 接口规范',
        assignee: '后端开发',
        estimate: '2天',
        status: 'pending'
      }
    ]
  },
  {
    title: '核心功能开发',
    duration: '第2周',
    description: '实现核心功能模块',
    tasks: [
      {
        title: '金融产品管理模块开发',
        description: '实现产品配置和管理功能',
        assignee: '后端开发',
        estimate: '3天',
        status: 'pending'
      },
      {
        title: '计算器组件开发',
        description: '实现金融计算功能',
        assignee: '前端开发',
        estimate: '2天',
        status: 'pending'
      },
      {
        title: '后端 API 开发',
        description: '提供产品数据接口',
        assignee: '后端开发',
        estimate: '3天',
        status: 'pending'
      }
    ]
  },
  {
    title: '产品展示与对比功能',
    duration: '第3周',
    description: '实现产品展示和对比功能',
    tasks: [
      {
        title: '产品展示页面开发',
        description: '实现产品列表和详情页',
        assignee: '前端开发',
        estimate: '3天',
        status: 'pending'
      },
      {
        title: '产品对比功能开发',
        description: '实现多产品对比功能',
        assignee: '前端开发',
        estimate: '2天',
        status: 'pending'
      },
      {
        title: '智能推荐后端开发',
        description: '实现推荐算法',
        assignee: '后端开发',
        estimate: '3天',
        status: 'pending'
      }
    ]
  },
  {
    title: '数据埋点与测试',
    duration: '第4周',
    description: '完成数据埋点和全面测试',
    tasks: [
      {
        title: '数据埋点开发',
        description: '实现用户行为追踪',
        assignee: '全栈开发',
        estimate: '2天',
        status: 'pending'
      },
      {
        title: '功能测试',
        description: '全面功能测试和回归测试',
        assignee: '测试工程师',
        estimate: '2天',
        status: 'pending'
      },
      {
        title: '性能测试',
        description: '性能测试和优化',
        assignee: '测试工程师',
        estimate: '1天',
        status: 'pending'
      },
      {
        title: '上线准备',
        description: '部署准备和文档',
        assignee: 'DevOps',
        estimate: '1天',
        status: 'pending'
      }
    ]
  }
])

onMounted(() => {
  const existingOutput = store.outputs[WORKFLOW_STAGES.WRITING_PLANS]
  if (existingOutput) {
    milestones.value = existingOutput
  }
})

const totalTasks = computed(() => {
  return milestones.value.reduce((sum, m) => sum + m.tasks.length, 0)
})

const totalMilestones = computed(() => {
  return milestones.value.length
})

const totalWeeks = computed(() => {
  return 4
})

function regeneratePlan() {
  alert('实施计划已重新生成')
}

function confirmPlan() {
  store.setStageOutput(WORKFLOW_STAGES.WRITING_PLANS, milestones.value)
  if (store.goToNextStage()) {
    router.push('/ab-test')
  }
}
</script>

<style scoped>
.writing-plans {
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

.plan-card {
  margin-bottom: var(--spacing-lg);
}

.plan-header {
  background: linear-gradient(135deg, var(--warning-color), var(--warning-dark));
  color: white;
  padding: var(--spacing-xl);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  margin: -24px -24px var(--spacing-lg);
}

.plan-header h2 {
  margin: 0 0 var(--spacing-md);
  font-size: var(--font-xl);
}

.plan-meta {
  display: flex;
  gap: var(--spacing-lg);
  font-size: var(--font-sm);
  opacity: 0.9;
}

.plan-timeline {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
  margin-bottom: var(--spacing-xl);
}

.timeline-item {
  display: flex;
  gap: var(--spacing-md);
}

.timeline-number {
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

.timeline-content {
  flex: 1;
  background: var(--background-color);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
}

.milestone-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.milestone-header h3 {
  margin: 0;
  font-size: var(--font-lg);
  color: var(--text-primary);
}

.duration {
  background: var(--warning-light);
  color: var(--warning-dark);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: var(--font-xs);
  font-weight: 500;
}

.milestone-description {
  color: var(--text-secondary);
  margin-bottom: var(--spacing-md);
  font-size: var(--font-sm);
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.task-item {
  display: flex;
  gap: var(--spacing-md);
  background: var(--card-background);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
}

.task-checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-sm);
  flex-shrink: 0;
  margin-top: 2px;
}

.task-content {
  flex: 1;
}

.task-content h4 {
  margin: 0 0 var(--spacing-xs);
  font-size: var(--font-base);
  color: var(--text-primary);
}

.task-description {
  margin: 0 0 var(--spacing-sm);
  font-size: var(--font-sm);
  color: var(--text-secondary);
}

.task-details {
  display: flex;
  gap: var(--spacing-md);
  flex-wrap: wrap;
  font-size: var(--font-xs);
}

.task-details span {
  color: var(--text-tertiary);
}

.status {
  padding: 2px var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-weight: 500;
}

.status.pending {
  background: var(--border-color);
  color: var(--text-secondary);
}

.status.in-progress {
  background: var(--primary-light);
  color: var(--primary-color);
}

.status.completed {
  background: var(--secondary-light);
  color: var(--secondary-color);
}

.plan-summary {
  background: var(--primary-light);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
  margin-top: var(--spacing-xl);
}

.plan-summary h4 {
  margin-top: 0;
  color: var(--primary-color);
  font-size: var(--font-lg);
  margin-bottom: var(--spacing-md);
}

.summary-stats {
  display: flex;
  gap: var(--spacing-lg);
  justify-content: space-around;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: var(--font-2xl);
  font-weight: 700;
  color: var(--primary-color);
}

.stat-label {
  font-size: var(--font-sm);
  color: var(--text-secondary);
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
  .milestone-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }

  .summary-stats {
    flex-direction: column;
    gap: var(--spacing-md);
  }
}
</style>
