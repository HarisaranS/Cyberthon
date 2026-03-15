import io
import os
import zipfile
import tempfile
import logging
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.pii_detector import detect

router = APIRouter()
logger = logging.getLogger(__name__)

SUPPORTED_EXTENSIONS = {'.txt', '.csv', '.pdf', '.docx', '.xlsx', '.xls', '.json',
                        '.xml', '.log', '.py', '.js', '.ts', '.java', '.env',
                        '.config', '.yaml', '.yml', '.php', '.rb', '.go', '.md',
                        '.html', '.htm', '.sql'}


def extract_text_from_bytes(content: bytes, filename: str) -> str:
    from app.services.ocr_service import ocr_service
    ext = os.path.splitext(filename.lower())[1]

    if ext in ('.txt', '.log', '.py', '.js', '.ts', '.java', '.env',
               '.config', '.json', '.xml', '.yaml', '.yml', '.php',
               '.rb', '.go', '.md', '.html', '.htm', '.sql'):
        for enc in ('utf-8', 'latin-1', 'cp1252'):
            try:
                return content.decode(enc)
            except Exception:
                continue
        return content.decode('utf-8', errors='replace')

    if ext == '.csv':
        try:
            import pandas as pd
            df = pd.read_csv(io.BytesIO(content), dtype=str, on_bad_lines='skip')
            return '\n'.join(df.apply(lambda row: ' | '.join(str(v) for v in row if str(v) != 'nan'), axis=1))
        except Exception as e:
            logger.warning(f"CSV parse error {filename}: {e}")
            return content.decode('utf-8', errors='replace')

    if ext in ('.xlsx', '.xls'):
        try:
            import pandas as pd
            df = pd.read_excel(io.BytesIO(content), dtype=str)
            return '\n'.join(df.apply(lambda row: ' | '.join(str(v) for v in row if str(v) != 'nan'), axis=1))
        except Exception as e:
            logger.warning(f"Excel parse error {filename}: {e}")
            return ''

    if ext == '.pdf':
        return ocr_service.extract_text_from_pdf(content)

    if ext in ('.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif', '.gif'):
        return ocr_service.extract_text_from_image(content)

    if ext == '.docx':
        try:
            from docx import Document
            doc = Document(io.BytesIO(content))
            return '\n'.join(p.text for p in doc.paragraphs if p.text.strip())
        except Exception as e:
            logger.warning(f"DOCX parse error {filename}: {e}")
            return ''

    return ''


def scan_content(text: str, source_type: str, filename: str) -> dict:
    if not text or not text.strip():
        return {"detections": [], "total_found": 0, "filename": filename}
    result = detect(text, source_type)
    result["filename"] = filename
    return result


@router.post("/scan/file")
async def scan_file(file: UploadFile = File(...)):
    """
    Accept any file, extract text, run full PII detection pipeline.
    Handles PDF, DOCX, CSV, XLSX, TXT, images, source code, ZIP archives.
    """
    filename = file.filename or "unknown"
    ext = os.path.splitext(filename.lower())[1]
    logger.info(f"Incoming scan request for file: {filename} ({file.content_type})")
    
    try:
        content = await file.read()
        if not content:
            logger.warning(f"File {filename} is empty")
            return {"detections": [], "total_found": 0, "filename": filename, "error": "Empty file"}

        all_detections = []
        files_scanned = []

        # ZIP: extract and scan each file inside
        if ext == '.zip':
            logger.info(f"Processing ZIP archive: {filename}")
            try:
                with zipfile.ZipFile(io.BytesIO(content)) as zf:
                    for member in zf.namelist():
                        member_ext = os.path.splitext(member.lower())[1]
                        if member_ext not in SUPPORTED_EXTENSIONS:
                            continue
                        if member.endswith('/'):
                            continue
                        try:
                            member_content = zf.read(member)
                            text = extract_text_from_bytes(member_content, member)
                            if text and text.strip():
                                result = detect(text, 'file')
                                detections = result.get('detections', [])
                                for d in detections:
                                    d['source_file'] = member
                                all_detections.extend(detections)
                                files_scanned.append(member)
                        except Exception as e:
                            logger.error(f"ZIP member error {member}: {e}")
            except zipfile.BadZipFile:
                raise HTTPException(status_code=400, detail="Invalid ZIP file")
        else:
            logger.info(f"Extracting text from {filename}...")
            text = extract_text_from_bytes(content, filename)
            if text and text.strip():
                logger.info(f"Extracted {len(text)} chars. Running detection...")
                result = detect(text, 'file')
                all_detections = result.get('detections', [])
            else:
                logger.warning(f"No text could be extracted from {filename}")
            files_scanned = [filename]

        logger.info(f"Scan complete for {filename}. Found {len(all_detections)} items.")
        return {
            "detections": all_detections,
            "total_found": len(all_detections),
            "filename": filename,
            "files_scanned": files_scanned,
            "text_extracted": True if (ext != '.zip' and 'text' in locals() and text) else False
        }
    except Exception as e:
        logger.error(f"Global scan error for {filename}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Scan failed: {str(e)}")
