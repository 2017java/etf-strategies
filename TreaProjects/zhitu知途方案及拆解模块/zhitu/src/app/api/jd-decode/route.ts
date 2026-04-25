import { NextRequest, NextResponse } from 'next/server';
import { analyzeJD } from '@/lib/jd-decode';

const MAX_JD_TEXT_LENGTH = 50000;
const DEFAULT_USE_CACHE = true;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jdText, userId } = body;

    if (!jdText || typeof jdText !== 'string') {
      return NextResponse.json(
        { error: 'jdText is required and must be a string' },
        { status: 400 }
      );
    }

    if (jdText.length > MAX_JD_TEXT_LENGTH) {
      return NextResponse.json(
        { error: `jdText exceeds maximum length of ${MAX_JD_TEXT_LENGTH} characters` },
        { status: 400 }
      );
    }

    const effectiveUserId = typeof userId === 'string' && userId.trim() ? userId.trim() : 'anonymous';

    const result = await analyzeJD(jdText, DEFAULT_USE_CACHE, effectiveUserId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('JD decode API error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: `分析失败: ${message}` },
      { status: 500 }
    );
  }
}