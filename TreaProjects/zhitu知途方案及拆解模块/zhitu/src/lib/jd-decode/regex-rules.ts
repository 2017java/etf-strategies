export interface RegexMatch {
  type: 'experience' | 'education' | 'salary' | 'certificate';
  value: string;
  detail?: Record<string, string>;
}

export function extractByRegex(text: string): RegexMatch[] {
  const matches: RegexMatch[] = [];

  const patterns = [
    {
      type: 'experience' as const,
      regex: /(\d+)[-~至](\d+)\s*年/,
      handler: (match: RegExpExecArray) => ({
        value: `${match[1]}-${match[2]}年`,
        detail: { min: match[1], max: match[2] },
      }),
    },
    {
      type: 'experience' as const,
      regex: /(\d+)\s*年以上/,
      handler: (match: RegExpExecArray) => ({
        value: `${match[1]}年以上`,
        detail: { min: match[1], max: '无上限' },
      }),
    },
    {
      type: 'experience' as const,
      regex: /应届生|应届/,
      handler: () => ({
        value: '应届生',
        detail: { type: 'fresh', min: '0', max: '0' },
      }),
    },
    {
      type: 'education' as const,
      regex: /本科|硕士|博士|大专|专科|985|211|双一流|统招/,
      handler: (match: RegExpExecArray) => ({
        value: match[0],
        detail: { level: match[0] },
      }),
    },
    {
      type: 'salary' as const,
      regex: /(\d+[kK万]?)[-~至](\d+[kK万]?)/,
      handler: (match: RegExpExecArray) => ({
        value: `${match[1]}-${match[2]}`,
        detail: { min: match[1], max: match[2] },
      }),
    },
    {
      type: 'certificate' as const,
      regex: /CPA|CFA|PMP|ACCA|六级|英语四级|雅思|托福|教师资格证|法律职业资格|驾照/,
      handler: (match: RegExpExecArray) => ({
        value: match[0],
        detail: { name: match[0] },
      }),
    },
  ];

  const processedMatches = new Set<string>();

  for (const pattern of patterns) {
    const regex = new RegExp(pattern.regex.source, 'g');
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const result = pattern.handler(match);
      const key = `${pattern.type}:${result.value}`;

      if (!processedMatches.has(key)) {
        processedMatches.add(key);
        matches.push({
          type: pattern.type,
          value: result.value,
          detail: result.detail,
        });
      }
    }
  }

  return matches;
}
