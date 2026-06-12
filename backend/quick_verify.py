import sys, os
sys.path.insert(0, 'c:/Users/smipl/WorkBuddy/etf trading strategy/backend')

# Try to verify ETF names by fetching real-time data one by one
# Use the backend's existing data fetching logic

target_codes = [
    "510300", "510500", "512100", "159915", "560050", "159901", "588030", "159920", "588000",
    "159739", "159669", "159732", "588200", "159806", "515120", "562510", "512170", "159857",
    "159928", "512690", "159755", "159222", "515880", "512630", "512200", "512660", "159819",
    "159995", "515220", "510410", "159516", "159309", "515070", "159611", "512400", "517520",
    "159608", "159870", "159326", "159566", "159770", "512880"
]

expected = {
    "510300": "沪深300ETF", "510500": "中证500ETF", "512100": "中证1000ETF", "159915": "创业板ETF",
    "560050": "科创50ETF龙头", "159901": "深证100ETF", "588030": "科创芯片ETF", "159920": "恒生ETF",
    "588000": "科创50ETF", "159739": "恒生医疗ETF", "159669": "食品饮料ETF", "159732": "消费电子ETF",
    "588200": "科创半导体ETF", "159806": "新能源车ETF", "515120": "创新药ETF", "562510": "智能汽车ETF",
    "512170": "医疗ETF", "159857": "光伏ETF", "159928": "消费ETF", "512690": "酒ETF",
    "159755": "电池ETF", "159222": "自由现金流ETF", "515880": "通信ETF", "512630": "卫星ETF",
    "512200": "房地产ETF", "512660": "军工ETF", "159819": "人工智能ETF", "159995": "芯片ETF",
    "515220": "煤炭ETF", "510410": "资源ETF", "159516": "半导体设备ETF", "159309": "高端装备ETF",
    "515070": "人工智能AIETF", "159611": "电力ETF", "512400": "有色金属ETF", "517520": "黄金ETF",
    "159608": "生物科技ETF", "159870": "化工ETF", "159326": "机器人ETF", "159566": "储能电池ETF",
    "159770": "畜牧养殖ETF", "512880": "证券ETF",
}

import akshare as ak

# Use stock_zh_a_etf_hist_em which gets ETF daily history
results = []
errors = []

for code in target_codes:
    try:
        df = ak.stock_zh_a_etf_hist(symbol=code, period="daily", start_date="20260401", end_date="20260422", adjust="qfq")
        if df is not None and len(df) > 0:
            # Get the latest name
            col_names = [c for c in df.columns if '简称' in str(c) or '名称' in str(c) or 'name' in str(c).lower()]
            real_name = None
            if col_names:
                real_name = str(df[col_names[0]].iloc[-1]).strip()
            else:
                real_name = str(df.iloc[-1, 0]) if len(df.columns) > 0 else None
            results.append((code, expected.get(code, ""), real_name))
            status = "OK" if expected.get(code, "") == real_name else "MISMATCH"
            print(f"{code}: {expected.get(code,'')} == {real_name} [{status}]")
        else:
            errors.append(code)
            print(f"{code}: NO_DATA")
    except Exception as e:
        errors.append(code)
        print(f"{code}: ERROR - {str(e)[:50]}")

print()
print(f"Results: {len(results)}, Errors: {len(errors)}")
if errors:
    print(f"Failed codes: {errors}")