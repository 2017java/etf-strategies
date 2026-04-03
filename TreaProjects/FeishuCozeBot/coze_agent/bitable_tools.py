"""
Coze 智能体工具函数
提供多维表格操作的具体实现
"""

import json
import requests
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta


class BitableTools:
    def __init__(self, app_token: str, table_id: str):
        self.app_token = app_token
        self.table_id = table_id
        self.base_url = "https://open.larkoffice.com/open-apis/bitable/v1"
    
    def _get_access_token(self) -> str:
        return "{tenant_access_token}"
    
    def _request(self, method: str, path: str, data: Dict = None) -> Dict:
        url = f"{self.base_url}{path}"
        headers = {
            "Authorization": f"Bearer {self._get_access_token()}",
            "Content-Type": "application/json"
        }
        
        if method == "GET":
            resp = requests.get(url, headers=headers, params=data, timeout=30)
        elif method == "POST":
            resp = requests.post(url, headers=headers, json=data, timeout=30)
        elif method == "PUT":
            resp = requests.put(url, headers=headers, json=data, timeout=30)
        elif method == "DELETE":
            resp = requests.delete(url, headers=headers, timeout=30)
        else:
            return {"code": -1, "msg": f"不支持的方法: {method}"}
        
        return resp.json()
    
    def search_records(
        self,
        view_id: str = None,
        field_names: List[str] = None,
        filter_expr: Dict = None,
        sort: List[Dict] = None,
        page_size: int = 100,
        page_token: str = None,
        automatic_fields: bool = False
    ) -> Dict:
        path = f"/apps/{self.app_token}/tables/{self.table_id}/records/search"
        
        body = {"page_size": min(page_size, 500)}
        
        if view_id:
            body["view_id"] = view_id
        if field_names:
            body["field_names"] = field_names
        if filter_expr:
            body["filter"] = filter_expr
        if sort:
            body["sort"] = sort
        if page_token:
            body["page_token"] = page_token
        if automatic_fields:
            body["automatic_fields"] = automatic_fields
        
        return self._request("POST", path, body)
    
    def get_record(self, record_id: str) -> Dict:
        path = f"/apps/{self.app_token}/tables/{self.table_id}/records/{record_id}"
        return self._request("GET", path)
    
    def create_record(self, fields: Dict[str, Any], record_id: str = None) -> Dict:
        path = f"/apps/{self.app_token}/tables/{self.table_id}/records"
        body = {"fields": fields}
        if record_id:
            body["record_id"] = record_id
        return self._request("POST", path, body)
    
    def update_record(self, record_id: str, fields: Dict[str, Any]) -> Dict:
        path = f"/apps/{self.app_token}/tables/{self.table_id}/records/{record_id}"
        body = {"fields": fields}
        return self._request("PUT", path, body)
    
    def delete_record(self, record_id: str) -> Dict:
        path = f"/apps/{self.app_token}/tables/{self.table_id}/records/{record_id}"
        return self._request("DELETE", path)
    
    def batch_create(self, records: List[Dict[str, Any]]) -> Dict:
        path = f"/apps/{self.app_token}/tables/{self.table_id}/records/batch_create"
        body = {
            "records": [{"fields": r} for r in records]
        }
        return self._request("POST", path, body)
    
    def batch_update(self, records: List[Dict[str, Any]]) -> Dict:
        path = f"/apps/{self.app_token}/tables/{self.table_id}/records/batch_update"
        body = {
            "records": [{"record_id": r.get("record_id"), "fields": r.get("fields", {})} for r in records]
        }
        return self._request("POST", path, body)
    
    def batch_delete(self, record_ids: List[str]) -> Dict:
        path = f"/apps/{self.app_token}/tables/{self.table_id}/records/batch_delete"
        body = {"records": record_ids}
        return self._request("POST", path, body)
    
    def get_fields(self) -> Dict:
        path = f"/apps/{self.app_token}/tables/{self.table_id}/fields"
        return self._request("GET", path)
    
    def get_views(self) -> Dict:
        path = f"/apps/{self.app_token}/tables/{self.table_id}/views"
        return self._request("GET", path)


class AnalysisTools:
    @staticmethod
    def growth_analysis(data: List[Dict], value_field: str, time_field: str) -> Dict:
        if not data:
            return {"error": "数据为空"}
        
        sorted_data = sorted(data, key=lambda x: x.get(time_field, ""))
        
        if len(sorted_data) < 2:
            return {"error": "数据不足，至少需要2个时间点的数据"}
        
        results = []
        for i in range(1, len(sorted_data)):
            prev_val = sorted_data[i-1].get(value_field, 0)
            curr_val = sorted_data[i].get(value_field, 0)
            
            try:
                prev_val = float(prev_val)
                curr_val = float(curr_val)
            except (ValueError, TypeError):
                continue
            
            if prev_val != 0:
                growth_rate = ((curr_val - prev_val) / prev_val) * 100
            else:
                growth_rate = None
            
            results.append({
                "period": sorted_data[i].get(time_field),
                "value": curr_val,
                "prev_value": prev_val,
                "growth_rate": round(growth_rate, 2) if growth_rate is not None else None,
                "change": round(curr_val - prev_val, 2)
            })
        
        return {
            "success": True,
            "data": results,
            "summary": {
                "total_periods": len(results),
                "avg_growth_rate": round(sum(r["growth_rate"] for r in results if r["growth_rate"] is not None) / len([r for r in results if r["growth_rate"] is not None]), 2) if results else 0
            }
        }
    
    @staticmethod
    def yoy_analysis(
        current_data: List[Dict],
        previous_year_data: List[Dict],
        value_field: str
    ) -> Dict:
        current_total = sum(float(d.get(value_field, 0)) for d in current_data)
        previous_total = sum(float(d.get(value_field, 0)) for d in previous_year_data)
        
        if previous_total != 0:
            yoy_rate = ((current_total - previous_total) / previous_total) * 100
        else:
            yoy_rate = None
        
        return {
            "current_period_total": round(current_total, 2),
            "previous_year_total": round(previous_total, 2),
            "yoy_change": round(current_total - previous_total, 2),
            "yoy_rate": round(yoy_rate, 2) if yoy_rate is not None else None,
            "interpretation": f"同比增长 {yoy_rate:.2f}%" if yoy_rate is not None else "无法计算同比增长率（去年同期数据为0）"
        }
    
    @staticmethod
    def mom_analysis(
        current_data: List[Dict],
        previous_month_data: List[Dict],
        value_field: str
    ) -> Dict:
        current_total = sum(float(d.get(value_field, 0)) for d in current_data)
        previous_total = sum(float(d.get(value_field, 0)) for d in previous_month_data)
        
        if previous_total != 0:
            mom_rate = ((current_total - previous_total) / previous_total) * 100
        else:
            mom_rate = None
        
        return {
            "current_period_total": round(current_total, 2),
            "previous_month_total": round(previous_total, 2),
            "mom_change": round(current_total - previous_total, 2),
            "mom_rate": round(mom_rate, 2) if mom_rate is not None else None,
            "interpretation": f"环比增长 {mom_rate:.2f}%" if mom_rate is not None else "无法计算环比增长率（上月数据为0）"
        }
    
    @staticmethod
    def proportion_analysis(
        data: List[Dict],
        group_field: str,
        value_field: str = None
    ) -> Dict:
        from collections import defaultdict
        
        grouped = defaultdict(float)
        
        for item in data:
            group_key = item.get(group_field, "其他")
            if isinstance(group_key, list):
                group_key = group_key[0] if group_key else "其他"
            
            if value_field:
                try:
                    value = float(item.get(value_field, 0))
                except (ValueError, TypeError):
                    value = 1
            else:
                value = 1
            
            grouped[str(group_key)] += value
        
        total = sum(grouped.values())
        
        results = []
        for group_name, value in sorted(grouped.items(), key=lambda x: x[1], reverse=True):
            proportion = (value / total * 100) if total > 0 else 0
            results.append({
                "name": group_name,
                "value": round(value, 2),
                "proportion": round(proportion, 2),
                "total": round(total, 2)
            })
        
        return {
            "success": True,
            "data": results,
            "total": round(total, 2),
            "groups": len(results)
        }
    
    @staticmethod
    def trend_analysis(
        data: List[Dict],
        value_field: str,
        time_field: str
    ) -> Dict:
        if not data:
            return {"error": "数据为空"}
        
        sorted_data = sorted(data, key=lambda x: x.get(time_field, ""))
        
        values = []
        for item in sorted_data:
            try:
                values.append(float(item.get(value_field, 0)))
            except (ValueError, TypeError):
                continue
        
        if not values:
            return {"error": "没有有效的数值数据"}
        
        n = len(values)
        mean = sum(values) / n
        
        if n >= 3:
            first_third = values[:n//3]
            last_third = values[2*n//3:]
            
            first_avg = sum(first_third) / len(first_third)
            last_avg = sum(last_third) / len(last_third)
            
            if last_avg > first_avg * 1.1:
                trend = "上升"
            elif last_avg < first_avg * 0.9:
                trend = "下降"
            else:
                trend = "平稳"
        else:
            trend = "数据不足"
        
        return {
            "success": True,
            "trend": trend,
            "statistics": {
                "count": n,
                "mean": round(mean, 2),
                "min": round(min(values), 2),
                "max": round(max(values), 2),
                "range": round(max(values) - min(values), 2)
            },
            "data_points": [
                {"time": d.get(time_field), "value": float(d.get(value_field, 0))}
                for d in sorted_data
            ]
        }
