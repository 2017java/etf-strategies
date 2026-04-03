<template>
  <div class="brainstorming">
    <div class="container">
      <div class="content-layout">
        <aside class="sidebar">
          <WorkflowNavbar />
        </aside>

        <main class="main-content">
          <div class="page-header">
            <h1>方案头脑风暴</h1>
            <p class="subtitle">我们一起通过对话来梳理产品方案</p>
          </div>

          <!-- 需求概览卡片 -->
          <div class="card info-card">
            <h3>需求概览</h3>
            <div class="info-grid">
              <div class="info-item">
                <label>业务背景</label>
                <p>{{ requirement.businessContext }}</p>
              </div>
              <div class="info-item">
                <label>核心问题</label>
                <p>{{ requirement.problemStatement }}</p>
              </div>
              <div class="info-item">
                <label>成功指标</label>
                <div class="metric-list">
                  <div v-for="(metric, index) in requirement.successMetrics" :key="index" class="metric-item">
                    {{ metric.name }}: {{ metric.target }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 头脑风暴对话区域 -->
          <div v-if="phase === 'discussion'" class="card mt-lg">
            <h3>头脑风暴对话</h3>
            <div class="discussion-container">
              <div class="messages-list" ref="messagesContainer">
                <div v-for="(msg, index) in discussionMessages" :key="index"
                     class="message" :class="msg.role">
                  <div class="message-avatar">
                    {{ msg.role === 'ai' ? '🤖' : '👤' }}
                  </div>
                  <div class="message-content">
                    <div class="message-text" v-html="msg.text"></div>
                    <div v-if="msg.thoughts" class="message-thoughts">
                      <small>{{ msg.thoughts }}</small>
                    </div>
                  </div>
                </div>

                <div v-if="isThinking" class="message ai">
                  <div class="message-avatar">🤖</div>
                  <div class="message-content">
                    <div class="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="showUserInput" class="user-input-area">
                <div v-if="currentQuestion?.options" class="options-section">
                  <div class="options-label">请选择或输入您的想法（支持自由输入）：</div>
                  <div class="options-grid">
                    <button v-for="(option, idx) in currentQuestion.options" :key="idx"
                            class="option-btn" @click="selectOption(option)"
                            :class="{ selected: selectedOption === option }">
                      {{ option }}
                    </button>
                  </div>
                </div>
                <div class="text-input-wrapper">
                  <textarea v-model="userAnswer" placeholder="或输入您的详细想法..." rows="3"></textarea>
                  <button class="btn btn-primary" @click="submitAnswer" :disabled="!hasValidAnswer()">
                    发送
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 方案生成进度 -->
          <div v-if="phase === 'generating'" class="card mt-lg">
            <h3>方案生成中...</h3>
            <div class="generation-progress">
              <div class="progress-steps">
                <div v-for="(step, index) in generationSteps" :key="index"
                     class="progress-step" :class="{ active: step.active, completed: step.completed }">
                  <div class="step-icon">
                    <span v-if="step.completed">✓</span>
                    <span v-else-if="step.active">{{ index + 1 }}</span>
                    <span v-else>{{ index + 1 }}</span>
                  </div>
                  <div class="step-info">
                    <div class="step-title">{{ step.title }}</div>
                    <div class="step-desc">{{ step.description }}</div>
                  </div>
                </div>
              </div>

              <div class="progress-bar-wrapper">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: generationProgress + '%' }"></div>
                </div>
                <div class="progress-text">{{ Math.round(generationProgress) }}%</div>
              </div>

              <div class="progress-message">{{ generationMessage }}</div>
            </div>
          </div>

          <!-- 方案生成结果 -->
          <div v-if="phase === 'result' && output" class="card mt-lg">
            <div class="solution-content">
              <div class="solution-header">
                <h4>{{ output.title }}</h4>
                <div class="solution-actions">
                  <button class="btn btn-secondary" @click="restartBrainstorming">
                    重新头脑风暴
                  </button>
                  <button class="btn btn-primary" @click="confirmSolution">
                    确认方案，进入 PRD 撰写
                  </button>
                </div>
              </div>

              <div class="solution-body">
                <!-- 方案概述 -->
                <section class="solution-section">
                  <h5>方案概述</h5>
                  <p>{{ output.overview }}</p>
                </section>

                <!-- 产品架构 -->
                <section class="solution-section">
                  <h5>产品架构</h5>
                  <div class="architecture-diagram">
                    <div class="architecture-content">{{ output.architecture }}</div>
                  </div>
                </section>

                <!-- 功能边界 -->
                <section class="solution-section">
                  <h5>功能边界</h5>
                  <div class="feature-boundaries">
                    <div v-for="(boundary, index) in output.featureBoundaries" :key="index" class="boundary-item">
                      {{ boundary }}
                    </div>
                  </div>
                </section>

                <!-- 方案对比 -->
                <section class="solution-section">
                  <h5>方案对比</h5>
                  <div class="comparison-grid">
                    <div v-for="(option, index) in output.options" :key="index" class="comparison-card">
                      <div class="comparison-header">
                        <h6>{{ option.name }}</h6>
                        <div class="option-badge" :class="option.recommended ? 'recommended' : ''">
                          {{ option.recommended ? '推荐' : '备选' }}
                        </div>
                      </div>
                      <div class="comparison-content">
                        <p>{{ option.description }}</p>
                        <div class="option-details">
                          <div class="detail">
                            <span class="detail-label">优势：</span>
                            {{ option.advantages }}
                          </div>
                          <div class="detail">
                            <span class="detail-label">劣势：</span>
                            {{ option.disadvantages }}
                          </div>
                          <div class="detail">
                            <span class="detail-label">实施难度：</span>
                            <div class="difficulty-level">
                              <span v-for="i in 5" :key="i" class="difficulty-dot"
                                    :class="{ filled: i <= option.difficulty }"></span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <!-- 成功指标 -->
                <section class="solution-section">
                  <h5>成功指标</h5>
                  <div class="metrics-table">
                    <div v-for="(metric, index) in output.metrics" :key="index" class="metric-row">
                      <div class="metric-name">{{ metric.name }}</div>
                      <div class="metric-target">{{ metric.target }}</div>
                      <div class="metric-measurement">{{ metric.measurement }}</div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useWorkflowStore, WORKFLOW_STAGES } from '../store/workflow'
import WorkflowNavbar from '../components/WorkflowNavbar.vue'

const router = useRouter()
const store = useWorkflowStore()

const requirement = computed(() => store.requirement)
const output = ref(null)

// 阶段状态: discussion -> generating -> result
const phase = ref('discussion')

// 讨论相关
const discussionMessages = ref([])
const isThinking = ref(false)
const showUserInput = ref(false)
const userAnswer = ref('')
const selectedOption = ref(null)
const currentQuestion = ref(null)
const messagesContainer = ref(null)
const discussionStep = ref(0)

// 生成进度相关
const generationProgress = ref(0)
const generationMessage = ref('')
const generationSteps = ref([
  { title: '分析需求', description: '理解业务背景和核心问题', active: false, completed: false },
  { title: '头脑风暴', description: '探索各种可能的解决方案', active: false, completed: false },
  { title: '方案设计', description: '设计详细的产品方案', active: false, completed: false },
  { title: '对比评估', description: '对比不同方案的优缺点', active: false, completed: false },
  { title: '整理输出', description: '整理完整的方案文档', active: false, completed: false }
])

// 预设的讨论问题
const discussionQuestions = [
  {
    text: '您好！我是您的产品方案助手。在开始设计方案之前，我想先了解一下：<br><br>这个产品的目标用户群体主要是哪些人？',
    options: ['个人消费者', '企业客户', '经销商/渠道商', '混合用户群体'],
    thoughts: '需要先明确目标用户，这样才能设计出合适的产品方案'
  },
  {
    text: '好的，了解了目标用户。接下来想确认一下：<br><br>您最希望优先解决用户的什么痛点？',
    options: ['金融产品选择困难', '计算复杂不直观', '信息获取不及时', '流程繁琐效率低'],
    thoughts: '明确核心痛点有助于聚焦方案重点'
  },
  {
    text: '非常好！我们再探讨一下实现方式：<br><br>您倾向于采用什么样的技术方案？',
    options: ['快速迭代的轻量级方案', '架构完善的长期方案', '基于现有系统扩展', '全新设计开发'],
    thoughts: '技术选型会影响方案的实施路径'
  },
  {
    text: '明白了！最后一个问题：<br><br>您期望这个方案多长时间内能看到明显效果？',
    options: ['1个月内（快速见效）', '3个月内（稳步推进）', '6个月以上（长期布局）', '分阶段逐步见效'],
    thoughts: '时间预期会影响方案的优先级和节奏'
  }
]

onMounted(() => {
  const existingOutput = store.outputs[WORKFLOW_STAGES.BRAINSTORMING]
  if (existingOutput) {
    output.value = existingOutput
    phase.value = 'result'
  } else {
    startDiscussion()
  }
})

function startDiscussion() {
  phase.value = 'discussion'
  discussionStep.value = 0
  discussionMessages.value = []

  setTimeout(() => {
    addAiMessage('您好！我是您的产品方案助手。让我们通过对话来一起梳理产品方案吧。', '我需要先了解一些关键信息，才能为您设计出最合适的方案')
    setTimeout(() => {
      askNextQuestion()
    }, 800)
  }, 500)
}

function addAiMessage(text, thoughts = null) {
  discussionMessages.value.push({
    role: 'ai',
    text: text,
    thoughts: thoughts
  })
  scrollToBottom()
}

function addUserMessage(text) {
  discussionMessages.value.push({
    role: 'user',
    text: text
  })
  scrollToBottom()
}

function askNextQuestion() {
  if (discussionStep.value >= discussionQuestions.length) {
    finishDiscussion()
    return
  }

  const question = discussionQuestions[discussionStep.value]
  currentQuestion.value = question
  isThinking.value = true
  showUserInput.value = false

  setTimeout(() => {
    isThinking.value = false
    addAiMessage(question.text, question.thoughts)
    setTimeout(() => {
      showUserInput.value = true
    }, 300)
  }, 1000)
}

function selectOption(option) {
  selectedOption.value = option
  userAnswer.value = option // 将选项填入文本框，方便用户修改
}

function hasValidAnswer() {
  return selectedOption.value || userAnswer.value.trim()
}

function submitAnswer() {
  const answer = selectedOption.value || userAnswer.value.trim()
  if (!answer) return

  showUserInput.value = false
  addUserMessage(answer)

  userAnswer.value = ''
  selectedOption.value = null
  discussionStep.value++

  setTimeout(() => {
    askNextQuestion()
  }, 500)
}

function finishDiscussion() {
  showUserInput.value = false
  addAiMessage('太好了！感谢您的回答。基于我们的讨论，我现在开始为您生成完整的产品方案。', '收集的信息足够了，让我来整理一下思路...')

  setTimeout(() => {
    startGeneration()
  }, 1500)
}

function startGeneration() {
  phase.value = 'generating'
  generationProgress.value = 0
  generationMessage.value = '准备开始...'

  // 重置步骤状态
  generationSteps.value.forEach(step => {
    step.active = false
    step.completed = false
  })

  simulateGeneration()
}

function simulateGeneration() {
  const stepTimings = [1500, 2000, 2500, 2000, 1500]
  const messages = [
    '正在分析您的需求...',
    '正在探索各种可能的解决方案...',
    '正在设计产品架构和功能...',
    '正在对比评估不同方案...',
    '正在整理最终方案...'
  ]

  let currentStep = 0
  let elapsed = 0

  function runStep() {
    if (currentStep >= generationSteps.value.length) {
      finishGeneration()
      return
    }

    generationSteps.value[currentStep].active = true
    generationMessage.value = messages[currentStep]

    const stepDuration = stepTimings[currentStep]
    const stepStartProgress = currentStep * 20
    const stepEndProgress = (currentStep + 1) * 20
    const interval = 50
    const increments = stepDuration / interval
    const progressPerIncrement = 20 / increments

    let stepElapsed = 0

    const stepInterval = setInterval(() => {
      stepElapsed += interval
      elapsed += interval

      const currentProgress = stepStartProgress + progressPerIncrement * (stepElapsed / interval)
      generationProgress.value = Math.min(currentProgress, stepEndProgress)

      if (stepElapsed >= stepDuration) {
        clearInterval(stepInterval)
        generationSteps.value[currentStep].completed = true
        generationSteps.value[currentStep].active = false
        currentStep++
        runStep()
      }
    }, interval)
  }

  runStep()
}

function finishGeneration() {
  generationProgress.value = 100
  generationMessage.value = '方案生成完成！'

  setTimeout(() => {
    const solution = {
      title: '新能源车销售金融方案0息产品展示优化',
      overview: '针对市场回暖需求，优化金融产品展示策略，增强产品竞争力。通过对话式交互和智能推荐，帮助用户快速找到合适的金融产品。',
      architecture: `## 产品架构设计\n\n### 1. 前端展示层\n- **产品列表页**：分类展示金融产品\n- **详情页**：产品信息和计算器\n- **对比页**：产品对比功能\n- **推荐模块**：基于用户属性的智能推荐\n\n### 2. 核心功能层\n- **产品管理**：配置和管理金融产品\n- **计算器引擎**：多种还款方式计算\n- **推荐算法**：基于用户画像的推荐\n- **数据分析**：用户行为和转化率分析\n\n### 3. 数据支撑层\n- **产品数据库**：金融产品信息\n- **用户画像**：用户属性和行为\n- **计算模型**：还款计算逻辑\n- **埋点系统**：用户行为追踪\n\n### 4. 外部集成\n- **渠道接口**：与经销商系统对接\n- **支付接口**：支付和还款处理\n- **短信服务**：用户通知\n- **数据分析**：第三方数据分析平台`,
      featureBoundaries: [
        '金融产品配置管理',
        '产品计算器优化',
        '广告投放系统',
        '数据分析平台'
      ],
      options: [
        {
          name: '方案一：全产品展示策略',
          recommended: true,
          description: '同时展示所有金融产品，提供计算器功能，让用户自主选择',
          advantages: '用户选择自由度高，能够充分展示产品丰富度',
          disadvantages: '页面负载较高，需要优化交互设计',
          difficulty: 3
        },
        {
          name: '方案二：推荐产品策略',
          recommended: false,
          description: '根据用户属性推荐合适的金融产品，简化选择过程',
          advantages: '用户体验好，转化率高',
          disadvantages: '需要用户画像和推荐算法支持',
          difficulty: 4
        }
      ],
      metrics: [
        {
          name: 'xx车型渗透率',
          target: '30%',
          measurement: '金融产品详情页查看率'
        },
        {
          name: 'xxx车型渗透率',
          target: '20%',
          measurement: '金融产品详情页查看率'
        },
        {
          name: '转化率',
          target: '15%',
          measurement: '从产品展示到申请的转化率'
        },
        {
          name: '计算器使用率',
          target: '25%',
          measurement: '产品详情页计算器使用比例'
        }
      ]
    }

    output.value = solution
    store.setStageOutput(WORKFLOW_STAGES.BRAINSTORMING, solution)
    phase.value = 'result'
  }, 500)
}

function restartBrainstorming() {
  output.value = null
  store.setStageOutput(WORKFLOW_STAGES.BRAINSTORMING, null)
  startDiscussion()
}

function confirmSolution() {
  if (store.goToNextStage()) {
    router.push('/write-prd')
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}
</script>

<style scoped>
.brainstorming {
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
  max-width: 900px;
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

.info-card h3 {
  font-size: var(--font-lg);
  margin-bottom: var(--spacing-lg);
  color: var(--text-primary);
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.info-item label {
  font-weight: 500;
  color: var(--text-primary);
  display: block;
  margin-bottom: var(--spacing-sm);
}

.info-item p {
  color: var(--text-secondary);
  margin: 0;
}

.metric-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.metric-item {
  color: var(--text-secondary);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--background-color);
  border-radius: var(--radius-md);
}

/* 讨论区域样式 */
.discussion-container {
  display: flex;
  flex-direction: column;
  min-height: 500px;
}

.messages-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-md);
  background: var(--background-color);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-md);
  max-height: 400px;
}

.message {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  animation: messageSlideIn 0.3s ease-out;
}

@keyframes messageSlideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--card-background);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.message.user .message-avatar {
  background: var(--primary-light);
}

.message-content {
  flex: 1;
  max-width: 80%;
}

.message-text {
  background: var(--card-background);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  line-height: 1.6;
}

.message.user .message-text {
  background: var(--primary-color);
  color: white;
}

.message-thoughts {
  margin-top: var(--spacing-xs);
  color: var(--text-tertiary);
  font-style: italic;
}

/* 打字指示器 */
.typing-indicator {
  display: flex;
  gap: 4px;
  padding: var(--spacing-md);
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text-tertiary);
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-5px);
    opacity: 1;
  }
}

/* 用户输入区域 */
.user-input-area {
  border-top: 1px solid var(--border-color);
  padding-top: var(--spacing-md);
}

.options-section {
  margin-bottom: var(--spacing-md);
}

.options-label {
  font-size: var(--font-sm);
  color: var(--text-secondary);
  margin-bottom: var(--spacing-sm);
}

.options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-sm);
}

.option-btn {
  padding: var(--spacing-md);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--card-background);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: var(--font-sm);
  text-align: center;
}

.option-btn:hover {
  border-color: var(--primary-color);
  background: var(--primary-light);
}

.option-btn.selected {
  border-color: var(--primary-color);
  background: var(--primary-color);
  color: white;
}

.text-input-wrapper {
  display: flex;
  gap: var(--spacing-sm);
  align-items: flex-end;
}

.text-input-wrapper textarea {
  flex: 1;
  padding: var(--spacing-md);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  resize: none;
  font-family: inherit;
  font-size: var(--font-sm);
}

.text-input-wrapper textarea:focus {
  outline: none;
  border-color: var(--primary-color);
}

/* 生成进度样式 */
.generation-progress {
  padding: var(--spacing-lg);
}

.progress-steps {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
}

.progress-step {
  display: flex;
  gap: var(--spacing-md);
  align-items: flex-start;
  opacity: 0.4;
  transition: all 0.3s ease;
}

.progress-step.active {
  opacity: 1;
}

.progress-step.completed {
  opacity: 1;
}

.step-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--border-color);
  color: var(--text-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.progress-step.active .step-icon {
  background: var(--primary-color);
  color: white;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(33, 150, 243, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(33, 150, 243, 0);
  }
}

.progress-step.completed .step-icon {
  background: var(--secondary-color);
  color: white;
}

.step-info {
  flex: 1;
}

.step-title {
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
}

.step-desc {
  font-size: var(--font-sm);
  color: var(--text-secondary);
}

.progress-bar-wrapper {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: var(--border-color);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  font-weight: 600;
  color: var(--primary-color);
  min-width: 50px;
  text-align: right;
  font-variant-numeric: tabular-nums; /* 防止数字跳动 */
}

.progress-message {
  text-align: center;
  color: var(--text-secondary);
  font-style: italic;
}

/* 方案结果样式 */
.solution-content {
  width: 100%;
}

.solution-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.solution-header h4 {
  font-size: var(--font-lg);
  margin: 0;
  color: var(--text-primary);
}

.solution-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.solution-body {
  background: var(--background-color);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
}

.solution-section {
  margin-bottom: var(--spacing-lg);
}

.solution-section:last-child {
  margin-bottom: 0;
}

.solution-section h5 {
  font-size: var(--font-base);
  margin-bottom: var(--spacing-md);
  color: var(--text-primary);
  border-bottom: 2px solid var(--primary-color);
  padding-bottom: var(--spacing-xs);
}

.solution-section p {
  color: var(--text-secondary);
  margin-bottom: var(--spacing-sm);
}

.architecture-diagram {
  background: var(--card-background);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
  border: 1px dashed var(--border-color);
  margin-bottom: var(--spacing-sm);
}

.architecture-content {
  color: var(--text-tertiary);
  line-height: 1.8;
  white-space: pre-wrap;
}

.feature-boundaries {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-sm);
}

.boundary-item {
  background: var(--card-background);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--font-sm);
}

.comparison-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-md);
}

.comparison-card {
  background: var(--card-background);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.comparison-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.comparison-header h6 {
  margin: 0;
  color: var(--text-primary);
}

.option-badge {
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: var(--font-xs);
  font-weight: 500;
}

.option-badge.recommended {
  background: var(--secondary-light);
  color: var(--secondary-color);
}

.comparison-content p {
  margin-bottom: var(--spacing-md);
  color: var(--text-secondary);
}

.option-details {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.detail {
  font-size: var(--font-sm);
}

.detail-label {
  font-weight: 500;
  color: var(--text-primary);
}

.difficulty-level {
  display: flex;
  gap: var(--spacing-xs);
  align-items: center;
}

.difficulty-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--border-color);
}

.difficulty-dot.filled {
  background: var(--warning-color);
}

.metrics-table {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.metric-row {
  display: grid;
  grid-template-columns: 2fr 1fr 2fr;
  gap: var(--spacing-sm);
  background: var(--card-background);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  font-size: var(--font-sm);
}

.metric-name {
  color: var(--text-primary);
  font-weight: 500;
}

.metric-target {
  color: var(--primary-color);
  font-weight: 500;
  text-align: center;
}

.metric-measurement {
  color: var(--text-secondary);
  font-size: var(--font-xs);
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
  .solution-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-md);
  }

  .solution-actions {
    width: 100%;
  }

  .solution-actions .btn {
    flex: 1;
  }

  .comparison-grid {
    grid-template-columns: 1fr;
  }

  .metric-row {
    grid-template-columns: 1fr;
    gap: var(--spacing-xs);
  }

  .options-grid {
    grid-template-columns: 1fr;
  }
}
</style>
