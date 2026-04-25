// Holland Code → Top3 职业方向映射表
// 用于降级模式和基础结果展示

export interface CareerDirection {
  direction: string;
  representativeRoles: string[];
  matchReason: string;
}

export interface HollandMapping {
  code: string;
  tag: string;
  directions: CareerDirection[];
}

const hollandCareerMap: Record<string, HollandMapping> = {
  R: { code: 'R', tag: '实干型工匠星', directions: [
    { direction: '工程技术', representativeRoles: ['机械工程师', '电气工程师', '土木工程师'], matchReason: '动手能力强，适合技术实操领域' },
    { direction: '信息技术', representativeRoles: ['运维工程师', '网络工程师', '嵌入式开发'], matchReason: '擅长处理具体技术问题' },
    { direction: '生产制造', representativeRoles: ['工艺工程师', '质量工程师', '项目经理'], matchReason: '偏好可见成果和流程优化' },
  ]},
  I: { code: 'I', tag: '探索型研究星', directions: [
    { direction: '数据科学', representativeRoles: ['数据分析师', '算法工程师', '研究员'], matchReason: '善于分析推理，适合研究型工作' },
    { direction: '学术科研', representativeRoles: ['高校教师', '科研人员', '实验室技术员'], matchReason: '对知识探索有强烈驱动力' },
    { direction: '医疗健康', representativeRoles: ['临床医生', '药师', '医学研究员'], matchReason: '严谨思维适合专业领域深耕' },
  ]},
  A: { code: 'A', tag: '创造型艺术星', directions: [
    { direction: '创意设计', representativeRoles: ['UX设计师', '平面设计师', 'UI设计师'], matchReason: '富有想象力和审美感受力' },
    { direction: '内容创作', representativeRoles: ['文案策划', '视频编导', '新媒体运营'], matchReason: '擅长用创意方式表达观点' },
    { direction: '产品创新', representativeRoles: ['产品经理', '交互设计师', '创新顾问'], matchReason: '独特视角适合推动创新方案' },
  ]},
  S: { code: 'S', tag: '温暖型助人星', directions: [
    { direction: '教育培训', representativeRoles: ['教师', '培训师', '教育顾问'], matchReason: '善于沟通和培养他人' },
    { direction: '人力资源', representativeRoles: ['HR专员', '组织发展', '员工关怀'], matchReason: '共情力强，适合人际导向工作' },
    { direction: '社会服务', representativeRoles: ['社工', '心理咨询师', '公益项目官'], matchReason: '助人动机强，适合服务领域' },
  ]},
  E: { code: 'E', tag: '领航型管理星', directions: [
    { direction: '商业管理', representativeRoles: ['管培生', '项目经理', '商务拓展'], matchReason: '领导力和决策力突出' },
    { direction: '市场营销', representativeRoles: ['品牌经理', '市场专员', '销售经理'], matchReason: '善于说服和影响他人' },
    { direction: '创业创新', representativeRoles: ['创业者', '投资分析师', '战略顾问'], matchReason: '对商业机会有敏锐直觉' },
  ]},
  C: { code: 'C', tag: '稳健型守护星', directions: [
    { direction: '财务管理', representativeRoles: ['会计', '财务分析师', '审计师'], matchReason: '注重细节和规范性' },
    { direction: '行政运营', representativeRoles: ['行政专员', '运营主管', '合规专员'], matchReason: '擅长流程管理和执行' },
    { direction: '信息技术', representativeRoles: ['数据库管理员', '测试工程师', '配置管理'], matchReason: '精确和有序适合技术管理' },
  ]},
  // 常见组合码
  IR: { code: 'IR', tag: '钻研型工程师星', directions: [
    { direction: '研发工程', representativeRoles: ['研发工程师', '技术专家', '系统架构师'], matchReason: '兼具动手能力和探索精神' },
    { direction: '数据工程', representativeRoles: ['数据工程师', '机器学习工程师', '算法研究员'], matchReason: '实践与分析能力兼备' },
    { direction: '技术科研', representativeRoles: ['科研工程师', '技术顾问', '专利分析师'], matchReason: '理论与实践结合度极高' },
  ]},
  IA: { code: 'IA', tag: '创新型研究星', directions: [
    { direction: '产品设计', representativeRoles: ['产品经理', 'UX研究员', '设计策略师'], matchReason: '研究深度与创意并重' },
    { direction: '内容研发', representativeRoles: ['内容策略师', '知识架构师', '教育设计师'], matchReason: '擅长创造性知识整合' },
    { direction: '人机交互', representativeRoles: ['交互设计师', '可用性专家', '体验研究员'], matchReason: '分析力+创造力双重优势' },
  ]},
  AS: { code: 'AS', tag: '感性型表达星', directions: [
    { direction: '教育创新', representativeRoles: ['创意教师', '课程设计师', '教育产品经理'], matchReason: '创意表达与助人热情兼备' },
    { direction: '文化传播', representativeRoles: ['文化策划', '社媒主编', '品牌故事师'], matchReason: '感性表达力+人际感染力' },
    { direction: '用户研究', representativeRoles: ['用户研究员', '体验设计师', '社区运营'], matchReason: '理解用户且能创造性地回应需求' },
  ]},
  SE: { code: 'SE', tag: '影响力驱动星', directions: [
    { direction: '管理咨询', representativeRoles: ['咨询顾问', '项目经理', '变革管理'], matchReason: '人际影响力与领导力兼备' },
    { direction: '市场营销', representativeRoles: ['市场总监', '公关经理', '品牌策略师'], matchReason: '社交能力+商业直觉双重优势' },
    { direction: '教育培训', representativeRoles: ['企业培训师', '职业教练', '导师'], matchReason: '助人+领导适合指导他人' },
  ]},
  EC: { code: 'EC', tag: '务实型经营星', directions: [
    { direction: '商业运营', representativeRoles: ['运营总监', '商务经理', '供应链管理'], matchReason: '决策力+规范性双重优势' },
    { direction: '金融投资', representativeRoles: ['投资经理', '风控分析师', '基金经理'], matchReason: '果断且有风险管控意识' },
    { direction: '项目管理', representativeRoles: ['PMP项目经理', 'PMO主管', '交付经理'], matchReason: '领导力与执行力平衡' },
  ]},
  RC: { code: 'RC', tag: '精工型品质星', directions: [
    { direction: '质量工程', representativeRoles: ['质量总监', '六西格玛专家', '测试经理'], matchReason: '实操能力+规范意识极佳' },
    { direction: '技术运维', representativeRoles: ['运维架构师', 'SRE工程师', '基础设施管理'], matchReason: '动手能力+流程管理兼备' },
    { direction: '生产管理', representativeRoles: ['生产主管', '工艺工程师', '精益管理'], matchReason: '注重效率和规范执行' },
  ]},
};

// 根据 Holland Code 获取职业映射（精确匹配 → 首字母匹配 → 默认）
export function getHollandCareerMapping(hollandCode: string): HollandMapping {
  // 尝试精确匹配三字母码的前两字母
  const twoLetterCode = hollandCode.slice(0, 2);
  if (hollandCareerMap[twoLetterCode]) {
    return hollandCareerMap[twoLetterCode];
  }

  // 尝试首字母匹配
  const firstLetter = hollandCode[0];
  if (hollandCareerMap[firstLetter]) {
    return hollandCareerMap[firstLetter];
  }

  // 默认返回 I（研究型）
  return hollandCareerMap['I'];
}

// 获取人格标签
export function getPersonalityTag(hollandCode: string): string {
  return getHollandCareerMapping(hollandCode).tag;
}

// 获取职业方向
export function getCareerDirections(hollandCode: string): CareerDirection[] {
  return getHollandCareerMapping(hollandCode).directions;
}

// 降级模式下的通用 AI Tips 预置库
export const fallbackTips: Record<string, string[]> = {
  R: ['选择能"看到成果"的岗位，成就感会驱动你持续进步', '刻意练习沟通表达，技术+沟通是稀缺组合', '找一个允许试错的团队，实践是你最好的老师'],
  I: ['深度思考是你的超能力，但要记得"完成比完美重要"', '多参加行业交流，把研究成果转化为影响力', '设定短期可交付目标，避免陷入无限研究循环'],
  A: ['用作品说话——建立个人作品集比简历更有说服力', '学会在创意和约束之间找到平衡点', '把大创意拆解为可执行的小步骤，让想法落地'],
  S: ['助人时也要学会设定边界，避免过度消耗自己', '你的共情力是稀缺能力，善用但不要被定义', '主动寻找影响力更大的平台，放大你的助人效果'],
  E: ['领导力不只是发号施令，学会倾听会让团队更强', '在追求目标时，关注团队成员的感受和节奏', '找到值得长期投入的赛道，比频繁转向更有效'],
  C: ['你的规范性和可靠性是团队的压舱石', '尝试走出舒适区，偶尔的"不够完美"反而带来突破', '把流程优化的能力转化为可展示的成果'],
};

export function getFallbackTips(hollandCode: string): string[] {
  const firstLetter = hollandCode[0];
  return fallbackTips[firstLetter] || fallbackTips['I'];
}
