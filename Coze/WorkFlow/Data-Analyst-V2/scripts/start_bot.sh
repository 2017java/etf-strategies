#!/bin/bash

# 飞书机器人启动脚本

echo "=========================================================================="
echo "🤖 飞书机器人服务启动脚本"
echo "=========================================================================="

# 设置项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BOT_DIR="$PROJECT_ROOT/src/bot"

echo ""
echo "项目根目录: $PROJECT_ROOT"
echo "机器人目录: $BOT_DIR"
echo ""

# 检查 Python 环境
echo "【步骤1】检查 Python 环境..."
if ! command -v python3 &> /dev/null; then
    echo "❌ 未找到 Python3，请先安装 Python"
    exit 1
fi

PYTHON_VERSION=$(python3 --version)
echo "✅ Python 版本: $PYTHON_VERSION"
echo ""

# 检查依赖
echo "【步骤2】检查依赖包..."
pip3 list | grep -E "flask|requests|coze" > /dev/null
if [ $? -ne 0 ]; then
    echo "⚠️  依赖包未完全安装，正在安装..."
    pip3 install flask requests
fi
echo "✅ 依赖包检查完成"
echo ""

# 切换到机器人目录
cd "$BOT_DIR"

# 设置环境变量
export PYTHONPATH="$PROJECT_ROOT:$PROJECT_ROOT/src"
export FLASK_APP=feishu_bot_server.py
export FLASK_ENV=development

echo "【步骤3】启动服务..."
echo "=========================================================================="
echo ""
echo "服务信息:"
echo "  - Webhook地址: http://0.0.0.0:5000/webhook"
echo "  - 健康检查: http://0.0.0.0:5000/health"
echo "  - 测试接口: http://0.0.0.0:5000/test"
echo ""
echo "使用方法:"
echo "  1. 将飞书机器人 Webhook 配置为: http://your-server-ip:5000/webhook"
echo "  2. 在飞书群中 @机器人 发送查询消息"
echo "  3. 测试接口: curl -X POST http://localhost:5000/test -H 'Content-Type: application/json' -d '{\"query\": \"铂智3X的目标线索数据\"}'"
echo ""
echo "=========================================================================="
echo ""

# 启动 Flask 服务
python3 feishu_bot_server.py
