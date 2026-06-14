import numpy as np
import pandas as pd
import math
from datetime import date
from app.strategies.base import Strategy, RebalanceSignal


class L1TrendScore(Strategy):
    """L1: 趋势评分 TOP1。
    动量得分 = 年化收益 × R²，对数价格线性回归。
    始终持有得分最高的 1 只 ETF；目标变化才换手。"""

    name = "L1 趋势评分 TOP1"
    rebalance_freq = "daily"

    def __init__(self, m_days: int = 25, codes: list[str] | None = None):
        self.m_days = m_days
        self.codes = codes

    def trend_score(self, close: pd.Series) -> float:
        y = np.log(close.values)
        x = np.arange(len(y))
        slope, intercept = np.polyfit(x, y, 1)
        ann_ret = math.exp(slope) ** 250 - 1
        y_pred = slope * x + intercept
        ss_res = ((y - y_pred) ** 2).sum()
        ss_tot = ((y - y.mean()) ** 2).sum()
        r2 = 1 - ss_res / ss_tot if ss_tot > 0 else 0
        return ann_ret * r2

    def generate_signals(self, ohlcv, calendar):
        all_codes = self.codes or sorted({c for _, c in ohlcv.index})
        all_dates = sorted({d for d, _ in ohlcv.index})

        close_by_code = {}
        for code in all_codes:
            s = ohlcv.xs(code, level="code")["close"].sort_index()
            s.index = pd.DatetimeIndex(pd.to_datetime(s.index))
            close_by_code[code] = s

        signals: list[RebalanceSignal] = []
        current: str | None = None

        for d in all_dates:
            scores: dict[str, float] = {}
            for code, series in close_by_code.items():
                hist = series[series.index <= pd.Timestamp(d)].tail(self.m_days)
                if len(hist) < self.m_days:
                    continue
                scores[code] = self.trend_score(hist)
            if not scores:
                continue
            best = max(scores, key=scores.get)
            if best != current:
                current = best
                signals.append(RebalanceSignal(
                    date=d, target_codes=[best],
                    reason=f"趋势评分最高: {best}", scores=scores,
                ))
        return signals
