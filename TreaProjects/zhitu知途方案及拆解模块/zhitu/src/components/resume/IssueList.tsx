'use client';

import { useState } from 'react';
import { AlertCircle, AlertTriangle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import type { ResumeIssue } from '@/types';

export interface IssueListProps {
  issues: ResumeIssue[];
}

interface SeverityGroup {
  severity: 'high' | 'medium' | 'low';
  issues: ResumeIssue[];
  icon: typeof AlertCircle;
  color: string;
  label: string;
}

const severityConfig: Record<'high' | 'medium' | 'low', SeverityGroup> = {
  high: {
    severity: 'high',
    issues: [],
    icon: AlertCircle,
    color: 'text-red-500 bg-red-50 border-red-200',
    label: '高优先级',
  },
  medium: {
    severity: 'medium',
    issues: [],
    icon: AlertTriangle,
    color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    label: '中优先级',
  },
  low: {
    severity: 'low',
    issues: [],
    icon: Info,
    color: 'text-blue-500 bg-blue-50 border-blue-200',
    label: '低优先级',
  },
};

const typeLabels: Record<ResumeIssue['type'], string> = {
  keyword_missing: '关键词缺失',
  no_quantify: '缺少量化',
  no_star: 'STAR结构不完整',
  redundant: '冗余内容',
  weak_verb: '动词过于弱化',
};

export default function IssueList({ issues }: IssueListProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<'high' | 'medium' | 'low'>>(
    new Set<'high' | 'medium' | 'low'>(['high', 'medium'])
  );

  // Group issues by severity
  const grouped = issues.reduce((acc, issue) => {
    acc[issue.severity].issues.push(issue);
    return acc;
  }, severityConfig as Record<'high' | 'medium' | 'low', SeverityGroup>);

  const toggleGroup = (severity: 'high' | 'medium' | 'low') => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(severity)) {
        next.delete(severity);
      } else {
        next.add(severity);
      }
      return next;
    });
  };

  const order: ('high' | 'medium' | 'low')[] = ['high', 'medium', 'low'];

  return (
    <div className="claude-card p-6">
      <h3 className="font-serif text-heading-4 text-near-black mb-4">问题分析</h3>

      {issues.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">&#10003;</span>
          </div>
          <p className="text-body text-olive-gray">简历质量良好，未发现明显问题</p>
        </div>
      ) : (
        <div className="space-y-4">
          {order.map((severity) => {
            const group = grouped[severity];
            if (group.issues.length === 0) return null;

            const Icon = group.icon;
            const isExpanded = expandedGroups.has(severity);

            return (
              <div key={severity} className="border border-olive/10 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleGroup(severity)}
                  className={`w-full flex items-center justify-between p-3 ${group.color} border-b border-olive/10`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span className="font-medium text-small">{group.label}</span>
                    <span className="text-small opacity-70">({group.issues.length})</span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>

                {isExpanded && (
                  <div className="divide-y divide-olive/10">
                    {group.issues.map((issue, idx) => (
                      <IssueItem key={idx} issue={issue} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function IssueItem({ issue }: { issue: ResumeIssue }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="p-3 hover:bg-olive/5 transition-colors">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 text-xs rounded-full bg-olive/10 text-olive-gray">
                {typeLabels[issue.type]}
              </span>
              <span className="text-small text-olive-gray">{issue.location}</span>
            </div>
            {issue.originalText && (
              <p className="text-small text-near-black line-clamp-2">
                &ldquo;{issue.originalText}&rdquo;
              </p>
            )}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-olive/10">
          <p className="text-small">
            <span className="text-olive-gray">建议：</span>
            <span className="text-near-black">{issue.suggestion}</span>
          </p>
        </div>
      )}
    </div>
  );
}