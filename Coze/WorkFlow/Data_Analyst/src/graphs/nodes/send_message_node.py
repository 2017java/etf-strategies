import json
import requests
from langchain_core.runnables import RunnableConfig
from langgraph.runtime import Runtime
from coze_coding_utils.runtime_ctx.context import Context
from coze_workload_identity import Client
from graphs.state import SendMessageInput, SendMessageOutput


def get_webhook_url() -> str:
    """获取飞书机器人的webhook URL"""
    client = Client()
    wechat_bot_credential = client.get_integration_credential("integration-feishu-message")
    webhook_key = json.loads(wechat_bot_credential)["webhook_url"]
    return webhook_key


def send_message_node(state: SendMessageInput, config: RunnableConfig, runtime: Runtime[Context]) -> SendMessageOutput:
    """
    title: 发送消息到飞书群
    desc: 将分析结果格式化后发送到飞书群
    integrations: 飞书消息
    """
    ctx = runtime.context
    
    # 获取webhook URL
    webhook_url = get_webhook_url()
    
    # 构建消息内容
    analysis = state.analysis_result
    
    # 格式化标题
    title = analysis.get("title", "数据分析结果")
    
    # 格式化内容
    content_parts = []
    
    # 添加结论
    if "summary" in analysis:
        content_parts.append(f"📊 **分析结论**\n{analysis['summary']}\n")
    
    # 添加数据概览
    if "data_overview" in analysis:
        content_parts.append(f"📈 **数据概览**\n{analysis['data_overview']}\n")
    
    # 添加趋势分析
    if "trend_analysis" in analysis:
        content_parts.append(f"📉 **趋势分析**\n{analysis['trend_analysis']}\n")
    
    # 添加详细信息
    if "details" in analysis:
        content_parts.append(f"📝 **详细信息**\n{analysis['details']}\n")
    
    # 如果没有结构化字段，直接使用原始内容
    if not content_parts:
        if isinstance(analysis, dict):
            content_parts.append(json.dumps(analysis, ensure_ascii=False, indent=2))
        else:
            content_parts.append(str(analysis))
    
    # 构建富文本消息
    payload = {
        "msg_type": "post",
        "content": {
            "post": {
                "zh_cn": {
                    "title": title,
                    "content": [
                        [{"tag": "text", "text": "\n".join(content_parts)}]
                    ]
                }
            }
        }
    }
    
    # 发送消息
    try:
        response = requests.post(webhook_url, json=payload)
        result = response.json()
        
        if result.get("code") == 0:
            send_result = "消息发送成功"
        else:
            send_result = f"消息发送失败: {result}"
    except Exception as e:
        send_result = f"消息发送异常: {str(e)}"
    
    return SendMessageOutput(send_result=send_result)
