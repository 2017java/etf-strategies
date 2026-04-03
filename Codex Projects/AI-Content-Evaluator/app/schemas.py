from enum import Enum
from typing import Any

from pydantic import BaseModel, Field, HttpUrl


class ConfidenceLevel(str, Enum):
    """结果可信度等级。"""

    HIGH = "高"
    MEDIUM = "中"
    LOW = "低"


class ActionSuggestion(str, Enum):
    """处理建议。"""

    ALLOW = "通过"
    FLAG = "标记"
    MANUAL_REVIEW = "人工复核"


class TextAnalyzeRequest(BaseModel):
    text: str = Field(..., min_length=1, description="待分析文本")


class UrlAnalyzeRequest(BaseModel):
    url: HttpUrl = Field(..., description="待分析链接")


class AnalyzeResponse(BaseModel):
    source_type: str = Field(..., description="来源类型：文本/图片/链接")
    ai_score: float = Field(..., ge=0, le=100, description="AI生成概率分")
    quality_risk: float = Field(..., ge=0, le=100, description="低质量风险分")
    confidence: ConfidenceLevel = Field(..., description="结果可信度")
    evidence: list[str] = Field(default_factory=list, description="证据说明")
    suggestion: ActionSuggestion = Field(..., description="建议动作")
    extra: dict[str, Any] = Field(default_factory=dict, description="附加信息")
