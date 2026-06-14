from datetime import time
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(env_path)

# ETF代码池
ETF_POOL = {
    "宽基ETF": [
        {"code": "510300", "name": "沪深300ETF"},
        {"code": "510500", "name": "中证500ETF"},
        {"code": "512100", "name": "中证1000ETF"},
        {"code": "159531", "name": "中证2000ETF"},
        {"code": "159915", "name": "创业板ETF"},
        {"code": "560050", "name": "A50ETF"},
        {"code": "159901", "name": "深证100ETF"},
        {"code": "588030", "name": "科创100ETF博时"},
        {"code": "159920", "name": "恒生ETF"},
        {"code": "588000", "name": "科创50ETF"},
    ],
    "行业ETF": [
        {"code": "159739", "name": "云计算ETF鹏华"},
        {"code": "159669", "name": "食品饮料ETF"},
        {"code": "159732", "name": "消费电子ETF"},
        {"code": "588200", "name": "科创芯片ETF嘉实"},
        {"code": "159806", "name": "新能源车ETF"},
        {"code": "515120", "name": "创新药ETF"},
        {"code": "562510", "name": "旅游ETF华夏"},
        {"code": "512170", "name": "医疗ETF"},
        {"code": "159857", "name": "光伏ETF"},
        {"code": "159928", "name": "消费ETF"},
        {"code": "512690", "name": "酒ETF"},
        {"code": "159755", "name": "电池ETF"},
        {"code": "159222", "name": "自由现金流ETF"},
        {"code": "515880", "name": "通信ETF"},
        {"code": "512630", "name": "卫星ETF"},
        {"code": "512200", "name": "房地产ETF"},
        {"code": "512660", "name": "军工ETF"},
        {"code": "159819", "name": "人工智能ETF"},
        {"code": "159995", "name": "芯片ETF"},
        {"code": "515220", "name": "煤炭ETF"},
        {"code": "510410", "name": "资源ETF"},
        {"code": "159516", "name": "半导体设备ETF"},
        {"code": "159309", "name": "油气ETF"},
        {"code": "515070", "name": "人工智能AIETF"},
        {"code": "159611", "name": "电力ETF"},
        {"code": "512400", "name": "有色金属ETF"},
        {"code": "517520", "name": "黄金ETF"},
        {"code": "159608", "name": "稀有金属ETF"},
        {"code": "159870", "name": "化工ETF"},
        {"code": "159326", "name": "电网设备ETF华夏"},
        {"code": "159566", "name": "储能电池ETF"},
        {"code": "159770", "name": "机器人ETF"},
        {"code": "512880", "name": "证券ETF"},
    ],
}

# 权重配置
WEIGHTS = {
    "current_change": 2,
    "two_day_change": 3,
    "volume_expand": 0.5,
    "change_30d": 1,  # 30日涨跌幅标准分（0~50分映射）
}

# 交易时段配置（北京时间）
TRADE_MORNING_START = time(9, 30)
TRADE_MORNING_END = time(11, 30)
TRADE_AFTERNOON_START = time(13, 0)
TRADE_AFTERNOON_END = time(15, 0)

# 数据缓存时间（秒）
CACHE_TTL = 300

# LLM配置（从环境变量读取）
LLM_API_KEY = ""
LLM_API_BASE = "https://api.openai.com/v1"
LLM_MODEL = "gpt-4o-mini"
