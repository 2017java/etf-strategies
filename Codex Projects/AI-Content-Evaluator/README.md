# AI内容评价

## 项目信息
- 中文名：AI内容评价
- 英文名：AI Content Evaluator
- 建议目录/仓库短名：`ai-content-evaluator`

## 项目目标
构建一个实用的多模态评估系统，重点输出：
1. AI生成概率分（`ai_score`，0-100）
2. 低质量风险分（`quality_risk`，0-100）

系统用于辅助判断，不追求“绝对判定”。

## 当前可运行版本（v0.1）
已提供 FastAPI 接口骨架：
- `POST /analyze/text`
- `POST /analyze/image`
- `POST /analyze/url`
- `GET /health`

返回统一结构：
- `ai_score`
- `quality_risk`
- `confidence`
- `evidence`
- `suggestion`
- `extra`

## MVP范围（4周）
- 输入方式：链接、粘贴文本、图片上传
- 覆盖模态：文本 + 图片
- 输出结果：
  - `ai_score`
  - `quality_risk`
  - 可信度（高/中/低）
  - 证据说明（判定依据）
  - 建议动作（通过/标记/人工复核）

## 技术栈建议
- 后端：Python + FastAPI
- 异步任务：先用 FastAPI 后台任务，后续可升级 Celery
- 数据库：MVP阶段可 SQLite，后续建议 PostgreSQL
- 文件存储：MVP本地存储，后续升级到 S3 兼容存储
- 前端：React 或 Next.js 管理界面

## 文档
- 开发计划：`docs/MVP_PLAN.md`
- 本地运行：`docs/运行说明.md`

## 下一步里程碑
- 定义接口协议：`/analyze/text`、`/analyze/image`、`/analyze/url`
- 先实现规则基线评分
- 再接入模型评分并做分数校准
- 准备1000条人工标注样本用于评估
