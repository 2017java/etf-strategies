# 长期记忆

## ETF操盘看板项目

- 项目路径：`c:/Users/smipl/WorkBuddy/etf trading strategy/`
- 后端：FastAPI（端口8000），前端：Vite（端口5173）
- 数据源：akshare（东方财富网）
- 49只ETF，跟踪涨幅、2日收益、成交量激增综合评分

## 关键技术决策

- **分钟线数据排序**：akshare返回升序数据（从早到晚），最新在`iloc[-1]`，开盘价在`iloc[0]`
- **盘中/盘后区分**：9:30-15:00为盘中，实时模式；其他时间为收盘模式
- **热点推荐**：基于板块动能评分（涨幅40% + 成交量30% + 两日动能30%），NeoData API端点当前返回404，依赖动能逻辑作为主数据源

## NeoData API

- Token备存于 `~/.workbuddy/.neodata_token`
- 端点 `https://copilot.tencent.com/agenttool/v1/neodata` 目前返回404（2026-04-22），服务不可用

## 启动方式

- 双击 `一键启动看板.bat` 即可运行
- 详细说明见 `README.md`
