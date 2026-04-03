import json
from langchain_core.runnables import RunnableConfig
from langgraph.runtime import Runtime
from coze_coding_utils.runtime_ctx.context import Context
from langchain_core.messages import SystemMessage, HumanMessage
from coze_coding_dev_sdk import LLMClient
from jinja2 import Template
from graphs.state import AnalyzeDataInput, AnalyzeDataOutput


def analyze_data_node(state: AnalyzeDataInput, config: RunnableConfig, runtime: Runtime[Context]) -> AnalyzeDataOutput:
    """
    title: 数据分析
    desc: 使用大语言模型对查询到的数据进行统计分析、趋势分析等
    integrations: 大语言模型
    """
    ctx = runtime.context
    
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
        raw_data=json.dumps(state.raw_data[:50], ensure_ascii=False) if state.raw_data else "[]"
    )
    
    # 初始化LLM客户端
    client = LLMClient(ctx=ctx)
    
    # 构建消息
    messages = [
        SystemMessage(content=sp),
        HumanMessage(content=user_prompt)
    ]
    
    # 调用大模型
    response = client.invoke(
        messages=messages,
        model=llm_config.get("model", "doubao-seed-1-8-251228"),
        temperature=llm_config.get("temperature", 0.7),
        max_completion_tokens=llm_config.get("max_completion_tokens", 8192),
        thinking=llm_config.get("thinking", "disabled")
    )
    
    # 提取响应内容
    if isinstance(response.content, str):
        content = response.content
    elif isinstance(response.content, list):
        content = " ".join(item.get("text", "") for item in response.content if isinstance(item, dict) and item.get("type") == "text")
    else:
        content = str(response.content)
    
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
        # 如果解析失败，返回默认结构
        analysis_result = {
            "summary": content,
            "error": f"解析失败: {str(e)}",
            "data_count": len(state.raw_data)
        }
    
    return AnalyzeDataOutput(analysis_result=analysis_result)
