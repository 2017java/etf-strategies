#!/bin/bash
# ==========================================================
# 飞书机器人 - Ubuntu/Debian 一键部署脚本
# 适用于 Python 3.12+ 的 externally-managed 环境
# ==========================================================

set -e

echo "=========================================================================="
echo "🚀 飞书机器人 - Ubuntu/Debian 一键部署脚本"
echo "=========================================================================="
echo ""

# 检测操作系统
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    echo "❌ 无法检测操作系统"
    exit 1
fi

echo "【步骤1】检查系统环境"
echo "--------------------------------------------------------------------------"
echo "检测到系统: $OS"
echo ""

echo "【步骤2】安装系统依赖"
echo "--------------------------------------------------------------------------"
apt-get update -y
apt-get install -y python3 python3-pip python3-venv curl
echo "✅ 系统依赖安装完成"
echo ""

echo "【步骤3】创建虚拟环境"
echo "--------------------------------------------------------------------------"
cd /opt/Data-Analyst

# 创建虚拟环境
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "✅ 虚拟环境创建成功"
else
    echo "✅ 虚拟环境已存在"
fi

# 激活虚拟环境
source venv/bin/activate
echo "✅ 虚拟环境已激活"
echo ""

echo "【步骤4】安装 Python 依赖"
echo "--------------------------------------------------------------------------"
pip install --upgrade pip

# 安装核心依赖
pip install flask requests jinja2 pydantic

# 安装 LangChain 和 LangGraph
pip install langchain langgraph langchain-core langchain-community

# 安装 Coze SDK
pip install coze-coding-dev-sdk

# 尝试安装 requirements.txt
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt 2>/dev/null || true
fi

echo "✅ Python 依赖安装完成"
echo ""

echo "【步骤5】配置防火墙"
echo "--------------------------------------------------------------------------"
if command -v ufw &> /dev/null; then
    ufw allow 5000/tcp
    ufw reload 2>/dev/null || true
    echo "✅ UFW 防火墙已开放 5000 端口"
elif command -v firewall-cmd &> /dev/null; then
    firewall-cmd --permanent --add-port=5000/tcp
    firewall-cmd --reload
    echo "✅ Firewalld 防火墙已开放 5000 端口"
else
    echo "⚠️ 未检测到防火墙，请手动确保 5000 端口可访问"
fi
echo ""

echo "【步骤6】配置环境变量"
echo "--------------------------------------------------------------------------"
# 创建环境变量文件
cat > /opt/Data-Analyst/.env << 'EOF'
# 飞书应用配置
FEISHU_APP_ID=your_app_id_here
FEISHU_APP_SECRET=your_app_secret_here

# 飞书多维表格配置
APP_TOKEN=ErFOw81Ami65S5kS7jfch2lynUc
TABLE_ID=tblrHwvuWOlIUYWp

# 服务器配置
SERVER_HOST=0.0.0.0
SERVER_PORT=5000
EOF

echo "✅ 环境变量配置文件已创建: /opt/Data-Analyst/.env"
echo ""
echo "⚠️ 请编辑 .env 文件，填入你的飞书 App ID 和 Secret："
echo "   nano /opt/Data-Analyst/.env"
echo ""

echo "【步骤7】创建 systemd 服务"
echo "--------------------------------------------------------------------------"
cat > /etc/systemd/system/feishu-bot.service << 'EOF'
[Unit]
Description=Feishu Bot Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/Data-Analyst/src/bot
Environment="PATH=/opt/Data-Analyst/venv/bin"
EnvironmentFile=/opt/Data-Analyst/.env
ExecStart=/opt/Data-Analyst/venv/bin/python feishu_bot_server.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

echo "✅ systemd 服务配置完成"
echo ""

echo "【步骤8】启动服务"
echo "--------------------------------------------------------------------------"
systemctl daemon-reload
systemctl enable feishu-bot
systemctl start feishu-bot

sleep 2

if systemctl is-active --quiet feishu-bot; then
    echo "✅ 服务启动成功"
else
    echo "❌ 服务启动失败，请检查日志："
    journalctl -u feishu-bot -n 20
    exit 1
fi
echo ""

echo "【步骤9】测试服务"
echo "--------------------------------------------------------------------------"
sleep 2
if curl -s http://localhost:5000/health > /dev/null 2>&1; then
    echo "✅ 服务健康检查通过"
else
    echo "⚠️ 服务健康检查失败，可能需要稍等片刻"
fi
echo ""

echo "=========================================================================="
echo "🎉 部署完成！"
echo "=========================================================================="
echo ""
echo "服务器信息:"
echo "  - 公网IP: $(curl -s ifconfig.me 2>/dev/null || echo '118.145.228.33')"
echo "  - Webhook地址: http://118.145.228.33:5000/webhook"
echo "  - 健康检查: http://118.145.228.33:5000/health"
echo ""
echo "下一步操作:"
echo "  1. 编辑环境变量: nano /opt/Data-Analyst/.env"
echo "  2. 重启服务: systemctl restart feishu-bot"
echo "  3. 查看日志: journalctl -u feishu-bot -f"
echo "  4. 在飞书开放平台配置 Webhook 地址"
echo ""
