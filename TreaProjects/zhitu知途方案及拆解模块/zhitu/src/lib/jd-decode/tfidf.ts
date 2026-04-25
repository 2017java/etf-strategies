import { KEYWORD_DICT, STOP_WORDS } from './keyword-dict';

export interface KeywordResult {
  term: string;
  score: number;
}

const PRECOMPUTED_IDF: Record<string, number> = {
  'Python': 3.2, 'Java': 3.1, 'JavaScript': 3.0, 'React': 2.9, 'Vue': 2.8,
  'Node.js': 2.7, 'MySQL': 2.6, 'Redis': 2.5, 'Docker': 2.4, 'Git': 2.3,
  'API': 2.2, '财务分析': 2.5, 'Excel': 1.8, '风险控制': 2.4, '数据分析': 2.1,
  '金融建模': 2.6, 'SQL': 2.3, '沟通能力': 1.5, '团队协作': 1.4, '学习能力': 1.6,
  '抗压能力': 1.7, '责任心': 1.5, '逻辑思维': 1.8, '创新思维': 1.9, '执行力': 1.7,
  'CAD': 2.8, 'PLC': 2.9, '质量管理': 2.5, '教学设计': 2.7, '课程开发': 2.6,
  '临床诊断': 3.0, '公文写作': 2.8, '政策研究': 2.7, '市场调研': 2.4,
  '活动策划': 2.3, '销售技巧': 2.2, '客户关系': 2.1,
};

const DEFAULT_IDF = 2.0;

interface KnownKeyword {
  term: string;
  original: string;
  type: 'hard' | 'soft';
  priority: 'high' | 'medium' | 'low';
  learnable: boolean;
}

const ALL_KNOWN_KEYWORDS: KnownKeyword[] = (() => {
  const keywords: KnownKeyword[] = [];
  for (const category of KEYWORD_DICT) {
    for (const kw of category.keywords) {
      keywords.push({ term: kw.term.toLowerCase(), original: kw.term, type: kw.type, priority: kw.priority, learnable: kw.learnable });
      for (const related of kw.relatedTerms) {
        keywords.push({ term: related.toLowerCase(), original: kw.term, type: kw.type, priority: kw.priority, learnable: kw.learnable });
      }
    }
  }
  return keywords;
})();

function removeStopWords(text: string): string {
  return text
    .split('')
    .filter(ch => !STOP_WORDS.includes(ch))
    .join('');
}

function generateBigrams(text: string): string[] {
  const bigrams: string[] = [];
  const chineseChars = text.match(/[一-龥]/g) || [];
  for (let i = 0; i < chineseChars.length - 1; i++) {
    bigrams.push(chineseChars[i] + chineseChars[i + 1]);
  }
  const englishWords = text.match(/[a-zA-Z0-9]+/g) || [];
  bigrams.push(...englishWords);
  return bigrams;
}

function getIDF(term: string): number {
  return PRECOMPUTED_IDF[term] || DEFAULT_IDF;
}

export function extractKeywords(text: string, topN = 20): KeywordResult[] {
  const lowerText = text.toLowerCase();
  const matchedKeywords: KeywordResult[] = [];
  const matchedTerms = new Set<string>();

  for (const kw of ALL_KNOWN_KEYWORDS) {
    if (!lowerText.includes(kw.term)) continue;
    if (matchedTerms.has(kw.original)) continue;

    const regex = new RegExp(kw.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const tf = (text.match(regex) || []).length;
    const idf = getIDF(kw.original);
    matchedKeywords.push({ term: kw.original, score: tf * idf });
    matchedTerms.add(kw.original);
  }

  if (matchedKeywords.length < topN) {
    const cleanedText = removeStopWords(lowerText);
    const bigrams = generateBigrams(cleanedText);
    const tf: Record<string, number> = {};
    const total = bigrams.length || 1;
    for (const b of bigrams) {
      tf[b] = (tf[b] || 0) + 1;
    }

    const bigramScores: KeywordResult[] = [];
    for (const [term, count] of Object.entries(tf)) {
      if (!matchedTerms.has(term) && term.length >= 2) {
        bigramScores.push({ term, score: (count / total) * getIDF(term) });
      }
    }

    bigramScores.sort((a, b) => b.score - a.score);
    matchedKeywords.push(...bigramScores.slice(0, topN - matchedKeywords.length));
  }

  matchedKeywords.sort((a, b) => b.score - a.score);
  return matchedKeywords.slice(0, topN);
}
