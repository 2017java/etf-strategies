import pandas as pd
from datetime import date, timedelta
import pytest

from app.backtest.engine import BacktestEngine
from app.strategies.l1_trend_score import L1TrendScore
from app.strategies.l2_multi_factor import L2MultiFactor
from app.strategies.l3_multi_factor_rsrs import L3MultiFactorRSRS


def _build_synth_ohlcv(codes: list[str], days: int = 200):
    """造一个多 ETF 的合成 OHLCV，每个 ETF 有明确的涨跌趋势。"""
    rows = []
    start = date(2024, 1, 2)
    for ci, code in enumerate(codes):
        close = 1.0
        # 不同 ETF 有不同的年化斜率
        slope = [0.0005, 0.0010, 0.0015, -0.0003, 0.0008, 0.0020, 0.0012, 0.0006][ci % 8]
        for j in range(days):
            d = start + timedelta(days=j)
            # 跳过周末，使数据更像真实交易日
            if d.weekday() >= 5:
                continue
            close = close * (1 + slope)
            rows.append({
                "date": d, "code": code,
                "open": close * 0.998, "high": close * 1.005,
                "low": close * 0.995, "close": close,
                "volume": 1_000_000 + ci * 100_000 + j * 10,
            })
    return pd.DataFrame(rows).set_index(["date", "code"]).sort_index()


@pytest.fixture
def synth_data():
    codes = ["ETF1", "ETF2", "ETF3", "ETF4", "ETF5", "ETF6"]
    return _build_synth_ohlcv(codes, days=200), codes


def test_e2e_l1_engine_integration(synth_data):
    """L1: 策略 → 信号 → 引擎 → 净值/指标 全链路。"""
    ohlcv, codes = synth_data
    calendar = sorted({d for d, _ in ohlcv.index})

    strategy = L1TrendScore(codes=codes)
    signals = strategy.generate_signals(ohlcv, calendar)
    assert len(signals) >= 1, "L1 至少应有 1 个调仓信号"

    engine = BacktestEngine(initial_cash=1_000_000.0, cost_rate=0.0002)
    result = engine.run(signals, ohlcv, benchmark_code=codes[0])

    assert len(result.nav) >= 30
    assert len(result.benchmark_nav) >= 30
    assert len(result.trades) >= 1
    # 指标不为空且数值合理
    assert "annual_return" in result.metrics
    assert "sharpe" in result.metrics
    assert "max_drawdown" in result.metrics
    # 最大回撤应为负值
    assert result.metrics["max_drawdown"] <= 0


def test_e2e_l2_engine_integration(synth_data):
    """L2: 多因子 → 信号 → 引擎 → 净值/指标。"""
    ohlcv, codes = synth_data
    calendar = sorted({d for d, _ in ohlcv.index})

    strategy = L2MultiFactor(codes=codes)
    signals = strategy.generate_signals(ohlcv, calendar)
    assert len(signals) >= 1, "L2 每月应至少有 1 个调仓信号"

    # 每个信号应选 5 只
    for s in signals:
        assert len(s.target_codes) == 5

    engine = BacktestEngine(initial_cash=1_000_000.0, cost_rate=0.0002)
    result = engine.run(signals, ohlcv, benchmark_code=codes[0])

    assert len(result.nav) >= 30
    assert len(result.trades) >= 1
    assert "annual_return" in result.metrics


def test_e2e_l3_engine_integration(synth_data):
    """L3: 多因子 + RSRS → 信号 → 引擎 → 净值/指标。"""
    ohlcv, codes = synth_data
    calendar = sorted({d for d, _ in ohlcv.index})

    # 大盘基准用 ETF1（强势上涨趋势）
    strategy = L3MultiFactorRSRS(codes=codes, benchmark_code=codes[0])
    signals = strategy.generate_signals(ohlcv, calendar)

    engine = BacktestEngine(initial_cash=1_000_000.0, cost_rate=0.0002)
    result = engine.run(signals, ohlcv, benchmark_code=codes[0])

    assert len(result.nav) >= 30
    assert "annual_return" in result.metrics


def test_e2e_all_strategies_are_deterministic(synth_data):
    """同一输入，同一策略必须给出完全相同的信号和净值。"""
    ohlcv, codes = synth_data
    calendar = sorted({d for d, _ in ohlcv.index})

    for Cls in [L1TrendScore, L2MultiFactor, L3MultiFactorRSRS]:
        s1 = Cls(codes=codes) if Cls != L3MultiFactorRSRS else Cls(codes=codes, benchmark_code=codes[0])
        s2 = Cls(codes=codes) if Cls != L3MultiFactorRSRS else Cls(codes=codes, benchmark_code=codes[0])

        sig1 = s1.generate_signals(ohlcv, calendar)
        sig2 = s2.generate_signals(ohlcv, calendar)

        assert len(sig1) == len(sig2), f"{Cls.__name__}: 两次信号数不同"
        for a, b in zip(sig1, sig2):
            assert a.date == b.date
            assert a.target_codes == b.target_codes
