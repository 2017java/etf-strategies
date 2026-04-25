'use client';

import { motion } from 'framer-motion';

interface SoftSkillSliderProps {
  skill: string;
  value: number;
  onChange: (value: number) => void;
  description?: string;
}

const labels = ['很弱', '较弱', '一般', '较强', '很强'];

export default function SoftSkillSlider({
  skill,
  value,
  onChange,
  description,
}: SoftSkillSliderProps) {
  const clampedValue = Math.max(1, Math.min(5, value));
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-near-black">{skill}</span>
        <span className="text-xs text-olive-gray">
          {labels[clampedValue - 1] || '未评分'}
        </span>
      </div>

      {description && (
        <p className="text-xs text-stone-gray">{description}</p>
      )}

      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((level) => (
          <button
            key={level}
            onClick={() => onChange(level)}
            className="flex-1 h-8 rounded transition-all"
          >
            <motion.div
              animate={{
                backgroundColor: level <= clampedValue ? '#c96442' : '#e8e6dc',
              }}
              transition={{ duration: 0.2 }}
              className="w-full h-full rounded"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
