"""
app/schemas.py
--------------
Pydantic schemas for request and response validation.
Enforces privacy: API responses return strictly the final answer.
"""

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    """Incoming user chat message."""
    message: str = Field(
        ...,
        min_length=1,
        max_length=4000,
        description="User message or inquiry for the agent",
        examples=["What is 25 multiplied by 4?", "What is the return policy?"]
    )


class ChatResponse(BaseModel):
    """
    Final assistant response delivered to the frontend.
    Strictly excludes internal tool traces, function names, and raw execution data.
    """
    answer: str = Field(
        ...,
        description="Grounded final response formulated by the agent"
    )
