from fastapi import APIRouter
from app.models.schemas import ClassifyRequest, ClassifyResponse
from app.services.sensitivity_scorer import score

router = APIRouter()

@router.post("/classify", response_model=ClassifyResponse)
async def classify(req: ClassifyRequest):
    result = score(req.detections, req.context or {})
    return result
