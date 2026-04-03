from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class GlobalState(BaseModel):
    """全局状态定义"""
    user_query: str = Field(default="", description="用户的自然语言查询")
    parsed_intent: dict = Field(default={}, description="解析后的查询意图")
    raw_data: list = Field(default=[], description="从飞书表格查询的原始数据")
    analysis_result: dict = Field(default={}, description="数据分析结果")
    send_result: str = Field(default="", description="消息发送结果")


class GraphInput(BaseModel):
    """工作流的输入"""
    user_query: str = Field(..., description="用户的自然语言查询，如'某天某车型的目标线索数据是多少'")
    app_token: str = Field(..., description="飞书多维表格的app_token")
    table_id: str = Field(..., description="飞书多维表格的table_id")


class GraphOutput(BaseModel):
    """工作流的输出"""
    analysis_result: dict = Field(..., description="分析结果")
    send_result: str = Field(default="", description="消息发送结果")


class ParseIntentInput(BaseModel):
    """查询意图解析节点的输入"""
    user_query: str = Field(..., description="用户的自然语言查询")


class ParseIntentOutput(BaseModel):
    """查询意图解析节点的输出"""
    parsed_intent: dict = Field(..., description="解析后的查询意图，包含query_type（统计/趋势）、time_range（时间范围）、car_model（车型）等")


class QueryDataInput(BaseModel):
    """数据查询节点的输入"""
    parsed_intent: dict = Field(..., description="解析后的查询意图")
    app_token: str = Field(..., description="飞书多维表格的app_token")
    table_id: str = Field(..., description="飞书多维表格的table_id")


class QueryDataOutput(BaseModel):
    """数据查询节点的输出"""
    raw_data: list = Field(default=[], description="从飞书表格查询的原始数据")


class AnalyzeDataInput(BaseModel):
    """数据分析节点的输入"""
    user_query: str = Field(..., description="用户的原始查询")
    parsed_intent: dict = Field(..., description="解析后的查询意图")
    raw_data: list = Field(..., description="查询的原始数据")


class AnalyzeDataOutput(BaseModel):
    """数据分析节点的输出"""
    analysis_result: dict = Field(..., description="分析结果，包含结论、数据概览、趋势分析等")


class SendMessageInput(BaseModel):
    """消息发送节点的输入"""
    analysis_result: dict = Field(..., description="分析结果")


class SendMessageOutput(BaseModel):
    """消息发送节点的输出"""
    send_result: str = Field(default="", description="消息发送结果")
