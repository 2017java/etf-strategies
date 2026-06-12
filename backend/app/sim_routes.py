import json, uuid, copy, logging
from pathlib import Path
from datetime import datetime
from typing import List
from fastapi import HTTPException
from pydantic import BaseModel
from .sim_portfolio import SimPortfolio, Position, TradeRecord, INITIAL_CASH

DATA_FILE = Path(__file__).parent.parent / "sim_portfolio_data.json"
_log = logging.getLogger("app.sim_routes")

def _load() -> SimPortfolio:
    if DATA_FILE.exists():
        try:
            raw = json.loads(DATA_FILE.read_text(encoding="utf-8"))
            if isinstance(raw.get("initial_cash"), (int, float)) and raw["initial_cash"] <= 0:
                _log.warning("sim_portfolio_data.json initial_cash=%s 异常，自动重置为 %s", raw.get("initial_cash"), INITIAL_CASH)
                raw["initial_cash"] = INITIAL_CASH
            return SimPortfolio(**raw)
        except Exception:
            pass
    return SimPortfolio()

def _save(portfolio: SimPortfolio):
    DATA_FILE.write_text(portfolio.model_dump_json(ensure_ascii=False, indent=2), encoding="utf-8")

def _now() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M")

def _new_id() -> str:
    return datetime.now().strftime("%Y%m%d%H%M%S") + str(uuid.uuid4())[:4].upper()

# ── 路由定义 ──────────────────────────────────────────────

class BatchBuyRequest(BaseModel):
    items: List[dict]   # [{code, name, price, shares}]

class ManualPositionRequest(BaseModel):
    code: str
    name: str
    shares: int
    avg_cost: float
    current_price: float

class EditTradeRequest(BaseModel):
    id: str
    time: str
    action: str
    code: str
    name: str
    price: float
    shares: int
    note: str

class UpdateInitialCashRequest(BaseModel):
    initial_cash: float

# 查询
def get_portfolio() -> SimPortfolio:
    return _load()

# 更新持仓快照价格（用看板当前行情更新）
def update_prices(price_map: dict):   # {code: price}
    portfolio = _load()
    for pos in portfolio.positions:
        if pos.code in price_map:
            pos.current_price = price_map[pos.code]
            pos.updated_at = _now()
    _save(portfolio)

# 批量均仓买入
def batch_buy(items: List[dict]) -> SimPortfolio:
    """
    items: [{code, name, price, shares}]
    shares 为 0 时自动均分可用资金
    """
    portfolio = _load()
    available = portfolio.available_cash()
    total_cost = 0.0
    
    # 计算总份额和每份均分
    auto_items = [it for it in items if it.get("shares", 0) == 0]
    fixed_items = [it for it in items if it.get("shares", 0) > 0]
    
    # 先计算固定份额总占用
    fixed_cost = sum(it["shares"] * it["price"] for it in fixed_items)
    remaining = available - fixed_cost
    per_share = remaining / len(auto_items) if auto_items else 0
    
    all_items = []
    for it in fixed_items:
        if it.get("price", 0) <= 0:
            _log.warning("batch_buy 跳过非法 price=0 的固定份额项: %s", it.get("code"))
            continue
        all_items.append({**it, "calc_shares": it["shares"]})
    for it in auto_items:
        if per_share <= 0 or it.get("price", 0) <= 0:
            if it.get("price", 0) <= 0:
                _log.warning("batch_buy 跳过非法 price=0 的自动均仓项: %s", it.get("code"))
            continue
        calc_shares = int(per_share / it["price"] / 100) * 100
        all_items.append({**it, "calc_shares": calc_shares})
    
    new_trades = []
    for it in all_items:
        code = it["code"]
        name = it["name"]
        price = it["price"]
        shares = it["calc_shares"]
        amount = round(shares * price, 2)
        if shares <= 0 or amount <= 0:
            continue
        
        # 更新或新增持仓
        existing = next((p for p in portfolio.positions if p.code == code), None)
        if existing:
            total_shares = existing.shares + shares
            existing.avg_cost = round((existing.shares * existing.avg_cost + amount) / total_shares, 4)
            existing.shares = total_shares
            existing.current_price = price
            existing.updated_at = _now()
        else:
            portfolio.positions.append(Position(
                code=code, name=name, shares=shares,
                avg_cost=round(price, 4), current_price=price, updated_at=_now()
            ))
        
        new_trades.append(TradeRecord(
            id=_new_id(), time=_now(), action="buy",
            code=code, name=name, price=price, shares=shares, amount=amount
        ))
        total_cost += amount
    
    portfolio.trades.extend(new_trades)
    _save(portfolio)
    return portfolio

# 一键清仓
def clear_all() -> SimPortfolio:
    portfolio = _load()
    now = _now()
    new_trades = []
    for pos in portfolio.positions:
        amount = round(pos.shares * pos.current_price, 2)
        new_trades.append(TradeRecord(
            id=_new_id(), time=now, action="sell",
            code=pos.code, name=pos.name, price=pos.current_price,
            shares=pos.shares, amount=amount, note="一键清仓"
        ))
    portfolio.trades.extend(new_trades)
    portfolio.positions.clear()
    _save(portfolio)
    return portfolio

# 手动新增/编辑持仓
def upsert_position(item: dict) -> SimPortfolio:
    portfolio = _load()
    code = item["code"]
    existing = next((p for p in portfolio.positions if p.code == code), None)
    if existing:
        existing.shares = item["shares"]
        existing.avg_cost = item["avg_cost"]
        existing.current_price = item["current_price"]
        existing.updated_at = _now()
    else:
        portfolio.positions.append(Position(
            code=code, name=item["name"], shares=item["shares"],
            avg_cost=item["avg_cost"], current_price=item["current_price"], updated_at=_now()
        ))
    _save(portfolio)
    return portfolio

# 删除持仓
def remove_position(code: str) -> SimPortfolio:
    portfolio = _load()
    portfolio.positions = [p for p in portfolio.positions if p.code != code]
    _save(portfolio)
    return portfolio

# 新增/编辑历史成交记录
def upsert_trade(trade: dict) -> SimPortfolio:
    portfolio = _load()
    existing_idx = next((i for i, t in enumerate(portfolio.trades) if t.id == trade["id"]), None)
    t = TradeRecord(**trade)
    if existing_idx is not None:
        portfolio.trades[existing_idx] = t
    else:
        portfolio.trades.append(t)
    _save(portfolio)
    return portfolio

# 删除成交记录
def remove_trade(id: str) -> SimPortfolio:
    portfolio = _load()
    portfolio.trades = [t for t in portfolio.trades if t.id != id]
    _save(portfolio)
    return portfolio

# 重置模拟账户
def reset_portfolio() -> SimPortfolio:
    portfolio = SimPortfolio()
    _save(portfolio)
    return portfolio

# 修改初始资金
def update_initial_cash(initial_cash: float) -> SimPortfolio:
    if initial_cash is None or initial_cash <= 0:
        raise HTTPException(status_code=400, detail="initial_cash 必须大于 0")
    portfolio = _load()
    portfolio.initial_cash = float(initial_cash)
    _save(portfolio)
    return portfolio
