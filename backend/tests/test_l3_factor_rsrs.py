import pandas as pd
import numpy as np
from datetime import date, timedelta
from app.strategies.l3_multi_factor_rsrs import L3MultiFactorRSRS, compute_rsrs


def _build_piecewise_series(
    total: int,
    n: int,
    early_beta: float,
    late_beta: float,
    low_start: float = 100.0,
    step: float = 0.5,
    switch_days_before_end: int | None = None,
) -> tuple[pd.Series, pd.Series]:
    """构造 high/low 序列。

    - 前 switch_idx 天：high = early_beta * low + alpha
    - 之后：high = late_beta * low + alpha'（在 switch 点处保持连续）
    """
    if switch_days_before_end is None:
        switch_idx = total - n
    else:
        switch_idx = max(n + 1, total - switch_days_before_end)
    low_vals: list[float] = []
    high_vals: list[float] = []
    alpha_early = 5.0

    for i in range(total):
        low = low_start + step * i
        low_vals.append(low)
        if i < switch_idx:
            high = early_beta * low + alpha_early
        else:
            low_switch = low_start + step * (switch_idx - 1)
            high_at_switch = early_beta * low_switch + alpha_early
            alpha_late = high_at_switch - late_beta * low_switch
            high = late_beta * low + alpha_late
        high_vals.append(high)

    return pd.Series(high_vals), pd.Series(low_vals)


def test_rsrs_beta_uptrend():
    n = 18
    total = 80
    high, low = _build_piecewise_series(total, n, 1.0, 2.0)
    rsrs = compute_rsrs(high, low, n=n, m=600)
    assert rsrs > 0, f"expected positive RSRS, got {rsrs}"


def test_rsrs_beta_downtrend():
    n = 18
    total = 80
    high, low = _build_piecewise_series(total, n, 2.0, 0.5)
    rsrs = compute_rsrs(high, low, n=n, m=600)
    assert rsrs < 0, f"expected negative RSRS, got {rsrs}"


def _build_ohlcv(dates: list[date], configs: dict[str, dict]) -> pd.DataFrame:
    rows = []
    for code, cfg in configs.items():
        high_arr = cfg["high"]
        low_arr = cfg["low"]
        close_arr = cfg["close"]
        volume = cfg.get("volume", 100000)
        for j, d in enumerate(dates):
            h = float(high_arr.iloc[j]) if isinstance(high_arr, pd.Series) else float(high_arr[j])
            l = float(low_arr.iloc[j]) if isinstance(low_arr, pd.Series) else float(low_arr[j])
            c = float(close_arr.iloc[j]) if isinstance(close_arr, pd.Series) else float(close_arr[j])
            rows.append({
                "date": d, "code": code,
                "open": c, "high": h, "low": l, "close": c,
                "volume": volume,
            })
    return pd.DataFrame(rows).set_index(["date", "code"]).sort_index()


def _etf_with_momentum(days: int, base: float, momentum: float, vol: float,
                        seed: int) -> dict:
    rng = np.random.RandomState(seed)
    closes = []
    highs = []
    lows = []
    price = base
    for _ in range(days):
        change = momentum + rng.normal(0, vol)
        price = price * (1 + change)
        close = price
        high = close * (1 + abs(rng.normal(0, 0.005)))
        low = close * (1 - abs(rng.normal(0, 0.005)))
        closes.append(close)
        highs.append(high)
        lows.append(low)
    return {
        "high": pd.Series(highs),
        "low": pd.Series(lows),
        "close": pd.Series(closes),
        "volume": 100000,
    }


def _benchmark_series(days: int, n: int, mode: str) -> dict:
    """构造 benchmark 序列。

    strong: 最近 N 天 high-beta 显著上升 → RSRS 为正
    weak: 最近 N 天 high-beta 显著下降 → RSRS 为负
    """
    if mode == "strong":
        high, low = _build_piecewise_series(days, n, 1.0, 3.0)
    else:
        high, low = _build_piecewise_series(days, n, 3.0, 0.5)
    close = pd.Series([(h + l) / 2.0 for h, l in zip(high.values, low.values)])
    return {"high": high, "low": low, "close": close, "volume": 1000000}


def test_l3_picks_top5_when_benchmark_strong():
    n = 18
    days = 80
    dates = [date(2024, 1, 1) + timedelta(days=i) for i in range(days)]
    configs = {}
    configs["000300"] = _benchmark_series(days, n=n, mode="strong")
    etf_codes = ["ETF1", "ETF2", "ETF3", "ETF4", "ETF5",
                 "ETF6", "ETF7", "ETF8", "ETF9", "ETF10"]
    for i, code in enumerate(etf_codes):
        mom = 0.015 - 0.001 * i
        configs[code] = _etf_with_momentum(days, base=1.0 + i * 0.1,
                                           momentum=mom, vol=0.003, seed=i + 100)

    ohlcv = _build_ohlcv(dates, configs)
    s = L3MultiFactorRSRS(top_n=5, rsrs_n=n, rsrs_m=600,
                          benchmark_code="000300",
                          benchmark_threshold=-5.0,
                          stock_threshold=-5.0)
    signals = s.generate_signals(ohlcv, dates)
    assert len(signals) >= 1
    first = signals[0]
    assert len(first.target_codes) == 5, f"expected 5 targets, got {first.target_codes}"
    assert all(c != "000300" for c in first.target_codes)


def test_l3_empty_when_benchmark_weak():
    n = 18
    days = 80
    dates = [date(2024, 1, 1) + timedelta(days=i) for i in range(days)]
    configs = {}
    configs["000300"] = _benchmark_series(days, n=n, mode="weak")
    etf_codes = ["A", "B", "C", "D", "E"]
    for i, code in enumerate(etf_codes):
        configs[code] = _etf_with_momentum(days, base=1.0 + i * 0.1,
                                           momentum=0.01 - 0.002 * i, vol=0.003, seed=i)
    ohlcv = _build_ohlcv(dates, configs)
    s = L3MultiFactorRSRS(top_n=5, rsrs_n=n, rsrs_m=600,
                          benchmark_code="000300",
                          benchmark_threshold=5.0,
                          stock_threshold=-5.0)
    signals = s.generate_signals(ohlcv, dates)
    assert len(signals) >= 1
    first = signals[0]
    assert first.target_codes == [], f"expected empty target, got {first.target_codes}"


def test_l3_filters_weak_etfs():
    n = 18
    days = 80
    dates = [date(2024, 1, 1) + timedelta(days=i) for i in range(days)]
    configs = {}
    configs["000300"] = _benchmark_series(days, n=n, mode="strong")

    for i, code in enumerate(["S1", "S2", "S3", "S4", "S5"]):
        high, low = _build_piecewise_series(days, n, 1.0, 3.0,
                                            switch_days_before_end=65)
        rng = np.random.RandomState(i)
        close_base = [1.0 + 0.01 * j + rng.normal(0, 0.002) for j in range(days)]
        configs[code] = {
            "high": high, "low": low,
            "close": pd.Series(close_base),
            "volume": 100000,
        }

    for i, code in enumerate(["W1", "W2"]):
        high, low = _build_piecewise_series(days, n, 3.0, 0.3,
                                            switch_days_before_end=65)
        rng = np.random.RandomState(i + 50)
        close_base = [1.0 + 0.005 * j + rng.normal(0, 0.002) for j in range(days)]
        configs[code] = {
            "high": high, "low": low,
            "close": pd.Series(close_base),
            "volume": 100000,
        }

    ohlcv = _build_ohlcv(dates, configs)
    s = L3MultiFactorRSRS(top_n=5, rsrs_n=n, rsrs_m=600,
                          benchmark_code="000300",
                          benchmark_threshold=-5.0,
                          stock_threshold=0.0)
    signals = s.generate_signals(ohlcv, dates)
    assert len(signals) >= 1
    first = signals[0]
    for code in ["W1", "W2"]:
        assert code not in first.target_codes, f"weak ETF {code} should be filtered out"
    assert len(first.target_codes) >= 1
