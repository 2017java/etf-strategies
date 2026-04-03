<template>
  <div class="requirement-input">
    <div class="container">
      <div class="content-layout">
        <!-- 左侧导航 -->
        <aside class="sidebar">
          <WorkflowNavbar />
        </aside>

        <!-- 主内容区 -->
        <main class="main-content">
          <div class="page-header">
            <h1>需求输入</h1>
            <p class="subtitle">请描述您的业务需求，我们将帮助您将它转化为可执行的产品方案</p>
          </div>

          <div class="form-card card">
            <form @submit.prevent="submitRequirement">
              <!-- 业务背景 -->
              <div class="form-section">
                <label class="form-label">
                  <span class="label-text">业务背景</span>
                  <span class="label-hint">请描述您的业务场景和背景</span>
                </label>
                <textarea
                  v-model="formData.businessContext"
                  class="form-input"
                  rows="4"
                  placeholder="例如：3月市场回暖，需要强化金融权益，促进销量提升。目前新能源汽车只有5免2产品，竞争力不如竞品..."
                ></textarea>
                <div class="char-count">{{ formData.businessContext.length }}/500</div>
              </div>

              <!-- 核心问题 -->
              <div class="form-section">
                <label class="form-label">
                  <span class="label-text">核心问题</span>
                  <span class="label-hint">您希望解决的主要问题是什么？</span>
                </label>
                <textarea
                  v-model="formData.problemStatement"
                  class="form-input"
                  rows="3"
                  placeholder="例如：现有金融产品竞争力不足，无法有效促进新能源车型销量提升..."
                ></textarea>
                <div class="char-count">{{ formData.problemStatement.length }}/300</div>
              </div>

              <!-- 成功指标 -->
              <div class="form-section">
                <label class="form-label">
                  <span class="label-text">成功指标</span>
                  <span class="label-hint">您如何衡量这个需求的成功？</span>
                </label>
                <div class="metric-inputs">
                  <div v-for="(metric, index) in formData.successMetrics" :key="index" class="metric-input-row">
                    <input
                      type="text"
                      v-model="metric.name"
                      class="form-input metric-name"
                      placeholder="指标名称"
                    />
                    <input
                      type="text"
                      v-model="metric.target"
                      class="form-input metric-target"
                      placeholder="目标值"
                    />
                    <button type="button" class="btn-remove" @click="removeMetric(index)">
                      ×
                    </button>
                  </div>
                  <div class="metric-input-row">
                    <input
                      type="text"
                      v-model="newMetric.name"
                      class="form-input metric-name"
                      placeholder="指标名称"
                    />
                    <input
                      type="text"
                      v-model="newMetric.target"
                      class="form-input metric-target"
                      placeholder="目标值"
                    />
                    <button type="button" class="btn-add" @click="addMetric">
                      +
                    </button>
                  </div>
                </div>
              </div>

              <!-- 操作按钮 -->
              <div class="form-actions">
                <button type="button" class="btn btn-secondary" @click="loadExample">
                  加载示例数据
                </button>
                <button type="button" class="btn btn-secondary" @click="resetForm">
                  重置
                </button>
                <button type="submit" class="btn btn-primary" :disabled="!isFormValid">
                  开始方案设计
                </button>
              </div>
            </form>
          </div>

          <!-- 快速提示 -->
          <div class="tips-card card mt-lg">
            <h3>💡 填写提示</h3>
            <ul class="tips-list">
              <li><strong>业务背景：</strong>描述当前的业务场景、市场环境和时间背景</li>
              <li><strong>核心问题：</strong>聚焦于要解决的具体问题，不要包含解决方案</li>
              <li><strong>成功指标：</strong>使用可量化的指标，例如转化率、留存率、收入等</li>
              <li><strong>保持简洁：</strong>初期不需要提供太多细节，我们会在后续阶段逐步完善</li>
            </ul>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useWorkflowStore } from '../store/workflow'
import WorkflowNavbar from '../components/WorkflowNavbar.vue'

const router = useRouter()
const store = useWorkflowStore()

const formData = ref({
  businessContext: '',
  problemStatement: '',
  successMetrics: []
})

const newMetric = ref({
  name: '',
  target: ''
})

onMounted(() => {
  // 加载 store 中的数据
  if (store.requirement.businessContext) {
    formData.value = { ...store.requirement }
  }
})

const isFormValid = computed(() => {
  return formData.value.businessContext.length >= 20 &&
         formData.value.problemStatement.length >= 10
})

function addMetric() {
  if (newMetric.value.name && newMetric.value.target) {
    formData.value.successMetrics.push({
      name: newMetric.value.name,
      target: newMetric.value.target
    })
    newMetric.value = { name: '', target: '' }
  }
}

function removeMetric(index) {
  formData.value.successMetrics.splice(index, 1)
}

function loadExample() {
  store.loadExampleData()
  formData.value = { ...store.requirement }
}

function resetForm() {
  formData.value = {
    businessContext: '',
    problemStatement: '',
    successMetrics: []
  }
  newMetric.value = { name: '', target: '' }
}

function submitRequirement() {
  store.setRequirement(formData.value)
  router.push('/brainstorming')
}
</script>

<style scoped>
.requirement-input {
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

.form-card {
  margin-bottom: var(--spacing-lg);
}

.form-section {
  margin-bottom: var(--spacing-lg);
}

.form-label {
  display: block;
  margin-bottom: var(--spacing-sm);
}

.label-text {
  font-weight: 500;
  color: var(--text-primary);
  display: block;
  margin-bottom: var(--spacing-xs);
}

.label-hint {
  font-size: var(--font-sm);
  color: var(--text-tertiary);
}

.form-input {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: var(--font-base);
  transition: all var(--transition-fast);
}

.form-input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px var(--primary-light);
}

.char-count {
  text-align: right;
  font-size: var(--font-xs);
  color: var(--text-tertiary);
  margin-top: var(--spacing-xs);
}

.metric-inputs {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.metric-input-row {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
}

.metric-name {
  flex: 2;
}

.metric-target {
  flex: 1;
}

.btn-remove,
.btn-add {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  background: var(--border-color);
  color: var(--text-secondary);
  font-size: var(--font-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.btn-remove:hover {
  background: var(--danger-light);
  color: var(--danger-color);
}

.btn-add:hover {
  background: var(--primary-light);
  color: var(--primary-color);
}

.form-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: flex-end;
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--border-color);
}

.tips-card h3 {
  font-size: var(--font-lg);
  margin-bottom: var(--spacing-md);
  color: var(--primary-color);
}

.tips-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.tips-list li {
  padding: var(--spacing-sm) 0;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-color);
}

.tips-list li:last-child {
  border-bottom: none;
}

.tips-list strong {
  color: var(--text-primary);
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
  .metric-input-row {
    flex-direction: column;
    align-items: stretch;
  }

  .metric-name,
  .metric-target {
    width: 100%;
  }

  .btn-remove,
  .btn-add {
    width: 100%;
    height: 40px;
  }

  .form-actions {
    flex-direction: column;
  }
}
</style>
