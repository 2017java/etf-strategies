'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Compass, FileSearch, Scale, FileText, CheckCircle, Circle, AlertCircle } from 'lucide-react';
import {
  getUserJourneyStats,
  calculateJourneyStage,
  getJourneyProgressPercent,
  getJourneyStageName,
  type UserJourneyStats,
} from '@/lib/journey/progress';
import {
  getAssessmentResultRecords,
  getJDAnalysisRecords,
  getMatchReportRecords,
  getResumeAnalysisRecords,
} from '@/lib/storage';

// ── Types ──

type ModuleStatus = 'completed' | 'in-progress' | 'not-started';

interface ModuleState {
  status: ModuleStatus;
  count?: number;
  total?: number;
  label: string;
}

interface RecentActivity {
  type: 'jd' | 'assessment' | 'match' | 'resume';
  title: string;
  subtitle: string;
  date: string;
}

// ── Constants ──

const MODULES = [
  { href: '/assessment', icon: Compass, label: '职业测评', desc: '发现你的职业方向' },
  { href: '/jd-decoder', icon: FileSearch, label: 'JD 解读', desc: '读懂岗位要求' },
  { href: '/match', icon: Scale, label: '匹配分析', desc: '找到能力差距' },
  { href: '/resume', icon: FileText, label: '简历优化', desc: '武装你的简历' },
];

const DEFAULT_USER_ID = 'default-user';

// ── Helpers ──

function getModuleStates(stats: UserJourneyStats): Record<string, ModuleState> {
  return {
    assessment: {
      status: stats.assessmentCount > 0 ? 'completed' : 'not-started',
      label: '测评',
    },
    jd: {
      status: stats.jdAnalysisCount > 0
        ? (stats.jdAnalysisCount >= 2 ? 'completed' : 'in-progress')
        : 'not-started',
      count: stats.jdAnalysisCount,
      total: 2,
      label: 'JD解读',
    },
    match: {
      status: stats.matchReportCount > 0 ? 'completed' : 'not-started',
      label: '匹配分析',
    },
    resume: {
      status: stats.bestResumeScore >= 70 ? 'completed'
        : stats.bestResumeScore > 0 ? 'in-progress'
        : 'not-started',
      label: '简历优化',
    },
  };
}

function getStatusIcon(status: ModuleStatus) {
  switch (status) {
    case 'completed':
      return <CheckCircle size={16} className="text-success" />;
    case 'in-progress':
      return <AlertCircle size={16} className="text-warning" />;
    case 'not-started':
      return <Circle size={16} className="text-stone-gray" />;
  }
}

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

interface RecentActivityInternal {
  type: 'jd' | 'assessment' | 'match' | 'resume';
  title: string;
  subtitle: string;
  date: string;
  dateObj: Date;
}

async function getRecentActivities(): Promise<RecentActivity[]> {
  if (typeof window === 'undefined') return [];

  try {
    const [assessments, jdAnalyses, matchReports, resumeAnalyses] = await Promise.all([
      getAssessmentResultRecords(DEFAULT_USER_ID),
      getJDAnalysisRecords(DEFAULT_USER_ID),
      getMatchReportRecords(DEFAULT_USER_ID),
      getResumeAnalysisRecords(DEFAULT_USER_ID),
    ]);

    const activities: RecentActivityInternal[] = [];

    // Assessment activities
    for (const a of assessments) {
      activities.push({
        type: 'assessment',
        title: '测评结果',
        subtitle: a.data.topCareers?.[0]?.name ?? '职业测评',
        date: a.createdAt,
        dateObj: new Date(a.createdAt),
      });
    }

    // JD analysis activities
    for (const jd of jdAnalyses) {
      activities.push({
        type: 'jd',
        title: 'JD解读',
        subtitle: jd.data.jobTitle ?? '岗位解读',
        date: jd.createdAt,
        dateObj: new Date(jd.createdAt),
      });
    }

    // Match report activities
    for (const m of matchReports) {
      activities.push({
        type: 'match',
        title: '匹配报告',
        subtitle: `匹配度 ${m.data.totalScore}分`,
        date: m.createdAt,
        dateObj: new Date(m.createdAt),
      });
    }

    // Resume analysis activities
    for (const r of resumeAnalyses) {
      activities.push({
        type: 'resume',
        title: '简历优化',
        subtitle: `得分 ${r.data.overallScore}分`,
        date: r.createdAt,
        dateObj: new Date(r.createdAt),
      });
    }

    // Sort by date descending and take top 5
    return activities
      .sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime())
      .slice(0, 5)
      .map(({ dateObj, ...rest }) => ({
        ...rest,
        date: formatDate(dateObj.toISOString()),
      }));
  } catch (error) {
    console.error('[Dashboard] Failed to get recent activities:', error);
    return [];
  }
}

// ── Landing Page (for new users) ──

function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
      <h1 className="font-serif text-display lg:text-heading-1 text-near-black mb-4">
        知途
      </h1>
      <p className="text-body-lg text-olive-gray max-w-md mb-8">
        为大学生点亮职业方向的灯
      </p>

      <Link
        href="/assessment"
        className="btn-primary text-body px-8 py-3 rounded-comfortable mb-10"
      >
        开始探索
      </Link>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-2xl w-full">
        {MODULES.map((mod) => {
          const Icon = mod.icon;
          return (
            <Link
              key={mod.href}
              href={mod.href}
              className="claude-card p-5 flex flex-col items-center gap-3 hover:shadow-card transition-shadow"
            >
              <Icon size={28} strokeWidth={1.5} className="text-terracotta" />
              <span className="text-label font-medium">{mod.label}</span>
              <span className="text-micro text-olive-gray">{mod.desc}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ── Dashboard (for returning users) ──

function Dashboard({ stats }: { stats: UserJourneyStats }) {
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const stage = calculateJourneyStage(stats);
  const progressPercent = getJourneyProgressPercent(stage);
  const stageName = getJourneyStageName(stage);
  const moduleStates = getModuleStates(stats);

  useEffect(() => {
    getRecentActivities().then(setRecentActivities);
  }, []);

  return (
    <div className="max-w-xl mx-auto px-6 py-8">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-heading-4 text-near-black mb-1">
          你好，探索者
        </h1>
        <p className="text-olive-gray text-body-sm">
          继续你的求职准备之旅
        </p>
      </div>

      {/* Journey Progress Card */}
      <div className="claude-card p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-warning">⭐</span>
          <span className="text-label font-medium text-charcoal-warm">求职准备进度</span>
        </div>

        {/* Progress Bar */}
        <div className="mb-2">
          <div className="h-3 bg-warm-sand rounded-full overflow-hidden">
            <div
              className="h-full bg-terracotta rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-charcoal-warm text-body-sm font-medium">
            {progressPercent}%
          </span>
          <span className="text-olive-gray text-caption">
            {stageName}
          </span>
        </div>
      </div>

      {/* Module Status */}
      <div className="claude-card p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-info">🧭</span>
          <span className="text-label font-medium text-charcoal-warm">探索进度</span>
        </div>

        <div className="space-y-3">
          {/* Assessment */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(moduleStates.assessment.status)}
              <span className="text-body-sm text-charcoal-warm">测评</span>
            </div>
            <span className={`text-caption ${
              moduleStates.assessment.status === 'completed'
                ? 'text-success'
                : 'text-stone-gray'
            }`}>
              {moduleStates.assessment.status === 'completed' ? '已完成' : '未开始'}
            </span>
          </div>

          {/* JD Decoding */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(moduleStates.jd.status)}
              <span className="text-body-sm text-charcoal-warm">JD解读</span>
            </div>
            <span className={`text-caption ${
              moduleStates.jd.status === 'completed'
                ? 'text-success'
                : moduleStates.jd.status === 'in-progress'
                ? 'text-warning'
                : 'text-stone-gray'
            }`}>
              {moduleStates.jd.status === 'completed'
                ? '已完成'
                : moduleStates.jd.status === 'in-progress'
                ? `进行中(${moduleStates.jd.count}/${moduleStates.jd.total})`
                : '未开始'}
            </span>
          </div>

          {/* Match Analysis */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(moduleStates.match.status)}
              <span className="text-body-sm text-charcoal-warm">匹配分析</span>
            </div>
            <span className={`text-caption ${
              moduleStates.match.status === 'completed'
                ? 'text-success'
                : 'text-stone-gray'
            }`}>
              {moduleStates.match.status === 'completed' ? '已完成' : '未开始'}
            </span>
          </div>

          {/* Resume Optimization */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(moduleStates.resume.status)}
              <span className="text-body-sm text-charcoal-warm">简历优化</span>
            </div>
            <span className={`text-caption ${
              moduleStates.resume.status === 'completed'
                ? 'text-success'
                : moduleStates.resume.status === 'in-progress'
                ? '进行中'
                : '未开始'
            }`}>
              {moduleStates.resume.status === 'completed' ? '已完成' : '未开始'}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      {recentActivities.length > 0 && (
        <div className="claude-card p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-info">📋</span>
            <span className="text-label font-medium text-charcoal-warm">最近记录</span>
          </div>

          <div className="space-y-3">
            {recentActivities.slice(0, 3).map((activity, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {activity.type === 'jd' && <FileSearch size={14} className="text-terracotta" />}
                  {activity.type === 'assessment' && <Compass size={14} className="text-terracotta" />}
                  {activity.type === 'match' && <Scale size={14} className="text-terracotta" />}
                  {activity.type === 'resume' && <FileText size={14} className="text-terracotta" />}
                  <div>
                    <span className="text-caption text-charcoal-warm">{activity.title}: </span>
                    <span className="text-caption text-olive-gray">{activity.subtitle}</span>
                  </div>
                </div>
                <span className="text-micro text-stone-gray">{activity.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        {MODULES.map((mod) => {
          const Icon = mod.icon;
          return (
            <Link
              key={mod.href}
              href={mod.href}
              className="claude-card p-4 flex flex-col items-center gap-2 hover:shadow-card transition-shadow"
            >
              <Icon size={22} strokeWidth={1.5} className="text-terracotta" />
              <span className="text-label font-medium">{mod.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Page Component ──

export default function HomePage() {
  const [isReturningUser, setIsReturningUser] = useState<boolean | null>(null);
  const [userStats, setUserStats] = useState<UserJourneyStats | null>(null);

  useEffect(() => {
    // Check if user has any existing data
    getUserJourneyStats(DEFAULT_USER_ID).then((stats) => {
      const hasData = stats.assessmentCount > 0
        || stats.jdAnalysisCount > 0
        || stats.matchReportCount > 0
        || stats.bestResumeScore > 0;

      setIsReturningUser(hasData);
      setUserStats(stats);
    });
  }, []);

  // SSR: show nothing until client-side check completes
  if (isReturningUser === null) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-olive-gray text-body">加载中...</div>
      </div>
    );
  }

  // New user: show landing page
  if (!isReturningUser) {
    return <LandingPage />;
  }

  // Returning user: show dashboard
  return <Dashboard stats={userStats!} />;
}
