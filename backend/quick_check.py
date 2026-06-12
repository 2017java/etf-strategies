import akshare as ak
from datetime import datetime

today = datetime.now().strftime("%Y-%m-%d")

# 测试单只ETF（不走HTTP API，直接算）
for code in ['159732']:
    prefix = 'sz'
    # 1. 昨收
    df_sina = ak.fund_etf_hist_sina(symbol=prefix + code)
    df_sina = df_sina.sort_values("date", ascending=False).reset_index(drop=True)
    latest_date = str(df_sina.iloc[0]["date"])
    if latest_date == today:
        yc = float(df_sina.iloc[1]["close"])
        mode = "收盘后"
    else:
        yc = float(df_sina.iloc[0]["close"])
        mode = "盘中"
    # 2. T-2
    if str(df_sina.iloc[0]["date"]) == today:
        t2 = float(df_sina.iloc[2]["close"])
    else:
        t2 = float(df_sina.iloc[1]["close"])
    # 3. 当前价
    df_min = ak.stock_zh_a_minute(symbol=prefix + code, period="1", adjust="qfq")
    current = float(df_min.iloc[-1]["close"])
    change = round((current - yc) / yc * 100, 2)
    two_day = round((current - t2) / t2 * 100, 2)
    print(f"代码: {code} | 模式: {mode}")
    print(f"当前价: {current} | 昨收: {yc} | T-2: {t2}")
    print(f"涨跌幅: {change}% | 两日累计: {two_day}%")
