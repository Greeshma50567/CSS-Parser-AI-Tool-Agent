"""
app/agent.py
------------
Groq LLM-powered AI Agent with function-calling execution loop.
Supports both asynchronous (FastAPI) and synchronous (CLI terminal) execution.
Implements anti-hallucination safeguards, argument validation, and max tool call limits.
"""

import json
import logging
from typing import Any, Dict, List, Optional
from groq import Groq, AsyncGroq

from app.config import GROQ_API_KEY, GROQ_MAX_TOOL_CALLS, GROQ_MODEL, validate_config
from app.tools import TOOL_DEFINITIONS, TOOL_REGISTRY

# Configure server-side logging (internal traces remain strictly on server)
logger = logging.getLogger("groq_agent")
if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter("[%(asctime)s] [%(levelname)s] [AgentTrace] %(message)s")
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)

SYSTEM_PROMPT = """You are a reliable, factual, deterministic AI Assistant equipped with Python execution tools.

CRITICAL GROUNDING & ANTI-HALLUCINATION RULES:
1. Always use available tools for calculations, knowledge-base inquiries, unit conversions, date/time lookups, text counts, JSON validations, CSV analyses, or file searches.
2. NEVER perform mental math or guess numerical calculations. Use the `calculator` tool and base your factual answer strictly on the tool's result.
3. For factual questions about products, specs, policies, or company details, use `search_knowledge_base`.
   - If the tool returns `found: false` or indicates no match, explicitly tell the user that the available knowledge base does not contain a reliable answer. NEVER fabricate product specifications, return days, or company facts.
   - Mention the source identifier when quoting knowledge base documents.
4. For current timestamps or timezone questions, execute `get_current_datetime`. Do not invent or assume the user's local time.
5. Base all answers strictly on actual tool outputs. If a tool fails or reports an error, state the error honestly rather than pretending it succeeded.
6. RESPONSE LENGTH & BREVITY (CRITICAL):
   - By default, ALWAYS provide a SHORT, CONCISE, and direct answer (under 150-200 words, maximum 2-3 short paragraphs or clean bullet points, plus at most 1 short code snippet if relevant). Avoid rambling essays, repetitive text, and multiple redundant tables.
   - ONLY make the response big, in-depth, and comprehensive IF the user explicitly asks for a detailed, big, or deep explanation (e.g., "in detail", "give me a big explanation", "deep dive", "elaborate fully", "write a comprehensive explanation").
7. Do NOT mention internal JSON tool structures or raw argument dictionaries in conversational text.
8. When asked about available tools, functions, or capabilities, present them in a clean, human-friendly list with category icons (🧮 Calculator, 📚 Knowledge Base, ⏱️ Date/Time, 🔄 Unit Converter, 📝 Text Metrics, 🔍 JSON Validator, 📊 CSV Summarizer, 📁 File Search). Give each tool a 1-sentence plain-English explanation and a natural query example. Avoid raw, cramped schema tables.
""".strip()


class GroqAgent:
    """Agent orchestrator managing the Groq function-calling conversation loop."""

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None, max_tool_calls: Optional[int] = None):
        self.api_key = api_key or GROQ_API_KEY
        self.model = model or GROQ_MODEL
        self.max_tool_calls = max_tool_calls or GROQ_MAX_TOOL_CALLS

    def _execute_tool(self, name: str, raw_args: Any) -> Dict[str, Any]:
        """Safely look up and execute an approved tool from the registry."""
        if name not in TOOL_REGISTRY:
            logger.warning(f"Rejected unknown tool: '{name}'")
            return {"success": False, "error": f"Tool '{name}' is not in the approved tool registry."}

        # Parse JSON arguments
        try:
            kwargs = json.loads(raw_args) if isinstance(raw_args, str) else (raw_args or {})
        except Exception as exc:
            logger.warning(f"Malformed tool arguments for '{name}': {exc}")
            return {"success": False, "error": f"Malformed arguments for tool '{name}': {str(exc)}"}

        func = TOOL_REGISTRY[name]
        try:
            logger.info(f"Executing tool '{name}' with validated arguments.")
            result = func(**kwargs)
            return result
        except TypeError as exc:
            logger.error(f"Argument mismatch executing '{name}': {exc}")
            return {"success": False, "error": f"Invalid arguments supplied for '{name}': {str(exc)}"}
        except Exception as exc:
            logger.error(f"Error during execution of tool '{name}': {exc}")
            return {"success": False, "error": f"Tool execution failed: {str(exc)}"}

    async def run_async(self, user_message: str) -> str:
        """
        Asynchronously runs the agent workflow for FastAPI endpoint.
        Returns ONLY the final formulated answer string.
        """
        validate_config(require_api_key=True)
        client = AsyncGroq(api_key=self.api_key)

        messages: List[Dict[str, Any]] = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ]

        tool_calls_count = 0

        while tool_calls_count < self.max_tool_calls:
            response = await client.chat.completions.create(
                model=self.model,
                messages=messages,
                tools=TOOL_DEFINITIONS,
                tool_choice="auto",
                temperature=0.0,
            )

            choice = response.choices[0]
            msg = choice.message
            tool_calls = getattr(msg, "tool_calls", None)

            # If no tool calls requested, the model has formulated its final answer
            if not tool_calls:
                return (msg.content or "").strip()

            # Append assistant message with requested tool calls to history
            messages.append({
                "role": "assistant",
                "content": msg.content or "",
                "tool_calls": [
                    {
                        "id": tc.id,
                        "type": "function",
                        "function": {
                            "name": tc.function.name,
                            "arguments": tc.function.arguments,
                        },
                    }
                    for tc in tool_calls
                ],
            })

            # Execute all requested tool calls
            for tc in tool_calls:
                tool_calls_count += 1
                fname = tc.function.name
                fargs = tc.function.arguments

                tool_result = self._execute_tool(fname, fargs)

                # Feed tool result back as tool message
                messages.append({
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "name": fname,
                    "content": json.dumps(tool_result),
                })

                if tool_calls_count >= self.max_tool_calls:
                    logger.warning("Reached maximum tool calls limit in conversation.")
                    break

        # If loop exited due to max tool calls, request a final summary
        final_response = await client.chat.completions.create(
            model=self.model,
            messages=messages + [{"role": "system", "content": "Tool limit reached. Formulate your final response based strictly on data retrieved so far."}],
            temperature=0.0,
        )
        return (final_response.choices[0].message.content or "").strip()

    def run_sync(self, user_message: str, return_trace: bool = False) -> Any:
        """
        Synchronously runs the agent for the terminal CLI interface.
        If return_trace is True, returns (answer, trace_list) for terminal inspection.
        """
        validate_config(require_api_key=True)
        client = Groq(api_key=self.api_key)

        messages: List[Dict[str, Any]] = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ]

        trace: List[Dict[str, Any]] = []
        tool_calls_count = 0

        while tool_calls_count < self.max_tool_calls:
            response = client.chat.completions.create(
                model=self.model,
                messages=messages,
                tools=TOOL_DEFINITIONS,
                tool_choice="auto",
                temperature=0.0,
            )

            choice = response.choices[0]
            msg = choice.message
            tool_calls = getattr(msg, "tool_calls", None)

            if not tool_calls:
                answer = (msg.content or "").strip()
                return (answer, trace) if return_trace else answer

            messages.append({
                "role": "assistant",
                "content": msg.content or "",
                "tool_calls": [
                    {
                        "id": tc.id,
                        "type": "function",
                        "function": {
                            "name": tc.function.name,
                            "arguments": tc.function.arguments,
                        },
                    }
                    for tc in tool_calls
                ],
            })

            for tc in tool_calls:
                tool_calls_count += 1
                fname = tc.function.name
                fargs = tc.function.arguments

                result = self._execute_tool(fname, fargs)

                trace.append({
                    "step": tool_calls_count,
                    "tool": fname,
                    "arguments": fargs,
                    "result": result,
                })

                messages.append({
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "name": fname,
                    "content": json.dumps(result),
                })

                if tool_calls_count >= self.max_tool_calls:
                    break

        final_response = client.chat.completions.create(
            model=self.model,
            messages=messages + [{"role": "system", "content": "Tool limit reached. Formulate your final response based on data retrieved so far."}],
            temperature=0.0,
        )
        answer = (final_response.choices[0].message.content or "").strip()
        return (answer, trace) if return_trace else answer
