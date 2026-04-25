'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, FileSearch, Scale, FileText, ChevronRight, Loader2 } from 'lucide-react';
import {
  getAssessmentResultRecords,
  getJDAnalysisRecords,
  getMatchReportRecords,
  getResumeAnalysisRecords,
} from '@/lib/storage';
import { useUser } from '@/hooks/useUser';
import type { AssessmentResult, JDAnalysisResult, MatchResult, ResumeAnalysisResult } from '@/types';

type HistoryType = 'assessment' | 'jd' | 'match' | 'resume';

interface TabConfig {
  key: HistoryType;
  label: string;
  icon: typeof Brain;
  count: (data: unknown) => number;
}

const TABS: TabConfig[] = [
  { key: 'assessment', label: '测评记录', icon: Brain, count: (d) => (d as AssessmentResult[]).length },
  { key: 'jd', label: 'JD解读', icon: FileSearch, count: (d) => (d as JDAnalysisResult[]).length },
  { key: 'match', label: '匹配报告', icon: Scale, count: (d) => (d as MatchResult[]).length },
  { key: 'resume', label: '简历分析', icon: FileText, count: (d) => (d as ResumeAnalysisResult[]).length },
];

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' });
}

interface AssessmentItemProps {
  data: AssessmentResult;
  createdAt: string;
  onClick: () => void;
}

function AssessmentItem({ data, createdAt, onClick }: AssessmentItemProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full flex items-center gap-3 p-4 bg-ivory border border-border-cream rounded-lg hover:border-terracotta/30 transition-colors text-left"
    >
      <div className="w-10 h-10 rounded-full bg-terracotta/10 flex items-center justify-center flex-shrink-0">
        <Brain size={18} className="text-terracotta" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-body font-medium text-near-black truncate">
          {data.mbtiType || '未知类型'}
        </p>
        <p className="text-caption text-stone-gray">
          {data.hollandCode ? `霍兰德: ${data.hollandCode}` : ''} · {formatDate(createdAt)}
        </p>
      </div>
      <ChevronRight size={18} className="text-stone-gray flex-shrink-0" />
    </motion.button>
  );
}

interface JDItemProps {
  data: JDAnalysisResult;
  createdAt: string;
  onClick: () => void;
}

function JDItem({ data, createdAt, onClick }: JDItemProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full flex items-center gap-3 p-4 bg-ivory border border-border-cream rounded-lg hover:border-coral/30 transition-colors text-left"
    >
      <div className="w-10 h-10 rounded-full bg-coral/10 flex items-center justify-center flex-shrink-0">
        <FileSearch size={18} className="text-coral" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-body font-medium text-near-black truncate">
          {data.jobTitle || 'JD解读'}
        </p>
        <p className="text-caption text-stone-gray truncate">
          {formatDate(createdAt)}
        </p>
      </div>
      <ChevronRight size={18} className="text-stone-gray flex-shrink-0" />
    </motion.button>
  );
}

interface MatchItemProps {
  data: MatchResult;
  createdAt: string;
  onClick: () => void;
}

function MatchItem({ data, createdAt, onClick }: MatchItemProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full flex items-center gap-3 p-4 bg-ivory border border-border-cream rounded-lg hover:border-info/30 transition-colors text-left"
    >
      <div className="w-10 h-10 rounded-full bg-info/10 flex items-center justify-center flex-shrink-0">
        <Scale size={18} className="text-info" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-body font-medium text-near-black">匹配报告</p>
        <p className="text-caption text-stone-gray">
          匹配度 {data.totalScore}分 · {formatDate(createdAt)}
        </p>
      </div>
      <ChevronRight size={18} className="text-stone-gray flex-shrink-0" />
    </motion.button>
  );
}

interface ResumeItemProps {
  data: ResumeAnalysisResult;
  createdAt: string;
  onClick: () => void;
}

function ResumeItem({ data, createdAt, onClick }: ResumeItemProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full flex items-center gap-3 p-4 bg-ivory border border-border-cream rounded-lg hover:border-success/30 transition-colors text-left"
    >
      <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
        <FileText size={18} className="text-success" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-body font-medium text-near-black">简历分析</p>
        <p className="text-caption text-stone-gray">
          总分 {data.overallScore}/100 · {formatDate(createdAt)}
        </p>
      </div>
      <ChevronRight size={18} className="text-stone-gray flex-shrink-0" />
    </motion.button>
  );
}

interface HistoryListProps {
  className?: string;
}

interface StoredRecord<T> {
  data: T;
  createdAt: string;
}

export default function HistoryList({ className = '' }: HistoryListProps) {
  const router = useRouter();
  const { userId } = useUser();
  const [activeTab, setActiveTab] = useState<HistoryType>('assessment');
  const [isLoading, setIsLoading] = useState(true);
  const [assessmentData, setAssessmentData] = useState<StoredRecord<AssessmentResult>[]>([]);
  const [jdData, setJdData] = useState<StoredRecord<JDAnalysisResult>[]>([]);
  const [matchData, setMatchData] = useState<StoredRecord<MatchResult>[]>([]);
  const [resumeData, setResumeData] = useState<StoredRecord<ResumeAnalysisResult>[]>([]);

  const loadData = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const [assessments, jdAnalyses, matchReports, resumeAnalyses] = await Promise.all([
        getAssessmentResultRecords(userId),
        getJDAnalysisRecords(userId),
        getMatchReportRecords(userId),
        getResumeAnalysisRecords(userId),
      ]);

      setAssessmentData(assessments);
      setJdData(jdAnalyses);
      setMatchData(matchReports);
      setResumeData(resumeAnalyses);
    } catch (error) {
      console.error('[HistoryList] Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getCurrentData = useMemo(() => {
    switch (activeTab) {
      case 'assessment':
        return assessmentData;
      case 'jd':
        return jdData;
      case 'match':
        return matchData;
      case 'resume':
        return resumeData;
      default:
        return [];
    }
  }, [activeTab, assessmentData, jdData, matchData, resumeData]);

  const handleItemClick = useCallback((type: HistoryType) => {
    switch (type) {
      case 'assessment':
        router.push('/assessment/result');
        break;
      case 'jd':
        router.push('/jd-decoder');
        break;
      case 'match':
        router.push('/match');
        break;
      case 'resume':
        router.push('/resume');
        break;
    }
  }, [router]);

  const counts = useMemo(() => ({
    assessment: assessmentData.length,
    jd: jdData.length,
    match: matchData.length,
    resume: resumeData.length,
  }), [assessmentData.length, jdData.length, matchData.length, resumeData.length]);

  const renderItem = useCallback((item: StoredRecord<unknown>, index: number) => {
    const key = `${activeTab}-${index}`;
    switch (activeTab) {
      case 'assessment':
        return (
          <AssessmentItem
            key={key}
            data={item.data as AssessmentResult}
            createdAt={item.createdAt}
            onClick={() => handleItemClick('assessment')}
          />
        );
      case 'jd':
        return (
          <JDItem
            key={key}
            data={item.data as JDAnalysisResult}
            createdAt={item.createdAt}
            onClick={() => handleItemClick('jd')}
          />
        );
      case 'match':
        return (
          <MatchItem
            key={key}
            data={item.data as MatchResult}
            createdAt={item.createdAt}
            onClick={() => handleItemClick('match')}
          />
        );
      case 'resume':
        return (
          <ResumeItem
            key={key}
            data={item.data as ResumeAnalysisResult}
            createdAt={item.createdAt}
            onClick={() => handleItemClick('resume')}
          />
        );
      default:
        return null;
    }
  }, [activeTab, handleItemClick]);

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">📋</span>
        <h3 className="text-heading-5 text-charcoal-warm font-medium">历史记录</h3>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-parchment rounded-lg mb-4 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const count = counts[tab.key];
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
                flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-md
                text-caption font-medium transition-all whitespace-nowrap
                min-h-[36px]
                ${isActive
                  ? 'bg-ivory text-terracotta shadow-sm'
                  : 'text-stone-gray hover:text-charcoal-warm'
                }
              `}
            >
              <Icon size={14} />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.slice(0, 2)}</span>
              {count > 0 && (
                <span className={`
                  text-xs px-1.5 py-0.5 rounded-full min-w-[18px] text-center
                  ${isActive ? 'bg-terracotta/10 text-terracotta' : 'bg-warm-silver/30 text-stone-gray'}
                `}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="text-stone-gray animate-spin" />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-2"
          >
            {getCurrentData.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-stone-gray text-body mb-1">暂无记录</p>
                <p className="text-stone-gray/60 text-caption">
                  开始探索后，这里将显示您的历史记录
                </p>
              </div>
            ) : (
              getCurrentData.map((item, index) => renderItem(item, index))
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}