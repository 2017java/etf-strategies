@echo off
chcp 65001 >nul
title ETF操盘看板 一键启动
color 0B

echo ========================================
echo        ETF操盘看板 一键启动工具
echo ========================================
echo.

REM 获取脚本所在目录
set "SCRIPT_DIR=%~dp0"
set "PS_SCRIPT=%SCRIPT_DIR%start-dashboard.ps1"

REM 检查 PowerShell 脚本是否存在
if not exist "%PS_SCRIPT%" (
    echo [错误] 找不到启动脚本: start-dashboard.ps1
    echo 请确保该批处理文件与 start-dashboard.ps1 在同一目录。
    pause
    exit /b 1
)

REM 检查 PowerShell 执行策略，临时绕过以运行脚本
echo [提示] 正在以管理员权限运行 PowerShell 脚本...
echo.

REM 尝试用当前用户上下文启动（无需UAC）
powershell -ExecutionPolicy Bypass -NoProfile -File "%PS_SCRIPT%"

if %ERRORLEVEL% neq 0 (
    echo.
    echo [错误] 启动失败，错误码: %ERRORLEVEL%
    pause
)

exit /b 0
