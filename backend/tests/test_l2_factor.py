import pandas as pd
from datetime import date, timedelta
from app.strategies.l2_multi_factor import L2MultiFactor, compute_valuation_composite

def test_valuation_composite_high_for_dipped():
    closes = pd.Series([2.0] * 50 + [1.0] * 50)
    assert compute_valuation_composite(closes, lookback=100, dd_lookback=100) > 0.5

def test_valuation_composite_low_for_peaked():
    closes = pd.Series([1.0] * 50 + [2.0] * 50)
    assert compute_valuation_composite(closes, lookback=100, dd_lookback=100) < 0.5

def test_l2_picks_top5_monthly():
    dates = [date(2024, 1, 1) + timedelta(days=i) for i in range(120)]
    rows = []
    for i, code in enumerate(["A", "B", "C", "D", "E", "F"]):
        for j, d in enumerate(dates):
            base = 1.0 + 0.001 * i * j
            vol = 100000 + i * 20000
            rows.append({
                "date": d, "code": code,
                "open": base, "high": base * 1.002, "low": base * 0.998,
                "close": base, "volume": vol,
            })
    ohlcv = pd.DataFrame(rows).set_index(["date", "code"]).sort_index()
    s = L2MultiFactor()
    signals = s.generate_signals(ohlcv, dates)
    assert len(signals) >= 1
    first_target = signals[0].target_codes
    assert len(first_target) == 5
    assert "F" in first_target
