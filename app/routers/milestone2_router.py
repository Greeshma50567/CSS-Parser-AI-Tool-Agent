"""
app/routers/milestone2_router.py
--------------------------------
Module 2: Grounded Function-Calling AI Agent Endpoints.
"""

import logging
from fastapi import APIRouter, HTTPException
from app.schemas.agent_schemas import ChatRequest, ChatResponse
from app.tools import TOOL_DEFINITIONS

logger = logging.getLogger("groq_agent")

def get_m2_router(agent_instance) -> APIRouter:
    router = APIRouter(tags=["Milestone 2: AI Agent"])

    @router.post("/api/chat", response_model=ChatResponse)
    async def chat_endpoint(req: ChatRequest):
        """
        Process user question with deterministic Python tools.
        Strict privacy: Returns only clean answer without internal traces.
        """
        user_msg = req.message.strip()
        if not user_msg:
            raise HTTPException(status_code=400, detail="User message cannot be empty")

        try:
            logger.info("Executing grounded agent query: %s", user_msg[:60])
            answer = await agent_instance.run_async(user_msg)
            return {"answer": answer}
        except Exception as e:
            logger.error("Agent service error: %s", str(e))
            raise HTTPException(
                status_code=502,
                detail=f"Agent service error: {str(e)}"
            )

    @router.get("/api/tools")
    async def get_tools_catalog():
        """Retrieve catalog of approved deterministic Python tools."""
        return {
            "total_tools": len(TOOL_DEFINITIONS),
            "tools": TOOL_DEFINITIONS
        }

    return router
