/**
 * Quantification Expression Check
 * Identifies verb phrases missing numbers/quantifiers
 */

import type { ResumeIssue } from '@/types';

/**
 * Common achievement verbs that typically should have quantification
 */
const ACHIEVEMENT_VERBS = [
  'increased', 'decreased', 'improved', 'reduced', 'optimized',
  'achieved', 'led', 'managed', 'developed', 'designed', 'implemented',
  'created', 'delivered', 'launched', 'grew', 'expanded',
  '提升', '增长', '减少', '降低', '改进', '优化', '达成', '实现',
  '创建', '开发', '设计', '实现', '推出', '增长', '扩展', '管理',
  '负责', '带领', '带领团队', '构建', '搭建',
];

/**
 * Check for quantification issues in resume
 * Looks for achievement statements without numbers
 * @param resumeText - Resume text
 * @returns Array of quantification issues
 */
export function checkQuantification(resumeText: string): ResumeIssue[] {
  const issues: ResumeIssue[] = [];
  const lines = resumeText.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Check if line contains an achievement verb but no numbers
    const hasAchievementVerb = ACHIEVEMENT_VERBS.some((verb) =>
      line.toLowerCase().includes(verb.toLowerCase())
    );

    if (hasAchievementVerb) {
      // Check if line has any quantification
      const hasNumber = /\d+[%万元人刀个点批次年个月天]/.test(line);
      const hasPercentage = /%/.test(line);
      const hasRange = /\d+[-~]\d+/.test(line);

      if (!hasNumber && !hasPercentage && !hasRange) {
        // This might be a weak quantification
        issues.push({
          type: 'no_quantify',
          location: `Line ${i + 1}`,
          originalText: line,
          severity: 'medium',
          suggestion: '尝试添加具体数字或百分比来量化成果，例如：提升XX%、增长XX、减少XX时间',
        });
      }
    }
  }

  return issues;
}

/**
 * Find specific quantification opportunities
 * More targeted than checkQuantification
 * @param resumeText - Resume text
 * @returns Array of suggestions for better quantification
 */
export function findQuantificationOpportunities(
  resumeText: string
): Array<{ text: string; suggestion: string }> {
  const opportunities: Array<{ text: string; suggestion: string }> = [];
  const lines = resumeText.split('\n');

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Pattern: verb followed by noun without number
    const weakPatterns = [
      /(负责|管理|开发|设计|实现|完成|提升|改进)[^\d，。,]+$/i,
      /(responsible for|managed|developed|designed|implemented|completed|improved)[^\d,.]+$/i,
    ];

    for (const pattern of weakPatterns) {
      const match = trimmedLine.match(pattern);
      if (match) {
        opportunities.push({
          text: trimmedLine,
          suggestion: `建议量化：${trimmedLine} → 可以添加具体数值（如：效率提升40%、管理5人团队）`,
        });
        break;
      }
    }
  }

  return opportunities;
}

/**
 * Extract quantifiable achievements from text
 * @param resumeText - Resume text
 * @returns Array of already quantified statements
 */
export function extractQuantifiedAchievements(
  resumeText: string
): string[] {
  const achievements: string[] = [];
  const lines = resumeText.split('\n');

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Look for lines with numbers and achievement verbs
    const hasNumber = /\d+/.test(trimmedLine);
    const hasAchievementVerb = ACHIEVEMENT_VERBS.some((verb) =>
      trimmedLine.toLowerCase().includes(verb.toLowerCase())
    );

    if (hasNumber && hasAchievementVerb) {
      achievements.push(trimmedLine);
    }
  }

  return achievements;
}