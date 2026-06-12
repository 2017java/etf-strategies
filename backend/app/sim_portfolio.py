from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

INITIAL_CASH = 1_000_000.0  # 初始资金 100 万

class Position(BaseModel):
    code: str
    name: str
    shares: int          # 持仓份额
    avg_cost: float      # 持仓均价
    current_price: float # 当前市价（快照，买入时填入）
    updated_at: str      # 更新时间

class TradeRecord(BaseModel):
    id: str
    time: str            # 操作时间
    action: str          # buy | sell
    code: str
    name: str
    price: float         # 成交价
    shares: int          # 成交份额
    amount: float        # 成交金额
    note: str = ""

class SimPortfolio(BaseModel):
    initial_cash: float = INITIAL_CASH
    positions: List[Position] = []
    trades: List[TradeRecord] = []
    
    def total_cost(self) -> float:
        return sum(p.shares * p.avg_cost for p in self.positions)
    
    def total_value(self) -> float:
        return sum(p.shares * p.current_price for p in self.positions)
    
    def profit(self) -> float:
        return self.total_value() - self.total_cost()
    
    def realized_profit(self) -> float:
        """已实现盈亏：卖出收入 - 对应持仓成本（FIFO法）"""
        # 用FIFO方法计算已实现盈亏
        # 记录每笔买入的剩余份额和成本
        buy_lots = []  # [(shares, cost_per_share), ...]
        realized = 0.0
        
        for t in self.trades:
            if t.action == "buy":
                # 买入：记录批次
                buy_lots.append({"shares": t.shares, "cost": t.price})
            elif t.action == "sell":
                # 卖出：按FIFO匹配买入批次
                sell_shares_remaining = t.shares
                sell_price = t.price
                
                while sell_shares_remaining > 0 and buy_lots:
                    lot = buy_lots[0]
                    if lot["shares"] <= sell_shares_remaining:
                        # 整个批次都卖出
                        realized += lot["shares"] * (sell_price - lot["cost"])
                        sell_shares_remaining -= lot["shares"]
                        buy_lots.pop(0)
                    else:
                        # 部分卖出
                        realized += sell_shares_remaining * (sell_price - lot["cost"])
                        lot["shares"] -= sell_shares_remaining
                        sell_shares_remaining = 0
        
        return round(realized, 2)
    
    def total_profit(self) -> float:
        """总盈亏 = 已实现 + 持仓浮盈"""
        return round(self.realized_profit() + self.profit(), 2)
    
    def total_profit_pct(self) -> float:
        """总盈亏率 = 总盈亏 / 初始资金"""
        return round(self.total_profit() / self.initial_cash * 100, 2)
    
    def profit_pct(self) -> float:
        cost = self.total_cost()
        return (self.profit() / cost * 100) if cost > 0 else 0.0
    
    def available_cash(self) -> float:
        # 可用资金 = 初始资金 - 持仓成本 + 已实现盈亏（清仓后盈亏不会消失）
        return round(self.initial_cash - self.total_cost() + self.realized_profit(), 2)
