# Pre-commit Hook 使用说明

## 这是什么

防止把密钥/token/private key 等敏感信息**误提交**到 git 的本地拦截工具。每次 `git commit` 时自动扫描改动，发现疑似敏感信息会**阻止提交**。

## 已配置的检查项

- ✅ **detect-secrets**：扫描 API key / token / 私钥 / AWS credentials / JWT 等 30+ 种敏感信息模式
- ✅ **trailing-whitespace**：自动去除行末空格
- ✅ **end-of-file-fixer**：自动补齐文件末尾换行
- ✅ **check-yaml / check-json**：语法检查
- ✅ **check-merge-conflict**：阻止 `<<<<<<< HEAD` 冲突标记
- ✅ **check-added-large-files**：阻止 >500KB 文件
- ✅ **detect-private-key**：扫描 SSH/GPG 私钥
- ✅ **ruff**（Python）：代码格式 + linter

## 首次安装（每个 clone 仓库的人都要做一次）

```bash
pip install pre-commit detect-secrets
pre-commit install
```

## 日常使用

正常 `git commit` 即可。如果检测到敏感信息：

```
detect-secrets..............................................Failed
- hook id: detect-secrets
- exit code: 1

ERROR: Potential secrets about to be committed to git repo!

Secret Type: Hex High Entropy String
Location:    backend/app/datasource.py:11
```

## 如果是误报怎么办

### 选项 1：审核后加入基线（无害字符串）
```bash
detect-secrets scan --baseline .secrets.baseline
git add .secrets.baseline
git commit
```

### 选项 2：临时跳过（不推荐，会绕过所有 hook）
```bash
git commit --no-verify -m "..."
```

## 给所有项目都装一遍（推荐）

把本仓库的 `.pre-commit-config.yaml` + `.secrets.baseline` + `.github/workflows/secret-scan.yml` 复制到其他项目根目录，再跑一次 `pre-commit install`。

## CI 兜底

`.github/workflows/secret-scan.yml` 在每次 push / PR 时也会扫一遍，**即使本地用 --no-verify 绕过也会被 GitHub Actions 拦截**。
