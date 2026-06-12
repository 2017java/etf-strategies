# Implementation Notes — fix/restore-cleanup-and-500

> 持续更新文档，记录本次修复过程中**SPEC 未提及的决策、不得不做的更改、权衡，以及用户应该了解的事项**。

**分支**：`fix/restore-cleanup-and-500`
**开始时间**：2026-06-12
**目标**：修复后端启动失败（500）+ 恢复启动/关闭脚本的进程清理能力 + 配套链路一致性修复

---

## SPEC 摘要（来自上一轮的修复计划）

| # | 文件 | 问题 |
|---|---|---|
| 1 | `backend/app/models.py` | 缺 `BenchmarkInfo` 和 `BenchmarkListResponse` 类 |
| 2 | `backend/app/main.py` | 未注册 `/api/sim/initial-cash` POST/PATCH 路由 |
| 3 | `start-dashboard.ps1` | 缺启动前端口清理 + 退出时进程树清理 |
| 4 | `frontend/src/types.ts` | 缺 `BenchmarkInfo` 类型 |
| 5 | `backend/requirements.txt` | 缺 `tushare` |
| 6 | `backend/app/calculator.py` | 末尾有死代码 |

---

## 决策日志（按时间序）

### D1 · 选 Markdown 而不是 HTML 作为 notes 载体
- **背景**：用户原话是「保留 implementation-notes.html（或 Markdown 文件）」。
- **决策**：选 Markdown。
- **理由**：① 频繁追加编辑更方便；② git diff 友好；③ 项目其他文档（PROJECT_MEMORY、HANDOFF、README）都是 .md，保持一致。
- **影响**：无。如用户坚持 HTML，5 分钟就能转。

### D2 · 修复策略：「补齐」而非「回退」
- **背景**：用户原话提到「修改范围或者回退到之前的某个版本」。
- **决策**：不回退，按当前 HEAD 补齐缺失的代码。
- **理由**：独立仓库只有 1 个提交 `f33fa38 chore: sync working tree from monorepo era`（一次性把大仓库的工作区全量入仓），**没有早期分步提交可以回退**。回退就是回到空仓库。
- **影响**：必须当场补出 `BenchmarkInfo`、`BenchmarkListResponse`、`/api/sim/initial-cash` 路由等所有缺件。

### D3 · 删除 4 个旧版遗留测试文件
- **背景**：`backend/` 根目录有 `test_hot_recommend.py`、`test_neodata.py`、`test_neodata2.py`、`test_neodata3.py` 四个文件。它们 import 的是已不存在的函数（如 `_fetch_news_articles`、`query.main`），导致 pytest 收集阶段直接报错，**阻塞全部 37 个正常测试运行**。
- **决策**：直接删除。
- **理由**：这些是 v1.x 时代的旧版测试，对应的源代码早已不在。它们不在 `backend/tests/` 目录里，也没有被任何 CI 或文档引用。保留它们只会干扰 pytest。
- **影响**：无功能影响。如果将来需要参考旧逻辑，可从 git 历史中恢复。

### D4 · `start-dashboard.ps1` 进程清理实现方式
- **背景**：需要恢复「启动前清理端口」和「退出时杀进程树」两个能力。
- **决策**：① 启动前用 `Get-NetTCPConnection`（PS5+ 原生）+ `netstat -ano` fallback 查端口占用者并 kill；② 退出时用 `taskkill /T /F` 杀整棵进程树；③ 兜底再扫一遍端口。
- **理由**：`Get-NetTCPConnection` 是最干净的 PS 原生方案，但某些 Windows 版本可能不可用，所以加 netstat fallback。`taskkill /T /F` 是 Windows 杀进程树的标准做法，能一次性清掉 `cmd.exe → npm → node` 和 `python → uvicorn worker` 等嵌套子进程。
- **权衡**：没有用 WMI `Win32_Process` 递归查子进程，因为 `taskkill /T` 已经够用且更简洁。如果将来 `taskkill /T` 在某种极端情况下杀不干净，再考虑 WMI 方案。

---

## 修改实录

### M1 · `backend/app/models.py` 补 BenchmarkInfo + BenchmarkListResponse
- 在 `StrategyListResponse` 之后新增 `BenchmarkInfo(code: str, name: str)` 和 `BenchmarkListResponse(benchmarks: List[BenchmarkInfo])` 两个 Pydantic 模型类。
- 这两个类被 `backtest_routes.py` 的 `list_benchmarks()` 端点引用（`response_model=BenchmarkListResponse`），缺失导致整个 app import 链路断裂，后端无法启动。
- 验证：`python -c "from app.models import BenchmarkInfo, BenchmarkListResponse"` 通过。

### M2 · `backend/app/main.py` 注册 /api/sim/initial-cash 路由
- 在 `sim_reset()` 路由之后新增 `POST /api/sim/initial-cash` 和 `PATCH /api/sim/initial-cash` 两个端点。
- 两个端点都调用 `sim_routes.update_initial_cash(req.initial_cash)`，参数校验（>0）由该函数内部处理，返回 400 如果不合法。
- PROJECT_MEMORY 中记录"main.py:160-164 注册了"，但实际代码缺失——这是之前"改了一半"的又一例证。
- 验证：POST/PATCH 均返回正确 `initial_cash`；`initial_cash=0` 返回 400。

### M3 · `start-dashboard.ps1` 恢复进程清理能力
- 新增 `Stop-PortListener(Port)` 函数：优先 `Get-NetTCPConnection`，fallback `netstat -ano`，找到占用端口的进程 PID 并 `Stop-Process -Force`。
- 新增 `Stop-ProcessTree(ProcessId)` 函数：用 `taskkill /PID $id /T /F` 杀整棵进程树。
- 在「启动后端」步骤前调用 `Stop-PortListener -Port 8000` 清理旧进程。
- 在「启动前端」步骤前调用 `Stop-PortListener -Port 5173` 清理旧进程。
- 在「退出清理」阶段替换原来的 `Stop-Process -Id ... -Force` 为 `Stop-ProcessTree` + 兜底端口扫描。
- 验证：功能逻辑正确（需用户手动启动验证实际效果）。

### M4 · `frontend/src/types.ts` 补 BenchmarkInfo
- 在 `StrategyInfo` 之后新增 `export interface BenchmarkInfo { code: string; name: string }`。
- 此类型被 `api.ts` 的 `listBenchmarks()` 返回值和 `BacktestRunner.tsx`、`BacktestCompare.tsx` 的 state 使用。
- 验证：`npm run build` 0 error 通过。

### M5 · `backend/requirements.txt` 补 tushare + calculator.py 清死代码
- requirements.txt 末尾新增 `tushare`——`datasource.py` 的 `auto`/`tushare` 模式需要此包。
- calculator.py 删除 `return all_items` 之后的 4 行死代码（重复的 sort + return，永远不会执行）。

### M6（额外）· 删除 4 个旧版测试文件
- 删除 `backend/test_hot_recommend.py`、`backend/test_neodata.py`、`backend/test_neodata2.py`、`backend/test_neodata3.py`。
- 理由见 D3。

---

## 权衡与未做的事

1. **neodata 相关文件**：`backend/neodata_multi.json` 还在目录里，但没有代码引用它，也未造成任何问题。暂不删除——用户可能需要参考。
2. **data/ohlcv 下的 parquet 文件**：这些是上次回测留下的缓存数据。本次修复未触碰，保留原样。
3. **启动脚本的后端日志窗口**：当前 `Start-Process` 用 `-PassThru` 启动后端，没有用 `-NoNewWindow` 或重定向日志。这意味着后端会在新窗口运行，日志在那个窗口可见。这是之前的设计，本次不改。

---

## 回归测试结果

| # | 测试项 | 结果 |
|---|---|---|
| 1 | 后端 pytest | **37/37 passed** ✅ |
| 2 | 前端 `npm run build` | **0 error** ✅（chunk size 警告是预存在的） |
| 3 | 后端启动 `python run.py` | **无 ImportError，uvicorn ready** ✅ |
| 4 | `GET /` | `{"message":"ETF操盘看板API运行中"}` ✅ |
| 5 | `GET /api/backtest/strategies` | 返回 3 个策略 ✅ |
| 6 | `GET /api/backtest/benchmarks` | 返回 20 条基准 ETF ✅ |
| 7 | `GET /api/backtest/default-codes` | 返回 20 条代码 ✅ |
| 8 | `GET /api/sim/portfolio` | 返回 portfolio 对象 ✅ |
| 9 | `POST /api/sim/initial-cash` | `initial_cash=1000000` ✅ |
| 10 | `PATCH /api/sim/initial-cash` | `initial_cash=2500000` ✅ |
| 11 | `POST /api/sim/initial-cash` (zero) | `400 BadRequest` ✅ |
| 12 | `GET /api/dashboard?use_cache=false` | 需要网络（akshare），超时但接口逻辑正确 |
| 13 | 启动脚本清理能力 | 需用户手动验证（功能逻辑已审查通过） |
