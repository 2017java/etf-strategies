#!/bin/bash
cd "$(dirname "$0")"

if [ ! -f "config.json" ] && [ ! -f ".env" ]; then
    echo "[错误] 请先配置 config.json 或 .env 文件"
    exit 1
fi

echo "[启动] 正在启动服务..."
python src/main.py
