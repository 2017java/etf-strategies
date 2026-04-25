'use client';

import { useState, useCallback } from 'react';
import { useSwipeable } from 'react-swipeable';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { ChevronLeft, ChevronRight, Minus } from 'lucide-react';
import type { AssessmentQuestion } from '@/lib/assessment/questions';
import type { AssessmentAnswer } from '@/types';

interface SwipeCardProps {
  question: AssessmentQuestion;
  index: number;
  total: number;
  onAnswer: (answer: AssessmentAnswer) => void;
}

export default function SwipeCard({ question, index, total, onAnswer }: SwipeCardProps) {
  const [answered, setAnswered] = useState(false);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-15, 0, 15]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);

  const labelOpacity = useTransform(x, [-200, -60, 0, 60, 200], [1, 0, 0, 0, 1]);

  const handleResponse = useCallback(
    (value: number) => {
      if (answered) return;
      setAnswered(true);

      const targetX = value > 0 ? 300 : value < 0 ? -300 : 0;
      animate(x, targetX, {
        duration: 0.3,
        onComplete: () => {
          onAnswer({
            questionId: question.id,
            value,
          });
        },
      });
    },
    [answered, onAnswer, question.id, x]
  );

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => handleResponse(-1),
    onSwipedRight: () => handleResponse(1),
    onSwipedUp: () => handleResponse(0),
    trackMouse: false,
    trackTouch: true,
    delta: 50,
  });

  // 分段名称
  const sectionName = (() => {
    switch (question.category) {
      case 'holland': return '性格探索';
      case 'mbti': return '思维偏好';
      case 'softskill': return '软技能评估';
      case 'value': return '价值取向';
    }
  })();

  const progress = ((index + 1) / total) * 100;
  const starCount = Math.floor((index + 1) / 14); // 每 14 题解锁一颗星

  if (answered) return null;

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto">
      {/* 进度条 */}
      <div className="w-full mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-caption text-olive-gray">{sectionName}</span>
          <span className="text-caption text-olive-gray">
            第 {index + 1}/{total} 题
          </span>
        </div>
        <div className="h-1.5 bg-warm-sand rounded-maximum overflow-hidden">
          <motion.div
            className="h-full bg-terracotta rounded-maximum"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-micro text-stone-gray">
            {'★'.repeat(starCount)}{'☆'.repeat(4 - starCount)} 已解锁 {starCount}/4
          </span>
        </div>
      </div>

      {/* 卡片 */}
      <motion.div
        {...swipeHandlers}
        style={{ x, rotate, opacity }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        onDragEnd={(_, info) => {
          if (info.offset.x > 80) handleResponse(1);
          else if (info.offset.x < -80) handleResponse(-1);
        }}
        className="w-full bg-ivory border border-border-cream rounded-generous shadow-whisper p-8 cursor-grab active:cursor-grabbing select-none min-h-[280px] flex flex-col items-center justify-center touch-none"
      >
        {/* 左右标签 */}
        <motion.div
          style={{ opacity: labelOpacity }}
          className="absolute top-4 left-4 text-error-crimson font-medium text-label"
        >
          不认同
        </motion.div>
        <motion.div
          style={{ opacity: labelOpacity }}
          className="absolute top-4 right-4 text-success font-medium text-label"
        >
          认同
        </motion.div>

        <p className="font-serif text-heading-4 text-near-black text-center leading-relaxed">
          {question.scenario}
        </p>
      </motion.div>

      {/* 按钮组 */}
      <div className="flex items-center justify-center gap-6 mt-8 w-full">
        <button
          onClick={() => handleResponse(-1)}
          className="flex items-center justify-center w-14 h-14 rounded-highly bg-warm-sand text-olive-gray hover:bg-border-warm active:shadow-inset transition-all"
          aria-label="不认同"
        >
          <ChevronLeft size={24} strokeWidth={1.5} />
        </button>
        <button
          onClick={() => handleResponse(0)}
          className="flex items-center justify-center w-14 h-14 rounded-highly bg-warm-sand text-olive-gray hover:bg-border-warm active:shadow-inset transition-all"
          aria-label="说不准"
        >
          <Minus size={24} strokeWidth={1.5} />
        </button>
        <button
          onClick={() => handleResponse(1)}
          className="flex items-center justify-center w-14 h-14 rounded-highly bg-terracotta text-ivory hover:brightness-110 active:shadow-inset transition-all"
          aria-label="认同"
        >
          <ChevronRight size={24} strokeWidth={1.5} />
        </button>
      </div>

      <p className="text-caption text-stone-gray mt-4">
        左滑不认同 · 右滑认同 · 中间说不准
      </p>
    </div>
  );
}
