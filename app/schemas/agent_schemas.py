"""
app/schemas/agent_schemas.py
----------------------------
Pydantic schemas for Milestone 2 Groq AI Agent.
Strict privacy: Only the clean final answer is returned to clients.
"""

from typing import Any, Dict
from pydantic import BaseModel, Field

class ChatRequest(BaseModel):
    message: str = Field(
        ...,
        min_length=1,
        max_length=4000,
        description="User message or inquiry for the agent"
    )

class ChatResponse(BaseModel):
    answer: str = Field(
        ...,
        description="Grounded final response formulated by the agent"
    )

class ToolInfo(BaseModel):
    name: str
    description: str
    parameters: Dict[str, Any]
