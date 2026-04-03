from langgraph.graph import StateGraph, END
from langchain_core.runnables import RunnableConfig
from langgraph.runtime import Runtime
from graphs.state import (
    GlobalState,
    GraphInput,
    GraphOutput
)

from graphs.nodes.parse_intent_node import parse_intent_node
from graphs.nodes.query_data_node import query_data_node
from graphs.nodes.analyze_data_node import analyze_data_node
from graphs.nodes.send_message_node import send_message_node

# 创建状态图，指定工作流的入参和出参
builder = StateGraph(GlobalState, input_schema=GraphInput, output_schema=GraphOutput)

# 添加节点
builder.add_node("parse_intent", parse_intent_node, metadata={"type": "agent", "llm_cfg": "config/parse_intent_cfg.json"})
builder.add_node("query_data", query_data_node)
builder.add_node("analyze_data", analyze_data_node, metadata={"type": "agent", "llm_cfg": "config/analyze_data_cfg.json"})
builder.add_node("send_message", send_message_node)

# 设置入口点
builder.set_entry_point("parse_intent")

# 添加边（线性流程）
builder.add_edge("parse_intent", "query_data")
builder.add_edge("query_data", "analyze_data")
builder.add_edge("analyze_data", "send_message")
builder.add_edge("send_message", END)

# 编译图
main_graph = builder.compile()
