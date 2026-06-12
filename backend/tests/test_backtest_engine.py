import pandas as pd
from datetime import date, timedelta
from app.backtest.engine import BacktestEngine
from app.strategies.base import RebalanceSignal

def _make_ohlcv(closes, codes, start):
    dates = [start + timedelta(days=i) for i in range(len(closes))]
    rows = []
    for code in codes:
        for d, c in zip(dates, closes):
            rows.append({
                "date": d, "code": code,
                "open": c, "high": c, "low": c, "close": c, "volume": 10000,
            })
    return pd.DataFrame(rows).set_index(["date", "code"]).sort_index()

def test_engine_runs_with_single_holding():
    closes = [1.0 + 0.001 * i for i in range(50)]
    ohlcv = _make_ohlcv(closes, ["510300"], date(2024, 1, 1))
    signals = [RebalanceSignal(date(2024, 1, 2), ["510300"], "init", {"510300": 1.0})]
    engine = BacktestEngine(initial_cash=1_000_000, cost_rate=0.0)
    result = engine.run(signals, ohlcv, benchmark_code="510300")
    assert len(result.nav) == 50
    assert result.nav.iloc[-1] > 1.0
    assert len(result.trades) >= 1

def test_engine_zero_cost_matches_price():
    closes = [1.0, 1.01, 1.02, 1.03]
    ohlcv = _make_ohlcv(closes, ["510300"], date(2024, 1, 1))
    signals = [RebalanceSignal(date(2024, 1, 1), ["510300"], "init", {})]
    engine = BacktestEngine(initial_cash=100.0, cost_rate=0.0)
    result = engine.run(signals, ohlcv)
    assert abs(result.nav.iloc[-1] - 1.03) < 0.001

def test_engine_charges_cost_on_trade():
    closes = [1.0, 1.01]
    ohlcv = _make_ohlcv(closes, ["510300"], date(2024, 1, 1))
    signals = [RebalanceSignal(date(2024, 1, 1), ["510300"], "init", {})]
    engine = BacktestEngine(initial_cash=100.0, cost_rate=0.01)
    result = engine.run(signals, ohlcv)
    assert result.nav.iloc[-1] < 1.01
    assert result.nav.iloc[-1] > 0.98
