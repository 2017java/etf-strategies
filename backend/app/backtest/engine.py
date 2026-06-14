import pandas as pd
from dataclasses import dataclass, field
from datetime import date
from typing import Literal
import logging

from app.strategies.base import RebalanceSignal
from app.backtest.metrics import compute_metrics

logger = logging.getLogger(__name__)

@dataclass
class Trade:
    date: date
    code: str
    action: Literal["buy", "sell"]
    price: float
    shares: int
    amount: float
    reason: str

@dataclass
class BacktestResult:
    strategy: str
    start: date
    end: date
    cost_rate: float
    nav: pd.Series
    benchmark_nav: pd.Series
    trades: list[Trade] = field(default_factory=list)
    metrics: dict = field(default_factory=dict)


class BacktestEngine:
    def __init__(self, initial_cash: float = 1_000_000.0, cost_rate: float = 0.0002):
        self.initial_cash = initial_cash
        self.cost_rate = cost_rate

    def run(
        self,
        signals: list[RebalanceSignal],
        ohlcv: pd.DataFrame,
        benchmark_code: str = "510300",
    ) -> BacktestResult:
        if ohlcv.empty:
            raise ValueError("ohlcv is empty")

        all_dates = sorted({d for d, _ in ohlcv.index})
        close_matrix = ohlcv["close"].unstack(level="code")
        open_matrix = ohlcv["open"].unstack(level="code")
        codes = list(close_matrix.columns)

        if benchmark_code not in codes:
            benchmark_code = codes[0]

        sig_map: dict[date, RebalanceSignal] = {s.date: s for s in signals}

        cash = self.initial_cash
        positions: dict[str, int] = {}
        nav_records: dict[date, float] = {}
        benchmark_records: dict[date, float] = {}
        trades: list[Trade] = []

        first_sig_date = signals[0].date if signals else all_dates[0]
        first_open = open_matrix.at[first_sig_date, benchmark_code] if first_sig_date in open_matrix.index else 0
        bench_shares = int(self.initial_cash / first_open / 100) * 100 if first_open > 0 else 0

        for d in all_dates:
            row_open = open_matrix.loc[d] if d in open_matrix.index else None
            row_close = close_matrix.loc[d] if d in close_matrix.index else None
            if row_close is None:
                continue

            if d in sig_map and row_open is not None:
                sig = sig_map[d]
                new_target = set(sig.target_codes)
                current = set(positions.keys())

                for code in current - new_target:
                    if code in row_open.index and row_open[code] > 0:
                        price = float(row_open[code])
                        shares = positions[code]
                        amount = round(shares * price, 2)
                        fee = round(amount * self.cost_rate, 2)
                        cash += amount - fee
                        trades.append(Trade(d, code, "sell", price, shares, amount, sig.reason))
                        del positions[code]

                to_buy = new_target - current
                if to_buy:
                    available = cash
                    per_code = available / len(to_buy)
                    for code in to_buy:
                        if code in row_open.index and row_open[code] > 0:
                            price = float(row_open[code])
                            shares = int(per_code / price / 100) * 100
                            if shares > 0:
                                amount = round(shares * price, 2)
                                fee = round(amount * self.cost_rate, 2)
                                cash -= amount + fee
                                positions[code] = shares
                                trades.append(Trade(d, code, "buy", price, shares, amount, sig.reason))

            pos_value = 0.0
            for code, shares in positions.items():
                if code in row_close.index and row_close[code] > 0:
                    pos_value += shares * float(row_close[code])
            nav_records[d] = (cash + pos_value) / self.initial_cash

            bench_price = float(row_close[benchmark_code])
            benchmark_records[d] = bench_shares * bench_price / self.initial_cash

        nav = pd.Series(nav_records, name="nav")
        nav.index = pd.to_datetime(nav.index)
        bench_nav = pd.Series(benchmark_records, name="benchmark")
        bench_nav.index = pd.to_datetime(bench_nav.index)

        start_d, end_d = nav.index[0].date(), nav.index[-1].date()
        trade_dicts = [
            {"amount": t.amount, "action": t.action, "code": t.code, "date": t.date}
            for t in trades
        ]
        metrics = compute_metrics(nav, trade_dicts, self.initial_cash)

        return BacktestResult(
            strategy=signals[0].reason[:20] if signals else "empty",
            start=start_d, end=end_d,
            cost_rate=self.cost_rate,
            nav=nav, benchmark_nav=bench_nav,
            trades=trades, metrics=metrics,
        )
