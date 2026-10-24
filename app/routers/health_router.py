"""
app/routers/health_router.py
----------------------------
Health check and root entrance endpoints.
"""

from pathlib import Path
from fastapi import APIRouter
from fastapi.responses import JSONResponse, FileResponse

router = APIRouter(tags=["Health & Status"])

STATIC_DIR = Path(__file__).resolve().parent.parent.parent / "static"

@router.get("/")
async def root():
    index_file = STATIC_DIR / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))
    return {
        "service": "Milestone API Suite",
        "version": "2.0.0",
        "modules": {
            "milestone1": "CSS Parser & Groq Auditor",
            "milestone2": "Deterministic Function-Calling AI Agent"
        },
        "docs": "/docs",
        "health": "/health"
    }

@router.get("/health")
@router.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "service": "Milestone Unified Backend",
        "version": "2.0.0",
        "modules": ["milestone-1-css-parser", "milestone-2-ai-agent"]
    }
