// ═══════════════════════════════════════
// 知途 ZhiTu — 匹配度计算引擎类型定义
// ═══════════════════════════════════════

import type { GapItem } from '@/types';

// Re-export all M3 types from global types
export type {
  UserProfile,
  MatchResult,
  ActionItem,
  RadarDataPoint,
} from '@/types';

// Re-export GapItem explicitly
export type { GapItem };

// Re-export JDAnalysisResult and SkillItem from M2
export type { JDAnalysisResult, SkillItem, SoftSkillItem } from '@/types';

// Re-export AssessmentResult from M1
export type { AssessmentResult } from '@/types';

// ── Score Weights ──

export const SCORE_WEIGHTS = {
  education: 0.20,
  skills: 0.35,
  experience: 0.25,
  softSkills: 0.15,
  certifications: 0.05,
} as const;

export type ScoreDimension = keyof typeof SCORE_WEIGHTS;

// ── Education Level Mapping ──

export const EDUCATION_LEVELS = ['985', '211', '双非', '专科', '海外'] as const;
export type EducationLevel = (typeof EDUCATION_LEVELS)[number];

export const EDUCATION_SCORES: Record<EducationLevel, number> = {
  '985': 95,
  '211': 85,
  '双非': 70,
  '专科': 55,
  '海外': 80,
};

// ── Skill Category Presets ──

export const SKILL_PRESETS: Record<string, string[]> = {
  '互联网/科技': ['Python', 'Java', 'JavaScript', 'React', 'Vue', 'Node.js', 'MySQL', 'Redis', 'Docker', 'Git', 'API'],
  '金融/银行': ['财务分析', 'Excel', '风险控制', '数据分析', '金融建模', 'SQL', 'PPT制作'],
  '制造/工业': ['CAD', 'SolidWorks', 'PLC', '质量管理', '工艺流程', '机械设计'],
  '教育/培训': ['教学设计', '课程开发', '教学方法', 'PPT制作', '班级管理'],
  '医疗/健康': ['临床诊断', '病历书写', '护理操作', '医学知识', '药品知识'],
  '快消/零售': ['市场调研', '活动策划', '销售技巧', '客户关系', '数据分析'],
  '咨询/专业服务': ['数据分析', 'PPT制作', '调研访谈', '战略规划', 'Excel'],
  '政府/公共事业': ['公文写作', '政策研究', '行政管理', '组织协调', '办公软件'],
};

// ── Certificate Presets ──

export const CERTIFICATE_PRESETS = [
  '英语四级',
  '英语六级',
  '英语雅思',
  '英语托福',
  '计算机二级',
  '计算机三级',
  '教师资格证',
  '会计从业',
  '初级会计',
  '注册会计师(CPA)',
  '金融特许分析师(CFA)',
  'PMP',
  'Scrum Master',
] as const;

// ── Industry Presets ──

export const INDUSTRY_PRESETS = [
  '互联网/科技',
  '金融/银行',
  '制造/工业',
  '教育/培训',
  '医疗/健康',
  '快消/零售',
  '咨询/专业服务',
  '政府/公共事业',
  '媒体/文化',
  '其他',
] as const;

// ── Soft Skills Presets ──

export const SOFT_SKILL_PRESETS = [
  '沟通能力',
  '团队协作',
  '学习能力',
  '抗压能力',
  '责任心',
  '逻辑思维',
  '创新思维',
  '执行力',
  '问题解决',
  '细心严谨',
] as const;

// ── Internal Calculation Types ──

export interface DimensionScoreResult {
  dimension: ScoreDimension;
  score: number;
  maxScore: number;
  gaps: GapItem[];
}

export interface SkillMatchResult {
  matchScore: number;
  matchedRequired: string[];
  matchedNiceToHave: string[];
  unmatchedRequired: string[];
  unmatchedNiceToHave: string[];
}

export interface EducationMatchResult {
  matchScore: number;
  currentLevel: EducationLevel;
  gapDescription?: string;
}

export interface ExperienceMatchResult {
  matchScore: number;
  experienceCount: number;
  industryMatchScore: number;
  matchedIndustries: string[];
}

export interface CertificationMatchResult {
  matchScore: number;
  matchedCertificates: string[];
  unmatchedCertificates: string[];
}

export interface SoftSkillMatchResult {
  matchScore: number;
  matchedSkills: Record<string, number>;
  unmatchedSkills: string[];
}
