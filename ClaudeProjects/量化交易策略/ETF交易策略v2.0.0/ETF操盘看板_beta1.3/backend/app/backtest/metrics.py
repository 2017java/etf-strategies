import pandas as pd
from typing import Iterable
import math

def compute_metrics(
    nav: pd.Series, trades: Iterable[dict], initial_cash: float,
    risk_free_rate: float = 0.02,
) -> dict:
    if len(nav) < 2:
        return {
            "annual_return": 0.0, "sharpe": 0.0,
            "max_drawdown": 0.0, "calmar": 0.0,
            "monthly_win_rate": 0.0, "annual_turnover": 0.0,
        }
    days = (nav.index[-1] - nav.index[0]).days
    years = max(days / 365.25, 1e-9)
    annual_return = nav.iloc[-1] ** (1 / years) - 1

    daily_ret = nav.pct_change().dropna()
    std = daily_ret.std(ddof=0)
    if std > 0:
        sharpe = (daily_ret.mean() - risk_free_rate / 365) / std * math.sqrt(365)
    else:
        sharpe = 0.0

    cummax = nav.cummax()
    drawdown = (nav - cummax) / cummax
    max_drawdown = drawdown.min()

    calmar = annual_return / abs(max_drawdown) if max_drawdown < 0 else 0.0

    monthly_nav = nav.resample("ME").last()
    monthly_ret = monthly_nav.pct_change().dropna()
    monthly_win_rate = (monthly_ret > 0).sum() / len(monthly_ret) if len(monthly_ret) > 0 else 0.0

    total_traded = sum(abs(t.get("amount", 0)) for t in trades)
    annual_turnover = (total_traded / 2) / initial_cash / years if years > 0 else 0.0

    return {
        "annual_return": round(annual_return, 4),
        "sharpe": round(sharpe, 4),
        "max_drawdown": round(max_drawdown, 4),
        "calmar": round(calmar, 4),
        "monthly_win_rate": round(monthly_win_rate, 4),
        "annual_turnover": round(annual_turnover, 4),
    }
