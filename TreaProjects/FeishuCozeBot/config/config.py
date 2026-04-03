"""
配置模块
管理所有配置信息
"""
import os
from dataclasses import dataclass, field
from typing import Optional
import json
from pathlib import Path


@dataclass
class FeishuConfig:
    app_id: str = ""
    app_secret: str = ""
    default_app_token: str = ""
    default_table_id: str = ""


@dataclass
class CozeConfig:
    api_url: str = ""
    api_token: str = ""
    bot_id: str = ""


@dataclass
class AppConfig:
    feishu: FeishuConfig = field(default_factory=FeishuConfig)
    coze: CozeConfig = field(default_factory=CozeConfig)
    
    @classmethod
    def from_env(cls) -> "AppConfig":
        config = cls()
        config.feishu.app_id = os.getenv("FEISHU_APP_ID", "")
        config.feishu.app_secret = os.getenv("FEISHU_APP_SECRET", "")
        config.feishu.default_app_token = os.getenv("FEISHU_DEFAULT_APP_TOKEN", "")
        config.feishu.default_table_id = os.getenv("FEISHU_DEFAULT_TABLE_ID", "")
        
        config.coze.api_url = os.getenv("COZE_API_URL", "")
        config.coze.api_token = os.getenv("COZE_API_TOKEN", "")
        config.coze.bot_id = os.getenv("COZE_BOT_ID", "")
        
        return config
    
    @classmethod
    def from_file(cls, file_path: str = "config.json") -> "AppConfig":
        config = cls()
        path = Path(file_path)
        if path.exists():
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
                if "feishu" in data:
                    config.feishu = FeishuConfig(**data["feishu"])
                if "coze" in data:
                    config.coze = CozeConfig(**data["coze"])
        return config
    
    def save_to_file(self, file_path: str = "config.json"):
        data = {
            "feishu": {
                "app_id": self.feishu.app_id,
                "app_secret": self.feishu.app_secret,
                "default_app_token": self.feishu.default_app_token,
                "default_table_id": self.feishu.default_table_id
            },
            "coze": {
                "api_url": self.coze.api_url,
                "api_token": self.coze.api_token,
                "bot_id": self.coze.bot_id
            }
        }
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)


class TableConfigManager:
    _instance = None
    _current_app_token: str = ""
    _current_table_id: str = ""
    _default_app_token: str = ""
    _default_table_id: str = ""
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def init(self, default_app_token: str, default_table_id: str):
        self._default_app_token = default_app_token
        self._default_table_id = default_table_id
        self._current_app_token = default_app_token
        self._current_table_id = default_table_id
    
    @property
    def app_token(self) -> str:
        return self._current_app_token or self._default_app_token
    
    @property
    def table_id(self) -> str:
        return self._current_table_id or self._default_table_id
    
    def set_table(self, app_token: str, table_id: str):
        self._current_app_token = app_token
        self._current_table_id = table_id
    
    def reset_to_default(self):
        self._current_app_token = self._default_app_token
        self._current_table_id = self._default_table_id
    
    def get_config_info(self) -> dict:
        return {
            "current_app_token": self._current_app_token,
            "current_table_id": self._current_table_id,
            "default_app_token": self._default_app_token,
            "default_table_id": self._default_table_id,
            "is_using_default": (self._current_app_token == self._default_app_token and 
                                 self._current_table_id == self._default_table_id)
        }


table_config = TableConfigManager()
