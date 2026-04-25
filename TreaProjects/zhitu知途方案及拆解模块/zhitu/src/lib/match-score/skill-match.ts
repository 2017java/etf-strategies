// ═══════════════════════════════════════
// 知途 ZhiTu — 技能匹配算法
// ═══════════════════════════════════════

import type { SkillItem } from '@/types';
import type { SkillMatchResult } from './types';

/**
 * Normalize skill name for comparison
 * Handles common variations and partial matches
 */
function normalizeSkillName(skill: string): string {
  return skill
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[（）()]/g, '');
}

/**
 * Check if two skill names match (with fuzzy matching support)
 */
function skillsMatch(userSkill: string, jdSkill: string): boolean {
  const normalizedUser = normalizeSkillName(userSkill);
  const normalizedJD = normalizeSkillName(jdSkill);

  // Exact match
  if (normalizedUser === normalizedJD) return true;

  // Partial match (one contains the other)
  if (normalizedUser.includes(normalizedJD) || normalizedJD.includes(normalizedUser)) {
    return true;
  }

  // Common aliases/variations
  const aliases: Record<string, string[]> = {
    'python': ['python', 'python3'],
    'java': ['java', 'javaee', 'javase'],
    'javascript': ['javascript', 'js', 'ecmascript'],
    'react': ['react', 'reactjs', 'react.js'],
    'vue': ['vue', 'vuejs', 'vue.js'],
    'node.js': ['node.js', 'nodejs', 'node'],
    'mysql': ['mysql', 'mariadb'],
    'sql': ['sql', 'mysql', 'postgresql', 'oracle', 'sqlserver'],
    'ppt': ['ppt', 'powerpoint', 'powerpoint制作', 'ppt制作'],
    'excel': ['excel', 'microsoftexcel', 'excel表格'],
    'cad': ['cad', 'autocad'],
    '数据分析': ['数据分析'],
    'ppt制作': ['ppt制作', 'powerpoint', 'ppt'],
  };

  const jdAliases = aliases[normalizedJD] || [];
  const userAliases = aliases[normalizedUser] || [];

  // Check if any alias matches
  if (jdAliases.includes(normalizedUser) || userAliases.includes(normalizedJD)) {
    return true;
  }

  // Check cross-aliases
  for (const alias of jdAliases) {
    if (userAliases.includes(alias)) return true;
  }

  return false;
}

/**
 * Calculate skill match score between user skills and JD requirements
 *
 * @param userSkills - Array of user's skills
 * @param jdHardSkills - JD hard skills with required and niceToHave categories
 * @returns SkillMatchResult with detailed matching information
 */
export function calculateSkillMatch(
  userSkills: string[],
  jdHardSkills: { required: SkillItem[]; niceToHave: SkillItem[] }
): SkillMatchResult {
  const normalizedUserSkills = userSkills.map((s) => normalizeSkillName(s));

  // Match required skills
  const matchedRequired: string[] = [];
  const unmatchedRequired: string[] = [];

  for (const skillItem of jdHardSkills.required) {
    const jdSkillName = normalizeSkillName(skillItem.name);
    const found = normalizedUserSkills.some((userSkill) => skillsMatch(userSkill, jdSkillName));

    if (found) {
      matchedRequired.push(skillItem.name);
    } else {
      unmatchedRequired.push(skillItem.name);
    }
  }

  // Match nice-to-have skills
  const matchedNiceToHave: string[] = [];
  const unmatchedNiceToHave: string[] = [];

  for (const skillItem of jdHardSkills.niceToHave) {
    const jdSkillName = normalizeSkillName(skillItem.name);
    const found = normalizedUserSkills.some((userSkill) => skillsMatch(userSkill, jdSkillName));

    if (found) {
      matchedNiceToHave.push(skillItem.name);
    } else {
      unmatchedNiceToHave.push(skillItem.name);
    }
  }

  // Calculate score
  // Required skills: 70% weight, each skill contributes equally
  // Nice-to-have skills: 30% weight (bonus points)
  const requiredWeight = 0.7;
  const niceToHaveWeight = 0.3;

  const requiredCount = jdHardSkills.required.length;
  const niceToHaveCount = jdHardSkills.niceToHave.length;

  // Base score from required skills
  const requiredScore =
    requiredCount > 0
      ? (matchedRequired.length / requiredCount) * 100 * requiredWeight
      : requiredWeight * 100; // If no required skills, give full base score

  // Bonus score from nice-to-have skills
  const niceToHaveScore =
    niceToHaveCount > 0
      ? (matchedNiceToHave.length / niceToHaveCount) * 100 * niceToHaveWeight
      : 0;

  // Scale niceToHaveScore to be relative to the max possible (70% + 30%)
  // If niceToHaveCount is 0, niceToHaveScore = 0
  // If niceToHaveCount > 0, niceToHaveScore contributes up to 30 points
  const matchScore = Math.min(100, Math.round(requiredScore + niceToHaveScore));

  return {
    matchScore,
    matchedRequired,
    matchedNiceToHave,
    unmatchedRequired,
    unmatchedNiceToHave,
  };
}

/**
 * Get priority-weighted skill match score
 * Higher priority skills from JD contribute more to the score
 */
export function calculatePriorityWeightedSkillMatch(
  userSkills: string[],
  jdHardSkills: { required: SkillItem[]; niceToHave: SkillItem[] }
): number {
  const normalizedUserSkills = userSkills.map((s) => normalizeSkillName(s));

  let totalWeight = 0;
  let matchedWeight = 0;

  // Process required skills
  for (const skillItem of jdHardSkills.required) {
    const priorityWeight = skillItem.priority === 'high' ? 3 : skillItem.priority === 'medium' ? 2 : 1;
    totalWeight += priorityWeight;

    const jdSkillName = normalizeSkillName(skillItem.name);
    const found = normalizedUserSkills.some((userSkill) => skillsMatch(userSkill, jdSkillName));

    if (found) {
      matchedWeight += priorityWeight;
    }
  }

  // Process nice-to-have skills (half weight)
  for (const skillItem of jdHardSkills.niceToHave) {
    const priorityWeight = skillItem.priority === 'high' ? 1.5 : skillItem.priority === 'medium' ? 1 : 0.5;
    totalWeight += priorityWeight;

    const jdSkillName = normalizeSkillName(skillItem.name);
    const found = normalizedUserSkills.some((userSkill) => skillsMatch(userSkill, jdSkillName));

    if (found) {
      matchedWeight += priorityWeight;
    }
  }

  return totalWeight > 0 ? Math.round((matchedWeight / totalWeight) * 100) : 100;
}
