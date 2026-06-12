import pandas as pd
import numpy as np
from datetime import date, timedelta
from app.strategies.l1_trend_score import L1TrendScore

def test_trend_score_positive_on_uptrend():
    s = L1TrendScore(m_days=25)
    closes = pd.Series([1.0 + 0.01 * i for i in range(25)])
    assert s.trend_score(closes) > 0

def test_trend_score_negative_on_downtrend():
    s = L1TrendScore(m_days=25)
    closes = pd.Series([2.0 - 0.01 * i for i in range(25)])
    assert s.trend_score(closes) < 0

def test_trend_score_near_zero_on_flat():
    s = L1TrendScore(m_days=25)
    np.random.seed(42)
    closes = pd.Series([1.0 + np.random.normal(0, 0.001) for _ in range(25)])
    assert abs(s.trend_score(closes)) < 0.5

def test_generate_signals_picks_uptrend():
    dates = [date(2024, 1, 1) + timedelta(days=i) for i in range(30)]
    rows = []
    for d in dates:
        i = (d - dates[0]).days
        rows.append({"date": d, "code": "A", "open": 1, "high": 1, "low": 1,
                     "close": 1.0 + 0.02 * i, "volume": 1000})
        rows.append({"date": d, "code": "B", "open": 1, "high": 1, "low": 1,
                     "close": 1.0 + 0.001 * (i % 3 - 1), "volume": 1000})
        rows.append({"date": d, "code": "C", "open": 1, "high": 1, "low": 1,
                     "close": 1.0 - 0.02 * i, "volume": 1000})
    ohlcv = pd.DataFrame(rows).set_index(["date", "code"]).sort_index()
    s = L1TrendScore(m_days=20)
    signals = s.generate_signals(ohlcv, dates)
    assert len(signals) >= 1
    assert "A" in signals[0].target_codes
