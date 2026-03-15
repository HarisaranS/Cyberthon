from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.ocr_service import ocr_service
from app.services.pii_detector import detect
import os

router = APIRouter()

@router.post("/ocr")
async def ocr_detect(file: UploadFile = File(...)):
    filename = file.filename or "unknown"
    ext = os.path.splitext(filename.lower())[1]
    
    try:
        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail="Empty file")

        text = ""
        if ext == '.pdf':
            text = ocr_service.extract_text_from_pdf(content)
        elif ext in ('.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif'):
            text = ocr_service.extract_text_from_image(content)
        else:
            # Try to decode as text if not image/pdf
            try:
                text = content.decode('utf-8', errors='replace')
            except:
                raise HTTPException(status_code=400, detail="Unsupported file format for OCR")

        if not text:
            return {"detections": [], "total_found": 0, "text_extracted": False}

        result = detect(text, "image" if ext != '.pdf' else "pdf")
        return {
            "extracted_text_length": len(text),
            "text_extracted": True,
            **result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
