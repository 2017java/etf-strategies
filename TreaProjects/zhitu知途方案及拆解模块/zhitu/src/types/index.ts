// ═══════════════════════════════════════
// 知途 ZhiTu — 全局类型定义
// ═══════════════════════════════════════

// ── M1: 职业星图测评 ──

export interface AssessmentQuestion {
  id: string;
  category: 'holland' | 'mbti' | 'softskill' | 'value';
  dimension: string;
  scenario: string;
  options?: string[];
  weight: number;
}

export interface AssessmentAnswer {
  questionId: string;
  value: number; // -1, 0, 1
}

export interface AssessmentResult {
  hollandCode: string;
  hollandScores: Record<string, number>;
  mbtiType: string;
  softSkillRadar: Record<string, number>;
  valueRanking?: string[];
  topCareers: CareerDirection[];
  aiTips?: string;
  completedAt: string;
}

export interface CareerDirection {
  name: string;
  matchScore: number;
  reason: string;
}

// ── M2: JD 智能解读 ──

export interface JDAnalysisResult {
  summary: string;
  hardSkills: {
    required: SkillItem[];
    niceToHave: SkillItem[];
  };
  softSkills: SoftSkillItem[];
  careerPath: {
    year1: string;
    year3: string;
    year5: string;
  };
  hiddenRequirements: string[];
  fresherFriendly: 1 | 2 | 3;
  analysisMode: 'ai' | 'keyword';
  jobTitle?: string;
}

export interface SkillItem {
  name: string;
  shortTermLearnable: boolean;
  priority: 'high' | 'medium' | 'low';
}

export interface SoftSkillItem {
  keyword: string;
  concreteBehavior: string;
}

// ── M3: 岗位匹配度分析 ──

export interface UserProfile {
  educationLevel: '985' | '211' | '双非' | '专科' | '海外';
  majorCategory: string;
  skills: string[];
  experienceCount: number;
  experienceIndustries: string[];
  certificates: string[];
  competitions: string[];
  softSkillSelfRating: Record<string, number>;
}

export interface MatchResult {
  totalScore: number;
  dimensionScores: {
    education: number;
    skills: number;
    experience: number;
    softSkills: number;
    certifications: number;
  };
  gaps: GapItem[];
  actionPlan: ActionItem[];
  timeline: string;
  radarData: RadarDataPoint[];
}

export interface GapItem {
  dimension: string;
  current: string;
  required: string;
  gap: string;
  priority: 'high' | 'medium' | 'low';
}

export interface ActionItem {
  gapDimension: string;
  action: string;
  resource: string;
  estimatedWeeks: number;
  priority: 'high' | 'medium' | 'low';
}

export interface RadarDataPoint {
  dimension: string;
  score: number;
  fullMark: number;
}

// ── M4: 简历智能优化 ──

export interface ResumeAnalysisResult {
  overallScore: number;
  dimensionScores: {
    format: number;
    content: number;
    keywords: number;
    quantification: number;
    structure: number;
  };
  keywordCoverage: {
    matched: string[];
    missing: string[];
    coverageRate: number;
  };
  issues: ResumeIssue[];
  topSuggestions: Suggestion[];
  rewriteExamples: RewriteExample[];
  analysisMode: 'ai' | 'keyword';
}

export interface ResumeIssue {
  type: 'keyword_missing' | 'no_quantify' | 'no_star' | 'redundant' | 'weak_verb';
  location: string;
  originalText: string;
  severity: 'high' | 'medium' | 'low';
  suggestion: string;
}

export interface RewriteExample {
  original: string;
  optimized: string;
  reason: string;
}

export interface Suggestion {
  priority: number;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
}

// ── M5: 旅程进度 ──

export interface JourneyProgress {
  stage: number; // 0-4
  assessmentCount: number;
  jdAnalysisCount: number;
  matchReportCount: number;
  bestResumeScore: number;
  updatedAt: string;
}

// ── 通用 ──

export interface StoredItem<T> {
  id: string;
  userId: string;
  data: T;
  createdAt: string;
}
