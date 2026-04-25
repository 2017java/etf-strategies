import { NextRequest, NextResponse } from 'next/server';

import type { UserProfile, JDAnalysisResult, AssessmentResult, MatchResult } from '@/types';
import { calculateMatchScore } from '@/lib/match-score/calculate';
import { generateMatchAnalysis } from '@/lib/match-score/ai-analyze';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { profile, jdAnalysis, assessmentResult } = body as {
      profile: UserProfile;
      jdAnalysis: JDAnalysisResult;
      assessmentResult?: AssessmentResult;
    };

    // Validate required fields
    if (!profile) {
      return NextResponse.json(
        { error: 'Missing required field: profile' },
        { status: 400 }
      );
    }

    if (!jdAnalysis) {
      return NextResponse.json(
        { error: 'Missing required field: jdAnalysis' },
        { status: 400 }
      );
    }

    // Get dimension scores and radar data from template-based calculation
    const baseResult = calculateMatchScore(profile, jdAnalysis, assessmentResult);

    // Get AI-enhanced gap analysis and action plan
    const aiAnalysis = await generateMatchAnalysis(profile, jdAnalysis, assessmentResult);

    // Merge results: use base scores/radar/timeline, AI gaps/actions
    const result: MatchResult = {
      ...baseResult,
      gaps: aiAnalysis.gaps,
      actionPlan: aiAnalysis.actionPlan,
      timeline: aiAnalysis.timeline,
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error('Match score calculation error:', err);
    return NextResponse.json(
      { error: 'Internal server error while calculating match score' },
      { status: 500 }
    );
  }
}
