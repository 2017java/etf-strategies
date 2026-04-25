'use client';

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';
import { Compass, TrendingUp, Sparkles, Heart } from 'lucide-react';
import type { AssessmentResult } from '@/types';

interface ResultStarChartProps {
  result: AssessmentResult;
}

const HOLLAND_LABELS: Record<string, string> = {
  R: '实际型',
  I: '研究型',
  A: '艺术型',
  S: '社会型',
  E: '管理型',
  C: '事务型',
};

const SOFTSKILL_LABELS: Record<string, string> = {
  communication: '沟通力',
  execution: '执行力',
  creativity: '创造力',
  resilience: '抗压性',
  learning: '学习力',
};

const VALUE_LABELS: Record<string, string> = {
  salary: '薪资回报',
  growth: '成长空间',
  stability: '稳定安全',
  creativity: '创意自由',
  influence: '社会影响',
};

export default function ResultStarChart({ result }: ResultStarChartProps) {
  const radarData = Object.entries(result.hollandScores).map(([key, val]) => ({
    dimension: HOLLAND_LABELS[key] || key,
    score: val,
    fullMark: 100,
  }));

  return (
    <div className="flex flex-col items-center w-full">
      {/* 人格标签 */}
      <div className="text-center mb-8">
        <p className="text-caption text-olive-gray mb-2">你的职业星图</p>
        <h1 className="font-serif text-heading-2 text-near-black mb-1">
          {result.topCareers[0]?.name || '探索者'}
        </h1>
        <p className="text-body-sm text-terracotta font-medium">
          {result.hollandCode} · {result.mbtiType}
        </p>
      </div>

      {/* 雷达图 */}
      <div className="w-full max-w-sm mx-auto mb-8">
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
            <PolarGrid stroke="#e8e6dc" />
            <PolarAngleAxis
              dataKey="dimension"
              tick={{ fill: '#5e5d59', fontSize: 12 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: '#87867f', fontSize: 10 }}
            />
            <Radar
              name="Holland"
              dataKey="score"
              stroke="#c96442"
              fill="#c96442"
              fillOpacity={0.15}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Top3 职业方向 */}
      <div className="w-full mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Compass size={18} strokeWidth={1.5} className="text-terracotta" />
          <h2 className="font-serif text-heading-5 text-near-black">Top3 适合方向</h2>
        </div>
        <div className="space-y-3">
          {result.topCareers.map((career, idx) => (
            <div
              key={career.name}
              className="claude-card p-4 flex items-start gap-4"
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-generous bg-terracotta/10 text-terracotta font-medium text-body-sm flex-shrink-0">
                {idx + 1}
              </span>
              <div>
                <p className="font-medium text-near-black text-body">{career.name}</p>
                <p className="text-caption text-olive-gray mt-1">{career.reason}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 软技能 */}
      <div className="w-full mb-8">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={18} strokeWidth={1.5} className="text-terracotta" />
          <h2 className="font-serif text-heading-5 text-near-black">软技能画像</h2>
        </div>
        <div className="space-y-3">
          {Object.entries(result.softSkillRadar).map(([key, val]) => (
            <div key={key} className="flex items-center gap-3">
              <span className="text-body-sm text-olive-gray w-16">
                {SOFTSKILL_LABELS[key] || key}
              </span>
              <div className="flex-1 h-2 bg-warm-sand rounded-maximum overflow-hidden">
                <div
                  className="h-full bg-terracotta rounded-maximum transition-all"
                  style={{ width: `${val}%` }}
                />
              </div>
              <span className="text-caption text-olive-gray w-10 text-right">{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 价值观排序 */}
      {result.valueRanking && result.valueRanking.length > 0 && (
        <div className="w-full mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Heart size={18} strokeWidth={1.5} className="text-terracotta" />
            <h2 className="font-serif text-heading-5 text-near-black">价值取向</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {result.valueRanking.map((val, idx) => (
              <span
                key={val}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-highly text-body-sm ${
                  idx === 0
                    ? 'bg-terracotta/10 text-terracotta font-medium'
                    : 'bg-warm-sand text-olive-gray'
                }`}
              >
                <span className="text-micro text-stone-gray">{idx + 1}</span>
                {VALUE_LABELS[val] || val}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* AI Tips */}
      {result.aiTips && (
        <div className="w-full mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={18} strokeWidth={1.5} className="text-terracotta" />
            <h2 className="font-serif text-heading-5 text-near-black">职场建议</h2>
          </div>
          <div className="claude-card p-5 space-y-3">
            {result.aiTips.split('\n').map((tip, idx) => (
              <p key={idx} className="text-body-sm text-charcoal-warm">
                {tip}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
