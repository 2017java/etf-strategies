import json
import logging
from datetime import date, timedelta
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, Query
from pydantic import BaseModel

from app.config import BENCHMARK_REGISTRY, DEFAULT_ETF_CODES, BACKTEST_RUNS_DIR
from app.datasource import create_data_store
from app.backtest.engine import BacktestEngine
from app.strategies.l1_trend_score import L1TrendScore
from app.strategies.l2_multi_factor import L2MultiFactor
from app.strategies.l3_multi_factor_rsrs import L3MultiFactorRSRS
from app.models import BenchmarkInfo, BenchmarkListResponse

_log = logging.getLogger("app.backtest_routes")

router = APIRouter(prefix="/api/backtest", tags=["backtest"])

STRATEGY_REGISTRY = {
    "l1": {"name": "L1趋势动量", "class": L1TrendScore},
    "l2": {"name": "L2多因子", "class": L2MultiFactor},
    "l3": {"name": "L3多因子+RSRS", "class": L3MultiFactorRSRS},
}

assert set(BENCHMARK_REGISTRY.keys()) >= set(DEFAULT_ETF_CODES), (
    "BENCHMARK_REGISTRY must cover all DEFAULT_ETF_CODES"
)


class BacktestRequest(BaseModel):
    start_date: str
    end_date: str
    strategy_ids: List[str] = ["l1"]
    codes: List[str] = DEFAULT_ETF_CODES
    benchmark_code: str = "510300"
    initial_cash: float = 1_000_000.0
    cost_rate: float = 0.0002


class BacktestRunResponse(BaseModel):
    success: bool
    message: str = ""
    run_id: str = ""
    results: dict = {}


@router.get("/strategies")
def list_strategies():
    result = []
    for sid, info in STRATEGY_REGISTRY.items():
        result.append({"id": sid, "name": info["name"]})
    return result


@router.get("/benchmarks", response_model=BenchmarkListResponse)
def list_benchmarks():
    items = [BenchmarkInfo(code=code, name=name) for code, name in BENCHMARK_REGISTRY.items()]
    return BenchmarkListResponse(benchmarks=items)


@router.get("/default-codes")
def get_default_codes():
    return DEFAULT_ETF_CODES


@router.post("/run", response_model=BacktestRunResponse)
def run_backtest(req: BacktestRequest):
    try:
        start = date.fromisoformat(req.start_date)
        end = date.fromisoformat(req.end_date)
    except ValueError as e:
        return BacktestRunResponse(success=False, message=f"日期格式错误: {e}")

    store = create_data_store()
    store.ensure(req.codes + [req.benchmark_code], start, end)
    ohlcv = store.load(req.codes + [req.benchmark_code], start, end)

    if ohlcv.empty:
        return BacktestRunResponse(success=False, message="无法获取OHLCV数据")

    if isinstance(ohlcv.index, pd.MultiIndex):
        calendar = sorted(set(ohlcv.index.get_level_values("date")))
    else:
        calendar = sorted(set(ohlcv["date"]))

    results = {}
    for sid in req.strategy_ids:
        if sid not in STRATEGY_REGISTRY:
            continue
        info = STRATEGY_REGISTRY[sid]
        cls = info["class"]

        if sid == "l3":
            strategy = cls(codes=req.codes, benchmark_code=req.benchmark_code)
        else:
            strategy = cls(codes=req.codes)

        signals = strategy.generate_signals(ohlcv, calendar)
        engine = BacktestEngine(initial_cash=req.initial_cash, cost_rate=req.cost_rate)
        result = engine.run(signals, ohlcv, benchmark_code=req.benchmark_code)

        results[sid] = {
            "strategy_name": info["name"],
            "metrics": result.metrics,
            "nav": result.nav.to_dict(),
            "benchmark_nav": result.benchmark_nav.to_dict(),
            "trades": result.trades,
            "signal_count": len(signals),
        }

    run_id = date.today().strftime("%Y%m%d") + f"_{len(req.strategy_ids)}"
    run_data = {
        "run_id": run_id,
        "params": req.model_dump(),
        "results": results,
    }

    run_path = BACKTEST_RUNS_DIR / f"{run_id}.json"
    try:
        run_path.write_text(
            json.dumps(run_data, ensure_ascii=False, indent=2, default=str),
            encoding="utf-8",
        )
    except Exception as e:
        _log.warning("failed to save backtest run: %s", e)

    return BacktestRunResponse(
        success=True,
        message="回测完成",
        run_id=run_id,
        results=results,
    )


import pandas as pd
