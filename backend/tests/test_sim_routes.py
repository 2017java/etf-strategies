import os
import sys
import json
import pytest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

os.environ.setdefault("LLM_API_KEY", "test")


@pytest.fixture
def sim_env(tmp_path, monkeypatch):
    from app import sim_routes
    data_file = tmp_path / "sim_portfolio_data.json"
    monkeypatch.setattr(sim_routes, "DATA_FILE", data_file)
    yield sim_routes, data_file


def test_load_corrupt_returns_default(sim_env):
    sim_routes, data_file = sim_env
    data_file.write_text("{not valid json", encoding="utf-8")
    p = sim_routes.get_portfolio()
    assert p.initial_cash == 1_000_000.0
    assert p.positions == []
    assert p.trades == []


def test_load_invalid_initial_cash_auto_resets(sim_env, caplog):
    sim_routes, data_file = sim_env
    data_file.write_text(
        json.dumps({"initial_cash": 0, "positions": [], "trades": []}),
        encoding="utf-8",
    )
    with caplog.at_level("WARNING"):
        p = sim_routes.get_portfolio()
    assert p.initial_cash == 1_000_000.0


def test_update_initial_cash_rejects_non_positive(sim_env):
    sim_routes, _ = sim_env
    from fastapi import HTTPException
    with pytest.raises(HTTPException) as exc_info:
        sim_routes.update_initial_cash(0)
    assert exc_info.value.status_code == 400
    with pytest.raises(HTTPException):
        sim_routes.update_initial_cash(-100)
    with pytest.raises(HTTPException):
        sim_routes.update_initial_cash(None)


def test_update_initial_cash_persists(sim_env):
    sim_routes, data_file = sim_env
    p = sim_routes.update_initial_cash(2_000_000.0)
    assert p.initial_cash == 2_000_000.0
    saved = json.loads(data_file.read_text(encoding="utf-8"))
    assert saved["initial_cash"] == 2_000_000.0


def test_batch_buy_skips_zero_price_items(sim_env, caplog):
    sim_routes, _ = sim_env
    with caplog.at_level("WARNING"):
        p = sim_routes.batch_buy([
            {"code": "510300", "name": "沪深300ETF", "price": 0, "shares": 0},
            {"code": "510500", "name": "中证500ETF", "price": 6.0, "shares": 0},
        ])
    assert all(t.code != "510300" for t in p.trades)
    assert any(t.code == "510500" for t in p.trades)


def test_batch_buy_fixed_shares_with_zero_price_skipped(sim_env, caplog):
    sim_routes, _ = sim_env
    with caplog.at_level("WARNING"):
        p = sim_routes.batch_buy([
            {"code": "510300", "name": "沪深300ETF", "price": 0, "shares": 1000},
            {"code": "510500", "name": "中证500ETF", "price": 6.0, "shares": 1000},
        ])
    assert all(t.code != "510300" for t in p.trades)
    assert any(t.code == "510500" for t in p.trades)
