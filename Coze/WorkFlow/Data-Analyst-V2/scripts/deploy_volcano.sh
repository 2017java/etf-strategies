#!/bin/bash

# 飞书机器人 - 火山引擎一键部署脚本
# 适用于火山引擎云服务器 ECS

set -e  # 遇到错误立即退出

echo "=========================================================================="
echo "🚀 飞书机器人 - 火山引擎一键部署脚本"
echo "=========================================================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置信息
PUBLIC_IP="118.145.228.33"
PROJECT_DIR="/opt/feishu-bot"
SERVICE_NAME="feishu-bot"

# 步骤1: 检查系统环境
echo -e "${YELLOW}【步骤1】检查系统环境${NC}"
echo "--------------------------------------------------------------------------"

# 检测操作系统
if [ -f /etc/redhat-release ]; then
    OS="centos"
    PKG_MANAGER="yum"
    echo "检测到系统: CentOS / RHEL"
elif [ -f /etc/lsb-release ]; then
    OS="ubuntu"
    PKG_MANAGER="apt"
    echo "检测到系统: Ubuntu / Debian"
else
    echo -e "${RED}不支持的操作系统${NC}"
    exit 1
fi

echo ""

# 步骤2: 安装系统依赖
echo -e "${YELLOW}【步骤2】安装系统依赖${NC}"
echo "--------------------------------------------------------------------------"

if [ "$OS" == "centos" ]; then
    echo "更新系统..."
    sudo yum update -y
    
    echo "安装 Python3 和 pip..."
    sudo yum install -y python3 python3-pip gcc python3-devel
    
    echo "安装防火墙工具..."
    if ! command -v firewall-cmd &> /dev/null; then
        sudo yum install -y firewalld
        sudo systemctl start firewalld
        sudo systemctl enable firewalld
    fi
else
    echo "更新系统..."
    sudo apt update
    
    echo "安装 Python3 和 pip..."
    sudo apt install -y python3 python3-pip python3-dev build-essential
    
    echo "安装防火墙工具..."
    if ! command -v ufw &> /dev/null; then
        sudo apt install -y ufw
    fi
fi

echo ""

# 步骤3: 安装 Python 依赖
echo -e "${YELLOW}【步骤3】安装 Python 依赖${NC}"
echo "--------------------------------------------------------------------------"

echo "安装 Flask 和相关包..."
pip3 install --upgrade pip
pip3 install flask requests gunicorn

# 尝试安装 coze 相关包（如果可用）
pip3 install coze-coding-dev-sdk langchain langgraph 2>/dev/null || true

echo ""

# 步骤4: 配置防火墙
echo -e "${YELLOW}【步骤4】配置防火墙${NC}"
echo "--------------------------------------------------------------------------"

if [ "$OS" == "centos" ]; then
    echo "开放 5000 端口 (firewalld)..."
    sudo firewall-cmd --zone=public --add-port=5000/tcp --permanent
    sudo firewall-cmd --reload
else
    echo "开放 5000 端口 (ufw)..."
    sudo ufw allow 5000/tcp
    sudo ufw --force enable
fi

echo -e "${GREEN}✅ 防火墙配置完成${NC}"
echo ""

# 步骤5: 检查项目目录
echo -e "${YELLOW}【步骤5】检查项目目录${NC}"
echo "--------------------------------------------------------------------------"

# 获取当前脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "当前脚本目录: $SCRIPT_DIR"
echo "项目根目录: $PROJECT_ROOT"

# 如果项目不在 /opt 目录，创建链接
if [ "$PROJECT_ROOT" != "$PROJECT_DIR" ]; then
    echo ""
    echo "创建项目链接..."
    sudo mkdir -p /opt
    sudo ln -sf "$PROJECT_ROOT" "$PROJECT_DIR"
    echo "项目链接: $PROJECT_DIR -> $PROJECT_ROOT"
fi

echo ""

# 步骤6: 配置环境变量
echo -e "${YELLOW}【步骤6】配置环境变量${NC}"
echo "--------------------------------------------------------------------------"

# 添加环境变量到 ~/.bashrc
if ! grep -q "PYTHONPATH=/opt/feishu-bot" ~/.bashrc; then
    echo "配置环境变量..."
    echo "" >> ~/.bashrc
    echo "# 飞书机器人环境变量" >> ~/.bashrc
    echo "export PYTHONPATH=/opt/feishu-bot:/opt/feishu-bot/src" >> ~/.bashrc
    echo "export FLASK_APP=src/bot/feishu_bot_server.py" >> ~/.bashrc
    source ~/.bashrc
fi

echo -e "${GREEN}✅ 环境变量配置完成${NC}"
echo ""

# 步骤7: 创建 systemd 服务
echo -e "${YELLOW}【步骤7】创建 systemd 服务${NC}"
echo "--------------------------------------------------------------------------"

sudo tee /etc/systemd/system/feishu-bot.service > /dev/null <<EOF
[Unit]
Description=Feishu Bot Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/feishu-bot/src/bot
Environment="PYTHONPATH=/opt/feishu-bot:/opt/feishu-bot/src"
ExecStart=/usr/bin/python3 feishu_bot_server.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

echo -e "${GREEN}✅ systemd 服务创建完成${NC}"
echo ""

# 步骤8: 启动服务
echo -e "${YELLOW}【步骤8】启动服务${NC}"
echo "--------------------------------------------------------------------------"

echo "重新加载 systemd 配置..."
sudo systemctl daemon-reload

echo "启用开机自启..."
sudo systemctl enable feishu-bot

echo "启动服务..."
sudo systemctl start feishu-bot

sleep 3

# 检查服务状态
if sudo systemctl is-active --quiet feishu-bot; then
    echo -e "${GREEN}✅ 服务启动成功${NC}"
else
    echo -e "${RED}❌ 服务启动失败${NC}"
    echo "查看错误日志:"
    sudo journalctl -u feishu-bot -n 20
    exit 1
fi

echo ""

# 步骤9: 测试服务
echo -e "${YELLOW}【步骤9】测试服务${NC}"
echo "--------------------------------------------------------------------------"

sleep 2

echo "测试本地访问..."
if curl -s http://localhost:5000/health > /dev/null; then
    echo -e "${GREEN}✅ 本地访问正常${NC}"
else
    echo -e "${YELLOW}⚠️  本地访问失败，请检查服务状态${NC}"
fi

echo "测试外网访问..."
if curl -s --connect-timeout 5 http://$PUBLIC_IP:5000/health > /dev/null; then
    echo -e "${GREEN}✅ 外网访问正常${NC}"
else
    echo -e "${YELLOW}⚠️  外网访问失败，请检查防火墙配置${NC}"
fi

echo ""

# 步骤10: 显示配置信息
echo "=========================================================================="
echo -e "${GREEN}🎉 部署完成！${NC}"
echo "=========================================================================="
echo ""
echo "服务器信息:"
echo "  - 公网IP: $PUBLIC_IP"
echo "  - Webhook地址: http://$PUBLIC_IP:5000/webhook"
echo "  - 健康检查: http://$PUBLIC_IP:5000/health"
echo "  - 测试接口: http://$PUBLIC_IP:5000/test"
echo ""
echo "服务管理命令:"
echo "  - 查看状态: sudo systemctl status feishu-bot"
echo "  - 查看日志: sudo journalctl -u feishu-bot -f"
echo "  - 重启服务: sudo systemctl restart feishu-bot"
echo "  - 停止服务: sudo systemctl stop feishu-bot"
echo ""
echo "下一步操作:"
echo "  1. 在飞书开放平台配置 Webhook: http://$PUBLIC_IP:5000/webhook"
echo "  2. 订阅事件: im.message.receive_v1"
echo "  3. 在飞书群中 @机器人 测试"
echo ""
echo "测试命令:"
echo "  curl http://$PUBLIC_IP:5000/health"
echo ""
echo "=========================================================================="

# 显示服务日志
echo ""
echo "最近的服务日志:"
echo "--------------------------------------------------------------------------"
sudo journalctl -u feishu-bot -n 10 --no-pager
