import sys
sys.path.insert(0, 'c:/Users/smipl/WorkBuddy/etf trading strategy/backend')
import akshare as ak
import pandas as pd

# Target ETF codes to verify
target_codes = {
    "510300", "510500", "512100", "159915", "560050", "159901", "588030", "159920", "588000",
    "159739", "159669", "159732", "588200", "159806", "515120", "562510", "512170", "159857",
    "159928", "512690", "159755", "159222", "515880", "512630", "512200", "512660", "159819",
    "159995", "515220", "510410", "159516", "159309", "515070", "159611", "512400", "517520",
    "159608", "159870", "159326", "159566", "159770", "512880"
}

expected_names = {
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

# Use fund_etf_spot_em to get real-time ETF list from East Money
try:
    df_spot = ak.fund_etf_spot_em()
    print(f"Got {len(df_spot)} ETFs from East Money")
    print(f"Columns: {list(df_spot.columns)}")
    print()
    # Find the columns for code and name
    code_col = None
    name_col = None
    for col in df_spot.columns:
        col_str = str(col)
        if '代码' in col_str or 'code' in col_str.lower():
            code_col = col
        if '简称' in col_str or '名称' in col_str or 'name' in col_str.lower():
            name_col = col
    print(f"Code column: {code_col}, Name column: {name_col}")
    print()
    if code_col and name_col:
        # Create lookup dict
        em_dict = {}
        for _, row in df_spot.iterrows():
            code = str(row[code_col]).strip()
            name = str(row[name_col]).strip() if name_col else None
            if code:
                em_dict[code] = name

        # Compare
        print(f"{'Code':<10} {'Expected Name':<16} {'East Money Name':<20} {'Status'}")
        print("-" * 70)
        matched = 0
        mismatched = 0
        missing = 0
        for code in sorted(target_codes):
            exp = expected_names.get(code, "")
            em_name = em_dict.get(code, None)
            if em_name is None:
                status = "NOT_IN_EM"
                missing += 1
            elif exp in em_name or em_name in exp:
                status = "OK"
                matched += 1
            else:
                status = f"MISMATCH"
                mismatched += 1
            print(f"{code:<10} {exp:<16} {em_name or 'N/A':<20} {status}")

        print()
        print(f"Total: {len(target_codes)}")
        print(f"Matched: {matched}")
        print(f"Mismatch: {mismatched}")
        print(f"Missing from EM: {missing}")
    else:
        print("Could not identify code/name columns")
        print(df_spot.head(3).to_string())

except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()