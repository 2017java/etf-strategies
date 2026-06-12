# ETF操盘看板 v2.0.0

一个面向A股操盘场景的ETF实时监控看板 + **三档策略可回测**的量化投研工具。
帮助用户实时把握市场动态，同时以历史数据验证轮动策略的有效性。

## v2.0.0 新增亮点

- **📊 自研回测引擎**：完整的信号→持仓→交易→净值→指标链路（不含未来函数、可复现、确定性）
- **🎯 三档可切换策略**：
  - L1 趋势评分 TOP1：对数价格线性回归 × R²，选取动量最稳健的 1 只 ETF，日频调仓
  - L2 多因子 TOP5：动量 / 量能 / 反转 / 估值复合 / 波动率倒数，每月初选综合评分最高的 5 只等权配置
  - L3 多因子 + RSRS 择时：L2 选股基础上，以沪深300 RSRS 指标判断大盘强弱；弱势空仓、弱势个股剔除
- **🔬 策略对比**：多策略同周期并排比较，净值曲线 + 年化收益/最大回撤/夏普/卡玛/月胜率 横向对比
- **🧪 31 个单元测试**：从指标计算到策略信号到端到端引擎集成，全链路覆盖
- **💾 Parquet 数据缓存**：akshare 拉取后本地持久化，重复运行回测无需反复请求

## 功能特性（看板 + 回测）

- **ETF池跟踪**：覆盖40+只主流宽基ETF与行业ETF
- **实时数据展示**：当前涨跌幅、上两个交易日累计涨幅、成交量放大百分比
- **量化推荐TOP3**：每日根据综合得分排序（涨跌幅×2 + 两日累计涨幅×3 + 成交量放大×0.5）
- **LLM热点推荐TOP5**：分析当日财经热点，推荐5只ETF并附理由
- **交易时段适配**：盘中实时数据，盘后自动取上一交易日收盘数据
- **一键运算**：前端"刷新运算"按钮触发后端拉取数据、计算指标、生成推荐
- **策略回测**：指定策略、起止日期、初始资金、成本费率，一键生成净值曲线、调仓信号与交易流水
- **策略对比**：同时运行多个策略，横向比较业绩指标和回撤特征

---

## 技术栈

- **后端**：Python + FastAPI + akshare（新浪接口）+ pandas/numpy + parquet
- **回测层**：自研轻量引擎（`app/backtest/`）+ 三档策略（`app/strategies/`）
- **前端**：React + TypeScript + Vite + Tailwind CSS + Recharts
- **数据获取**：akshare `fund_etf_hist_sina` 接口

### 目录结构

```
ETF操盘看板_beta1.3/
├── backend/
│   ├── app/
│   │   ├── backtest/          # 回测引擎 + 业绩指标
│   │   ├── strategies/        # L1/L2/L3 策略实现
│   │   ├── data_store.py      # parquet 数据缓存
│   │   ├── backtest_routes.py # /api/backtest/* 路由
│   │   └── main.py            # FastAPI 入口
│   └── tests/                 # 31 个单元测试 + 端到端测试
└── frontend/
    └── src/
        ├── components/
        │   ├── Dashboard.tsx          # 原实时看板
        │   ├── BacktestRunner.tsx     # 单策略回测
        │   └── BacktestCompare.tsx    # 策略对比
        └── App.tsx                    # 三页导航
```

---

## 环境准备

### 必需软件

| 软件 | 版本要求 | 下载地址 |
|------|---------|---------|
| Python | 3.10+ | https://www.python.org/downloads/ |
| Node.js | 18+ | https://nodejs.org/ |

安装时请勾选 **"Add to PATH"**，确保命令行可识别 `python` 和 `npm`。

### 验证安装

打开 PowerShell 或 CMD，执行：

```bash
python --version   # 应显示 Python 3.x.x
node --version     # 应显示 v18.x.x 或更高
npm --version      # 应显示 9.x.x 或更高
```

---

## 启动方式

### 方式一：一键启动（推荐）

直接双击项目根目录下的 **「一键启动看板.bat」**，脚本将自动完成：

1. 检测 Python 和 Node.js 环境
2. 安装/检查后端依赖（`pip install -r requirements.txt`）
3. 安装/检查前端依赖（`npm install`）
4. 启动后端 FastAPI 服务（`http://127.0.0.1:8000`）
5. 启动前端 Vite 开发服务器（`http://127.0.0.1:5173`）
6. 自动打开浏览器访问看板

按 Enter 键可关闭所有服务并退出。

> 首次启动耗时较长（需要安装依赖），请耐心等待。

### 方式二：手动分步启动

如需单独控制前后端，可手动执行：

#### 1. 启动后端

```bash
cd backend
pip install -r requirements.txt
python run.py
```

后端默认运行在 `http://127.0.0.1:8000`

#### 2. 启动前端（新终端窗口）

```bash
cd frontend
npm install      # 首次运行
npm run dev
```

前端默认运行在 `http://127.0.0.1:5173`，开发服务器已配置代理到后端。

### 方式三：PowerShell 脚本启动

在项目根目录下打开 PowerShell，执行：

```powershell
powershell -ExecutionPolicy Bypass -File start-dashboard.ps1
```

---

## 使用看板

1. 打开浏览器访问 `http://127.0.0.1:5173`
2. 看板自动加载缓存数据（如有）
3. 点击顶部 **「刷新运算」** 按钮，后端将：
   - 从 akshare 拉取最新ETF行情
   - 计算涨跌幅、两日累计涨幅、成交量放大
   - 生成量化TOP3推荐
   - 生成LLM热点TOP5推荐
4. 表格支持点击表头排序，支持按「宽基/行业」筛选

---

## 配置LLM推荐（可选）

如需启用LLM热点分析推荐，设置环境变量后重启后端：

```powershell
$env:LLM_API_KEY="your_api_key"
$env:LLM_API_BASE="https://api.openai.com/v1"
$env:LLM_MODEL="gpt-4o-mini"
```

未配置时，系统将自动回退到基于当日行情的规则推荐。

---

## 项目结构

```
.
├── 一键启动看板.bat      # Windows 一键启动入口
├── start-dashboard.ps1   # PowerShell 启动脚本
├── README.md
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI入口
│   │   ├── config.py            # ETF代码池与权重配置
│   │   ├── models.py            # Pydantic数据模型
│   │   ├── data_fetcher.py      # akshare数据获取
│   │   ├── calculator.py        # 指标计算与加权评分
│   │   └── llm_recommender.py   # LLM推荐逻辑
│   ├── requirements.txt
│   └── run.py
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.tsx    # 看板总容器
│   │   │   ├── ETFTable.tsx     # ETF数据表格
│   │   │   ├── QuantRanking.tsx # 量化推荐TOP3
│   │   │   └── LLMRecommend.tsx # LLM热点推荐TOP5
│   │   ├── api.ts               # API封装
│   │   ├── types.ts             # 类型定义
│   │   └── App.tsx
│   └── ...
└── README.md
```

---

## 加权评分公式

```
综合得分 = 当前涨跌幅 × 2 + 上两日累计涨幅 × 3 + 成交量放大 × 0.5
```

---

## 常见问题

**Q: 双击「一键启动看板.bat」没有反应？**  
A: 请确保 PowerShell 已安装（Windows 10/11 自带），且当前目录包含 `start-dashboard.ps1`。

**Q: 后端启动报错 "ModuleNotFoundError"？**  
A: 依赖未安装完整，进入 `backend` 目录手动执行 `pip install -r requirements.txt`。

**Q: 前端页面白屏？**  
A: 检查 `frontend` 目录下是否有 `node_modules`，没有则执行 `npm install`。

**Q: 数据刷新后价格显示异常？**  
A: 检查后端是否正常运行，点击浏览器刷新按钮重新加载页面。

---

## 注意事项

- 涨跌幅遵循A股惯例：**红色表示上涨，绿色表示下跌**
- akshare数据来自新浪财经，如遇到网络限制可尝试更换网络环境
- 交易时段判断基于北京时间（9:30-11:30, 13:00-15:00）
- 首次启动需要下载安装依赖，耗时约 1-3 分钟，请耐心等待
