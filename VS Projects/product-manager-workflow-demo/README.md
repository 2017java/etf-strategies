# 产品经理工作流助手 - 演示应用

## 概述

这是一个产品经理工作流助手的演示应用，展示了如何将 6 个产品经理技能整合成一个完整的工作流。

## 技能集成

本应用集成了以下 6 个产品经理技能：

1. **brainstorming** - 方案头脑风暴
2. **write-a-prd** - PRD 撰写
3. **writing-plans** - 实施计划拆分
4. **ab-test-setup** - A/B 实验设计
5. **analytics-tracking** - 数据埋点设计
6. **onboarding-cro** - 新用户激活优化

## 工作流程

```
接收需求 → 方案头脑风暴 → PRD 撰写 → 计划拆分 → A/B 实验 → 数据埋点 → 新用户激活 → 成果概览
```

## 快速开始

### 安装依赖

```bash
cd product-manager-workflow-demo
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000 查看应用

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

## 项目结构

```
product-manager-workflow-demo/
├── src/
│   ├── views/              # 页面组件
│   │   ├── Home.vue           # 首页
│   │   ├── RequirementInput.vue  # 需求输入
│   │   ├── Brainstorming.vue     # 方案头脑风暴
│   │   ├── WritePRD.vue          # PRD 撰写
│   │   ├── WritingPlans.vue      # 计划拆分
│   │   ├── ABTest.vue            # A/B 实验设计
│   │   ├── Analytics.vue         # 数据埋点
│   │   ├── Onboarding.vue        # 新用户激活
│   │   └── Summary.vue           # 成果概览
│   ├── components/          # 通用组件
│   │   └── WorkflowNavbar.vue    # 工作流导航栏
│   ├── store/              # 状态管理
│   │   └── workflow.js          # 工作流状态
│   ├── styles/             # 样式文件
│   │   └── main.css             # 主样式
│   ├── router/             # 路由配置
│   │   └── index.js             # 路由定义
│   ├── App.vue             # 根组件
│   └── main.js             # 入口文件
├── index.html              # HTML 模板
├── vite.config.js          # Vite 配置
├── package.json            # 依赖配置
└── README.md              # 项目说明
```

## 使用示例

### 示例需求：新能源车销售金融方案

**业务背景**：
> 3月市场回暖，需要强化金融权益，促进销量提升。目前新能源汽车只有5免2产品，竞争力不如竞品。我们希望新增xx万5年0息、xx首付3年0息等更有竞争力的产品，配套同步广告及优化计算器。

**成功指标**：
- xx车型渗透率：30%
- xxx车型渗透率：20%

### 开始使用

1. 点击"开始新需求"或"查看示例需求"
2. 填写或确认需求信息
3. 跟随工作流逐步完成各个阶段
4. 在成果概览页面下载所有生成的文档

## 技术栈

- Vue 3
- Vite
- Pinia
- Vue Router

## UI/UX 设计规范

### 设计原则

1. **渐进式信息收集** - 避免一次性要求用户提供所有信息
2. **主动式引导** - 主动提示下一步操作
3. **可视化反馈** - 实时显示工作流进度和状态
4. **清晰的阶段划分** - 每个阶段有明确的开始和结束
5. **响应式设计** - 支持桌面、平板和移动设备

### 配色方案

```css
--primary-color: #2196F3;    /* 产品蓝 */
--secondary-color: #4CAF50;  /* 成功绿 */
--warning-color: #FF9800;     /* 警告橙 */
--danger-color: #F44336;      /* 错误红 */
```

### 组件规范

- 卡片圆角：8-12px
- 阴影层次：3 级阴影系统
- 间距系统：4px 基准的倍数
- 字体系统：Noto Sans SC 中文优化

## Coze 平台部署

### 智能体配置

在 Coze 平台上，您可以创建一个 ProductManagerAssistant 智能体，配置如下：

**系统提示词**：
```
你是一名资深产品经理助手，擅长将模糊需求转化为可执行的产品方案。

## 工作流程
1. 需求探索期：通过对话式访谈明确需求
2. 需求设计期：撰写专业 PRD 文档
3. 计划实施期：拆分实施计划
4. 验证优化期：设计 A/B 实验和数据埋点
5. 用户激活期：优化新用户激活

请逐步引导用户完成整个工作流。
```

**技能集成**：
- pm-brainstorm (方案头脑风暴)
- pm-write-prd (PRD 撰写)
- pm-writing-plans (计划拆分)
- pm-ab-test (A/B 实验设计)
- pm-analytics (数据埋点)
- pm-onboarding (新用户激活)

### 部署步骤

1. 在 Coze 平台注册并创建新应用
2. 配置智能体（ProductManagerAssistant）
3. 创建并部署各个技能
4. 配置智能体与技能的关联
5. 测试工作流的完整性
6. 发布到 Coze 应用商店

## 技能调用 API

### brainstorming 技能

```javascript
// 调用方案头脑风暴
const result = await callSkill('pm-brainstorm', {
  business_context: '业务背景描述',
  problem_statement: '核心问题',
  success_metrics: { /* 指标 */ }
});

// 返回结果
{
  design_scheme: '产品设计方案',
  architecture_diagram: '架构图',
  feature_boundaries: ['功能边界列表'],
  recommendations: ['产品建议']
}
```

### write-a-prd 技能

```javascript
// 调用 PRD 撰写
const result = await callSkill('pm-write-prd', {
  design_spec: '产品设计方案',
  requirements: '详细需求'
});

// 返回结果
{
  prd_document: 'PRD 文档内容',
  user_stories: ['用户故事列表'],
  acceptance_criteria: ['验收标准']
}
```

### writing-plans 技能

```javascript
// 调用计划拆分
const result = await callSkill('pm-writing-plans', {
  prd: 'PRD 文档',
  resources: { /* 资源 */ }
});

// 返回结果
{
  implementation_plan: '实施计划',
  tasks: ['任务列表'],
  milestones: ['里程碑']
}
```

## 常见问题

### Q: 如何添加新的技能？

A: 在 `src/views/` 目录下创建新的页面组件，然后在路由中添加对应的路由配置。

### Q: 如何自定义样式？

A: 编辑 `src/styles/main.css` 文件中的 CSS 变量即可修改全局样式。

### Q: 如何集成真实的 AI 服务？

A: 替换 `callSkill` 函数的实现，调用真实的 API 服务。

## 贡献指南

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License
