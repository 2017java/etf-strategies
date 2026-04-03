import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 工作流阶段定义
export const WORKFLOW_STAGES = {
  BRAINSTORMING: 'brainstorming',
  WRITE_PRD: 'write_prd',
  WRITING_PLANS: 'writing_plans',
  AB_TEST: 'ab_test',
  ANALYTICS: 'analytics',
  ONBOARDING: 'onboarding',
  COMPLETED: 'completed'
}

// 阶段配置
export const STAGE_CONFIG = {
  [WORKFLOW_STAGES.BRAINSTORMING]: {
    name: '方案头脑风暴',
    description: '将模糊想法转化为清晰的产品方案',
    icon: '💡',
    next: WORKFLOW_STAGES.WRITE_PRD,
    color: '#2196F3'
  },
  [WORKFLOW_STAGES.WRITE_PRD]: {
    name: 'PRD 撰写',
    description: '编写专业的产品需求文档',
    icon: '📋',
    next: WORKFLOW_STAGES.WRITING_PLANS,
    color: '#4CAF50'
  },
  [WORKFLOW_STAGES.WRITING_PLANS]: {
    name: '计划拆分',
    description: '将需求拆解为可执行的任务',
    icon: '📝',
    next: WORKFLOW_STAGES.AB_TEST,
    color: '#FF9800'
  },
  [WORKFLOW_STAGES.AB_TEST]: {
    name: 'A/B 实验设计',
    description: '设计科学的验证实验',
    icon: '🧪',
    next: WORKFLOW_STAGES.ANALYTICS,
    color: '#9C27B0'
  },
  [WORKFLOW_STAGES.ANALYTICS]: {
    name: '数据埋点',
    description: '设计用户行为追踪方案',
    icon: '📊',
    next: WORKFLOW_STAGES.ONBOARDING,
    color: '#00BCD4'
  },
  [WORKFLOW_STAGES.ONBOARDING]: {
    name: '新用户激活',
    description: '优化用户激活流程',
    icon: '🚀',
    next: WORKFLOW_STAGES.COMPLETED,
    color: '#795548'
  },
  [WORKFLOW_STAGES.COMPLETED]: {
    name: '完成',
    description: '工作流已完成',
    icon: '✅',
    next: null,
    color: '#4CAF50'
  }
}

export const useWorkflowStore = defineStore('workflow', () => {
  // 当前阶段
  const currentStage = ref(WORKFLOW_STAGES.BRAINSTORMING)

  // 需求信息
  const requirement = ref({
    businessContext: '',
    problemStatement: '',
    successMetrics: []
  })

  // 各阶段输出
  const outputs = ref({
    [WORKFLOW_STAGES.BRAINSTORMING]: null,
    [WORKFLOW_STAGES.WRITE_PRD]: null,
    [WORKFLOW_STAGES.WRITING_PLANS]: null,
    [WORKFLOW_STAGES.AB_TEST]: null,
    [WORKFLOW_STAGES.ANALYTICS]: null,
    [WORKFLOW_STAGES.ONBOARDING]: null
  })

  // 已完成的阶段
  const completedStages = ref([])

  // 当前阶段配置
  const currentStageConfig = computed(() => {
    return STAGE_CONFIG[currentStage.value]
  })

  // 进度百分比
  const progress = computed(() => {
    const stages = Object.values(WORKFLOW_STAGES).filter(
      s => s !== WORKFLOW_STAGES.COMPLETED
    )
    return Math.round((completedStages.value.length / stages.length) * 100)
  })

  // 是否可以进入下一阶段
  const canGoNext = computed(() => {
    return outputs.value[currentStage.value] !== null
  })

  // 设置需求信息
  function setRequirement(data) {
    requirement.value = { ...requirement.value, ...data }
  }

  // 设置阶段输出
  function setStageOutput(stage, output) {
    outputs.value[stage] = output
  }

  // 进入下一阶段
  function goToNextStage() {
    if (!canGoNext.value) {
      console.warn('当前阶段输出为空，无法进入下一阶段')
      return
    }

    if (!completedStages.value.includes(currentStage.value)) {
      completedStages.value.push(currentStage.value)
    }

    const nextStage = STAGE_CONFIG[currentStage.value].next
    if (nextStage) {
      currentStage.value = nextStage
      return true
    }
    return false
  }

  // 跳转到指定阶段
  function goToStage(stage) {
    currentStage.value = stage
  }

  // 重置工作流
  function resetWorkflow() {
    currentStage.value = WORKFLOW_STAGES.BRAINSTORMING
    requirement.value = {
      businessContext: '',
      problemStatement: '',
      successMetrics: []
    }
    outputs.value = {
      [WORKFLOW_STAGES.BRAINSTORMING]: null,
      [WORKFLOW_STAGES.WRITE_PRD]: null,
      [WORKFLOW_STAGES.WRITING_PLANS]: null,
      [WORKFLOW_STAGES.AB_TEST]: null,
      [WORKFLOW_STAGES.ANALYTICS]: null,
      [WORKFLOW_STAGES.ONBOARDING]: null
    }
    completedStages.value = []
  }

  // 获取示例数据（新能源车金融产品需求）
  function loadExampleData() {
    requirement.value = {
      businessContext: '3月市场回暖，需要强化金融权益，促进销量提升。目前新能源汽车只有5免2产品，竞争力不如竞品。我们希望新增xx万5年0息、xx首付3年0息等更有竞争力的产品，配套同步广告及优化计算器。',
      problemStatement: '现有金融产品竞争力不足，无法有效促进新能源车型销量提升。计算器和广告宣传也需要同步优化。',
      successMetrics: [
        { name: 'xx车型渗透率', target: '30%' },
        { name: 'xxx车型渗透率', target: '20%' }
      ]
    }
  }

  return {
    // 状态
    currentStage,
    requirement,
    outputs,
    completedStages,

    // 计算属性
    currentStageConfig,
    progress,
    canGoNext,

    // 方法
    setRequirement,
    setStageOutput,
    goToNextStage,
    goToStage,
    resetWorkflow,
    loadExampleData
  }
})
