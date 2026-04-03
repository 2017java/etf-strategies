from copy import deepcopy
from typing import Any

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.openapi.utils import get_openapi

from app.schemas import AnalyzeResponse, TextAnalyzeRequest, UrlAnalyzeRequest
from app.scorers import score_image, score_text, score_url

app = FastAPI(
    title="AI内容评价服务",
    description="对文本、图片、链接进行AI含量与质量风险评估",
    version="0.1.0",
)

SCHEMA_NAME_MAP = {
    "ActionSuggestion": "建议动作",
    "AnalyzeResponse": "分析结果",
    "Body_analyze_image_analyze_image_post": "图片分析请求体",
    "ConfidenceLevel": "可信度等级",
    "HTTPValidationError": "请求校验错误",
    "TextAnalyzeRequest": "文本分析请求",
    "UrlAnalyzeRequest": "链接分析请求",
    "ValidationError": "字段校验错误",
}


def _replace_schema_ref(obj: Any, name_map: dict[str, str]) -> Any:
    if isinstance(obj, dict):
        new_obj: dict[str, Any] = {}
        for k, v in obj.items():
            if k == "$ref" and isinstance(v, str):
                for old, new in name_map.items():
                    old_ref = f"#/components/schemas/{old}"
                    new_ref = f"#/components/schemas/{new}"
                    if v == old_ref:
                        v = new_ref
                        break
            new_obj[k] = _replace_schema_ref(v, name_map)
        return new_obj

    if isinstance(obj, list):
        return [_replace_schema_ref(item, name_map) for item in obj]

    return obj


def custom_openapi() -> dict[str, Any]:
    if app.openapi_schema:
        return app.openapi_schema

    raw_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )

    schema = deepcopy(raw_schema)
    components = schema.get("components", {})
    schemas = components.get("schemas", {})

    renamed: dict[str, Any] = {}
    for old_name, content in schemas.items():
        new_name = SCHEMA_NAME_MAP.get(old_name, old_name)
        content = deepcopy(content)
        if new_name != old_name:
            content["title"] = new_name
        renamed[new_name] = content

    components["schemas"] = renamed
    schema["components"] = components
    schema = _replace_schema_ref(schema, SCHEMA_NAME_MAP)
    app.openapi_schema = schema
    return app.openapi_schema


app.openapi = custom_openapi


@app.get(
    "/health",
    tags=["系统"],
    summary="健康检查",
    description="用于确认服务是否正常运行。",
)
def health() -> dict[str, str]:
    return {"状态": "正常"}


@app.post(
    "/analyze/text",
    response_model=AnalyzeResponse,
    tags=["内容分析"],
    summary="文本分析",
    description="输入一段文本，返回AI生成概率与低质量风险评估结果。",
)
def analyze_text(payload: TextAnalyzeRequest) -> AnalyzeResponse:
    return score_text(payload.text)


@app.post(
    "/analyze/image",
    response_model=AnalyzeResponse,
    tags=["内容分析"],
    summary="图片分析",
    description="上传一张图片，返回AI生成概率与低质量风险评估结果。",
)
async def analyze_image(file: UploadFile = File(..., description="待分析图片文件")) -> AnalyzeResponse:
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="上传文件为空")
    return score_image(content=content, filename=file.filename)


@app.post(
    "/analyze/url",
    response_model=AnalyzeResponse,
    tags=["内容分析"],
    summary="链接分析",
    description="输入网页链接，抓取正文后返回AI生成概率与低质量风险评估结果。",
)
async def analyze_url(payload: UrlAnalyzeRequest) -> AnalyzeResponse:
    return await score_url(str(payload.url))
