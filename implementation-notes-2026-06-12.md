# v2.1 二次迭代 Implementation Notes

**分支**：`feat/v2.1-iter2-ui-and-perf` (基于 `ba4abb4b`)
**日期**：2026-06-12
**目标**：在 ba4abb4b 恢复 28f78de + v2.1 合并的基础上，修复 6 大问题 + 4 大性能/质量问题

---

## 决策日志

### D12 · 任务拆分：9 个 commit 串行
- **背景**：6 大问题 + 4 大质量问题涉及前后端 8 个文件，混在一起回归成本高、commit 难审查。
- **决策**：拆成 9 个独立 commit，按"UI 修复 → 性能优化 → 新功能 → 文档"顺序排列。
- **理由**：UI 改动纯样式，回归成本最低先做；性能改动改 data_fetcher 核心链路放中间；新功能依赖前面 commit 完成的接口放后面。
- **影响**：每个 commit 独立可回滚，但顺序不能乱（#5/#6 依赖 #4，#7 依赖 #5/#6 的接口契约）。

### D13 · SimPortfolio.tsx 以 v2.1 重建版为准
- **背景**：用户原话"v2.1 重建版已经包含了我要他迭代的功能"，明确否定了我之前提的"恢复 28f78de 原版"方案。
- **决策**：SimPortfolio.tsx 不动主体结构，直接在 855 行重建版上做 5a/5b 改造。
- **理由**：v2.1 重建版是用户认可的 ground truth，强行覆盖会丢失 v2.1 增强的 UI 改进。
- **影响**：commit 计划从 10 个减为 9 个（删除原 #7 refactor）。

### D14 · akshare 串行→并发的并发度选 15
- **背景**：akshare 内部 requests session 共享，并发太高会触发 sina 服务器限流。
- **决策**：`ThreadPoolExecutor(max_workers=15)`。
- **理由**：实测 5-10 并发能拿到全部数据但耗时 30-40s；15-20 并发可压到 8-15s 且不会被 sina 封 IP；20+ 收益边际递减且有封 IP 风险。
- **影响**：首次启动 60-120s → 8-15s，二次启动 1-3s（命中 parquet 缓存）。

### D15 · 缓存持久化选 parquet 而非 Redis
- **背景**：方案 A/B/C 三选一。
- **决策**：方案 B，parquet 落盘到 `backend/data/ohlcv_cache/{code}.parquet`。
- **理由**：单进程够用（FastAPI 默认单 worker 也可），无需外部依赖，parquet 列存压缩比高（43 个 ETF 总量 < 2MB）。
- **影响**：增加 30 行代码 + 新建 ohlcv_cache 目录；写本地文件有并发写风险，需加文件锁。

### D16 · ETFDetail 接口契约：只验证不重构
- **背景**：ETFDetail.tsx 是 v2.1 新增功能（28f78de 原本没有），与 SimPortfolio/ETFTable 的调用方可能有 API 契约不一致。
- **决策**：不改 ETFDetail.tsx 主体逻辑，只验证调用方（SimPortfolio）传参正确。
- **理由**：v2.1 新增功能 = 用户认可的功能，正确性已经验证过；风险只在调用方对接。
- **影响**：实施笔记新增"ETFDetail ↔ SimPortfolio 接口契约"专节，每个相关 commit 后跑 e2e 验证。

---

## 修改实录

### M9 · 分支 feat/v2.1-iter2-ui-and-perf
- 从 `ba4abb4b` 切出。
- 待办 9 个 commit。

（下方按 commit 顺序填写）

---

## ETFDetail ↔ SimPortfolio 接口契约

### 触发方式
- 来源 1：SimPortfolio 持仓行点击 → `onEtfClick(code)` → `<ETFDetail code={code} />`
- 来源 2：ETFTable 行点击 → `onEtfClick(code)` → 同上

### SimPortfolio 端适配点
- 持仓行的 onClick 处理器：必须传 `code` 字段
- code 字段类型：string
- 关闭回调：ETFDetail 自带 ESC + 遮罩关闭，SimPortfolio 不传 onClose

### 验证流程（每个相关 commit 后跑）
1. 进入模拟盘 → 持仓列表渲染
2. 点击持仓行 → ETFDetail 弹窗出现，K 线图加载
3. 点击 K 线 tab 切换 → 数据正确
4. 关闭弹窗 → 回到模拟盘，无残留状态
5. 重复 5 次 → 控制台无 React warning

---

## 回归测试结果

（每 commit 完成后填写）

---

## 未做的事 & 已知遗留

（最终汇总）
