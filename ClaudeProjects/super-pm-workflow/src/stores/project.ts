import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { nanoid } from 'nanoid'

// --- Data Types ---

export interface SuccessMetric {
  name: string
  target: string
}

export interface RequirementData {
  businessContext: string
  problemStatement: string
  successMetrics: SuccessMetric[]
  targetUsers: string
  constraints: string
  priority: 'high' | 'medium' | 'low'
}

// Brainstorming
export interface SolutionOption {
  id: string
  title: string
  description: string
  pros: string[]
  cons: string[]
  recommended: boolean
  difficulty: 'low' | 'medium' | 'high'
}

export interface BrainstormingData {
  designScheme: string      // Markdown
  architectureOverview: string
  solutionOptions: SolutionOption[]
  chatHistory: Array<{ role: 'user' | 'assistant'; content: string }>
  status: 'empty' | 'draft' | 'completed'
}

// PRD
export interface UserStory {
  id: string
  role: string
  want: string
  benefit: string
  acceptanceCriteria: string[]
  priority: 'high' | 'medium' | 'low'
}

export interface Feature {
  id: string
  name: string
  description: string
  status: 'planning' | 'backlog' | 'development' | 'completed'
  priority: 'high' | 'medium' | 'low'
}

export interface PRDData {
  problemBackground: string
  productVision: string
  userStories: UserStory[]
  features: Feature[]
  technicalArchitecture: string
  acceptanceCriteria: string
  outOfScope: string
  status: 'empty' | 'draft' | 'completed'
}

// Implementation Plans
export interface Task {
  id: string
  title: string
  description: string
  assignee: string
  estimate: string   // e.g., "3 days"
  status: 'todo' | 'in_progress' | 'done'
  dependencies: string[]  // task ids
}

export interface Milestone {
  id: string
  title: string
  duration: string
  description: string
  tasks: Task[]
}

export interface PlansData {
  overview: string
  milestones: Milestone[]
  status: 'empty' | 'draft' | 'completed'
}

// A/B Test
export interface ABVariant {
  id: string
  name: string      // 'Control' | 'Treatment A' | ...
  description: string
  changes: string[]
  trafficPercent: number
}

export interface ABTestData {
  testName: string
  hypothesis: string   // "Because [obs], we believe [change] will cause [result] for [audience]"
  observation: string
  change: string
  expectedOutcome: string
  audience: string
  primaryMetric: string
  secondaryMetrics: string[]
  duration: number      // days
  variants: ABVariant[]
  // Sample size calculator
  baselineRate: number
  mde: number           // minimum detectable effect
  confidence: number    // 0.95
  power: number         // 0.80
  dailyTraffic: number
  sampleSizeRequired: number
  estimatedDays: number
  platform: string
  checklist: Array<{ text: string; checked: boolean }>
  status: 'empty' | 'draft' | 'completed'
}

// Analytics Tracking
export interface EventProperty {
  name: string
  type: 'string' | 'number' | 'boolean'
  description: string
  required: boolean
}

export interface TrackingEvent {
  id: string
  name: string         // object_action format
  category: string
  description: string
  trigger: string
  properties: EventProperty[]
}

export interface JourneyStep {
  id: string
  name: string
  description: string
  events: string[]    // event ids
}

export interface ReportTemplate {
  id: string
  name: string
  description: string
  metrics: string[]
}

export interface AnalyticsData {
  overview: string
  namingConvention: string
  journeySteps: JourneyStep[]
  events: TrackingEvent[]
  reportTemplates: ReportTemplate[]
  status: 'empty' | 'draft' | 'completed'
}

// Onboarding CRO
export interface FunnelStep {
  id: string
  name: string
  description: string
  userCount: number
  conversionRate: number    // to next step
  improvements: string[]
}

export interface AhaMoment {
  id: string
  description: string
  timeToAha: string        // e.g., "within 5 minutes"
  retentionLift: string    // e.g., "+23%"
}

export interface Touchpoint {
  id: string
  timing: string           // "immediate" | "day 1" | "day 3" | "day 7"
  channel: string          // "email" | "in-app" | "push" | "sms"
  goal: string
  message: string
}

export interface OnboardingData {
  activationDefinition: string
  ahaMoments: AhaMoment[]
  funnelSteps: FunnelStep[]
  touchpoints: Touchpoint[]
  experimentPlan: string
  status: 'empty' | 'draft' | 'completed'
}

// Project
export interface ProjectModules {
  brainstorming: BrainstormingData | null
  prd: PRDData | null
  plans: PlansData | null
  abTest: ABTestData | null
  analytics: AnalyticsData | null
  onboarding: OnboardingData | null
}

export type ModuleId = 'requirement' | 'brainstorming' | 'prd' | 'plans' | 'abTest' | 'analytics' | 'onboarding'

export interface Project {
  id: string
  name: string
  industry: string
  createdAt: string
  updatedAt: string
  requirement: RequirementData
  modules: ProjectModules
}

// --- Industry Templates ---
export const INDUSTRY_TEMPLATES: Record<string, Partial<RequirementData>> = {
  automotive: {
    businessContext: '3月市场回暖，需要强化金融权益，促进销量提升。目前新能源汽车只有5免2产品，竞争力不如竞品。希望新增零首付/低息金融产品，配套优化计算器和广告宣传。',
    problemStatement: '现有金融产品竞争力不足，无法有效促进新能源车型销量提升。计算器和广告宣传也需要同步优化。',
    successMetrics: [
      { name: 'xx车型渗透率', target: '30%' },
      { name: 'xxx车型渗透率', target: '20%' },
    ],
    targetUsers: '25-45岁，有购车意向的用户，对金融方案敏感',
    priority: 'high',
  },
  ecommerce: {
    businessContext: '电商平台用户留存率持续下降，新用户7日留存不足20%。需要通过优化商品推荐和个性化运营提升用户粘性。',
    problemStatement: '缺乏有效的个性化推荐机制，用户首次购物后回购率低，平台商品丰富但发现率不足。',
    successMetrics: [
      { name: '7日留存率', target: '35%' },
      { name: '人均购买频次', target: '2.5次/月' },
    ],
    targetUsers: '18-35岁，移动端用户，月购物频次>=1次',
    priority: 'high',
  },
  saas: {
    businessContext: 'SaaS产品试用转付费率只有5%，远低于行业平均15%。用户在试用期内无法体验到核心价值，导致大量流失。',
    problemStatement: '用户在免费试用期内激活率低，无法快速感受到产品核心价值，导致试用转付费率远低于预期。',
    successMetrics: [
      { name: '试用转付费率', target: '15%' },
      { name: '7日激活率', target: '60%' },
    ],
    targetUsers: '中小企业决策者，10-500人规模团队',
    priority: 'high',
  },
  education: {
    businessContext: '在线教育平台课程完课率不足30%，用户购课后大量未开始学习或中途放弃，影响续费和口碑。',
    problemStatement: '用户购课后缺乏有效的学习引导和激励机制，导致完课率低、续费意愿差。',
    successMetrics: [
      { name: '课程完课率', target: '60%' },
      { name: '续费率', target: '40%' },
    ],
    targetUsers: '25-40岁职场人士，有技能提升需求',
    priority: 'medium',
  },
  social: {
    businessContext: '社交产品新用户注册后72小时内流失率超过70%，用户在平台上无法找到有趣的内容和志同道合的人。',
    problemStatement: '新用户冷启动体验差，内容推荐不精准，社交关系建立困难，导致早期用户大量流失。',
    successMetrics: [
      { name: '72小时留存率', target: '40%' },
      { name: '首发内容率', target: '25%' },
    ],
    targetUsers: '18-30岁，Z世代用户，有社交分享需求',
    priority: 'high',
  },
}

const emptyRequirement = (): RequirementData => ({
  businessContext: '',
  problemStatement: '',
  successMetrics: [{ name: '', target: '' }],
  targetUsers: '',
  constraints: '',
  priority: 'medium',
})

const emptyProject = (name = '新项目', industry = ''): Project => ({
  id: nanoid(),
  name,
  industry,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  requirement: emptyRequirement(),
  modules: {
    brainstorming: null,
    prd: null,
    plans: null,
    abTest: null,
    analytics: null,
    onboarding: null,
  },
})

// --- Store ---
export const useProjectStore = defineStore('project', () => {
  const projects = ref<Project[]>([])
  const currentProjectId = ref<string | null>(null)

  const currentProject = computed(() =>
    projects.value.find(p => p.id === currentProjectId.value) ?? null
  )

  // Module status helper
  function getModuleStatus(project: Project, moduleId: ModuleId): 'empty' | 'draft' | 'completed' {
    if (moduleId === 'requirement') {
      const r = project.requirement
      return r.businessContext || r.problemStatement ? 'completed' : 'empty'
    }
    const keyMap: Record<Exclude<ModuleId, 'requirement'>, keyof ProjectModules> = {
      brainstorming: 'brainstorming',
      prd: 'prd',
      plans: 'plans',
      abTest: 'abTest',
      analytics: 'analytics',
      onboarding: 'onboarding',
    }
    const m = project.modules[keyMap[moduleId as Exclude<ModuleId, 'requirement'>]]
    if (!m) return 'empty'
    return (m as any).status ?? 'draft'
  }

  // Recommended next module
  function getRecommendedModule(project: Project): ModuleId | null {
    const order: ModuleId[] = ['requirement', 'brainstorming', 'prd', 'plans', 'abTest', 'analytics', 'onboarding']
    for (const id of order) {
      if (getModuleStatus(project, id) === 'empty') return id
    }
    return null
  }

  function createProject(name?: string, industry?: string): Project {
    const project = emptyProject(name, industry)
    projects.value.unshift(project)
    currentProjectId.value = project.id
    return project
  }

  function deleteProject(id: string) {
    projects.value = projects.value.filter(p => p.id !== id)
    if (currentProjectId.value === id) {
      currentProjectId.value = projects.value[0]?.id ?? null
    }
  }

  function duplicateProject(id: string): Project | null {
    const source = projects.value.find(p => p.id === id)
    if (!source) return null
    const copy = JSON.parse(JSON.stringify(source)) as Project
    copy.id = nanoid()
    copy.name = source.name + ' (副本)'
    copy.createdAt = new Date().toISOString()
    copy.updatedAt = new Date().toISOString()
    projects.value.unshift(copy)
    return copy
  }

  function renameProject(id: string, name: string) {
    const p = projects.value.find(p => p.id === id)
    if (p) { p.name = name; p.updatedAt = new Date().toISOString() }
  }

  function setCurrentProject(id: string) {
    currentProjectId.value = id
  }

  function updateRequirement(id: string, data: Partial<RequirementData>) {
    const p = projects.value.find(p => p.id === id)
    if (p) {
      p.requirement = { ...p.requirement, ...data }
      p.updatedAt = new Date().toISOString()
    }
  }

  function updateModule<K extends keyof ProjectModules>(id: string, key: K, data: ProjectModules[K]) {
    const p = projects.value.find(p => p.id === id)
    if (p) {
      p.modules[key] = data
      p.updatedAt = new Date().toISOString()
    }
  }

  function applyTemplate(id: string, templateKey: string) {
    const template = INDUSTRY_TEMPLATES[templateKey]
    if (!template) return
    updateRequirement(id, template)
  }

  function importProject(data: Project) {
    data.id = nanoid()
    data.createdAt = new Date().toISOString()
    data.updatedAt = new Date().toISOString()
    projects.value.unshift(data)
    currentProjectId.value = data.id
  }

  return {
    projects,
    currentProjectId,
    currentProject,
    getModuleStatus,
    getRecommendedModule,
    createProject,
    deleteProject,
    duplicateProject,
    renameProject,
    setCurrentProject,
    updateRequirement,
    updateModule,
    applyTemplate,
    importProject,
  }
}, {
  persist: true,
})
