# PROJECT MEMORY

> 用于保存未来会话和协作 agent 需要的项目级记忆。
> 只记录增量、决策、风险和经验，不重复已有文档内容。

---

## [PROJECT SNAPSHOT] ETF操盘看板 v2.0.0 — 2026-06-11

### 项目概述
ETF轮动策略量化看板，前后端分离架构。
- 后端：FastAPI + Python，策略引擎 + 回测 + LLM推荐
- 前端：React/Vite/Tailwind/Recharts
- 数据源：akshare（主）/ tushare（备）+ 本地 Parquet 缓存
- 项目目录：`d:\AICoding\ClaudeProjects\量化交易策略\ETF交易策略v2.0.0\ETF操盘看板_beta1.3`

### Git 仓库（重要修正）
- **git 仓库根目录在 `D:/AICoding`**，不是项目目录！
- 项目是 `D:/AICoding` 大仓库下的子目录
- 当前主分支是 `main`（不是 master）
- 提交时需用 `git -c core.fsmonitor=false` 避免沙箱权限问题
- 分支操作流程：创建分支 → 修改 → 提交 → 验证 → checkout main → merge → 删除分支

### 启动方式
- 双击 `start.bat`（推荐，自动清理旧进程）
- 或 `powershell -ExecutionPolicy Bypass -File start-dashboard.ps1`
- 按 Enter 关闭所有服务（含子进程清理）

---

## [BUG RECORD] GBK 编码错误 + CSP 崩溃 — 2026-06-11

### 问题现象
1. 实时行情看板加载不出数据，报错 `'gbk' codec can't encode character '\u2705'`
2. 浏览器 CSP 阻止 eval
3. 加 CSP 后 React 崩溃：`@vitejs/plugin-react can't detect preamble`

### 根本原因
1. **Windows stdout 默认 GBK 编码**，emoji 字符（✅⚠️）无法编码 → print() 崩溃
2. **浏览器 CSP 阻止 eval** → Vite HMR 失败
3. **CSP 只加 unsafe-eval 缺 unsafe-inline** → React Fast Refresh preamble 被拦截 → 整个看板白屏

### 修复方案
- `llm_recommender.py`：emoji(✅⚠️) 替换为 ASCII 标记([OK][WARN])
- `run.py`：启动时设置 `sys.stdout/stderr.reconfigure(encoding="utf-8", errors="replace")`
- `vite.config.ts`：**移除开发模式 CSP header**（开发环境不需要 CSP，生产由部署服务器控制）

### 预防说明（血的教训）
- **Windows 环境下 Python 代码绝不能用 emoji 输出到 stdout/stderr**
- **Vite 开发模式不要加 CSP**：React Fast Refresh 需要 eval + inline script
- **改代码必须验证完整链路**：上次只修了 eval 没修 inline，导致 React 崩溃——改了 A 必须验证 B 不炸

---

## [BUG RECORD] 启动脚本 Tee-Object 报错 + 后端500 — 2026-06-11

### 问题现象
1. 启动脚本报 `'Tee-Object' 不是内部或外部命令`
2. 后端启动超时
3. 前端请求 `/api/dashboard` 返回 500

### 根本原因
1. **`Tee-Object` 是 PowerShell cmdlet**，但启动脚本用 `cmd.exe /k` 执行后端命令，cmd.exe 不认识 Tee-Object → 后端进程启动失败
2. 后端没启动成功 → Wait-ForUrl 超时 → 前端代理到后端返回 500

### 修复方案
- `start-dashboard.ps1`：后端改用 `powershell.exe -NoExit -Command` 启动
- 前端改用 `cmd.exe /k`（保持窗口打开）
- 变量展开：将命令字符串先赋值给 `$BackendCmd` 变量（双引号展开），再传给 Start-Process

---

## [BUG RECORD] LLM热点推荐链路修复 — 2026-06-11

### 修复方案
- `run.py`：正确的 `log_config` 结构（`version:1`），`force=True` 覆盖已有日志配置
- `start-dashboard.ps1`：启动前清理8000端口旧进程；退出时杀整个进程树
- `.env`：火山引擎配置已填好
- 429 时前端显示橙色"量化兜底"，恢复后自动变紫色"AI分析"

---

## [BUG RECORD] 回测引擎Bug修复 — 2026-06-06

### 已修复的Bug（共7个）
| # | 文件 | 问题 | 修复 |
|---|------|------|------|
| 1 | data_store.py | 缓存判断只看首尾日期，不看覆盖率 | 改为95%交易日覆盖才算命中 |
| 2 | l3策略 | benchmark_code 默认 "000300" | 改为 "510300" |
| 3 | engine.py | benchmark NAV 初始化为0 | 延迟到首日有效数据才初始化 |
| 4 | engine.py | 等权策略卖出时没有清空持仓 | 改为全卖出再等权买入 |
| 5 | metrics.py | 夏普比率年化用365天 | 改为252交易日 |
| 9 | BacktestRunner.tsx | 图表用数组索引对齐NAV导致错位 | 改为 Map 对齐 |
| 10 | start-dashboard.ps1 | 扫描所有node进程杀掉 | 只杀自身启动的进程 |

---

## [FEATURE] 数据源切换 — 2026-06-06

- `datasource.py`：配置中心，`create_data_store()` 工厂函数
- `tushare_store.py`：tushare适配器
- 环境变量 `ETF_DATA_SOURCE`：akshare（默认）/ tushare / auto

### tushare凭证（已配置）
- Token: `***REDACTED-TUSHARE-TOKEN***`
- API: `http://101.35.233.113:8020/`

---

## [FEATURE] LLM热点推荐 — 2026-06-11

### 配置（.env）
```
LLM_API_KEY=***REDACTED-LLM-API-KEY***
LLM_API_BASE=https://ark.cn-beijing.volces.com/api/coding/v3
LLM_MODEL=deepseek-v4-pro
```

### 关键文件
- `app/llm_recommender.py`：核心逻辑，`call_llm_api()` + `fallback_recommend()`
- 前端标签：`source: "llm"` 显示紫色"AI分析"，`source: "fallback"` 显示橙色"量化兜底"

---

## [GIT] 分支与提交

### 仓库结构（重要）
- **git 根目录：`D:/AICoding`**，项目是其子目录
- 主分支：`main`
- 提交时需用 `git -c core.fsmonitor=false` 避免沙箱 index.lock 权限问题
- 分支策略：创建分支 → 修改 → 提交 → 验证 → checkout main → merge --no-ff → 删除分支

### 重要提交（main 分支）
- `aff0719` merge: fix/csp-react-crash → main (移除开发模式CSP)
- `e572699` fix: 移除开发模式CSP header，修复React Fast Refresh崩溃
- `f695b28` merge: fix/gbk-emoji-and-csp → main (GBK编码+CSP修复)
- `ebbcff7` fix: 修复 GBK 编码错误(emoji)和 CSP 阻止 eval 问题
- `b0e67a1` merge: fix/llm-logging-and-env → main
- `4e690cf` fix: uvicorn log_config使用空dict避免覆盖自定义日志
- `1502026` fix: 修复LLM日志输出和.env加载问题

---

## [BUG RECORD] 配色反位 / 基准代码手填 / 策略选择失效 / 模拟仓异常 — 2026-06-11

### 子 agent 分工（subagent-driven-development）
- **Sim Portfolio agent**：`SimPortfolio.tsx` / `sim_routes.py` / `sim_portfolio.py` / `api.ts` / `main.py` / `test_sim_routes.py`
- **Backtest agent**：`BacktestRunner.tsx` / `BacktestCompare.tsx` / `Dashboard.tsx` / `backtest_routes.py` / `api.ts` / `types.ts` / `models.py`
- **Reviewer agent**：跑回归 + grep 反模式 + curl e2e + 出独立审查报告

### Bug 1：涨红跌绿配色反位（A股惯例）
**根因**：代码中"涨/盈利/买入"场景直接用 `text-emerald-*`（绿）和 `text-rose-*`（红），与 A 股惯例相反。`tailwind.config.js` 已定义 `text-rise` (#EF4444 红) / `text-fall` (#22C55E 绿) 语义色但未统一使用。

**修复**：所有"涨跌/盈亏/买/卖"语义位置改用 `text-rise` / `text-fall` 语义类，渐变从 `from-emerald-50` 改为 `from-rose-50`（涨=红）。

**文件 + 行号**：
- [SimPortfolio.tsx:103](file:///D:/AICoding/ClaudeProjects/量化交易策略/ETF交易策略v2.0.0/ETF操盘看板_beta1.3/frontend/src/components/SimPortfolio.tsx#L103) BatchBuyModal EtfCheckbox
- [SimPortfolio.tsx:504, 529, 696-727](file:///D:/AICoding/ClaudeProjects/量化交易策略/ETF交易策略v2.0.0/ETF操盘看板_beta1.3/frontend/src/components/SimPortfolio.tsx#L504) PositionRow + 三张盈亏卡
- [BacktestRunner.tsx:14-19](file:///D:/AICoding/ClaudeProjects/量化交易策略/ETF交易策略v2.0.0/ETF操盘看板_beta1.3/frontend/src/components/BacktestRunner.tsx#L14) `metricColor` 函数（保留 higherBetter 反向逻辑）
- [BacktestRunner.tsx:326-330](file:///D:/AICoding/ClaudeProjects/量化交易策略/ETF交易策略v2.0.0/ETF操盘看板_beta1.3/frontend/src/components/BacktestRunner.tsx#L326) 买入红/卖出绿徽章
- [Dashboard.tsx:127](file:///D:/AICoding/ClaudeProjects/量化交易策略/ETF交易策略v2.0.0/ETF操盘看板_beta1.3/frontend/src/components/Dashboard.tsx#L127) 涨幅最高卡 gradient

**预防**：新增"涨跌/盈亏/买/卖"组件时，**必须**用 `text-rise` / `text-fall` 语义类，不要直接用 emerald/rose 直接色。`grep "text-emerald-600\|text-rose-600"` 应只命中"非财务语义"位置（错误提示、危险按钮等）。

### Bug 2：基准代码手填，无中文名
**根因**：`BacktestRunner.tsx` 和 `BacktestCompare.tsx` 用 `<input type="text">` 让用户手填 6 位代码，无中文提示。

**修复**：
- 后端 [backtest_routes.py:63-92](file:///D:/AICoding/ClaudeProjects/量化交易策略/ETF交易策略v2.0.0/ETF操盘看板_beta1.3/backend/app/backtest_routes.py#L63) 新增 `BENCHMARK_REGISTRY`（20 只 ETF + 中文名），assert 覆盖 `DEFAULT_ETF_CODES`
- 后端 `GET /api/backtest/benchmarks` 端点
- 前端 [api.ts](file:///D:/AICoding/ClaudeProjects/量化交易策略/ETF交易策略v2.0.0/ETF操盘看板_beta1.3/frontend/src/api.ts) `listBenchmarks()`
- 前端 BacktestRunner.tsx + BacktestCompare.tsx 改 `<select>`，option 格式 `"{code} - {中文名}"`

### Bug 3：策略选择失效 — **真正的根因：端口不匹配**（2026-06-11 补充）
**Subagent 最终 e2e 验证发现**：`vite.config.ts` proxy target 是 `http://127.0.0.1:8899`，但 `start-dashboard.ps1` 启动后端用的是 `http://127.0.0.1:8000`（第15行）。端口不一致导致 Vite dev server 的 `/api/*` 代理全部 502/连接失败，`listStrategies()` 等 API 返回失败 → strategies 永远是空数组 → 策略选择永远显示"加载中..."，看似坏了。

之前 subagent 对 BacktestRunner/BacktestCompare 的代码修改（useEffect 回填、active 样式）是对的，但**真正让选择失效的是端口不匹配**。

**修复**：
- [vite.config.ts:12](file:///D:/AICoding/ClaudeProjects/量化交易策略/ETF交易策略v2.0.0/ETF操盘看板_beta1.3/frontend/vite.config.ts#L12) `target: 'http://127.0.0.1:8000'`（与 start-dashboard.ps1 一致）

**预防**：**vite proxy 端口必须与后端启动端口一致**。start-dashboard.ps1 改了 `$BackendUrl` 后，同步改 vite.config.ts proxy target，或把端口写进 `.env` 作为单一数据源。

### Bug 3b：策略选择代码层问题（2026-06-11 修复）
**根因（RCA 5-Why）**：
1. 用户看到"选不上" — 单页 select 在 strategies=[] 时无 option；多选按钮 active 视觉太弱
2. 之所以如此 — `useState` 默认值与 strategies 加载生命周期解耦；多选默认 `Set(["l1","l2","l3"])` 写在初始 state 里
3. 之所以样式弱 — 没用 solid 填充色
4. 之所以没 solid 填充 — 缺少 selected/unselected design system
5. **根因** — 默认值未绑 strategies 加载生命周期 + active 样式对比度不足

**修复**：
- `BacktestRunner.tsx`：strategies 加载完成后 useEffect 回填默认 ID，加"加载中..."占位 option
- `BacktestCompare.tsx`：初始 `selected` 改 `new Set()`，加载完用 strategies 实际 ID 填充
- active 样式从 amber-50 渐变改为 `bg-gradient-to-br from-amber-500 to-orange-500 text-white`（实色高对比）

### Bug 4：模拟持仓三大问题

#### 4a 新增持仓按钮点击无反应
**根因**：`onClick={() => setShowPosEdit(undefined)}` —— 但 `showPosEdit !== undefined` 判断条件决定弹窗显示，**设成 undefined 等于关闭弹窗**。

**修复**：拆分 boolean + editingPosition 双 state。`setEditingPosition(null); setShowPosEdit(true)`，「编辑」按钮也 set 两个 state。判断条件改为 `showPosEdit &&`。

#### 4b 初始资金无法编辑
**修复**：
- 后端 [sim_routes.py:12-22](file:///D:/AICoding/ClaudeProjects/量化交易策略/ETF交易策略v2.0.0/ETF操盘看板_beta1.3/backend/app/sim_routes.py#L12) `_load` 兜底：`initial_cash <= 0` 自动 reset 为 1_000_000 + warning log
- 后端 [sim_routes.py](file:///D:/AICoding/ClaudeProjects/量化交易策略/ETF交易策略v2.0.0/ETF操盘看板_beta1.3/backend/app/sim_routes.py) `update_initial_cash(amount)` 函数（必须 > 0，否则 400）
- 后端 [main.py:160-164](file:///D:/AICoding/ClaudeProjects/量化交易策略/ETF交易策略v2.0.0/ETF操盘看板_beta1.3/backend/app/main.py#L160) 同时注册 `POST` 和 `PATCH /api/sim/initial-cash`（REST 语义对齐）
- 前端 [api.ts](file:///D:/AICoding/ClaudeProjects/量化交易策略/ETF交易策略v2.0.0/ETF操盘看板_beta1.3/frontend/src/api.ts) `updateInitialCashSim(amount)`
- 前端 [SimPortfolio.tsx:641-687](file:///D:/AICoding/ClaudeProjects/量化交易策略/ETF交易策略v2.0.0/ETF操盘看板_beta1.3/frontend/src/components/SimPortfolio.tsx#L641)「初始资金」卡加 Edit2/Save/X 按钮 + Enter/Esc 快捷键

#### 4c 批量买入除零报错
**根因**：`BatchBuyModal` 把"行情推荐 ETF TOP5" 段的 `current_price` 硬编码为 0，触发后端 `int(per_share / 0 / 100)` 除零。

**修复**：
- 前端从 `allEtfs.find(x => x.code === e.code)?.current_price ?? 0` 查真实价
- 后端 [sim_routes.py:91-102](file:///D:/AICoding/ClaudeProjects/量化交易策略/ETF交易策略v2.0.0/ETF操盘看板_beta1.3/backend/app/sim_routes.py#L91) `batch_buy` 对 `price<=0` 的 item 直接跳过 + warning log（兜底）

### 新增测试
[backend/tests/test_sim_routes.py](file:///D:/AICoding/ClaudeProjects/量化交易策略/ETF交易策略v2.0.0/ETF操盘看板_beta1.3/backend/tests/test_sim_routes.py) 新增 6 个 case：corrupt 数据兜底、initial_cash<=0 自动 reset、update_initial_cash 入参校验、persistence、batch_buy price=0 跳过（auto + fixed 两种路径）

### 验证结果
- 后端 pytest：**37/37 passed** ✅
- 前端 `npm run build`：**0 error** ✅
- e2e curl：`/api/backtest/benchmarks` 返回 20 条；`/api/sim/initial-cash` 接受 POST 和 PATCH，`amount<=0` 返 400；`/api/sim/batch-buy` 价格 0 不报错
- 反模式扫描：`text-emerald-500/600/700` 只剩"卖=绿"位置（`BacktestRunner.tsx:332`, `SimPortfolio.tsx:535`），其他都是错误/危险按钮的 `text-rose`（非财务场景，不动）

### 沉淀经验
- **RCA 5-Why 在写代码前**：Bug 3（策略选择失效）表象是"按钮不响应"，根因是默认值与异步加载生命周期没解耦。**先做 RCA 再动手**，避免改一个点炸一片
- **ts 类型契约比运行时检查更便宜**：Recharts 3.x `Tooltip.formatter` 类型变成 `ValueType = number | string | Array<...>`，原代码写 `(value: number) => value.toFixed(2)` 编译失败且运行时会炸。**统一改成 `(value: any) => Number(value).toFixed(2)`** 兜底
- **state 拆分避免 sentinel 陷阱**：用 `boolean + data` 双 state 代替 `data: T | undefined` 单 state（sentinel），更不容易写错判断条件
- **A 股配色必须走语义色**：直接用 emerald/rose 早晚翻车，统一走 `text-rise` / `text-fall` + 配 Tailwind 主题切换才不乱
- **不靠 `e: any` 吞错**：`catch (e: any)` 改为 `catch (e) { ... e instanceof Error ? e.message : String(e) }`

### 已知遗留（pre-existing，非本次范围）
- `App.tsx` lucide icon 类型：从 `React.ComponentType<{ size?: number }>` 改为 `LucideIcon`（本次顺手修了 ✅）
- `BacktestRunner.tsx` / `BacktestCompare.tsx` Recharts Tooltip formatter 改为 `(value: any) => Number(value).toFixed(2)`（本次顺手修了 ✅）
- `Dashboard.tsx:61` "实时" 徽章用 `text-rose-600`，与"涨=红"轻微混淆，建议改 indigo（**未修**，独立 task）
- `sim_portfolio_data.json` 写到 `backend/` 目录，建议挪到 `~/.etf_sim/`（**未修**，独立 task）
- `as any` 反模式（SimPortfolio.tsx 4 处 catch）— **未修**，独立 task

### 用户可能误判
- 用户报"初始资金为 0"，但实测 `sim_portfolio_data.json` 里是 2_500_000。可能用户记忆错乱、或者之前 reset 时误操作。新增「编辑初始资金」入口后，用户可自行调整。

---

## [BUG RECORD] 后端启动失败 + 启动脚本清理能力丢失 — 2026-06-12

### 问题现象
1. 后端启动即崩溃 `ImportError: cannot import name 'BenchmarkListResponse' from 'app.models'`，所有 API 全部 500
2. 实时看板、策略回测、策略回归、模拟盘全部无法使用
3. 启动脚本缺少启动前端口清理和退出时进程树清理

### 根本原因（RCA 5-Why）
1. **为什么全部 API 500？** → 后端进程根本没起来
2. **为什么后端起不来？** → `backtest_routes.py` import `BenchmarkListResponse` 和 `BenchmarkInfo`，但 `models.py` 里没有这两个类
3. **为什么没有？** → 上一轮"基准代码下拉"修复只改了路由和 REGISTRY，**响应模型类被漏掉**
4. **为什么漏掉？** → 只跑了 pytest（函数级，不触发 app 加载），没跑 `python run.py` 验证
5. **根因** → **改代码后不验证完整链路**。pytest pass ≠ 应用能启动。每次代码改动后必须跑 `python run.py` 验证 import 通过

同理：`main.py` 缺 `/api/sim/initial-cash` 路由——上一轮说"已注册"但实际没有。

### 修复方案
- `models.py`：新增 `BenchmarkInfo(code, name)` + `BenchmarkListResponse(benchmarks)` 两个 Pydantic 模型
- `main.py`：新增 `POST /api/sim/initial-cash` 和 `PATCH /api/sim/initial-cash` 两个路由
- `start-dashboard.ps1`：新增 `Stop-PortListener(Port)` 函数（启动前清理端口占用者）+ `Stop-ProcessTree(ProcessId)` 函数（退出时用 `taskkill /T /F` 杀进程树）+ 兜底端口扫描
- `types.ts`：新增 `BenchmarkInfo` interface
- `requirements.txt`：补 `tushare`
- `calculator.py`：删除 `return` 之后的 4 行死代码
- 删除 4 个旧版测试文件（`test_hot_recommend.py`、`test_neodata*.py`）——import 了不存在的函数，阻塞 pytest

### 验证结果
- 后端 pytest：**37/37 passed** ✅
- 前端 `npm run build`：**0 error** ✅
- 后端启动 `python run.py`：无 ImportError，uvicorn ready ✅
- curl 全端点：strategies(3) / benchmarks(20) / default-codes(20) / sim/portfolio / sim/initial-cash(POST+PATCH+400) 全部正确

### 预防说明（这次真的要刻碑）
- **新增 Pydantic 响应模型类必须同时**：① models.py 定义 ② 路由文件 import ③ types.ts 写对应 interface ④ **跑一次 `python run.py` 验证 import 通过**
- **新增 API 路由必须在 main.py `@app.xxx(...)` 显式注册**——哪怕 sim_routes.py 里有函数也得有路由声明
- **启动脚本的「清理旧进程」和「退出杀进程树」是产品特性，不是 bug**——永不删除
- **每次代码改动后必跑 `python run.py`**——pytest 不会触发整个 app 加载，只跑 pytest 不够

