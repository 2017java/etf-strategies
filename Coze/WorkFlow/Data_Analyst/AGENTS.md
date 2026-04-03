## 项目概述
- **名称**: 飞书多维表格数据查询分析工作流
- **功能**: 基于自然语言查询飞书多维表格数据，进行统计分析或趋势分析，并将结果推送到飞书群

### 节点清单
| 节点名 | 文件位置 | 类型 | 功能描述 | 分支逻辑 | 配置文件 |
|-------|---------|------|---------|---------|---------|
| parse_intent | `graphs/nodes/parse_intent_node.py` | agent | 解析用户的自然语言查询意图 | - | `config/parse_intent_cfg.json` |
| query_data | `graphs/nodes/query_data_node.py` | task | 查询飞书多维表格数据 | - | - |
| analyze_data | `graphs/nodes/analyze_data_node.py` | agent | 分析数据（统计/趋势） | - | `config/analyze_data_cfg.json` |
| send_message | `graphs/nodes/send_message_node.py` | task | 发送消息到飞书群 | - | - |

**类型说明**: task(task节点) / agent(大模型) / condition(条件分支) / looparray(列表循环) / loopcond(条件循环)

## 子图清单
无子图

## 技能使用
- 节点`parse_intent`使用技能`大语言模型`（llm）
- 节点`query_data`使用技能`飞书多维表格`（feishu-base）
- 节点`analyze_data`使用技能`大语言模型`（llm）
- 节点`send_message`使用技能`飞书消息`（feishu-message）

## 工作流说明

### 输入参数
- `user_query`: 用户的自然语言查询，例如"今天A级车的目标线索数据是多少"、"本月内SUV车型线索数量获取趋势"
- `app_token`: 飞书多维表格的app_token（从飞书链接中提取）
- `table_id`: 飞书多维表格的table_id（从飞书链接中提取）

### 工作流程
1. **parse_intent（查询意图解析）**: 使用大语言模型解析用户的自然语言查询，提取查询类型（统计/趋势）、时间范围、车型等关键信息
2. **query_data（数据查询）**: 根据解析的查询意图，从飞书多维表格中查询相关数据
3. **analyze_data（数据分析）**: 使用大语言模型对查询结果进行统计分析或趋势分析
4. **send_message（消息推送）**: 将分析结果格式化后发送到飞书群

### 输出结果
- `analysis_result`: 分析结果，包含结论、数据概览、趋势分析等
- `send_result`: 消息发送结果

## 使用示例

### 正确的参数配置
```json
{
  "app_token": "ErFOw81Ami65S5kS7jfch2lynUc",
  "table_id": "tblrHwvuWOlIUYWp"
}
```

### 示例1: 统计查询
```json
{
  "user_query": "今天铂智3X的目标线索数据是多少",
  "app_token": "ErFOw81Ami65S5kS7jfch2lynUc",
  "table_id": "tblrHwvuWOlIUYWp"
}
```

### 示例2: 趋势查询
```json
{
  "user_query": "本月内凯美瑞车型线索数量获取趋势怎么样",
  "app_token": "ErFOw81Ami65S5kS7jfch2lynUc",
  "table_id": "tblrHwvuWOlIUYWp"
}
```

### 可用车型列表
- 铂智3X
- 凯美瑞
- 赛那
- 威兰达
- 威飒
- 汉兰达
- 锋兰达
- 雷凌凌尚
- 铂智7

## 火山引擎服务器部署

### 服务器信息
- **公网IP**: `118.145.228.33`
- **实例名称**: AI-OpenClaw-smjn-000
- **配置**: 2vCPU / 4GiB内存 / 40GiB SSD

### 快速部署

#### 方法1: 一键部署脚本（推荐）

```bash
# 上传项目到服务器
scp -r /path/to/your/project root@118.145.228.33:/opt/feishu-bot

# 登录服务器
ssh root@118.145.228.33

# 运行部署脚本
cd /opt/feishu-bot/scripts
chmod +x deploy_volcano.sh
./deploy_volcano.sh
```

#### 方法2: 手动部署

详细步骤请查看: `docs/volcano_engine_deployment.md`

### 配置安全组

在火山引擎控制台配置：
1. 进入 **云服务器** → **实例** → **安全组**
2. 添加入站规则：
   - 协议: TCP
   - 端口: 5000
   - 授权对象: 0.0.0.0/0

### 配置飞书机器人

在飞书开放平台配置：
```
Webhook地址: http://118.145.228.33:5000/webhook
订阅事件: im.message.receive_v1
```

### 测试验证

```bash
# 测试健康检查
curl http://118.145.228.33:5000/health

# 测试工作流
curl -X POST http://118.145.228.33:5000/test \
  -H "Content-Type: application/json" \
  -d '{"query": "铂智3X的目标线索数据"}'
```

### 服务管理

```bash
# 查看状态
sudo systemctl status feishu-bot

# 查看日志
sudo journalctl -u feishu-bot -f

# 重启服务
sudo systemctl restart feishu-bot

# 停止服务
sudo systemctl stop feishu-bot
```

## 飞书机器人交互

### 功能说明
支持在飞书群中直接 @机器人 发送查询消息，自动触发工作流并返回结果。

### 快速开始

#### 1. 启动机器人服务
```bash
cd scripts
chmod +x start_bot.sh
./start_bot.sh
```

#### 2. 配置飞书机器人
详细配置步骤请查看: `docs/feishu_bot_deployment.md`

#### 3. 在飞书群中使用
```
@数据分析助手 查询铂智3X的目标线索数据
```

### 支持的查询类型
- **统计查询**: "铂智3X的目标线索数据是多少"
- **趋势分析**: "本月凯美瑞线索数量趋势怎么样"

### 服务接口
- **Webhook**: `http://your-server:5000/webhook`
- **健康检查**: `http://your-server:5000/health`
- **测试接口**: `POST http://your-server:5000/test`

### 测试接口使用
```bash
curl -X POST http://localhost:5000/test \
  -H "Content-Type: application/json" \
  -d '{"query": "铂智3X的目标线索数据"}'
```

### 文件说明
- `src/bot/feishu_bot_server.py` - 机器人服务主程序
- `scripts/start_bot.sh` - 启动脚本
- `scripts/deploy_volcano.sh` - 火山引擎一键部署脚本
- `docs/feishu_bot_deployment.md` - 详细部署文档
- `docs/volcano_engine_deployment.md` - 火山引擎部署文档

## 注意事项
1. 飞书多维表格的字段名称（如"车型"、"创建时间"）需要根据实际情况调整
2. 查询筛选逻辑可以根据实际需求优化
3. 飞书消息发送有频率限制，短时间内大量发送可能被限流
4. 需要确保工作流有访问飞书多维表格的权限
5. 机器人服务需要部署在公网可访问的服务器上
6. 火山引擎服务器需要开放5000端口（安全组配置）
