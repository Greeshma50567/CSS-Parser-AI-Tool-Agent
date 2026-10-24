"""
app/routers/milestone1_router.py
--------------------------------
Module 1: CSS Parser & Analyzer Endpoints.
"""

from pathlib import Path
from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse

from milestone1_parser import parse_css
from groq_service import get_css_analysis
from app.schemas.css_schemas import CssTextRequest, CssParseResponse, CssAnalysisResponse

router = APIRouter(tags=["Milestone 1: CSS Parser"])

BASE_DIR = Path(__file__).resolve().parent.parent.parent
SAMPLE_CSS_PATH = BASE_DIR / "sample.css"

@router.get("/api/sample-css")
async def get_sample_css():
    """Retrieve bundled sample.css content for quick testing."""
    if not SAMPLE_CSS_PATH.exists():
        raise HTTPException(status_code=404, detail="sample.css not found on server")
    try:
        content = SAMPLE_CSS_PATH.read_text(encoding="utf-8")
        return {"filename": "sample.css", "content": content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read sample.css: {str(e)}")

@router.post("/parse-css", response_model=CssParseResponse)
async def parse_css_file_endpoint(file: UploadFile = File(...)):
    """Parse an uploaded .css file into structured AST rules without AI."""
    if not file.filename.lower().endswith(".css"):
        raise HTTPException(status_code=400, detail="Only .css files are supported")
    try:
        raw_bytes = await file.read()
        css_text = raw_bytes.decode("utf-8", errors="replace")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read uploaded file: {str(e)}")
    
    rules = parse_css(css_text)
    return {
        "filename": file.filename,
        "total_rules": len(rules),
        "rules": rules
    }

@router.post("/analyze-css", response_model=CssAnalysisResponse)
async def analyze_css_file_endpoint(file: UploadFile = File(...)):
    """Parse an uploaded .css file and execute Groq AI deep audit."""
    if not file.filename.lower().endswith(".css"):
        raise HTTPException(status_code=400, detail="Only .css files are supported")
    try:
        raw_bytes = await file.read()
        css_text = raw_bytes.decode("utf-8", errors="replace")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read uploaded file: {str(e)}")
    
    rules = parse_css(css_text)
    ai_review = await get_css_analysis(rules, file.filename)
    return {
        "filename": file.filename,
        "total_rules": len(rules),
        "rules": rules,
        "ai_review": ai_review
    }

@router.post("/parse-css-text", response_model=CssParseResponse)
async def parse_css_text_endpoint(payload: CssTextRequest):
    """Parse raw CSS stylesheet text from editor without AI."""
    if not payload.css.strip():
        raise HTTPException(status_code=400, detail="CSS content cannot be empty")
    
    rules = parse_css(payload.css)
    return {
        "filename": payload.filename or "custom.css",
        "total_rules": len(rules),
        "rules": rules
    }

@router.post("/analyze-css-text", response_model=CssAnalysisResponse)
async def analyze_css_text_endpoint(payload: CssTextRequest):
    """Parse raw CSS text and execute Groq AI deep audit."""
    if not payload.css.strip():
        raise HTTPException(status_code=400, detail="CSS content cannot be empty")
    
    filename = payload.filename or "custom.css"
    rules = parse_css(payload.css)
    ai_review = await get_css_analysis(rules, filename)
    return {
        "filename": filename,
        "total_rules": len(rules),
        "rules": rules,
        "ai_review": ai_review
    }
