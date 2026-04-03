# 微信公众号文章提取工具 - 设计文档

## 概述

开发一个本地 Web 应用，用于提取微信公众号文章内容并导出为 Markdown 和 PDF 格式，方便用户保存到 NotebookLM 等工具中构建知识库。

## 技术栈

- **后端**：Python + FastAPI + Playwright
- **前端**：纯 HTML + JavaScript（无框架依赖）
- **内容提取**：Playwright 浏览器自动化
- **PDF 生成**：weasyprint 或 markdown2pdf
- **代码托管**：GitHub

## 架构设计

```
┌─────────────────────────────────────────────────────┐
│                    本地电脑                          │
│  ┌───────────┐   ┌──────────────┐   ┌───────────┐  │
│  │  Web 前端  │ ◄─► │  FastAPI     │ ◄─► │ Playwright │
│  │  (HTML)    │     │  API 服务    │     │ 浏览器引擎  │  │
│  └───────────┘     └──────────────┘   └───────────┘  │
│       │                   │                          │
│       └───────────────────┴──────────────────────────┘
│                     本地运行 (localhost:5177)        │
└─────────────────────────────────────────────────────┘
```

## 目录结构

```
wechat-article-extractor/
├── backend/
│   ├── main.py              # FastAPI 入口
│   ├── extractor.py         # 文章提取逻辑
│   ├── pdf_generator.py     # PDF 生成
│   └── requirements.txt     # 依赖
├── frontend/
│   ├── index.html           # 主页面
│   ├── style.css            # 样式
│   └── app.js               # 前端逻辑
├── README.md
└── .gitignore
```

## 核心功能

### 1. 文章提取
- 用户输入微信文章链接
- 服务端使用 Playwright 打开链接
- 等待页面渲染完成（处理动态加载）
- 提取内容：
  - 标题
  - 作者/公众号名称
  - 发布时间
  - 正文内容（保留格式）
  - 图片（下载并嵌入）

### 2. 预览功能
- 提取完成后在前端预览文章内容
- 显示标题、作者、发布时间
- 预览正文（保留格式）

### 3. 导出功能
- **Markdown 导出**：
  - 标题、作者、时间
  - 正文转为 Markdown 格式
  - 图片下载到本地目录
- **PDF 导出**：
  - 保留排版的 PDF 文件
  - 文件名：文章标题.pdf

### 4. 错误处理
- 链接格式校验
- 网络错误提示
- 页面加载超时处理
- 提取失败提示

## API 设计

### POST /extract
提取文章内容

**请求：**
```json
{
  "url": "https://mp.weixin.qq.com/s/xxxxx"
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "title": "文章标题",
    "author": "公众号名称",
    "publish_time": "2024-01-01",
    "content": "正文内容 HTML",
    "images": ["url1", "url2"]
  }
}
```

### GET /download/markdown
下载 Markdown 文件

**查询参数：**
- `url`: 文章链接（需要 URL 编码）

### GET /download/pdf
下载 PDF 文件

**查询参数：**
- `url`: 文章链接（需要 URL 编码）

## 前端界面

### 页面布局
1. **顶部**：标题 "微信公众号文章提取工具"
2. **输入区**：链接输入框 + 提取按钮
3. **预览区**：文章内容预览
4. **操作区**：下载 Markdown / 下载 PDF 按钮
5. **状态区**：加载状态、错误信息

### 交互流程
1. 打开页面
2. 粘贴微信文章链接
3. 点击"提取文章"
4. 显示加载状态
5. 预览文章内容
6. 点击下载 Markdown 或 PDF

## 数据处理

### 正文提取策略
1. 定位文章主体容器（微信文章通常有特定 class）
2. 提取 `<section>` 或 `<article>` 标签内容
3. 处理 `<img>` 标签：下载图片并替换路径
4. 清理无用元素（广告、分享栏等）
5. 保留基本格式（段落、标题、列表、引用）

### Markdown 转换
- HTML → Markdown 转换
- 处理换行、列表、引用等格式
- 图片路径处理为本地相对路径

## 环境要求

- Python 3.10+
- Chrome/Chromium 浏览器
- Windows/macOS/Linux

## 启动方式

```bash
# 安装依赖
pip install -r requirements.txt

# 安装 Playwright 浏览器
playwright install chromium

# 启动服务
cd backend
python main.py

# 打开浏览器访问
# http://localhost:5177
```

## 风险与限制

1. **微信反爬**：可能需要处理 UA、Cookies 或验证码
2. **动态加载**：长文章可能需要滚动触发加载
3. **图片防盗链**：部分图片可能无法直接下载
4. **付费内容**：部分付费文章可能无法提取

## 后续扩展

- [ ] 支持批量提取（导入多个链接）
- [ ] 添加历史记录功能
- [ ] 支持更多导出格式（EPUB、HTML）
- [ ] Docker 化部署
- [ ] 公开 API 版本

---

*设计日期：2026-03-27*
