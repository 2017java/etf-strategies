# 飞书 + Coze 智能体机器人

通过飞书长连接 + Coze 编程智能体，实现飞书群聊数据分析机器人。

## 项目结构

```
FeishuCozeBot/
├── config/
│   ├── __init__.py
│   └── config.py           # 配置管理
├── src/
│   ├── __init__.py
│   ├── main.py             # 主程序入口
│   ├── feishu_client.py    # 飞书长连接客户端
│   └── coze_client.py      # Coze API客户端
├── coze_agent/
│   ├── __init__.py
│   ├── bitable_tools.py    # 多维表格操作工具
│   └── agent_main.py       # Coze智能体主入口
├── .env.template           # 环境变量模板
├── config.template.json    # 配置文件模板
└── requirements.txt        # Python依赖
```

## 快速开始

### 1. 安装依赖

```bash
cd FeishuCozeBot
pip install -r requirements.txt
```

### 2. 配置

复制配置模板并填写：

```bash
# 方式1: 使用 config.json
cp config.template.json config.json
# 编辑 config.json 填写你的配置

# 方式2: 使用 .env 文件
cp .env.template .env
# 编辑 .env 填写你的配置
```

#### 配置项说明

| 配置项 | 说明 |
|--------|------|
| FEISHU_APP_ID | 飞书应用 App ID |
| FEISHU_APP_SECRET | 飞书应用 App Secret |
| FEISHU_DEFAULT_APP_TOKEN | 默认多维表格 App Token |
| FEISHU_DEFAULT_TABLE_ID | 默认多维表格 Table ID |
| COZE_API_URL | Coze API 地址 |
| COZE_API_TOKEN | Coze API Token |
| COZE_BOT_ID | Coze Bot ID |

### 3. 飞书开放平台配置

1. 登录 [飞书开放平台](https://open.feishu.cn)
2. 进入你的应用 → 事件订阅
3. 开启 **长连接模式**（不需要配置Webhook地址）
4. 订阅事件：`im.message.receive_v1`
5. 配置应用权限：
   - `im:message` - 获取与发送消息
   - `im:message:send_as_bot` - 以应用身份发消息
   - `im:message:receive_as_bot` - 接收群聊中@机器人消息
   - `bitable:record:read` - 读取多维表格
   - `bitable:record:write` - 写入多维表格

### 4. Coze 平台配置

1. 登录 [Coze 平台](https://www.coze.cn)
2. 创建编程智能体
3. 上传 `coze_agent/` 目录下的代码
4. 部署为 API，获取 API URL、Token、Bot ID

### 5. 运行

```bash
python src/main.py
```

## 使用方法

### 在飞书群中使用

1. 将机器人添加到飞书群
2. @机器人 发送消息：

```
@机器人 分析一下铂智3X目标线索
@机器人 查询本月销售数据
@机器人 统计各车型占比
```

### 配置管理命令

| 命令 | 说明 |
|------|------|
| `当前配置` | 查看当前多维表格配置 |
| `设置表格 <app_token> <table_id>` | 更换多维表格 |
| `重置配置` | 恢复默认多维表格 |

## Coze 智能体功能

### 多维表格操作

| 操作 | 说明 |
|------|------|
| query | 查询记录 |
| add | 添加记录 |
| update | 更新记录 |
| delete | 删除记录 |
| batch_add | 批量添加 |
| get_structure | 获取表格结构 |

### 数据分析

| 分析类型 | 说明 |
|----------|------|
| analyze_growth | 增长率分析 |
| analyze_proportion | 占比分析 |
| analyze_trend | 趋势分析 |
| analyze_yoy | 同比分析 |
| analyze_mom | 环比分析 |

## 架构说明

```
┌──────────────┐
│   飞书群聊    │
│  @机器人消息  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 飞书长连接    │  ← 不需要公网IP
│ WebSocket    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 本地服务      │  ← 你的电脑
│ 消息处理      │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Coze API     │  ← AI处理
│ 多维表格操作  │
└──────────────┘
```

## 注意事项

1. 本地电脑需要保持开机运行
2. 网络断开后会自动重连
3. 如需 7x24 小时运行，可部署到云服务
