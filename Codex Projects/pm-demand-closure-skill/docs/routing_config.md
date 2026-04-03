# 路由触发词配置说明

## onboarding-cro 触发词

默认配置文件：

- `data/routing/onboarding_keywords.txt`

每行一个关键词，支持中文和英文，`#` 开头行为注释。

## 覆盖默认配置（可选）

可以通过环境变量覆盖默认路径：

- `PM_DC_ONBOARDING_KEYWORDS_FILE`

PowerShell 示例：

```powershell
$env:PM_DC_ONBOARDING_KEYWORDS_FILE="D:\custom\keywords.txt"
python scripts/run_demo.py
```

取消覆盖：

```powershell
Remove-Item Env:PM_DC_ONBOARDING_KEYWORDS_FILE
```

