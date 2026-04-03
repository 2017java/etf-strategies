# 产品经理工作流技能整合应用

## 项目概述

产品经理工作流技能整合应用是一个完整的产品管理工作流解决方案，帮助产品经理将模糊的业务需求转化为可执行的产品方案。该项目集成了 6 个核心产品经理技能，提供从需求收集到产品落地的完整流程支持。

## 项目信息

- **项目名称**: 产品经理工作流技能整合应用
- **项目位置**: D:\AICoding\VS Projects\product-manager-workflow-demo\
- **创建时间**: 2024年3月
- **技术栈**: Vue 3 + Vite + Pinia + Vue Router
- **运行状态**: 应用已成功启动，访问 http://localhost:3000

## 架构设计

### 系统架构

```
┌──────────────────────┐
│  产品经理工作流技能整合应用  │
└──────────────────────┘
             │
             ▼
┌──────────────────────┐
│    ProductManager    │
│    Assistant (AI)    │
└──────────────────────┘
             │
    ┌────────┼────────┐
    │        │        │
    ▼        ▼        ▼
┌──────┐ ┌──────┐ ┌──────┐
│ 需求 │ │ 方案 │ │ 开发 │
│ 收集 │ │ 设计 │ │ 实施 │
└──────┘ └──────┘ └──────┘
    │        │        │
    ▼        ▼        ▼
┌──────────────────────┐
│  产品数据和文档管理   │
└──────────────────────┘
```

### 技术架构

```
┌─────────────────────────────────────┐
│          Web 应用层 (Vue 3)          │
├─────────────────────────────────────┤
│  Pages (9个页面) + Components (导航) │
├─────────────────────────────────────┤
│         状态管理 (Pinia)             │
├─────────────────────────────────────┤
│         路由管理 (Vue Router)        │
├─────────────────────────────────────┤
│         构建工具 (Vite)              │
├─────────────────────────────────────┤
│     开发服务器 (localhost:3000)     │
└─────────────────────────────────────┘
```

## 核心功能和技能

### 工作流程

```
接收需求 → 方案头脑风暴 → PRD 撰写 → 计划拆分 → A/B 实验 → 数据埋点 → 新用户激活 → 成果概览
```

### 集成的技能

| 阶段 | 子技能 | 功能 |
|------|--------|------|
| 需求探索 | brainstorming | 模糊需求澄清和方案设计 |
| 需求设计 | write-a-prd | 专业 PRD 文档撰写 |
| 计划拆分 | writing-plans | 任务分解和实施计划 |
| 验证优化 | ab-test-setup | A/B 实验设计和数据分析 |
| 数据准备 | analytics-tracking | 埋点方案和数据分析计划 |
| 用户激活 | onboarding-cro | 新用户激活策略设计 |

## 技术栈

### 前端技术

- **Vue 3**: 3.3.4（Composition API）
- **Vite**: 4.5.14（构建工具）
- **Pinia**: 2.1.6（状态管理）
- **Vue Router**: 4.2.4（路由管理）
- **CSS 变量系统**: 完整的设计系统

### 开发工具

- **Node.js**: 18+ 版本
- **npm**: 包管理工具
- **现代浏览器**: 支持 ES6+ 的浏览器

### 部署平台

- **开发阶段**: http://localhost:3000
- **生产阶段**: Coze 平台 + 服务器部署

## 项目结构

```
D:\AICoding\VS Projects\product-manager-workflow-demo\
├── CLAUDE.md                    # 项目约定和架构信息
├── package.json                 # 项目依赖
├── vite.config.js              # Vite 配置
├── index.html                  # 入口文件
├── README.md                   # 项目说明
├── .coze/                      # Coze 平台配置
│   ├── agent-config.json       # 智能体配置
│   └── system_prompt.txt       # 系统提示词
└── src/
    ├── main.js                 # 应用入口
    ├── App.vue                 # 根组件
    ├── router/
    │   └── index.js            # 路由配置
    ├── store/
    │   └── workflow.js         # 状态管理
    ├── components/
    │   └── WorkflowNavbar.vue # 工作流导航
    ├── views/                  # 页面组件
    └── styles/
        └── main.css            # 全局样式
```

## 重要约定

### 命名约定

- **文件夹**: kebab-case（小写字母 + 短横线）
- **组件文件**: PascalCase（首字母大写）
- **函数/变量**: camelCase（驼峰式）
- **常量**: UPPER_CASE（大写 + 下划线）

### 样式约定

```css
/* 主色彩系统 */
--primary-color: #2196F3;    /* 产品蓝 */
--secondary-color: #4CAF50;  /* 成功绿 */
--warning-color: #FF9800;     /* 警告橙 */
--danger-color: #F44336;      /* 错误红 */

/* 间距系统 */
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;
--spacing-xl: 32px;

/* 字体系统 */
--font-xs: 12px;
--font-sm: 14px;
--font-base: 16px;
--font-lg: 18px;
--font-xl: 20px;
--font-2xl: 24px;
--font-3xl: 32px;
```

### 状态管理约定

```javascript
// 工作流阶段
const WORKFLOW_STAGES = {
  BRAINSTORMING: 'brainstorming',
  WRITE_PRD: 'write_prd',
  WRITING_PLANS: 'writing_plans',
  AB_TEST: 'ab_test',
  ANALYTICS: 'analytics',
  ONBOARDING: 'onboarding',
  COMPLETED: 'completed'
}

// 状态形状
const state = {
  currentStage: WORKFLOW_STAGES.BRAINSTORMING,
  requirement: {
    businessContext: '',
    problemStatement: '',
    successMetrics: []
  },
  outputs: {
    [WORKFLOW_STAGES.BRAINSTORMING]: null,
    [WORKFLOW_STAGES.WRITE_PRD]: null,
    // ...
  }
}
```

## 开发流程

### 启动应用

```bash
cd D:\AICoding\VS Projects\product-manager-workflow-demo
npm install  # 安装依赖
npm run dev  # 启动开发服务器
```

### 构建和部署

```bash
npm run build      # 生产环境构建
npm run preview    # 预览生产版本
```

### 常用命令

```bash
# 查看依赖树
npm ls

# 查找和修复依赖问题
npm audit

# 清理和重新安装
rm -rf node_modules package-lock.json
npm install
```

## 常见问题和修复

### 应用无法访问

```bash
# 检查端口
netstat -ano | findstr :3000

# 重新启动
npm run dev -- --port 3001
```

### 依赖安装失败

```bash
# 清理 npm 缓存
npm cache clean --force

# 使用淘宝镜像
npm config set registry https://registry.npmmirror.com
npm install
```

### 样式问题

```bash
# 检查样式文件
cat src/styles/main.css

# 重新编译
npm run build
```

## 问题修复记录

### 2024年3月19日 - 方案头脑风暴功能优化

#### 问题1：方案头脑风暴环节没有真实的头脑风暴过程

**问题描述**：之前直接生成方案，没有真实的讨论过程，用户体验不佳。

**解决方案**：重构 Brainstorming.vue 组件，实现对话式头脑风暴

```vue
// 核心改进
function startDiscussion() {
  phase.value = 'discussion'
  discussionStep.value = 0
  discussionMessages.value = []

  // 模拟AI问候和问题提问
  setTimeout(() => {
    addAiMessage('您好！我是您的产品方案助手...')
    setTimeout(() => {
      askNextQuestion()
    }, 800)
  }, 500)
}
```

#### 问题2：生成方案过程中没有进度反馈

**问题描述**：生成时间长且没有进度反馈，用户不知道当前状态。

**解决方案**：添加详细的进度可视化系统

```vue
// 进度显示
const generationSteps = ref([
  { title: '分析需求', description: '理解业务背景和核心问题' },
  { title: '头脑风暴', description: '探索各种可能的解决方案' },
  { title: '方案设计', description: '设计详细的产品方案' },
  { title: '对比评估', description: '对比不同方案的优缺点' },
  { title: '整理输出', description: '整理完整的方案文档' }
])

// 进度条更新
function simulateGeneration() {
  // 模拟5个步骤的生成过程
  generationSteps.value.forEach((step, index) => {
    setTimeout(() => {
      generationSteps.value[index].completed = true
      generationProgress.value = (index + 1) * 20
    }, stepTimings[index])
  })
}
```

#### 问题3：立即生成方案按钮无反馈

**问题描述**：按钮点击后没有任何视觉反馈，用户无法判断操作是否成功。

**解决方案**：添加完整的状态反馈系统

```vue
// 按钮状态管理
<button class="btn btn-primary" @click="generateSolution"
        :disabled="isGenerating" :class="{ 'loading': isGenerating }">
  <span v-if="isGenerating">生成中...</span>
  <span v-else>立即生成方案</span>
</button>

// 动画效果
@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(33, 150, 243, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(33, 150, 243, 0);
  }
}
```

### 2024年3月19日 - 交互体验优化

#### 问题1：用户输入不够灵活

**问题描述**：只支持预设选项，不允许用户自由输入描述。

**解决方案**：实现双重输入机制

```vue
// 支持选择+输入
<div class="user-input-area">
  <div v-if="currentQuestion?.options" class="options-section">
    <div class="options-label">请选择或输入您的想法（支持自由输入）：</div>
    <div class="options-grid">
      <button v-for="(option, idx) in currentQuestion.options" :key="idx"
              class="option-btn" @click="selectOption(option)">
        {{ option }}
      </button>
    </div>
  </div>
  <div class="text-input-wrapper">
    <textarea v-model="userAnswer" placeholder="或输入您的详细想法..." rows="3"></textarea>
    <button class="btn btn-primary" @click="submitAnswer" :disabled="!hasValidAnswer()">
      发送
    </button>
  </div>
</div>
```

#### 问题2：百分比进度数字乱码

**问题描述**：进度数字显示有小数点，且会跳动。

**解决方案**：优化数字显示

```css
.progress-text {
  font-weight: 600;
  color: var(--primary-color);
  min-width: 50px;
  text-align: right;
  font-variant-numeric: tabular-nums; /* 防止数字跳动 */
}

// 代码中使用 Math.round()
<div class="progress-text">{{ Math.round(generationProgress) }}%</div>
```

#### 问题3：金融产品架构内容为空

**问题描述**：方案展示页面的产品架构部分一直为空。

**解决方案**：添加详细的架构设计内容

```javascript
// 在 finishGeneration() 中添加架构信息
const solution = {
  title: '新能源车销售金融方案0息产品展示优化',
  overview: '针对市场回暖需求...',
  architecture: `## 产品架构设计

### 1. 前端展示层
- **产品列表页**：分类展示金融产品
- **详情页**：产品信息和计算器
- **对比页**：产品对比功能
- **推荐模块**：基于用户属性的智能推荐

### 2. 核心功能层
- **产品管理**：配置和管理金融产品
- **计算器引擎**：多种还款方式计算
- **推荐算法**：基于用户画像的推荐
- **数据分析**：用户行为和转化率分析

### 3. 数据支撑层
- **产品数据库**：金融产品信息
- **用户画像**：用户属性和行为
- **计算模型**：还款计算逻辑
- **埋点系统**：用户行为追踪

### 4. 外部集成
- **渠道接口**：与经销商系统对接
- **支付接口**：支付和还款处理
- **短信服务**：用户通知
- **数据分析**：第三方数据分析平台`,
  // 其他属性...
}
```

## 测试和调试

### 单元测试

```bash
# 添加测试依赖
npm install -D @vue/test-utils vitest

# 运行测试
npm run test
```

### 调试工具

- **Vue Devtools**: 浏览器扩展，用于调试 Vue 应用
- **Chrome DevTools**: 网络分析和性能检查
- **console.log**: 调试时使用

## 代码质量

### 格式化

```bash
# 使用 Prettier
npm install -D prettier
npx prettier --write src/
```

### 代码规范

- 遵循 ESLint 规则
- 使用 TypeScript（可选）
- 编写文档注释

## Coze 平台部署

### 配置文件

```json
// .coze/agent-config.json
{
  "name": "ProductManagerAssistant",
  "description": "产品经理工作流助手",
  "version": "1.0.0",
  "category": "productivity",
  "skills": [
    "pm-brainstorm",
    "pm-write-prd",
    "pm-writing-plans",
    "pm-ab-test",
    "pm-analytics",
    "pm-onboarding"
  ]
}
```

### 部署步骤

1. 访问 Coze 平台并注册
2. 创建新应用和智能体
3. 上传配置文件
4. 部署技能和智能体
5. 测试和验证

## 协作和版本控制

### 分支策略

- **main**: 主分支（生产就绪代码）
- **develop**: 开发分支（集成测试）
- **feature/xxx**: 功能分支（单个功能开发）
- **hotfix/xxx**: 紧急修复分支

### 提交规范

```
<类型>(<范围>): <描述>

<body>

<footer>

类型: feat|fix|docs|style|refactor|test|chore
```

## 安全考虑

### 数据安全

- 不存储敏感信息
- 使用 HTTPS 协议
- 适当的输入验证

### 依赖安全

```bash
# 检查依赖安全性
npm audit

# 更新有安全问题的依赖
npm audit fix
```

## 性能优化

### 打包优化

```javascript
// vite.config.js
build: {
  sourcemap: false,
  minify: 'esbuild',
  rollupOptions: {
    output: {
      manualChunks: undefined
    }
  }
}
```

### 代码分割

```javascript
// 使用动态导入
const Component = () => import('./Component.vue')
```

## 未来规划

### 功能增强

- [ ] 集成真实的 AI API
- [ ] 添加用户认证和权限管理
- [ ] 实时协作功能
- [ ] 更多行业模板

### 技术改进

- [ ] 单元测试覆盖
- [ ] 性能监控和分析
- [ ] 国际化支持
- [ ] 离线模式

## 联系方式

### 项目维护者

- **开发者**: 产品经理工作流助手开发团队
- **文档**: CLAUDE.md 和产品方案设计文档
- **支持**: 通过对话框提交问题

### 问题反馈

```bash
# 查看应用状态
Bash npm run dev

# 检查错误日志
Bash cd D:\AICoding\VS Projects\product-manager-workflow-demo && npm run build
```

---

## 快速开始

### 新对话中的操作

1. 检查项目状态：
   ```bash
   Bash ls -la D:\AICoding\VS Projects\product-manager-workflow-demo
   ```

2. 查看应用运行状态：
   ```bash
   Bash netstat -ano | findstr :3000
   ```

3. 读取项目信息：
   ```bash
   Read D:\AICoding\VS Projects\product-manager-workflow-demo\CLAUDE.md
   ```

4. 进行开发：
   ```bash
   Bash cd D:\AICoding\VS Projects\product-manager-workflow-demo
   Read src/views/Home.vue
   ```

### 常见任务

```bash
# 修复 bug
TodoWrite 修复产品经理工作流应用的 bug - 参考 CLAUDE.md 中的调试方法

# 优化性能
TodoWrite 优化产品经理工作流应用的性能

# 添加新功能
TodoWrite 为产品经理工作流应用添加新功能
```

---

**Last Updated**: 2024-03-20
**项目状态**: 应用已完成并成功运行，方案头脑风暴功能已优化
