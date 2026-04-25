'use client';

import { useState } from 'react';
import { ArrowRight, CheckCircle } from 'lucide-react';
import type { RewriteExample } from '@/types';

export interface RewriteDiffProps {
  examples: RewriteExample[];
}

export default function RewriteDiff({ examples }: RewriteDiffProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (examples.length === 0) {
    return (
      <div className="claude-card p-6">
        <h3 className="font-serif text-heading-4 text-near-black mb-4">改写示例</h3>
        <div className="text-center py-8">
          <p className="text-body text-olive-gray">暂无改写示例</p>
        </div>
      </div>
    );
  }

  const activeExample = examples[activeIndex];

  return (
    <div className="claude-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-heading-4 text-near-black">改写示例</h3>
        <div className="flex gap-1">
          {examples.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`
                w-2 h-2 rounded-full transition-colors
                ${idx === activeIndex ? 'bg-terracotta' : 'bg-olive/20'}
              `}
              aria-label={`Go to example ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {/* Original */}
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-300 rounded-full" />
          <div className="pl-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 text-xs rounded-full bg-red-50 text-red-600 border border-red-200">
                Before
              </span>
            </div>
            <p className="text-body text-near-black/70 leading-relaxed">
              {activeExample.original}
            </p>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex justify-center">
          <ArrowRight className="w-5 h-5 text-terracotta rotate-90" />
        </div>

        {/* Optimized */}
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-400 rounded-full" />
          <div className="pl-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 text-xs rounded-full bg-green-50 text-green-600 border border-green-200">
                After
              </span>
              <CheckCircle className="w-3 h-3 text-green-500" />
            </div>
            <p className="text-body text-near-black leading-relaxed">
              {activeExample.optimized}
            </p>
          </div>
        </div>

        {/* Reason */}
        <div className="mt-4 pt-4 border-t border-olive/10">
          <p className="text-small">
            <span className="text-olive-gray">改写原因：</span>
            <span className="text-terracotta">{activeExample.reason}</span>
          </p>
        </div>
      </div>
    </div>
  );
}