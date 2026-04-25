/**
 * STAR Structure Check
 * Validates that experience descriptions follow STAR format
 * (Situation, Task, Action, Result)
 */

import type { ResumeIssue } from '@/types';

/**
 * STAR component keywords
 */
const STAR_KEYWORDS = {
  situation: [
    '在...期间', '当时', '面临', '面对', '作为', '加入',
    'during', 'when', 'facing', 'as a', 'joined',
  ],
  task: [
    '负责', '需要', '要', '目标', '任务',
    'responsible for', 'needed to', 'goal was', 'task was', 'mission',
  ],
  action: [
    '通过', '使用', '采用', '开发', '设计', '实施', '完成', '带领',
    'achieved by', 'using', 'through', 'by', 'developed', 'designed', 'implemented',
  ],
  result: [
    '结果', '成果', '提升', '增长', '减少', '获得', '达到',
    'resulted in', 'achieved', 'increased', 'decreased', 'improved', 'reduced', 'gained',
  ],
};

/**
 * Weak action verbs that don't demonstrate impact
 */
const WEAK_VERBS = [
  '做了', '参与', '协助', '帮助', '学习', '了解', '熟悉',
  'participated', 'assisted', 'helped', 'learned', 'understood',
];

/**
 * Check STAR structure in resume experience descriptions
 * @param resumeText - Resume text
 * @returns Array of STAR structure issues
 */
export function checkSTAR(resumeText: string): ResumeIssue[] {
  const issues: ResumeIssue[] = [];
  const lines = resumeText.split('\n');

  let inExperienceSection = false;
  let experienceLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim().toLowerCase();

    // Detect experience section start
    if (
      line.includes('experience') ||
      line.includes('工作经历') ||
      line.includes('职业经历')
    ) {
      inExperienceSection = true;
      continue;
    }

    // Detect section end (next major section)
    if (
      line.includes('education') ||
      line.includes('教育') ||
      line.includes('skills') ||
      line.includes('技能')
    ) {
      if (experienceLines.length > 0) {
        // Analyze collected experience lines
        const lineIssues = analyzeSTARInLines(experienceLines, i - experienceLines.length);
        issues.push(...lineIssues);
        experienceLines = [];
      }
      inExperienceSection = false;
      continue;
    }

    if (inExperienceSection) {
      experienceLines.push(lines[i]);
    }
  }

  // Analyze last section if still in experience
  if (experienceLines.length > 0) {
    const lineIssues = analyzeSTARInLines(experienceLines, lines.length - experienceLines.length);
    issues.push(...lineIssues);
  }

  return issues;
}

/**
 * Analyze STAR structure in a set of lines
 */
function analyzeSTARInLines(
  lines: string[],
  startIndex: number
): ResumeIssue[] {
  const issues: ResumeIssue[] = [];
  const text = lines.join('\n');

  // Check for missing Result component
  const hasResult = STAR_KEYWORDS.result.some((keyword) =>
    text.toLowerCase().includes(keyword.toLowerCase())
  );

  if (!hasResult) {
    // Find the longest line (likely the main achievement)
    const mainLine = lines.reduce((longest, line) =>
      line.length > longest.length ? line : longest,
      ''
    );

    if (mainLine.length > 30) {
      issues.push({
        type: 'no_star',
        location: `Experience section (around line ${startIndex + 1})`,
        originalText: mainLine,
        severity: 'high',
        suggestion: '建议添加结果/成果描述，例如：实现了XX%的提升、获得了XX成果',
      });
    }
  }

  // Check for weak verbs
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    for (const weakVerb of WEAK_VERBS) {
      if (line.toLowerCase().includes(weakVerb.toLowerCase())) {
        issues.push({
          type: 'weak_verb',
          location: `Line ${startIndex + i + 1}`,
          originalText: line,
          severity: 'medium',
          suggestion: `建议使用更有力的动词，例如：将"${weakVerb}"替换为"实现"、"达成"、"推动"等`,
        });
        break;
      }
    }
  }

  // Check for missing numbers in achievement context
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const hasAchievementVerb = [
      'increased', 'decreased', 'improved', 'reduced', 'optimized',
      'achieved', 'developed', 'designed', 'implemented', 'created',
      '提升', '增长', '减少', '改进', '优化', '实现', '开发', '设计', '创建',
    ].some((verb) => line.toLowerCase().includes(verb.toLowerCase()));

    if (hasAchievementVerb) {
      const hasNumber = /\d+/.test(line);
      if (!hasNumber) {
        issues.push({
          type: 'no_quantify',
          location: `Line ${startIndex + i + 1}`,
          originalText: line,
          severity: 'medium',
          suggestion: '建议添加具体数字来量化成果',
        });
      }
    }
  }

  return issues;
}

/**
 * Generate STAR-based rewrite suggestions
 * @param originalLine - Original experience description
 * @returns Suggested rewrite with STAR structure
 */
export function suggestSTARRewrite(originalLine: string): string {
  const suggestions: string[] = [];

  // Check Situation
  const hasSituation = STAR_KEYWORDS.situation.some((kw) =>
    originalLine.toLowerCase().includes(kw.toLowerCase())
  );
  if (!hasSituation) {
    suggestions.push('[情境] 当时面临...');
  }

  // Check Task
  const hasTask = STAR_KEYWORDS.task.some((kw) =>
    originalLine.toLowerCase().includes(kw.toLowerCase())
  );
  if (!hasTask) {
    suggestions.push('[任务] 需要解决...');
  }

  // Check Action
  const hasAction = STAR_KEYWORDS.action.some((kw) =>
    originalLine.toLowerCase().includes(kw.toLowerCase())
  );
  if (!hasAction) {
    suggestions.push('[行动] 通过...方式');
  }

  // Check Result
  const hasResult = STAR_KEYWORDS.result.some((kw) =>
    originalLine.toLowerCase().includes(kw.toLowerCase())
  );
  if (!hasResult) {
    suggestions.push('[结果] 实现了XX%提升');
  }

  return suggestions.length > 0
    ? `建议补充：${suggestions.join(' → ')}`
    : '结构完整，建议强化动词和量化数据';
}