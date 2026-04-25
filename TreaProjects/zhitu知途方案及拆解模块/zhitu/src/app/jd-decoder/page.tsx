'use client';

import { useState } from 'react';
import { FileSearch } from 'lucide-react';
import { JDInput } from '@/components/jd-decode/JDInput';
import { AnalysisResult } from '@/components/jd-decode/AnalysisResult';
import { useUser } from '@/hooks/useUser';
import { saveJDAnalysis } from '@/lib/storage';
import { computeJDHash } from '@/lib/jd-decode';
import type { JDAnalysisResult } from '@/types';

export default function JDDecoderPage() {
  const [jdText, setJdText] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<JDAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { userId } = useUser();

  const handleAnalyze = async (text: string) => {
    if (!text.trim()) return;

    setJdText(text);
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const response = await fetch('/api/jd-decode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jdText: text,
          userId: userId || 'anonymous',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `请求失败 (${response.status})`);
      }

      const result: JDAnalysisResult = await response.json();
      setAnalysisResult(result);

      // Persist the analysis result
      if (userId) {
        const jdHash = await computeJDHash(text);
        await saveJDAnalysis(userId, jdHash, result);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '分析失败，请稍后重试';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMatch = () => {
    // TODO: Navigate to match page with JD analysis result
    console.log('发起匹配分析', analysisResult);
  };

  const handleSave = async () => {
    if (!analysisResult || !userId || !jdText) return;

    try {
      const jdHash = await computeJDHash(jdText);
      await saveJDAnalysis(userId, jdHash, analysisResult);
      alert('已保存到JD库');
    } catch (err) {
      console.error('保存失败:', err);
      alert('保存失败，请稍后重试');
    }
  };

  return (
    <div className="container-main py-10">
      <div className="flex items-center gap-3 mb-8">
        <FileSearch size={24} strokeWidth={1.5} className="text-terracotta" />
        <h1 className="font-serif text-heading-3 text-near-black">JD 智能解读</h1>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="w-full max-w-xl mx-auto">
          <div className="claude-card p-8 animate-pulse">
            <div className="space-y-4">
              <div className="h-4 bg-parchment rounded w-3/4" />
              <div className="h-4 bg-parchment rounded w-1/2" />
              <div className="h-32 bg-parchment rounded" />
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="w-full max-w-xl mx-auto">
          <div className="claude-card p-6 border border-error-crimson/30 bg-error-crimson/5">
            <p className="text-body text-error-crimson text-center">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-4 w-full btn-secondary py-2 px-4 rounded-generous text-body"
            >
              重新输入
            </button>
          </div>
        </div>
      )}

      {/* JD Input */}
      {!analysisResult && !isLoading && !error && (
        <JDInput onAnalyze={handleAnalyze} isLoading={isLoading} />
      )}

      {/* Analysis Result */}
      {analysisResult && !isLoading && !error && (
        <div className="space-y-6">
          <AnalysisResult
            result={analysisResult}
            onMatch={handleMatch}
            onSave={handleSave}
          />
          <div className="text-center">
            <button
              onClick={() => {
                setAnalysisResult(null);
                setJdText('');
              }}
              className="text-body text-stone-gray hover:text-near-black underline"
            >
              重新解读
            </button>
          </div>
        </div>
      )}
    </div>
  );
}