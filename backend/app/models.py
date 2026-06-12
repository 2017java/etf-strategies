from pydantic import BaseModel
from typing import List, Optional


class ETFItem(BaseModel):
    code: str
    name: str
    current_price: float = 0.0
    change_pct: float = 0.0
    volume: float = 0.0
    amount: float = 0.0
    turnover_rate: float = 0.0
    pe_ttm: Optional[float] = None
    pb: Optional[float] = None
    ma5: Optional[float] = None
    ma10: Optional[float] = None
    ma20: Optional[float] = None
    ma60: Optional[float] = None
    trend_score: float = 0.0
    momentum_5d: float = 0.0
    momentum_10d: float = 0.0
    momentum_20d: float = 0.0
    volatility_20d: float = 0.0
    volume_ratio: float = 0.0
    quant_score: float = 0.0
    data_date: str = ""
    data_type: str = "closed"


class QuantRecommend(BaseModel):
    code: str
    name: str
    current_price: float = 0.0
    change_pct: float = 0.0
    quant_score: float = 0.0
    trend_score: float = 0.0
    momentum_5d: float = 0.0
    momentum_20d: float = 0.0
    volume_ratio: float = 0.0


class LLMRecommend(BaseModel):
    code: str
    name: str
    current_price: float = 0.0
    change_pct: float = 0.0
    reason: str = ""
    source: str = "fallback"


class DashboardData(BaseModel):
    etf_list: List[ETFItem] = []
    quant_top5: List[QuantRecommend] = []
    llm_top5: List[LLMRecommend] = []
    data_time: str = ""
    is_trading_time: bool = False
    data_type: str = "closed"


class RefreshResponse(BaseModel):
    success: bool
    message: str = ""
    data: Optional[DashboardData] = None


class BenchmarkInfo(BaseModel):
    code: str
    name: str


class BenchmarkListResponse(BaseModel):
    benchmarks: List[BenchmarkInfo]
