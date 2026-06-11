from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import date


class ETFItem(BaseModel):
    code: str
    name: str
    category: str
    current_price: float
    current_change_pct: float
    two_day_change_pct: float
    volume_expand_pct: float
    composite_score: float
    volume: int
    ma20: Optional[float] = None
    ma20_confirmed: Optional[bool] = None
    change_30d: Optional[float] = None
    change_30d_score: Optional[float] = None
    data_date: Optional[str] = None
    data_type: Optional[str] = None


class QuantRecommend(BaseModel):
    rank: int
    code: str
    name: str
    category: str
    current_change_pct: float
    two_day_change_pct: float
    volume_expand_pct: float
    ma20: Optional[float] = None
    ma20_confirmed: Optional[bool] = None
    change_30d: Optional[float] = None
    change_30d_score: Optional[float] = None
    composite_score: float


class LLMRecommend(BaseModel):
    rank: int
    code: str
    name: str
    category: str
    reason: str
    source: str = "fallback"


class DashboardData(BaseModel):
    etf_list: List[ETFItem]
    quant_top5: List[QuantRecommend]
    llm_top5: List[LLMRecommend]
    data_time: str
    is_trading_time: bool
    data_type: str = "closed"


class RefreshResponse(BaseModel):
    success: bool
    message: str
    data: Optional[DashboardData] = None


# ── 回测 API 模型 ────────────────────────────────────────────

class BacktestRequest(BaseModel):
    strategy: str
    codes: Optional[List[str]] = None
    start_date: date
    end_date: date
    initial_cash: float = 1_000_000.0
    cost_rate: float = 0.0002
    benchmark_code: str = "510300"


class BacktestCompareRequest(BaseModel):
    strategies: List[str]
    codes: Optional[List[str]] = None
    start_date: date
    end_date: date
    initial_cash: float = 1_000_000.0
    cost_rate: float = 0.0002
    benchmark_code: str = "510300"


class TradeItem(BaseModel):
    date: date
    code: str
    action: str
    price: float
    shares: int
    amount: float
    reason: str


class SignalItem(BaseModel):
    date: date
    target_codes: List[str]
    reason: str
    scores: Optional[Dict[str, float]] = None


class NavPoint(BaseModel):
    date: date
    nav: float


class BacktestResultResponse(BaseModel):
    strategy: str
    start: date
    end: date
    cost_rate: float
    nav: List[NavPoint]
    benchmark_nav: List[NavPoint]
    trades: List[TradeItem]
    signals: List[SignalItem]
    metrics: Dict[str, float]
    status: str = "ok"
    message: Optional[str] = None


class StrategyInfo(BaseModel):
    id: str
    name: str
    description: str
    rebalance_freq: str


class StrategyListResponse(BaseModel):
    strategies: List[StrategyInfo]
