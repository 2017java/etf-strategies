/**
 * Keyword Coverage Check
 * Analyzes how well resume matches JD required skills
 */

import type { JDAnalysisResult } from '@/types';

export interface KeywordCoverageResult {
  matched: string[];
  missing: string[];
  coverageRate: number;
}

// Common weak verbs that should be replaced
const WEAK_VERBS = [
  '做了', '负责', '参与', '协助', '帮助', '完成',
  'did', 'responsible', 'participated', 'assisted', 'helped', 'completed',
];

// Strong action verbs for quantification
const STRONG_VERBS = [
  'achieved', 'increased', 'decreased', 'improved', 'reduced', 'led',
  'developed', 'designed', 'implemented', 'optimized', 'managed',
  '创建', '开发', '设计', '实现', '优化', '管理', '带领', '提升', '增长',
  '降低', '减少', '达成', '构建', '推出', '改进',
];

/**
 * Check keyword coverage between resume and JD
 * @param resumeText - Sanitized resume text
 * @param jdAnalysis - JD analysis result containing required skills
 * @returns Keyword coverage analysis
 */
export function checkKeywordCoverage(
  resumeText: string,
  jdAnalysis: JDAnalysisResult
): KeywordCoverageResult {
  const resumeLower = resumeText.toLowerCase();
  const matched: string[] = [];
  const missing: string[] = [];

  // Extract all required hard skills from JD
  const requiredSkills = jdAnalysis.hardSkills?.required || [];

  for (const skill of requiredSkills) {
    // Check if skill name or its variations appear in resume
    const variations = [
      skill.name,
      skill.name.toLowerCase(),
      skill.name.toUpperCase(),
      skill.name.replace(/[_\s-]/g, ''),
    ];

    const found = variations.some((variation) => {
      // Check for whole word match
      const regex = new RegExp(`\\b${escapeRegex(variation)}\\b`, 'i');
      return regex.test(resumeText) || resumeLower.includes(variation.toLowerCase());
    });

    if (found) {
      matched.push(skill.name);
    } else {
      missing.push(skill.name);
    }
  }

  // Also check soft skills
  const softSkills = jdAnalysis.softSkills || [];
  for (const softSkill of softSkills) {
    const keywordLower = softSkill.keyword.toLowerCase();
    if (resumeLower.includes(keywordLower)) {
      matched.push(softSkill.keyword);
    } else {
      missing.push(softSkill.keyword);
    }
  }

  // Calculate coverage rate
  const total = matched.length + missing.length;
  const coverageRate = total > 0 ? (matched.length / total) * 100 : 0;

  return {
    matched,
    missing,
    coverageRate: Math.round(coverageRate * 10) / 10,
  };
}

/**
 * Check for weak verbs in resume
 * @param resumeText - Resume text
 * @returns Array of weak verb issues
 */
export function findWeakVerbs(resumeText: string): { verb: string; context: string }[] {
  const issues: { verb: string; context: string }[] = [];
  const lines = resumeText.split('\n');

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    for (const verb of WEAK_VERBS) {
      if (trimmedLine.toLowerCase().includes(verb.toLowerCase())) {
        // Get surrounding context
        const start = Math.max(0, trimmedLine.indexOf(verb) - 20);
        const end = Math.min(trimmedLine.length, trimmedLine.indexOf(verb) + verb.length + 20);
        const context = '...' + trimmedLine.slice(start, end) + '...';

        issues.push({ verb, context });
        break; // Only report once per line
      }
    }
  }

  return issues;
}

/**
 * Check if resume uses strong action verbs
 * @param resumeText - Resume text
 * @returns Number of strong verb occurrences
 */
export function countStrongVerbs(resumeText: string): number {
  let count = 0;
  const lines = resumeText.split('\n');

  for (const line of lines) {
    for (const verb of STRONG_VERBS) {
      if (line.toLowerCase().includes(verb.toLowerCase())) {
        count++;
        break;
      }
    }
  }

  return count;
}

/**
 * Escape special regex characters in a string
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}