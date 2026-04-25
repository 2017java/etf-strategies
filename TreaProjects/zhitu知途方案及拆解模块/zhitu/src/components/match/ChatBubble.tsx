'use client';

import { motion } from 'framer-motion';
import { Bot, User } from 'lucide-react';

interface ChatBubbleProps {
  type: 'ai' | 'user';
  children: React.ReactNode;
  delay?: number;
}

export default function ChatBubble({ type, children, delay = 0 }: ChatBubbleProps) {
  const isAI = type === 'ai';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay || 0 }}
      className={`flex items-start gap-3 ${isAI ? '' : 'flex-row-reverse'}`}
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isAI ? 'bg-terracotta/10' : 'bg-parchment'
        }`}
      >
        {isAI ? (
          <Bot size={16} className="text-terracotta" />
        ) : (
          <User size={16} className="text-olive-gray" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[80%] px-4 py-3 rounded-2xl ${
          isAI
            ? 'bg-parchment text-near-black rounded-tl-sm'
            : 'bg-terracotta/10 text-near-black rounded-tr-sm'
        }`}
      >
        {children}
      </div>
    </motion.div>
  );
}
