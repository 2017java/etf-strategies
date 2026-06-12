from pydantic import BaseModel
from typing import List, Optional

INITIAL_CASH = 1_000_000.0


class Position(BaseModel):
    code: str
    name: str
    shares: int = 0
    avg_cost: float = 0.0
    current_price: float = 0.0
    updated_at: str = ""

    def market_value(self) -> float:
        return round(self.shares * self.current_price, 2)

    def cost_value(self) -> float:
        return round(self.shares * self.avg_cost, 2)

    def profit(self) -> float:
        return round(self.market_value() - self.cost_value(), 2)

    def profit_pct(self) -> float:
        if self.cost_value() == 0:
            return 0.0
        return round((self.current_price - self.avg_cost) / self.avg_cost * 100, 2)


class TradeRecord(BaseModel):
    id: str = ""
    time: str = ""
    action: str = ""
    code: str = ""
    name: str = ""
    price: float = 0.0
    shares: int = 0
    amount: float = 0.0
    note: str = ""


class SimPortfolio(BaseModel):
    initial_cash: float = INITIAL_CASH
    positions: List[Position] = []
    trades: List[TradeRecord] = []

    def total_cost(self) -> float:
        return round(sum(p.cost_value() for p in self.positions), 2)

    def total_value(self) -> float:
        return round(sum(p.market_value() for p in self.positions), 2)

    def profit(self) -> float:
        return round(self.total_value() - self.total_cost(), 2)

    def profit_pct(self) -> float:
        if self.total_cost() == 0:
            return 0.0
        return round(self.profit() / self.total_cost() * 100, 2)

    def available_cash(self) -> float:
        invested = self.total_cost()
        realized = self.realized_profit()
        return round(self.initial_cash - invested + realized, 2)

    def realized_profit(self) -> float:
        total = 0.0
        for t in self.trades:
            if t.action == "sell":
                total += t.amount
            elif t.action == "buy":
                total -= t.amount
        return round(total, 2)

    def total_profit(self) -> float:
        return round(self.total_value() + self.available_cash() - self.initial_cash, 2)

    def total_profit_pct(self) -> float:
        if self.initial_cash == 0:
            return 0.0
        return round(self.total_profit() / self.initial_cash * 100, 2)
