from io import BytesIO

from PIL import Image, UnidentifiedImageError

from app.schemas import ActionSuggestion, AnalyzeResponse, ConfidenceLevel


def _clamp(value: float, low: float = 0, high: float = 100) -> float:
    return max(low, min(high, value))


def _confidence_by_pixels(width: int, height: int) -> ConfidenceLevel:
    pixels = width * height
    if pixels >= 1280 * 720:
        return ConfidenceLevel.HIGH
    if pixels >= 640 * 480:
        return ConfidenceLevel.MEDIUM
    return ConfidenceLevel.LOW


def _channel_variation_score(image: Image.Image) -> float:
    gray = image.convert("L")
    hist = gray.histogram()
    total = sum(hist) or 1

    non_zero_bins = sum(1 for x in hist if x > 0)
    spread = non_zero_bins / len(hist)

    top_bin_ratio = max(hist) / total
    return max(0.0, min(1.0, spread * (1 - top_bin_ratio)))


def score_image(content: bytes, filename: str | None = None) -> AnalyzeResponse:
    try:
        image = Image.open(BytesIO(content))
        image.load()
    except (UnidentifiedImageError, OSError):
        return AnalyzeResponse(
            source_type="image",
            ai_score=0,
            quality_risk=100,
            confidence=ConfidenceLevel.LOW,
            evidence=["文件不是有效图片或已损坏"],
            suggestion=ActionSuggestion.MANUAL_REVIEW,
            extra={"filename": filename or "unknown"},
        )

    width, height = image.size
    img_format = (image.format or "unknown").lower()
    has_exif = bool(getattr(image, "getexif", lambda: None)())
    size_kb = len(content) / 1024
    variation = _channel_variation_score(image)

    ai_score = (
        25 * (0 if has_exif else 1)
        + 20 * (1 if img_format in {"png", "webp"} else 0.4)
        + 25 * (1 - variation)
        + 20 * (1 if width >= 1024 and height >= 1024 else 0.5)
        + 10 * (1 if size_kb < 120 else 0.2)
    )
    ai_score = round(_clamp(ai_score), 2)

    quality_risk = (
        35 * (1 - variation)
        + 20 * (1 if width < 500 or height < 500 else 0)
        + 25 * (1 if size_kb < 80 else 0.3)
        + 20 * (1 if img_format == "webp" else 0.4)
    )
    quality_risk = round(_clamp(quality_risk), 2)

    evidence: list[str] = []
    if not has_exif:
        evidence.append("图片缺少EXIF元数据")
    if variation < 0.35:
        evidence.append("灰度分布集中，纹理变化偏低")
    if width < 500 or height < 500:
        evidence.append("分辨率较低，内容细节有限")
    if size_kb < 80:
        evidence.append("文件体积较小，可能存在较强压缩")
    if not evidence:
        evidence.append("未发现明显异常图像特征")

    if ai_score >= 70 or quality_risk >= 75:
        suggestion = ActionSuggestion.MANUAL_REVIEW
    elif ai_score >= 45 or quality_risk >= 50:
        suggestion = ActionSuggestion.FLAG
    else:
        suggestion = ActionSuggestion.ALLOW

    return AnalyzeResponse(
        source_type="image",
        ai_score=ai_score,
        quality_risk=quality_risk,
        confidence=_confidence_by_pixels(width, height),
        evidence=evidence,
        suggestion=suggestion,
        extra={
            "filename": filename or "unknown",
            "format": img_format,
            "width": width,
            "height": height,
            "size_kb": round(size_kb, 2),
            "has_exif": has_exif,
            "variation": round(variation, 4),
        },
    )
