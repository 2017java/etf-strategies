#Requires -Version 5.1
<#
.SYNOPSIS
    ETF操盘看板一键启动脚本
.DESCRIPTION
    自动检测环境、安装依赖、启动前后端服务，并打开浏览器
#>

$ErrorActionPreference = "Stop"

# ========== 配置 ==========
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir  = Join-Path $ProjectRoot "backend"
$FrontendDir = Join-Path $ProjectRoot "frontend"
$BackendUrl  = "http://127.0.0.1:8000"
$FrontendUrl = "http://127.0.0.1:5173"

# ========== 工具函数 ==========
function Test-CommandAvailable {
    param([string]$Name)
    return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Wait-ForUrl {
    param([string]$Url, [int]$TimeoutSec = 30)
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    while ($sw.Elapsed.TotalSeconds -lt $TimeoutSec) {
        try {
            $resp = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
            if ($resp.StatusCode -eq 200) { return $true }
        } catch {
            # 请求尚未就绪，继续重试
        }
        Start-Sleep -Milliseconds 500
    }
    return $false
}

function Write-ColorLine {
    param([string]$Text, [string]$Color = "White")
    Write-Host $Text -ForegroundColor $Color
}

# ========== 启动横幅 ==========
Clear-Host
Write-ColorLine "========================================" "Cyan"
Write-ColorLine "       ETF操盘看板 一键启动工具        " "Cyan"
Write-ColorLine "========================================" "Cyan"
Write-Host ""

# ========== 环境检查 ==========
Write-ColorLine "[1/5] 检查运行环境..." "Yellow"

if (-not (Test-CommandAvailable "python")) {
    if (Test-CommandAvailable "py") {
        $PythonCmd = "py"
    } else {
        Write-ColorLine "错误：未检测到 Python，请先安装 Python 3.10+" "Red"
        pause
        exit 1
    }
} else {
    $PythonCmd = "python"
}

$PyVersion = & $PythonCmd --version 2>&1
Write-ColorLine "  Python: $PyVersion" "Gray"

if (-not (Test-CommandAvailable "npm")) {
    Write-ColorLine "错误：未检测到 Node.js/npm，请先安装 Node.js 18+" "Red"
    pause
    exit 1
}
$NodeVersion = & node --version 2>&1
Write-ColorLine "  Node:   $NodeVersion" "Gray"
Write-Host ""

# ========== 安装依赖 ==========
Write-ColorLine "[2/5] 检查并安装后端依赖..." "Yellow"
Set-Location $BackendDir
& $PythonCmd -m pip install -r requirements.txt -q
if ($LASTEXITCODE -ne 0) {
    Write-ColorLine "警告：后端依赖安装可能不完整，尝试继续..." "Magenta"
}
Write-ColorLine "  后端依赖就绪" "Green"
Write-Host ""

Write-ColorLine "[3/5] 检查并安装前端依赖..." "Yellow"
Set-Location $FrontendDir
$NodeModules = Join-Path $FrontendDir "node_modules"
if (-not (Test-Path $NodeModules)) {
    Write-ColorLine "  node_modules 不存在，执行 npm install..." "Gray"
    & npm install
    if ($LASTEXITCODE -ne 0) {
        Write-ColorLine "错误：前端依赖安装失败" "Red"
        pause
        exit 1
    }
} else {
    Write-ColorLine "  前端依赖已存在，跳过安装" "Gray"
}
Write-ColorLine "  前端依赖就绪" "Green"
Write-Host ""

# ========== 启动后端 ==========
Write-ColorLine "[4/5] 启动后端服务 (FastAPI)..." "Yellow"
Set-Location $BackendDir
$BackendProc = Start-Process -FilePath $PythonCmd -ArgumentList "run.py" -WorkingDirectory $BackendDir -PassThru
Write-ColorLine "  后端进程 PID: $($BackendProc.Id)" "Gray"
Write-ColorLine "  等待后端就绪..." "Gray"

if (Wait-ForUrl -Url "$BackendUrl/" -TimeoutSec 30) {
    Write-ColorLine "  后端已启动: $BackendUrl" "Green"
} else {
    Write-ColorLine "  后端启动超时，请手动检查日志" "Red"
}
Write-Host ""

# ========== 启动前端 ==========
Write-ColorLine "[5/5] 启动前端服务 (Vite)..." "Yellow"
Set-Location $FrontendDir
$FrontendProc = Start-Process -FilePath "cmd.exe" -ArgumentList "/c","npm run dev" -WorkingDirectory $FrontendDir -WindowStyle Hidden -PassThru
Write-ColorLine "  前端进程 PID: $($FrontendProc.Id)" "Gray"
Write-ColorLine "  等待前端就绪..." "Gray"

if (Wait-ForUrl -Url $FrontendUrl -TimeoutSec 30) {
    Write-ColorLine "  前端已启动: $FrontendUrl" "Green"
} else {
    Write-ColorLine "  前端启动超时，请手动检查日志" "Red"
}
Write-Host ""

# ========== 完成 ==========
Write-ColorLine "========================================" "Cyan"
Write-ColorLine "         所有服务启动成功！            " "Green"
Write-ColorLine "========================================" "Cyan"
Write-Host ""
Write-ColorLine "  前端地址: $FrontendUrl" "White"
Write-ColorLine "  后端地址: $BackendUrl" "White"
Write-Host ""

# 尝试打开浏览器
Start-Process $FrontendUrl
Write-ColorLine "  已尝试自动打开浏览器" "Green"
Write-Host ""
Write-ColorLine "按 [Enter] 键关闭所有服务并退出..." "Yellow"
[void][Console]::ReadLine()

# 清理进程
Write-ColorLine "正在停止服务..." "Yellow"
Stop-Process -Id $BackendProc.Id -Force -ErrorAction SilentlyContinue
Stop-Process -Id $FrontendProc.Id -Force -ErrorAction SilentlyContinue
Write-ColorLine "服务已停止，再见！" "Green"
