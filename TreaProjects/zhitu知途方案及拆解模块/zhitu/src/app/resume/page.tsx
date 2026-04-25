'use client';

import { useState, useCallback, useEffect } from 'react';
import { FileText, Loader2, AlertCircle } from 'lucide-react';
import { UploadZone, ScoreCard, IssueList, RewriteDiff } from '@/components/resume';
import type { ResumeAnalysisResult, JDAnalysisResult, StoredItem } from '@/types';

export default function ResumePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ResumeAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedJDId, setSelectedJDId] = useState<string>('');
  const [jdAnalyses, setJDAnalyses] = useState<StoredItem<JDAnalysisResult>[]>([]);
  const [fileName, setFileName] = useState<string>('');

  // Load JD analyses from storage on mount (client-side only)
  useEffect(() => {
    const loadJDAnalyses = async () => {
      try {
        const stored = localStorage.getItem('jd-analyses');
        if (stored) {
          setJDAnalyses(JSON.parse(stored));
        }
      } catch (err) {
        console.error('Failed to load JD analyses:', err);
      }
    };
    loadJDAnalyses();
  }, []);

  const handleUpload = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    setFileName(file.name);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // If JD is selected, retrieve and send the full JD analysis data
      if (selectedJDId) {
        // Find the selected JD analysis from localStorage
        const stored = localStorage.getItem('jd-analyses');
        if (stored) {
          const analyses: StoredItem<JDAnalysisResult>[] = JSON.parse(stored);
          const selectedAnalysis = analyses.find(item => item.id === selectedJDId);
          if (selectedAnalysis?.data) {
            formData.append('jdAnalysis', JSON.stringify(selectedAnalysis.data));
          }
        }
      }

      const response = await fetch('/api/resume-analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `分析失败 (${response.status})`);
      }

      const result: ResumeAnalysisResult = await response.json();
      setAnalysisResult(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : '简历分析失败';
      setError(message);
      setAnalysisResult(null);
    } finally {
      setIsLoading(false);
    }
  }, [selectedJDId]);

  const resetAnalysis = useCallback(() => {
    setAnalysisResult(null);
    setError(null);
    setFileName('');
  }, []);

  return (
    <div className="container-main py-10">
      <div className="flex items-center gap-3 mb-8">
        <FileText size={24} strokeWidth={1.5} className="text-terracotta" />
        <h1 className="font-serif text-heading-3 text-near-black">简历智能优化</h1>
      </div>

      <div className="space-y-6">
        {/* JD Selection */}
        <div className="claude-card p-6">
          <label className="block text-small font-medium text-near-black mb-2">
            选择目标岗位（可选）
          </label>
          <select
            value={selectedJDId}
            onChange={(e) => setSelectedJDId(e.target.value)}
            className="w-full px-4 py-2 border border-olive/20 rounded-lg bg-white text-body text-near-black
              focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta"
            disabled={isLoading}
          >
            <option value="">不指定岗位（通用分析）</option>
            {jdAnalyses.map((item) => (
              <option key={item.id} value={item.id}>
                {item.data.jobTitle || '未知岗位'} - {new Date(item.createdAt).toLocaleDateString()}
              </option>
            ))}
          </select>
          <p className="mt-2 text-small text-olive-gray">
            选择岗位后可获得针对性的关键词匹配分析
          </p>
        </div>

        {/* Upload Zone */}
        {!analysisResult && (
          <UploadZone onUpload={handleUpload} isLoading={isLoading} />
        )}

        {/* Error Display */}
        {error && (
          <div className="claude-card p-6 border-red-200 bg-red-50">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <p className="text-body text-red-600 font-medium">分析失败</p>
                <p className="text-small text-red-500 mt-1">{error}</p>
              </div>
            </div>
            <button
              onClick={resetAnalysis}
              className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg text-small transition-colors"
            >
              重新上传
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="claude-card p-8 text-center">
            <Loader2 className="w-8 h-8 text-terracotta animate-spin mx-auto mb-4" />
            <p className="text-body text-near-black font-medium">正在分析简历...</p>
            <p className="text-small text-olive-gray mt-1">
              正在提取文本并分析与岗位的匹配度
            </p>
          </div>
        )}

        {/* Analysis Results */}
        {analysisResult && !isLoading && (
          <div className="space-y-6">
            {/* Result Header */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-body text-olive-gray">
                  文件：{fileName}
                </p>
              </div>
              <button
                onClick={resetAnalysis}
                className="px-4 py-2 border border-olive/20 rounded-lg text-small text-near-black
                  hover:bg-olive/5 transition-colors"
              >
                重新上传
              </button>
            </div>

            {/* Score Card */}
            <ScoreCard result={analysisResult} />

            {/* Suggestions */}
            {analysisResult.topSuggestions.length > 0 && (
              <div className="claude-card p-6">
                <h3 className="font-serif text-heading-4 text-near-black mb-4">优化建议</h3>
                <div className="space-y-3">
                  {analysisResult.topSuggestions.map((suggestion, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-lg bg-olive/5"
                    >
                      <div className={`
                        w-6 h-6 rounded-full flex items-center justify-center text-small font-medium
                        ${suggestion.impact === 'high' ? 'bg-red-100 text-red-600' : ''}
                        ${suggestion.impact === 'medium' ? 'bg-yellow-100 text-yellow-600' : ''}
                        ${suggestion.impact === 'low' ? 'bg-blue-100 text-blue-600' : ''}
                      `}>
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-body font-medium text-near-black">
                          {suggestion.title}
                        </p>
                        <p className="text-small text-olive-gray mt-1">
                          {suggestion.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Issue List */}
            <IssueList issues={analysisResult.issues} />

            {/* Rewrite Examples */}
            <RewriteDiff examples={analysisResult.rewriteExamples} />

            {/* Keyword Coverage */}
            {analysisResult.keywordCoverage.missing.length > 0 && (
              <div className="claude-card p-6">
                <h3 className="font-serif text-heading-4 text-near-black mb-4">
                  缺失关键词
                </h3>
                <div className="flex flex-wrap gap-2">
                  {analysisResult.keywordCoverage.missing.map((keyword, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-red-50 border border-red-200 rounded-full text-small text-red-600"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}