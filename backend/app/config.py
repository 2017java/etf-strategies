from pathlib import Path
from dotenv import load_dotenv
import os

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "data"
OHLCV_DIR = DATA_DIR / "ohlcv"
BACKTEST_RUNS_DIR = DATA_DIR / "backtest_runs"

OHLCV_DIR.mkdir(parents=True, exist_ok=True)
BACKTEST_RUNS_DIR.mkdir(parents=True, exist_ok=True)

ETF_POOL = [
    {"code": "510050", "name": "上证50ETF"},
    {"code": "510300", "name": "沪深300ETF"},
    {"code": "510500", "name": "中证500ETF"},
    {"code": "510180", "name": "180ETF"},
    {"code": "510900", "name": "H股ETF"},
    {"code": "511010", "name": "国债ETF"},
    {"code": "512100", "name": "中证1000ETF"},
    {"code": "512170", "name": "医疗ETF"},
    {"code": "512660", "name": "军工ETF"},
    {"code": "512690", "name": "白酒ETF"},
    {"code": "512760", "name": "半导体ETF"},
    {"code": "512880", "name": "证券ETF"},
    {"code": "513100", "name": "纳指ETF"},
    {"code": "513500", "name": "标普500ETF"},
    {"code": "515030", "name": "新能源车ETF"},
    {"code": "515050", "name": "5GETF"},
    {"code": "515790", "name": "光伏ETF"},
    {"code": "518880", "name": "黄金ETF"},
    {"code": "159915", "name": "创业板ETF"},
    {"code": "159995", "name": "芯片ETF"},
]

DEFAULT_ETF_CODES = [e["code"] for e in ETF_POOL]

BENCHMARK_REGISTRY = {
    "510300": "沪深300ETF",
    "510500": "中证500ETF",
    "510050": "上证50ETF",
    "159915": "创业板ETF",
    "512100": "中证1000ETF",
    "510180": "180ETF",
    "512880": "证券ETF",
    "512660": "军工ETF",
    "512170": "医疗ETF",
    "512690": "白酒ETF",
    "512760": "半导体ETF",
    "515030": "新能源车ETF",
    "515050": "5GETF",
    "515790": "光伏ETF",
    "518880": "黄金ETF",
    "513100": "纳指ETF",
    "513500": "标普500ETF",
    "510900": "H股ETF",
    "511010": "国债ETF",
    "159995": "芯片ETF",
}

LLM_API_KEY = os.getenv("LLM_API_KEY", "")
LLM_API_BASE = os.getenv("LLM_API_BASE", "")
LLM_MODEL = os.getenv("LLM_MODEL", "")

TUSHARE_TOKEN = os.getenv("TUSHARE_TOKEN", "")
TUSHARE_API = os.getenv("TUSHARE_API", "http://101.35.233.113:8020/")

DATA_SOURCE = os.getenv("ETF_DATA_SOURCE", "akshare")
