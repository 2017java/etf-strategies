"""
飞书机器人交互服务

功能：
1. 接收飞书群消息
2. 解析用户查询意图
3. 触发工作流处理查询
4. 将结果推送到飞书群
"""

import json
import hashlib
import time
from typing import Dict, Any
from flask import Flask, request, jsonify
from functools import wraps
from cozeloop.decorator import observe
from coze_workload_identity import Client
import requests


app = Flask(__name__)


def get_access_token() -> str:
    """获取飞书多维表格的访问令牌"""
    client = Client()
    return client.get_integration_credential("integration-feishu-base")


def get_webhook_url() -> str:
    """获取飞书机器人的webhook URL"""
    client = Client()
    credential = client.get_integration_credential("integration-feishu-message")
    return json.loads(credential)["webhook_url"]


class FeishuBot:
    """飞书机器人核心功能"""
    
    def __init__(self):
        self.access_token = get_access_token()
    
    def verify_signature(self, timestamp: str, nonce: str, signature: str, body: str) -> bool:
        """
        验证飞书消息签名
        
        Args:
            timestamp: 时间戳
            nonce: 随机字符串
            signature: 签名
            body: 请求体
        
        Returns:
            是否验证通过
        """
        # 注意：实际部署时需要配置正确的 encrypt_key
        # 这里简化处理，实际环境需要严格按照飞书文档实现
        return True
    
    def parse_message(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """
        解析飞书消息事件
        
        Args:
            event: 飞书事件数据
        
        Returns:
            解析后的消息信息
        """
        result = {
            "message_type": None,
            "content": None,
            "sender": None,
            "chat_id": None,
            "message_id": None
        }
        
        try:
            # 获取消息类型
            message = event.get("message", {})
            result["message_type"] = message.get("message_type")
            result["chat_id"] = message.get("chat_id")
            result["message_id"] = message.get("message_id")
            
            # 获取发送者信息
            sender = event.get("sender", {})
            result["sender"] = sender.get("sender_id", {}).get("user_id")
            
            # 解析消息内容
            content_str = message.get("content", "{}")
            content = json.loads(content_str) if isinstance(content_str, str) else content_str
            
            if result["message_type"] == "text":
                result["content"] = content.get("text", "")
            elif result["message_type"] == "post":
                # 富文本消息处理
                result["content"] = self._extract_text_from_post(content)
            
        except Exception as e:
            print(f"解析消息失败: {e}")
        
        return result
    
    def _extract_text_from_post(self, content: Dict[str, Any]) -> str:
        """从富文本消息中提取纯文本"""
        try:
            text_parts = []
            post_content = content.get("zh_cn", {}).get("content", [])
            
            for paragraph in post_content:
                for element in paragraph:
                    if element.get("tag") == "text":
                        text_parts.append(element.get("text", ""))
            
            return " ".join(text_parts)
        except Exception:
            return ""
    
    def is_query_request(self, message: str) -> bool:
        """
        判断消息是否为查询请求
        
        Args:
            message: 消息内容
        
        Returns:
            是否为查询请求
        """
        # 简单的规则匹配，可以根据需要扩展
        query_keywords = [
            "查询", "统计", "数据", "线索", "趋势",
            "多少", "怎么样", "帮我", "分析"
        ]
        
        return any(keyword in message for keyword in query_keywords)
    
    def trigger_workflow(self, user_query: str) -> Dict[str, Any]:
        """
        触发工作流处理查询
        
        Args:
            user_query: 用户查询内容
        
        Returns:
            工作流执行结果
        """
        try:
            # 导入工作流
            from graphs.graph import main_graph
            from graphs.state import GraphInput
            
            # 准备输入参数
            input_data = GraphInput(
                user_query=user_query,
                app_token="ErFOw81Ami65S5kS7jfch2lynUc",
                table_id="tblrHwvuWOlIUYWp"
            )
            
            # 执行工作流
            result = main_graph.invoke(input_data.model_dump())
            
            return {
                "success": True,
                "analysis_result": result.get("analysis_result", {}),
                "send_result": result.get("send_result", "")
            }
        
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def send_message_to_chat(self, chat_id: str, message: str) -> bool:
        """
        发送消息到指定会话
        
        Args:
            chat_id: 会话ID
            message: 消息内容
        
        Returns:
            是否发送成功
        """
        try:
            # 使用飞书开放API发送消息
            url = "https://open.larkoffice.com/open-apis/im/v1/messages"
            
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "Content-Type": "application/json"
            }
            
            data = {
                "receive_id": chat_id,
                "msg_type": "text",
                "content": json.dumps({"text": message})
            }
            
            response = requests.post(url, headers=headers, json=data)
            result = response.json()
            
            return result.get("code") == 0
        
        except Exception as e:
            print(f"发送消息失败: {e}")
            return False
    
    def send_card_message(self, chat_id: str, title: str, content: str) -> bool:
        """
        发送卡片消息
        
        Args:
            chat_id: 会话ID
            title: 卡片标题
            content: 卡片内容
        
        Returns:
            是否发送成功
        """
        try:
            url = "https://open.larkoffice.com/open-apis/im/v1/messages"
            
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "Content-Type": "application/json"
            }
            
            card = {
                "msg_type": "interactive",
                "card": {
                    "header": {
                        "title": {
                            "tag": "plain_text",
                            "content": title
                        }
                    },
                    "elements": [
                        {
                            "tag": "div",
                            "text": {
                                "tag": "plain_text",
                                "content": content
                            }
                        }
                    ]
                }
            }
            
            data = {
                "receive_id": chat_id,
                "msg_type": "interactive",
                "content": json.dumps(card)
            }
            
            response = requests.post(url, headers=headers, json=data)
            result = response.json()
            
            return result.get("code") == 0
        
        except Exception as e:
            print(f"发送卡片消息失败: {e}")
            return False


# 创建机器人实例
bot = FeishuBot()


@app.route('/webhook', methods=['POST'])
def webhook():
    """
    飞书机器人 Webhook 入口
    
    接收飞书推送的消息事件，处理并返回响应
    """
    try:
        # 获取请求数据
        body = request.get_data(as_text=True)
        event = json.loads(body)
        
        print(f"收到飞书事件: {json.dumps(event, ensure_ascii=False, indent=2)}")
        
        # 处理 URL 验证请求
        if event.get("type") == "url_verification":
            challenge = event.get("challenge", "")
            return jsonify({"challenge": challenge})
        
        # 处理消息事件
        if event.get("header", {}).get("event_type") == "im.message.receive_v1":
            # 解析消息
            message_info = bot.parse_message(event.get("event", {}))
            
            print(f"解析后的消息: {json.dumps(message_info, ensure_ascii=False)}")
            
            # 判断是否为查询请求
            if message_info["content"] and bot.is_query_request(message_info["content"]):
                # 发送处理中提示
                bot.send_message_to_chat(
                    message_info["chat_id"],
                    f"收到查询请求，正在处理中...\n查询内容：{message_info['content']}"
                )
                
                # 触发工作流
                result = bot.trigger_workflow(message_info["content"])
                
                if result["success"]:
                    # 发送结果
                    analysis = result["analysis_result"]
                    
                    # 格式化结果
                    response_message = f"""
📊 **数据分析结果**

**分析结论**：
{analysis.get('summary', '暂无')}

**数据概览**：
{analysis.get('data_overview', '暂无')}

**详细信息**：
{analysis.get('details', '暂无')}
                    """
                    
                    bot.send_message_to_chat(message_info["chat_id"], response_message)
                else:
                    bot.send_message_to_chat(
                        message_info["chat_id"],
                        f"处理失败：{result.get('error', '未知错误')}"
                    )
        
        return jsonify({"code": 0, "msg": "success"})
    
    except Exception as e:
        print(f"处理飞书消息失败: {e}")
        return jsonify({"code": -1, "msg": str(e)})


@app.route('/health', methods=['GET'])
def health():
    """健康检查接口"""
    return jsonify({
        "status": "ok",
        "service": "feishu-bot",
        "timestamp": int(time.time())
    })


@app.route('/test', methods=['POST'])
def test():
    """
    测试接口 - 手动触发工作流
    
    用于测试工作流是否正常工作，无需飞书消息触发
    """
    try:
        data = request.get_json()
        user_query = data.get("query", "")
        
        if not user_query:
            return jsonify({"code": -1, "msg": "缺少 query 参数"})
        
        # 触发工作流
        result = bot.trigger_workflow(user_query)
        
        return jsonify({
            "code": 0,
            "data": result
        })
    
    except Exception as e:
        return jsonify({"code": -1, "msg": str(e)})


if __name__ == '__main__':
    # 启动 Flask 服务
    print("=" * 70)
    print("🤖 飞书机器人服务启动")
    print("=" * 70)
    print("\n服务地址:")
    print("  - Webhook: http://localhost:5000/webhook")
    print("  - 健康检查: http://localhost:5000/health")
    print("  - 测试接口: http://localhost:5000/test")
    print("\n使用方法:")
    print("  1. 配置飞书机器人 Webhook 地址为: http://your-server:5000/webhook")
    print("  2. 在飞书群中 @机器人 发送查询消息")
    print("  3. 机器人会自动处理并返回结果")
    print("\n" + "=" * 70)
    
    app.run(host='0.0.0.0', port=5000, debug=True)
