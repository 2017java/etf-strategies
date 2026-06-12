import numpy as np
import pandas as pd


def compute_metrics(
    nav: pd.Series,
    trades: list = None,
    initial_cash: float = 1_000_000,
) -> dict:
    if nav.empty:
        return {
            "annual_return": 0.0,
            "sharpe": 0.0,
            "max_drawdown": 0.0,
            "annual_turnover": 0.0,
            "total_trades": 0,
        }

    total_days = (nav.index[-1] - nav.index[0]).days
    if total_days <= 0:
        annual_return = 0.0
    else:
        total_return = nav.iloc[-1] / nav.iloc[0] - 1
        annual_return = (1 + total_return) ** (365 / total_days) - 1

    daily_returns = nav.pct_change().dropna()
    if len(daily_returns) == 0 or daily_returns.std() == 0:
        sharpe = 0.0
    else:
        sharpe = (daily_returns.mean() / daily_returns.std()) * np.sqrt(252)

    rolling_max = nav.cummax()
    drawdown = (nav - rolling_max) / rolling_max
    max_drawdown = drawdown.min()

    if trades is None:
        trades = []
    total_trades = len(trades)
    if total_days > 0 and initial_cash > 0:
        total_trade_amount = sum(abs(t.get("amount", 0)) for t in trades)
        annual_turnover = total_trade_amount / initial_cash / 2 / (total_days / 365)
    else:
        annual_turnover = 0.0

    return {
        "annual_return": round(float(annual_return), 4),
        "sharpe": round(float(sharpe), 4),
        "max_drawdown": round(float(max_drawdown), 4),
        "annual_turnover": round(float(annual_turnover), 4),
        "total_trades": total_trades,
    }
