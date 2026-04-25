'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Compass } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SwipeCard from '@/components/assessment/SwipeCard';
import StarUnlock from '@/components/assessment/StarUnlock';
import { getShuffledQuestions } from '@/lib/assessment/questions';
import type { AssessmentAnswer } from '@/types';
import { calculateAssessment } from '@/lib/assessment/scoring';
import { saveAssessmentResult } from '@/lib/storage';
import { useUser } from '@/hooks/useUser';

export default function AssessmentPage() {
  const router = useRouter();
  const { userId } = useUser();
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AssessmentAnswer[]>([]);
  const [showStarAnimation, setShowStarAnimation] = useState<number | null>(null);

  const questions = getShuffledQuestions();
  const total = questions.length;

  const handleAnswer = useCallback(
    (answer: AssessmentAnswer) => {
      const newAnswers = [...answers, answer];
      setAnswers(newAnswers);

      const newIndex = currentIndex + 1;

      // 检查是否解锁新星星
      const prevStars = Math.floor(currentIndex / 14);
      const newStars = Math.floor(newIndex / 14);
      if (newStars > prevStars && newStars <= 4) {
        setShowStarAnimation(newStars);
        setTimeout(() => setShowStarAnimation(null), 1200);
      }

      if (newIndex >= total) {
        // 测评完成，计算结果
        const result = calculateAssessment(newAnswers);
        // 保存结果
        if (userId) {
          saveAssessmentResult(userId, result);
        }
        // 存入 sessionStorage 供结果页使用
        sessionStorage.setItem('assessment_result', JSON.stringify(result));
        router.push('/assessment/result');
        return;
      }

      setCurrentIndex(newIndex);
    },
    [answers, currentIndex, total, userId, router]
  );

  if (!started) {
    return (
      <div className="container-main py-10">
        <div className="flex items-center gap-3 mb-8">
          <Compass size={24} strokeWidth={1.5} className="text-terracotta" />
          <h1 className="font-serif text-heading-3 text-near-black">职业星图测评</h1>
        </div>

        <div className="claude-card p-8 text-center">
          <h2 className="font-serif text-heading-4 text-near-black mb-4">
            发现你的职业星图
          </h2>
          <p className="text-body-sm text-olive-gray mb-2">
            基于科学量表（Holland RIASEC + MBTI），56 道情景题
          </p>
          <p className="text-body-sm text-olive-gray mb-2">
            预估完成时间：8-12 分钟
          </p>
          <p className="text-caption text-stone-gray mb-8">
            左滑不认同 · 右滑认同 · 中间说不准
          </p>

          <StarUnlock count={0} total={4} />

          <button
            onClick={() => setStarted(true)}
            className="btn-primary text-body px-8 py-3 rounded-generous mt-8"
          >
            开始测评
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  if (!currentQuestion) return null;

  return (
    <div className="container-main py-6">
      {/* 星星解锁动画 */}
      <AnimatePresence>
        {showStarAnimation !== null && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed top-1/4 left-0 right-0 z-50 flex flex-col items-center"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', duration: 0.6 }}
            >
              <StarUnlock count={showStarAnimation} total={4} />
            </motion.div>
            <p className="text-body-sm text-terracotta font-medium mt-2">
              解锁第 {showStarAnimation} 颗星！
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.25 }}
        >
          <SwipeCard
            question={currentQuestion}
            index={currentIndex}
            total={total}
            onAnswer={handleAnswer}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
