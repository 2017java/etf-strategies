from fastapi import APIRouter
from datetime import date
import pandas as pd

from app.models import (
    BacktestRequest, BacktestCompareRequest,
    BacktestResultResponse, TradeItem, SignalItem, NavPoint,
    StrategyListResponse, StrategyInfo,
    BenchmarkListResponse, BenchmarkInfo,
)
from app.datasource import create_data_store
from app.backtest.engine import BacktestEngine
from app.strategies.l1_trend_score import L1TrendScore
from app.strategies.l2_multi_factor import L2MultiFactor
from app.strategies.l3_multi_factor_rsrs import L3MultiFactorRSRS


router = APIRouter(prefix="/api/backtest", tags=["backtest"])

DEFAULT_ETF_CODES = [
    "510300",  # 沪深300ETF
    "510500",  # 中证500ETF
    "510180",  # 上证180ETF
    "510050",  # 上证50ETF
    "512100",  # 中证1000ETF
    "159915",  # 创业板ETF
    "510900",  # H股ETF
    "513100",  # 纳指ETF
    "513500",  # 标普500ETF
    "518880",  # 黄金ETF
    "511010",  # 国债ETF
    "512880",  # 证券ETF
    "512660",  # 军工ETF
    "512690",  # 酒ETF
    "512170",  # 医疗ETF
    "515050",  # 5G ETF
    "515030",  # 新能源车ETF
    "512760",  # 半导体ETF
    "515790",  # 光伏ETF
    "159995",  # 芯片ETF
]


STRATEGY_REGISTRY = {
    "l1": {
        "name": "L1 趋势评分 TOP1",
        "description": "对每只ETF用最近N日K线做对数价格线性回归，取年化收益×R²最高的1只ETF。日频调仓。",
        "rebalance_freq": "daily",
    },
    "l2": {
        "name": "L2 多因子 TOP5",
        "description": "综合动量(30%)、量能(20%)、反转(15%)、估值复合(25%)、波动率倒数(10%)，每月初选综合评分最高的5只ETF等权配置。",
        "rebalance_freq": "monthly",
    },
    "l3": {
        "name": "L3 多因子 + RSRS 择时",
        "description": "在 L2 多因子基础上，加入 RSRS（阻力支撑相对强度）择时：大盘弱势时空仓，同时剔除 RSRS 弱的个股。",
        "rebalance_freq": "monthly",
    },
}


BENCHMARK_REGISTRY: dict[str, str] = {
    code: name
    for code, name in [
        ("510300", "沪深300ETF"),
        ("510500", "中证500ETF"),
        ("510180", "上证180ETF"),
        ("510050", "上证50ETF"),
        ("512100", "中证1000ETF"),
        ("159915", "创业板ETF"),
        ("510900", "H股ETF"),
        ("513100", "纳指ETF"),
        ("513500", "标普500ETF"),
        ("518880", "黄金ETF"),
        ("511010", "国债ETF"),
        ("512880", "证券ETF"),
        ("512660", "军工ETF"),
        ("512690", "酒ETF"),
        ("512170", "医疗ETF"),
        ("515050", "5G ETF"),
        ("515030", "新能源车ETF"),
        ("512760", "半导体ETF"),
        ("515790", "光伏ETF"),
        ("159995", "芯片ETF"),
    ]
}


_DEFAULT_CODES_SET = set(DEFAULT_ETF_CODES)
_MISSING = [c for c in _DEFAULT_CODES_SET if c not in BENCHMARK_REGISTRY]
assert not _MISSING, f"BENCHMARK_REGISTRY 缺少以下默认 ETF: {_MISSING}"


def _build_strategy(strategy_id: str, codes: list[str] | None):
    sid = strategy_id.lower().strip()
    if sid == "l1":
        return L1TrendScore(codes=codes)
    if sid == "l2":
        return L2MultiFactor(codes=codes)
    if sid == "l3":
        return L3MultiFactorRSRS(codes=codes)
    raise ValueError(f"未知策略: {strategy_id}")


def _run_backtest(req: BacktestRequest) -> BacktestResultResponse:
    codes = req.codes or DEFAULT_ETF_CODES
    all_codes = list(set(codes) | {req.benchmark_code})
    if req.strategy.lower() == "l3":
        all_codes = list(set(all_codes) | {"510300"})

    store = create_data_store()
    store.ensure(all_codes, req.start_date, req.end_date)
    ohlcv = store.load(all_codes, req.start_date, req.end_date)
    if ohlcv.empty:
        return BacktestResultResponse(
            strategy=req.strategy,
            start=req.start_date, end=req.end_date,
            cost_rate=req.cost_rate,
            nav=[], benchmark_nav=[],
            trades=[], signals=[], metrics={},
            status="error", message="没有可用的历史数据",
        )

    strategy = _build_strategy(req.strategy, codes)
    calendar = store.get_trading_calendar(req.start_date, req.end_date)
    signals = strategy.generate_signals(ohlcv, calendar)

    engine = BacktestEngine(initial_cash=req.initial_cash, cost_rate=req.cost_rate)
    result = engine.run(signals, ohlcv, benchmark_code=req.benchmark_code)

    nav_points = [
        NavPoint(date=idx.date() if hasattr(idx, "date") else idx, nav=float(val))
        for idx, val in result.nav.items()
    ]
    bench_points = [
        NavPoint(date=idx.date() if hasattr(idx, "date") else idx, nav=float(val))
        for idx, val in result.benchmark_nav.items()
    ]

    trade_items = [
        TradeItem(
            date=t.date, code=t.code, action=t.action,
            price=float(t.price), shares=int(t.shares),
            amount=float(t.amount), reason=t.reason,
        )
        for t in result.trades
    ]

    signal_items = [
        SignalItem(
            date=s.date, target_codes=list(s.target_codes),
            reason=s.reason, scores=s.scores or None,
        )
        for s in signals
    ]

    return BacktestResultResponse(
        strategy=req.strategy,
        start=result.start, end=result.end,
        cost_rate=result.cost_rate,
        nav=nav_points, benchmark_nav=bench_points,
        trades=trade_items, signals=signal_items,
        metrics=result.metrics,
        status="ok",
    )


@router.get("/strategies", response_model=StrategyListResponse)
def list_strategies():
    return StrategyListResponse(
        strategies=[
            StrategyInfo(id=k, name=v["name"], description=v["description"], rebalance_freq=v["rebalance_freq"])
            for k, v in STRATEGY_REGISTRY.items()
        ]
    )


@router.get("/default-codes")
def get_default_codes():
    return {"codes": DEFAULT_ETF_CODES}


@router.get("/benchmarks", response_model=BenchmarkListResponse)
def list_benchmarks():
    return BenchmarkListResponse(
        benchmarks=[
            BenchmarkInfo(code=code, name=name)
            for code, name in BENCHMARK_REGISTRY.items()
        ]
    )


@router.post("/run", response_model=BacktestResultResponse)
def run_backtest(req: BacktestRequest):
    try:
        return _run_backtest(req)
    except ValueError as e:
        return BacktestResultResponse(
            strategy=req.strategy,
            start=req.start_date, end=req.end_date,
            cost_rate=req.cost_rate,
            nav=[], benchmark_nav=[],
            trades=[], signals=[], metrics={},
            status="error", message=str(e),
        )
    except Exception as e:
        return BacktestResultResponse(
            strategy=req.strategy,
            start=req.start_date, end=req.end_date,
            cost_rate=req.cost_rate,
            nav=[], benchmark_nav=[],
            trades=[], signals=[], metrics={},
            status="error", message=f"回测失败: {e}",
        )


@router.post("/compare")
def compare_strategies(req: BacktestCompareRequest):
    results = {}
    for sid in req.strategies:
        sub_req = BacktestRequest(
            strategy=sid, codes=req.codes,
            start_date=req.start_date, end_date=req.end_date,
            initial_cash=req.initial_cash, cost_rate=req.cost_rate,
            benchmark_code=req.benchmark_code,
        )
        results[sid] = _run_backtest(sub_req)
    return {"results": results}
