from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from typing import Dict
import logging

_log = logging.getLogger("app.main")

from app.data_fetcher import fetch_all_etf_data, should_use_realtime_mode, TRADE_AFTERNOON_END
from app.calculator import calculate_metrics, get_quant_top5
from app.llm_recommender import get_llm_recommendations
from app.models import DashboardData, ETFItem, QuantRecommend, LLMRecommend, RefreshResponse
from app import sim_routes
from app import backtest_routes

app = FastAPI(title="ETF操盘看板API", version="2.0.0")

import os
_log = logging.getLogger("app.main")
_log.info("LLM_API_KEY=%s..., LLM_API_BASE=%s, LLM_MODEL=%s",
          os.getenv("LLM_API_KEY", "(空)")[:16],
          os.getenv("LLM_API_BASE", "(空)"),
          os.getenv("LLM_MODEL", "(空)"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

cache: Dict = {"data": None, "timestamp": None}


def build_dashboard(raw_data: dict, trading: bool) -> DashboardData:
    etf_list_raw = calculate_metrics(raw_data)
    quant_top5_raw = get_quant_top5(etf_list_raw)
    llm_top5_raw = get_llm_recommendations(etf_list_raw)

    etf_items = [ETFItem(**e) for e in etf_list_raw]
    quant_items = [QuantRecommend(**q) for q in quant_top5_raw]
    llm_items = [LLMRecommend(**l) for l in llm_top5_raw]

    first_item = etf_list_raw[0] if etf_list_raw else {}
    data_date = first_item.get("data_date", datetime.now().strftime("%Y-%m-%d"))
    data_type = first_item.get("data_type", "closed")

    if data_type == "realtime":
        now = datetime.now()
        is_in_trading_hours = now.time() <= TRADE_AFTERNOON_END
        update_time = datetime.now().strftime("%H:%M")
        return DashboardData(
            etf_list=etf_items,
            quant_top5=quant_items,
            llm_top5=llm_items,
            data_time=f"{data_date} {update_time}",
            is_trading_time=is_in_trading_hours,
            data_type="realtime" if is_in_trading_hours else "closed_today",
        )
    else:
        update_time = datetime.now().strftime("%H:%M")
        return DashboardData(
            etf_list=etf_items,
            quant_top5=quant_items,
            llm_top5=llm_items,
            data_time=f"{data_date} {update_time}",
            is_trading_time=False,
            data_type="closed",
        )


@app.get("/")
def root():
    return {"message": "ETF操盘看板API运行中"}


@app.post("/api/refresh", response_model=RefreshResponse)
def refresh_data():
    try:
        raw_data, trading = fetch_all_etf_data()
        if not raw_data:
            return RefreshResponse(success=False, message="未能获取ETF数据，请检查akshare连接或交易日期")

        dashboard = build_dashboard(raw_data, trading)
        cache["data"] = dashboard
        cache["timestamp"] = datetime.now()

        # 同步更新模拟盘持仓快照价格
        price_map = {e.code: e.current_price for e in dashboard.etf_list}
        sim_routes.update_prices(price_map)

        return RefreshResponse(success=True, message="数据刷新成功", data=dashboard)
    except Exception as e:
        return RefreshResponse(success=False, message=f"刷新失败: {str(e)}")


@app.get("/api/dashboard", response_model=RefreshResponse)
def get_dashboard(use_cache: bool = True):
    if use_cache and cache.get("data"):
        return RefreshResponse(success=True, message="返回缓存数据", data=cache["data"])
    return refresh_data()


# ── 模拟盘接口 ────────────────────────────────────────────

@app.get("/api/sim/portfolio")
def sim_get_portfolio():
    p = sim_routes.get_portfolio()
    return {
        "initial_cash": p.initial_cash,
        "positions": p.positions,
        "trades": p.trades,
        "total_cost": p.total_cost(),
        "total_value": p.total_value(),
        "profit": p.profit(),
        "profit_pct": p.profit_pct(),
        "available_cash": p.available_cash(),
        "realized_profit": p.realized_profit(),
        "total_profit": p.total_profit(),
        "total_profit_pct": p.total_profit_pct(),
    }


@app.post("/api/sim/batch-buy")
def sim_batch_buy(req: sim_routes.BatchBuyRequest):
    return sim_routes.batch_buy(req.items)


@app.post("/api/sim/clear-all")
def sim_clear_all():
    return sim_routes.clear_all()


@app.post("/api/sim/upsert-position")
def sim_upsert_position(req: sim_routes.ManualPositionRequest):
    return sim_routes.upsert_position(req.model_dump())


@app.delete("/api/sim/position/{code}")
def sim_remove_position(code: str):
    return sim_routes.remove_position(code)


@app.post("/api/sim/upsert-trade")
def sim_upsert_trade(req: sim_routes.EditTradeRequest):
    return sim_routes.upsert_trade(req.model_dump())


@app.delete("/api/sim/trade/{id}")
def sim_remove_trade(id: str):
    return sim_routes.remove_trade(id)


@app.post("/api/sim/reset")
def sim_reset():
    return sim_routes.reset_portfolio()


@app.post("/api/sim/initial-cash")
def sim_update_initial_cash_post(req: sim_routes.UpdateInitialCashRequest):
    return sim_routes.update_initial_cash(req.initial_cash)


@app.patch("/api/sim/initial-cash")
def sim_update_initial_cash_patch(req: sim_routes.UpdateInitialCashRequest):
    return sim_routes.update_initial_cash(req.initial_cash)


# ── 回测接口 ────────────────────────────────────────────
app.include_router(backtest_routes.router)
