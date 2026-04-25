'use client';

import { motion } from 'framer-motion';

interface ProgressDotsProps {
  current: number;
  total: number;
}

export default function ProgressDots({ current, total }: ProgressDotsProps) {
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {Array.from({ length: total }).map((_, i) => {
        const isActive = i === current;
        const isCompleted = i < current;

        return (
          <motion.div
            key={i}
            initial={false}
            animate={{
              width: isActive ? 24 : 8,
            }}
            className={`h-2 rounded-full ${
              isCompleted || isActive ? 'bg-terracotta' : 'bg-parchment'
            }`}
          />
        );
      })}
    </div>
  );
}
