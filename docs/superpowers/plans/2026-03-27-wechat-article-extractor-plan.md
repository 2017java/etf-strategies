# 微信公众号文章提取工具 - 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 开发一个本地 Web 应用，可提取微信公众号文章内容并导出为 Markdown 和 PDF 格式

**Architecture:** Python FastAPI 后端处理文章提取和 PDF 生成，前端使用纯 HTML/JS 提供用户界面，通过 Playwright 浏览器自动化获取微信文章内容

**Tech Stack:** Python 3.10+ / FastAPI / Playwright / Weasyprint / 纯 HTML/CSS/JS

---

## 文件结构

```
wechat-article-extractor/
├── backend/
│   ├── __init__.py
│   ├── main.py              # FastAPI 入口，API 路由
│   ├── extractor.py         # Playwright 文章提取逻辑
│   ├── pdf_generator.py     # PDF 生成模块
│   └── requirements.txt     # 依赖列表
├── frontend/
│   ├── index.html           # 主页面
│   ├── style.css            # 样式文件
│   └── app.js               # 前端逻辑
├── temp/                    # 临时文件目录（下载的图片等）
├── README.md
├── .gitignore
└── SPEC.md                  # 设计规格（从设计文档复制）
```

---

## 任务分解

### 任务 1: 项目初始化

**Files:**
- Create: `wechat-article-extractor/backend/__init__.py`
- Create: `wechat-article-extractor/backend/requirements.txt`
- Create: `wechat-article-extractor/backend/main.py`
- Create: `wechat-article-extractor/backend/extractor.py`
- Create: `wechat-article-extractor/backend/pdf_generator.py`
- Create: `wechat-article-extractor/frontend/index.html`
- Create: `wechat-article-extractor/frontend/style.css`
- Create: `wechat-article-extractor/frontend/app.js`
- Create: `wechat-article-extractor/temp/.gitkeep`
- Create: `wechat-article-extractor/README.md`
- Create: `wechat-article-extractor/.gitignore`
- Create: `wechat-article-extractor/SPEC.md`

- [ ] **Step 1: 创建目录结构**

```bash
mkdir -p wechat-article-extractor/backend
mkdir -p wechat-article-extractor/frontend
mkdir -p wechat-article-extractor/temp
```

- [ ] **Step 2: 创建 requirements.txt**

```txt
fastapi==0.109.0
uvicorn==0.27.0
playwright==1.41.0
weasyprint==60.1
python-multipart==0.0.6
aiofiles==23.2.1
```

- [ ] **Step 3: 创建 .gitignore**

```gitignore
__pycache__/
*.pyc
.env
venv/
temp/*.jpg
temp/*.png
temp/*.webp
.DS_Store
```

- [ ] **Step 4: 创建 README.md**

```markdown
# 微信公众号文章提取工具

本地 Web 应用，用于提取微信公众号文章内容并导出为 Markdown 和 PDF 格式。

## 安装

```bash
# 安装依赖
pip install -r backend/requirements.txt

# 安装 Playwright 浏览器
playwright install chromium
```

## 运行

```bash
cd backend
python main.py
```

然后打开浏览器访问 http://localhost:5177

## 使用方法

1. 打开页面后，粘贴微信公众号文章链接
2. 点击"提取文章"按钮
3. 等待提取完成后，预览文章内容
4. 点击"下载 Markdown"或"下载 PDF"保存文件
```

- [ ] **Step 5: 创建 SPEC.md** (复制设计文档内容)

---

### 任务 2: 后端 - API 框架

**Files:**
- Create: `wechat-article-extractor/backend/main.py`

- [ ] **Step 1: 创建 FastAPI 应用框架**

```python
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
import os
from pathlib import Path

app = FastAPI(title="微信公众号文章提取工具")

# 获取项目根目录
BASE_DIR = Path(__file__).resolve().parent.parent
TEMP_DIR = BASE_DIR / "temp"

@app.get("/", response_class=HTMLResponse)
async def index():
    """返回前端页面"""
    index_path = BASE_DIR / "frontend" / "index.html"
    with open(index_path, "r", encoding="utf-8") as f:
        return f.read()

@app.get("/api/status")
async def status():
    """健康检查"""
    return {"status": "ok", "service": "wechat-article-extractor"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=5177)
```

- [ ] **Step 2: 测试运行**

Run: `cd wechat-article-extractor/backend && python main.py`
Expected: 服务启动，访问 http://localhost:5177 显示空白页面

- [ ] **Step 3: Commit**

```bash
cd wechat-article-extractor
git init
git add .
git commit -m "feat: 项目初始化，FastAPI 框架完成"
```

---

### 任务 3: 后端 - 文章提取模块

**Files:**
- Modify: `wechat-article-extractor/backend/extractor.py` (新创建)

- [ ] **Step 1: 创建 extractor.py**

```python
import re
import asyncio
from typing import Optional, Dict, Any
from playwright.async_api import async_playwright, Page, Browser
from urllib.parse import urlparse

class WechatArticleExtractor:
    """微信公众号文章提取器"""

    def __init__(self):
        self.browser: Optional[Browser] = None

    async def init_browser(self):
        """初始化浏览器"""
        if self.browser is None:
            playwright = await async_playwright().start()
            self.browser = await playwright.chromium.launch(headless=True)

    async def close(self):
        """关闭浏览器"""
        if self.browser:
            await self.browser.close()
            self.browser = None

    def validate_url(self, url: str) -> bool:
        """验证是否是微信文章链接"""
        parsed = urlparse(url)
        return parsed.netloc == "mp.weixin.qq.com" and "/s/" in url

    async def extract(self, url: str) -> Dict[str, Any]:
        """提取文章内容"""
        if not self.validate_url(url):
            raise ValueError("无效的微信公众号文章链接")

        await self.init_browser()

        page = await self.browser.new_page()

        try:
            # 设置用户代理
            await page.set_extra_http_headers({
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            })

            # 访问页面
            await page.goto(url, wait_until="networkidle", timeout=30000)

            # 等待页面加载完成
            await page.wait_for_selector("#js_content", timeout=10000)

            # 提取标题
            title = await page.title()

            # 提取公众号名称
            author_elem = await page.query_selector("#js_name")
            author = await author_elem.inner_text() if author_elem else "未知"

            # 提取发布时间
            time_elem = await page.query_selector("#publish_time")
            publish_time = await time_elem.inner_text() if time_elem else ""

            # 提取正文内容
            content_elem = await page.query_selector("#js_content")
            content_html = await content_elem.inner_html() if content_elem else ""

            # 提取封面图
            cover_elem = await page.query_selector("#js_cover img")
            cover_url = await cover_elem.get_attribute("src") if cover_elem else ""

            return {
                "title": title,
                "author": author,
                "publish_time": publish_time,
                "content": content_html,
                "cover_url": cover_url,
                "url": url
            }

        finally:
            await page.close()

# 全局提取器实例
extractor = WechatArticleExtractor()
```

- [ ] **Step 2: 在 main.py 中添加提取 API**

```python
from extractor import extractor

@app.post("/api/extract")
async def extract_article(request: dict):
    """提取文章内容"""
    url = request.get("url")
    if not url:
        raise HTTPException(status_code=400, detail="缺少 url 参数")

    try:
        result = await extractor.extract(url)
        return {"success": True, "data": result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"提取失败: {str(e)}")
```

- [ ] **Step 3: 测试提取功能**

Run: `python -c "from backend.extractor import extractor; import asyncio; result = asyncio.run(extractor.extract('https://mp.weixin.qq.com/s/test'))"`
Expected: 验证 URL 格式正确工作

- [ ] **Step 4: Commit**

```bash
git add backend/extractor.py backend/main.py
git commit -m "feat: 添加文章提取模块"
```

---

### 任务 4: 后端 - Markdown 导出

**Files:**
- Modify: `wechat-article-extractor/backend/main.py`

- [ ] **Step 1: 添加 Markdown 导出 API**

```python
from starlette.responses import StreamingResponse
import re
import os
from pathlib import Path

def html_to_markdown(html: str) -> str:
    """将 HTML 转换为 Markdown"""
    # 移除 script 和 style 标签
    html = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL)
    html = re.sub(r'<style[^>]*>.*?</style>', '', html, flags=re.DOTALL)

    # 替换标题
    html = re.sub(r'<h1[^>]*>(.*?)</h1>', r'# \1\n', html)
    html = re.sub(r'<h2[^>]*>(.*?)</h2>', r'## \1\n', html)
    html = re.sub(r'<h3[^>]*>(.*?)</h3>', r'### \1\n', html)
    html = re.sub(r'<h4[^>]*>(.*?)</h4>', r'#### \1\n', html)

    # 替换段落
    html = re.sub(r'<p[^>]*>(.*?)</p>', r'\1\n\n', html)

    # 替换图片
    def replace_img(match):
        src = match.group(1)
        alt = match.group(2) if match.group(2) else "image"
        return f'![{alt}]({src})'
    html = re.sub(r'<img[^>]*src=["\']([^"\']+)["\'][^>]*alt=["\']([^"\']*)["\'][^>]*>', replace_img, html)
    html = re.sub(r'<img[^>]*src=["\']([^"\']+)["\'][^>]*>', r'![]( \1)', html)

    # 替换链接
    html = re.sub(r'<a[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', r'[\2]( \1)', html)

    # 替换列表
    html = re.sub(r'<li[^>]*>(.*?)</li>', r'- \1\n', html, flags=re.DOTALL)

    # 替换引用
    html = re.sub(r'<blockquote[^>]*>(.*?)</blockquote>', r'> \1\n\n', html, flags=re.DOTALL)

    # 移除所有 HTML 标签
    html = re.sub(r'<[^>]+>', '', html)

    # 清理空白
    html = re.sub(r'\n{3,}', '\n\n', html)
    html = html.strip()

    return html

@app.get("/api/export/markdown")
async def export_markdown(url: str):
    """导出 Markdown 格式"""
    try:
        article = await extractor.extract(url)

        # 转换为 Markdown
        markdown_content = f"""# {article['title']}

**公众号:** {article['author']}
**发布时间:** {article['publish_time']}
**原文链接:** {article['url']}

---

{html_to_markdown(article['content'])}
"""

        # 生成文件名
        safe_title = re.sub(r'[<>:"/\\|?*]', '', article['title'])[:50]
        filename = f"{safe_title}.md"

        # 返回文件
        from fastapi.responses import Response
        return Response(
            content=markdown_content.encode('utf-8'),
            media_type="text/markdown; charset=utf-8",
            headers={"Content-Disposition": f"attachment; filename*=UTF-8''{filename}"}
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

- [ ] **Step 2: 测试 Markdown 导出**

- [ ] **Step 3: Commit**

```bash
git add backend/main.py
git commit -m "feat: 添加 Markdown 导出功能"
```

---

### 任务 5: 后端 - PDF 导出

**Files:**
- Create: `wechat-article-extractor/backend/pdf_generator.py`
- Modify: `wechat-article-extractor/backend/main.py`

- [ ] **Step 1: 创建 pdf_generator.py**

```python
import re
import os
import uuid
from pathlib import Path
from weasyprint import HTML, CSS
from weasyprint.text.fonts import FontConfiguration

BASE_DIR = Path(__file__).resolve().parent.parent
TEMP_DIR = BASE_DIR / "temp"
TEMP_DIR.mkdir(exist_ok=True)

def generate_pdf(title: str, author: str, publish_time: str, content_html: str, output_path: str):
    """生成 PDF 文件"""

    # 构建 HTML 模板
    html_template = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        @page {{
            size: A4;
            margin: 2cm;
        }}
        body {{
            font-family: "Microsoft YaHei", "SimHei", "Heiti SC", sans-serif;
            font-size: 12pt;
            line-height: 1.8;
            color: #333;
        }}
        .header {{
            border-bottom: 1px solid #eee;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }}
        .title {{
            font-size: 24pt;
            font-weight: bold;
            margin-bottom: 10px;
        }}
        .meta {{
            color: #666;
            font-size: 10pt;
        }}
        .content img {{
            max-width: 100%;
            height: auto;
        }}
        .content p {{
            margin: 1em 0;
            text-align: justify;
        }}
        .content h1, .content h2, .content h3 {{
            margin-top: 1.5em;
            margin-bottom: 0.5em;
        }}
        .content blockquote {{
            border-left: 3px solid #ddd;
            padding-left: 1em;
            color: #666;
            margin: 1em 0;
        }}
    </style>
</head>
<body>
    <div class="header">
        <div class="title">{title}</div>
        <div class="meta">
            公众号: {author} | 发布时间: {publish_time}
        </div>
    </div>
    <div class="content">
        {content_html}
    </div>
</body>
</html>
"""

    # 生成 PDF
    font_config = FontConfiguration()
    HTML(string=html_template).write_pdf(
        output_path,
        font_config=font_config
    )

def html_to_pdf_html(html: str) -> str:
    """清理 HTML，保留基本格式用于 PDF"""
    # 移除脚本
    html = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL)
    # 移除样式
    html = re.sub(r'<style[^>]*>.*?</style>', '', html, flags=re.DOTALL)
    # 保留基本标签
    return html
```

- [ ] **Step 2: 添加 PDF 导出 API**

```python
from pdf_generator import generate_pdf, html_to_pdf_html

@app.get("/api/export/pdf")
async def export_pdf(url: str):
    """导出 PDF 格式"""
    try:
        article = await extractor.extract(url)

        # 清理 HTML 内容
        content_html = html_to_pdf_html(article['content'])

        # 生成临时文件
        filename = f"{uuid.uuid4().hex}.pdf"
        output_path = TEMP_DIR / filename

        # 生成 PDF
        generate_pdf(
            title=article['title'],
            author=article['author'],
            publish_time=article['publish_time'],
            content_html=content_html,
            output_path=str(output_path)
        )

        # 返回文件
        safe_title = re.sub(r'[<>:"/\\|?*]', '', article['title'])[:50]

        response = FileResponse(
            path=output_path,
            filename=f"{safe_title}.pdf",
            media_type="application/pdf"
        )

        # 清理临时文件
        response.call_on_close(lambda: os.unlink(output_path) if os.path.exists(output_path) else None)

        return response

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

- [ ] **Step 3: Commit**

```bash
git add backend/pdf_generator.py backend/main.py
git commit -m "feat: 添加 PDF 导出功能"
```

---

### 任务 6: 前端开发

**Files:**
- Modify: `wechat-article-extractor/frontend/index.html`
- Modify: `wechat-article-extractor/frontend/style.css`
- Modify: `wechat-article-extractor/frontend/app.js`

- [ ] **Step 1: 创建 index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>微信公众号文章提取工具</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>微信公众号文章提取工具</h1>
            <p class="subtitle">提取文章内容，支持导出 Markdown 和 PDF</p>
        </header>

        <main>
            <!-- 输入区域 -->
            <section class="input-section">
                <div class="input-wrapper">
                    <input type="text" id="urlInput" placeholder="请粘贴微信公众号文章链接..." />
                    <button id="extractBtn" class="btn btn-primary">提取文章</button>
                </div>
            </section>

            <!-- 加载状态 -->
            <div id="loading" class="loading hidden">
                <div class="spinner"></div>
                <p>正在提取文章内容，请稍候...</p>
            </div>

            <!-- 错误提示 -->
            <div id="error" class="error hidden"></div>

            <!-- 预览区域 -->
            <section id="preview" class="preview hidden">
                <div class="preview-header">
                    <h2 id="articleTitle"></h2>
                    <div class="article-meta">
                        <span id="articleAuthor"></span>
                        <span id="articleTime"></span>
                    </div>
                </div>
                <div id="articleContent" class="article-content"></div>
            </section>

            <!-- 操作区域 -->
            <section id="actions" class="actions hidden">
                <button id="downloadMd" class="btn btn-success">下载 Markdown</button>
                <button id="downloadPdf" class="btn btn-warning">下载 PDF</button>
            </section>
        </main>

        <footer>
            <p>Made with ❤️ | Local Tool - No Data Uploaded</p>
        </footer>
    </div>

    <script src="app.js"></script>
</body>
</html>
```

- [ ] **Step 2: 创建 style.css**

```css
:root {
    --primary: #07c160;
    --primary-dark: #06ad56;
    --success: #52c41a;
    --warning: #faad14;
    --error: #ff4d4f;
    --bg: #f7f8fa;
    --card: #ffffff;
    --text: #333;
    --text-secondary: #666;
    --border: #e8e8e8;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    background: var(--bg);
    color: var(--text);
    line-height: 1.6;
    min-height: 100vh;
}

.container {
    max-width: 900px;
    margin: 0 auto;
    padding: 40px 20px;
}

header {
    text-align: center;
    margin-bottom: 40px;
}

header h1 {
    font-size: 28px;
    font-weight: 600;
    margin-bottom: 8px;
}

.subtitle {
    color: var(--text-secondary);
    font-size: 14px;
}

.input-section {
    background: var(--card);
    padding: 24px;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    margin-bottom: 24px;
}

.input-wrapper {
    display: flex;
    gap: 12px;
}

input[type="text"] {
    flex: 1;
    padding: 12px 16px;
    border: 1px solid var(--border);
    border-radius: 8px;
    font-size: 15px;
    transition: border-color 0.2s;
}

input[type="text"]:focus {
    outline: none;
    border-color: var(--primary);
}

.btn {
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-primary {
    background: var(--primary);
    color: white;
}

.btn-primary:hover {
    background: var(--primary-dark);
}

.btn-primary:disabled {
    background: #ccc;
    cursor: not-allowed;
}

.btn-success {
    background: var(--success);
    color: white;
}

.btn-warning {
    background: var(--warning);
    color: white;
}

.loading {
    text-align: center;
    padding: 40px;
}

.spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--border);
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin: 0 auto 16px;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.error {
    background: #fff2f0;
    border: 1px solid #ffccc7;
    color: var(--error);
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 24px;
}

.preview {
    background: var(--card);
    padding: 24px;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    margin-bottom: 24px;
}

.preview-header {
    border-bottom: 1px solid var(--border);
    padding-bottom: 16px;
    margin-bottom: 20px;
}

.preview-header h2 {
    font-size: 22px;
    margin-bottom: 8px;
}

.article-meta {
    color: var(--text-secondary);
    font-size: 13px;
}

.article-meta span {
    margin-right: 16px;
}

.article-content {
    font-size: 15px;
    line-height: 1.8;
}

.article-content p {
    margin-bottom: 1em;
}

.article-content img {
    max-width: 100%;
    height: auto;
    border-radius: 4px;
    margin: 16px 0;
}

.actions {
    display: flex;
    gap: 12px;
    justify-content: center;
}

footer {
    text-align: center;
    margin-top: 40px;
    color: var(--text-secondary);
    font-size: 13px;
}

.hidden {
    display: none !important;
}
```

- [ ] **Step 3: 创建 app.js**

```javascript
const API_BASE = 'http://localhost:5177';
let currentUrl = '';

document.addEventListener('DOMContentLoaded', () => {
    const urlInput = document.getElementById('urlInput');
    const extractBtn = document.getElementById('extractBtn');
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    const preview = document.getElementById('preview');
    const actions = document.getElementById('actions');
    const downloadMd = document.getElementById('downloadMd');
    const downloadPdf = document.getElementById('downloadPdf');

    // 提取按钮点击
    extractBtn.addEventListener('click', async () => {
        const url = urlInput.value.trim();

        if (!url) {
            showError('请输入文章链接');
            return;
        }

        if (!url.includes('mp.weixin.qq.com/s')) {
            showError('请输入有效的微信公众号文章链接');
            return;
        }

        currentUrl = url;
        await extractArticle(url);
    });

    // 下载 Markdown
    downloadMd.addEventListener('click', () => {
        if (currentUrl) {
            window.open(`${API_BASE}/api/export/markdown?url=${encodeURIComponent(currentUrl)}`, '_blank');
        }
    });

    // 下载 PDF
    downloadPdf.addEventListener('click', () => {
        if (currentUrl) {
            window.open(`${API_BASE}/api/export/pdf?url=${encodeURIComponent(currentUrl)}`, '_blank');
        }
    });

    async function extractArticle(url) {
        showLoading(true);
        hideError();
        hidePreview();
        hideActions();

        try {
            const response = await fetch(`${API_BASE}/api/extract`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.detail || '提取失败');
            }

            showPreview(result.data);
        } catch (err) {
            showError(err.message);
        } finally {
            showLoading(false);
        }
    }

    function showLoading(show) {
        loading.classList.toggle('hidden', !show);
        extractBtn.disabled = show;
    }

    function showError(message) {
        error.textContent = message;
        error.classList.remove('hidden');
    }

    function hideError() {
        error.classList.add('hidden');
    }

    function showPreview(data) {
        document.getElementById('articleTitle').textContent = data.title;
        document.getElementById('articleAuthor').textContent = `公众号: ${data.author}`;
        document.getElementById('articleTime').textContent = `发布时间: ${data.publish_time}`;
        document.getElementById('articleContent').innerHTML = data.content;

        preview.classList.remove('hidden');
        actions.classList.remove('hidden');
    }

    function hidePreview() {
        preview.classList.add('hidden');
    }

    function hideActions() {
        actions.classList.add('hidden');
    }
});
```

- [ ] **Step 4: Commit**

```bash
git add frontend/index.html frontend/style.css frontend/app.js
git commit -m "feat: 前端界面开发完成"
```

---

### 任务 7: 完整测试

**Files:**
- 测试整个流程

- [ ] **Step 1: 安装依赖并测试**

```bash
# 进入项目目录
cd wechat-article-extractor

# 安装 Python 依赖
pip install -r backend/requirements.txt

# 安装 Playwright 浏览器
playwright install chromium

# 启动服务
cd backend
python main.py
```

- [ ] **Step 2: 在浏览器中测试**

打开 http://localhost:5177

1. 粘贴一篇微信文章链接
2. 点击"提取文章"
3. 检查预览是否正确
4. 尝试下载 Markdown
5. 尝试下载 PDF

- [ ] **Step 3: 修复发现的问题**

- [ ] **Step 4: Commit 最终版本**

```bash
git add .
git commit -m "feat: 完成微信公众号文章提取工具开发"
```

---

### 任务 8: GitHub 推送

- [ ] **Step 1: 创建 GitHub 仓库**

在 GitHub 网站上创建新仓库，获取仓库地址

- [ ] **Step 2: 推送代码**

```bash
cd wechat-article-extractor
git remote add origin https://github.com/用户名/wechat-article-extractor.git
git branch -M main
git push -u origin main
```

- [ ] **Step 3: 验证推送成功**

检查 GitHub 仓库是否包含所有文件

---

## 预期交付物

1. 完整可运行的项目代码
2. 提取功能正常工作
3. Markdown 导出正常
4. PDF 导出正常
5. GitHub 仓库已创建并推送
