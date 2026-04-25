'use client';

import { useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { Download, Share2 } from 'lucide-react';
import type { AssessmentResult } from '@/types';

interface ShareCardProps {
  result: AssessmentResult;
}

const HOLLAND_LABELS: Record<string, string> = {
  R: '实际型', I: '研究型', A: '艺术型', S: '社会型', E: '管理型', C: '事务型',
};

export default function ShareCard({ result }: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDownload = useCallback(async () => {
    if (!cardRef.current) return;
    const canvas = await html2canvas(cardRef.current, {
      scale: 2,
      backgroundColor: '#f5f4ed',
    });
    const link = document.createElement('a');
    link.download = `知途-${result.hollandCode}-职业星图.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [result.hollandCode]);

  const handleShare = useCallback(async () => {
    if (!cardRef.current) return;
    const canvas = await html2canvas(cardRef.current, {
      scale: 2,
      backgroundColor: '#f5f4ed',
    });
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      if (navigator.share) {
        const file = new File([blob], `知途-${result.hollandCode}-职业星图.png`, { type: 'image/png' });
        try {
          await navigator.share({
            title: '我的知途职业星图',
            text: `我是${result.hollandCode}型探索者，来看看你的职业星图吧！`,
            files: [file],
          });
        } catch {
          // User cancelled share
        }
      } else {
        handleDownload();
      }
    }, 'image/png');
  }, [result.hollandCode, handleDownload]);

  return (
    <div className="flex flex-col items-center">
      {/* 分享卡预览 */}
      <div
        ref={cardRef}
        className="w-full max-w-sm bg-parchment rounded-generous p-8 mb-6 border border-border-cream"
      >
        <h3 className="font-serif text-heading-3 text-near-black text-center mb-2">知途</h3>
        <p className="text-caption text-olive-gray text-center mb-6">职业星图</p>

        <div className="text-center mb-4">
          <p className="text-body-lg text-terracotta font-medium mb-1">
            {result.topCareers[0]?.name || '探索者'}
          </p>
          <p className="text-body-sm text-olive-gray">
            {result.hollandCode} · {result.mbtiType}
          </p>
        </div>

        <div className="flex justify-center gap-4 mb-6">
          {Object.entries(result.hollandScores)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([key, val]) => (
              <div key={key} className="text-center">
                <p className="text-caption text-terracotta font-medium">{HOLLAND_LABELS[key]}</p>
                <p className="text-body-sm text-olive-gray">{val}</p>
              </div>
            ))}
        </div>

        <div className="space-y-2 mb-6">
          {result.topCareers.slice(0, 3).map((c) => (
            <p key={c.name} className="text-body-sm text-charcoal-warm text-center">
              {c.name}
            </p>
          ))}
        </div>

        <p className="text-micro text-stone-gray text-center">
          知途 · 为大学生点亮职业方向的灯
        </p>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-4">
        <button onClick={handleDownload} className="btn-secondary flex items-center gap-2">
          <Download size={16} strokeWidth={1.5} />
          保存图片
        </button>
        <button onClick={handleShare} className="btn-primary flex items-center gap-2">
          <Share2 size={16} strokeWidth={1.5} />
          分享
        </button>
      </div>
    </div>
  );
}
