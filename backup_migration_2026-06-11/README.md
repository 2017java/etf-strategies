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
