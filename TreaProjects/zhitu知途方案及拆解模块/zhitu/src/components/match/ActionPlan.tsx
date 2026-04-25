'use client';

import { motion } from 'framer-motion';
import { Clock, BookOpen } from 'lucide-react';
import type { ActionItem } from '@/types';

interface ActionPlanProps {
  actions: ActionItem[];
  timeline: string;
}

const DIMENSION_LABELS: Record<string, string> = {
  education: '学历',
  skills: '技能',
  experience: '经历',
  softSkills: '软技能',
  certifications: '证书',
};

const PRIORITY_BORDER_COLORS: Record<ActionItem['priority'], string> = {
  high: 'border-l-error-crimson',
  medium: 'border-l-warning',
  low: 'border-l-stone-gray',
};

// Group actions by time ranges
function groupByTimeRange(actions: ActionItem[]): Record<string, ActionItem[]> {
  const groups: Record<string, ActionItem[]> = {
    '1-4周': [],
    '5-8周': [],
    '9-12周': [],
    '12周以上': [],
  };

  for (const action of actions) {
    const weeks = action.estimatedWeeks;
    if (weeks <= 4) {
      groups['1-4周'].push(action);
    } else if (weeks <= 8) {
      groups['5-8周'].push(action);
    } else if (weeks <= 12) {
      groups['9-12周'].push(action);
    } else {
      groups['12周以上'].push(action);
    }
  }

  // Only return non-empty groups in order
  const result: Record<string, ActionItem[]> = {};
  for (const [key, items] of Object.entries(groups)) {
    if (items.length > 0) {
      result[key] = items;
    }
  }
  return result;
}

export default function ActionPlan({ actions, timeline }: ActionPlanProps) {
  const grouped = groupByTimeRange(actions);

  if (actions.length === 0) {
    return (
      <div className="claude-card p-6">
        <h2 className="font-serif text-heading-5 text-near-black mb-4">行动计划</h2>
        <div className="text-center py-8">
          <p className="text-success text-lg font-medium mb-2">无需改进！</p>
          <p className="text-olive-gray text-sm">
            您已满足岗位要求，保持现有优势即可。
          </p>
        </div>
      </div>
    );
  }

  const timeRanges = Object.keys(grouped);

  return (
    <div className="claude-card p-6 space-y-6">
      {/* Header with Timeline */}
      <div className="space-y-3">
        <h2 className="font-serif text-heading-5 text-near-black">行动计划</h2>
        <div className="flex items-center gap-2 px-4 py-2 bg-terracotta/8 rounded-lg border border-terracotta/20">
          <Clock size={16} className="text-terracotta" />
          <span className="text-sm text-near-black font-medium">{timeline}</span>
        </div>
      </div>

      {/* Timeline with vertical line */}
      <div className="relative">
        {/* Vertical timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border-warm" />

        {/* Time groups */}
        <div className="space-y-6 pl-10">
          {timeRanges.map((timeRange, groupIdx) => (
            <motion.div
              key={timeRange}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: groupIdx * 0.1 }}
              className="relative"
            >
              {/* Timeline node */}
              <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-terracotta border-2 border-ivory shadow-sm" />

              {/* Time range label */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-semibold text-terracotta">{timeRange}</span>
                <span className="text-xs text-stone-gray">
                  ({grouped[timeRange].length}项)
                </span>
              </div>

              {/* Action items for this time range */}
              <div className="space-y-3">
                {grouped[timeRange].map((action, idx) => (
                  <motion.div
                    key={`${action.gapDimension}-${idx}`}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: groupIdx * 0.1 + idx * 0.05 }}
                    className={`p-4 bg-parchment rounded-lg border-l-4 ${PRIORITY_BORDER_COLORS[action.priority]} border border-border-warm`}
                  >
                    {/* Action header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-sm font-medium text-near-black leading-relaxed">
                        {action.action}
                      </p>
                      <span className="text-xs text-stone-gray whitespace-nowrap flex items-center gap-1">
                        <Clock size={10} />
                        {action.estimatedWeeks}周
                      </span>
                    </div>

                    {/* Resource */}
                    <div className="flex items-start gap-2">
                      <BookOpen size={12} className="text-stone-gray mt-0.5 flex-shrink-0" />
                      <span className="text-xs text-olive-gray">{action.resource}</span>
                    </div>

                    {/* Dimension tag */}
                    <div className="mt-2">
                      <span className="text-xs px-2 py-0.5 bg-ivory rounded border border-border-warm text-stone-gray">
                        {DIMENSION_LABELS[action.gapDimension] || action.gapDimension}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
