@echo off
chcp 65001 >nul
echo ========================================
echo 飞书 + Coze 智能体机器人
echo ========================================
echo.

cd /d "%~dp0"

if not exist "config.json" (
    if not exist ".env" (
        echo [错误] 请先配置 config.json 或 .env 文件
        echo.
        echo 请复制 config.template.json 为 config.json 并填写配置
        pause
        exit /b 1
    )
)

echo [启动] 正在启动服务...
echo.

python src\main.py

pause
