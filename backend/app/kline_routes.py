from fastapi import APIRouter, Query
from datetime import date

from app.datasource import create_data_store

router = APIRouter(prefix="/api/kline", tags=["kline"])


@router.get("/{code}")
def get_kline(
    code: str,
    start: str = Query(None),
    end: str = Query(None),
):
    store = create_data_store()
    start_date = date.fromisoformat(start) if start else date(2024, 1, 1)
    end_date = date.fromisoformat(end) if end else date.today()
    store.ensure([code], start_date, end_date)
    df = store.load([code], start_date, end_date)
    if df.empty:
        return {"code": code, "data": []}
    df = df.reset_index()
    records = df.to_dict(orient="records")
    for r in records:
        if "date" in r and hasattr(r["date"], "isoformat"):
            r["date"] = r["date"].isoformat()
    return {"code": code, "data": records}
