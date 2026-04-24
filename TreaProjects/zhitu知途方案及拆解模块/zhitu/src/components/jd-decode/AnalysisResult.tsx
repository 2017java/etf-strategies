'use client';

import {
  Briefcase,
  Wrench,
  Brain,
  TrendingUp,
  Eye,
  Target,
  ChevronRight,
  Check,
  Sparkles,
  Save,
} from 'lucide-react';
import type { JDAnalysisResult } from '@/types';

interface AnalysisResultProps {
  result: JDAnalysisResult;
  onMatch?: () => void;
  onSave?: () => void;
}

export function AnalysisResult({ result, onMatch, onSave }: AnalysisResultProps) {
  const getFresherFriendlyInfo = (level: 1 | 2 | 3) => {
    switch (level) {
      case 1:
        return { label: '友好', color: 'bg-success', textColor: 'text-success' };
      case 2:
        return { label: '一般', color: 'bg-warning', textColor: 'text-warning' };
      case 3:
        return { label: '较难', color: 'bg-error-crimson', textColor: 'text-error-crimson' };
    }
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return 'bg-terracotta';
      case 'medium':
        return 'bg-warning';
      case 'low':
        return 'bg-stone-gray';
    }
  };

  const fresherInfo = getFresherFriendlyInfo(result.fresherFriendly);

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      {/* Header with analysis mode */}
      <div className="flex justify-between items-center">
        <h2 className="text-heading-4 text-near-black">解读结果</h2>
        <span className="text-caption text-stone-gray">
          {result.analysisMode === 'ai' ? (
            <span className="flex items-center gap-1">
              <Sparkles size={14} className="text-terracotta" />
              AI 智能分析
            </span>
          ) : (
            '关键词分析'
          )}
        </span>
      </div>

      {/* Summary Section */}
      <section className="claude-card p-6 animate-fade-in-up" style={{ animationDelay: '0ms' }}>
        {result.jobTitle && (
          <div className="mb-4">
            <span className="inline-block px-3 py-1 bg-terracotta/10 text-terracotta text-caption font-medium rounded-subtle">
              {result.jobTitle}
            </span>
          </div>
        )}
        <div className="flex items-center gap-2 mb-3">
          <Briefcase size={20} className="text-terracotta" />
          <h3 className="text-heading-5 text-near-black">这份工作是干啥的</h3>
        </div>
        <p className="text-body text-charcoal-warm leading-relaxed">{result.summary}</p>
      </section>

      {/* Hard Skills Section */}
      <section className="claude-card p-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <div className="flex items-center gap-2 mb-4">
          <Wrench size={20} className="text-terracotta" />
          <h3 className="text-heading-5 text-near-black">硬技能要求</h3>
        </div>

        <div className="space-y-4">
          {/* Required Skills */}
          {result.hardSkills.required.length > 0 && (
            <div>
              <h4 className="text-label text-near-black mb-2">必须</h4>
              <div className="flex flex-wrap gap-2">
                {result.hardSkills.required.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-parchment border border-border-warm rounded-comfortable text-body-sm"
                  >
                    <span className={`w-2 h-2 rounded-full ${getPriorityColor(skill.priority)}`}></span>
                    {skill.name}
                    {skill.shortTermLearnable && <Check size={14} className="text-success" />}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Nice to Have Skills */}
          {result.hardSkills.niceToHave.length > 0 && (
            <div>
              <h4 className="text-label text-charcoal-warm mb-2">加分</h4>
              <div className="flex flex-wrap gap-2">
                {result.hardSkills.niceToHave.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-ivory border border-border-cream rounded-comfortable text-body-sm text-charcoal-warm"
                  >
                    <span className={`w-2 h-2 rounded-full ${getPriorityColor(skill.priority)}`}></span>
                    {skill.name}
                    {skill.shortTermLearnable && <Check size={14} className="text-success" />}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Soft Skills Section */}
      <section className="claude-card p-6 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <div className="flex items-center gap-2 mb-4">
          <Brain size={20} className="text-terracotta" />
          <h3 className="text-heading-5 text-near-black">软技能解读</h3>
        </div>

        <div className="space-y-3">
          {result.softSkills.map((skill, index) => (
            <div key={index} className="bg-parchment p-4 rounded-generous border border-border-warm">
              <h4 className="text-body font-medium text-near-black mb-1">{skill.keyword}</h4>
              <p className="text-body-sm text-charcoal-warm">{skill.concreteBehavior}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Career Path Section */}
      <section className="claude-card p-6 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={20} className="text-terracotta" />
          <h3 className="text-heading-5 text-near-black">职业发展路径</h3>
        </div>

        <div className="space-y-4">
          {/* Year 1 */}
          <div className="flex gap-4 items-start">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 bg-terracotta text-pure-white rounded-full flex items-center justify-center font-medium text-sm">
                1年
              </div>
              <div className="w-0.5 h-full bg-border-warm mt-2 hidden sm:block"></div>
            </div>
            <div className="flex-1 bg-parchment p-4 rounded-generous border border-border-warm">
              <p className="text-body text-charcoal-warm">{result.careerPath.year1}</p>
            </div>
          </div>

          {/* Year 3 */}
          <div className="flex gap-4 items-start">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 bg-terracotta text-pure-white rounded-full flex items-center justify-center font-medium text-sm">
                3年
              </div>
              <div className="w-0.5 h-full bg-border-warm mt-2 hidden sm:block"></div>
            </div>
            <div className="flex-1 bg-parchment p-4 rounded-generous border border-border-warm">
              <p className="text-body text-charcoal-warm">{result.careerPath.year3}</p>
            </div>
          </div>

          {/* Year 5 */}
          <div className="flex gap-4 items-start">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 bg-terracotta text-pure-white rounded-full flex items-center justify-center font-medium text-sm">
                5年
              </div>
            </div>
            <div className="flex-1 bg-parchment p-4 rounded-generous border border-border-warm">
              <p className="text-body text-charcoal-warm">{result.careerPath.year5}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Hidden Requirements Section */}
      <section className="claude-card p-6 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
        <div className="flex items-center gap-2 mb-4">
          <Eye size={20} className="text-terracotta" />
          <h3 className="text-heading-5 text-near-black">隐性要求</h3>
        </div>

        <ul className="space-y-2">
          {result.hiddenRequirements.map((req, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-terracotta mt-1.5">•</span>
              <span className="text-body text-charcoal-warm">{req}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Fresher Friendly Section */}
      <section className="claude-card p-6 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
        <div className="flex items-center gap-2 mb-4">
          <Target size={20} className="text-terracotta" />
          <h3 className="text-heading-5 text-near-black">应届友好度</h3>
        </div>

        <div className="flex items-center gap-3">
          <div className={`w-4 h-4 rounded-full ${fresherInfo.color}`}></div>
          <span className={`text-body font-medium ${fresherInfo.textColor}`}>
            {fresherInfo.label}
          </span>
        </div>
      </section>

      {/* Action Buttons */}
      <div className="flex gap-3 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
        <button
          onClick={onMatch}
          className="flex-1 btn-primary flex items-center justify-center gap-2 py-3 px-6 rounded-generous text-body font-medium transition-all"
        >
          发起匹配分析
          <ChevronRight size={18} />
        </button>
        <button
          onClick={onSave}
          className="btn-secondary flex items-center justify-center gap-2 py-3 px-6 rounded-generous text-body font-medium transition-all"
        >
          <Save size={18} />
          保存到JD库
        </button>
      </div>
    </div>
  );
}
