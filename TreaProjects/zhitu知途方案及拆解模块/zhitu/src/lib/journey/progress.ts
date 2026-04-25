// ═══════════════════════════════════════
// 知途 ZhiTu — 旅程进度计算
// 基于 M5 文档 SBTI 模式
// ═══════════════════════════════════════

import {
  getAssessmentResults,
  getJDAnalyses,
  getMatchReports,
  getResumeAnalyses,
} from '@/lib/storage';

const DEFAULT_USER_ID = 'default-user';

// ── 旅程阶段定义 ──

/**
 * 旅程阶段枚举
 * 0: 尚未开始
 * 1: 星图探索者 - 完成性格测评
 * 2: 方向确认者 - 解读 2+ 份 JD
 * 3: 差距研判者 - 完成匹配分析
 * 4: 简历炼金师 / 求职冠军 - 简历评估 ≥70 分 (完成全流程)
 */
export enum JourneyStage {
  NOT_STARTED = 0,
  STAR_MAP_EXPLORER = 1,     // 完成性格测评
  DIRECTION_CONFIRMER = 2,   // 解读 2+ 份 JD
  GAP_ANALYST = 3,           // 完成匹配分析
  RESUME_ALCHEMIST = 4,      // 简历评估 ≥70 分 (求职冠军)
}

// ── 用户旅程统计 ──

export interface UserJourneyStats {
  assessmentCount: number;
  jdAnalysisCount: number;
  matchReportCount: number;
  bestResumeScore: number;
}

/**
 * 从 IndexedDB 聚合用户旅程统计数据
 * SSR 安全：服务端环境直接返回默认值
 */
export async function getUserJourneyStats(userId: string = DEFAULT_USER_ID): Promise<UserJourneyStats> {
  // SSR 安全检查
  if (typeof window === 'undefined') {
    return {
      assessmentCount: 0,
      jdAnalysisCount: 0,
      matchReportCount: 0,
      bestResumeScore: 0,
    };
  }

  try {
    const [assessmentResults, jdAnalyses, matchReports, resumeAnalyses] = await Promise.all([
      getAssessmentResults(userId),
      getJDAnalyses(userId),
      getMatchReports(userId),
      getResumeAnalyses(userId),
    ]);

    // 计算最高简历得分
    const bestResumeScore = resumeAnalyses.length > 0
      ? Math.max(...resumeAnalyses.map((r) => r.overallScore))
      : 0;

    return {
      assessmentCount: assessmentResults.length,
      jdAnalysisCount: jdAnalyses.length,
      matchReportCount: matchReports.length,
      bestResumeScore,
    };
  } catch (error) {
    console.error('[JourneyProgress] Failed to get user journey stats:', error);
    return {
      assessmentCount: 0,
      jdAnalysisCount: 0,
      matchReportCount: 0,
      bestResumeScore: 0,
    };
  }
}

/**
 * 计算用户当前旅程阶段
 * 基于 M5 文档 SBTI 模式
 *
 * @param stats 用户旅程统计数据
 * @returns 旅程阶段 (0-4)
 */
export function calculateJourneyStage(stats: UserJourneyStats): number {
  let stage = JourneyStage.NOT_STARTED;

  // 阶段 1: 完成性格测评
  if (stats.assessmentCount > 0) {
    stage = Math.max(stage, JourneyStage.STAR_MAP_EXPLORER);
  }

  // 阶段 2: 解读 2+ 份 JD
  if (stats.jdAnalysisCount >= 2) {
    stage = Math.max(stage, JourneyStage.DIRECTION_CONFIRMER);
  }

  // 阶段 3: 完成匹配分析
  if (stats.matchReportCount > 0) {
    stage = Math.max(stage, JourneyStage.GAP_ANALYST);
  }

  // 阶段 4: 简历评估 ≥70 分 (求职冠军 - 完成全流程)
  if (stats.bestResumeScore >= 70) {
    stage = Math.max(stage, JourneyStage.RESUME_ALCHEMIST);
  }

  // 返回值限制在 0-4 范围内
  return Math.min(stage, JourneyStage.RESUME_ALCHEMIST);
}

/**
 * 获取旅程阶段名称
 */
export function getJourneyStageName(stage: number): string {
  const stageNames: Record<number, string> = {
    [JourneyStage.NOT_STARTED]: '未开始',
    [JourneyStage.STAR_MAP_EXPLORER]: '星图探索者',
    [JourneyStage.DIRECTION_CONFIRMER]: '方向确认者',
    [JourneyStage.GAP_ANALYST]: '差距研判者',
    [JourneyStage.RESUME_ALCHEMIST]: '简历炼金师（求职冠军）',
  };
  return stageNames[stage] || stageNames[JourneyStage.NOT_STARTED];
}

/**
 * 获取旅程进度百分比
 * @param stage 0-4
 * @returns 0-100
 */
export function getJourneyProgressPercent(stage: number): number {
  // 总共 5 个阶段 (0-4)
  return Math.round((stage / 4) * 100);
}

/**
 * 检查特定阶段是否已解锁
 */
export function isStageUnlocked(stats: UserJourneyStats, targetStage: number): boolean {
  return calculateJourneyStage(stats) >= targetStage;
}
