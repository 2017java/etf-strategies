// ═══════════════════════════════════════
// 知途 ZhiTu — M3 AI 增强Gap分析
// ═══════════════════════════════════════

import { z } from 'zod';
import { callAI } from '@/lib/ai';
import { calculateMatchScore } from './calculate';
import type {
  UserProfile,
  JDAnalysisResult,
  AssessmentResult,
  GapItem,
  ActionItem,
} from '@/types';

// ── Zod Schemas ──

const GapItemSchema = z.object({
  dimension: z.string(),
  current: z.string(),
  required: z.string(),
  gap: z.string(),
  priority: z.enum(['high', 'medium', 'low']),
});

const ActionItemSchema = z.object({
  gapDimension: z.string(),
  action: z.string(),
  resource: z.string(),
  estimatedWeeks: z.number().min(1).max(12),
  priority: z.enum(['high', 'medium', 'low']),
});

const MatchAnalysisSchema = z.object({
  gaps: z.array(GapItemSchema).min(3).max(8),
  actionPlan: z.array(ActionItemSchema).min(5),
  timeline: z.string(),
  encouragement: z.string(),
});

export type MatchAnalysisResult = z.infer<typeof MatchAnalysisSchema>;

// ── System Prompt ──

const SYSTEM_PROMPT = `你是一位资深的职业发展教练，同时具备技术招聘和人才发展经验。你的任务是根据用户的画像信息和目标岗位的 JD 解读结果，分析差距并生成可执行的改进计划。

## 输入数据
1. 用户画像：学历、专业、技能、经历、证书、软技能评分
2. JD 解读结果：硬技能要求、软技能要求、隐性要求、应届友好度
3. 测评结果：Holland Code、MBTI、软技能雷达图

## 输出要求（严格 JSON 格式）

{
  "gaps": [
    {
      "dimension": "string - 差距维度（skills/experience/education/certification/softskill）",
      "current": "string - 用户当前水平描述",
      "required": "string - 岗位要求描述",
      "gap": "string - 差距说明",
      "priority": "high|medium|low"
    }
  ],
  "actionPlan": [
    {
      "gapDimension": "string - 关联的差距维度",
      "action": "string - 具体可执行的行动步骤",
      "resource": "string - 推荐学习资源，优先免费资源（B站/Coursera/GitHub/LeetCode）",
      "estimatedWeeks": number,
      "priority": "high|medium|low"
    }
  ],
  "timeline": "string - 总体预计补齐时间描述，如'集中突击8-12周可达到基本匹配水平'",
  "encouragement": "string - 一句鼓励的话，结合用户优势来说"
}

## 约束
1. gaps 至少 3 项，最多 8 项
2. actionPlan 至少 5 项，每项必须具体到"做什么"而非"学什么"
3. resource 必须提供具体资源名（如"B站XX课程"而非"在线学习"）
4. estimatedWeeks 必须合理：单个 action 不超过 12 周
5. priority 排序原则：高影响+低难度 = high
6. 只输出 JSON，禁止 markdown 格式`;

// ── Prompt Builder ──

function buildUserPrompt(
  profile: UserProfile,
  jdAnalysis: JDAnalysisResult,
  assessmentResult?: AssessmentResult
): string {
  const parts: string[] = [];

  // User Profile
  parts.push('## 用户画像');
  parts.push(`- 学历：${profile.educationLevel} | 专业：${profile.majorCategory}`);
  parts.push(`- 技能：${profile.skills.join(', ') || '暂无'}`);
  parts.push(`- 经历数量：${profile.experienceCount}段 | 涉及行业：${profile.experienceIndustries.join(', ') || '暂无'}`);
  parts.push(`- 证书：${profile.certificates.join(', ') || '暂无'}`);
  parts.push(`- 软技能自评：${Object.entries(profile.softSkillSelfRating).map(([k, v]) => `${k}(${v}/5)`).join(', ') || '暂无'}`);

  // JD Analysis
  parts.push('\n## 目标岗位 JD 解读');
  parts.push(`岗位摘要：${jdAnalysis.summary}`);
  parts.push(`- 必需硬技能：${jdAnalysis.hardSkills.required.map((s) => s.name).join(', ') || '暂无'}`);
  parts.push(`- 加分硬技能：${jdAnalysis.hardSkills.niceToHave.map((s) => s.name).join(', ') || '暂无'}`);
  parts.push(`- 软技能要求：${jdAnalysis.softSkills.map((s) => s.keyword).join(', ') || '暂无'}`);
  parts.push(`- 隐性要求：${jdAnalysis.hiddenRequirements.join(', ') || '暂无'}`);
  parts.push(`- 应届友好度：${'★'.repeat(jdAnalysis.fresherFriendly)}${'☆'.repeat(3 - jdAnalysis.fresherFriendly)} (${jdAnalysis.fresherFriendly}/3)`);
  if (jdAnalysis.jobTitle) {
    parts.push(`- 岗位名称：${jdAnalysis.jobTitle}`);
  }

  // Assessment Result (if available)
  if (assessmentResult) {
    parts.push('\n## 测评结果');
    parts.push(`- Holland Code：${assessmentResult.hollandCode}`);
    parts.push(`- MBTI：${assessmentResult.mbtiType}`);
    parts.push(`- 软技能雷达：${Object.entries(assessmentResult.softSkillRadar).map(([k, v]) => `${k}(${v}/100)`).join(', ')}`);
    if (assessmentResult.topCareers?.length) {
      parts.push(`- 推荐职业方向：${assessmentResult.topCareers.map((c) => `${c.name}(匹配${c.matchScore}%)`).join(', ')}`);
    }
  }

  parts.push('\n请基于以上信息，输出 JSON 格式的差距分析和改进计划。');

  return parts.join('\n');
}

// ── Fallback ──

async function fallbackAnalysis(
  profile: UserProfile,
  jdAnalysis: JDAnalysisResult,
  assessmentResult?: AssessmentResult
): Promise<MatchAnalysisResult> {
  const matchResult = calculateMatchScore(profile, jdAnalysis, assessmentResult);

  // Convert MatchResult.gaps to MatchAnalysisResult format
  const gaps: GapItem[] = matchResult.gaps;

  // Ensure we have at least 3 gaps
  const paddedGaps = [...gaps];
  if (paddedGaps.length < 3) {
    // Add generic gaps to meet minimum
    const needed = 3 - paddedGaps.length;
    for (let i = 0; i < needed; i++) {
      paddedGaps.push({
        dimension: 'skills',
        current: '有相关基础',
        required: '持续学习和实践',
        gap: '需要进一步深入学习',
        priority: 'low',
      });
    }
  }

  // Ensure actionPlan has at least 5 items
  const actions: ActionItem[] = matchResult.actionPlan;
  const paddedActions = [...actions];
  if (paddedActions.length < 5) {
    // Add generic actions to meet minimum
    const needed = 5 - paddedActions.length;
    for (let i = 0; i < needed; i++) {
      paddedActions.push({
        gapDimension: 'skills',
        action: '持续练习和项目实践',
        resource: 'GitHub、LeetCode、B站',
        estimatedWeeks: 8,
        priority: 'medium',
      });
    }
  }

  // Build encouragement based on total score
  let encouragement: string;
  if (matchResult.totalScore >= 80) {
    encouragement = '你的简历已经非常匹配这个岗位！继续保持优势，有针对性地弥补小差距即可。';
  } else if (matchResult.totalScore >= 60) {
    encouragement = '你具备岗位所需的核心能力，通过系统的学习和实践完全可以弥补差距，加油！';
  } else {
    encouragement = '虽然差距存在，但你独特的背景和经历正是你的优势，制定计划并坚持执行，机会属于有准备的人！';
  }

  return {
    gaps: paddedGaps.slice(0, 8),
    actionPlan: paddedActions.slice(0, 10),
    timeline: matchResult.timeline,
    encouragement,
  };
}

// ── Main Function ──

/**
 * Generate AI-enhanced match analysis with gap detection and action plan.
 * Falls back to template-based analysis if AI call fails.
 *
 * @param profile - User's profile
 * @param jdAnalysis - JD analysis result from M2
 * @param assessmentResult - Optional M1 assessment result
 * @returns MatchAnalysisResult with gaps, actionPlan, timeline, encouragement
 */
export async function generateMatchAnalysis(
  profile: UserProfile,
  jdAnalysis: JDAnalysisResult,
  assessmentResult?: AssessmentResult
): Promise<MatchAnalysisResult> {
  const systemPrompt = SYSTEM_PROMPT;
  const userPrompt = buildUserPrompt(profile, jdAnalysis, assessmentResult);

  try {
    const result = await callAI<MatchAnalysisResult>({
      prompt: userPrompt,
      systemPrompt,
      responseSchema: MatchAnalysisSchema,
      timeout: 15000,
      fallback: () => fallbackAnalysis(profile, jdAnalysis, assessmentResult),
    });

    return result;
  } catch (error) {
    console.warn('generateMatchAnalysis: AI call failed, using fallback:', (error as Error).message);
    return fallbackAnalysis(profile, jdAnalysis, assessmentResult);
  }
}
