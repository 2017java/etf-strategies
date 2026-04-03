# 飞书机器人快速配置卡片

## 📋 你的服务器信息

- **服务商**: 火山引擎
- **实例名称**: AI-OpenClaw-smjn-000
- **公网IP**: `118.145.228.33` ⭐
- **私网IP**: 172.31.0.2
- **配置**: 2vCPU / 4GiB内存 / 40GiB SSD
- **地域**: 华南1（广州）

---

## 🚀 一键部署命令

### 步骤1: 上传项目到服务器

在你的**本地电脑**执行：

```bash
# 方法1: 使用 scp（推荐）
scp -r /path/to/feishu-bot root@118.145.228.33:/opt/feishu-bot

# 方法2: 使用 rsync
rsync -avz /path/to/feishu-bot root@118.145.228.33:/opt/
```

### 步骤2: 登录服务器

```bash
ssh root@118.145.228.33
```

### 步骤3: 一键部署

```bash
cd /opt/feishu-bot/scripts
chmod +x deploy_volcano.sh
./deploy_volcano.sh
```

---

## ⚙️ 飞书开放平台配置

### 事件订阅配置

1. 登录: https://open.feishu.cn
2. 进入你的应用
3. 找到 **事件订阅**
4. 配置如下：

| 配置项 | 值 |
|--------|---|
| **请求网址** | `http://118.145.228.33:5000/webhook` |
| **订阅事件** | `im.message.receive_v1` |

### 权限配置

必需权限：
- ✅ `im:message` - 获取与发送消息
- ✅ `im:message:send_as_bot` - 以应用身份发消息
- ✅ `im:message:receive_as_bot` - 接收群聊消息
- ✅ `bitable:record:read` - 读取多维表格

---

## 🔥 安全组配置（重要！）

### 在火山引擎控制台

1. 进入 **云服务器** → **实例**
2. 点击实例名称 `AI-OpenClaw-smjn-000`
3. 切换到 **安全组** 标签
4. 点击 **配置规则**

### 添加规则

| 配置项 | 值 |
|--------|---|
| 规则方向 | 入方向 |
| 协议类型 | TCP |
| 端口范围 | 5000 |
| 授权对象 | 0.0.0.0/0 |
| 策略 | 允许 |
| 描述 | 飞书机器人 Webhook |

---

## 🧪 测试命令

### 测试1: 健康检查

```bash
curl http://118.145.228.33:5000/health
```

预期返回：
```json
{
  "status": "ok",
  "service": "feishu-bot",
  "timestamp": 1234567890
}
```

### 测试2: 工作流测试

```bash
curl -X POST http://118.145.228.33:5000/test \
  -H "Content-Type: application/json" \
  -d '{"query": "铂智3X的目标线索数据"}'
```

### 测试3: 飞书群测试

在已添加机器人的飞书群中发送：

```
@数据分析助手 查询铂智3X的目标线索数据
```

---

## 🔧 服务管理命令

```bash
# 查看服务状态
sudo systemctl status feishu-bot

# 查看实时日志
sudo journalctl -u feishu-bot -f

# 查看最近日志
sudo journalctl -u feishu-bot -n 50

# 重启服务
sudo systemctl restart feishu-bot

# 停止服务
sudo systemctl stop feishu-bot

# 启动服务
sudo systemctl start feishu-bot

# 查看端口占用
netstat -nltp | grep 5000

# 查看防火墙规则
sudo firewall-cmd --list-ports  # CentOS
sudo ufw status                  # Ubuntu
```

---

## 📊 关键配置信息

### 工作流配置

```json
{
  "app_token": "ErFOw81Ami65S5kS7jfch2lynUc",
  "table_id": "tblrHwvuWOlIUYWp"
}
```

### 可用车型

- 铂智3X
- 凯美瑞
- 赛那
- 威兰达
- 威飒
- 汉兰达
- 锋兰达
- 雷凌凌尚
- 铂智7

---

## 🔍 故障排查

### 问题1: 无法访问服务

```bash
# 1. 检查服务是否运行
sudo systemctl status feishu-bot

# 2. 检查端口是否监听
netstat -nltp | grep 5000

# 3. 检查防火墙
sudo firewall-cmd --list-ports

# 4. 检查安全组（在火山引擎控制台）
```

### 问题2: 飞书无法推送事件

```bash
# 1. 查看服务日志
sudo journalctl -u feishu-bot -n 100

# 2. 测试 webhook 是否可访问
curl http://118.145.228.33:5000/webhook

# 3. 检查飞书开放平台的配置是否正确
```

### 问题3: 工作流执行失败

```bash
# 1. 查看详细日志
sudo journalctl -u feishu-bot -f

# 2. 手动测试工作流
curl -X POST http://118.145.228.33:5000/test \
  -H "Content-Type: application/json" \
  -d '{"query": "铂智3X的目标线索数据"}'

# 3. 检查环境变量
echo $PYTHONPATH
```

---

## 📝 快速参考

### Webhook 地址
```
http://118.145.228.33:5000/webhook
```

### 健康检查地址
```
http://118.145.228.33:5000/health
```

### 测试接口地址
```
http://118.145.228.33:5000/test
```

### 项目目录
```
/opt/feishu-bot
```

### 服务名称
```
feishu-bot
```

---

## ✅ 部署检查清单

- [ ] 项目已上传到服务器 `/opt/feishu-bot`
- [ ] 已执行一键部署脚本 `./deploy_volcano.sh`
- [ ] 服务运行正常 `sudo systemctl status feishu-bot`
- [ ] 安全组已开放 5000 端口
- [ ] 健康检查正常 `curl http://118.145.228.33:5000/health`
- [ ] 飞书开放平台已配置 Webhook
- [ ] 飞书开放平台已订阅事件
- [ ] 飞书群已添加机器人
- [ ] 已在飞书群中测试

---

## 🆘 需要帮助？

### 查看日志
```bash
sudo journalctl -u feishu-bot -f
```

### 重启服务
```bash
sudo systemctl restart feishu-bot
```

### 查看详细文档
- 火山引擎部署: `docs/volcano_engine_deployment.md`
- 飞书机器人配置: `docs/feishu_bot_deployment.md`
- 项目说明: `AGENTS.md`
