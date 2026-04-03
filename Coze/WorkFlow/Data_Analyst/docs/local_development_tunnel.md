# 本地开发环境 - 内网穿透方案

如果你没有云服务器，可以使用内网穿透工具将本地服务暴露到公网。

## 方案1: 使用 ngrok（推荐）

### 安装 ngrok

#### macOS
```bash
brew install ngrok
```

#### Windows
下载: https://ngrok.com/download

#### Linux
```bash
wget https://bin.equinox.io/c/4VmDzA7iaHb/ngrok-stable-linux-amd64.zip
unzip ngrok-stable-linux-amd64.zip
```

### 使用 ngrok

#### 1. 注册 ngrok 账号
访问: https://ngrok.com/signup

#### 2. 获取 authtoken
登录后，在 Dashboard 中找到你的 authtoken

#### 3. 配置 ngrok
```bash
ngrok authtoken YOUR_AUTH_TOKEN
```

#### 4. 启动内网穿透
```bash
# 穿透本地 5000 端口
ngrok http 5000
```

#### 5. 获取公网地址
ngrok 会显示类似这样的信息：
```
Session Status                online
Forwarding                    https://abc123.ngrok.io -> http://localhost:5000
```

**你的公网地址是**: `https://abc123.ngrok.io`

#### 6. 配置飞书 Webhook
将飞书机器人 Webhook 配置为:
```
https://abc123.ngrok.io/webhook
```

### 优点
- ✅ 免费使用
- ✅ 支持 HTTPS（飞书要求）
- ✅ 简单易用
- ✅ 稳定性好

### 缺点
- ❌ 每次重启会生成新的地址（需要重新配置飞书）
- ❌ 免费版有一些限制

---

## 方案2: 使用 frp

### 安装 frp

```bash
# macOS
brew install frpc

# Linux
wget https://github.com/fatedier/frp/releases/download/v0.52.3/frp_0.52.3_linux_amd64.tar.gz
tar -zxvf frp_0.52.3_linux_amd64.tar.gz
```

### 配置 frp

创建配置文件 `frpc.ini`:

```ini
[common]
server_addr = 你的frp服务器地址
server_port = 7000

[web]
type = http
local_port = 5000
custom_domains = 你的域名
```

### 启动 frp
```bash
frpc -c frpc.ini
```

### 优点
- ✅ 完全免费
- ✅ 可以绑定自己的域名
- ✅ 地址固定不变

### 缺点
- ❌ 需要有自己的域名和服务器
- ❌ 配置相对复杂

---

## 方案3: 使用 localtunnel

### 安装
```bash
npm install -g localtunnel
```

### 使用
```bash
# 启动穿透
lt --port 5000
```

### 获取地址
```
your url is: https://xxx-xxx-xxx.loca.lt
```

### 优点
- ✅ 完全免费
- ✅ 无需注册

### 缺点
- ❌ 稳定性较差
- ❌ 首次访问需要输入IP验证

---

## 方案4: 使用 Cloudflare Tunnel（企业级）

### 安装 cloudflared
```bash
# macOS
brew install cloudflare/cloudflare/cloudflared

# Linux
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x cloudflared-linux-amd64
```

### 配置
```bash
cloudflared tunnel login
cloudflared tunnel create my-tunnel
cloudflared tunnel route dns my-tunnel your-subdomain.your-domain.com
```

### 启动
```bash
cloudflared tunnel run --url http://localhost:5000 my-tunnel
```

### 优点
- ✅ 企业级稳定性
- ✅ 支持 HTTPS
- ✅ 地址固定
- ✅ 免费使用

### 缺点
- ❌ 需要有自己的域名（托管在 Cloudflare）
- ❌ 配置相对复杂

---

## 推荐方案对比

| 方案 | 适用场景 | 难度 | 稳定性 | 是否免费 |
|------|---------|------|--------|---------|
| **ngrok** | 快速测试、开发 | ⭐ | ⭐⭐⭐⭐ | ✅ |
| **frp** | 有自己的服务器 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ |
| **localtunnel** | 临时测试 | ⭐ | ⭐⭐ | ✅ |
| **Cloudflare Tunnel** | 生产环境 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ |

---

## 完整示例：使用 ngrok

### 步骤1: 安装 ngrok
```bash
# macOS
brew install ngrok

# 或下载安装包
# https://ngrok.com/download
```

### 步骤2: 注册并获取 authtoken
访问: https://dashboard.ngrok.com/get-started/your-authtoken

### 步骤3: 配置 authtoken
```bash
ngrok authtoken YOUR_AUTH_TOKEN
```

### 步骤4: 启动机器人服务
```bash
cd scripts
./start_bot.sh
```

### 步骤5: 启动 ngrok（新终端窗口）
```bash
ngrok http 5000
```

### 步骤6: 记录公网地址
ngrok 输出示例：
```
Forwarding    https://abc123.ngrok.io -> http://localhost:5000
```

你的公网地址: `https://abc123.ngrok.io`

### 步骤7: 配置飞书机器人
在飞书开放平台配置:
```
请求网址: https://abc123.ngrok.io/webhook
```

### 步骤8: 测试
在飞书群中发送:
```
@数据分析助手 查询铂智3X的目标线索数据
```

---

## 注意事项

1. **HTTPS 要求**: 飞书要求 Webhook 必须使用 HTTPS，ngrok 免费版自动提供 HTTPS
2. **地址变化**: ngrok 免费版每次重启会生成新地址，需要重新配置飞书
3. **付费版本**: 如果需要固定地址，可以考虑 ngrok 付费版或其他方案

---

## 快速测试脚本

创建一个测试脚本 `start_with_ngrok.sh`:

```bash
#!/bin/bash

echo "🚀 启动机器人服务和 ngrok..."

# 启动机器人服务（后台运行）
cd src/bot
python feishu_bot_server.py &
BOT_PID=$!

# 等待服务启动
sleep 3

# 启动 ngrok
echo ""
echo "📡 启动 ngrok..."
ngrok http 5000

# 清理
kill $BOT_PID
```

使用方法:
```bash
chmod +x start_with_ngrok.sh
./start_with_ngrok.sh
```
