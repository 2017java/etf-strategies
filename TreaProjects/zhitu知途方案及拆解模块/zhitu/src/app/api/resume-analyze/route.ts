import { NextRequest, NextResponse } from 'next/server';
import { extractResumeText, sanitizeResume, analyzeResumeAI } from '@/lib/resume';
import type { JDAnalysisResult, MatchResult } from '@/types';

// File validation constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const ALLOWED_EXTENSIONS = ['.pdf', '.docx'];

export async function POST(request: NextRequest) {
  try {
    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    // Validate file presence
    if (!file) {
      return NextResponse.json(
        { message: '请上传简历文件' },
        { status: 400 }
      );
    }

    // Validate file type
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    const isValidType = ALLOWED_TYPES.includes(file.type) ||
      ALLOWED_EXTENSIONS.includes(extension);

    if (!isValidType) {
      return NextResponse.json(
        { message: '不支持的文件格式，请上传 PDF 或 DOCX 文件' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: `文件大小超过限制（${MAX_FILE_SIZE / 1024 / 1024}MB），请上传更小的文件` },
        { status: 400 }
      );
    }

    // Extract text from resume
    let resumeText: string;
    try {
      const extractResult = await extractResumeText(file);
      resumeText = extractResult.text;
    } catch (extractError) {
      console.error('Resume extraction error:', extractError);
      return NextResponse.json(
        { message: '无法读取简历文件内容，请确保文件未损坏' },
        { status: 422 }
      );
    }

    // Check if resume has content
    if (!resumeText || resumeText.trim().length < 50) {
      return NextResponse.json(
        { message: '简历内容过少或无法识别，请上传更完整的简历' },
        { status: 422 }
      );
    }

    // Sanitize resume (remove personal info)
    const sanitizedResume = sanitizeResume(resumeText);

    // Load JD analysis from FormData (sent from client)
    let jdAnalysis: JDAnalysisResult | null = null;
    let matchResult: MatchResult | undefined;

    const jdAnalysisStr = formData.get('jdAnalysis') as string | null;
    if (jdAnalysisStr) {
      try {
        jdAnalysis = JSON.parse(jdAnalysisStr);
      } catch (err) {
        console.warn('Failed to parse JD analysis:', err);
        // Continue without JD analysis - will do generic analysis
      }
    }

    // If no JD analysis provided, create a basic one for generic analysis
    if (!jdAnalysis) {
      jdAnalysis = {
        summary: '通用岗位分析',
        hardSkills: { required: [], niceToHave: [] },
        softSkills: [],
        careerPath: { year1: '', year3: '', year5: '' },
        hiddenRequirements: [],
        fresherFriendly: 2,
        analysisMode: 'keyword',
      };
    }

    // Perform AI analysis (with fallback to rule-based)
    const analysisResult = await analyzeResumeAI(
      sanitizedResume,
      jdAnalysis,
      matchResult
    );

    return NextResponse.json(analysisResult);
  } catch (error) {
    console.error('Resume analysis error:', error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('API') || error.message.includes('timeout')) {
        return NextResponse.json(
          { message: 'AI 服务暂时不可用，将使用规则分析' },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { message: '简历分析失败，请稍后重试' },
      { status: 500 }
    );
  }
}