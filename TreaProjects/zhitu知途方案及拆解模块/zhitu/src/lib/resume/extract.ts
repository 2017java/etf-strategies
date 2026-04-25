/**
 * Resume Text Extraction
 * Supports PDF (.pdf) and DOCX (.docx) files
 */

// pdf-parse is CommonJS, use require to avoid ESM issues
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse');
import mammoth from 'mammoth';

export interface ResumeSection {
  type: 'header' | 'summary' | 'experience' | 'education' | 'skills' | 'projects' | 'certifications' | 'other';
  title: string;
  content: string;
}

export interface ExtractResult {
  text: string;
  sections: ResumeSection[];
}

/**
 * Extract text content from a resume file (PDF or DOCX)
 * @param file - The uploaded file (PDF or DOCX)
 * @returns Extracted text and parsed sections
 */
export async function extractResumeText(file: File): Promise<ExtractResult> {
  const fileBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(fileBuffer);

  let text: string;

  if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
    text = await extractFromPDF(buffer);
  } else if (
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.name.endsWith('.docx')
  ) {
    text = await extractFromDOCX(buffer);
  } else {
    throw new Error(`Unsupported file type: ${file.type}. Please upload a PDF or DOCX file.`);
  }

  // Parse sections from extracted text
  const sections = parseSections(text);

  return { text, sections };
}

/**
 * Extract text from PDF using pdf-parse
 */
async function extractFromPDF(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    return data.text || '';
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

/**
 * Extract text from DOCX using mammoth
 */
async function extractFromDOCX(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  } catch (error) {
    console.error('DOCX extraction error:', error);
    throw new Error('Failed to extract text from DOCX');
  }
}

/**
 * Parse resume text into sections
 * This is a basic implementation - more sophisticated parsing can be added
 */
function parseSections(text: string): ResumeSection[] {
  const sections: ResumeSection[] = [];

  // Define section patterns
  const sectionPatterns: Array<{ type: ResumeSection['type']; patterns: RegExp[] }> = [
    {
      type: 'header',
      patterns: [
        /^(姓名|name|姓名：|name：)\s*.+/im,
        /^[一-龥]{2,4}$/m, // Chinese name pattern
      ],
    },
    {
      type: 'summary',
      patterns: [
        /^(个人简介|个人概述|简介|summary|about|profile)[\s:：]*/im,
      ],
    },
    {
      type: 'experience',
      patterns: [
        /^(工作经历|职业经历|经历|experience|work experience|employment)[\s:：]*/im,
      ],
    },
    {
      type: 'education',
      patterns: [
        /^(教育背景|学历|教育|education|academic)[\s:：]*/im,
      ],
    },
    {
      type: 'skills',
      patterns: [
        /^(技能|专业技能|技术技能|skills|technical skills|technologies)[\s:：]*/im,
      ],
    },
    {
      type: 'projects',
      patterns: [
        /^(项目经历|项目经验|项目|projects|project experience)[\s:：]*/im,
      ],
    },
    {
      type: 'certifications',
      patterns: [
        /^(证书|资质| certifications|credentials)[\s:：]*/im,
      ],
    },
  ];

  // Split text by lines and try to identify sections
  const lines = text.split('\n');
  let currentSection: ResumeSection | null = null;
  let currentContent: string[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Check if this line is a section header
    let matchedSection: ResumeSection['type'] | null = null;

    for (const { type, patterns } of sectionPatterns) {
      for (const pattern of patterns) {
        if (pattern.test(trimmedLine)) {
          matchedSection = type;
          break;
        }
      }
      if (matchedSection) break;
    }

    if (matchedSection) {
      // Save previous section
      if (currentSection && currentContent.length > 0) {
        sections.push({
          ...currentSection,
          content: currentContent.join('\n'),
        });
      }

      // Start new section
      currentSection = {
        type: matchedSection,
        title: trimmedLine,
        content: '',
      };
      currentContent = [];
    } else if (currentSection) {
      currentContent.push(trimmedLine);
    } else {
      // Content before any recognized section
      currentSection = {
        type: 'other',
        title: 'Other',
        content: '',
      };
      currentContent.push(trimmedLine);
    }
  }

  // Save last section
  if (currentSection && currentContent.length > 0) {
    sections.push({
      ...currentSection,
      content: currentContent.join('\n'),
    });
  }

  return sections;
}