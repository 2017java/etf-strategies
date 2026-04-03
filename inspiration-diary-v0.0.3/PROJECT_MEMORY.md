# PROJECT MEMORY
> 本文件由 project-memory skill 自动生成，记录项目关键信息供后续参考。
> 请勿手动大幅修改，可在各条目下方追加备注。

---

## [PROJECT SUMMARY] 灵感日记应用 — 2026-04-03

### 项目背景
> 一个记录灵感日记的软件，用于捕获和管理突发的创意想法，防止遗忘，并提供AI分析和待办事项转换功能。

### 核心需求
- 文字记录
- 图片上传识别
- 语音输入记录
- 支持分类汇总
- 大模型对灵感内容进行洞察分析
- 自动转成待办事项
- 支持统计分析
- 后端数据存储
- 支持部署到GitHub

### 技术架构
- **技术栈**：Next.js 16, TypeScript, Tailwind CSS, shadcn/ui, Prisma ORM, PostgreSQL, Vercel Blob
- **AI服务**：火山引擎豆包大模型（文本分析、多模态图像识别）
- **架构说明**：前后端分离，Next.js App Router，RESTful API设计，Prisma ORM数据库操作
- **关键文件路径**：
  - `/workspace/inspiration-diary/package.json` — 项目配置和依赖
  - `/workspace/inspiration-diary/prisma/schema.prisma` — 数据库模型定义
  - `/workspace/inspiration-diary/src/lib/db.ts` — 数据库连接
  - `/workspace/inspiration-diary/src/app/api/` — API路由
  - `/workspace/inspiration-diary/src/components/` — 前端组件
  - `/workspace/inspiration-diary/src/lib/ai/` — AI服务集成

### 当前进度
- [x] 项目初始化和配置
- [x] 数据库模型设计
- [x] API路由实现
- [x] 前端组件开发
- [x] AI服务集成（从阿里云迁移到火山引擎豆包）
- [x] 统计分析功能
- [x] 待办事项系统
- [x] 版本更新（0.0.1 → 0.0.2）
- [x] 部署到GitHub
- [x] 部署到Vercel
- [ ] 开发手机端应用

### 关键决策记录
| 决策点 | 选择 | 原因 | 放弃的方案 |
|--------|------|------|------------|
| 前端框架 | Next.js 16 | 支持App Router，服务端渲染，易于部署 | React + Express |
| 数据库 | PostgreSQL (Vercel Postgres) | 关系型数据库，支持复杂查询，Vercel集成 | MongoDB |
| ORM | Prisma | 类型安全，自动生成代码，易于使用 | TypeORM |
| 文件存储 | Vercel Blob | 与Vercel集成，易于使用 | AWS S3 |
| AI服务 | 火山引擎豆包 | 支持中文大模型，多模态能力，接口更稳定 | 阿里云AI |
| 部署 | GitHub Pages + Vercel | 易于部署和管理 | Netlify |

### 下一步行动
1. 部署到GitHub仓库
2. 测试所有功能
3. 优化用户体验

### Agent 接手须知
> 项目已完成核心功能开发，需要注意的是：
> 1. 火山引擎豆包AI服务需要配置API密钥（DOUBAO_API_KEY）
> 2. 数据库需要使用Prisma 7.x的adapter模式
> 3. 部署时需要配置Vercel Postgres连接
> 4. 项目使用Next.js 16的App Router模式
> 5. 语音识别功能暂未实现，需要额外配置火山引擎语音API

---

## [DEPLOYMENT RECORD] Vercel 部署踩坑记录 — 2026-04-03

### 项目技术栈
- 框架：Next.js 16
- ORM：Prisma 7.6.0
- 数据库：Neon（Serverless Postgres）
- 文件存储：Vercel Blob
- 部署平台：Vercel

### 问题一：数据库连接失败

**报错**：`Can't reach database server at 127.0.0.1:5432`

**原因**：Prisma 连接的是本地默认地址，说明 `DATABASE_URL` 没有正确生效。

**解决**：Neon 集成后会自动注入多个环境变量（`POSTGRES_PRISMA_URL`、`DATABASE_URL` 等），确认 `DATABASE_URL` 已存在于 Vercel 项目的 Environment Variables 中。

### 问题二：数据库表不存在

**报错**：`No migration found in prisma/migrations`，页面仍然报错。

**原因**：项目没有 migration 文件，数据库表结构从未初始化过。

**解决**：在本地设置好 `DATABASE_URL` 环境变量后执行：
```powershell
$env:DATABASE_URL="你的Neon连接字符串"
npx prisma db push
```

### 问题三：执行 prisma 命令报错

**报错**：`Cannot find module 'dotenv/config'`

**原因**：项目 `prisma.config.ts` 依赖 `dotenv`，但本地没有安装。

**解决**：
```powershell
npm install dotenv
npx prisma db push
```

### 正确的完整部署流程

1. GitHub 新建仓库，推送代码
2. Vercel 导入仓库，部署项目
3. Vercel Storage 创建 Neon 数据库，关联项目（DATABASE_URL 自动注入）
4. Vercel Storage 创建 Blob 存储，Access 选 Public
5. 本地设置 DATABASE_URL，执行 `npx prisma db push` 初始化表结构
6. Vercel Redeploy 重新部署

### 后续注意事项

每次修改 `prisma/schema.prisma` 后都需要重新执行 `npx prisma db push`，然后在 Vercel 上 Redeploy，否则数据库和代码结构不一致会报错。

---

## [PWA DEVELOPMENT] 移动端 PWA 开发完成 — 2026-04-03

### 状态
- [x] UI 风格设计确认
- [x] 创建 UI 示例页面 (ui-demo.html)
- [x] 完成 PWA 开发
- [x] 测试构建成功

### 实现内容

#### 核心文件
- **`/workspace/inspiration-diary/public/manifest.json`** — PWA 配置文件，包含应用信息、图标、快捷方式等
- **`/workspace/inspiration-diary/public/service-worker.js`** — 服务 worker 实现，支持离线缓存、推送通知等
- **`/workspace/inspiration-diary/public/service-worker-registration.js`** — 服务 worker 注册脚本
- **`/workspace/inspiration-diary/src/components/common/mobile-nav.tsx`** — 移动端底部导航组件

#### 功能特性
- **PWA 核心功能**：
  - 可添加到主屏幕
  - 离线访问支持
  - 响应式设计
  - 推送通知支持
- **移动端优化**：
  - 底部导航栏（灵感、待办、统计）
  - 浮动创作按钮（带脉冲动画）
  - 毛玻璃效果
  - 流畅的卡片入场动画
  - 触摸反馈效果

#### 技术实现
- **Next.js 16**：App Router 模式，服务端渲染
- **Tailwind CSS**：响应式样式，移动端适配
- **PWA 配置**：
  - manifest.json 配置
  - service worker 缓存策略
  - PWA 相关元标签
- **视觉风格**：
  - 暖米白渐变背景 (#FAFAF8 → #F5F0F6)
  - 柔和珊瑚粉 (#E8B4B8) 和薄荷绿 (#A8D5BA) 配色
  - 毛玻璃质感卡片
  - 流畅的动画效果

### 构建测试
- ✅ 项目构建成功
- ✅ TypeScript 类型检查通过
- ✅ 所有路由正常生成

### 下一步行动
1. 部署到 Vercel 进行线上测试
2. 测试 PWA 安装和离线功能
3. 优化移动端用户体验
4. 添加更多 PWA 特性（如推送通知）

### Agent 接手须知
> PWA 开发已完成，请注意：
> 1. 项目已配置完整的 PWA 支持
> 2. 移动端 UI 已按照设计方案实现
> 3. 保持现有的技术栈和架构
> 4. 后续部署时无需额外配置 PWA 相关设置
> 5. 如需修改 PWA 配置，更新 `public/manifest.json` 和 `public/service-worker.js` 文件