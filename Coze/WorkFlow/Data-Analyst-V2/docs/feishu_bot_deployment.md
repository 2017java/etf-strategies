# 飞书机器人部署指南

本指南将帮助你配置飞书机器人，实现在飞书群中直接调用工作流。

## 🎯 功能概述

- ✅ 在飞书群中 @机器人 发送查询消息
- ✅ 机器人自动解析查询意图
- ✅ 触发工作流处理数据
- ✅ 将结果推送到飞书群

## 📋 前置要求

1. **飞书开放平台账号**: https://open.feishu.cn
2. **飞书应用**: 已创建并配置好权限
3. **公网服务器**: 用于接收飞书 Webhook 回调

## 🔧 配置步骤

### 步骤1: 创建飞书应用

1. 登录飞书开放平台: https://open.feishu.cn
2. 点击 **"创建企业自建应用"**
3. 填写应用名称和描述
4. 记录 **App ID** 和 **App Secret**

### 步骤2: 配置应用权限

在应用管理页面，进入 **"权限管理"**，添加以下权限：

#### 必需权限
- `im:message` - 获取与发送单聊、群组消息
- `im:message:send_as_bot` - 以应用身份发消息
- `im:message:receive_as_bot` - 接收群聊中@机器人消息
- `im:chat` - 获取群组信息
- `im:chat:read` - 读取群信息
- `bitable:record:read` - 查看多维表格记录

#### 权限配置步骤
1. 在 "权限管理" 页面搜索权限名称
2. 点击 "申请权限"
3. 等待管理员审批

### 步骤3: 配置事件订阅

1. 在应用管理页面，进入 **"事件订阅"**
2. 点击 **"添加事件订阅"**
3. 配置 **请求网址**:
   ```
   http://your-server-ip:5000/webhook
   ```
   - 将 `your-server-ip` 替换为你的服务器公网IP
   - 确保服务器防火墙开放 5000 端口

4. 订阅以下事件:
   - `im.message.receive_v1` - 接收消息

5. 点击 **"保存"**

### 步骤4: 配置机器人

1. 在应用管理页面，进入 **"应用功能"** → **"机器人"**
2. 启用 **"机器人能力"**
3. 配置机器人信息:
   - **机器人名称**: 数据分析助手
   - **机器人描述**: 帮助查询和分析线索数据
   - **机器人头像**: 上传一个图标

4. 点击 **"发布版本"**
5. 等待审核通过

### 步骤5: 将机器人添加到群聊

1. 打开飞书群聊
2. 点击群聊右上角 **"..."**
3. 选择 **"设置"**
4. 点击 **"群机器人"**
5. 点击 **"添加机器人"**
6. 选择你的机器人

## 🚀 部署服务

### 方式1: 本地测试

```bash
# 安装依赖
pip install flask

# 启动服务
cd src/bot
python feishu_bot_server.py
```

服务启动后，访问地址:
- Webhook: http://localhost:5000/webhook
- 健康检查: http://localhost:5000/health
- 测试接口: http://localhost:5000/test

### 方式2: 生产环境部署

#### 使用 Gunicorn

```bash
# 安装 Gunicorn
pip install gunicorn

# 启动服务
gunicorn -w 4 -b 0.0.0.0:5000 feishu_bot_server:app
```

#### 使用 Systemd (推荐)

创建服务文件 `/etc/systemd/system/feishu-bot.service`:

```ini
[Unit]
Description=Feishu Bot Service
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/your/project/src/bot
ExecStart=/usr/bin/python3 feishu_bot_server.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

启动服务:

```bash
sudo systemctl daemon-reload
sudo systemctl enable feishu-bot
sudo systemctl start feishu-bot
```

#### 使用 Docker

创建 `Dockerfile`:

```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src/bot/ .

EXPOSE 5000

CMD ["python", "feishu_bot_server.py"]
```

构建并运行:

```bash
docker build -t feishu-bot .
docker run -d -p 5000:5000 --name feishu-bot feishu-bot
```

## 📱 使用方法

### 在飞书群中调用

1. 打开已添加机器人的飞书群
2. 输入查询消息，例如:
   ```
   @数据分析助手 查询铂智3X的目标线索数据
   ```
3. 机器人会自动:
   - 解析查询意图
   - 触发工作流处理
   - 返回分析结果

### 支持的查询类型

#### 统计查询
```
@数据分析助手 铂智3X的目标线索数据是多少
@数据分析助手 今天凯美瑞的线索数据
@数据分析助手 本周汉兰达的线索统计
```

#### 趋势分析
```
@数据分析助手 本月铂智3X线索数量趋势怎么样
@数据分析助手 凯美瑞最近一周的线索变化
```

### 测试接口

使用 curl 测试:

```bash
curl -X POST http://localhost:5000/test \
  -H "Content-Type: application/json" \
  -d '{"query": "铂智3X的目标线索数据是多少"}'
```

## 🔍 故障排查

### 问题1: 收不到消息

**可能原因**:
- Webhook 地址配置错误
- 服务器防火墙未开放端口
- 事件订阅未正确配置

**解决方法**:
1. 检查飞书开放平台的事件订阅配置
2. 确认服务器日志是否收到请求
3. 测试 Webhook 地址是否可访问

### 问题2: 消息发送失败

**可能原因**:
- 应用权限不足
- Access Token 获取失败

**解决方法**:
1. 检查应用权限配置
2. 查看服务器日志错误信息
3. 确认集成配置正确

### 问题3: 工作流执行失败

**可能原因**:
- 参数配置错误
- 数据查询失败

**解决方法**:
1. 检查 `app_token` 和 `table_id` 配置
2. 查看工作流执行日志
3. 使用测试接口验证

## 📊 监控和日志

### 查看日志

```bash
# Systemd 服务日志
sudo journalctl -u feishu-bot -f

# Docker 日志
docker logs -f feishu-bot
```

### 健康检查

```bash
curl http://localhost:5000/health
```

返回示例:
```json
{
  "status": "ok",
  "service": "feishu-bot",
  "timestamp": 1234567890
}
```

## 🔒 安全建议

1. **启用签名验证**: 在生产环境中启用飞书消息签名验证
2. **限制访问来源**: 配置防火墙只允许飞书服务器IP访问
3. **使用 HTTPS**: 配置 SSL 证书，使用 HTTPS 协议
4. **定期更新**: 及时更新依赖包，修复安全漏洞

## 📚 相关文档

- [飞书开放平台文档](https://open.feishu.cn/document)
- [机器人开发指南](https://open.feishu.cn/document/ukTMukTMukTM/uYjNwUjL2YDM14iN2ATN)
- [事件订阅说明](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/qYjNwYjL2YjO0MiN)

## 💡 高级功能

### 自定义触发词

修改 `feishu_bot_server.py` 中的 `is_query_request` 方法:

```python
def is_query_request(self, message: str) -> bool:
    # 自定义触发词
    custom_keywords = ["查询", "统计", "分析", "帮我查"]
    return any(keyword in message for keyword in custom_keywords)
```

### 多表格支持

修改 `trigger_workflow` 方法，支持多个表格:

```python
def trigger_workflow(self, user_query: str, table_config: Dict[str, str] = None):
    # 使用传入的表格配置，或默认配置
    config = table_config or {
        "app_token": "ErFOw81Ami65S5kS7jfch2lynUc",
        "table_id": "tblrHwvuWOlIUYWp"
    }
    # ...
```

## ❓ 常见问题

**Q: 机器人没有回复消息怎么办？**
A: 检查服务器日志，确认是否收到消息，权限是否配置正确。

**Q: 如何修改返回消息格式？**
A: 编辑 `send_message_to_chat` 方法中的消息模板。

**Q: 支持富文本消息吗？**
A: 支持，使用 `send_card_message` 方法发送卡片消息。
