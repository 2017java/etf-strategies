<template>
  <div class="summary">
    <div class="container">
      <div class="content-layout">
        <aside class="sidebar">
          <WorkflowNavbar />
        </aside>

        <main class="main-content">
          <div class="page-header">
            <h1>成果概览</h1>
            <p class="subtitle">产品经理工作流完整成果展示</p>
          </div>

          <div class="completion-card card">
            <div class="completion-header">
              <div class="completion-icon">✅</div>
              <h2>工作流已完成！</h2>
            </div>
            <p class="completion-message">
              恭喜您成功完成了产品经理工作流！我们已经帮助您将模糊的需求转化为可执行的产品方案。
            </p>
            <div class="completion-stats">
              <div class="stat-card">
                <div class="stat-value">{{ completionStats.tasksCompleted }}</div>
                <div class="stat-label">任务完成</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">{{ completionStats.stagesCompleted }}</div>
                <div class="stat-label">阶段完成</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">{{ completionStats.documentsGenerated }}</div>
                <div class="stat-label">文档生成</div>
              </div>
            </div>
          </div>

          <div class="card mt-lg">
            <h2>成果文档</h2>
            <div class="documents-grid">
              <div v-for="doc in generatedDocuments" :key="doc.id" class="document-card">
                <div class="document-icon">{{ doc.icon }}</div>
                <div class="document-content">
                  <h3>{{ doc.name }}</h3>
                  <p>{{ doc.description }}</p>
                  <div class="document-actions">
                    <button class="btn btn-primary" @click="viewDocument(doc)">
                      {{ doc.actions.view }}
                    </button>
                    <button class="btn btn-secondary" @click="downloadDocument(doc)">
                      {{ doc.actions.download }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="card mt-lg">
            <h2>待办事项</h2>
            <div class="todo-list">
              <div v-for="(todo, index) in todos" :key="todo.id" class="todo-item">
                <div class="todo-checkbox">
                  <div class="checkbox-indicator" :class="{ checked: todo.completed }"></div>
                </div>
                <div class="todo-content">
                  <h4>{{ todo.title }}</h4>
                  <p>{{ todo.description }}</p>
                  <div class="todo-meta">
                    <span class="todo-stage">{{ todo.stage }}</span>
                    <span class="todo-priority" :class="todo.priority">
                      {{ todo.priority }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="card mt-lg">
            <h2>下一步建议</h2>
            <div class="next-steps">
              <div v-for="step in nextSteps" :key="step.id" class="next-step">
                <div class="step-number">{{ step.id }}</div>
                <div class="step-content">
                  <h3>{{ step.title }}</h3>
                  <p>{{ step.description }}</p>
                  <div class="step-links">
                    <span v-for="link in step.links" :key="link.text" class="step-link">
                      <a href="#" @click.prevent="handleStepClick(link)">{{ link.text }}</a>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="action-buttons">
            <button class="btn btn-secondary" @click="resetWorkflow">
              重新开始工作流
            </button>
            <button class="btn btn-primary" @click="downloadAll">
              下载所有文档
            </button>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useWorkflowStore, WORKFLOW_STAGES } from '../store/workflow'
import WorkflowNavbar from '../components/WorkflowNavbar.vue'

const router = useRouter()
const store = useWorkflowStore()

const completionStats = ref({
  tasksCompleted: 12,
  stagesCompleted: 6,
  documentsGenerated: 5
})

const generatedDocuments = ref([
  {
    id: 1,
    name: '产品方案设计',
    icon: '💡',
    description: '包含架构设计、功能边界和方案对比的详细产品设计文档',
    actions: {
      view: '查看',
      download: '下载 PDF'
    }
  },
  {
    id: 2,
    name: '产品需求文档 (PRD)',
    icon: '📋',
    description: '包含用户故事、验收标准和成功指标的专业 PRD',
    actions: {
      view: '查看',
      download: '下载 PRD'
    }
  },
  {
    id: 3,
    name: '实施计划清单',
    icon: '📝',
    description: '可执行的任务清单，包含里程碑和负责人信息',
    actions: {
      view: '查看',
      download: '下载 Excel'
    }
  },
  {
    id: 4,
    name: 'A/B 实验方案',
    icon: '🧪',
    description: '科学的实验设计文档，包含样本量计算和指标体系',
    actions: {
      view: '查看',
      download: '下载方案'
    }
  },
  {
    id: 5,
    name: '数据埋点设计',
    icon: '📊',
    description: '用户行为追踪方案，包含事件规范和数据分析计划',
    actions: {
      view: '查看',
      download: '下载 JSON'
    }
  }
])

const todos = ref([
  {
    id: 1,
    title: '方案评审准备',
    description: '准备产品方案的内部评审材料',
    stage: 'PRD 撰写',
    priority: 'high',
    completed: false
  },
  {
    id: 2,
    title: '实施任务分配',
    description: '将任务分配给对应的开发团队',
    stage: '计划拆分',
    priority: 'high',
    completed: false
  },
  {
    id: 3,
    title: '实验平台配置',
    description: '在实验平台配置 A/B 实验',
    stage: 'A/B 实验',
    priority: 'medium',
    completed: false
  },
  {
    id: 4,
    title: '开发团队对齐',
    description: '与开发团队对齐 PRD 和实施计划',
    stage: '计划拆分',
    priority: 'high',
    completed: false
  },
  {
    id: 5,
    title: '验收标准确认',
    description: '与测试团队确认验收标准',
    stage: 'PRD 撰写',
    priority: 'medium',
    completed: false
  }
])

const nextSteps = ref([
  {
    id: 1,
    title: '方案评审',
    description: '将产品方案提交内部评审，收集反馈和建议',
    links: [
      { text: '查看方案文档', action: 'open-document' },
      { text: '创建评审会议', action: 'create-meeting' },
      { text: '准备演示材料', action: 'prepare-demo' }
    ]
  },
  {
    id: 2,
    title: '开发启动',
    description: '启动开发工作，分配任务并跟踪进度',
    links: [
      { text: '查看任务清单', action: 'view-tasks' },
      { text: '创建项目板', action: 'create-board' },
      { text: '分配任务', action: 'assign-tasks' }
    ]
  },
  {
    id: 3,
    title: '实验准备',
    description: '配置实验平台，准备用户流量和数据追踪',
    links: [
      { text: '查看实验方案', action: 'view-experiment' },
      { text: '配置跟踪代码', action: 'configure-tracking' },
      { text: '测试实验流程', action: 'test-flow' }
    ]
  },
  {
    id: 4,
    title: '产品上线',
    description: '准备产品上线，包括发布检查和用户通知',
    links: [
      { text: '上线前检查', action: 'pre-launch-check' },
      { text: '发布计划', action: 'release-plan' },
      { text: '用户通知', action: 'user-notification' }
    ]
  }
])

function viewDocument(doc) {
  alert(`正在预览 ${doc.name}...`)
}

function downloadDocument(doc) {
  alert(`正在下载 ${doc.name}...`)
}

function downloadAll() {
  alert('正在下载所有文档...')
}

function resetWorkflow() {
  if (confirm('确定要重新开始工作流吗？所有已完成的任务和文档将被重置。')) {
    store.resetWorkflow()
    router.push('/')
  }
}

function handleStepClick(link) {
  alert(`执行操作: ${link.action}`)
}
</script>

<style scoped>
.summary {
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

.completion-card {
  background: linear-gradient(135deg, var(--secondary-color), var(--secondary-dark));
  color: white;
  border: none;
}

.completion-header {
  text-align: center;
  margin-bottom: var(--spacing-lg);
}

.completion-icon {
  font-size: 48px;
  margin-bottom: var(--spacing-md);
}

.completion-header h2 {
  font-size: var(--font-2xl);
  margin: 0;
}

.completion-message {
  text-align: center;
  margin-bottom: var(--spacing-lg);
  font-size: var(--font-lg);
  opacity: 0.9;
}

.completion-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--spacing-md);
}

.stat-card {
  background: rgba(255, 255, 255, 0.1);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
  text-align: center;
}

.stat-value {
  font-size: var(--font-2xl);
  font-weight: 700;
  margin-bottom: var(--spacing-xs);
}

.stat-label {
  font-size: var(--font-sm);
  opacity: 0.8;
}

.documents-grid {
  display: grid;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
}

.document-card {
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  display: flex;
  gap: var(--spacing-md);
  transition: all var(--transition-fast);
}

.document-card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--primary-color);
}

.document-icon {
  width: 60px;
  height: 60px;
  background: var(--primary-light);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-2xl);
  flex-shrink: 0;
}

.document-content {
  flex: 1;
}

.document-content h3 {
  margin: 0 0 var(--spacing-sm);
  color: var(--text-primary);
}

.document-content p {
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-md);
  font-size: var(--font-sm);
}

.document-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.document-actions .btn {
  font-size: var(--font-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
}

.todo-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xl);
}

.todo-item {
  display: flex;
  gap: var(--spacing-md);
  background: var(--background-color);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
}

.todo-checkbox {
  width: 24px;
  height: 24px;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-sm);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.checkbox-indicator {
  width: 16px;
  height: 16px;
  border-radius: 2px;
  background: transparent;
  transition: all var(--transition-fast);
}

.checkbox-indicator.checked {
  background: var(--secondary-color);
}

.todo-content {
  flex: 1;
}

.todo-content h4 {
  margin: 0 0 var(--spacing-xs);
  color: var(--text-primary);
}

.todo-content p {
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-md);
  font-size: var(--font-sm);
}

.todo-meta {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.todo-stage {
  background: var(--card-background);
  color: var(--primary-color);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: var(--font-xs);
  font-weight: 500;
}

.todo-priority {
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: var(--font-xs);
  font-weight: 500;
}

.todo-priority.high {
  background: var(--danger-light);
  color: var(--danger-color);
}

.todo-priority.medium {
  background: var(--warning-light);
  color: var(--warning-color);
}

.next-steps {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.next-step {
  display: flex;
  gap: var(--spacing-md);
  background: var(--background-color);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
}

.step-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  flex-shrink: 0;
}

.step-content h3 {
  margin: 0 0 var(--spacing-sm);
  color: var(--text-primary);
}

.step-content p {
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-md);
  font-size: var(--font-sm);
}

.step-links {
  display: flex;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.step-link a {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 500;
  transition: color var(--transition-fast);
}

.step-link a:hover {
  color: var(--primary-dark);
  text-decoration: underline;
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
  .document-card {
    flex-direction: column;
  }

  .document-icon {
    width: 100%;
  }

  .document-actions {
    flex-direction: column;
  }

  .document-actions .btn {
    width: 100%;
  }

  .next-step {
    flex-direction: column;
  }

  .step-links {
    flex-direction: column;
  }

  .step-link {
    margin-bottom: var(--spacing-xs);
  }
}
</style>
