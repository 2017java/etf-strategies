'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Scale, ArrowLeft } from 'lucide-react';

import type { UserProfile, JDAnalysisResult, MatchResult, AssessmentResult } from '@/types';
import { calculateMatchScore } from '@/lib/match-score/calculate';
import { saveMatchReport, getJDAnalysisByHash } from '@/lib/storage';
import { useUser } from '@/hooks/useUser';

import ChatCollector from '@/components/match/ChatCollector';
import ScoreDisplay from '@/components/match/ScoreDisplay';
import GapAnalysis from '@/components/match/GapAnalysis';
import ActionPlan from '@/components/match/ActionPlan';

// Inner component that uses useSearchParams
function MatchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userId } = useUser();

  const [jdAnalysis, setJdAnalysis] = useState<JDAnalysisResult | null>(null);
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load JD analysis from sessionStorage or URL hash
  useEffect(() => {
    async function loadJDAnalysis() {
      try {
        // Try to get from URL param first
        const jdHash = searchParams.get('jdHash');

        if (jdHash) {
          // Fetch from storage by hash
          const result = await getJDAnalysisByHash(jdHash);
          if (result) {
            setJdAnalysis(result);
            setIsLoading(false);
            return;
          }
        }

        // Try sessionStorage
        const stored = sessionStorage.getItem('zhitu-jd-analysis');
        if (stored) {
          setJdAnalysis(JSON.parse(stored));
          setIsLoading(false);
          return;
        }

        // Try stored assessment result
        const storedAssessment = sessionStorage.getItem('zhitu-assessment-result');
        if (storedAssessment) {
          setAssessmentResult(JSON.parse(storedAssessment));
        }

        setError('请先进行 JD 解读');
      } catch (err) {
        console.error('Failed to load JD analysis:', err);
        setError('加载 JD 分析结果失败');
      } finally {
        setIsLoading(false);
      }
    }

    loadJDAnalysis();
  }, [searchParams]);

  // Handle ChatCollector completion
  const handleCollectComplete = useCallback(
    async (profile: UserProfile) => {
      if (!jdAnalysis) {
        setError('缺少 JD 分析结果，请返回重新进行匹配');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Calculate match score
        const result = calculateMatchScore(profile, jdAnalysis, assessmentResult ?? undefined);
        setMatchResult(result);

        // Persist to storage
        if (userId) {
          await saveMatchReport(userId, result);
        }
      } catch (err) {
        console.error('Failed to calculate match score:', err);
        setError('计算匹配度失败，请稍后重试');
      } finally {
        setIsLoading(false);
      }
    },
    [jdAnalysis, assessmentResult, userId]
  );

  // Loading state
  if (isLoading && !matchResult) {
    return (
      <div className="container-main py-10">
        <div className="flex items-center gap-3 mb-8">
          <Scale size={24} strokeWidth={1.5} className="text-terracotta" />
          <h1 className="font-serif text-heading-3 text-near-black">岗位匹配度分析</h1>
        </div>
        <div className="claude-card p-8">
          <div className="flex flex-col items-center justify-center py-12 animate-pulse">
            <div className="w-16 h-16 rounded-full bg-parchment mb-4" />
            <p className="text-olive-gray text-body">正在加载...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !jdAnalysis && !matchResult) {
    return (
      <div className="container-main py-10">
        <div className="flex items-center gap-3 mb-8">
          <Scale size={24} strokeWidth={1.5} className="text-terracotta" />
          <h1 className="font-serif text-heading-3 text-near-black">岗位匹配度分析</h1>
        </div>
        <div className="claude-card p-8 text-center space-y-4">
          <p className="text-error-crimson text-body">{error}</p>
          <button
            onClick={() => router.push('/jd-decoder')}
            className="btn-primary px-6 py-2 rounded-lg text-body"
          >
            前往 JD 解读
          </button>
        </div>
      </div>
    );
  }

  // Results view
  if (matchResult) {
    return (
      <div className="container-main py-10 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Scale size={24} strokeWidth={1.5} className="text-terracotta" />
            <h1 className="font-serif text-heading-3 text-near-black">匹配分析结果</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/jd-decoder')}
              className="btn-secondary px-4 py-2 rounded-lg text-body flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              重新分析
            </button>
          </div>
        </div>

        {/* Job Title if available */}
        {jdAnalysis?.jobTitle && (
          <div className="claude-card p-4 bg-terracotta/5 border border-terracotta/20">
            <p className="text-sm text-stone-gray">分析岗位</p>
            <p className="text-near-black font-medium">{jdAnalysis.jobTitle}</p>
          </div>
        )}

        {/* Score Display */}
        <ScoreDisplay result={matchResult} />

        {/* Gap Analysis */}
        <GapAnalysis gaps={matchResult.gaps} />

        {/* Action Plan */}
        <ActionPlan actions={matchResult.actionPlan} timeline={matchResult.timeline} />

        {/* Navigation */}
        <div className="flex justify-center pt-4">
          <button
            onClick={() => router.push('/jd-decoder')}
            className="btn-secondary px-6 py-3 rounded-lg text-body"
          >
            尝试另一个岗位
          </button>
        </div>
      </div>
    );
  }

  // ChatCollector view
  if (jdAnalysis) {
    return (
      <div className="container-main py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Scale size={24} strokeWidth={1.5} className="text-terracotta" />
          <h1 className="font-serif text-heading-3 text-near-black">岗位匹配度分析</h1>
        </div>

        {/* Job info card */}
        <div className="claude-card p-4 mb-6 bg-parchment">
          <p className="text-sm text-stone-gray mb-1">即将分析</p>
          <p className="text-near-black font-medium">
            {jdAnalysis.jobTitle || 'JD 解读结果'}
          </p>
          <p className="text-xs text-olive-gray mt-2 line-clamp-2">
            {jdAnalysis.summary}
          </p>
        </div>

        {/* ChatCollector */}
        <div className="claude-card p-6">
          <ChatCollector
            jdAnalysis={jdAnalysis}
            assessmentResult={assessmentResult ?? undefined}
            onComplete={handleCollectComplete}
          />
        </div>
      </div>
    );
  }

  // Fallback
  return null;
}

// Loading fallback for Suspense
function MatchPageLoading() {
  return (
    <div className="container-main py-10">
      <div className="flex items-center gap-3 mb-8">
        <Scale size={24} strokeWidth={1.5} className="text-terracotta" />
        <h1 className="font-serif text-heading-3 text-near-black">岗位匹配度分析</h1>
      </div>
      <div className="claude-card p-8">
        <div className="flex flex-col items-center justify-center py-12 animate-pulse">
          <div className="w-16 h-16 rounded-full bg-parchment mb-4" />
          <p className="text-olive-gray text-body">正在加载...</p>
        </div>
      </div>
    </div>
  );
}

// Default export with Suspense wrapper
export default function MatchPage() {
  return (
    <Suspense fallback={<MatchPageLoading />}>
      <MatchPageContent />
    </Suspense>
  );
}