from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class DetectRequest(BaseModel):
    text: str
    source_type: Optional[str] = "file"
    language_hint: Optional[str] = None

class Detection(BaseModel):
    pii_type: str
    masked_value: str
    confidence: float
    start: int
    end: int
    language: Optional[str] = "en"
    context: Optional[str] = None

class DetectResponse(BaseModel):
    detections: List[Detection]
    total_found: int
    processing_time_ms: int

class ClassifyRequest(BaseModel):
    detections: List[Dict[str, Any]]
    context: Optional[Dict[str, Any]] = {}

class ClassifyResponse(BaseModel):
    sensitivity_level: str
    risk_score: int
    tier: int
    recommendations: List[str]
