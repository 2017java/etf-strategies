import sys
sys.path.insert(0, 'c:/Users/smipl/WorkBuddy/etf trading strategy/backend')

from app.data_fetcher import fetch_all_etf_data, _get_t1_t2_history, _get_yesterday_close_sina
from app.calculator import calculate_metrics

raw_data, trading = fetch_all_etf_data()
items = calculate_metrics(raw_data)

for item in items:
    if item['code'] in ('159732', '159995', '512100'):
        print(item['code'], item['name'])
        print('  current_price:', item['current_price'])
        print('  yesterday_close:', item.get('yesterday_close'))
        print('  t2_close:', item.get('t2_close'))
        print('  current_change_pct:', item['current_change_pct'])
        print('  two_day_change_pct:', item['two_day_change_pct'])
        print('  data_type:', item['data_type'])
        print()
