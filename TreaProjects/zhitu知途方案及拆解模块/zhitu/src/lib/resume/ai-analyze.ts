/**
 * AI-Enhanced Resume Analysis
 * Uses AI to provide deeper analysis with fallback to rule-based analysis
 */

import { z } from 'zod';
import { callAI } from '@/lib/ai';
import type { JDAnalysisResult, MatchResult, ResumeAnalysisResult, ResumeIssue, RewriteExample, Suggestion } from '@/types';
import { checkKeywordCoverage, type KeywordCoverageResult } from './keyword-check';
import { checkQuantification } from './quantify-check';
import { checkSTAR } from './star-check';
import { parseSections } from './parse-sections';

// AI Response Schema
const ResumeAnalysisSchema = z.object({
  overallScore: z.number().min(0).max(100),
  dimensionScores: z.object({
    format: z.number().min(0).max(100),
    content: z.number().min(0).max(100),
    keywords: z.number().min(0).max(100),
    quantification: z.number().min(0).max(100),
    structure: z.number().min(0).max(100),
  }),
  keywordCoverage: z.object({
    matched: z.array(z.string()),
    missing: z.array(z.string()),
    coverageRate: z.number(),
  }),
  issues: z.array(z.object({
    type: z.enum(['keyword_missing', 'no_quantify', 'no_star', 'redundant', 'weak_verb']),
    location: z.string(),
    originalText: z.string(),
    severity: z.enum(['high', 'medium', 'low']),
    suggestion: z.string(),
  })),
  topSuggestions: z.array(z.object({
    priority: z.number(),
    title: z.string(),
    description: z.string(),
    impact: z.enum(['high', 'medium', 'low']),
  })),
  rewriteExamples: z.array(z.object({
    original: z.string(),
    optimized: z.string(),
    reason: z.string(),
  })),
});

/**
 * AI System Prompt for Resume Analysis (from M3 spec)
 */
const RESUME_ANALYSIS_SYSTEM_PROMPT = `你是简历优化专家，擅长分析简历与岗位的匹配度，并提供具体的改进建议。

分析维度：
1. 格式分数 (format)：简历排版、结构、空白使用
2. 内容分数 (content)：工作经历描述的完整性和相关性
3. 关键词分数 (keywords)：与目标岗位的关键词匹配度
4. 量化分数 (quantification)：成果是否用数据量化
5. 结构分数 (structure)：STAR法则、逻辑清晰度

请根据简历内容和岗位要求，分析并输出：
- 各维度分数 (0-100)
- 总体分数 (0-100)
- 缺失关键词列表
- 具体问题及改进建议
- 优秀改写示例

以JSON格式输出。`;

/**
 * Analyze resume using AI with fallback to rule-based analysis
 * @param resumeText - Sanitized resume text
 * @param jdAnalysis - JD analysis result
 * @param matchResult - Optional match result for additional context
 * @returns Complete resume analysis result
 */
export async function analyzeResumeAI(
  resumeText: string,
  jdAnalysis: JDAnalysisResult,
  matchResult?: MatchResult
): Promise<ResumeAnalysisResult> {
  try {
    // Try AI analysis first
    const aiResult = await performAIAnalysis(resumeText, jdAnalysis, matchResult);
    return aiResult;
  } catch (error) {
    console.warn('AI analysis failed, falling back to rule-based analysis:', error);
    // Fallback to rule-based analysis
    return performRuleBasedAnalysis(resumeText, jdAnalysis);
  }
}

/**
 * Perform AI-enhanced analysis
 */
async function performAIAnalysis(
  resumeText: string,
  jdAnalysis: JDAnalysisResult,
  matchResult?: MatchResult
): Promise<ResumeAnalysisResult> {
  const prompt = buildAnalysisPrompt(resumeText, jdAnalysis, matchResult);

  const result = await callAI<z.infer<typeof ResumeAnalysisSchema>>({
    prompt,
    systemPrompt: RESUME_ANALYSIS_SYSTEM_PROMPT,
    responseSchema: ResumeAnalysisSchema,
    timeout: 30000,
  });

  return {
    ...result,
    analysisMode: 'ai',
  };
}

/**
 * Build the analysis prompt for AI
 */
function buildAnalysisPrompt(
  resumeText: string,
  jdAnalysis: JDAnalysisResult,
  matchResult?: MatchResult
): string {
  const sections = parseSections(resumeText);
  const experienceContent = sections
    .filter((s) => s.type === 'experience' || s.type === 'projects')
    .map((s) => s.content)
    .join('\n\n');

  let prompt = `请分析以下简历与岗位的匹配度：

## 简历内容（已脱敏）：
${resumeText.slice(0, 3000)}

## 主要工作经历：
${experienceContent.slice(0, 1500)}

## 岗位分析结果：
- 岗位：${jdAnalysis.jobTitle || '未知'}
- 摘要：${jdAnalysis.summary}
- 必需技能：${jdAnalysis.hardSkills?.required?.map((s) => s.name).join(', ') || '无'}
- 加分技能：${jdAnalysis.hardSkills?.niceToHave?.map((s) => s.name).join(', ') || '无'}
- 软技能：${jdAnalysis.softSkills?.map((s) => s.keyword).join(', ') || '无'}`;

  if (matchResult) {
    prompt += `
## 匹配度分析结果：
- 总分：${matchResult.totalScore}
- 技能匹配：${matchResult.dimensionScores.skills}
- 经验匹配：${matchResult.dimensionScores.experience}`;
  }

  prompt += `
请分析简历的问题并给出改进建议，以JSON格式输出。`;

  return prompt;
}

/**
 * Fallback rule-based analysis when AI is unavailable
 */
function performRuleBasedAnalysis(
  resumeText: string,
  jdAnalysis: JDAnalysisResult
): ResumeAnalysisResult {
  // Run all checks
  const keywordCoverage = checkKeywordCoverage(resumeText, jdAnalysis);
  const quantifyIssues = checkQuantification(resumeText);
  const starIssues = checkSTAR(resumeText);

  // Combine all issues
  const allIssues: ResumeIssue[] = [
    ...quantifyIssues,
    ...starIssues,
  ];

  // Add missing keyword issues
  for (const missing of keywordCoverage.missing) {
    allIssues.push({
      type: 'keyword_missing',
      location: 'Skills section',
      originalText: '',
      severity: 'high',
      suggestion: `简历中缺少"${missing}"关键词，建议在技能或经历中提及`,
    });
  }

  // Calculate scores
  const dimensionScores = calculateRuleBasedScores(resumeText, keywordCoverage, allIssues);
  const overallScore = calculateOverallScore(dimensionScores);

  // Generate suggestions
  const topSuggestions = generateSuggestions(allIssues, keywordCoverage);

  // Generate rewrite examples
  const rewriteExamples = generateRewriteExamples(allIssues);

  return {
    overallScore,
    dimensionScores,
    keywordCoverage,
    issues: allIssues,
    topSuggestions,
    rewriteExamples,
    analysisMode: 'keyword',
  };
}

/**
 * Calculate dimension scores using rules
 */
function calculateRuleBasedScores(
  resumeText: string,
  keywordCoverage: KeywordCoverageResult,
  issues: ResumeIssue[]
): ResumeAnalysisResult['dimensionScores'] {
  // Format score - basic check for structure
  const hasClearSections = /education|experience|skills/i.test(resumeText);
  const formatScore = hasClearSections ? 75 : 50;

  // Content score - based on line count and structure
  const lines = resumeText.split('\n').filter((l) => l.trim());
  const contentScore = Math.min(90, 50 + lines.length * 0.5);

  // Keyword score - directly from coverage
  const keywordsScore = keywordCoverage.coverageRate;

  // Quantification score
  const quantifyIssues = issues.filter((i) => i.type === 'no_quantify');
  const quantifyScore = Math.max(20, 80 - quantifyIssues.length * 15);

  // Structure score - based on STAR issues
  const starIssues = issues.filter((i) => i.type === 'no_star' || i.type === 'weak_verb');
  const structureScore = Math.max(30, 85 - starIssues.length * 20);

  return {
    format: Math.round(formatScore),
    content: Math.round(contentScore),
    keywords: Math.round(keywordsScore),
    quantification: Math.round(quantifyScore),
    structure: Math.round(structureScore),
  };
}

/**
 * Calculate overall score from dimension scores
 */
function calculateOverallScore(dimensions: ResumeAnalysisResult['dimensionScores']): number {
  const weights = {
    format: 0.1,
    content: 0.25,
    keywords: 0.3,
    quantification: 0.2,
    structure: 0.15,
  };

  const weighted = Object.entries(dimensions).reduce((sum, [key, value]) => {
    const weight = weights[key as keyof typeof weights];
    return sum + value * weight;
  }, 0);

  return Math.round(weighted);
}

/**
 * Generate prioritized suggestions
 */
function generateSuggestions(
  issues: ResumeIssue[],
  keywordCoverage: KeywordCoverageResult
): Suggestion[] {
  const suggestions: Suggestion[] = [];

  // High priority: missing keywords
  if (keywordCoverage.missing.length > 0) {
    suggestions.push({
      priority: 1,
      title: '补充关键技能关键词',
      description: `建议在简历中添加以下关键词：${keywordCoverage.missing.slice(0, 5).join('、')}`,
      impact: 'high',
    });
  }

  // High priority: quantification
  const noQuantifyIssues = issues.filter((i) => i.type === 'no_quantify');
  if (noQuantifyIssues.length > 0) {
    suggestions.push({
      priority: 2,
      title: '量化工作成果',
      description: `有${noQuantifyIssues.length}处工作描述缺少具体数据，建议添加百分比或具体数字`,
      impact: 'high',
    });
  }

  // Medium priority: STAR structure
  const starIssues = issues.filter((i) => i.type === 'no_star');
  if (starIssues.length > 0) {
    suggestions.push({
      priority: 3,
      title: '完善STAR结构',
      description: '建议使用STAR法则描述工作经历：情境、任务、行动、结果',
      impact: 'medium',
    });
  }

  // Medium priority: weak verbs
  const weakVerbIssues = issues.filter((i) => i.type === 'weak_verb');
  if (weakVerbIssues.length > 0) {
    suggestions.push({
      priority: 4,
      title: '使用更有力的动词',
      description: `建议将"参与"、"协助"等弱动词替换为"主导"、"实现"、"推动"等强动词`,
      impact: 'medium',
    });
  }

  return suggestions.sort((a, b) => a.priority - b.priority);
}

/**
 * Generate rewrite examples based on issues
 */
function generateRewriteExamples(issues: ResumeIssue[]): RewriteExample[] {
  const examples: RewriteExample[] = [];

  // Find quantifiable issues for examples
  const quantifyIssues = issues.filter((i) => i.type === 'no_quantify' && i.originalText);
  for (const issue of quantifyIssues.slice(0, 2)) {
    examples.push({
      original: issue.originalText,
      optimized: issue.originalText + '（提升了40%效率）',
      reason: '添加具体数据使成果更具说服力',
    });
  }

  // Find weak verb issues for examples
  const weakVerbIssues = issues.filter((i) => i.type === 'weak_verb' && i.originalText);
  for (const issue of weakVerbIssues.slice(0, 2)) {
    examples.push({
      original: issue.originalText,
      optimized: issue.originalText.replace(/参与|协助/g, '主导'),
      reason: '使用强动词提升表达力度',
    });
  }

  return examples;
}
