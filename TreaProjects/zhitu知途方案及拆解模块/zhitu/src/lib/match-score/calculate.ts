// ═══════════════════════════════════════
// 知途 ZhiTu — 匹配度计算引擎
// ═══════════════════════════════════════

import type {
  UserProfile,
  MatchResult,
  GapItem,
  ActionItem,
  RadarDataPoint,
  JDAnalysisResult,
  AssessmentResult,
} from '@/types';

import { SCORE_WEIGHTS, SOFT_SKILL_PRESETS } from './types';
import { calculateSkillMatch, calculatePriorityWeightedSkillMatch } from './skill-match';
import { calculateEducationMatch, generateEducationGaps, getEducationActions } from './education-match';
import { calculateExperienceMatch, generateExperienceGaps, getExperienceActions } from './experience-match';

/**
 * Calculate certification match score
 */
function calculateCertificationMatch(
  certificates: string[],
  jdAnalysis: JDAnalysisResult
): { matchScore: number; matched: string[]; unmatched: string[] } {
  // Map common certificates to their categories
  const CERT_CATEGORIES: Record<string, string[]> = {
    '金融': ['注册会计师(CPA)', '金融特许分析师(CFA)', '会计从业', '初级会计'],
    '财务': ['会计从业', '初级会计', '注册会计师(CPA)'],
    '项目管理': ['PMP', 'Scrum Master'],
    '语言': ['英语四级', '英语六级', '英语雅思', '英语托福'],
    'IT': ['计算机二级', '计算机三级'],
    '教育': ['教师资格证'],
  };

  // Infer required certificates from JD
  const summary = jdAnalysis.summary.toLowerCase();
  const hiddenReqs = jdAnalysis.hiddenRequirements.join(' ').toLowerCase();
  const combined = summary + ' ' + hiddenReqs;

  const relevantCerts: string[] = [];
  for (const [category, certs] of Object.entries(CERT_CATEGORIES)) {
    if (combined.includes(category)) {
      relevantCerts.push(...certs);
    }
  }

  // Default: no specific certificates required
  if (relevantCerts.length === 0) {
    // Check for generic requirements
    if (combined.includes('证书') || combined.includes('资格')) {
      // Some certificates recommended
      const matchScore = certificates.length > 0 ? 80 : 50;
      return { matchScore, matched: [], unmatched: relevantCerts };
    }
    return { matchScore: 100, matched: certificates, unmatched: [] };
  }

  // Calculate match
  const matched = certificates.filter((cert) => relevantCerts.includes(cert));
  const unmatched = relevantCerts.filter((cert) => !certificates.includes(cert));

  const matchScore = relevantCerts.length > 0
    ? Math.round((matched.length / relevantCerts.length) * 100)
    : 100;

  return { matchScore, matched, unmatched };
}

/**
 * Calculate soft skills match score
 */
function calculateSoftSkillsMatch(
  profileSoftSkills: Record<string, number>,
  jdSoftSkills: JDAnalysisResult['softSkills']
): { matchScore: number; matched: Record<string, number>; unmatched: string[] } {
  // If user has no self-rating, return moderate score
  if (Object.keys(profileSoftSkills).length === 0) {
    return { matchScore: 65, matched: {}, unmatched: jdSoftSkills.map((s) => s.keyword) };
  }

  const matched: Record<string, number> = {};
  const unmatched: string[] = [];

  for (const jdSkill of jdSoftSkills) {
    const jdKeyword = jdSkill.keyword.toLowerCase();

    // Find matching self-rating skill
    let found = false;
    for (const [selfSkill, rating] of Object.entries(profileSoftSkills)) {
      const selfKeyword = selfSkill.toLowerCase();
      if (
        selfKeyword === jdKeyword ||
        selfKeyword.includes(jdKeyword) ||
        jdKeyword.includes(selfKeyword)
      ) {
        matched[selfSkill] = rating;
        found = true;
        break;
      }
    }

    if (!found) {
      unmatched.push(jdSkill.keyword);
    }
  }

  // Calculate score: average of matched skills (on 1-5 scale converted to 100)
  let matchScore = 65; // default
  if (Object.keys(matched).length > 0) {
    const avgRating = Object.values(matched).reduce((a, b) => a + b, 0) / Object.values(matched).length;
    matchScore = Math.round((avgRating / 5) * 100);
  }

  return { matchScore, matched, unmatched };
}

/**
 * Calculate overall soft skills score (for radar chart)
 */
function calculateSoftSkillsDimensionScore(
  profileSoftSkills: Record<string, number>,
  jdSoftSkills: JDAnalysisResult['softSkills']
): number {
  const { matchScore } = calculateSoftSkillsMatch(profileSoftSkills, jdSoftSkills);
  return matchScore;
}

/**
 * Generate gap items from all dimensions
 */
function generateAllGaps(
  profile: UserProfile,
  jdAnalysis: JDAnalysisResult,
  skillMatchResult: ReturnType<typeof calculateSkillMatch>,
  educationScore: number,
  experienceScore: number,
  certificationScore: number,
  softSkillsScore: number
): GapItem[] {
  const gaps: GapItem[] = [];

  // Education gaps
  const educationGaps = generateEducationGaps(profile, jdAnalysis);
  gaps.push(...educationGaps);

  // Skill gaps (from unmatched required skills)
  if (skillMatchResult.unmatchedRequired.length > 0) {
    gaps.push({
      dimension: 'skills',
      current: `已掌握 ${skillMatchResult.matchedRequired.length} 项必需技能`,
      required: `需要掌握: ${skillMatchResult.unmatchedRequired.join(', ')}`,
      gap: `缺少 ${skillMatchResult.unmatchedRequired.length} 项核心技能`,
      priority: 'high',
    });
  }

  if (skillMatchResult.unmatchedNiceToHave.length > 0 && skillMatchResult.unmatchedRequired.length === 0) {
    gaps.push({
      dimension: 'skills',
      current: `已掌握全部必需技能`,
      required: `建议补充: ${skillMatchResult.unmatchedNiceToHave.join(', ')}`,
      gap: `建议学习 ${skillMatchResult.unmatchedNiceToHave.length} 项加分技能`,
      priority: 'medium',
    });
  }

  // Experience gaps
  const experienceGaps = generateExperienceGaps(profile, jdAnalysis);
  gaps.push(...experienceGaps);

  // Certification gaps
  const certResult = calculateCertificationMatch(profile.certificates, jdAnalysis);
  if (certResult.unmatched.length > 0 && certificationScore < 70) {
    gaps.push({
      dimension: 'certifications',
      current: `已获得 ${certResult.matched.length} 项相关证书`,
      required: `建议考取: ${certResult.unmatched.join(', ')}`,
      gap: `缺少 ${certResult.unmatched.length} 项可能有帮助的证书`,
      priority: 'medium',
    });
  }

  // Soft skills gaps
  const softResult = calculateSoftSkillsMatch(profile.softSkillSelfRating, jdAnalysis.softSkills);
  if (softResult.unmatched.length > 0 && softSkillsScore < 70) {
    gaps.push({
      dimension: 'softSkills',
      current: `已自评 ${Object.keys(softResult.matched).length} 项软技能`,
      required: `需要提升: ${softResult.unmatched.join(', ')}`,
      gap: `${softResult.unmatched.length} 项软技能需要加强`,
      priority: 'medium',
    });
  }

  // Sort by priority
  gaps.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return gaps;
}

/**
 * Generate action plan from gaps
 */
function generateActionPlan(
  gaps: GapItem[],
  profile: UserProfile,
  jdAnalysis: JDAnalysisResult,
  skillMatchResult: ReturnType<typeof calculateSkillMatch>
): ActionItem[] {
  const actions: ActionItem[] = [];

  // Add skill learning actions
  for (const skill of skillMatchResult.unmatchedRequired) {
    actions.push({
      gapDimension: 'skills',
      action: `学习 ${skill}`,
      resource: '在线课程: 慕课网、极客时间、Bilibili',
      estimatedWeeks: 8,
      priority: 'high',
    });
  }

  // Add nice-to-have skill actions
  for (const skill of skillMatchResult.unmatchedNiceToHave.slice(0, 3)) {
    actions.push({
      gapDimension: 'skills',
      action: `了解 ${skill}`,
      resource: '官方文档、教程视频',
      estimatedWeeks: 4,
      priority: 'medium',
    });
  }

  // Add education actions
  const educationActions = getEducationActions(profile, jdAnalysis);
  for (const eduAction of educationActions) {
    actions.push({
      gapDimension: 'education',
      action: eduAction.action,
      resource: eduAction.resource,
      estimatedWeeks: eduAction.estimatedWeeks,
      priority: 'high',
    });
  }

  // Add experience actions
  const experienceActions = getExperienceActions(profile, jdAnalysis);
  for (const expAction of experienceActions) {
    actions.push({
      gapDimension: 'experience',
      action: expAction.action,
      resource: expAction.resource,
      estimatedWeeks: expAction.estimatedWeeks,
      priority: expAction.estimatedWeeks > 12 ? 'high' : 'medium',
    });
  }

  // Add certification actions
  const certResult = calculateCertificationMatch(profile.certificates, jdAnalysis);
  for (const cert of certResult.unmatched.slice(0, 2)) {
    actions.push({
      gapDimension: 'certifications',
      action: `考取 ${cert}`,
      resource: '官方报名网站、备考资料',
      estimatedWeeks: 12,
      priority: 'medium',
    });
  }

  // Add soft skill actions
  const softResult = calculateSoftSkillsMatch(profile.softSkillSelfRating, jdAnalysis.softSkills);
  for (const skill of softResult.unmatched.slice(0, 2)) {
    actions.push({
      gapDimension: 'softSkills',
      action: `提升 ${skill}`,
      resource: '实践练习、相关书籍',
      estimatedWeeks: 8,
      priority: 'medium',
    });
  }

  // Remove duplicates and limit to top 10
  const uniqueActions = actions.filter(
    (action, index, self) =>
      index === self.findIndex((a) => a.action === action.action)
  );

  return uniqueActions.slice(0, 10);
}

/**
 * Calculate timeline estimate based on action plan
 */
function calculateTimeline(actions: ActionItem[]): string {
  if (actions.length === 0) {
    return '您的简历已接近岗位要求，继续保持！';
  }

  // Find longest high priority action
  const highPriorityActions = actions.filter((a) => a.priority === 'high');
  const maxWeeks = Math.max(
    ...highPriorityActions.map((a) => a.estimatedWeeks),
    ...actions.map((a) => a.estimatedWeeks).slice(0, 2)
  );

  if (maxWeeks <= 4) {
    return '1个月内可完成主要提升';
  } else if (maxWeeks <= 12) {
    return '1-3个月可完成主要提升';
  } else if (maxWeeks <= 26) {
    return '3-6个月可完成主要提升';
  } else if (maxWeeks <= 52) {
    return '6-12个月可完成主要提升';
  } else {
    return '需要1年以上持续努力';
  }
}

/**
 * Generate radar data for visualization
 */
function generateRadarData(
  scores: MatchResult['dimensionScores']
): RadarDataPoint[] {
  return [
    { dimension: '学历', score: scores.education, fullMark: 100 },
    { dimension: '技能', score: scores.skills, fullMark: 100 },
    { dimension: '经历', score: scores.experience, fullMark: 100 },
    { dimension: '软技能', score: scores.softSkills, fullMark: 100 },
    { dimension: '证书', score: scores.certifications, fullMark: 100 },
  ];
}

/**
 * Main calculation function: Calculate match score between user profile and JD
 *
 * @param profile - User's profile
 * @param jdAnalysis - JD analysis result from M2
 * @param assessmentResult - Optional M1 assessment result for soft skills prefill
 * @returns MatchResult with detailed scoring and action plan
 */
export function calculateMatchScore(
  profile: UserProfile,
  jdAnalysis: JDAnalysisResult,
  assessmentResult?: AssessmentResult
): MatchResult {
  // 1. Calculate skill match
  const skillMatchResult = calculateSkillMatch(profile.skills, jdAnalysis.hardSkills);
  const skillScore = calculatePriorityWeightedSkillMatch(profile.skills, jdAnalysis.hardSkills);

  // 2. Calculate education match
  const educationResult = calculateEducationMatch(profile, jdAnalysis);
  const educationScore = educationResult.matchScore;

  // 3. Calculate experience match
  const experienceResult = calculateExperienceMatch(profile, jdAnalysis);
  const experienceScore = experienceResult.matchScore;

  // 4. Calculate certification match
  const certResult = calculateCertificationMatch(profile.certificates, jdAnalysis);
  const certificationScore = certResult.matchScore;

  // 5. Calculate soft skills match
  // Use assessment result for prefill if available and user hasn't self-rated
  const softSkillsProfile = Object.keys(profile.softSkillSelfRating).length > 0
    ? profile.softSkillSelfRating
    : assessmentResult?.softSkillRadar
      ? Object.fromEntries(
          Object.entries(assessmentResult.softSkillRadar).map(([k, v]) => [
            SOFT_SKILL_PRESETS.find((p) => p.toLowerCase().includes(k.toLowerCase())) || k,
            Math.round(v / 20), // Convert 100-scale to 5-scale
          ])
        )
      : {};

  const softSkillsScore = calculateSoftSkillsDimensionScore(softSkillsProfile, jdAnalysis.softSkills);

  // Build dimension scores
  const dimensionScores: MatchResult['dimensionScores'] = {
    education: educationScore,
    skills: skillScore,
    experience: experienceScore,
    softSkills: softSkillsScore,
    certifications: certificationScore,
  };

  // 6. Calculate weighted total score
  const totalScore = Math.round(
    dimensionScores.education * SCORE_WEIGHTS.education +
    dimensionScores.skills * SCORE_WEIGHTS.skills +
    dimensionScores.experience * SCORE_WEIGHTS.experience +
    dimensionScores.softSkills * SCORE_WEIGHTS.softSkills +
    dimensionScores.certifications * SCORE_WEIGHTS.certifications
  );

  // 7. Generate gaps
  const gaps = generateAllGaps(
    profile,
    jdAnalysis,
    skillMatchResult,
    educationScore,
    experienceScore,
    certificationScore,
    softSkillsScore
  );

  // 8. Generate action plan
  const actionPlan = generateActionPlan(gaps, profile, jdAnalysis, skillMatchResult);

  // 9. Calculate timeline
  const timeline = calculateTimeline(actionPlan);

  // 10. Generate radar data
  const radarData = generateRadarData(dimensionScores);

  return {
    totalScore,
    dimensionScores,
    gaps,
    actionPlan,
    timeline,
    radarData,
  };
}

/**
 * Quick score calculation (lighter version without full gap analysis)
 */
export function calculateQuickScore(
  profile: UserProfile,
  jdAnalysis: JDAnalysisResult
): { totalScore: number; dimensionScores: MatchResult['dimensionScores'] } {
  const skillScore = calculatePriorityWeightedSkillMatch(profile.skills, jdAnalysis.hardSkills);
  const educationScore = calculateEducationMatch(profile, jdAnalysis).matchScore;
  const experienceScore = calculateExperienceMatch(profile, jdAnalysis).matchScore;
  const certScore = calculateCertificationMatch(profile.certificates, jdAnalysis).matchScore;
  const softSkillsScore = calculateSoftSkillsDimensionScore(profile.softSkillSelfRating, jdAnalysis.softSkills);

  const dimensionScores: MatchResult['dimensionScores'] = {
    education: educationScore,
    skills: skillScore,
    experience: experienceScore,
    softSkills: softSkillsScore,
    certifications: certScore,
  };

  const totalScore = Math.round(
    dimensionScores.education * SCORE_WEIGHTS.education +
    dimensionScores.skills * SCORE_WEIGHTS.skills +
    dimensionScores.experience * SCORE_WEIGHTS.experience +
    dimensionScores.softSkills * SCORE_WEIGHTS.softSkills +
    dimensionScores.certifications * SCORE_WEIGHTS.certifications
  );

  return { totalScore, dimensionScores };
}
