'use client';

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import type { MatchResult } from '@/types';

interface ScoreDisplayProps {
  result: MatchResult;
}

export default function ScoreDisplay({ result }: ScoreDisplayProps) {
  const { totalScore, dimensionScores, radarData } = result;

  // Score color based on value
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-error-crimson';
  };

  // Score label
  const getScoreLabel = (score: number) => {
    if (score >= 80) return '优秀';
    if (score >= 60) return '良好';
    if (score >= 40) return '一般';
    return '需提升';
  };

  return (
    <div className="claude-card p-6 space-y-6">
      {/* Header: Total Score */}
      <div className="text-center space-y-2">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="inline-block"
        >
          <div className="relative">
            <span className={`text-7xl font-serif font-bold ${getScoreColor(totalScore)}`}>
              {totalScore}
            </span>
            <span className="text-2xl text-stone-gray">分</span>
          </div>
        </motion.div>
        <p className={`text-lg font-medium ${getScoreColor(totalScore)}`}>
          {getScoreLabel(totalScore)}
        </p>
        <p className="text-sm text-olive-gray">
          综合匹配度
        </p>
      </div>

      {/* Dimension Scores Summary */}
      <div className="grid grid-cols-5 gap-2">
        {Object.entries(dimensionScores).map(([key, score]) => (
          <div key={key} className="text-center p-2 bg-parchment rounded-lg">
            <p className={`text-lg font-semibold ${getScoreColor(score)}`}>{score}</p>
            <p className="text-xs text-stone-gray">
              {key === 'education' && '学历'}
              {key === 'skills' && '技能'}
              {key === 'experience' && '经历'}
              {key === 'softSkills' && '软技能'}
              {key === 'certifications' && '证书'}
            </p>
          </div>
        ))}
      </div>

      {/* Radar Chart */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData} margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
            <PolarGrid stroke="#e5e0d5" />
            <PolarAngleAxis
              dataKey="dimension"
              tick={{ fill: '#6b6560', fontSize: 12 }}
            />
            <Radar
              name="匹配度"
              dataKey="score"
              stroke="#c96442"
              fill="#c96442"
              fillOpacity={0.45}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}