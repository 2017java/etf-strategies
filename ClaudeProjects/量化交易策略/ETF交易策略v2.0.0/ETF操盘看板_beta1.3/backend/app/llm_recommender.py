import os
import json
import logging
import httpx
from typing import List, Dict
from app.config import LLM_API_KEY, LLM_API_BASE, LLM_MODEL

logger = logging.getLogger(__name__)


def fetch_today_news() -> str:
    """获取当日财经新闻摘要"""
    try:
        import akshare as ak
        # 尝试获取东方财富重大新闻
        try:
            df = ak.stock_major_news()
            if df is not None and not df.empty:
                # 取最近10条
                recent = df.head(10)
                texts = []
                for _, row in recent.iterrows():
                    title = row.get("title", "")
                    content = row.get("content", "")
                    if title:
                        texts.append(f"{title} {content}")
                return "\n".join(texts[:10])
        except Exception:
            pass

        # fallback: 尝试获取全球财经新闻
        try:
            df = ak.news_eastmoney("财经")
            if df is not None and not df.empty:
                texts = []
                for _, row in df.head(10).iterrows():
                    t = row.get("title", "")
                    if t:
                        texts.append(t)
                return "\n".join(texts)
        except Exception:
            pass
    except Exception:
        pass
    return ""


def build_llm_prompt(news_text: str, etf_summary: str) -> str:
    """构建LLM推荐Prompt"""
    prompt = f"""你是一位专业的A股ETF投资分析师。请根据以下当日财经新闻和ETF行情摘要，推荐5只最值得关注的ETF。

【当日财经新闻】
{news_text if news_text else "今日暂无重大新闻。"}

【ETF行情摘要】
{etf_summary}

【推荐要求】
1. 请从上述ETF中推荐5只，考虑行业热点、政策导向、资金流向等因素。
2. 每只ETF请用一句话说明推荐理由，理由要具体、专业。
3. 输出格式必须为JSON数组，格式如下：
[
  {{"code": "510300", "name": "沪深300ETF", "category": "宽基ETF", "reason": "市场风格偏向大盘蓝筹，沪深300受益明显"}},
  ...
]
4. 只输出JSON数组，不要输出任何其他文字。
"""
    return prompt


def call_llm_api(prompt: str) -> List[Dict]:
    """调用LLM API获取推荐结果"""
    api_key = os.getenv("LLM_API_KEY", LLM_API_KEY)
    api_base = os.getenv("LLM_API_BASE", LLM_API_BASE)
    model = os.getenv("LLM_MODEL", LLM_MODEL)

    print(f"[LLM] call_llm_api: key={'***' if api_key else '(空)'}, base={api_base}, model={model}")

    if not api_key:
        print("[LLM] API Key 为空，跳过")
        logger.info("LLM API Key 未配置，跳过 AI 推荐")
        return []

    try:
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.7,
        }
        url = f"{api_base}/chat/completions"
        print(f"[LLM] 正在调用: {url}")
        logger.info("正在调用 LLM API: %s (model=%s)", api_base, model)
        with httpx.Client(timeout=60) as client:
            resp = client.post(url, headers=headers, json=payload)
            print(f"[LLM] HTTP {resp.status_code}")
            resp.raise_for_status()
            data = resp.json()
            content = data["choices"][0]["message"]["content"]
            print(f"[LLM] 返回内容长度: {len(content)}")
            logger.info("LLM API 返回成功，内容长度: %d", len(content))
            # 尝试提取JSON
            content = content.strip()
            if content.startswith("```json"):
                content = content[7:]
            if content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
            content = content.strip()
            result = json.loads(content)
            if isinstance(result, list):
                print(f"[LLM] JSON 解析成功，{len(result)} 条推荐")
                logger.info("LLM 推荐解析成功，共 %d 条", len(result))
                return result
            print("[LLM] JSON 不是列表")
            return []
    except Exception as e:
        print(f"[LLM] 调用失败: {e}")
        logger.warning("LLM API 调用失败: %s", e)
        return []


def fallback_recommend(etf_list: List[dict]) -> List[Dict]:
    """无LLM API时的回退推荐：基于涨幅+成交量放大综合排序，选取行业ETF为主"""
    # 优先行业ETF，兼顾宽基
    industry_etfs = [e for e in etf_list if e["category"] == "行业ETF"]
    broad_etfs = [e for e in etf_list if e["category"] == "宽基ETF"]

    # 按综合得分排序
    industry_sorted = sorted(industry_etfs, key=lambda x: x["composite_score"], reverse=True)
    broad_sorted = sorted(broad_etfs, key=lambda x: x["composite_score"], reverse=True)

    picks = []
    # 取3只行业+2只宽基
    for e in industry_sorted[:3]:
        picks.append({
            "code": e["code"],
            "name": e["name"],
            "category": e["category"],
            "reason": f"行业ETF中综合得分领先，近两日累计涨幅{e['two_day_change_pct']:.2f}%，成交量放大{e['volume_expand_pct']:.2f}%，资金关注度较高。",
        })
    for e in broad_sorted[:2]:
        picks.append({
            "code": e["code"],
            "name": e["name"],
            "category": e["category"],
            "reason": f"宽基指数表现稳健，当前涨跌幅{e['current_change_pct']:.2f}%，适合作为底仓配置。",
        })

    for i, p in enumerate(picks, 1):
        p["rank"] = i
    return picks


def get_llm_recommendations(etf_list: List[dict]) -> List[Dict]:
    """获取LLM热点推荐TOP5"""
    api_key = os.getenv("LLM_API_KEY", LLM_API_KEY)
    api_base = os.getenv("LLM_API_BASE", LLM_API_BASE)
    model = os.getenv("LLM_MODEL", LLM_MODEL)
    print(f"[LLM] get_llm_recommendations 入口: key={'***' if api_key else '(空)'}, base={api_base}, model={model}")
    logger.info("LLM 配置: key=%s..., base=%s, model=%s", 
                api_key[:16] if api_key else "(空)", api_base, model)

    news_text = fetch_today_news()

    # 构建ETF摘要
    summary_lines = []
    sorted_by_score = sorted(etf_list, key=lambda x: x["composite_score"], reverse=True)
    for e in sorted_by_score[:10]:
        summary_lines.append(
            f"{e['code']} {e['name']} ({e['category']}): 涨跌幅{e['current_change_pct']:.2f}%, "
            f"两日累计{e['two_day_change_pct']:.2f}%, 成交量放大{e['volume_expand_pct']:.2f}%"
        )
    etf_summary = "\n".join(summary_lines)

    # 尝试LLM API
    prompt = build_llm_prompt(news_text, etf_summary)
    llm_result = call_llm_api(prompt)

    if llm_result and len(llm_result) >= 3:
        print(f"[LLM] ✅ 使用 AI 推荐（LLM 返回 {len(llm_result)} 条）")
        logger.info("✅ 使用 AI 推荐（LLM 返回 %d 条）", len(llm_result))
        # 校验code是否在我们的池中
        valid_codes = {e["code"] for e in etf_list}
        filtered = [r for r in llm_result if r.get("code") in valid_codes]
        for r in filtered:
            r["source"] = "llm"
        # 补齐到5个
        existing_codes = {r["code"] for r in filtered}
        for e in sorted_by_score:
            if len(filtered) >= 5:
                break
            if e["code"] not in existing_codes:
                filtered.append({
                    "code": e["code"],
                    "name": e["name"],
                    "category": e["category"],
                    "reason": f"行情表现活跃，综合得分{e['composite_score']:.2f}。",
                    "source": "fallback",
                })
        for i, r in enumerate(filtered[:5], 1):
            r["rank"] = i
        return filtered[:5]

    # 回退到规则推荐
    print("[LLM] ⚠️ 使用量化兜底推荐（LLM 不可用）")
    logger.info("⚠️ 使用量化兜底推荐（LLM 不可用）")
    result = fallback_recommend(etf_list)
    for r in result:
        r["source"] = "fallback"
    return result
