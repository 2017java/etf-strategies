import urllib.request
import json
import time

url = "http://localhost:8000/api/refresh"
print("Calling API...")
start = time.time()
try:
    req = urllib.request.Request(url, data=b'', method='POST')
    with urllib.request.urlopen(req, timeout=180) as resp:
        raw = resp.read().decode('utf-8')
        print(f"Response received in {time.time()-start:.1f}s, length={len(raw)}")
        d = json.loads(raw)
        items = d['data']['etf_list']
        for item in items:
            if item['code'] in ('159732', '159995', '512100'):
                print(item['code'], '涨跌幅', item['current_change_pct'],
                      '两日累计', item['two_day_change_pct'],
                      'yclose', item.get('yesterday_close'),
                      't2close', item.get('t2_close'))
except Exception as e:
    print(f"Error: {e}")
