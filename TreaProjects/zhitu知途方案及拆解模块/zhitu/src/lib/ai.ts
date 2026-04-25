import { type ZodSchema } from 'zod';

export interface AICallOptions {
  prompt: string;
  systemPrompt: string;
  responseSchema?: ZodSchema;
  timeout?: number;
  fallback?: () => Promise<unknown>;
  stream?: boolean;
}

const DEFAULT_TIMEOUT = 8000;

// Client-side rate limiting
const rateLimits = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMITS: Record<string, { max: number; windowMs: number }> = {
  '/api/jd-decode': { max: 10, windowMs: 3600000 },
  '/api/match-score': { max: 10, windowMs: 3600000 },
  '/api/resume-analyze': { max: 5, windowMs: 3600000 },
  '/api/assessment': { max: 3, windowMs: 86400000 },
};

function checkRateLimit(endpoint: string): boolean {
  const config = RATE_LIMITS[endpoint];
  if (!config) return true;

  const now = Date.now();
  const entry = rateLimits.get(endpoint);

  if (!entry || now > entry.resetAt) {
    rateLimits.set(endpoint, { count: 1, resetAt: now + config.windowMs });
    return true;
  }

  if (entry.count >= config.max) {
    return false;
  }

  entry.count++;
  return true;
}

/**
 * Server-side AI call via Volcano Ark (Doubao).
 * Only callable from API Routes — ARK_API_KEY is server-only.
 */
export async function callAI<T = unknown>(options: AICallOptions): Promise<T> {
  const {
    prompt,
    systemPrompt,
    responseSchema,
    timeout = DEFAULT_TIMEOUT,
    fallback,
  } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const apiKey = process.env.ARK_API_KEY;
    const model = process.env.ARK_MODEL || 'doubao-pro-128k';

    if (!apiKey) {
      throw new Error('ARK_API_KEY is not configured');
    }

    const response = await fetch(
      'https://ark.cn-beijing.volces.com/api/coding/v3/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 4096,
        }),
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      throw new Error(`Ark API error: ${response.status} ${response.statusText}`);
    }

    const json = await response.json();
    const content = json.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Empty response from Ark API');
    }

    // Try to parse JSON from the response
    let parsed: unknown;
    try {
      // Strip markdown code block markers if present
      const cleaned = content
        .replace(/^```(?:json)?\s*/m, '')
        .replace(/\s*```$/m, '')
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      throw new Error('Failed to parse AI response as JSON');
    }

    // Validate with Zod schema if provided
    if (responseSchema) {
      const result = responseSchema.safeParse(parsed);
      if (!result.success) {
        console.warn('AI response schema validation failed:', result.error);
        throw new Error('AI response schema validation failed');
      }
      return result.data as T;
    }

    return parsed as T;
  } catch (error) {
    console.warn('AI call failed, falling back:', (error as Error).message);

    if (fallback) {
      return (await fallback()) as T;
    }

    throw error;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Streaming AI call — returns a ReadableStream for Server-Sent Events.
 */
export async function callAIStream(
  options: Omit<AICallOptions, 'stream'>
): Promise<ReadableStream<Uint8Array>> {
  const { prompt, systemPrompt, timeout = DEFAULT_TIMEOUT } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  const apiKey = process.env.ARK_API_KEY;
  const model = process.env.ARK_MODEL || 'doubao-pro-128k';

  if (!apiKey) {
    throw new Error('ARK_API_KEY is not configured');
  }

  const response = await fetch(
    'https://ark.cn-beijing.volces.com/api/coding/v3/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 4096,
        stream: true,
      }),
      signal: controller.signal,
    }
  );

  clearTimeout(timer);

  if (!response.ok) {
    throw new Error(`Ark API stream error: ${response.status}`);
  }

  if (!response.body) {
    throw new Error('No response body for streaming');
  }

  return response.body;
}

/**
 * Client-side helper to call our own API routes with rate limiting.
 */
export async function callAPI<T = unknown>(
  endpoint: string,
  body: unknown
): Promise<T> {
  if (!checkRateLimit(endpoint)) {
    throw new Error('请求过于频繁，请稍后再试');
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `API error: ${response.status}`);
  }

  return response.json() as Promise<T>;
}
