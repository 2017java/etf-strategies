export interface AssessmentQuestion {
  id: string;
  category: 'holland' | 'mbti' | 'softskill' | 'value';
  dimension: string;
  scenario: string;
  options?: string[];
  weight: number;
}

// Holland RIASEC: 30 题（每个维度 5 题）
const hollandQuestions: AssessmentQuestion[] = [
  // R - 实际型 (Realistic)
  { id: 'h-r1', category: 'holland', dimension: 'R', scenario: '比起讨论方案，我更享受动手把东西做出来的过程', weight: 1 },
  { id: 'h-r2', category: 'holland', dimension: 'R', scenario: '我对机械、工具或户外活动有天然的兴趣', weight: 1 },
  { id: 'h-r3', category: 'holland', dimension: 'R', scenario: '我喜欢明确的结果，而不是模糊的创意讨论', weight: 0.8 },
  { id: 'h-r4', category: 'holland', dimension: 'R', scenario: '我倾向于用实践行动来解决问题，而不是先想很久', weight: 0.9 },
  { id: 'h-r5', category: 'holland', dimension: 'R', scenario: '相比于坐在办公室，我更喜欢能看到具体成果的工作', weight: 0.8 },

  // I - 研究型 (Investigative)
  { id: 'h-i1', category: 'holland', dimension: 'I', scenario: '遇到不懂的问题，我会忍不住去深挖背后的原理', weight: 1 },
  { id: 'h-i2', category: 'holland', dimension: 'I', scenario: '我喜欢分析数据、做研究，从中发现规律', weight: 1 },
  { id: 'h-i3', category: 'holland', dimension: 'I', scenario: '我对学术讨论和理论探索感到兴奋', weight: 0.9 },
  { id: 'h-i4', category: 'holland', dimension: 'I', scenario: '我更愿意独立思考，而不是听从别人的经验', weight: 0.8 },
  { id: 'h-i5', category: 'holland', dimension: 'I', scenario: '我觉得解决一个复杂的智力难题比社交活动更有趣', weight: 0.8 },

  // A - 艺术型 (Artistic)
  { id: 'h-a1', category: 'holland', dimension: 'A', scenario: '我喜欢用创意的方式表达自己的想法', weight: 1 },
  { id: 'h-a2', category: 'holland', dimension: 'A', scenario: '我经常有天马行空的想法，并且享受把它们实现', weight: 0.9 },
  { id: 'h-a3', category: 'holland', dimension: 'A', scenario: '我对美学、设计或文学有浓厚的兴趣', weight: 1 },
  { id: 'h-a4', category: 'holland', dimension: 'A', scenario: '我反感按部就班的工作，更喜欢自由发挥的空间', weight: 0.8 },
  { id: 'h-a5', category: 'holland', dimension: 'A', scenario: '我享受用独特的视角去解读事物', weight: 0.9 },

  // S - 社会型 (Social)
  { id: 'h-s1', category: 'holland', dimension: 'S', scenario: '帮助别人解决问题让我感到有成就感', weight: 1 },
  { id: 'h-s2', category: 'holland', dimension: 'S', scenario: '我喜欢与人交流，善于倾听和理解他人的感受', weight: 1 },
  { id: 'h-s3', category: 'holland', dimension: 'S', scenario: '我更愿意在团队中工作，而不是独自完成任务', weight: 0.9 },
  { id: 'h-s4', category: 'holland', dimension: 'S', scenario: '我觉得教育和辅导他人是一件有意义的事', weight: 0.9 },
  { id: 'h-s5', category: 'holland', dimension: 'S', scenario: '我对别人的情绪变化很敏感，能共情他人的处境', weight: 0.8 },

  // E - 管理型 (Enterprising)
  { id: 'h-e1', category: 'holland', dimension: 'E', scenario: '我喜欢主导项目、做出决策和推动事情向前', weight: 1 },
  { id: 'h-e2', category: 'holland', dimension: 'E', scenario: '说服别人接受我的观点让我感到满足', weight: 0.9 },
  { id: 'h-e3', category: 'holland', dimension: 'E', scenario: '我对商业机会和创业想法有天生的敏感度', weight: 1 },
  { id: 'h-e4', category: 'holland', dimension: 'E', scenario: '我喜欢竞争，并且享受赢得挑战的感觉', weight: 0.8 },
  { id: 'h-e5', category: 'holland', dimension: 'E', scenario: '在压力下做决定，我反而更能发挥实力', weight: 0.9 },

  // C - 事务型 (Conventional)
  { id: 'h-c1', category: 'holland', dimension: 'C', scenario: '我喜欢有清晰流程和规范的工作环境', weight: 1 },
  { id: 'h-c2', category: 'holland', dimension: 'C', scenario: '整理数据、归档文件这类工作我觉得很有满足感', weight: 0.9 },
  { id: 'h-c3', category: 'holland', dimension: 'C', scenario: '我做事注重细节，追求准确和完整', weight: 1 },
  { id: 'h-c4', category: 'holland', dimension: 'C', scenario: '我更喜欢按照既定计划执行，而不是临时发挥', weight: 0.8 },
  { id: 'h-c5', category: 'holland', dimension: 'C', scenario: '有序和可预测的工作节奏让我感到安心', weight: 0.9 },
];

// MBTI 精简版: 8 题（每个维度对 2 题）
const mbtiQuestions: AssessmentQuestion[] = [
  // E/I
  { id: 'm-ei1', category: 'mbti', dimension: 'E', scenario: '参加聚会后我感觉精力充沛，而不是疲惫', weight: 1 },
  { id: 'm-ei2', category: 'mbti', dimension: 'E', scenario: '我习惯先和人聊起来，再思考自己的感受', weight: 0.9 },
  // S/N
  { id: 'm-sn1', category: 'mbti', dimension: 'S', scenario: '我更关注眼前的具体事实，而非未来的可能性', weight: 1 },
  { id: 'm-sn2', category: 'mbti', dimension: 'S', scenario: '我信任经过验证的经验，而不是直觉推测', weight: 0.9 },
  // T/F
  { id: 'm-tf1', category: 'mbti', dimension: 'T', scenario: '做决定时，逻辑分析比个人感受更重要', weight: 1 },
  { id: 'm-tf2', category: 'mbti', dimension: 'T', scenario: '即使会让别人不舒服，我也会坚持正确的做法', weight: 0.9 },
  // J/P
  { id: 'm-jp1', category: 'mbti', dimension: 'J', scenario: '我喜欢提前规划好一切，不喜欢临时变数', weight: 1 },
  { id: 'm-jp2', category: 'mbti', dimension: 'J', scenario: '完成任务给我带来的满足感大于享受过程', weight: 0.9 },
];

// 软技能情景题: 10 题（每个维度 2 题）
const softSkillQuestions: AssessmentQuestion[] = [
  // communication 沟通力
  { id: 's-com1', category: 'softskill', dimension: 'communication', scenario: '当团队意见分歧时，我能找到让各方都接受的方案', weight: 1 },
  { id: 's-com2', category: 'softskill', dimension: 'communication', scenario: '我擅长把复杂的概念用简单的话解释清楚', weight: 0.9 },
  // execution 执行力
  { id: 's-exec1', category: 'softskill', dimension: 'execution', scenario: '我制定的计划通常都能按时完成', weight: 1 },
  { id: 's-exec2', category: 'softskill', dimension: 'execution', scenario: '即使任务枯燥，我也能坚持做完不拖延', weight: 0.9 },
  // creativity 创造力
  { id: 's-cre1', category: 'softskill', dimension: 'creativity', scenario: '我经常能想到别人想不到的解决方案', weight: 1 },
  { id: 's-cre2', category: 'softskill', dimension: 'creativity', scenario: '面对限制和约束，反而更能激发我的创意', weight: 0.9 },
  // resilience 抗压性
  { id: 's-res1', category: 'softskill', dimension: 'resilience', scenario: '面对失败和挫折，我很快就能调整心态继续前进', weight: 1 },
  { id: 's-res2', category: 'softskill', dimension: 'resilience', scenario: '高压环境下我反而能更好地集中注意力', weight: 0.9 },
  // learning 学习力
  { id: 's-learn1', category: 'softskill', dimension: 'learning', scenario: '我对新知识和新技能有持续的好奇心和学习的热情', weight: 1 },
  { id: 's-learn2', category: 'softskill', dimension: 'learning', scenario: '我能快速掌握一个陌生领域的基础知识', weight: 0.9 },
];

// 价值观矩阵: 8 题（每个价值观维度 1-2 题）
const valueQuestions: AssessmentQuestion[] = [
  { id: 'v-sal1', category: 'value', dimension: 'salary', scenario: '高薪是我选择工作的首要考虑因素', weight: 1 },
  { id: 'v-sal2', category: 'value', dimension: 'salary', scenario: '我认为工作的回报应该和付出严格成正比', weight: 0.8 },
  { id: 'v-gro1', category: 'value', dimension: 'growth', scenario: '比起薪资，我更看重这份工作能否让我快速成长', weight: 1 },
  { id: 'v-gro2', category: 'value', dimension: 'growth', scenario: '我愿意为学习新技能的机会而接受较低的起薪', weight: 0.9 },
  { id: 'v-sta1', category: 'value', dimension: 'stability', scenario: '稳定的工作环境和可预见的职业路径对我很重要', weight: 1 },
  { id: 'v-cre1', category: 'value', dimension: 'creativity', scenario: '工作中的创造自由比组织地位更让我心动', weight: 1 },
  { id: 'v-inf1', category: 'value', dimension: 'influence', scenario: '我希望自己的工作能对社会产生积极的影响', weight: 1 },
  { id: 'v-inf2', category: 'value', dimension: 'influence', scenario: '成为某个领域的意见领袖是我的职业目标之一', weight: 0.8 },
];

export const allQuestions: AssessmentQuestion[] = [
  ...hollandQuestions,
  ...mbtiQuestions,
  ...softSkillQuestions,
  ...valueQuestions,
];

// 56 题按类别排序：holland → mbti → softskill → value
export function getShuffledQuestions(): AssessmentQuestion[] {
  return [...allQuestions];
}

export function getQuestionsByCategory(category: AssessmentQuestion['category']): AssessmentQuestion[] {
  return allQuestions.filter((q) => q.category === category);
}

export const QUESTION_COUNT = allQuestions.length; // 56
