import akshare as ak
from datetime import datetime

today = datetime.now().strftime("%Y-%m-%d")
print("today:", today)

for code in ['159732', '159995', '512100']:
    prefix = 'sz' if code.startswith('1') else 'sh'
    # fund_etf_hist_sina
    df = ak.fund_etf_hist_sina(symbol=prefix + code)
    df = df.sort_values("date", ascending=False).reset_index(drop=True)
    latest_date = str(df.iloc[0]["date"])
    print(f"\n=== {code} ===")
    print("最新日期:", latest_date)
    print("前3收盘:", [(str(r["date"]), r["close"]) for _, r in df.head(3).iterrows()])

    # minutes
    df2 = ak.stock_zh_a_minute(symbol=prefix + code, period="1", adjust="qfq")
    current = float(df2.iloc[-1]["close"])
    print("当前价:", current)

    # 模拟_get_yesterday_close_sina
    if latest_date == today:
        yc = float(df.iloc[1]["close"])
        mode = "收盘后"
    else:
        yc = float(df.iloc[0]["close"])
        mode = "盘中"
    print(f"模式: {mode}, 昨收={yc}")

    # 模拟_get_t1_t2_history
    if str(df.iloc[0]["date"]) == today:
        t1 = float(df.iloc[1]["close"])
        t2 = float(df.iloc[2]["close"])
        hmode = "收盘后"
    else:
        t1 = float(df.iloc[0]["close"])
        t2 = float(df.iloc[1]["close"])
        hmode = "盘中"
    print(f"T1={t1}, T2={t2} ({hmode})")

    change = round((current - yc) / yc * 100, 2)
    two_day = round((current - t2) / t2 * 100, 2)
    print(f"正确涨跌幅={change}%, 两日={two_day}%")
