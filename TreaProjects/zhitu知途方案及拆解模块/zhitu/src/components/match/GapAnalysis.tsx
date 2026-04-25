'use client';

import { motion } from 'framer-motion';
import { AlertCircle, Minus } from 'lucide-react';
import type { GapItem } from '@/types';

interface GapAnalysisProps {
  gaps: GapItem[];
}

const DIMENSION_LABELS: Record<string, string> = {
  education: '学历',
  skills: '技能',
  experience: '经历',
  softSkills: '软技能',
  certifications: '证书',
};

const PRIORITY_COLORS: Record<GapItem['priority'], string> = {
  high: 'text-error-crimson bg-error-crimson/8 border-error-crimson/20',
  medium: 'text-warning bg-warning/8 border-warning/20',
  low: 'text-stone-gray bg-parchment border-border-warm',
};

const PRIORITY_LABELS: Record<GapItem['priority'], string> = {
  high: '高优先级',
  medium: '中优先级',
  low: '低优先级',
};

export default function GapAnalysis({ gaps }: GapAnalysisProps) {
  // Group by priority
  const grouped = gaps.reduce(
    (acc, gap) => {
      acc[gap.priority].push(gap);
      return acc;
    },
    { high: [] as GapItem[], medium: [] as GapItem[], low: [] as GapItem[] }
  );

  if (gaps.length === 0) {
    return (
      <div className="claude-card p-6">
        <h2 className="font-serif text-heading-5 text-near-black mb-4">差距分析</h2>
        <div className="text-center py-8">
          <p className="text-success text-lg font-medium mb-2">太棒了！</p>
          <p className="text-olive-gray text-sm">
            您的简历已接近岗位要求，继续保持！
          </p>
        </div>
      </div>
    );
  }

  const priorityOrder: GapItem['priority'][] = ['high', 'medium', 'low'];

  return (
    <div className="claude-card p-6 space-y-4">
      <h2 className="font-serif text-heading-5 text-near-black mb-4">差距分析</h2>

      <div className="space-y-4">
        {priorityOrder.map((priority) => {
          const items = grouped[priority];
          if (items.length === 0) return null;

          return (
            <div key={priority} className="space-y-2">
              {/* Priority Header */}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full inline-flex border ${PRIORITY_COLORS[priority]}`}>
                {priority === 'high' && <AlertCircle size={14} />}
                {priority === 'medium' && <Minus size={14} />}
                <span className="text-xs font-medium">{PRIORITY_LABELS[priority]}</span>
              </div>

              {/* Gap Items */}
              <div className="space-y-2 pl-2">
                {items.map((gap, idx) => (
                  <motion.div
                    key={`${gap.dimension}-${idx}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`p-4 rounded-lg border ${PRIORITY_COLORS[gap.priority]}`}
                  >
                    {/* Dimension tag */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium px-2 py-0.5 bg-parchment rounded">
                        {DIMENSION_LABELS[gap.dimension] || gap.dimension}
                      </span>
                    </div>

                    {/* Gap description */}
                    <p className="text-sm font-medium text-near-black mb-2">{gap.gap}</p>

                    {/* Current vs Required */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-start gap-2">
                        <span className="text-xs text-stone-gray whitespace-nowrap">现状:</span>
                        <span className="text-xs text-olive-gray">{gap.current}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-xs text-stone-gray whitespace-nowrap">要求:</span>
                        <span className="text-xs text-olive-gray">{gap.required}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
