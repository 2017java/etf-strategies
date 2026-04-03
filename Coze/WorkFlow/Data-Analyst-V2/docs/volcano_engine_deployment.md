# 火山引擎云服务器 - 飞书机器人部署指南

## 📋 服务器信息

- **公网IP**: `118.145.228.33`
- **配置**: 2vCPU / 4GiB内存
- **系统盘**: 40GiB SSD
- **实例名称**: AI-OpenClaw-smjn-000

---

## 🚀 部署步骤

### 步骤1: 登录服务器

#### 方法1: 使用 SSH（推荐）

```bash
# macOS / Linux
ssh root@118.145.228.33

# Windows (使用 PowerShell 或 Git Bash)
ssh root@118.145.228.33
```

#### 方法2: 使用火山引擎控制台

1. 登录火山引擎控制台
2. 进入 **云服务器** → **实例**
3. 找到实例 `AI-OpenClaw-smjn-000`
4. 点击 **远程连接**
5. 选择 **VNC远程连接** 或 **Workbench**

---

### 步骤2: 配置安全组（开放端口）

**重要**: 需要开放 5000 端口，让飞书能够访问你的机器人服务。

#### 在火山引擎控制台操作

1. 进入 **云服务器** → **实例**
2. 点击实例名称 `AI-OpenClaw-smjn-000` 进入详情页
3. 切换到 **安全组** 标签
4. 点击 **配置规则** 或 **添加安全组**

#### 添加入站规则

点击 **添加规则**，配置如下：

| 配置项 | 值 |
|--------|---|
| **规则方向** | 入方向 |
| **协议类型** | TCP |
| **端口范围** | 5000 |
| **授权对象** | 0.0.0.0/0（允许所有IP访问）|
| **策略** | 允许 |
| **描述** | 飞书机器人 Webhook 端口 |

#### 使用命令行配置（如果服务器有安全组命令行工具）

```bash
# 示例：使用 iptables 开放端口
sudo iptables -I INPUT -p tcp --dport 5000 -j ACCEPT
sudo service iptables save
```

或

```bash
# 示例：使用 firewalld 开放端口
sudo firewall-cmd --zone=public --add-port=5000/tcp --permanent
sudo firewall-cmd --reload
```

或

```bash
# 示例：使用 ufw 开放端口（Ubuntu）
sudo ufw allow 5000/tcp
sudo ufw reload
```

---

### 步骤3: 安装依赖环境

#### 3.1 更新系统

```bash
# CentOS / RHEL
sudo yum update -y

# Ubuntu / Debian
sudo apt update && sudo apt upgrade -y
```

#### 3.2 安装 Python 3 和 pip

```bash
# CentOS / RHEL
sudo yum install -y python3 python3-pip

# Ubuntu / Debian
sudo apt install -y python3 python3-pip
```

#### 3.3 安装依赖包

```bash
# 安装 Flask 和其他依赖
pip3 install flask requests
```

---

### 步骤4: 上传项目代码

#### 方法1: 使用 Git（推荐）

```bash
# 如果你的项目在 Git 仓库中
cd /opt
git clone YOUR_GIT_REPO_URL
cd YOUR_PROJECT_NAME
```

#### 方法2: 使用 SCP 上传

在本地电脑执行：

```bash
# 上传整个项目目录
scp -r /path/to/your/project root@118.145.228.33:/opt/feishu-bot
```

#### 方法3: 使用 SFTP 工具

使用 FileZilla、WinSCP 等工具上传项目文件。

---

### 步骤5: 配置环境变量

#### 5.1 设置 PYTHONPATH

```bash
# 编辑 ~/.bashrc
vim ~/.bashrc

# 添加以下内容（在文件末尾）
export PYTHONPATH=/opt/feishu-bot:/opt/feishu-bot/src
export FLASK_APP=src/bot/feishu_bot_server.py

# 使配置生效
source ~/.bashrc
```

---

### 步骤6: 启动机器人服务

#### 方式1: 直接启动（测试用）

```bash
cd /opt/feishu-bot/src/bot
python3 feishu_bot_server.py
```

#### 方式2: 使用 Gunicorn（生产环境推荐）

```bash
# 安装 Gunicorn
pip3 install gunicorn

# 启动服务
cd /opt/feishu-bot/src/bot
gunicorn -w 4 -b 0.0.0.0:5000 feishu_bot_server:app
```

参数说明：
- `-w 4`: 使用 4 个工作进程
- `-b 0.0.0.0:5000`: 绑定到所有网卡，端口 5000

#### 方式3: 使用 Systemd（推荐）

创建服务文件：

```bash
sudo vim /etc/systemd/system/feishu-bot.service
```

写入以下内容：

```ini
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
```

启动服务：

```bash
# 重新加载 systemd 配置
sudo systemctl daemon-reload

# 启动服务
sudo systemctl start feishu-bot

# 设置开机自启
sudo systemctl enable feishu-bot

# 查看服务状态
sudo systemctl status feishu-bot
```

---

### 步骤7: 配置飞书机器人

#### 7.1 在飞书开放平台配置

1. 登录飞书开放平台: https://open.feishu.cn
2. 进入你的应用
3. 找到 **事件订阅** 配置
4. 填写 **请求网址**:

```
http://118.145.228.33:5000/webhook
```

**注意**: 
- 飞书要求使用 HTTPS，但可以先测试 HTTP
- 如果要求 HTTPS，需要配置 SSL 证书（见步骤8）

#### 7.2 订阅事件

添加事件订阅：
- `im.message.receive_v1` - 接收消息

#### 7.3 保存配置

点击 **保存** 按钮。

---

### 步骤8: 配置 HTTPS（可选但推荐）

飞书推荐使用 HTTPS，以下是配置方法：

#### 方式1: 使用 Nginx + Let's Encrypt

##### 8.1 安装 Nginx

```bash
# CentOS / RHEL
sudo yum install -y nginx

# Ubuntu / Debian
sudo apt install -y nginx
```

##### 8.2 安装 Certbot

```bash
# CentOS / RHEL
sudo yum install -y certbot python3-certbot-nginx

# Ubuntu / Debian
sudo apt install -y certbot python3-certbot-nginx
```

##### 8.3 配置域名

你需要一个域名，将其解析到你的服务器IP `118.145.228.33`。

##### 8.4 配置 Nginx

编辑 Nginx 配置：

```bash
sudo vim /etc/nginx/conf.d/feishu-bot.conf
```

写入以下内容：

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替换为你的域名

    location /webhook {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

##### 8.5 申请 SSL 证书

```bash
# 启动 Nginx
sudo systemctl start nginx

# 申请证书（自动配置 Nginx）
sudo certbot --nginx -d your-domain.com

# 按照提示操作，选择自动重定向 HTTP 到 HTTPS
```

##### 8.6 更新飞书配置

在飞书开放平台更新 Webhook 地址：

```
https://your-domain.com/webhook
```

#### 方式2: 使用自签名证书（不推荐）

```bash
# 生成自签名证书
openssl req -x509 -newkey rsa:4096 -nodes -keyout key.pem -out cert.pem -days 365

# 修改 Flask 代码使用 HTTPS
app.run(host='0.0.0.0', port=5000, ssl_context=('cert.pem', 'key.pem'))
```

**注意**: 自签名证书需要浏览器手动信任，飞书可能不接受。

---

## 🧪 测试验证

### 测试1: 本地测试

```bash
# 在服务器上执行
curl http://localhost:5000/health
```

预期输出：
```json
{
  "status": "ok",
  "service": "feishu-bot",
  "timestamp": 1234567890
}
```

### 测试2: 外网测试

在你的本地电脑上执行：

```bash
curl http://118.145.228.33:5000/health
```

### 测试3: 工作流测试

```bash
curl -X POST http://118.145.228.33:5000/test \
  -H "Content-Type: application/json" \
  -d '{"query": "铂智3X的目标线索数据"}'
```

### 测试4: 飞书群测试

在已添加机器人的飞书群中发送：

```
@数据分析助手 查询铂智3X的目标线索数据
```

---

## 🔧 常见问题排查

### 问题1: 无法访问服务

**可能原因**:
- 安全组未开放端口
- 防火墙阻止
- 服务未启动

**解决方法**:

```bash
# 1. 检查服务是否运行
sudo systemctl status feishu-bot

# 2. 检查端口是否监听
netstat -nltp | grep 5000

# 3. 检查防火墙
sudo iptables -L -n | grep 5000
# 或
sudo firewall-cmd --list-ports

# 4. 在火山引擎控制台检查安全组规则
```

### 问题2: Python 依赖缺失

```bash
# 安装所有依赖
pip3 install flask requests coze-coding-dev-sdk langchain langgraph
```

### 问题3: 权限错误

```bash
# 给脚本执行权限
chmod +x /opt/feishu-bot/scripts/start_bot.sh

# 检查文件所有者
ls -la /opt/feishu-bot
```

---

## 📊 监控和日志

### 查看服务日志

```bash
# 查看 systemd 服务日志
sudo journalctl -u feishu-bot -f

# 查看最近的日志
sudo journalctl -u feishu-bot --since "1 hour ago"
```

### 查看应用日志

```bash
# 如果在代码中配置了日志
tail -f /var/log/feishu-bot/app.log
```

---

## 🔄 服务管理命令

```bash
# 启动服务
sudo systemctl start feishu-bot

# 停止服务
sudo systemctl stop feishu-bot

# 重启服务
sudo systemctl restart feishu-bot

# 查看状态
sudo systemctl status feishu-bot

# 查看日志
sudo journalctl -u feishu-bot -f
```

---

## 🎯 快速部署脚本

创建一键部署脚本 `deploy.sh`:

```bash
#!/bin/bash

echo "🚀 开始部署飞书机器人..."

# 1. 更新系统
echo "【步骤1】更新系统..."
sudo yum update -y

# 2. 安装依赖
echo "【步骤2】安装依赖..."
sudo yum install -y python3 python3-pip nginx
pip3 install flask requests gunicorn

# 3. 配置防火墙
echo "【步骤3】配置防火墙..."
sudo firewall-cmd --zone=public --add-port=5000/tcp --permanent
sudo firewall-cmd --reload

# 4. 创建 systemd 服务
echo "【步骤4】创建 systemd 服务..."
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

# 5. 启动服务
echo "【步骤5】启动服务..."
sudo systemctl daemon-reload
sudo systemctl enable feishu-bot
sudo systemctl start feishu-bot

echo "✅ 部署完成！"
echo ""
echo "服务信息:"
echo "  - 公网IP: 118.145.228.33"
echo "  - Webhook: http://118.145.228.33:5000/webhook"
echo "  - 健康检查: http://118.145.228.33:5000/health"
echo ""
echo "下一步:"
echo "  1. 在飞书开放平台配置 Webhook: http://118.145.228.33:5000/webhook"
echo "  2. 在飞书群中 @机器人 测试"
```

使用方法：

```bash
chmod +x deploy.sh
./deploy.sh
```

---

## ✅ 部署检查清单

- [ ] 已登录服务器
- [ ] 已安装 Python 3 和依赖包
- [ ] 已上传项目代码
- [ ] 已配置环境变量
- [ ] 已开放 5000 端口（安全组）
- [ ] 已启动服务
- [ ] 服务运行正常（http://118.145.228.33:5000/health）
- [ ] 已配置飞书 Webhook
- [ ] 已在飞书群中测试

---

## 📝 配置信息总结

**服务器信息**:
- 公网IP: `118.145.228.33`
- 端口: `5000`
- Webhook地址: `http://118.145.228.33:5000/webhook`

**飞书配置**:
- 事件订阅地址: `http://118.145.228.33:5000/webhook`
- 订阅事件: `im.message.receive_v1`

**服务管理**:
- 启动: `sudo systemctl start feishu-bot`
- 停止: `sudo systemctl stop feishu-bot`
- 重启: `sudo systemctl restart feishu-bot`
- 日志: `sudo journalctl -u feishu-bot -f`
