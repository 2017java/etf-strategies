'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ResultStarChart from '@/components/assessment/ResultStarChart';
import ShareCard from '@/components/assessment/ShareCard';
import type { AssessmentResult } from '@/types';

export default function AssessmentResultPage() {
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('assessment_result');
    if (stored) {
      try {
        setResult(JSON.parse(stored));
      } catch {
        // Invalid JSON
      }
    }
  }, []);

  if (!result) {
    return (
      <div className="container-main py-10 text-center">
        <p className="text-olive-gray text-body mb-6">还没有测评结果</p>
        <Link href="/assessment" className="btn-primary">
          开始测评
        </Link>
      </div>
    );
  }

  return (
    <div className="container-main py-6">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/assessment" className="text-olive-gray hover:text-near-black transition-colors">
          <ArrowLeft size={20} strokeWidth={1.5} />
        </Link>
        <h1 className="font-serif text-heading-4 text-near-black">测评结果</h1>
      </div>

      {showShare ? (
        <div>
          <ShareCard result={result} />
          <button
            onClick={() => setShowShare(false)}
            className="btn-secondary mt-6 mx-auto block"
          >
            返回结果
          </button>
        </div>
      ) : (
        <>
          <ResultStarChart result={result} />
          <div className="flex gap-4 mt-8 justify-center">
            <button
              onClick={() => setShowShare(true)}
              className="btn-primary"
            >
              分享我的星图卡
            </button>
            <Link href="/jd-decoder" className="btn-secondary">
              继续探索
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
