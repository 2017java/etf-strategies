import type { JDAnalysisResult } from '@/types';
import { aiDecode } from './ai-decode';
import { keywordDecode } from './keyword-decode';
import { getJDAnalysisByHash, saveJDAnalysis } from '@/lib/storage';

export async function computeJDHash(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function analyzeJD(
  jdText: string,
  useCache = true,
  userId = 'anonymous'
): Promise<JDAnalysisResult> {
  const jdHash = await computeJDHash(jdText);

  if (useCache) {
    const cached = await getJDAnalysisByHash(jdHash);
    if (cached) {
      return cached;
    }
  }

  let result: JDAnalysisResult;
  try {
    result = await aiDecode(jdText);
  } catch (error) {
    console.warn('AI decode failed, falling back to keyword decode:', error);
    result = await keywordDecode(jdText);
  }

  saveJDAnalysis(userId, jdHash, result).catch(err => {
    console.warn('Failed to save JD analysis:', err);
  });

  return result;
}

export { keywordDecode } from './keyword-decode';
export { aiDecode } from './ai-decode';
export { extractKeywords } from './tfidf';
export { extractByRegex } from './regex-rules';
