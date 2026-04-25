// ═══════════════════════════════════════
// 知途 ZhiTu — 经历匹配算法
// ═══════════════════════════════════════

import type { UserProfile, JDAnalysisResult, GapItem } from '@/types';
import type { ExperienceMatchResult } from './types';

/**
 * Map industry to category for matching
 */
const INDUSTRY_CATEGORIES: Record<string, string[]> = {
  '互联网/科技': ['互联网', '科技', '软件', 'IT', '计算机', '电商', '游戏'],
  '金融/银行': ['金融', '银行', '保险', '证券', '投资', '基金', '风投'],
  '制造/工业': ['制造', '工业', '生产', '工厂', '机械', '汽车', '电子'],
  '教育/培训': ['教育', '培训', '学校', '机构', '咨询'],
  '医疗/健康': ['医疗', '健康', '医院', '医药', '生物'],
  '快消/零售': ['快消', '零售', '电商', '销售', '消费', '商贸'],
  '咨询/专业服务': ['咨询', '审计', '法律', '咨询公司', '专业服务'],
  '政府/公共事业': ['政府', '公共', '事业单位', '国企', '央企'],
  '媒体/文化': ['媒体', '文化', '广告', '传媒', '出版', '娱乐'],
};

/**
 * Normalize industry name for comparison
 */
function normalizeIndustry(industry: string): string {
  return industry.toLowerCase().replace(/\s+/g, '');
}

/**
 * Check if two industries match
 */
function industriesMatch(userIndustry: string, jdIndustryContext: string): boolean {
  const normalizedUser = normalizeIndustry(userIndustry);
  const normalizedJD = normalizeIndustry(jdIndustryContext);

  // Direct match
  if (normalizedUser === normalizedJD) return true;

  // Check category matches
  for (const [, categories] of Object.entries(INDUSTRY_CATEGORIES)) {
    const userMatchesCategory = categories.some((cat) => normalizedUser.includes(cat));
    const jdMatchesCategory = categories.some((cat) => normalizedJD.includes(cat));
    if (userMatchesCategory && jdMatchesCategory) return true;
  }

  // Cross-match
  if (normalizedUser.includes(normalizedJD) || normalizedJD.includes(normalizedUser)) {
    return true;
  }

  return false;
}

/**
 * Analyze JD for experience requirements
 */
function analyzeExperienceRequirement(jdAnalysis: JDAnalysisResult): {
  minimumYears: number;
  preferredYears?: number;
  requiredIndustries: string[];
  fresherOK: boolean;
} {
  const summary = jdAnalysis.summary.toLowerCase();
  const hiddenReqs = jdAnalysis.hiddenRequirements.join(' ').toLowerCase();
  const combined = summary + ' ' + hiddenReqs;

  // Extract years requirement
  let minimumYears = 0;
  let preferredYears: number | undefined;

  // Look for patterns like "3年以上", "1-3年", etc.
  const yearPatterns = [
    /(\d+)\+?\s*年/i,
    /(\d+)\s*-\s*(\d+)\s*年/i,
    /不少于(\d+)\s*年/i,
    /至少(\d+)\s*年/i,
  ];

  for (const pattern of yearPatterns) {
    const match = combined.match(pattern);
    if (match) {
      if (match.length === 2) {
        minimumYears = parseInt(match[1], 10);
      } else if (match.length === 3) {
        minimumYears = parseInt(match[1], 10);
        preferredYears = parseInt(match[2], 10);
      }
      break;
    }
  }

  // Infer industry relevance from JD content
  const requiredIndustries: string[] = [];
  for (const industry of Object.keys(INDUSTRY_CATEGORIES)) {
    if (combined.includes(industry) || combined.includes(industry.split('/')[0])) {
      requiredIndustries.push(industry);
    }
  }

  // Check if fresher-friendly
  const fresherOK = jdAnalysis.fresherFriendly >= 2 || combined.includes('应届') || combined.includes('无经验') || combined.includes('经验不限');

  // For freshers, minimum years is 0
  if (fresherOK && minimumYears > 0) {
    minimumYears = 0;
  }

  return {
    minimumYears,
    preferredYears: preferredYears || (minimumYears > 0 ? minimumYears + 1 : undefined),
    requiredIndustries,
    fresherOK,
  };
}

/**
 * Convert experience count to years (assuming 1 experience = 6 months avg)
 */
function experienceCountToYears(count: number): number {
  return count * 0.5;
}

/**
 * Calculate experience match between user profile and JD requirements
 */
export function calculateExperienceMatch(
  profile: UserProfile,
  jdAnalysis: JDAnalysisResult
): ExperienceMatchResult {
  const userYears = experienceCountToYears(profile.experienceCount);
  const requirement = analyzeExperienceRequirement(jdAnalysis);

  // Calculate count score
  let countScore: number;
  if (requirement.minimumYears === 0) {
    // No experience required
    countScore = profile.experienceCount > 0 ? 100 : 80;
  } else if (userYears >= (requirement.preferredYears || requirement.minimumYears)) {
    countScore = 100;
  } else if (userYears >= requirement.minimumYears) {
    countScore = 75;
  } else {
    // Below minimum
    countScore = Math.max(30, Math.round((userYears / requirement.minimumYears) * 60));
  }

  // Calculate industry match score
  let industryMatchScore = 100;
  const matchedIndustries: string[] = [];

  if (requirement.requiredIndustries.length > 0) {
    let matched = 0;
    for (const userIndustry of profile.experienceIndustries) {
      for (const requiredIndustry of requirement.requiredIndustries) {
        if (industriesMatch(userIndustry, requiredIndustry)) {
          matched++;
          if (!matchedIndustries.includes(userIndustry)) {
            matchedIndustries.push(userIndustry);
          }
          break;
        }
      }
    }

    if (profile.experienceIndustries.length > 0) {
      industryMatchScore = Math.round((matched / requirement.requiredIndustries.length) * 100);
    } else {
      industryMatchScore = 50; // No industry experience, moderate penalty
    }
  }

  // Combine scores (70% count, 30% industry relevance)
  const matchScore = Math.round(countScore * 0.7 + industryMatchScore * 0.3);

  return {
    matchScore: Math.min(100, matchScore),
    experienceCount: profile.experienceCount,
    industryMatchScore,
    matchedIndustries,
  };
}

/**
 * Generate experience gap items
 */
export function generateExperienceGaps(
  profile: UserProfile,
  jdAnalysis: JDAnalysisResult
): GapItem[] {
  const result = calculateExperienceMatch(profile, jdAnalysis);
  const requirement = analyzeExperienceRequirement(jdAnalysis);
  const gaps: GapItem[] = [];

  if (result.matchScore >= 80) {
    return [];
  }

  // Experience count gap
  if (requirement.minimumYears > 0 && experienceCountToYears(profile.experienceCount) < requirement.minimumYears) {
    gaps.push({
      dimension: 'experience',
      current: `${profile.experienceCount}段实习/项目经历`,
      required: `${requirement.minimumYears}年以上相关经历`,
      gap: `经历数量不足，建议补充${requirement.minimumYears - experienceCountToYears(profile.experienceCount)}年以上经历`,
      priority: 'high',
    });
  } else if (result.industryMatchScore < 70) {
    gaps.push({
      dimension: 'experience',
      current: `涉及 ${profile.experienceIndustries.join('、')} 行业`,
      required: `有 ${requirement.requiredIndustries.join('、')} 行业经验优先`,
      gap: `缺少相关行业经验，建议补充目标行业的实习`,
      priority: 'medium',
    });
  }

  return gaps;
}

/**
 * Get recommended experience actions
 */
export function getExperienceActions(
  profile: UserProfile,
  jdAnalysis: JDAnalysisResult
): { action: string; resource: string; estimatedWeeks: number }[] {
  const result = calculateExperienceMatch(profile, jdAnalysis);
  const requirement = analyzeExperienceRequirement(jdAnalysis);
  const actions: { action: string; resource: string; estimatedWeeks: number }[] = [];

  if (result.matchScore >= 85) {
    return [];
  }

  // Suggest internship
  if (experienceCountToYears(profile.experienceCount) < requirement.minimumYears) {
    const neededMonths = (requirement.minimumYears - experienceCountToYears(profile.experienceCount)) * 12;
    actions.push({
      action: `寻找${requirement.requiredIndustries[0] || '相关行业'}实习机会`,
      resource: '实习平台: 实习僧、BOSS直聘、牛客网',
      estimatedWeeks: Math.ceil(neededMonths * 4),
    });
  }

  // Suggest industry-relevant experience
  if (result.industryMatchScore < 80 && requirement.requiredIndustries.length > 0) {
    actions.push({
      action: `获取${requirement.requiredIndustries[0]}行业经验`,
      resource: '行业研究、项目实践、志愿者活动',
      estimatedWeeks: 12,
    });
  }

  return actions;
}
