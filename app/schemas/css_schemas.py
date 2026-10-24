"""
app/schemas/css_schemas.py
--------------------------
Pydantic schemas for Milestone 1 CSS Parser & Analyzer.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

class CssTextRequest(BaseModel):
    css: str = Field(..., description="Raw CSS stylesheet text to parse")
    filename: Optional[str] = Field("custom.css", description="Original filename for reporting")

class ParsedRule(BaseModel):
    selector: str
    properties: Dict[str, str]
    property_count: int

class CssParseResponse(BaseModel):
    filename: str
    total_rules: int
    rules: List[ParsedRule]

class AiReviewSection(BaseModel):
    summary: str
    suggestions: List[str]
    accessibility: List[str]
    best_practices: List[str]

class CssAnalysisResponse(BaseModel):
    filename: str
    total_rules: int
    rules: List[ParsedRule]
    ai_review: Optional[Dict[str, Any]] = None
