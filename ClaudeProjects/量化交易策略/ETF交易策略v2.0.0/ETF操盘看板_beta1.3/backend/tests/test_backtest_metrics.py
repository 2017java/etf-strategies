import pandas as pd
from datetime import date, timedelta
from app.backtest.metrics import compute_metrics

def _nav(rets, start):
    dates = [start + timedelta(days=i) for i in range(len(rets))]
    nav = [1.0]
    for r in rets:
        nav.append(nav[-1] * (1 + r))
    return pd.Series(nav[1:], index=pd.to_datetime(dates), name="nav")

def test_annual_return_compound():
    nav = _nav([0.001] * 250, date(2024, 1, 1))
    m = compute_metrics(nav, trades=[], initial_cash=1_000_000)
    assert abs(m["annual_return"] - 0.286) < 0.01

def test_max_drawdown_negative():
    rets = [0.05, -0.10, 0.03, -0.08, 0.02]
    nav = _nav(rets, date(2024, 1, 1))
    m = compute_metrics(nav, trades=[], initial_cash=1_000_000)
    assert m["max_drawdown"] < 0
    assert abs(m["max_drawdown"] - (-0.13)) < 0.005

def test_sharpe_zero_when_flat():
    nav = _nav([0.0] * 100, date(2024, 1, 1))
    m = compute_metrics(nav, trades=[], initial_cash=1_000_000)
    assert m["sharpe"] == 0

def test_turnover_sum_abs_trades():
    trades = [{"amount": 3500}, {"amount": 3600}]
    nav = _nav([0.001]*100, date(2024, 1, 1))
    m = compute_metrics(nav, trades=trades, initial_cash=1_000_000)
    assert 0.012 < m["annual_turnover"] < 0.014
