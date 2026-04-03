"""
Coze 编程智能体 - 飞书多维表格数据分析助手
此代码上传到 Coze 编程智能体平台

功能:
1. 飞书多维表格数据操作 (增删改查)
2. 数据统计分析 (增长率、同环比、占比等)
3. 意图解析和智能回复
"""

import json
import re
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from collections import defaultdict


class FeishuBitableClient:
    def __init__(self, app_token: str, table_id: str):
        self.app_token = app_token
        self.table_id = table_id
        self.base_url = "https://open.larkoffice.com/open-apis/bitable/v1"
    
    def _get_headers(self) -> Dict[str, str]:
        return {
            "Authorization": "Bearer {tenant_access_token}",
            "Content-Type": "application/json"
        }
    
    def _make_request(self, method: str, endpoint: str, data: Dict = None) -> Dict:
        import requests
        url = f"{self.base_url}{endpoint}"
        headers = self._get_headers()
        
        if method == "GET":
            response = requests.get(url, headers=headers, params=data)
        elif method == "POST":
            response = requests.post(url, headers=headers, json=data)
        elif method == "PUT":
            response = requests.put(url, headers=headers, json=data)
        elif method == "DELETE":
            response = requests.delete(url, headers=headers)
        else:
            return {"code": -1, "msg": f"不支持的请求方法: {method}"}
        
        return response.json()
    
    def list_records(
        self,
        view_id: str = None,
        field_names: List[str] = None,
        sort: List[Dict] = None,
        filter_condition: Dict = None,
        page_size: int = 100,
        page_token: str = None
    ) -> Dict:
        endpoint = f"/apps/{self.app_token}/tables/{self.table_id}/records/search"
        
        data = {"page_size": page_size}
        
        if view_id:
            data["view_id"] = view_id
        if field_names:
            data["field_names"] = field_names
        if sort:
            data["sort"] = sort
        if filter_condition:
            data["filter"] = filter_condition
        if page_token:
            data["page_token"] = page_token
        
        return self._make_request("POST", endpoint, data)
    
    def get_record(self, record_id: str) -> Dict:
        endpoint = f"/apps/{self.app_token}/tables/{self.table_id}/records/{record_id}"
        return self._make_request("GET", endpoint)
    
    def create_record(self, fields: Dict[str, Any]) -> Dict:
        endpoint = f"/apps/{self.app_token}/tables/{self.table_id}/records"
        data = {
            "fields": fields
        }
        return self._make_request("POST", endpoint, data)
    
    def update_record(self, record_id: str, fields: Dict[str, Any]) -> Dict:
        endpoint = f"/apps/{self.app_token}/tables/{self.table_id}/records/{record_id}"
        data = {
            "fields": fields
        }
        return self._make_request("PUT", endpoint, data)
    
    def delete_record(self, record_id: str) -> Dict:
        endpoint = f"/apps/{self.app_token}/tables/{self.table_id}/records/{record_id}"
        return self._make_request("DELETE", endpoint)
    
    def batch_create_records(self, records: List[Dict[str, Any]]) -> Dict:
        endpoint = f"/apps/{self.app_token}/tables/{self.table_id}/records/batch_create"
        data = {
            "records": [{"fields": r} for r in records]
        }
        return self._make_request("POST", endpoint, data)
    
    def get_fields(self) -> Dict:
        endpoint = f"/apps/{self.app_token}/tables/{self.table_id}/fields"
        return self._make_request("GET", endpoint)


class DataAnalyzer:
    @staticmethod
    def calculate_growth_rate(current: float, previous: float) -> float:
        if previous == 0:
            return 0.0 if current == 0 else float('inf')
        return ((current - previous) / previous) * 100
    
    @staticmethod
    def calculate_yoy(current: float, last_year: float) -> Dict[str, Any]:
        if last_year == 0:
            return {
                "value": current,
                "yoy_value": last_year,
                "yoy_rate": None,
                "yoy_change": current,
                "message": "去年同期数据为0，无法计算同比增长率"
            }
        yoy_rate = ((current - last_year) / last_year) * 100
        return {
            "value": current,
            "yoy_value": last_year,
            "yoy_rate": round(yoy_rate, 2),
            "yoy_change": round(current - last_year, 2),
            "message": f"同比增长 {yoy_rate:.2f}%"
        }
    
    @staticmethod
    def calculate_mom(current: float, last_month: float) -> Dict[str, Any]:
        if last_month == 0:
            return {
                "value": current,
                "mom_value": last_month,
                "mom_rate": None,
                "mom_change": current,
                "message": "上月数据为0，无法计算环比增长率"
            }
        mom_rate = ((current - last_month) / last_month) * 100
        return {
            "value": current,
            "mom_value": last_month,
            "mom_rate": round(mom_rate, 2),
            "mom_change": round(current - last_month, 2),
            "message": f"环比增长 {mom_rate:.2f}%"
        }
    
    @staticmethod
    def calculate_proportion(part: float, total: float) -> Dict[str, Any]:
        if total == 0:
            return {
                "part": part,
                "total": total,
                "proportion": None,
                "percentage": None,
                "message": "总数为0，无法计算占比"
            }
        proportion = part / total
        percentage = proportion * 100
        return {
            "part": part,
            "total": total,
            "proportion": round(proportion, 4),
            "percentage": round(percentage, 2),
            "message": f"占比 {percentage:.2f}%"
        }
    
    @staticmethod
    def calculate_statistics(values: List[float]) -> Dict[str, Any]:
        if not values:
            return {"error": "数据为空"}
        
        sorted_values = sorted(values)
        n = len(values)
        
        total = sum(values)
        mean = total / n
        median = sorted_values[n // 2] if n % 2 == 1 else (sorted_values[n//2-1] + sorted_values[n//2]) / 2
        
        variance = sum((x - mean) ** 2 for x in values) / n
        std_dev = variance ** 0.5
        
        return {
            "count": n,
            "sum": round(total, 2),
            "mean": round(mean, 2),
            "median": round(median, 2),
            "min": sorted_values[0],
            "max": sorted_values[-1],
            "range": round(sorted_values[-1] - sorted_values[0], 2),
            "variance": round(variance, 2),
            "std_dev": round(std_dev, 2)
        }
    
    @staticmethod
    def group_by_field(records: List[Dict], field_name: str) -> Dict[str, List[Dict]]:
        grouped = defaultdict(list)
        for record in records:
            field_value = record.get("fields", {}).get(field_name, "未分类")
            if isinstance(field_value, list):
                field_value = field_value[0] if field_value else "未分类"
            grouped[str(field_value)].append(record)
        return dict(grouped)
    
    @staticmethod
    def aggregate_by_field(
        records: List[Dict],
        group_field: str,
        value_field: str,
        aggregation: str = "sum"
    ) -> Dict[str, Any]:
        grouped = DataAnalyzer.group_by_field(records, group_field)
        
        results = {}
        for group_name, group_records in grouped.items():
            values = []
            for record in group_records:
                val = record.get("fields", {}).get(value_field)
                if val is not None:
                    try:
                        values.append(float(val))
                    except (ValueError, TypeError):
                        continue
            
            if not values:
                results[group_name] = {"count": 0, "value": 0}
                continue
            
            if aggregation == "sum":
                results[group_name] = {"count": len(values), "value": sum(values)}
            elif aggregation == "avg":
                results[group_name] = {"count": len(values), "value": sum(values) / len(values)}
            elif aggregation == "count":
                results[group_name] = {"count": len(values), "value": len(values)}
            elif aggregation == "max":
                results[group_name] = {"count": len(values), "value": max(values)}
            elif aggregation == "min":
                results[group_name] = {"count": len(values), "value": min(values)}
        
        return results


class IntentParser:
    QUERY_PATTERNS = {
        "查询所有": [r"查询.*全部|所有.*数据|列出.*数据|查看.*数据"],
        "查询条件": [r"查询.*等于|等于.*的|筛选.*为|查找.*是"],
        "统计汇总": [r"统计|汇总|总计|合计|一共|多少"],
        "增长率": [r"增长率|增长.*率|增幅|涨幅"],
        "同比": [r"同比|去年同期|去年.*对比"],
        "环比": [r"环比|上月|上月.*对比|月度.*变化"],
        "占比": [r"占比|比例|百分比|份额"],
        "趋势": [r"趋势|走势|变化趋势|发展"],
        "新增": [r"新增|添加|创建|增加.*记录"],
        "修改": [r"修改|更新|编辑|更改"],
        "删除": [r"删除|移除|去掉"],
    }
    
    @classmethod
    def parse(cls, query: str) -> Dict[str, Any]:
        query = query.strip()
        
        result = {
            "original_query": query,
            "intent": "unknown",
            "entities": {},
            "filters": {},
            "aggregation": None,
            "time_range": None
        }
        
        for intent, patterns in cls.QUERY_PATTERNS.items():
            for pattern in patterns:
                if re.search(pattern, query):
                    result["intent"] = intent
                    break
            if result["intent"] != "unknown":
                break
        
        result["entities"] = cls._extract_entities(query)
        result["time_range"] = cls._extract_time_range(query)
        
        return result
    
    @classmethod
    def _extract_entities(cls, query: str) -> Dict[str, Any]:
        entities = {}
        
        number_pattern = r'(\d+(?:\.\d+)?)\s*(万|千|百|%)?'
        numbers = re.findall(number_pattern, query)
        if numbers:
            entities["numbers"] = [{"value": float(n[0]), "unit": n[1]} for n in numbers]
        
        product_keywords = ["铂智3X", "凯美瑞", "汉兰达", "雷凌", "威兰达", "赛那"]
        for keyword in product_keywords:
            if keyword in query:
                entities["product"] = keyword
                break
        
        status_keywords = ["目标线索", "有效线索", "成交", "试驾", "留资"]
        for keyword in status_keywords:
            if keyword in query:
                entities["status"] = keyword
                break
        
        return entities
    
    @classmethod
    def _extract_time_range(cls, query: str) -> Optional[Dict[str, str]]:
        today = datetime.now()
        
        if "今天" in query or "今日" in query:
            return {
                "start": today.strftime("%Y-%m-%d"),
                "end": today.strftime("%Y-%m-%d"),
                "type": "today"
            }
        elif "昨天" in query or "昨日" in query:
            yesterday = today - timedelta(days=1)
            return {
                "start": yesterday.strftime("%Y-%m-%d"),
                "end": yesterday.strftime("%Y-%m-%d"),
                "type": "yesterday"
            }
        elif "本周" in query:
            start = today - timedelta(days=today.weekday())
            return {
                "start": start.strftime("%Y-%m-%d"),
                "end": today.strftime("%Y-%m-%d"),
                "type": "this_week"
            }
        elif "上周" in query:
            start = today - timedelta(days=today.weekday() + 7)
            end = start + timedelta(days=6)
            return {
                "start": start.strftime("%Y-%m-%d"),
                "end": end.strftime("%Y-%m-%d"),
                "type": "last_week"
            }
        elif "本月" in query:
            start = today.replace(day=1)
            return {
                "start": start.strftime("%Y-%m-%d"),
                "end": today.strftime("%Y-%m-%d"),
                "type": "this_month"
            }
        elif "上月" in query or "上个月" in query:
            first_of_month = today.replace(day=1)
            last_of_prev = first_of_month - timedelta(days=1)
            start = last_of_prev.replace(day=1)
            return {
                "start": start.strftime("%Y-%m-%d"),
                "end": last_of_prev.strftime("%Y-%m-%d"),
                "type": "last_month"
            }
        elif "今年" in query:
            start = today.replace(month=1, day=1)
            return {
                "start": start.strftime("%Y-%m-%d"),
                "end": today.strftime("%Y-%m-%d"),
                "type": "this_year"
            }
        
        date_pattern = r'(\d{4}[-/年]\d{1,2}[-/月]\d{1,2}日?)'
        dates = re.findall(date_pattern, query)
        if len(dates) >= 2:
            return {
                "start": dates[0].replace("年", "-").replace("月", "-").replace("日", "").replace("/", "-"),
                "end": dates[1].replace("年", "-").replace("月", "-").replace("日", "").replace("/", "-"),
                "type": "custom"
            }
        elif len(dates) == 1:
            date_str = dates[0].replace("年", "-").replace("月", "-").replace("日", "").replace("/", "-")
            return {
                "start": date_str,
                "end": date_str,
                "type": "custom"
            }
        
        return None


class FeishuBitableHandler:
    def __init__(self):
        self.client = None
    
    def init_client(self, app_token: str, table_id: str):
        self.client = FeishuBitableClient(app_token, table_id)
    
    def handle_query(self, query: str, context: Dict = None) -> str:
        intent_result = IntentParser.parse(query)
        intent = intent_result["intent"]
        
        if intent == "查询所有":
            return self._handle_query_all(intent_result)
        elif intent == "统计汇总":
            return self._handle_statistics(intent_result)
        elif intent == "增长率":
            return self._handle_growth_rate(intent_result)
        elif intent == "同比":
            return self._handle_yoy(intent_result)
        elif intent == "环比":
            return self._handle_mom(intent_result)
        elif intent == "占比":
            return self._handle_proportion(intent_result)
        elif intent == "新增":
            return self._handle_create(intent_result)
        elif intent == "修改":
            return self._handle_update(intent_result)
        elif intent == "删除":
            return self._handle_delete(intent_result)
        else:
            return self._handle_general_query(query, intent_result)
    
    def _handle_query_all(self, intent_result: Dict) -> str:
        result = self.client.list_records(page_size=20)
        
        if result.get("code") != 0:
            return f"查询失败: {result.get('msg', '未知错误')}"
        
        records = result.get("data", {}).get("items", [])
        total = result.get("data", {}).get("total", 0)
        
        if not records:
            return "没有找到数据"
        
        response = f"📊 查询结果 (共 {total} 条记录)\n\n"
        
        for i, record in enumerate(records[:10], 1):
            fields = record.get("fields", {})
            response += f"{i}. "
            field_strs = []
            for key, value in list(fields.items())[:5]:
                if isinstance(value, list):
                    value = ", ".join(str(v) for v in value)
                field_strs.append(f"{key}: {value}")
            response += " | ".join(field_strs) + "\n"
        
        if total > 10:
            response += f"\n... 还有 {total - 10} 条记录"
        
        return response
    
    def _handle_statistics(self, intent_result: Dict) -> str:
        result = self.client.list_records(page_size=500)
        
        if result.get("code") != 0:
            return f"查询失败: {result.get('msg', '未知错误')}"
        
        records = result.get("data", {}).get("items", [])
        
        if not records:
            return "没有找到数据"
        
        fields_result = self.client.get_fields()
        if fields_result.get("code") == 0:
            fields = fields_result.get("data", {}).get("items", [])
            numeric_fields = [f for f in fields if f.get("property", {}).get("field_type") in [1, 2, 3]]
        else:
            numeric_fields = []
        
        if not numeric_fields:
            return "未找到数值类型的字段进行统计"
        
        field_name = numeric_fields[0].get("field_name", "")
        values = []
        for record in records:
            val = record.get("fields", {}).get(field_name)
            if val is not None:
                try:
                    values.append(float(val))
                except (ValueError, TypeError):
                    continue
        
        if not values:
            return f"字段 '{field_name}' 没有有效数据"
        
        stats = DataAnalyzer.calculate_statistics(values)
        
        response = f"📈 统计分析结果\n\n"
        response += f"字段: {field_name}\n"
        response += f"记录数: {stats['count']}\n"
        response += f"总和: {stats['sum']}\n"
        response += f"平均值: {stats['mean']}\n"
        response += f"中位数: {stats['median']}\n"
        response += f"最小值: {stats['min']}\n"
        response += f"最大值: {stats['max']}\n"
        response += f"极差: {stats['range']}\n"
        response += f"标准差: {stats['std_dev']}\n"
        
        return response
    
    def _handle_growth_rate(self, intent_result: Dict) -> str:
        return "📈 增长率分析\n\n请提供具体的时间范围和指标，例如:\n'计算本月铂智3X线索的增长率'"
    
    def _handle_yoy(self, intent_result: Dict) -> str:
        return "📊 同比分析\n\n请提供具体的数据，例如:\n'分析铂智3X本月线索的同比增长'"
    
    def _handle_mom(self, intent_result: Dict) -> str:
        return "📊 环比分析\n\n请提供具体的数据，例如:\n'分析铂智3X本月线索的环比变化'"
    
    def _handle_proportion(self, intent_result: Dict) -> str:
        result = self.client.list_records(page_size=500)
        
        if result.get("code") != 0:
            return f"查询失败: {result.get('msg', '未知错误')}"
        
        records = result.get("data", {}).get("items", [])
        
        if not records:
            return "没有找到数据"
        
        fields_result = self.client.get_fields()
        if fields_result.get("code") != 0:
            return "无法获取字段信息"
        
        fields = fields_result.get("data", {}).get("items", [])
        
        group_field = None
        for f in fields:
            if f.get("property", {}).get("field_type") in [3, 4, 7]:
                group_field = f.get("field_name")
                break
        
        if not group_field:
            return "未找到可用于分组的字段"
        
        aggregation_result = DataAnalyzer.aggregate_by_field(records, group_field, "记录", "count")
        
        total_count = sum(r["count"] for r in aggregation_result.values())
        
        response = f"📊 占比分析 (按 {group_field} 分组)\n\n"
        
        sorted_results = sorted(aggregation_result.items(), key=lambda x: x[1]["count"], reverse=True)
        
        for group_name, data in sorted_results:
            prop = DataAnalyzer.calculate_proportion(data["count"], total_count)
            response += f"• {group_name}: {data['count']} 条 ({prop['percentage']}%)\n"
        
        response += f"\n总计: {total_count} 条"
        
        return response
    
    def _handle_create(self, intent_result: Dict) -> str:
        return "➕ 新增记录\n\n请提供要新增的数据，格式如下:\n'新增记录: 字段1=值1, 字段2=值2'"
    
    def _handle_update(self, intent_result: Dict) -> str:
        return "✏️ 修改记录\n\n请提供要修改的记录ID和新值，格式如下:\n'修改记录 record_id: 字段1=新值1'"
    
    def _handle_delete(self, intent_result: Dict) -> str:
        return "🗑️ 删除记录\n\n请提供要删除的记录ID，格式如下:\n'删除记录 record_id'"
    
    def _handle_general_query(self, query: str, intent_result: Dict) -> str:
        entities = intent_result.get("entities", {})
        product = entities.get("product", "")
        status = entities.get("status", "")
        
        filter_conditions = []
        
        if product:
            filter_conditions.append({
                "conjunction": "and",
                "conditions": [{
                    "field_name": "车型",
                    "operator": "is",
                    "value": [product]
                }]
            })
        
        if status:
            filter_conditions.append({
                "conjunction": "and",
                "conditions": [{
                    "field_name": "状态",
                    "operator": "contains",
                    "value": [status]
                }]
            })
        
        request_data = {"page_size": 50}
        if filter_conditions:
            request_data["filter"] = {
                "conjunction": "and",
                "conditions": filter_conditions
            }
        
        result = self.client.list_records(**request_data)
        
        if result.get("code") != 0:
            return f"查询失败: {result.get('msg', '未知错误')}"
        
        records = result.get("data", {}).get("items", [])
        total = result.get("data", {}).get("total", 0)
        
        if not records:
            return "没有找到匹配的数据"
        
        response = f"🔍 查询结果\n"
        if product:
            response += f"车型: {product}\n"
        if status:
            response += f"状态: {status}\n"
        response += f"共找到 {total} 条记录\n\n"
        
        for i, record in enumerate(records[:10], 1):
            fields = record.get("fields", {})
            response += f"{i}. "
            field_strs = []
            for key, value in list(fields.items())[:4]:
                if isinstance(value, list):
                    value = ", ".join(str(v) for v in value)
                field_strs.append(f"{key}: {value}")
            response += " | ".join(field_strs) + "\n"
        
        return response


handler = FeishuBitableHandler()


def handler(event, context):
    """
    Coze 智能体入口函数
    
    Args:
        event: 包含用户输入的事件对象
        context: 上下文信息
    
    Returns:
        处理结果字符串
    """
    query = event.get("query", "")
    
    app_token = ""
    table_id = ""
    
    if context:
        if isinstance(context, dict):
            app_token = context.get("app_token", "")
            table_id = context.get("table_id", "")
    
    if not app_token or not table_id:
        return "请先配置多维表格的 App Token 和 Table ID"
    
    handler.init_client(app_token, table_id)
    
    return handler.handle_query(query, context)


def main(query: str, app_token: str = "", table_id: str = "") -> str:
    """
    本地测试入口
    
    Args:
        query: 用户查询
        app_token: 多维表格 App Token
        table_id: 多维表格 Table ID
    
    Returns:
        处理结果
    """
    context = {
        "app_token": app_token,
        "table_id": table_id
    }
    event = {"query": query}
    return handler(event, context)


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("用法: python coze_agent.py <query> [app_token] [table_id]")
        sys.exit(1)
    
    query = sys.argv[1]
    app_token = sys.argv[2] if len(sys.argv) > 2 else ""
    table_id = sys.argv[3] if len(sys.argv) > 3 else ""
    
    result = main(query, app_token, table_id)
    print(result)
