'use client';

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

interface StarUnlockProps {
  count: number;      // 已解锁星星数
  total: number;      // 总星星数
}

export default function StarUnlock({ count, total }: StarUnlockProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }).map((_, i) => {
        const unlocked = i < count;
        return (
          <motion.div
            key={i}
            initial={unlocked ? { scale: 0, rotate: -180 } : {}}
            animate={unlocked ? { scale: 1, rotate: 0 } : { scale: 1 }}
            transition={unlocked ? { type: 'spring', duration: 0.6 } : {}}
          >
            <Star
              size={24}
              strokeWidth={1.5}
              className={
                unlocked
                  ? 'text-terracotta fill-terracotta'
                  : 'text-stone-gray/40'
              }
            />
          </motion.div>
        );
      })}
    </div>
  );
}
