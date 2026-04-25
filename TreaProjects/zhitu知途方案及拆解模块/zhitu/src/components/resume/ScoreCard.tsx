'use client';

import type { ResumeAnalysisResult } from '@/types';

export interface ScoreCardProps {
  result: ResumeAnalysisResult;
}

interface DimensionBarProps {
  label: string;
  score: number;
  color: string;
}

function DimensionBar({ label, score, color }: DimensionBarProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 text-small text-olive-gray">{label}</span>
      <div className="flex-1 h-2 bg-olive/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="w-10 text-small font-medium text-right">{score}</span>
    </div>
  );
}

export default function ScoreCard({ result }: ScoreCardProps) {
  const { overallScore, dimensionScores, analysisMode } = result;

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-terracotta';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-400';
  };

  const getOverallColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-terracotta';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-500';
  };

  const getGrade = (score: number): string => {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B+';
    if (score >= 60) return 'B';
    if (score >= 50) return 'C';
    return 'D';
  };

  return (
    <div className="claude-card p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="font-serif text-heading-4 text-near-black mb-1">简历评分</h3>
          <p className="text-small text-olive-gray">
            分析模式：{analysisMode === 'ai' ? 'AI 智能分析' : '规则分析'}
          </p>
        </div>
        <div className="text-right">
          <div className={`text-4xl font-serif font-bold ${getOverallColor(overallScore)}`}>
            {overallScore}
          </div>
          <div className="text-small text-olive-gray">Grade: {getGrade(overallScore)}</div>
        </div>
      </div>

      <div className="space-y-4">
        <DimensionBar
          label="格式"
          score={dimensionScores.format}
          color={getScoreColor(dimensionScores.format)}
        />
        <DimensionBar
          label="内容"
          score={dimensionScores.content}
          color={getScoreColor(dimensionScores.content)}
        />
        <DimensionBar
          label="关键词"
          score={dimensionScores.keywords}
          color={getScoreColor(dimensionScores.keywords)}
        />
        <DimensionBar
          label="量化"
          score={dimensionScores.quantification}
          color={getScoreColor(dimensionScores.quantification)}
        />
        <DimensionBar
          label="结构"
          score={dimensionScores.structure}
          color={getScoreColor(dimensionScores.structure)}
        />
      </div>

      <div className="mt-6 pt-4 border-t border-olive/10">
        <div className="flex items-center justify-between text-small">
          <span className="text-olive-gray">关键词覆盖率</span>
          <span className="font-medium text-near-black">
            {result.keywordCoverage.matched.length} / {result.keywordCoverage.matched.length + result.keywordCoverage.missing.length}
            ({result.keywordCoverage.coverageRate}%)
          </span>
        </div>
      </div>
    </div>
  );
}