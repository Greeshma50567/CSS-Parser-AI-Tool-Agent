"""
main.py
-------
Root entry point for Milestone Unified Application.
Re-exports the modular FastAPI application from app.main.
Run locally with:
  python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
"""

from app.main import app, agent
from app.schemas import (
    CssTextRequest,
    ParsedRule,
    CssParseResponse,
    CssAnalysisResponse,
    ChatRequest,
    ChatResponse,
)

__all__ = [
    "app",
    "agent",
    "CssTextRequest",
    "ParsedRule",
    "CssParseResponse",
    "CssAnalysisResponse",
    "ChatRequest",
    "ChatResponse",
]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
