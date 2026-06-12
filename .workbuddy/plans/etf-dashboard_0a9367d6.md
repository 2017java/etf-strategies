---
name: etf-dashboard
overview: 搭建ETF一览看板，实时跟踪40+只主流ETF，支持加权因子推荐TOP3和LLM热点推荐TOP5，数据来源于akshare，前后端分离架构。
design:
  architecture:
    framework: react
  styleKeywords:
    - Financial Dashboard
    - Light Cold Tone
    - Glassmorphism
    - Clean Hierarchy
    - Data Dense
  fontSystem:
    fontFamily: PingFang SC
    heading:
      size: 24px
      weight: 600
    subheading:
      size: 16px
      weight: 500
    body:
      size: 14px
      weight: 400
  colorSystem:
    primary:
      - "#2563EB"
      - "#3B82F6"
      - "#60A5FA"
    background:
      - "#F8FAFC"
      - "#FFFFFF"
      - "#EFF6FF"
    text:
      - "#0F172A"
      - "#475569"
      - "#94A3B8"
    functional:
      - "#EF4444"
      - "#22C55E"
      - "#F59E0B"
todos:
  - id: setup-backend
    content: 搭建FastAPI后端项目结构，配置ETF代码池与akshare数据获取模块
    status: completed
  - id: implement-calculation
    content: 实现指标计算API（涨跌幅、2日累计涨幅、成交量放大、加权评分排序）
    status: completed
    dependencies:
      - setup-backend
  - id: implement-llm-recommend
    content: 实现新闻聚合与LLM热点推荐逻辑，输出TOP5 ETF及理由
    status: completed
    dependencies:
      - setup-backend
  - id: setup-frontend
    content: 搭建React+Vite+Tailwind前端项目，配置类型定义与API封装
    status: completed
  - id: build-dashboard-ui
    content: 构建看板UI（ETF表格、量化推荐TOP3、LLM推荐TOP5、刷新按钮）
    status: completed
    dependencies:
      - setup-frontend
  - id: integrate-test
    content: 前后端联调，测试数据准确性、交易时段适配及UI交互
    status: completed
    dependencies:
      - implement-calculation
      - implement-llm-recommend
      - build-dashboard-ui
---

## 产品概述

一个面向操盘场景的ETF实时监控看板，帮助用户一眼把握主流宽基与行业ETF的市场动态，并通过量化评分和AI热点分析双维度推荐当日值得关注的ETF标的。

## 核心功能

1. **ETF池跟踪**：覆盖40+只主流宽基ETF（510300、510500、512100、159915等）与行业ETF（159739、588200、159806等），展示名称、代码、所属类别
2. **实时数据展示**：当前实时涨跌幅、上两个交易日累计涨幅（(T-1收盘价-T-3收盘价)/T-3收盘价×100%）、成交量较前两交易日放大百分比
3. **加权量化推荐TOP3**：每日根据综合得分排序，权重为当前涨跌幅0.2 + 近两交易日累计涨幅0.3 + 成交量放大0.5
4. **LLM热点推荐TOP5**：获取当日财经热点新闻，由大模型分析新闻与各行业/主题的关联度，推荐5只ETF并附理由
5. **交易时段适配**：交易时段展示盘中即时数据，非交易时段自动回退到上一交易日收盘数据
6. **一键运算**：前端提供"运算/刷新"按钮，点击后触发后端拉取数据、计算指标、生成推荐

## 技术选型

- **后端**：Python + FastAPI（轻量高效，便于集成akshare）
- **前端**：React + TypeScript + Vite + Tailwind CSS（现代开发体验，响应式布局）
- **数据获取**：akshare开源库（用户指定）获取ETF历史行情与实时数据
- **LLM分析**：通过OpenAI兼容API（或系统可用的大模型）进行热点新闻分析与ETF推荐
- **通信**：前后端通过HTTP REST API交互，前端轮询或点击触发刷新

## 实现方案

采用前后端分离架构。后端负责任务调度：从akshare拉取ETF历史行情数据（当前及前3个交易日），计算涨跌幅、累计涨幅、成交量放大率，执行加权评分排序；同时聚合当日财经新闻，构建Prompt调用LLM生成热点关联推荐。前端作为纯展示层，以看板形式渲染ETF列表、量化推荐榜、LLM推荐榜。

## 关键设计决策

- 后端使用FastAPI的异步特性并发请求多只ETF数据，减少总耗时
- 数据缓存策略：后端对akshare请求结果做短期内存缓存（如5分钟），避免频繁调用被封
- 成交量放大计算：用当日成交量 / (前两交易日成交量均值) - 1，更稳健
- LLM推荐不依赖实时行情，而是基于新闻文本与ETF映射关系做主题关联分析
- 交易时段判断：后端根据当前时间（9:30-11:30, 13:00-15:00）决定拉取实时或上一交易日数据

## 目录结构

```
etf-trading-dashboard/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # [NEW] FastAPI入口，定义API路由
│   │   ├── config.py            # [NEW] ETF代码池、权重配置、交易时段配置
│   │   ├── models.py            # [NEW] Pydantic数据模型（ETFData、RecommendResult等）
│   │   ├── data_fetcher.py      # [NEW] akshare数据获取与缓存
│   │   ├── calculator.py        # [NEW] 指标计算（涨跌幅、累计涨幅、成交量放大、加权评分）
│   │   └── llm_recommender.py   # [NEW] 新闻获取与LLM推荐逻辑
│   ├── requirements.txt         # [NEW]
│   └── run.py                   # [NEW] 服务启动脚本
├── frontend/
│   ├── src/
│   │   ├── App.tsx              # [NEW] 主应用布局
│   │   ├── api.ts               # [NEW] 后端API封装
│   │   ├── types.ts             # [NEW] TypeScript类型定义
│   │   └── components/
│   │       ├── Dashboard.tsx    # [NEW] 看板总容器
│   │       ├── ETFTable.tsx     # [NEW] ETF数据表格
│   │       ├── QuantRanking.tsx # [NEW] 加权量化推荐TOP3
│   │       └── LLMRecommend.tsx # [NEW] LLM热点推荐TOP5
│   ├── index.html
│   ├── package.json
│   └── tailwind.config.js
└── README.md                    # [NEW]
```

## 设计概述

采用浅色冷调金融看板风格，整体干净、结构化、信息层级清晰。摒弃深色科技风，以白色/浅灰为底，蓝色系为强调色，涨红跌绿遵循A股惯例。

## 页面规划

### 首页 - ETF操盘看板

- **顶部导航栏**：左侧为看板标题与当前日期/时间，右侧为"刷新运算"主按钮及数据时间戳说明
- **核心指标卡片区**：横向排列3张玻璃质感卡片，分别展示"量化评分第1名"、"2日累计涨幅最高"、"成交量放大最显著"的ETF，一目了然
- **ETF全量数据表格区**：主内容区，表格展示全部40+只ETF的实时涨跌幅、2日累计涨幅、成交量放大率。支持按类别（宽基/行业）筛选，表头可排序，涨跌以颜色+箭头直观呈现
- **双推荐区（底部左右分栏）**：
- 左侧：量化推荐TOP3，以排名列表形式展示，带综合得分进度条
- 右侧：LLM热点推荐TOP5，以卡片流形式展示，每张卡片含ETF名称及AI推荐理由摘要

## 风格关键词

浅色冷调、金融数据看板、玻璃拟态卡片、清晰层级、专业简洁、响应式网格

## Agent Extensions

### Skill

- **finance-data-retrieval**
- Purpose: 当akshare获取数据受限或需要补充财经新闻时，作为备选数据源获取ETF行情及财经新闻
- Expected outcome: 提供结构化的ETF历史行情或当日财经新闻数据
- **neodata-financial-search**
- Purpose: 用于自然语言查询ETF实时行情及市场热点资讯，辅助LLM推荐环节的数据收集
- Expected outcome: 快速获取指定ETF的实时报价及市场热点信息