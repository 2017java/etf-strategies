"""
飞书长连接客户端
使用 WebSocket 长连接接收飞书消息事件
"""
import json
import time
import re
from typing import Optional, Callable, Dict, Any
import lark_oapi as lark

from config.config import table_config


class FeishuLongPollClient:
    def __init__(
        self,
        app_id: str,
        app_secret: str,
        message_handler: Optional[Callable] = None
    ):
        self.app_id = app_id
        self.app_secret = app_secret
        self.message_handler = message_handler
        self._client: Optional[lark.ws.Client] = None
        self._event_handler = None
        self._is_running = False
        
    def _build_event_handler(self) -> lark.EventDispatcherHandler:
        handler = lark.EventDispatcherHandler.builder("", "") \
            .register_p2_im_message_receive_v1(self._on_message_receive) \
            .build()
        return handler
    
    def _on_message_receive(self, data: lark.im.v1.P2ImMessageReceiveV1) -> None:
        try:
            message = data.event.message
            chat_id = message.chat_id
            message_type = message.message_type
            content_str = message.content
            sender_id = data.event.sender.sender_id.user_id
            
            print(f"\n{'='*50}")
            print(f"[收到消息] chat_id: {chat_id}")
            print(f"[发送者] user_id: {sender_id}")
            print(f"[消息类型] {message_type}")
            
            if message_type != "text":
                print(f"[跳过] 非文本消息")
                return
            
            content = json.loads(content_str)
            user_text = content.get("text", "")
            
            mentions = message.mentions or []
            is_mentioned = False
            for mention in mentions:
                # 处理 UserId 对象，尝试获取用户ID
                user_id = None
                if hasattr(mention.id, 'root_id'):
                    user_id = mention.id.root_id
                elif hasattr(mention.id, 'user_id'):
                    user_id = mention.id.user_id
                else:
                    user_id = str(mention.id)
                
                if mention.key == f"@_user_{user_id}":
                    user_text = user_text.replace(mention.key, "").strip()
                    is_mentioned = True
                    break
            
            if not is_mentioned:
                if not re.search(r'@[\u4e00-\u9fa5\w]+', user_text):
                    print(f"[跳过] 未@机器人")
                    return
            
            print(f"[消息内容] {user_text}")
            
            if self.message_handler:
                self.message_handler(
                    chat_id=chat_id,
                    user_id=sender_id,
                    message=user_text
                )
                
        except Exception as e:
            print(f"[错误] 处理消息失败: {e}")
            import traceback
            traceback.print_exc()
    
    def start(self):
        print("\n" + "="*50)
        print("飞书长连接客户端启动中...")
        print("="*50)
        print(f"App ID: {self.app_id[:15]}...")
        print("="*50)
        
        self._event_handler = self._build_event_handler()
        
        self._client = lark.ws.Client(
            self.app_id,
            self.app_secret,
            event_handler=self._event_handler,
            log_level=lark.LogLevel.INFO
        )
        
        self._is_running = True
        print("\n正在建立长连接...")
        print("等待飞书消息中... (按 Ctrl+C 退出)\n")
        
        try:
            self._client.start()
        except KeyboardInterrupt:
            print("\n\n收到退出信号，正在停止...")
            self.stop()
        except Exception as e:
            print(f"\n[错误] 长连接异常: {e}")
            self._is_running = False
    
    def stop(self):
        self._is_running = False
        print("飞书长连接客户端已停止")


class FeishuMessageSender:
    def __init__(self, app_id: str, app_secret: str):
        self.app_id = app_id
        self.app_secret = app_secret
        self._token: Optional[str] = None
        self._token_expire: int = 0
    
    def _get_token(self) -> str:
        """获取飞书访问令牌"""
        import time
        import requests
        
        if self._token and time.time() < self._token_expire:
            return self._token
        
        url = "https://open.feishu.cn/open-apis/auth/v3/app_access_token/internal"
        headers = {"Content-Type": "application/json"}
        data = {
            "app_id": self.app_id,
            "app_secret": self.app_secret
        }
        
        try:
            response = requests.post(url, headers=headers, json=data)
            result = response.json()
            if result.get("code") == 0:
                self._token = result.get("app_access_token")
                self._token_expire = time.time() + result.get("expire", 3600)
                return self._token
            else:
                print(f"[获取token失败] {result.get('msg')}")
                return None
        except Exception as e:
            print(f"[获取token异常] {e}")
            return None
    
    def send_text(self, chat_id: str, text: str) -> bool:
        try:
            token = self._get_token()
            if not token:
                return False
            
            # 检查 chat_id 是否有效
            if not chat_id or not chat_id.startswith('oc_'):
                print(f"[发送失败] 无效的 chat_id: {chat_id}")
                return False
            
            url = "https://open.feishu.cn/open-apis/im/v1/messages"
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {token}"
            }
            
            # 构建消息内容
            message_content = {
                "text": text
            }
            
            data = {
                "receive_id_type": "chat_id",
                "receive_id": chat_id,
                "msg_type": "text",
                "content": json.dumps(message_content)
            }
            
            print(f"[发送消息] 准备发送到 {chat_id}")
            print(f"[发送消息] 内容: {text[:50]}...")
            
            import requests
            response = requests.post(url, headers=headers, json=data, timeout=10)
            result = response.json()
            
            if result.get("code") == 0:
                print(f"[发送成功] 消息已发送到 {chat_id}")
                return True
            else:
                print(f"[发送失败] code: {result.get('code')}, msg: {result.get('msg')}")
                print(f"[请求数据] {data}")
                print(f"[响应数据] {result}")
                return False
                
        except Exception as e:
            print(f"[发送异常] {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def send_card(self, chat_id: str, card_content: Dict[str, Any]) -> bool:
        try:
            token = self._get_token()
            if not token:
                return False
            
            url = "https://open.feishu.cn/open-apis/im/v1/messages"
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {token}"
            }
            data = {
                "receive_id_type": "chat_id",
                "receive_id": chat_id,
                "msg_type": "interactive",
                "content": json.dumps(card_content)
            }
            
            import requests
            response = requests.post(url, headers=headers, json=data)
            result = response.json()
            
            if result.get("code") == 0:
                print(f"[发送成功] 卡片消息已发送到 {chat_id}")
                return True
            else:
                print(f"[发送失败] code: {result.get('code')}, msg: {result.get('msg')}")
                return False
                
        except Exception as e:
            print(f"[发送异常] {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def reply_text(self, chat_id: str, text: str) -> bool:
        return self.send_text(chat_id, text)
