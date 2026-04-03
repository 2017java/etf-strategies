import json
import os
from langchain_core.runnables import RunnableConfig
from langgraph.runtime import Runtime
from coze_coding_utils.runtime_ctx.context import Context
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_openai import ChatOpenAI
from jinja2 import Template
from graphs.state import AnalyzeDataInput, AnalyzeDataOutput


# 火山方舟 API 配置
VOLCENGINE_API_BASE = "https://ark.cn-beijing.volces.com/api/v3"


def analyze_data_node(state: AnalyzeDataInput, config: RunnableConfig, runtime: Runtime[Context]) -> AnalyzeDataOutput:
    """
    title: 数据分析
    desc: 使用大语言模型分析查询到的多维表格数据，生成分析报告
    integrations: 火山方舟大模型
    """
    # 从环境变量获取火山方舟配置
    ark_api_key = os.getenv("VOLCENGINE_ARK_API_KEY", "")
    ark_endpoint = os.getenv("VOLCENGINE_ARK_ENDPOINT", "")
    
    if not ark_api_key or not ark_endpoint:
        return AnalyzeDataOutput(analysis_result={
            "title": "分析失败",
            "summary": "未配置火山方舟 API Key 或 Endpoint",
            "data_overview": "",
            "trend_analysis": "",
            "details": ""
        })
    
    # 读取配置文件
    cfg_file_path = f"{config['metadata']['llm_cfg']}"
    with open(cfg_file_path, 'r', encoding='utf-8') as fd:
        cfg = json.load(fd)
    
    llm_config = cfg.get("config", {})
    sp = cfg.get("sp", "")
    up_tpl = Template(cfg.get("up", ""))
    
    # 渲染用户提示词
    user_prompt = up_tpl.render(
        user_query=state.user_query,
        parsed_intent=json.dumps(state.parsed_intent, ensure_ascii=False),
        raw_data=json.dumps(state.raw_data, ensure_ascii=False)
    )
    
    # 构建消息
    messages = [
        SystemMessage(content=sp),
        HumanMessage(content=user_prompt)
    ]
    
    # 初始化火山方舟 LLM 客户端
    llm = ChatOpenAI(
        model=ark_endpoint,  # 使用接入点 ID 作为模型名
        api_key=ark_api_key,
        base_url=VOLCENGINE_API_BASE,
        temperature=llm_config.get("temperature", 0.7),
        max_tokens=llm_config.get("max_completion_tokens", 8192),
    )
    
    # 调用大模型
    try:
        response = llm.invoke(messages)
        content = response.content
    except Exception as e:
        return AnalyzeDataOutput(analysis_result={
            "title": "分析失败",
            "summary": f"大模型调用失败: {str(e)}",
            "data_overview": "",
            "trend_analysis": "",
            "details": ""
        })
    
    # 解析JSON结果
    try:
        content = content.strip()
        if "```json" in content:
            json_start = content.find("```json") + 7
            json_end = content.find("```", json_start)
            content = content[json_start:json_end].strip()
        elif "```" in content:
            json_start = content.find("```") + 3
            json_end = content.find("```", json_start)
            content = content[json_start:json_end].strip()
        
        analysis_result = json.loads(content)
    except json.JSONDecodeError as e:
        analysis_result = {
            "title": "分析结果",
            "summary": content,
            "data_overview": "",
            "trend_analysis": "",
            "details": f"JSON解析失败: {str(e)}"
        }
    
    return AnalyzeDataOutput(analysis_result=analysis_result)
