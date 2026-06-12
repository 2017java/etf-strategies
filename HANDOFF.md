# SESSION HANDOFF — ETF操盘看板 v2.0.0 — 2026-06-12

## 项目根目录
`d:\AICoding\ClaudeProjects\量化交易策略\ETF交易策略v2.0.0\ETF操盘看板_beta1.3`

## 当前项目状态
v2.0.0 开发完成 + 本次修复后端启动失败 + 恢复启动脚本清理能力。包括：
- 3层ETF轮动策略（L1趋势/L2多因子/L3多因子+RSRS择时）
- 回测引擎（成本建模、NAV跟踪、完整指标）
- Dashboard看板（量化排名、LLM热点推荐、模拟交易、回测对比）
- 数据源切换（akshare/tushare双源）
- 火山引擎LLM集成（热点推荐AI分析）
- **37个单元测试全部通过**（之前是31个，新增6个sim_routes测试）

## 本次修复内容（2026-06-12，分支 fix/restore-cleanup-and-500）
1. `models.py` 补 `BenchmarkInfo` + `BenchmarkListResponse` → 修复后端 ImportError
2. `main.py` 注册 `POST/PATCH /api/sim/initial-cash` → 修复前端编辑初始资金 404
3. `start-dashboard.ps1` 恢复启动前端口清理 + 退出时进程树清理
4. `types.ts` 补 `BenchmarkInfo` 接口
5. `requirements.txt` 补 `tushare`
6. `calculator.py` 清死代码
7. 删除4个旧版测试文件（阻塞pytest）

## 立即可用
- 双击 `start.bat` 启动（**自动清理旧进程** + 后端日志可见）
- 按 Enter 退出（**彻底清理所有子进程，含进程树**）
- 所有 API 端点均可正常访问

## 需要先验证
- **启动脚本清理**：启动一次 → 再启动一次 → 确认第二次自动清理旧进程
- **退出清理**：启动后按 Enter → 确认无残留 python/node 进程
- **火山引擎LLM**：如配额耗尽，"热点推荐"显示橙色"量化兜底"，恢复后自动变紫色"AI分析"

## 参考文档
- `PROJECT_MEMORY.md` — 完整项目记忆（Bug记录、决策历史）
- `implementation-notes.md` — 本次修复的决策日志和权衡记录
- `README.md` — 项目介绍和使用说明
- `docs/` — 设计文档和计划

## Git状态
- 独立仓库，主分支 `main`
- 修复分支 `fix/restore-cleanup-and-500`（待 merge）
- 提交时需用 `git -c core.fsmonitor=false` 避免沙箱权限问题
