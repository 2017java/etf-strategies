"""
飞书机器人交互服务

功能：
1. 接收飞书群消息
2. 解析用户查询意图
3. 触发工作流处理查询
4. 将结果推送到飞书群
"""

import os
import json
import hashlib
import time
from typing import Dict, Any, Optional
from flask import Flask, request, jsonify
import requests


app = Flask(__name__)

# 从环境变量获取配置
FEISHU_APP_ID = os.getenv("FEISHU_APP_ID", "")
FEISHU_APP_SECRET = os.getenv("FEISHU_APP_SECRET", "")
APP_TOKEN = os.getenv("APP_TOKEN", "ErFOw81Ami65S5kS7jfch2lynUc")
TABLE_ID = os.getenv("TABLE_ID", "tblrHwvuWOlIUYWp")


class FeishuTokenManager:
    """飞书访问令牌管理器"""
    
    def __init__(self):
        self.app_id = FEISHU_APP_ID
        self.app_secret = FEISHU_APP_SECRET
        self._access_token: Optional[str] = None
        self._token_expire_time: int = 0
    
    def get_tenant_access_token(self) -> str:
        """
        获取飞书 tenant_access_token
        
        Returns:
            访问令牌
        """
        # 如果 token 未过期，直接返回
        if self._access_token and time.time() < self._token_expire_time:
            return self._access_token
        
        # 请求新的 token
        url = "https://open.larkoffice.com/open-apis/auth/v3/tenant_access_token/internal"
        
        headers = {
            "Content-Type": "application/json"
        }
        
        data = {
            "app_id": self.app_id,
            "app_secret": self.app_secret
        }
        
        try:
            response = requests.post(url, headers=headers, json=data, timeout=10)
            result = response.json()
            
            if result.get("code") == 0:
                self._access_token = result.get("tenant_access_token")
                # 提前5分钟过期，避免边界问题
                self._token_expire_time = time.time() + result.get("expire", 7200) - 300
                print(f"✅ 获取访问令牌成功，有效期: {result.get('expire', 7200)}秒")
                return self._access_token
            else:
                raise Exception(f"获取访问令牌失败: {result.get('msg', '未知错误')}")
        
        except Exception as e:
            print(f"❌ 获取访问令牌异常: {e}")
            raise


# 全局令牌管理器
token_manager = FeishuTokenManager()


class FeishuBot:
    """飞书机器人核心功能"""
    
    def __init__(self):
        self.app_token = APP_TOKEN
        self.table_id = TABLE_ID
    
    def get_access_token(self) -> str:
        """获取访问令牌"""
        return token_manager.get_tenant_access_token()
    
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
                app_token=self.app_token,
                table_id=self.table_id
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
            access_token = self.get_access_token()
            
            # 使用飞书开放API发送消息
            url = "https://open.larkoffice.com/open-apis/im/v1/messages"
            
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            }
            
            data = {
                "receive_id": chat_id,
                "msg_type": "text",
                "content": json.dumps({"text": message})
            }
            
            params = {
                "receive_id_type": "chat_id"
            }
            
            response = requests.post(url, headers=headers, json=data, params=params, timeout=10)
            result = response.json()
            
            if result.get("code") == 0:
                print(f"✅ 消息发送成功")
                return True
            else:
                print(f"❌ 消息发送失败: {result.get('msg', '未知错误')}")
                return False
        
        except Exception as e:
            print(f"❌ 发送消息异常: {e}")
            return False
    
    def query_feishu_table(self, query_text: str) -> Dict[str, Any]:
        """
        查询飞书多维表格数据
        
        Args:
            query_text: 查询文本
        
        Returns:
            查询结果
        """
        try:
            access_token = self.get_access_token()
            
            url = f"https://open.larkoffice.com/open-apis/bitable/v1/apps/{self.app_token}/tables/{self.table_id}/records/search"
            
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            }
            
            # 构建查询条件（示例：获取前10条记录）
            data = {
                "page_size": 10
            }
            
            response = requests.post(url, headers=headers, json=data, timeout=10)
            result = response.json()
            
            if result.get("code") == 0:
                return {
                    "success": True,
                    "data": result.get("data", {})
                }
            else:
                return {
                    "success": False,
                    "error": result.get("msg", "查询失败")
                }
        
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }


# 创建全局机器人实例（延迟初始化）
_bot: Optional[FeishuBot] = None


def get_bot() -> FeishuBot:
    """获取机器人实例"""
    global _bot
    if _bot is None:
        _bot = FeishuBot()
    return _bot


@app.route('/health', methods=['GET'])
def health_check():
    """健康检查接口"""
    return jsonify({
        "status": "ok",
        "service": "feishu-bot",
        "timestamp": int(time.time())
    })


@app.route('/webhook', methods=['POST'])
def webhook():
    """
    飞书事件订阅 Webhook
    
    接收飞书推送的事件消息
    """
    try:
        # 获取请求数据
        body = request.get_data(as_text=True)
        event = json.loads(body)
        
        print(f"收到飞书事件: {json.dumps(event, ensure_ascii=False, indent=2)}")
        
        # 处理 URL 验证请求
        if event.get("type") == "url_verification":
            challenge = event.get("challenge", "")
            print(f"URL验证请求，返回 challenge: {challenge}")
            return jsonify({"challenge": challenge})
        
        # 处理消息事件
        if event.get("header", {}).get("event_type") == "im.message.receive_v1":
            bot = get_bot()
            
            # 解析消息
            event_data = event.get("event", {})
            parsed = bot.parse_message(event_data)
            
            print(f"解析后的消息: {parsed}")
            
            # 判断是否为查询请求
            content = parsed.get("content", "")
            if content and bot.is_query_request(content):
                # 发送处理中提示
                chat_id = parsed.get("chat_id")
                if chat_id:
                    bot.send_message_to_chat(chat_id, f"收到查询请求，正在处理中...\n查询内容：{content}")
                
                # 触发工作流处理
                result = bot.trigger_workflow(content)
                
                if result.get("success"):
                    analysis = result.get("analysis_result", {})
                    # 格式化结果并发送
                    response_msg = f"📊 数据分析结果\n\n{json.dumps(analysis, ensure_ascii=False, indent=2)}"
                    if chat_id:
                        bot.send_message_to_chat(chat_id, response_msg)
                else:
                    if chat_id:
                        bot.send_message_to_chat(chat_id, f"处理失败: {result.get('error', '未知错误')}")
        
        return jsonify({"code": 0, "msg": "success"})
    
    except Exception as e:
        print(f"处理Webhook异常: {e}")
        return jsonify({"code": -1, "msg": str(e)}), 500


@app.route('/test', methods=['POST'])
def test_workflow():
    """
    测试工作流接口
    
    用于测试工作流是否正常工作
    """
    try:
        data = request.get_json()
        query = data.get("query", "测试查询")
        
        bot = get_bot()
        result = bot.trigger_workflow(query)
        
        return jsonify({
            "success": True,
            "query": query,
            "result": result
        })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/token', methods=['GET'])
def test_token():
    """
    测试获取访问令牌接口
    """
    try:
        token = token_manager.get_tenant_access_token()
        return jsonify({
            "success": True,
            "token": token[:20] + "..." if token else None,
            "app_id": FEISHU_APP_ID[:10] + "..." if FEISHU_APP_ID else None
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


if __name__ == '__main__':
    print("=" * 60)
    print("🚀 飞书机器人服务启动中...")
    print("=" * 60)
    print(f"应用ID: {FEISHU_APP_ID[:10]}..." if FEISHU_APP_ID else "⚠️ 未配置 FEISHU_APP_ID")
    print(f"多维表格: {APP_TOKEN}/{TABLE_ID}")
    print(f"Webhook地址: http://118.145.228.33:5000/webhook")
    print("=" * 60)
    
    # 尝试获取访问令牌
    try:
        token = token_manager.get_tenant_access_token()
        print(f"✅ 访问令牌获取成功")
    except Exception as e:
        print(f"⚠️ 访问令牌获取失败: {e}")
        print("请检查 FEISHU_APP_ID 和 FEISHU_APP_SECRET 是否正确配置")
    
    print("=" * 60)
    print("服务已启动，监听端口 5000")
    print("=" * 60)
    
    app.run(host='0.0.0.0', port=5000, debug=False)
