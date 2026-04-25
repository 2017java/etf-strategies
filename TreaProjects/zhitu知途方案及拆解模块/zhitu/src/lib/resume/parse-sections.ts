/**
 * Resume Section Structure Parsing
 * Identifies and extracts structured sections from resume text
 */

export interface ResumeSection {
  type: 'header' | 'summary' | 'experience' | 'education' | 'skills' | 'projects' | 'certifications' | 'other';
  title: string;
  content: string;
}

// Section detection patterns
const SECTION_PATTERNS: Array<{
  type: ResumeSection['type'];
  patterns: RegExp[];
  keywords: string[];
}> = [
  {
    type: 'header',
    patterns: [
      /^(姓名|name|姓名：|name：)\s*.+/im,
    ],
    keywords: ['姓名', 'name', '联系方式', 'contact'],
  },
  {
    type: 'summary',
    patterns: [
      /^(个人简介|个人概述|简介|summary|about|profile|个人概述)[\s:：]*/im,
    ],
    keywords: ['个人简介', '个人概述', '简介', 'summary', 'about', 'profile'],
  },
  {
    type: 'experience',
    patterns: [
      /^(工作经历|职业经历|经历|experience|work experience|employment)[\s:：]*/im,
    ],
    keywords: ['工作经历', '职业经历', '经历', 'experience', '工作', 'employment'],
  },
  {
    type: 'education',
    patterns: [
      /^(教育背景|学历|教育|education|academic)[\s:：]*/im,
    ],
    keywords: ['教育背景', '学历', '教育', 'education', '学校', 'academic'],
  },
  {
    type: 'skills',
    patterns: [
      /^(技能|专业技能|技术技能|skills|technical skills|technologies)[\s:：]*/im,
    ],
    keywords: ['技能', '专业技能', '技术技能', 'skills', 'technical', 'technologies'],
  },
  {
    type: 'projects',
    patterns: [
      /^(项目经历|项目经验|项目|projects|project experience)[\s:：]*/im,
    ],
    keywords: ['项目经历', '项目经验', '项目', 'projects', 'project'],
  },
  {
    type: 'certifications',
    patterns: [
      /^(证书|资质| certifications|credentials|所获证书)[\s:：]*/im,
    ],
    keywords: ['证书', '资质', 'certifications', 'credentials', '所获证书'],
  },
];

/**
 * Parse resume text into structured sections
 * @param text - Raw resume text
 * @returns Array of parsed sections
 */
export function parseSections(text: string): ResumeSection[] {
  const sections: ResumeSection[] = [];
  const lines = text.split('\n');

  let currentSection: ResumeSection | null = null;
  let currentContent: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      // Empty line - may be section separator
      if (currentContent.length > 0) {
        currentContent.push('');
      }
      continue;
    }

    // Check if this line is a section header
    const matchedType = detectSectionHeader(trimmedLine);

    if (matchedType) {
      // Save previous section
      if (currentSection && currentContent.length > 0) {
        const content = currentContent.join('\n').trim();
        if (content) {
          sections.push({
            ...currentSection,
            content,
          });
        }
      }

      // Start new section
      currentSection = {
        type: matchedType,
        title: trimmedLine.replace(/[：:]\s*$/, '').trim(),
        content: '',
      };
      currentContent = [];
    } else if (currentSection) {
      currentContent.push(trimmedLine);
    } else {
      // Content before any recognized section - treat as header or other
      currentSection = {
        type: detectPreSectionContent(trimmedLine) || 'other',
        title: 'Introduction',
        content: '',
      };
      currentContent.push(trimmedLine);
    }
  }

  // Save last section
  if (currentSection && currentContent.length > 0) {
    const content = currentContent.join('\n').trim();
    if (content) {
      sections.push({
        ...currentSection,
        content,
      });
    }
  }

  return sections;
}

/**
 * Detect if a line is a section header and return its type
 */
function detectSectionHeader(line: string): ResumeSection['type'] | null {
  for (const sectionDef of SECTION_PATTERNS) {
    // Check regex patterns
    for (const pattern of sectionDef.patterns) {
      if (pattern.test(line)) {
        return sectionDef.type;
      }
    }

    // Check keywords (case insensitive)
    const lowerLine = line.toLowerCase();
    for (const keyword of sectionDef.keywords) {
      if (lowerLine.includes(keyword.toLowerCase())) {
        return sectionDef.type;
      }
    }
  }

  return null;
}

/**
 * Detect content type before any recognized section
 */
function detectPreSectionContent(line: string): ResumeSection['type'] | null {
  // Chinese name pattern (2-4 characters)
  if (/^[一-龥]{2,4}$/.test(line)) {
    return 'header';
  }

  // Email pattern
  if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(line)) {
    return 'header';
  }

  // Phone pattern
  if (/(?:1[3-9]\d{9}|\+?1\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/.test(line)) {
    return 'header';
  }

  return null;
}

/**
 * Extract a specific section type from parsed sections
 */
export function getSectionByType(
  sections: ResumeSection[],
  type: ResumeSection['type']
): ResumeSection | undefined {
  return sections.find((s) => s.type === type);
}

/**
 * Get all experience-related section content
 */
export function getExperienceContent(sections: ResumeSection[]): string {
  const experienceSections = sections.filter(
    (s) => s.type === 'experience' || s.type === 'projects'
  );
  return experienceSections.map((s) => s.content).join('\n\n');
}