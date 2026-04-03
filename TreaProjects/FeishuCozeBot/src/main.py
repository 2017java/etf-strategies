"""
飞书 + Coze 智能体机器人
主程序入口
"""
import os
import sys
import json
import re
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from config.config import AppConfig, table_config
from src.feishu_client import FeishuLongPollClient, FeishuMessageSender
from src.coze_client import CozeClient


class FeishuCozeBot:
    def __init__(self, config: AppConfig):
        self.config = config
        self.feishu_client = None
        self.message_sender = None
        self.coze_client = None
        
        self._init_components()
    
    def _init_components(self):
        table_config.init(
            default_app_token=self.config.feishu.default_app_token,
            default_table_id=self.config.feishu.default_table_id
        )
        
        self.message_sender = FeishuMessageSender(
            app_id=self.config.feishu.app_id,
            app_secret=self.config.feishu.app_secret
        )
        
        self.coze_client = CozeClient(
            api_url=self.config.coze.api_url,
            api_token=self.config.coze.api_token,
            bot_id=self.config.coze.bot_id
        )
        
        self.feishu_client = FeishuLongPollClient(
            app_id=self.config.feishu.app_id,
            app_secret=self.config.feishu.app_secret,
            message_handler=self._handle_message
        )
    
    def _handle_message(self, chat_id: str, user_id: str, message: str):
        print(f"\n[处理消息] 开始处理...")
        
        if self._try_handle_config_command(chat_id, message):
            return
        
        self.message_sender.send_text(chat_id, "正在处理中，请稍候...")
        
        enhanced_message = self._enhance_query(message)
        
        response = self.coze_client.chat(
            query=enhanced_message,
            user_id=user_id
        )
        
        if response.success:
            reply_text = response.content
            if len(reply_text) > 4000:
                chunks = self._split_long_message(reply_text)
                for chunk in chunks:
                    self.message_sender.send_text(chat_id, chunk)
            else:
                self.message_sender.send_text(chat_id, reply_text)
        else:
            self.message_sender.send_text(
                chat_id,
                f"处理失败: {response.error}"
            )
    
    def _try_handle_config_command(self, chat_id: str, message: str) -> bool:
        message = message.strip()
        
        if "当前配置" in message or "查看配置" in message:
            config_info = table_config.get_config_info()
            reply = f"""当前多维表格配置:
App Token: {config_info['current_app_token'][:20]}...
Table ID: {config_info['current_table_id']}
使用默认配置: {'是' if config_info['is_using_default'] else '否'}"""
            self.message_sender.send_text(chat_id, reply)
            return True
        
        set_table_pattern = r"设置表格\s+([^\s]+)\s+([^\s]+)"
        match = re.search(set_table_pattern, message)
        if match:
            app_token = match.group(1)
            table_id = match.group(2)
            table_config.set_table(app_token, table_id)
            self.message_sender.send_text(
                chat_id,
                f"已更新多维表格配置:\nApp Token: {app_token[:20]}...\nTable ID: {table_id}"
            )
            return True
        
        if "重置配置" in message or "恢复默认" in message:
            table_config.reset_to_default()
            config_info = table_config.get_config_info()
            self.message_sender.send_text(
                chat_id,
                f"已恢复默认配置:\nApp Token: {config_info['default_app_token'][:20]}...\nTable ID: {config_info['default_table_id']}"
            )
            return True
        
        return False
    
    def _enhance_query(self, query: str) -> str:
        config_info = table_config.get_config_info()
        
        context = f"""
[系统上下文信息]
当前多维表格配置:
- App Token: {config_info['current_app_token']}
- Table ID: {config_info['current_table_id']}

请使用上述配置进行数据操作。
"""
        
        return context + query
    
    def _split_long_message(self, text: str, max_length: int = 4000) -> list:
        chunks = []
        while len(text) > max_length:
            split_pos = text[:max_length].rfind('\n')
            if split_pos == -1:
                split_pos = max_length
            chunks.append(text[:split_pos])
            text = text[split_pos:].strip()
        if text:
            chunks.append(text)
        return chunks
    
    def start(self):
        print("\n" + "="*60)
        print("飞书 + Coze 智能体机器人")
        print("="*60)
        print(f"飞书 App ID: {self.config.feishu.app_id[:15]}...")
        print(f"Coze Bot ID: {self.config.coze.bot_id}")
        print(f"默认多维表格: {self.config.feishu.default_app_token[:15]}.../{self.config.feishu.default_table_id}")
        print("="*60)
        print("\n使用说明:")
        print("  - 在飞书群中 @机器人 发送消息即可")
        print("  - 发送 '当前配置' 查看多维表格配置")
        print("  - 发送 '设置表格 <app_token> <table_id>' 更换表格")
        print("  - 发送 '重置配置' 恢复默认表格")
        print("="*60)
        
        self.feishu_client.start()


def load_config() -> AppConfig:
    env_path = Path(__file__).parent.parent / ".env"
    if env_path.exists():
        print("从 .env 文件加载配置...")
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, value = line.split("=", 1)
                    os.environ[key.strip()] = value.strip().strip('"').strip("'")
    
    config_path = Path(__file__).parent.parent / "config.json"
    if config_path.exists():
        print("从 config.json 文件加载配置...")
        return AppConfig.from_file(str(config_path))
    
    print("从环境变量加载配置...")
    return AppConfig.from_env()


def main():
    config = load_config()
    
    if not config.feishu.app_id or not config.feishu.app_secret:
        print("错误: 请配置飞书 App ID 和 App Secret")
        print("可以通过以下方式配置:")
        print("  1. 创建 .env 文件")
        print("  2. 创建 config.json 文件")
        print("  3. 设置环境变量")
        sys.exit(1)
    
    if not config.coze.api_url or not config.coze.api_token or not config.coze.bot_id:
        print("错误: 请配置 Coze API 信息")
        print("需要配置: COZE_API_URL, COZE_API_TOKEN, COZE_BOT_ID")
        sys.exit(1)
    
    bot = FeishuCozeBot(config)
    bot.start()


if __name__ == "__main__":
    main()
