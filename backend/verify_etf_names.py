import sys
sys.path.insert(0, 'c:/Users/smipl/WorkBuddy/etf trading strategy/backend')
import akshare as ak
import pandas as pd
from collections import defaultdict

# ETF codes to verify
etf_pool = {
    "宽基ETF": [
        {"code": "510300", "name": "沪深300ETF"},
        {"code": "510500", "name": "中证500ETF"},
        {"code": "512100", "name": "中证1000ETF"},
        {"code": "159915", "name": "创业板ETF"},
        {"code": "560050", "name": "科创50ETF龙头"},
        {"code": "159901", "name": "深证100ETF"},
        {"code": "588030", "name": "科创芯片ETF"},
        {"code": "159920", "name": "恒生ETF"},
        {"code": "588000", "name": "科创50ETF"},
    ],
    "行业ETF": [
        {"code": "159739", "name": "恒生医疗ETF"},
        {"code": "159669", "name": "食品饮料ETF"},
        {"code": "159732", "name": "消费电子ETF"},
        {"code": "588200", "name": "科创半导体ETF"},
        {"code": "159806", "name": "新能源车ETF"},
        {"code": "515120", "name": "创新药ETF"},
        {"code": "562510", "name": "智能汽车ETF"},
        {"code": "512170", "name": "医疗ETF"},
        {"code": "159857", "name": "光伏ETF"},
        {"code": "159928", "name": "消费ETF"},
        {"code": "512690", "name": "酒ETF"},
        {"code": "159755", "name": "电池ETF"},
        {"code": "159222", "name": "自由现金流ETF"},
        {"code": "515880", "name": "通信ETF"},
        {"code": "512630", "name": "卫星ETF"},
        {"code": "512200", "name": "房地产ETF"},
        {"code": "512660", "name": "军工ETF"},
        {"code": "159819", "name": "人工智能ETF"},
        {"code": "159995", "name": "芯片ETF"},
        {"code": "515220", "name": "煤炭ETF"},
        {"code": "510410", "name": "资源ETF"},
        {"code": "159516", "name": "半导体设备ETF"},
        {"code": "159309", "name": "高端装备ETF"},
        {"code": "515070", "name": "人工智能AIETF"},
        {"code": "159611", "name": "电力ETF"},
        {"code": "512400", "name": "有色金属ETF"},
        {"code": "517520", "name": "黄金ETF"},
        {"code": "159608", "name": "生物科技ETF"},
        {"code": "159870", "name": "化工ETF"},
        {"code": "159326", "name": "机器人ETF"},
        {"code": "159566", "name": "储能电池ETF"},
        {"code": "159770", "name": "畜牧养殖ETF"},
        {"code": "512880", "name": "证券ETF"},
    ],
}

# Get all codes
all_codes = []
for category, items in etf_pool.items():
    for item in items:
        all_codes.append((item["code"], item["name"], category))

print(f"Total ETFs to verify: {len(all_codes)}")
print()

# Use fund_etf_hist_em to get real name
results = []
errors = []

for code, expected_name, category in all_codes:
    try:
        # fund_etf_hist_em gets historical data, includes the name
        df = ak.fund_etf_hist_em(symbol=code, period="daily", adjust="qfq")
        if df is not None and len(df) > 0:
            # The name is usually in the column or we get it from the first row
            real_name = None
            # Try to find name - sometimes it's in the data itself or we need another call
            # Let's use fund_etf_sector_em to check
            actual_name = df.iloc[-1].get('名称', None) or df.iloc[-1].get('name', None)
            if actual_name is None:
                # Try fund_etf_info_em
                try:
                    info = ak.fund_etf_info_em(symbol=code)
                    if info is not None:
                        for col in info.columns:
                            if '简称' in str(col) or '名称' in str(col) or 'name' in str(col).lower():
                                actual_name = info[col].iloc[0]
                                break
                        if actual_name is None:
                            actual_name = str(info.iloc[0, 0]) if len(info) > 0 else None
                except:
                    pass

            results.append({
                "code": code,
                "expected": expected_name,
                "actual": actual_name,
                "category": category,
                "match": expected_name == actual_name if actual_name else False,
                "error": None
            })
            status = "OK" if (actual_name and expected_name in actual_name) or not actual_name else "NAME_MISMATCH"
            print(f"{code} | {expected_name} | {actual_name} | {status}")
        else:
            errors.append(code)
            print(f"{code} | {expected_name} | NO_DATA")
    except Exception as e:
        errors.append(code)
        print(f"{code} | {expected_name} | ERROR: {str(e)[:60]}")

print()
print(f"Errors (no data): {errors}")
print()

# Summary
mismatches = [r for r in results if r['error'] is None and not r['match']]
print(f"Total verified: {len(results)}")
print(f"Name mismatches: {len(mismatches)}")
if mismatches:
    print("\n=== MISMATCHES ===")
    for m in mismatches:
        print(f"  {m['code']}: expected='{m['expected']}', actual='{m['actual']}'")