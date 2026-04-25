'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getUserJourneyStats,
  calculateJourneyStage,
  isStageUnlocked,
  JourneyStage,
  type UserJourneyStats,
} from '@/lib/journey/progress';

// Special completion badge stage (shown when all stages complete)
const COMPLETION_BADGE_STAGE = 5;

// Badge metadata - mapped to JourneyStage values (1-4) + special completion stage
const BADGES = [
  {
    stage: JourneyStage.STAR_MAP_EXPLORER,
    name: '星图探索者',
    description: '完成性格测评，开启职业探索之旅',
    unlockedColor: 'text-terracotta',
    unlockedBg: 'bg-terracotta/10',
  },
  {
    stage: JourneyStage.DIRECTION_CONFIRMER,
    name: '方向确认者',
    description: '解读 2+ 份 JD，明确职业方向',
    unlockedColor: 'text-coral',
    unlockedBg: 'bg-coral/10',
  },
  {
    stage: JourneyStage.GAP_ANALYST,
    name: '差距研判者',
    description: '完成匹配分析，洞察能力差距',
    unlockedColor: 'text-info',
    unlockedBg: 'bg-info/10',
  },
  {
    stage: JourneyStage.RESUME_ALCHEMIST,
    name: '简历炼金师',
    description: '简历评估 ≥70 分，化简历为利器',
    unlockedColor: 'text-success',
    unlockedBg: 'bg-success/10',
  },
  {
    stage: COMPLETION_BADGE_STAGE,
    name: '求职冠军',
    description: '完成全流程，踏上求职巅峰',
    unlockedColor: 'text-warning',
    unlockedBg: 'bg-warning/10',
  },
];

interface BadgeWallProps {
  className?: string;
}

export default function BadgeWall({ className = '' }: BadgeWallProps) {
  const [stats, setStats] = useState<UserJourneyStats | null>(null);
  const [currentStage, setCurrentStage] = useState(0);
  const [selectedBadge, setSelectedBadge] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const userStats = await getUserJourneyStats();
        setStats(userStats);
        setCurrentStage(calculateJourneyStage(userStats));
      } catch (error) {
        console.error('[BadgeWall] Failed to load journey stats:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, []);

  const isBadgeUnlocked = useCallback((stage: number) => {
    if (!stats) return false;
    if (stage === COMPLETION_BADGE_STAGE) {
      // 求职冠军: 完成全流程 (stage 4 + all previous stages)
      return currentStage >= JourneyStage.RESUME_ALCHEMIST;
    }
    return isStageUnlocked(stats, stage);
  }, [stats, currentStage]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="w-10 h-10 rounded-full bg-warm-silver/30 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">🏆</span>
        <h3 className="text-heading-5 text-charcoal-warm font-medium">旅程徽章</h3>
      </div>

      {/* Badge Grid */}
      <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
        {BADGES.map((badge, index) => {
          const unlocked = isBadgeUnlocked(badge.stage);
          return (
            <motion.button
              key={badge.stage}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              onClick={() => setSelectedBadge(selectedBadge === badge.stage ? null : badge.stage)}
              className={`
                relative flex flex-col items-center gap-1 p-2 sm:p-3
                rounded-lg transition-all duration-200
                ${unlocked
                  ? `${badge.unlockedBg} hover:scale-105 active:scale-95`
                  : 'bg-warm-silver/20 hover:bg-warm-silver/30'
                }
                focus:outline-none focus:ring-2 focus:ring-ring-warm
              `}
            >
              {/* Star Icon */}
              <motion.span
                initial={unlocked ? { scale: 0, rotate: -180 } : false}
                animate={unlocked ? { scale: 1, rotate: 0 } : {}}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className={`
                  text-3xl sm:text-4xl
                  ${unlocked ? badge.unlockedColor : 'text-stone-gray'}
                `}
              >
                {unlocked ? '⭐' : '☆'}
              </motion.span>

              {/* Badge Name */}
              <span
                className={`
                  text-caption font-medium text-center leading-tight
                  ${unlocked ? 'text-charcoal-warm' : 'text-stone-gray'}
                `}
              >
                {badge.name}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Tooltip / Detail Modal */}
      <AnimatePresence>
        {selectedBadge !== null && (
          <motion.div
            key="tooltip"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-4 p-4 bg-ivory rounded-lg shadow-card border border-border-cream"
          >
            {BADGES.filter((b) => b.stage === selectedBadge).map((badge) => {
              const unlocked = isBadgeUnlocked(badge.stage);
              return (
                <div key={badge.stage} className="text-center">
                  <motion.span
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className={`
                      text-4xl block mb-2
                      ${unlocked ? badge.unlockedColor : 'text-stone-gray'}
                    `}
                  >
                    {unlocked ? '⭐' : '☆'}
                  </motion.span>
                  <h4
                    className={`
                      text-heading-5 font-medium mb-1
                      ${unlocked ? 'text-charcoal-warm' : 'text-stone-gray'}
                    `}
                  >
                    {badge.name}
                  </h4>
                  <p
                    className={`
                      text-body-sm
                      ${unlocked ? 'text-olive-gray' : 'text-stone-gray'}
                    `}
                  >
                    {unlocked ? badge.description : '尚未解锁'}
                  </p>
                  {!unlocked && stats && (
                    <p className="text-caption text-stone-gray mt-2">
                      继续加油，完成任务即可解锁
                    </p>
                  )}
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}