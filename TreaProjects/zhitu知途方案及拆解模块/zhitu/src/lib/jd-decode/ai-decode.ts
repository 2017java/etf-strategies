import { z } from 'zod';
import { callAI } from '@/lib/ai';
import type { JDAnalysisResult } from '@/types';

const SkillItemSchema = z.object({
  name: z.string(),
  shortTermLearnable: z.boolean(),
  priority: z.enum(['high', 'medium', 'low']),
});

const SoftSkillItemSchema = z.object({
  keyword: z.string(),
  concreteBehavior: z.string(),
});

const CareerPathSchema = z.object({
  year1: z.string(),
  year3: z.string(),
  year5: z.string(),
});

const JDAnalysisResultSchema = z.object({
  summary: z.string(),
  hardSkills: z.object({
    required: z.array(SkillItemSchema),
    niceToHave: z.array(SkillItemSchema),
  }),
  softSkills: z.array(SoftSkillItemSchema),
  careerPath: CareerPathSchema,
  hiddenRequirements: z.array(z.string()),
  fresherFriendly: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  analysisMode: z.enum(['ai', 'keyword']),
  jobTitle: z.string().optional(),
});

const SYSTEM_PROMPT = `你是一位经验丰富的职场顾问和前 HR 总监，专门帮助大学生解读招聘信息（JD）。你的任务是将专业/模糊的招聘描述翻译成大学生能真正理解的大白话。

## 输入
用户提供的招聘 JD 原文。

## 输出要求（严格 JSON 格式，不要 markdown）

{
  "summary": "string - 用30字以内的大白话概括这个岗位的核心工作内容。去掉所有公司自夸话术、虚词修饰。直接说清楚：这个岗位每天主要做什么。",
  "hardSkills": {
    "required": [
      {
        "name": "string - 技能名称",
        "shortTermLearnable": boolean,
        "priority": "high|medium|low"
      }
    ],
    "niceToHave": [
      {
        "name": "string - 技能名称",
        "shortTermLearnable": boolean,
        "priority": "high|medium|low"
      }
    ]
  },
  "softSkills": [
    {
      "keyword": "string - JD中的原始表述",
      "concreteBehavior": "string - 这在实际工作中具体意味着什么行为。举例说明。"
    }
  ],
  "careerPath": {
    "year1": "string - 入职第1年 typically 做什么",
    "year3": "string - 3年经验时通常的职级和职责",
    "year5": "string - 5年经验时可能的职业发展方向"
  },
  "hiddenRequirements": [
    "string - JD中没写但实际很重要的要求。基于行业经验推断。"
  ],
  "fresherFriendly": 1,
  "analysisMode": "ai",
  "jobTitle": "string - 提取的岗位名称"
}

## fresherFriendly 评级标准
- 1（友好）：应届生可直接申请，无硬性经验要求，有明确培养路径
- 2（一般）：有经验偏好但非硬性要求，需要一定基础能力
- 3（较难）：明确要求1-3年经验，或技能栈对应届生不友好

## 约束
1. summary 必须是大白话，禁止使用"负责"、"参与"、"协助"等模糊动词
2. hardSkills.required 至少 2 项，niceToHave 至少 1 项
3. softSkills 至少 2 项，每项 concreteBehavior 必须包含具体行为举例
4. careerPath 每个阶段必须具体，禁止"持续发展"等空话
5. hiddenRequirements 至少 1 项，基于行业真实潜规则
6. shortTermLearnable 判断标准：3个月内可通过自学/在线课程掌握 = true
7. 只输出 JSON，禁止 markdown 代码块标记`;

function buildUserPrompt(jdText: string): string {
  return `请分析以下职位描述：

${jdText}

请以JSON格式输出分析结果。`;
}

export async function aiDecode(jdText: string): Promise<JDAnalysisResult> {
  const result = await callAI<JDAnalysisResult>({
    systemPrompt: SYSTEM_PROMPT,
    prompt: buildUserPrompt(jdText),
    responseSchema: JDAnalysisResultSchema,
    timeout: 8000,
  });

  return { ...result, analysisMode: 'ai' };
}
