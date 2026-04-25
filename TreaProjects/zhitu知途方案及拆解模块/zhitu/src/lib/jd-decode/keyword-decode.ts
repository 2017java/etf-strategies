import type { JDAnalysisResult, SkillItem, SoftSkillItem } from '@/types';
import { extractByRegex } from './regex-rules';
import { extractKeywords } from './tfidf';
import { KEYWORD_DICT, SOFT_SKILL_BEHAVIORS } from './keyword-dict';

function extractJobTitle(text: string): string | undefined {
  const patterns = [
    /招聘岗位：([^\n，。；,.;]+)/,
    /([^\n，。；,.;]+)(?:工程师|经理|专员|主管|总监|设计师|分析师|顾问|助理)/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  return undefined;
}

function extractExperience(matches: ReturnType<typeof extractByRegex>): string | undefined {
  const expMatches = matches.filter(match => match.type === 'experience');
  if (expMatches.length > 0) {
    return expMatches[0].value;
  }
  return undefined;
}

function extractEducation(matches: ReturnType<typeof extractByRegex>): string | undefined {
  const eduMatches = matches.filter(match => match.type === 'education');
  if (eduMatches.length > 0) {
    return eduMatches[0].value;
  }
  return undefined;
}

function extractCertificates(matches: ReturnType<typeof extractByRegex>): string[] {
  return matches
    .filter(match => match.type === 'certificate')
    .map(match => match.value);
}

function determineFresherFriendly(exp: string | undefined): 1 | 2 | 3 {
  if (!exp) return 2;
  if (exp.includes('应届生') || exp.includes('应届') || exp.includes('0-') || exp.includes('无经验')) {
    return 1;
  }
  if (exp.includes('1年') || exp.includes('一年')) {
    return 2;
  }
  return 3;
}

function inferHiddenRequirements(matches: ReturnType<typeof extractByRegex>): string[] {
  const hidden: string[] = [];

  const expMatches = matches.filter(match => match.type === 'experience');
  if (expMatches.some(m => m.value.includes('3-') || m.value.includes('5年'))) {
    hidden.push('需要独立负责项目的能力');
  }

  const eduMatches = matches.filter(match => match.type === 'education');
  if (eduMatches.some(m => ['985', '211', '双一流'].includes(m.value))) {
    hidden.push('隐性要求名校背景');
  }

  const certMatches = matches.filter(match => match.type === 'certificate');
  if (certMatches.length > 2) {
    hidden.push('需要具备多项专业资质');
  }

  return hidden;
}

function buildCareerPath(keywords: string[]): { year1: string; year3: string; year5: string } {
  const isTech = keywords.some(k => ['Python', 'Java', 'JavaScript', 'React', 'Vue', 'Node.js', 'CAD', 'PLC'].includes(k));
  const isFinance = keywords.some(k => ['财务分析', '风险控制', '金融建模', '数据分析'].includes(k));
  const isMarketing = keywords.some(k => ['市场调研', '活动策划', '销售技巧', '客户关系'].includes(k));
  const isEducation = keywords.some(k => ['教学设计', '课程开发', '教学方法'].includes(k));

  if (isTech) {
    return {
      year1: '熟悉公司技术栈，完成基础功能开发，参与代码评审',
      year3: '成为技术骨干，负责核心模块设计，指导初级工程师',
      year5: '晋升技术经理，负责技术架构设计，推动技术创新',
    };
  }

  if (isFinance) {
    return {
      year1: '学习财务分析方法，协助完成报表制作，熟悉公司财务流程',
      year3: '独立完成项目财务分析，优化财务模型，提出改进建议',
      year5: '负责财务团队管理，制定财务策略，参与公司战略决策',
    };
  }

  if (isMarketing) {
    return {
      year1: '协助市场调研，执行活动策划，维护客户关系',
      year3: '独立负责市场推广，制定营销策略，完成销售目标',
      year5: '负责市场部门管理，策划大型营销活动，拓展市场渠道',
    };
  }

  if (isEducation) {
    return {
      year1: '掌握教学方法，完成基础教学任务，参与课程开发',
      year3: '成为教学骨干，开发特色课程，提高教学质量',
      year5: '担任教学管理职务，制定教学计划，培训新教师',
    };
  }

  return {
    year1: '熟悉公司业务流程，掌握岗位技能，完成基础工作',
    year3: '成为业务骨干，独立负责项目，优化工作流程',
    year5: '负责团队管理，制定部门策略，推动业务发展',
  };
}

export async function keywordDecode(jdText: string): Promise<JDAnalysisResult> {
  const regexMatches = extractByRegex(jdText);
  const keywordsResult = extractKeywords(jdText, 15);

  const knownSkills = KEYWORD_DICT.flatMap(category => category.keywords);

  const hardSkillsRequired: SkillItem[] = [];
  const hardSkillsNiceToHave: SkillItem[] = [];
  const softSkills: SoftSkillItem[] = [];
  const certificateItems: SkillItem[] = [];

  const matchedTerms = new Set<string>();

  for (const { term } of keywordsResult) {
    if (matchedTerms.has(term)) continue;

    const skillEntry = knownSkills.find(sk => sk.term === term || sk.relatedTerms.includes(term));

    if (skillEntry) {
      matchedTerms.add(term);

      const item: SkillItem = {
        name: term,
        shortTermLearnable: skillEntry.learnable,
        priority: skillEntry.priority,
      };

      if (skillEntry.type === 'hard') {
        if (skillEntry.priority === 'high' || skillEntry.priority === 'medium') {
          hardSkillsRequired.push(item);
        } else {
          hardSkillsNiceToHave.push(item);
        }
      } else if (skillEntry.type === 'soft') {
        softSkills.push({
          keyword: term,
          concreteBehavior: SOFT_SKILL_BEHAVIORS[term] || '具备良好的' + term,
        });
      }
    }
  }

  const certificates = extractCertificates(regexMatches);
  for (const cert of certificates) {
    if (!matchedTerms.has(cert)) {
      certificateItems.push({
        name: cert,
        shortTermLearnable: false,
        priority: 'low',
      });
      matchedTerms.add(cert);
    }
  }

  hardSkillsNiceToHave.push(...certificateItems);

  const topKeywords = keywordsResult.slice(0, 3).map(k => k.term);
  const experience = extractExperience(regexMatches);
  const education = extractEducation(regexMatches);

  let summary = '';
  if (topKeywords.length > 0) {
    summary = `这是一个需要${experience || '相关'}经验的${topKeywords[0]}岗位`;
    if (education) {
      summary += `，要求${education}学历`;
    }
  } else {
    summary = '这是一个需要相关经验的岗位';
  }

  if (summary.length > 30) {
    summary = summary.slice(0, 27) + '...';
  }

  if (hardSkillsRequired.length < 2) {
    hardSkillsRequired.push(
      { name: '相关专业背景', shortTermLearnable: false, priority: 'medium' },
    );
  }
  if (hardSkillsNiceToHave.length < 1) {
    hardSkillsNiceToHave.push(
      { name: '办公软件', shortTermLearnable: true, priority: 'low' },
    );
  }
  if (softSkills.length < 2) {
    softSkills.push(
      { keyword: '沟通能力', concreteBehavior: SOFT_SKILL_BEHAVIORS['沟通能力'] },
      { keyword: '学习能力', concreteBehavior: SOFT_SKILL_BEHAVIORS['学习能力'] },
    );
  }

  const hiddenReqs = inferHiddenRequirements(regexMatches);
  if (hiddenReqs.length < 1) {
    hiddenReqs.push('实际工作中可能需要比JD描述更多的跨部门协作能力');
  }

  return {
    summary,
    hardSkills: {
      required: hardSkillsRequired,
      niceToHave: hardSkillsNiceToHave,
    },
    softSkills,
    careerPath: buildCareerPath(keywordsResult.map(k => k.term)),
    hiddenRequirements: hiddenReqs,
    fresherFriendly: determineFresherFriendly(experience),
    analysisMode: 'keyword',
    jobTitle: extractJobTitle(jdText),
  };
}
