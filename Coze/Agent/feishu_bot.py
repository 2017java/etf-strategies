import sys
import json
from lark_oapi import Client, LogLevel
from lark_oapi.core.event import EventManager, DefaultEventHandler

# ===================== 你只改这里 =====================
APP_ID = "cli_a924d0114079dcb3"        # 你的 App ID
APP_SECRET = "mgBWPLaUKo2DLFQ24yypOhWjchJLfAPL"     # 你的 App Secret
# ======================================================

def main():
    print("正在启动飞书长连接...")

    client = Client.builder(APP_ID, APP_SECRET)\
        .log_level(LogLevel.DEBUG)\
        .build()

    em = EventManager()

    def on_message(evt):
        print("\n📩 收到事件：")
        print(json.dumps(evt, indent=2, ensure_ascii=False))
        return {"code": 0, "msg": "ok"}

    em.register("im.message.receive_v1", DefaultEventHandler(on_message))

    try:
        client.event().start(em)
    except KeyboardInterrupt:
        print("\n👋 已停止长连接")
        sys.exit(0)

if __name__ == "__main__":
    main()