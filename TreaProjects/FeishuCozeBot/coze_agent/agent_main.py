"""
Coze 智能体主入口
用于部署到 Coze 编程平台
"""

import json
from typing import Dict, Any, List, Optional
from bitable_tools import BitableTools, AnalysisTools


class FeishuBitableAgent:
    def __init__(self, app_token: str, table_id: str):
        self.bitable = BitableTools(app_token, table_id)
        self.analysis = AnalysisTools()
    
    def query_records(
        self,
        filter_conditions: Optional[Dict] = None,
        field_names: Optional[List[str]] = None,
        page_size: int = 100
    ) -> str:
        result = self.bitable.search_records(
            filter_expr=filter_conditions,
            field_names=field_names,
            page_size=page_size
        )
        
        if result.get("code") == 0:
            records = result.get("data", {}).get("items", [])
            return json.dumps({
                "success": True,
                "count": len(records),
                "records": records
            }, ensure_ascii=False, indent=2)
        else:
            return json.dumps({
                "success": False,
                "error": result.get("msg", "查询失败")
            }, ensure_ascii=False)
    
    def add_record(self, fields: Dict[str, Any]) -> str:
        result = self.bitable.create_record(fields)
        
        if result.get("code") == 0:
            return json.dumps({
                "success": True,
                "record_id": result.get("data", {}).get("record", {}).get("record_id"),
                "message": "记录添加成功"
            }, ensure_ascii=False)
        else:
            return json.dumps({
                "success": False,
                "error": result.get("msg", "添加失败")
            }, ensure_ascii=False)
    
    def update_record(self, record_id: str, fields: Dict[str, Any]) -> str:
        result = self.bitable.update_record(record_id, fields)
        
        if result.get("code") == 0:
            return json.dumps({
                "success": True,
                "record_id": record_id,
                "message": "记录更新成功"
            }, ensure_ascii=False)
        else:
            return json.dumps({
                "success": False,
                "error": result.get("msg", "更新失败")
            }, ensure_ascii=False)
    
    def delete_record(self, record_id: str) -> str:
        result = self.bitable.delete_record(record_id)
        
        if result.get("code") == 0:
            return json.dumps({
                "success": True,
                "record_id": record_id,
                "message": "记录删除成功"
            }, ensure_ascii=False)
        else:
            return json.dumps({
                "success": False,
                "error": result.get("msg", "删除失败")
            }, ensure_ascii=False)
    
    def batch_add_records(self, records: List[Dict[str, Any]]) -> str:
        result = self.bitable.batch_create(records)
        
        if result.get("code") == 0:
            return json.dumps({
                "success": True,
                "count": len(result.get("data", {}).get("records", [])),
                "message": "批量添加成功"
            }, ensure_ascii=False)
        else:
            return json.dumps({
                "success": False,
                "error": result.get("msg", "批量添加失败")
            }, ensure_ascii=False)
    
    def get_table_structure(self) -> str:
        fields_result = self.bitable.get_fields()
        views_result = self.bitable.get_views()
        
        if fields_result.get("code") == 0:
            fields = fields_result.get("data", {}).get("items", [])
        else:
            fields = []
        
        if views_result.get("code") == 0:
            views = views_result.get("data", {}).get("items", [])
        else:
            views = []
        
        return json.dumps({
            "success": True,
            "fields": [
                {
                    "field_id": f.get("field_id"),
                    "field_name": f.get("field_name"),
                    "type": f.get("type"),
                    "property": f.get("property")
                }
                for f in fields
            ],
            "views": [
                {
                    "view_id": v.get("view_id"),
                    "view_name": v.get("view_name"),
                    "view_type": v.get("view_type")
                }
                for v in views
            ]
        }, ensure_ascii=False, indent=2)
    
    def analyze_growth(
        self,
        value_field: str,
        time_field: str,
        filter_conditions: Optional[Dict] = None
    ) -> str:
        result = self.bitable.search_records(
            filter_expr=filter_conditions,
            page_size=500
        )
        
        if result.get("code") != 0:
            return json.dumps({
                "success": False,
                "error": "数据查询失败"
            }, ensure_ascii=False)
        
        records = result.get("data", {}).get("items", [])
        
        data = []
        for record in records:
            fields = record.get("fields", {})
            data.append({
                time_field: fields.get(time_field),
                value_field: fields.get(value_field)
            })
        
        analysis_result = self.analysis.growth_analysis(data, value_field, time_field)
        
        return json.dumps({
            "success": True,
            "analysis_type": "增长率分析",
            "result": analysis_result
        }, ensure_ascii=False, indent=2)
    
    def analyze_proportion(
        self,
        group_field: str,
        value_field: Optional[str] = None,
        filter_conditions: Optional[Dict] = None
    ) -> str:
        result = self.bitable.search_records(
            filter_expr=filter_conditions,
            page_size=500
        )
        
        if result.get("code") != 0:
            return json.dumps({
                "success": False,
                "error": "数据查询失败"
            }, ensure_ascii=False)
        
        records = result.get("data", {}).get("items", [])
        
        data = []
        for record in records:
            fields = record.get("fields", {})
            data.append({
                group_field: fields.get(group_field),
                value_field: fields.get(value_field) if value_field else None
            })
        
        analysis_result = self.analysis.proportion_analysis(data, group_field, value_field)
        
        return json.dumps({
            "success": True,
            "analysis_type": "占比分析",
            "result": analysis_result
        }, ensure_ascii=False, indent=2)
    
    def analyze_trend(
        self,
        value_field: str,
        time_field: str,
        filter_conditions: Optional[Dict] = None
    ) -> str:
        result = self.bitable.search_records(
            filter_expr=filter_conditions,
            page_size=500
        )
        
        if result.get("code") != 0:
            return json.dumps({
                "success": False,
                "error": "数据查询失败"
            }, ensure_ascii=False)
        
        records = result.get("data", {}).get("items", [])
        
        data = []
        for record in records:
            fields = record.get("fields", {})
            data.append({
                time_field: fields.get(time_field),
                value_field: fields.get(value_field)
            })
        
        analysis_result = self.analysis.trend_analysis(data, value_field, time_field)
        
        return json.dumps({
            "success": True,
            "analysis_type": "趋势分析",
            "result": analysis_result
        }, ensure_ascii=False, indent=2)
    
    def analyze_yoy(
        self,
        value_field: str,
        current_filter: Dict,
        previous_year_filter: Dict
    ) -> str:
        current_result = self.bitable.search_records(
            filter_expr=current_filter,
            page_size=500
        )
        previous_result = self.bitable.search_records(
            filter_expr=previous_year_filter,
            page_size=500
        )
        
        if current_result.get("code") != 0 or previous_result.get("code") != 0:
            return json.dumps({
                "success": False,
                "error": "数据查询失败"
            }, ensure_ascii=False)
        
        current_records = current_result.get("data", {}).get("items", [])
        previous_records = previous_result.get("data", {}).get("items", [])
        
        current_data = [
            {"value": r.get("fields", {}).get(value_field)}
            for r in current_records
        ]
        previous_data = [
            {"value": r.get("fields", {}).get(value_field)}
            for r in previous_records
        ]
        
        analysis_result = self.analysis.yoy_analysis(current_data, previous_data, "value")
        
        return json.dumps({
            "success": True,
            "analysis_type": "同比增长分析",
            "result": analysis_result
        }, ensure_ascii=False, indent=2)
    
    def analyze_mom(
        self,
        value_field: str,
        current_filter: Dict,
        previous_month_filter: Dict
    ) -> str:
        current_result = self.bitable.search_records(
            filter_expr=current_filter,
            page_size=500
        )
        previous_result = self.bitable.search_records(
            filter_expr=previous_month_filter,
            page_size=500
        )
        
        if current_result.get("code") != 0 or previous_result.get("code") != 0:
            return json.dumps({
                "success": False,
                "error": "数据查询失败"
            }, ensure_ascii=False)
        
        current_records = current_result.get("data", {}).get("items", [])
        previous_records = previous_result.get("data", {}).get("items", [])
        
        current_data = [
            {"value": r.get("fields", {}).get(value_field)}
            for r in current_records
        ]
        previous_data = [
            {"value": r.get("fields", {}).get(value_field)}
            for r in previous_records
        ]
        
        analysis_result = self.analysis.mom_analysis(current_data, previous_data, "value")
        
        return json.dumps({
            "success": True,
            "analysis_type": "环比增长分析",
            "result": analysis_result
        }, ensure_ascii=False, indent=2)


def handle_request(request_data: Dict[str, Any]) -> str:
    app_token = request_data.get("app_token", "")
    table_id = request_data.get("table_id", "")
    action = request_data.get("action", "")
    params = request_data.get("params", {})
    
    if not app_token or not table_id:
        return json.dumps({
            "success": False,
            "error": "缺少 app_token 或 table_id"
        }, ensure_ascii=False)
    
    agent = FeishuBitableAgent(app_token, table_id)
    
    action_handlers = {
        "query": lambda: agent.query_records(**params),
        "add": lambda: agent.add_record(**params),
        "update": lambda: agent.update_record(**params),
        "delete": lambda: agent.delete_record(**params),
        "batch_add": lambda: agent.batch_add_records(**params),
        "get_structure": lambda: agent.get_table_structure(),
        "analyze_growth": lambda: agent.analyze_growth(**params),
        "analyze_proportion": lambda: agent.analyze_proportion(**params),
        "analyze_trend": lambda: agent.analyze_trend(**params),
        "analyze_yoy": lambda: agent.analyze_yoy(**params),
        "analyze_mom": lambda: agent.analyze_mom(**params)
    }
    
    handler = action_handlers.get(action)
    if handler:
        return handler()
    else:
        return json.dumps({
            "success": False,
            "error": f"未知操作: {action}",
            "available_actions": list(action_handlers.keys())
        }, ensure_ascii=False)
