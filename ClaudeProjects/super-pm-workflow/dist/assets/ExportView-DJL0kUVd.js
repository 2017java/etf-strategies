const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./html2pdf-DlZpVan4.js","./chunk-B3K2TuZy.js"])))=>i.map(i=>d[i]);
import{n as e}from"./chunk-B3K2TuZy.js";import{J as t,S as n,a as r,d as i,i as a,m as o,p as s,r as c,u as l,y as u}from"./vue-router-cAm5-1Jr.js";import{t as d}from"./index-DPFS_Pau.js";import{n as f}from"./project-DlT7oQHt.js";import{t as p}from"./marked.esm-DgWhxqV6.js";var m={key:0,class:`export-page`},h={class:`export-header`},g={class:`export-desc`},_={class:`report-preview`},v=[`innerHTML`],y=r(u({__name:`ExportView`,setup(r){let u=c();a();let y=f(),b=l(()=>u.params.id),x=l(()=>y.projects.find(e=>e.id===b.value)),S=[{key:`requirement`,label:`需求录入`,icon:`📋`},{key:`brainstorming`,label:`方案头脑风暴`,icon:`💡`},{key:`prd`,label:`PRD 文档`,icon:`📄`},{key:`plans`,label:`实施计划`,icon:`🗂️`},{key:`abTest`,label:`A/B 实验`,icon:`🧪`},{key:`analytics`,label:`数据埋点`,icon:`📊`},{key:`onboarding`,label:`新用户激活`,icon:`🚀`}];function C(e){let t=e.requirement;return`# 需求录入\n\n**业务背景：**\n${t.businessContext}\n\n**问题陈述：**\n${t.problemStatement}\n\n**成功指标：**\n${t.successMetrics.map(e=>`- ${e.name}: ${e.target}`).join(`
`)}\n\n**目标用户：** ${t.targetUsers}\n\n**约束与范围：** ${t.constraints}\n\n**优先级：** ${t.priority}`}function w(e){let t=e.modules.brainstorming;if(!t)return``;let n=`# 方案头脑风暴\n\n## 设计方案\n\n${t.designScheme}\n\n## 架构概览\n\n${t.architectureOverview}`;return t.solutionOptions.length>0&&(n+=`

## 解决方案选项

`,t.solutionOptions.forEach((e,t)=>{n+=`### 方案 ${t+1}: ${e.title}${e.recommended?` ⭐推荐`:``}\n\n${e.description}\n\n**优点：** ${e.pros.join(`, `)}\n\n**缺点：** ${e.cons.join(`, `)}\n\n**难度：** ${e.difficulty}\n\n`})),n}function T(e){let t=e.modules.prd;if(!t)return``;let n=`# PRD 文档\n\n## 问题背景\n\n${t.problemBackground}\n\n## 产品愿景\n\n${t.productVision}`;return t.userStories.length>0&&(n+=`

## 用户故事

`,t.userStories.forEach((e,t)=>{n+=`### US${t+1} [${e.priority}]\n\n作为 **${e.role}**，我希望 **${e.want}**，以便 **${e.benefit}**\n\n**验收标准：**\n${e.acceptanceCriteria.map((e,t)=>`${t+1}. ${e}`).join(`
`)}\n\n`})),t.features.length>0&&(n+=`## 功能列表

| 功能 | 描述 | 优先级 | 状态 |
|------|------|--------|------|
`,t.features.forEach(e=>{n+=`| ${e.name} | ${e.description} | ${e.priority} | ${e.status} |\n`}),n+=`
`),n+=`## 技术架构\n\n${t.technicalArchitecture}\n\n## 验收标准\n\n${t.acceptanceCriteria}\n\n## 不在范围内\n\n${t.outOfScope}`,n}function E(e){let t=x.value;if(!t)return``;if(e===`requirement`)return C(t);if(e===`brainstorming`)return w(t);if(e===`prd`)return T(t);let n=t.modules[e];return n?e===`plans`?D(n):e===`abTest`?O(n):e===`analytics`?k(n):e===`onboarding`?A(n):`# ${S.find(t=>t.key===e)?.label}\n\n（该模块尚无内容）`:``}function D(e){let t=`# 实施计划\n\n${e.overview||``}`;return e.milestones?.length>0&&e.milestones.forEach((e,n)=>{t+=`\n\n## 里程碑 ${n+1}: ${e.title}（${e.duration}）\n\n${e.description||``}`,e.tasks?.length>0&&(t+=`

| 任务 | 描述 | 负责人 | 预估 | 状态 |
|------|------|--------|------|------|
`,e.tasks.forEach(e=>{t+=`| ${e.title} | ${e.description||``} | ${e.assignee||``} | ${e.estimate||``} | ${e.status} |\n`}))}),t}function O(e){let t=`# A/B 实验\n\n**实验名称：** ${e.testName||``}\n\n`;return e.observation&&e.change&&e.expectedOutcome&&(t+=`**假设：** 因为 ${e.observation}，我们相信 ${e.change} 将会导致 ${e.expectedOutcome}\n\n`),t+=`**主要指标：** ${e.primaryMetric||``}\n\n**实验平台：** ${e.platform||``}\n\n`,e.variants?.length>0&&(t+=`## 实验组设计

`,e.variants.forEach(e=>{t+=`### ${e.name}（流量 ${e.trafficPercent}%）\n\n${e.description||``}\n\n`,e.changes?.length>0&&(t+=`具体改动：\n${e.changes.map(e=>`- ${e}`).join(`
`)}\n\n`)})),t+=`## 样本量计算\n\n- 基线转化率：${e.baselineRate}%\n- 最小可检测效果：${e.mde}%\n- 置信水平：${(e.confidence*100).toFixed(0)}%\n- 每组所需样本量：${e.sampleSizeRequired.toLocaleString()}\n- 预计实验天数：${e.estimatedDays}\n`,t}function k(e){let t=`# 数据埋点\n\n${e.overview||``}`;return e.events?.length>0&&(t+=`

## 事件规格

| 事件名称 | 类别 | 描述 | 触发时机 |
|---------|------|------|----------|
`,e.events.forEach(e=>{t+=`| ${e.name} | ${e.category||``} | ${e.description||``} | ${e.trigger||``} |\n`})),e.journeySteps?.length>0&&(t+=`

## 用户旅程

`,e.journeySteps.forEach((e,n)=>{t+=`${n+1}. **${e.name}**：${e.description||``}\n`})),t}function A(e){let t=`# 新用户激活\n\n**激活定义：** ${e.activationDefinition||``}`;return e.funnelSteps?.length>0&&(t+=`

## 激活漏斗

| 步骤 | 用户数 | 转化率 |
|------|--------|--------|
`,e.funnelSteps.forEach(e=>{t+=`| ${e.name} | ${e.userCount.toLocaleString()} | ${e.conversionRate}% |\n`})),e.ahaMoments?.length>0&&(t+=`

## Aha 时刻

`,e.ahaMoments.forEach(e=>{t+=`- **${e.description}**（${e.timeToAha}，留存提升 ${e.retentionLift}%）\n`})),e.experimentPlan&&(t+=`\n\n## 实验方案\n\n${e.experimentPlan}`),t}function j(){if(!x.value)return``;let e=x.value;return[`# ${e.name} - 产品工作流报告\n\n生成时间: ${new Date().toLocaleString(`zh-CN`)}\n\n---`,C(e),w(e),T(e),E(`plans`),E(`abTest`),E(`analytics`),E(`onboarding`)].filter(Boolean).join(`

---

`)}function M(){let e=j(),t=new Blob([e],{type:`text/markdown;charset=utf-8`}),n=URL.createObjectURL(t),r=document.createElement(`a`);r.href=n,r.download=`${x.value?.name||`project`}-report.md`,r.click(),URL.revokeObjectURL(n)}function N(){let e=JSON.stringify(x.value,null,2),t=new Blob([e],{type:`application/json`}),n=URL.createObjectURL(t),r=document.createElement(`a`);r.href=n,r.download=`${x.value?.name||`project`}.pmw.json`,r.click(),URL.revokeObjectURL(n)}async function P(){let t=(await d(async()=>{let{default:t}=await import(`./html2pdf-DlZpVan4.js`).then(t=>e(t.default,1));return{default:t}},__vite__mapDeps([0,1]),import.meta.url)).default,n=document.getElementById(`report-content`);n&&t().from(n).set({margin:[15,15],filename:`${x.value?.name||`project`}-report.pdf`,html2canvas:{scale:2},jsPDF:{unit:`mm`,format:`a4`}}).save()}let F=l(()=>p(j()));return(e,r)=>x.value?(n(),o(`div`,m,[i(`div`,h,[i(`div`,null,[r[0]||=i(`h1`,{class:`export-title`},`📋 导出报告`,-1),i(`p`,g,t(x.value.name),1)]),i(`div`,{class:`export-actions`},[i(`button`,{class:`btn-export`,onClick:M},`📄 Markdown`),i(`button`,{class:`btn-export`,onClick:P},`📑 PDF`),i(`button`,{class:`btn-export primary`,onClick:N},`💾 项目文件 (.pmw.json)`)])]),i(`div`,_,[r[1]||=i(`div`,{class:`preview-label`},`报告预览`,-1),i(`div`,{id:`report-content`,class:`report-content markdown-body`,innerHTML:F.value},null,8,v)])])):s(``,!0)}}),[[`__scopeId`,`data-v-73a50322`]]);export{y as default};