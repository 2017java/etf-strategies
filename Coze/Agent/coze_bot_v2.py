import lark_oapi as lark
import requests
import json

# ===================== 你只改这里 =====================
# 1. 飞书配置
APP_ID = "cli_a924d0114079dcb3"
APP_SECRET = "mgBWPLaUKo2DLFQ24yypOhWjchJLfAPL"

# 2. Coze 编程智能体 API 配置（从 Coze 部署里复制）
COZE_API_URL = "https://m37vfrz86h.coze.site/stream_run"
COZE_API_TOKEN = "eyJhbGciOiJSUzI1NiIsImtpZCI6IjcxYmE4NDZkLTcxYjMtNGIzYi04ZDVmLTVkNDI2NWM1MDcwNiJ9.eyJpc3MiOiJodHRwczovL2FwaS5jb3plLmNuIiwiYXVkIjpbIjlTQTNSZHVOZ1ROWkdjVkl4M3AyalVGVUVkN3ROY2tRIl0sImV4cCI6ODIxMDI2Njg3Njc5OSwiaWF0IjoxNzczMDM2NzIyLCJzdWIiOiJzcGlmZmU6Ly9hcGkuY296ZS5jbi93b3JrbG9hZF9pZGVudGl0eS9pZDo3NjE0ODUxODg5MTc1MTk5NzgwIiwic3JjIjoiaW5ib3VuZF9hdXRoX2FjY2Vzc190b2tlbl9pZDo3NjE1MTM0NzM4NDUzMzY0Nzc3In0.FPsC_9RJJPlpoR7r9XqfEdkFNpKVTJu19puyhXGg8bdLEkJUpOt5CFV4lFKm9-CKanA3gWsyTWni88Q2E2m7K2ncqrUiMcIqDPsVEMEYPXmL119Z3g8pRKYfv3KmIJobnJW7Rgx6j_rWYKRZkyD2beGQwMKrDi38DW5KSK1ftQvp0tuukQE1yJnzuhT51TNPgzPe5NPqeUui9y7ZwKdSKf8OhmJ4v3eqI_F5_fOXWu7qPmVTMpghgWHaDNFaPqfV_OkuYxk2WXXj6QDTODCA9knoSBRz9nxgfjFjCPcaOsUW6fbFswbulD6oL1eWibpKedRuvongTvuhc5hZLYOAgQ"
COZE_BOT_ID = "7614847139780345898"
# ======================================================

# 收到飞书消息时调用 Coze API
def ask_coze(query: str, user_id: str = "user"):
    headers = {
        "Authorization": f"Bearer {COZE_API_TOKEN}",
        "Content-Type": "application/json"
    }
    data = {
        "bot_id": COZE_BOT_ID,
        "user_id": user_id,
        "query": query
    }
    try:
        resp = requests.post(COZE_API_URL, json=data, headers=headers, timeout=10)
        result = resp.json()
        # 根据 Coze API 返回格式提取答案
        answer = result.get("content", "") or result.get("choices", [{}])[0].get("message", {}).get("content", "无法获取回答")
        return answer
    except Exception as e:
        return f"Coze API 调用失败：{str(e)}"

# 收到飞书消息事件
def do_p2_im_message_receive_v1(data: lark.im.v1.P2ImMessageReceiveV1) -> None:
    print(f"[飞书消息原始数据]：\n{lark.JSON.marshal(data, indent=4)}")

    try:
        # 1. 解析消息内容
        message = data.event.message
        chat_id = message.chat_id
        content = json.loads(message.content)
        user_text = content.get("text", "")
        sender_id = data.event.sender.sender_id.user_id

        print(f"收到用户消息：{user_text}")

        # 2. 调用 Coze AI
        ai_reply = ask_coze(user_text, user_id=sender_id)
        print(f"Coze 回复：{ai_reply}")

        # 3. 发送回飞书群
        send_msg = lark.im.v1.CreateMessageReq.builder()\
            .receive_id_type("chat_id")\
            .chat_id(chat_id)\
            .msg_type("text")\
            .content(json.dumps({"text": ai_reply}))\
            .build()

        client = lark.Client.builder()\
            .app_id(APP_ID)\
            .app_secret(APP_SECRET)\
            .build()

        resp = client.im.v1.message.create(send_msg)
        print(f"飞书发送结果：{lark.JSON.marshal(resp, indent=4)}")

    except Exception as e:
        print(f"处理消息出错：{e}")

# 事件处理器
def do_message_event(data: lark.CustomizedEvent) -> None:
    print(f"[自定义事件] data: {lark.JSON.marshal(data, indent=4)}")

def main():
    event_handler = lark.EventDispatcherHandler.builder("", "") \
        .register_p2_im_message_receive_v1(do_p2_im_message_receive_v1) \
        .register_p1_customized_event("im.message.receive_v1", do_message_event) \
        .build()

    cli = lark.ws.Client(
        APP_ID,
        APP_SECRET,
        event_handler=event_handler,
        log_level=lark.LogLevel.DEBUG
    )

    print("✅ 飞书 + Coze 机器人启动成功！等待@消息...")
    cli.start()

if __name__ == "__main__":
    main()