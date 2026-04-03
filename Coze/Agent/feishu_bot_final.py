import lark_oapi as lark

# ===================== 你只改这里 =====================
APP_ID = "cli_a924d0114079dcb3"        # 你的 App ID
APP_SECRET = "mgBWPLaUKo2DLFQ24yypOhWjchJLfAPL"     # 你的 App Secret
# ======================================================

def do_p2_im_message_receive_v1(data: lark.im.v1.P2ImMessageReceiveV1) -> None:
    print(f'[ receive ], data: {lark.JSON.marshal(data, indent=4)}')

def do_message_event(data: lark.CustomizedEvent) -> None:
    print(f'[ receive customized event ], data: {lark.JSON.marshal(data, indent=4)}')

def main():
    # 构建事件处理器
    event_handler = lark.EventDispatcherHandler.builder("", "") \
        .register_p2_im_message_receive_v1(do_p2_im_message_receive_v1) \
        .register_p1_customized_event("im.message.receive_v1", do_message_event) \
        .build()

    # 创建长连接客户端
    cli = lark.ws.Client(
        APP_ID,
        APP_SECRET,
        event_handler=event_handler,
        log_level=lark.LogLevel.DEBUG
    )

    # 启动长连接
    print("正在启动长连接...")
    cli.start()

if __name__ == "__main__":
    main()