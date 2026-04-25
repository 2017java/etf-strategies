'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';

import type { UserProfile, JDAnalysisResult, AssessmentResult } from '@/types';
import {
  EDUCATION_LEVELS,
  SKILL_PRESETS,
  CERTIFICATE_PRESETS,
  INDUSTRY_PRESETS,
  SOFT_SKILL_PRESETS,
  EducationLevel,
} from '@/lib/match-score/types';

import ChatBubble from './ChatBubble';
import ProgressDots from './ProgressDots';
import SkillSelector from './SkillSelector';
import SoftSkillSlider from './SoftSkillSlider';

// ── Step Questions ──

const STEP_QUESTIONS = [
  {
    id: 'education',
    question: '你的学校属于哪个层次？',
    subtext: '这能帮助我了解你的学历背景',
  },
  {
    id: 'major',
    question: '你的专业属于哪个大类？',
    subtext: '选择最接近的分类，也可以补充说明',
  },
  {
    id: 'skills',
    question: '你掌握了哪些技能？',
    subtext: '选择你熟练使用的技能，可多选',
  },
  {
    id: 'experience',
    question: '你有多少段实习或项目经历？',
    subtext: '包括任何相关经历，不限于正式实习',
  },
  {
    id: 'softSkills',
    question: '给自己各方面的软技能打个分吧',
    subtext: '诚实评估即可，这有助于找到最适合你的岗位',
  },
];

// ── Major Categories ──

const MAJOR_CATEGORIES = [
  '计算机/软件',
  '电子/通信',
  '机械/自动化',
  '金融/经济',
  '管理学',
  '市场营销',
  '语言/文学',
  '法律',
  '医学/药学',
  '教育学',
  '艺术/设计',
  '新闻/传媒',
  '理学/基础科学',
  '农学',
  '其他',
];

// ── Experience Count Options ──

const EXPERIENCE_COUNT_OPTIONS = [0, 1, 2, 3, 4, 5];

// ── ChatCollector Props ──

interface ChatCollectorProps {
  jdAnalysis: JDAnalysisResult;
  assessmentResult?: AssessmentResult;
  onComplete: (profile: UserProfile) => void;
}

// ── ChatCollector Component ──

export default function ChatCollector({
  jdAnalysis,
  assessmentResult,
  onComplete,
}: ChatCollectorProps) {
  // Get relevant skill presets based on JD
  const getRelevantSkillPresets = (): string[] => {
    const summary = jdAnalysis.summary.toLowerCase();
    const allSkills: string[] = [];

    for (const [industry, skills] of Object.entries(SKILL_PRESETS)) {
      if (summary.includes(industry.split('/')[0].toLowerCase())) {
        allSkills.push(...skills);
      }
    }

    // If no match, return internet skills as default
    return allSkills.length > 0 ? Array.from(new Set(allSkills)) : SKILL_PRESETS['互联网/科技'];
  };

  // State
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // Form state
  const [educationLevel, setEducationLevel] = useState<EducationLevel | ''>('');
  const [majorCategory, setMajorCategory] = useState('');
  const [majorCustom, setMajorCustom] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [experienceCount, setExperienceCount] = useState(0);
  const [experienceIndustries, setExperienceIndustries] = useState<string[]>([]);
  const [certificates, setCertificates] = useState<string[]>([]);
  const [softSkillSelfRating, setSoftSkillSelfRating] = useState<Record<string, number>>({});

  // Initialize from assessment result if available
  useEffect(() => {
    if (assessmentResult?.softSkillRadar) {
      // Map assessment soft skills to our preset format
      const mapped: Record<string, number> = {};
      for (const [key, value] of Object.entries(assessmentResult.softSkillRadar)) {
        // Find matching preset skill
        const presetSkill = SOFT_SKILL_PRESETS.find(
          (p) => p.toLowerCase().includes(key.toLowerCase())
        );
        if (presetSkill) {
          // Convert 100-scale to 5-scale
          mapped[presetSkill] = Math.max(1, Math.min(5, Math.round(value / 20)));
        }
      }
      if (Object.keys(mapped).length > 0) {
        setSoftSkillSelfRating(mapped);
      }
    }
  }, [assessmentResult]);

  const relevantSkillPresets = getRelevantSkillPresets();

  // Navigation
  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return !!educationLevel;
      case 1:
        return !!majorCategory;
      case 2:
        return skills.length > 0;
      case 3:
        return true; // experienceCount can be 0
      case 4:
        return Object.keys(softSkillSelfRating).length > 0;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (!canProceed()) return;

    if (currentStep < STEP_QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    const profile: UserProfile = {
      educationLevel: educationLevel as EducationLevel,
      majorCategory: majorCustom.trim() || majorCategory,
      skills,
      experienceCount,
      experienceIndustries,
      certificates,
      competitions: [],
      softSkillSelfRating,
    };
    setIsComplete(true);
    // Small delay for animation before callback
    setTimeout(() => onComplete(profile), 500);
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        // Education Level Selection
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {EDUCATION_LEVELS.map((level) => (
                <button
                  key={level}
                  onClick={() => setEducationLevel(level)}
                  className={`px-4 py-3 text-sm rounded-lg border transition-all ${
                    educationLevel === level
                      ? 'bg-terracotta text-ivory border-terracotta'
                      : 'bg-ivory text-near-black border-border-warm hover:border-terracotta/50'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        );

      case 1:
        // Major Category Selection
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {MAJOR_CATEGORIES.map((major) => (
                <button
                  key={major}
                  onClick={() => setMajorCategory(major)}
                  className={`px-4 py-2.5 text-sm rounded-lg border transition-all ${
                    majorCategory === major
                      ? 'bg-terracotta text-ivory border-terracotta'
                      : 'bg-ivory text-near-black border-border-warm hover:border-terracotta/50'
                  }`}
                >
                  {major}
                </button>
              ))}
            </div>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-gray text-sm">补充:</span>
              <input
                type="text"
                value={majorCustom}
                onChange={(e) => setMajorCustom(e.target.value)}
                placeholder="具体专业名称（选填）"
                className="w-full pl-14 pr-4 py-2.5 text-sm bg-parchment border border-border-warm rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta/30"
              />
            </div>
          </div>
        );

      case 2:
        // Skills Selection
        return (
          <SkillSelector
            presets={relevantSkillPresets}
            selectedSkills={skills}
            onSkillsChange={setSkills}
            customPlaceholder="添加其他技能..."
          />
        );

      case 3:
        // Experience Selection
        return (
          <div className="space-y-6">
            {/* Experience count */}
            <div className="space-y-3">
              <p className="text-sm text-olive-gray">实习/项目经历数量</p>
              <div className="flex gap-2">
                {EXPERIENCE_COUNT_OPTIONS.map((count) => (
                  <button
                    key={count}
                    onClick={() => setExperienceCount(count)}
                    className={`flex-1 py-3 text-sm rounded-lg border transition-all ${
                      experienceCount === count
                        ? 'bg-terracotta text-ivory border-terracotta'
                        : 'bg-ivory text-near-black border-border-warm hover:border-terracotta/50'
                    }`}
                  >
                    {count === 0 ? '无' : `${count}段`}
                  </button>
                ))}
              </div>
            </div>

            {/* Industry selection */}
            {experienceCount > 0 && (
              <div className="space-y-3">
                <p className="text-sm text-olive-gray">涉及行业（可多选）</p>
                <div className="flex flex-wrap gap-2">
                  {INDUSTRY_PRESETS.map((industry) => {
                    const isSelected = experienceIndustries.includes(industry);
                    return (
                      <button
                        key={industry}
                        onClick={() => {
                          if (isSelected) {
                            setExperienceIndustries(experienceIndustries.filter((i) => i !== industry));
                          } else {
                            setExperienceIndustries([...experienceIndustries, industry]);
                          }
                        }}
                        className={`px-3 py-1.5 text-sm rounded-full transition-all ${
                          isSelected
                            ? 'bg-terracotta text-ivory'
                            : 'bg-parchment text-olive-gray hover:bg-warm-sand'
                        }`}
                      >
                        {industry}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Certificates */}
            <div className="space-y-3">
              <p className="text-sm text-olive-gray">已获证书（可多选）</p>
              <div className="flex flex-wrap gap-2">
                {CERTIFICATE_PRESETS.map((cert) => {
                  const isSelected = certificates.includes(cert);
                  return (
                    <button
                      key={cert}
                      onClick={() => {
                        if (isSelected) {
                          setCertificates(certificates.filter((c) => c !== cert));
                        } else {
                          setCertificates([...certificates, cert]);
                        }
                      }}
                      className={`px-3 py-1.5 text-sm rounded-full transition-all ${
                        isSelected
                          ? 'bg-terracotta text-ivory'
                          : 'bg-parchment text-olive-gray hover:bg-warm-sand'
                      }`}
                    >
                      {cert}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 4:
        // Soft Skills Self Rating
        return (
          <div className="space-y-4">
            {assessmentResult?.softSkillRadar && Object.keys(softSkillSelfRating).length === 0 && (
              <p className="text-xs text-stone-gray mb-4">
                从你的职业测评结果中发现了一些软技能评分，已为你预填充
              </p>
            )}
            <div className="space-y-4">
              {SOFT_SKILL_PRESETS.map((skill) => (
                <SoftSkillSlider
                  key={skill}
                  skill={skill}
                  value={softSkillSelfRating[skill] || 3}
                  onChange={(value) =>
                    setSoftSkillSelfRating({ ...softSkillSelfRating, [skill]: value })
                  }
                />
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (isComplete) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in-up">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.6 }}
        >
          <Sparkles size={48} className="text-terracotta mb-4" />
        </motion.div>
        <h3 className="text-heading-5 font-serif text-near-black mb-2">
          信息收集完成！
        </h3>
        <p className="text-sm text-olive-gray">
          正在为你生成匹配分析...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Progress */}
      <ProgressDots current={currentStep} total={STEP_QUESTIONS.length} />

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto space-y-6 px-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* AI Question */}
            <ChatBubble type="ai">
              <div className="space-y-1">
                <p className="font-medium">{STEP_QUESTIONS[currentStep].question}</p>
                <p className="text-sm text-olive-gray">
                  {STEP_QUESTIONS[currentStep].subtext}
                </p>
              </div>
            </ChatBubble>

            {/* User Response Area */}
            <ChatBubble type="user">
              <div>{renderStepContent()}</div>
            </ChatBubble>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="pt-6 mt-6 border-t border-border-warm">
        <button
          onClick={handleNext}
          disabled={!canProceed()}
          className={`w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
            canProceed()
              ? 'bg-terracotta text-ivory hover:bg-coral'
              : 'bg-parchment text-stone-gray cursor-not-allowed'
          }`}
        >
          {currentStep === STEP_QUESTIONS.length - 1 ? (
            <>
              开始分析
              <Sparkles size={16} />
            </>
          ) : (
            <>
              继续
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
