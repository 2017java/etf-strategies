// ═══════════════════════════════════════
// 知途 ZhiTu — 学历匹配算法
// ═══════════════════════════════════════

import type { UserProfile, JDAnalysisResult, GapItem } from '@/types';
import type { EducationMatchResult, EducationLevel } from './types';
import { EDUCATION_SCORES } from './types';

/**
 * Analyze JD for education requirements
 * Returns the minimum expected education level based on JD content
 */
function analyzeEducationRequirement(jdAnalysis: JDAnalysisResult): {
  minimumLevel: EducationLevel;
  preferredLevel?: EducationLevel;
  strictness: 'strict' | 'prefered' | 'flexible';
} {
  const summary = jdAnalysis.summary.toLowerCase();
  const hiddenRequirements = jdAnalysis.hiddenRequirements.join(' ').toLowerCase();

  // Check for strict education requirements in hidden requirements
  if (hiddenRequirements.includes('985') || hiddenRequirements.includes('211优先')) {
    return { minimumLevel: '211', preferredLevel: '985', strictness: 'strict' };
  }
  if (hiddenRequirements.includes('硕士') || hiddenRequirements.includes('研究生')) {
    return { minimumLevel: '211', preferredLevel: '985', strictness: 'prefered' };
  }
  if (hiddenRequirements.includes('本科以上') || hiddenRequirements.includes('本科及以上')) {
    return { minimumLevel: '双非', preferredLevel: '211', strictness: 'prefered' };
  }

  // Check summary for keywords
  if (summary.includes('985') || summary.includes('211优先') || summary.includes('顶尖学府')) {
    return { minimumLevel: '211', preferredLevel: '985', strictness: 'prefered' };
  }
  if (summary.includes('硕士') || summary.includes('研究生')) {
    return { minimumLevel: '211', preferredLevel: '211', strictness: 'flexible' };
  }
  if (summary.includes('本科') || summary.includes('学士')) {
    return { minimumLevel: '专科', preferredLevel: '双非', strictness: 'flexible' };
  }
  if (summary.includes('大专') || summary.includes('专科')) {
    return { minimumLevel: '专科', preferredLevel: '专科', strictness: 'flexible' };
  }

  // Fresh/entry level positions are usually flexible
  if (jdAnalysis.fresherFriendly >= 3) {
    return { minimumLevel: '专科', preferredLevel: '双非', strictness: 'flexible' };
  }

  // Default to a moderate requirement
  return { minimumLevel: '双非', preferredLevel: '211', strictness: 'flexible' };
}

/**
 * Get education level numeric score
 */
function getEducationScore(level: EducationLevel): number {
  return EDUCATION_SCORES[level] ?? 60;
}

/**
 * Calculate education match between user profile and JD requirements
 *
 * @param profile - User's profile with education level
 * @param jdAnalysis - JD analysis result
 * @returns EducationMatchResult with detailed matching information
 */
export function calculateEducationMatch(
  profile: UserProfile,
  jdAnalysis: JDAnalysisResult
): EducationMatchResult {
  const userLevel = profile.educationLevel;
  const userScore = getEducationScore(userLevel);

  const requirement = analyzeEducationRequirement(jdAnalysis);
  const minimumScore = getEducationScore(requirement.minimumLevel);

  // Calculate match score
  let matchScore: number;
  let gapDescription: string | undefined;

  if (userScore >= getEducationScore(requirement.preferredLevel ?? requirement.minimumLevel)) {
    // User exceeds or meets preferred level
    matchScore = 100;
    gapDescription = undefined;
  } else if (userScore >= minimumScore) {
    // User meets minimum requirement
    if (requirement.strictness === 'strict') {
      // Strict mode: meeting minimum is not enough
      matchScore = 70;
      gapDescription = `岗位偏好${requirement.preferredLevel}背景，您目前为${userLevel}`;
    } else {
      // Flexible mode: meeting minimum is acceptable
      matchScore = 85;
      gapDescription = `建议提升学历至${requirement.preferredLevel || requirement.minimumLevel}以增强竞争力`;
    }
  } else {
    // User below minimum requirement
    matchScore = Math.max(30, Math.round((userScore / minimumScore) * 60));
    gapDescription = `该岗位要求${requirement.minimumLevel}及以上学历，您目前为${userLevel}`;
  }

  // Adjust based on strictness
  if (requirement.strictness === 'strict' && matchScore < 100) {
    matchScore = Math.max(40, matchScore - 20);
  }

  return {
    matchScore: Math.min(100, Math.round(matchScore)),
    currentLevel: userLevel,
    gapDescription,
  };
}

/**
 * Generate education gap items for the action plan
 */
export function generateEducationGaps(
  profile: UserProfile,
  jdAnalysis: JDAnalysisResult
): GapItem[] {
  const result = calculateEducationMatch(profile, jdAnalysis);
  const requirement = analyzeEducationRequirement(jdAnalysis);

  if (result.matchScore >= 85) {
    return [];
  }

  const gaps: GapItem[] = [];

  if (result.matchScore < 70) {
    gaps.push({
      dimension: 'education',
      current: `${result.currentLevel}学历`,
      required: `${requirement.minimumLevel}及以上学历`,
      gap: result.gapDescription || `学历未达到岗位最低要求`,
      priority: 'high',
    });
  } else {
    gaps.push({
      dimension: 'education',
      current: `${result.currentLevel}学历`,
      required: `${requirement.preferredLevel || requirement.minimumLevel}学历更有竞争力`,
      gap: result.gapDescription || `建议提升学历背景`,
      priority: 'medium',
    });
  }

  return gaps;
}

/**
 * Get recommended education actions
 */
export function getEducationActions(
  profile: UserProfile,
  jdAnalysis: JDAnalysisResult
): { action: string; resource: string; estimatedWeeks: number }[] {
  const result = calculateEducationMatch(profile, jdAnalysis);
  const requirement = analyzeEducationRequirement(jdAnalysis);

  if (result.matchScore >= 90) {
    return [];
  }

  const actions: { action: string; resource: string; estimatedWeeks: number }[] = [];

  if (result.matchScore < 70) {
    actions.push({
      action: `获取${requirement.minimumLevel}及以上学历`,
      resource: '考研/专升本相关信息',
      estimatedWeeks: 104, // ~2 years
    });
  } else {
    // Suggest improving with certifications or skills to compensate
    actions.push({
      action: '通过高含金量证书弥补学历差距',
      resource: 'CPA、CFA、PMP等职业资格证书',
      estimatedWeeks: 26,
    });
    actions.push({
      action: '积累高质量实习经验',
      resource: '名企实习机会',
      estimatedWeeks: 12,
    });
  }

  return actions;
}
