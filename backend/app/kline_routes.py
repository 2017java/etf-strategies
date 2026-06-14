from fastapi import APIRouter, Query
from datetime import date, timedelta

from app.datasource import create_data_store

router = APIRouter(prefix="/api/kline", tags=["kline"])


@router.get("/{code}")
def get_kline(
    code: str,
    days: int = Query(120, ge=1, le=500),
):
    end_date = date.today()
    start_date = end_date - timedelta(days=int(days * 1.5))

    store = create_data_store()
    store.ensure([code], start_date, end_date)
    df = store.load([code], start_date, end_date)
    if df.empty:
        return {"code": code, "name": "", "kline": []}

    df = df.reset_index()
    if "date" in df.columns:
        df["date"] = df["date"].apply(lambda d: d.isoformat() if hasattr(d, "isoformat") else str(d))

    kline = df.to_dict(orient="records")

    name = ""
    if "name" in df.columns and len(df) > 0:
        name = str(df["name"].iloc[0]) if df["name"].iloc[0] else ""

    return {"code": code, "name": name, "kline": kline}
