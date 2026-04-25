import { allQuestions } from './questions';
import {
  getCareerDirections,
  getFallbackTips,
} from './holland-map';
import type { AssessmentAnswer, AssessmentResult } from '@/types';

// Helper: build question lookup map
function buildQuestionMap() {
  const map = new Map<string, { category: string; dimension: string; weight: number }>();
  allQuestions.forEach((q) => {
    map.set(q.id, { category: q.category, dimension: q.dimension, weight: q.weight });
  });
  return map;
}

// ── Holland RIASEC 评分 ──

function calculateHolland(
  answers: AssessmentAnswer[],
  qMap: ReturnType<typeof buildQuestionMap>
): {
  hollandCode: string;
  hollandScores: Record<string, number>;
} {
  const dimensionScores: Record<string, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

  answers.forEach((answer) => {
    const q = qMap.get(answer.questionId);
    if (q && q.category === 'holland') {
      dimensionScores[q.dimension] += answer.value * q.weight;
    }
  });

  const maxScore = Math.max(...Object.values(dimensionScores), 1);
  const normalized: Record<string, number> = {};
  Object.keys(dimensionScores).forEach((k) => {
    normalized[k] = Math.round((dimensionScores[k] / maxScore) * 100);
  });

  const sorted = Object.entries(normalized).sort(([, a], [, b]) => b - a);
  const hollandCode = sorted
    .slice(0, 3)
    .map(([k]) => k)
    .join('');

  return { hollandCode, hollandScores: normalized };
}

// ── MBTI 评分 ──

function calculateMBTI(
  answers: AssessmentAnswer[],
  qMap: ReturnType<typeof buildQuestionMap>
): string {
  const dimensions: Record<string, number> = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
  const oppositeMap: Record<string, string> = { E: 'I', S: 'N', T: 'F', J: 'P' };

  answers.forEach((answer) => {
    const q = qMap.get(answer.questionId);
    if (q && q.category === 'mbti') {
      const dim = q.dimension;
      const opposite = oppositeMap[dim];

      if (answer.value > 0) {
        dimensions[dim] += answer.value * q.weight;
      } else if (answer.value < 0) {
        dimensions[opposite] += Math.abs(answer.value) * q.weight;
      }
    }
  });

  return [
    dimensions.E >= dimensions.I ? 'E' : 'I',
    dimensions.S >= dimensions.N ? 'S' : 'N',
    dimensions.T >= dimensions.F ? 'T' : 'F',
    dimensions.J >= dimensions.P ? 'J' : 'P',
  ].join('');
}

// ── 软技能评分 ──

function calculateSoftSkills(
  answers: AssessmentAnswer[],
  qMap: ReturnType<typeof buildQuestionMap>
): Record<string, number> {
  const dims = ['communication', 'execution', 'creativity', 'resilience', 'learning'];
  const scores: Record<string, number> = {};
  const counts: Record<string, number> = {};

  dims.forEach((d) => {
    scores[d] = 0;
    counts[d] = 0;
  });

  answers.forEach((answer) => {
    const q = qMap.get(answer.questionId);
    if (q && q.category === 'softskill') {
      const dim = q.dimension;
      scores[dim] += (answer.value + 2) * q.weight;
      counts[dim] += q.weight;
    }
  });

  dims.forEach((d) => {
    const maxPossible = counts[d] * 3 || 1;
    scores[d] = Math.round((scores[d] / maxPossible) * 100);
  });

  return scores;
}

// ── 价值观排序 ──

export function calculateValueRanking(
  answers: AssessmentAnswer[],
  qMap: ReturnType<typeof buildQuestionMap>
): string[] {
  const scores: Record<string, number> = {};

  answers.forEach((answer) => {
    const q = qMap.get(answer.questionId);
    if (q && q.category === 'value') {
      const dim = q.dimension;
      scores[dim] = (scores[dim] || 0) + (answer.value + 2) * q.weight;
    }
  });

  return Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .map(([k]) => k);
}

// ── 主评分函数 ──

export function calculateAssessment(answers: AssessmentAnswer[]): AssessmentResult {
  const qMap = buildQuestionMap();

  const { hollandCode, hollandScores } = calculateHolland(answers, qMap);
  const mbtiType = calculateMBTI(answers, qMap);
  const softSkillScores = calculateSoftSkills(answers, qMap);
  const valueRanking = calculateValueRanking(answers, qMap);

  const directions = getCareerDirections(hollandCode);
  const fallbackAiTips = getFallbackTips(hollandCode);

  const careerDirections = directions.map((d, i) => ({
    name: d.direction,
    matchScore: 90 - i * 5,
    reason: d.matchReason,
  }));

  return {
    hollandCode,
    hollandScores,
    mbtiType,
    softSkillRadar: softSkillScores,
    valueRanking,
    topCareers: careerDirections,
    aiTips: fallbackAiTips.join('\n'),
    completedAt: new Date().toISOString(),
  };
}
