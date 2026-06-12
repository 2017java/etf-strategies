# ETF操盘看板 独立 Git 仓库迁移计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `D:\AICoding\ClaudeProjects\量化交易策略\ETF交易策略v2.0.0\ETF操盘看板_beta1.3` 从上层 monorepo `D:\AICoding\.git` 拆出来，让项目自己拥有独立 git 仓库；同时保留上层仓库里所有相关的提交历史。

**Architecture:** 用 `git subtree split` 从上层仓库把项目子树"剪"成一个新的分支（路径自动去掉前缀），然后在项目目录里 `git init` 新仓库，从 split 分支拉取历史，最后用一个 commit 把 working tree 里 6 处修改 + 30+ 个未跟踪文件补上。`subtree split` 不会改写上层仓库的 main 历史，所以对其他分支零影响。

**Tech Stack:** Git 2.x on Windows (PowerShell)、Python venv（仅用于本地构建验证，可选）。

---

## 现状快照（写计划时核对过的事实）

| 事实 | 值 |
|---|---|
| 上层仓库根 | `D:\AICoding` |
| 上层仓库大小 | 34.5 GB（巨型 monorepo） |
| 上层 main 触及本项目的 commit 数 | 14（外加 2 个 merge commit，共 16 个） |
| 上层 main 已 tracked 的项目文件 | 25 个（早期 init 的存量） |
| 项目 working tree 状态（上层仓库视角） | 6 个 modified + 30+ 个 untracked |
| 项目目录下那个空 `.git` | 0 个条目，确认可安全删除 |
| 上层其他分支是否也触及项目路径 | 经 `--all` grep 验证：**仅 main 触及**，`fix/llm-logging-and-env`、`codex/*` 等分支未触及本项目 |

## 涉及迁移的 16 个 commit（按时间从早到晚）

```
76e48de  2026-06-10  chore: add pyarrow for parquet cache
ef1602a  2026-06-10  feat(strategies): add Strategy Protocol and RebalanceSignal
2590cd8  2026-06-10  chore: add .gitignore and data directory placeholders
2112131  2026-06-10  feat(data_store): parquet cache + trading calendar
e736f5a  2026-06-10  fix(data_store): default to __file__-based path
84b3581  2026-06-10  feat(data_store): ensure() with akshare integration
ad070de  2026-06-10  feat(backtest): metrics calculator
d1b3a7a  2026-06-10  fix(backtest): restore CAGR formula + historical MDD; ME resample
6344072  2026-06-10  feat(backtest): engine with cost deduction
d8562d6  2026-06-10  feat(strategies): L1 trend score TOP1
1502026  2026-06-11  fix: 修复LLM日志输出和.env加载问题
4e690cf  2026-06-11  fix: uvicorn log_config使用空dict避免覆盖自定义日志
ebbcff7  2026-06-11  fix: 修复 GBK 编码错误(emoji)和 CSP 阻止 eval 问题
e572699  2026-06-11  fix: 移除开发模式CSP header，修复React Fast Refresh崩溃
+ 2 个 merge commit (f695b28, aff0719)
```

---

## Task 1: 备份现状（防止意外可回滚）

**Files:**
- Create: `D:\AICoding\ClaudeProjects\量化交易策略\ETF操盘看板_beta1.3\backup_migration_2026-06-11\README.md`（带恢复指引的占位文件）

- [ ] **Step 1: 在项目根目录建备份子目录**

```powershell
cd "D:\AICoding\ClaudeProjects\量化交易策略\ETF交易策略v2.0.0\ETF操盘看板_beta1.3"
New-Item -ItemType Directory -Force -Path "backup_migration_2026-06-11" | Out-Null
```

- [ ] **Step 2: 写一个 README 说明备份了什么、怎么回滚**

写入 `backup_migration_2026-06-11\README.md`：

```markdown
# 迁移备份说明

本目录是 2026-06-11 把本项目从 `D:\AICoding\.git`（monorepo）拆成独立仓库
之前的占位目录。

## 真正的"备份"在哪里

- 上层仓库 `D:\AICoding\.git` 没有任何 commit 被改写
  （`git subtree split` 只读不写）；
- `D:\AICoding\.git\refs\heads\etf-history` 是新生成的 split 分支
  （路径已剥前缀），是迁移历史的"快照"；
- 如果迁移后想回到迁移前状态：
  ```bash
  cd D:\AICoding
  # 删掉 split 出来的临时分支（不影响 main）
  git branch -D etf-history
  ```
  然后恢复 `D:\AICoding\ClaudeProjects\量化交易策略\ETF交易策略v2.0.0\ETF操盘看板_beta1.3\.git` 为空目录（迁移前状态）。

## 迁移产生的副作用

- 上层仓库 `D:\AICoding\.git` 的 `.gitignore` 增加了项目目录的排除规则；
- 上层 main 多了一个 commit：`chore: untrack ETF操盘看板_beta1.3`。
```

**为什么这样备份**：`subtree split` 是只读操作，不改写上层仓库历史，所以不需要打 34GB 的 tag 或 clone 备份；本目录主要是写一个"出事时怎么回滚"的人话指引。

---

## Task 2: 在上层仓库创建 split 出来的临时分支

**Files:**
- Modify: `D:\AICoding\.git\refs\heads\etf-history`（git 自动生成，无需手写）

- [ ] **Step 1: 在上层仓库里跑 subtree split**

```powershell
cd D:\AICoding
git subtree split --prefix="ClaudeProjects/量化交易策略/ETF交易策略v2.0.0/ETF操盘看板_beta1.3" -b etf-history
```

- [ ] **Step 2: 验证 split 出来 14 个 commit**

```powershell
cd D:\AICoding
git log --oneline etf-history
```

预期：14 行 commit 输出（merge commit 会被 split 跳过，符合 git subtree 的标准行为）。

- [ ] **Step 3: 验证路径已被剥前缀**

```powershell
cd D:\AICoding
git ls-tree etf-history | Select-Object -First 5
```

预期：直接看到 `backend/`, `frontend/`, `start-dashboard.ps1` 等，不再有 `ClaudeProjects/...` 前缀。

- [ ] **Step 4: 不在 Task 里 commit（这一步本就不产生新 commit）**

---

## Task 3: 删除项目下空 .git 文件夹并 init 新仓库

**Files:**
- Delete: `D:\AICoding\...\ETF操盘看板_beta1.3\.git\`（空文件夹）
- Create: `D:\AICoding\...\ETF操盘看板_beta1.3\.git\`（新 init）

- [ ] **Step 1: 双重确认项目下 .git 是空的**

```powershell
$cnt = (Get-ChildItem -LiteralPath 'D:\AICoding\ClaudeProjects\量化交易策略\ETF交易策略v2.0.0\ETF操盘看板_beta1.3\.git' -Force -ErrorAction SilentlyContinue | Measure-Object).Count
Write-Host ".git 条目数: $cnt (应为 0)"
if ($cnt -ne 0) { throw "项目下 .git 不是空的，停止迁移！检查是否有未发现的产物。" }
```

- [ ] **Step 2: 删除空 .git 文件夹**

```powershell
Remove-Item -LiteralPath 'D:\AICoding\ClaudeProjects\量化交易策略\ETF交易策略v2.0.0\ETF操盘看板_beta1.3\.git' -Recurse -Force
Test-Path -LiteralPath 'D:\AICoding\ClaudeProjects\量化交易策略\ETF交易策略v2.0.0\ETF操盘看板_beta1.3\.git'
```

预期：返回 `False`。

- [ ] **Step 3: git init 新仓库**

```powershell
cd 'D:\AICoding\ClaudeProjects\量化交易策略\ETF交易策略v2.0.0\ETF操盘看板_beta1.3'
git init
git config user.name "2017java"
git config user.email "2017java@local"
git checkout -b main
```

- [ ] **Step 4: 加一个本地 remote 指向 split 分支**

```powershell
cd 'D:\AICoding\ClaudeProjects\量化交易策略\ETF交易策略v2.0.0\ETF操盘看板_beta1.3'
git remote add etf-upstream "D:\AICoding\.git"
git fetch etf-upstream etf-history
```

预期：fetch 成功，14 个 commit 进入 objects。

---

## Task 4: 拉取 14 个迁移 commit 到 main

**Files:**（git 自动管理）

- [ ] **Step 1: hard reset 到 etf-history 状态**

```powershell
cd 'D:\AICoding\ClaudeProjects\量化交易策略\ETF交易策略v2.0.0\ETF操盘看板_beta1.3'
git reset --hard etf-upstream/etf-history
```

预期：HEAD 现在指向 14 个 commit 中的最后一个，工作区文件状态等于上层 main 上 "main 触及本项目的最后一个 commit 结束时的状态"。

- [ ] **Step 2: 验证新仓库的 git log 看到 14 个迁移 commit**

```powershell
cd 'D:\AICoding\ClaudeProjects\量化交易策略\ETF交易策略v2.0.0\ETF操盘看板_beta1.3'
git log --oneline
```

预期：14 行 commit，最早的（root）是 `chore: add pyarrow for parquet cache`，最新的是 `fix: 移除开发模式CSP header，修复React Fast Refresh崩溃`。

- [ ] **Step 3: 验证文件状态干净（与上层 main HEAD 状态一致）**

```powershell
cd 'D:\AICoding\ClaudeProjects\量化交易策略\ETF交易策略v2.0.0\ETF操盘看板_beta1.3'
git status --short
```

预期：除了后面 Task 5 要加的 working tree 增量，不应有 "modified" 项（但可能有 untracked，那是我即将要 commit 的内容）。

---

## Task 5: 把 working tree 的增量作为新 commit

**Files:**（git 自动管理所有变更）

- [ ] **Step 1: 确认 working tree 当前有"上层仓库看得到但新仓库看不到"的差异**

```powershell
cd 'D:\AICoding\ClaudeProjects\量化交易策略\ETF交易策略v2.0.0\ETF操盘看板_beta1.3'
# 对比新仓库 HEAD 和上层仓库对应 snapshot
git status --short
```

预期：看到一长串 `??` 开头的新文件（calculator.py, data_fetcher.py, tushare_store.py, l2/l3 strategies, tests, frontend/package.json 等），以及少量 `M` 开头（这 6 个文件在工作区被改过）。

- [ ] **Step 2: git add -A 全部纳入**

```powershell
cd 'D:\AICoding\ClaudeProjects\量化交易策略\ETF交易策略v2.0.0\ETF操盘看板_beta1.3'
git add -A
git status --short
```

预期：状态从 `??` 和 ` M` 变成 `A ` 和 `M `（绿色/索引区）。

- [ ] **Step 3: commit 这次同步**

```powershell
cd 'D:\AICoding\ClaudeProjects\量化交易策略\ETF交易策略v2.0.0\ETF操盘看板_beta1.3'
git commit -m "chore: sync working tree (uncommitted changes from monorepo era)

把从 D:\AICoding\.git 拆出来时工作区里所有未提交的修改和未跟踪文件
一次性入仓。
- 6 个 modified 文件
- 30+ 个 untracked 文件（calculator, data_fetcher, tushare_store,
  l2/l3 multi-factor strategies, tests, frontend config 等）
"
```

- [ ] **Step 4: 验证 git log 完整**

```powershell
cd 'D:\AICoding\ClaudeProjects\量化交易策略\ETF交易策略v2.0.0\ETF操盘看板_beta1.3'
git log --oneline
```

预期：15 行 commit（14 个迁移 + 1 个 sync）。

---

## Task 6: 让上层仓库脱钩（加 .gitignore 排除 + git rm --cached）

**Files:**
- Modify: `D:\AICoding\.gitignore`（追加 1 行）

- [ ] **Step 1: 先备份上层仓库的 .gitignore**

```powershell
Copy-Item -LiteralPath 'D:\AICoding\.gitignore' -Destination 'D:\AICoding\.gitignore.bak.2026-06-11' -Force
Get-Content 'D:\AICoding\.gitignore' | Measure-Object -Line | Select-Object -ExpandProperty Lines
```

预期：返回当前行数（用于后面 diff 验证）。

- [ ] **Step 2: 在 .gitignore 末尾追加项目目录排除规则**

```powershell
Add-Content -LiteralPath 'D:\AICoding\.gitignore' -Value @'

# 2026-06-11: 本项目拆成独立 git 仓库
ClaudeProjects/量化交易策略/ETF交易策略v2.0.0/ETF操盘看板_beta1.3/
'@
```

- [ ] **Step 3: 把上层仓库已经跟踪的项目文件全部 untrack（不删文件）**

```powershell
cd D:\AICoding
git rm -r --cached "ClaudeProjects/量化交易策略/ETF交易策略v2.0.0/ETF操盘看板_beta1.3" --quiet
```

预期：25 个文件从索引中移除（工作区文件本身不动）。

- [ ] **Step 4: commit 上层仓库的脱钩变更**

```powershell
cd D:\AICoding
git add .gitignore
git status --short | Select-String "ClaudeProjects/量化交易策略/ETF交易策略v2.0.0/ETF操盘看板_beta1.3" | Measure-Object -Line | Select-Object -ExpandProperty Lines
```

预期：返回 0（表示 25 个文件都从索引中 untrack 了）。

```powershell
cd D:\AICoding
git commit -m "chore: untrack ETF操盘看板_beta1.3 (项目拆成独立仓库)

- .gitignore 增加项目目录排除
- 25 个已跟踪文件从索引中移除（工作区文件保留）
- 完整历史已通过 git subtree split 迁移到项目本地 .git
"
```

- [ ] **Step 5: 验证上层仓库 status 干净**

```powershell
cd D:\AICoding
git status
```

预期：显示 `nothing to commit, working tree clean`（或仅有你本来的其他项目修改）。

---

## Task 7: 全面验证

**Files:**（无修改，纯验证）

- [ ] **Step 1: 验证新仓库独立工作**

```powershell
cd 'D:\AICoding\ClaudeProjects\量化交易策略\ETF交易策略v2.0.0\ETF操盘看板_beta1.3'
git rev-parse --show-toplevel
git log --oneline | Measure-Object -Line | Select-Object -ExpandProperty Lines
```

预期：
- toplevel 输出 `D:/AICoding/.../ETF操盘看板_beta1.3`（**不再**是 `D:/AICoding`）
- commit 行数 = 15

- [ ] **Step 2: 验证上层仓库不再跟踪项目**

```powershell
cd D:\AICoding
git ls-files | Where-Object { $_ -like "*ETF操盘看板_beta1.3*" } | Measure-Object -Line | Select-Object -ExpandProperty Lines
```

预期：返回 0。

- [ ] **Step 3: 验证迁移 commit 包含所有 16 个原始 commit 的内容**

```powershell
$oldHashes = @('76e48de','ef1602a','2590cd8','2112131','e736f5a','84b3581','ad070de','d1b3a7a','6344072','d8562d6','1502026','4e690cf','ebbcff7','e572699')
$oldHashes | ForEach-Object { Write-Host "  $_ -> $((git show $_ --pretty=format:'%s' --no-patch) -join ' ')" }
cd 'D:\AICoding\ClaudeProjects\量化交易策略\ETF交易策略v2.0.0\ETF操盘看板_beta1.3'
Write-Host "---新仓库 commit 主题---"
git log --pretty=format:"%s" | ForEach-Object { Write-Host "  $_" }
```

预期：新仓库能看到这 14 个原始 commit 的主题（hash 会变，但主题一致）。

- [ ] **Step 4: 验证上层仓库 main 仍可正常运行 git 命令**

```powershell
cd D:\AICoding
git log --oneline -n 5
git branch
```

预期：
- log 看到 5 个 commit，最新的是 `chore: untrack ETF操盘看板_beta1.3`
- branch 列表有 main、etf-history、其他原始分支都在

- [ ] **Step 5: 验证项目目录可独立 git push（如果将来需要）**

```powershell
cd 'D:\AICoding\ClaudeProjects\量化交易策略\ETF交易策略v2.0.0\ETF操盘看板_beta1.3'
# 暂时不真推任何远端，只验证 remote 配置和身份
git remote -v
git config user.name
git config user.email
```

预期：看到 etf-upstream 指向 D:\AICoding\.git，user.name = "2017java"。

---

## 关键风险与应对

| 风险 | 应对 |
|---|---|
| `subtree split` 在 34GB 仓库上慢 | 接受几分钟等待；如果超过 10 分钟无响应，按 Ctrl+C 后改用 `git filter-branch --subdirectory-filter`（更慢但更稳定） |
| 上层仓库其他分支意外触及项目 | 已在调研阶段用 `git log --all` grep 验证只有 main 触及；如果 split 出来的 commit 数 ≠ 14，立即停止排查 |
| `git rm -r --cached` 误删工作区文件 | 这个命令**只**影响索引，不影响工作区。删除前会先 Step 3 列出 25 个文件清单供检查 |
| 新仓库的 15 个 commit 中第 15 个"sync"过于臃肿 | 接受臃肿，因为 working tree 里的修改交错在一起没法干净拆分；将来如果需要可以 `git reset HEAD~1` 重新组织 |
| 上层 main commit history 被改写 | **不会**。`subtree split` 只读；`git rm --cached` + commit 是新加一个 commit，不动旧 commit |

---

## 完成后清理（可选）

迁移成功后且确认 1 周内无问题，可执行：

```powershell
cd D:\AICoding
# 删除 subtree split 出来的临时分支（24 小时内必须先确认新仓库独立工作正常）
git branch -D etf-history
# 删除 .gitignore 的 .bak 备份
Remove-Item -LiteralPath 'D:\AICoding\.gitignore.bak.2026-06-11' -Force
# 删除项目内的 backup_migration_2026-06-11 指引目录
Remove-Item -LiteralPath 'D:\AICoding\ClaudeProjects\量化交易策略\ETF交易策略v2.0.0\ETF操盘看板_beta1.3\backup_migration_2026-06-11' -Recurse -Force
```

**为什么建议 1 周后再清理**：给用户时间验证"新仓库可以独立完成所有工作"（push、pull、clone、协作）后再拆掉逃生通道。
