from fastapi import APIRouter, HTTPException
from app.models.schemas import DetectRequest, DetectResponse
from app.services.pii_detector import detect

router = APIRouter()

@router.post("/detect", response_model=DetectResponse)
async def detect_pii(req: DetectRequest):
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Text is required")
    if len(req.text) > 500_000:
        raise HTTPException(status_code=413, detail="Text too large. Max 500KB.")
    result = detect(req.text, req.source_type or "file")
    return result
