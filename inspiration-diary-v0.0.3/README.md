# 灵感日记应用

一个帮助用户快速记录灵感想法的应用，支持文字、图片、语音多种输入方式，通过AI进行洞察分析，并可转化为待办事项进行跟踪。

## 版本信息

- **版本号**: 0.0.2
- **发布日期**: 2026-04-03

## 功能特性

### 1. 灵感记录模块
- **文字记录**: 支持Markdown格式的快速输入
- **图片上传识别**: 上传图片后自动调用豆包视觉模型识别内容
- **语音输入**: 支持录音功能（需要配置火山引擎语音识别API，暂未实现）
- **情绪标记**: 兴奋/平静/困惑/焦虑/期待等情绪标签
- **标签分类**: 支持自定义标签，多标签选择

### 2. AI洞察分析模块
- **关键词提取**: 自动从灵感内容中提取关键词
- **情感分析**: 分析灵感的情感倾向
- **内容扩展**: AI帮助扩展灵感内容
- **完善建议**: 提供行动建议

### 3. 待办事项模块
- **灵感转化**: 一键将灵感转化为待办事项
- **AI拆分子任务**: 自动生成可执行的子任务
- **状态管理**: 待办/进行中/已完成
- **优先级设置**: 高/中/低优先级
- **进度追踪**: 子任务完成进度可视化

### 4. 统计分析模块
- **数据统计**: 灵感总数、待办总数、转化率、完成率
- **趋势图表**: 灵感创建趋势折线图
- **分布图表**: 类型分布饼图、状态分布柱状图
- **标签统计**: 标签使用频率排行

## 技术栈

| 类别 | 技术 |
|------|------|
| 前端框架 | Next.js 16 + TypeScript |
| UI组件 | Tailwind CSS + shadcn/ui |
| 数据库 | PostgreSQL (Vercel Postgres) |
| ORM | Prisma 7.x |
| AI服务 | 火山引擎豆包大模型 + 豆包多模态 + 语音识别（可选） |
| 文件存储 | Vercel Blob |
| 图表 | Recharts |

## 快速开始

### 1. 环境要求
- Node.js 18+
- npm 9+
- PostgreSQL 14+

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制 `.env.example` 文件为 `.env` 并填写以下变量：

```env
# 数据库
DATABASE_URL="postgresql://user:password@localhost:5432/inspiration_diary"

# 火山引擎豆包AI服务
DOUBAO_API_KEY="your-doubao-api-key"
DOUBAO_MODEL="doubao-seed-1-6-251015"
DOUBAO_VISION_MODEL="doubao-seed-1-6-vision-251015"

# 文件存储
BLOB_READ_WRITE_TOKEN="your-vercel-blob-token"
```

### 4. 初始化数据库

```bash
# 生成Prisma客户端
npm run db:generate

# 推送数据库结构
npm run db:push
```

### 5. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 部署指南

### Vercel 部署

1. **在GitHub上创建仓库**
   - 访问 https://github.com/2017java/AICoding/tree/VS-Projects
   - 上传项目文件

2. **在Vercel上部署**
   - 访问 https://vercel.com
   - 导入GitHub仓库 `2017java/AICoding`
   - 选择分支 `VS-Projects`
   - 配置环境变量
   - 点击 "Deploy"

3. **配置数据库**
   - 在Vercel控制台创建Postgres数据库
   - 更新 `DATABASE_URL` 环境变量
   - 运行 `npx prisma db push` 推送数据库结构

## 项目结构

```
inspiration-diary/
├── src/
│   ├── app/                 # 页面路由
│   │   ├── [id]/           # 灵感详情页
│   │   ├── api/            # API路由
│   │   ├── new/            # 新建灵感页
│   │   ├── stats/          # 统计分析页
│   │   └── todos/          # 待办事项页
│   ├── components/         # 组件
│   │   ├── common/         # 公共组件
│   │   ├── inspiration/    # 灵感相关组件
│   │   ├── stats/          # 统计组件
│   │   ├── todo/           # 待办组件
│   │   └── ui/             # UI基础组件
│   └── lib/                # 工具库
│       ├── ai/             # AI服务封装
│       ├── db.ts           # 数据库连接
│       └── utils.ts        # 工具函数
├── prisma/                 # 数据库模型
└── public/                 # 静态资源
```

## 主要API端点

### 灵感相关
- `GET /api/inspirations` - 获取灵感列表
- `POST /api/inspirations` - 创建新灵感
- `GET /api/inspirations/[id]` - 获取灵感详情
- `PUT /api/inspirations/[id]` - 更新灵感
- `DELETE /api/inspirations/[id]` - 删除灵感

### 待办相关
- `GET /api/todos` - 获取待办列表
- `POST /api/todos` - 创建新待办
- `GET /api/todos/[id]` - 获取待办详情
- `PUT /api/todos/[id]` - 更新待办
- `DELETE /api/todos/[id]` - 删除待办
- `PATCH /api/todos/[id]/subtasks/[subtaskId]` - 更新子任务状态

### 标签相关
- `GET /api/tags` - 获取标签列表
- `POST /api/tags` - 创建新标签

### AI相关
- `POST /api/ai/analyze` - 分析灵感内容
- `POST /api/ai/image` - 分析图片内容
- `POST /api/ai/voice` - 语音转文字

### 统计相关
- `GET /api/stats` - 获取统计数据

### 文件上传
- `POST /api/upload` - 上传图片或音频文件

## 后续规划

1. **多用户支持**：添加用户认证和数据隔离
2. **移动端App**：React Native或PWA
3. **数据导出**：支持导出为Markdown/PDF
4. **协作功能**：分享灵感给他人
5. **更多AI能力**：灵感关联推荐、智能提醒

## 许可证

Apache License 2.0
