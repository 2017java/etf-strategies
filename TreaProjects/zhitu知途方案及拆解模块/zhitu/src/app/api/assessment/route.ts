import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { callAI } from '@/lib/ai';
import { calculateAssessment } from '@/lib/assessment/scoring';
import type { AssessmentAnswer } from '@/types';

const requestSchema = z.object({
  answers: z.array(z.object({
    questionId: z.string(),
    value: z.number().min(-1).max(1),
  })),
});

const ASSESSMENT_SYSTEM_PROMPT = `你是一位资深的职业规划顾问，拥有心理学和人力资源双背景，专精于大学生职业发展指导。

## 任务
根据用户的测评结果数据，生成个性化的职业发展建议。

## 输出要求（严格 JSON 格式，不要 markdown）

{
  "personalityTag": "string - 两个字+型+一个字+星，如'探索型创造星'、'实干型领航星'",
  "careerDirections": [
    {
      "direction": "string - 职业方向名称",
      "representativeRoles": ["string - 2-3个代表岗位"],
      "matchReason": "string - 30字内匹配理由"
    }
  ],
  "aiTips": [
    "string - 具体的、可操作的职场建议，每条不超过40字"
  ]
}

## 约束
1. careerDirections 必须恰好包含 3 个方向
2. aiTips 必须恰好包含 3 条建议
3. 所有描述必须针对具体测评结果，禁止使用模板化/泛化语言
4. 语气温暖鼓励，但建议必须具体务实
5. 只输出 JSON，不要 markdown 格式或其他内容
6. personalityTag 必须有创意感，避免重复`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // 本地计算基础结果
    const answers: AssessmentAnswer[] = parsed.data.answers.map((a) => ({
      questionId: a.questionId,
      value: a.value,
    }));

    const baseResult = calculateAssessment(answers);

    // 尝试 AI 增强解读
    try {
      const aiPrompt = JSON.stringify({
        hollandCode: baseResult.hollandCode,
        hollandScores: baseResult.hollandScores,
        mbtiType: baseResult.mbtiType,
        softSkillRadar: baseResult.softSkillRadar,
      });

      const aiResult = await callAI<{
        personalityTag: string;
        careerDirections: { direction: string; representativeRoles: string[]; matchReason: string }[];
        aiTips: string[];
      }>({
        prompt: aiPrompt,
        systemPrompt: ASSESSMENT_SYSTEM_PROMPT,
        timeout: 8000,
        fallback: async () => null,
      });

      if (aiResult) {
        return NextResponse.json({
          ...baseResult,
          personalityTag: aiResult.personalityTag,
          topCareers: aiResult.careerDirections.map((d, i) => ({
            name: d.direction,
            matchScore: 90 - i * 5,
            reason: d.matchReason,
          })),
          aiTips: aiResult.aiTips.join('\n'),
          analysisMode: 'ai',
        });
      }
    } catch {
      // AI failed, return base result
    }

    return NextResponse.json({
      ...baseResult,
      analysisMode: 'keyword',
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
