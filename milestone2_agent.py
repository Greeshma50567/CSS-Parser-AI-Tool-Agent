"""
milestone2_agent.py
-------------------
Milestone 2: Deterministic, Tool-Calling AI Agent with Anti-Hallucination Guardrails.

Provides:
- calculate_metrics(expression: str): Safe AST-based mathematical evaluation
- get_product_specs(product_id: str): Deterministic inventory catalog lookup
- run_agent_query(query: str): Full function-calling loop returning grounded answer & tool trace
"""

import ast
import json
import math
import operator
import os
import statistics
import time
from typing import Any, Dict, List, Optional
from dotenv import load_dotenv

load_dotenv(override=True)

# ---------------------------------------------------------------------------
# Mock Inventory Database
# ---------------------------------------------------------------------------

INVENTORY_DB: Dict[str, Dict[str, Any]] = {
    "PRD-101": {
        "product_id": "PRD-101",
        "name": "Ultra-Glide Mechanical Keyboard",
        "category": "Peripherals",
        "price": 129.99,
        "currency": "USD",
        "stock_count": 42,
        "dimensions": "440 x 135 x 35 mm",
        "weight_grams": 980,
        "status": "in_stock",
    },
    "PRD-102": {
        "product_id": "PRD-102",
        "name": "Precision Optics 4K Webcam",
        "category": "Video Equipment",
        "price": 189.50,
        "currency": "USD",
        "stock_count": 15,
        "dimensions": "102 x 27 x 27 mm",
        "weight_grams": 165,
        "status": "in_stock",
    },
    "PRD-103": {
        "product_id": "PRD-103",
        "name": "ErgoDynamic Lumbar Mesh Chair",
        "category": "Furniture",
        "price": 349.00,
        "currency": "USD",
        "stock_count": 0,
        "dimensions": "650 x 650 x 1150 mm",
        "weight_grams": 14200,
        "status": "out_of_stock",
    },
    "PRD-104": {
        "product_id": "PRD-104",
        "name": "ThunderVolt 100W GaN Fast Charger",
        "category": "Accessories",
        "price": 49.99,
        "currency": "USD",
        "stock_count": 120,
        "dimensions": "60 x 60 x 30 mm",
        "weight_grams": 210,
        "status": "in_stock",
    },
    "PRD-105": {
        "product_id": "PRD-105",
        "name": "SonicWave Pro Noise-Cancelling Headphones",
        "category": "Audio",
        "price": 279.95,
        "currency": "USD",
        "stock_count": 8,
        "dimensions": "180 x 170 x 80 mm",
        "weight_grams": 250,
        "status": "in_stock",
    },
}


# ---------------------------------------------------------------------------
# Safe Math Evaluator (AST-based, strictly sandboxed)
# ---------------------------------------------------------------------------

_ALLOWED_OPERATORS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.FloorDiv: operator.floordiv,
    ast.Mod: operator.mod,
    ast.Pow: operator.pow,
    ast.USub: operator.neg,
    ast.UAdd: operator.pos,
}

_ALLOWED_FUNCTIONS = {
    "abs": abs,
    "round": round,
    "min": min,
    "max": max,
    "sum": sum,
    "pow": pow,
    "sqrt": math.sqrt,
    "log": math.log,
    "log10": math.log10,
    "ceil": math.ceil,
    "floor": math.floor,
    "mean": statistics.mean,
    "median": statistics.median,
}


def _eval_ast_node(node: ast.AST) -> Any:
    """Recursively evaluate a safe AST node without executing arbitrary code."""
    if isinstance(node, ast.Constant):
        if isinstance(node.value, (int, float)):
            return node.value
        raise ValueError(f"Unsupported constant type: {type(node.value).__name__}")

    if isinstance(node, ast.BinOp):
        op_type = type(node.op)
        if op_type not in _ALLOWED_OPERATORS:
            raise ValueError(f"Operator '{op_type.__name__}' is not allowed.")
        left = _eval_ast_node(node.left)
        right = _eval_ast_node(node.right)
        return _ALLOWED_OPERATORS[op_type](left, right)

    if isinstance(node, ast.UnaryOp):
        op_type = type(node.op)
        if op_type not in _ALLOWED_OPERATORS:
            raise ValueError(f"Unary operator '{op_type.__name__}' is not allowed.")
        operand = _eval_ast_node(node.operand)
        return _ALLOWED_OPERATORS[op_type](operand)

    if isinstance(node, ast.List) or isinstance(node, ast.Tuple):
        return [_eval_ast_node(elt) for elt in node.elts]

    if isinstance(node, ast.Call):
        func_name = None
        if isinstance(node.func, ast.Name):
            func_name = node.func.id
        elif isinstance(node.func, ast.Attribute) and isinstance(node.func.value, ast.Name):
            func_name = node.func.attr

        if not func_name or func_name not in _ALLOWED_FUNCTIONS:
            raise ValueError(f"Function '{func_name}' is not allowed.")

        args = [_eval_ast_node(arg) for arg in node.args]
        return _ALLOWED_FUNCTIONS[func_name](*args)

    raise ValueError(f"Unsupported expression syntax: {type(node).__name__}")


# ---------------------------------------------------------------------------
# Tool Implementations
# ---------------------------------------------------------------------------

def calculate_metrics(expression: str) -> Dict[str, Any]:
    """
    Safely evaluates a mathematical or statistical calculation.
    Example: '(140 / 39) * 100' or 'sqrt(256) + 14.5'.
    """
    cleaned_expr = str(expression).strip()
    try:
        parsed = ast.parse(cleaned_expr, mode="eval")
        result = _eval_ast_node(parsed.body)
        
        # Format clean representation
        if isinstance(result, float):
            result = round(result, 6)
            if result.is_integer():
                result = int(result)

        return {
            "status": "success",
            "expression": cleaned_expr,
            "result": result,
        }
    except ZeroDivisionError:
        return {
            "status": "error",
            "expression": cleaned_expr,
            "error": "Division by zero is undefined.",
            "result": None,
        }
    except Exception as exc:
        return {
            "status": "error",
            "expression": cleaned_expr,
            "error": f"Evaluation error: {str(exc)}",
            "result": None,
        }


def get_product_specs(product_id: str) -> Dict[str, Any]:
    """
    Looks up mock inventory/product data from a local catalog.
    If product_id is not found, returns explicit null/not found.
    """
    cleaned_id = str(product_id).strip().upper()
    specs = INVENTORY_DB.get(cleaned_id)

    if specs:
        return {
            "status": "found",
            "product_id": cleaned_id,
            "data": specs,
        }
    
    return {
        "status": "not_found",
        "product_id": cleaned_id,
        "error": f"Product '{cleaned_id}' was not found in the inventory database.",
        "data": None,
    }


# ---------------------------------------------------------------------------
# Tool Schemas for Function Calling
# ---------------------------------------------------------------------------

TOOLS_SCHEMA = [
    {
        "type": "function",
        "function": {
            "name": "calculate_metrics",
            "description": (
                "Safely evaluate a mathematical, percentage, or statistical calculation. "
                "Always use this tool whenever numeric arithmetic or formulas are needed. "
                "Example expression: '(140 / 39) * 100' or 'sqrt(144) * 5'."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "expression": {
                        "type": "string",
                        "description": "Mathematical expression string to evaluate (e.g. '(140 / 39) * 100')",
                    }
                },
                "required": ["expression"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_product_specs",
            "description": (
                "Lookup inventory and specifications for a product by its ID (e.g., 'PRD-101', 'PRD-102'). "
                "Returns price, stock count, dimensions, weight, and status. "
                "If the product ID does not exist, returns status 'not_found' with data as null."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "product_id": {
                        "type": "string",
                        "description": "The exact product code/ID, e.g., 'PRD-101'",
                    }
                },
                "required": ["product_id"],
            },
        },
    },
]

TOOL_FUNCTION_MAP = {
    "calculate_metrics": calculate_metrics,
    "get_product_specs": get_product_specs,
}

SYSTEM_PROMPT = """You are an accurate, deterministic, grounded AI assistant equipped with specialized execution tools.

CRITICAL ANTI-HALLUCINATION & GROUNDING RULES:
1. ALWAYS use the provided tools to retrieve product specifications or calculate mathematical/statistical results. Do NOT perform mental math or invent values.
2. When looking up products:
   - Call `get_product_specs` with the target product ID.
   - If the tool response indicates that the product was NOT found (status="not_found" or data=null), you MUST explicitly state that the product does not exist in the catalog or that the requested data is unavailable.
   - You are STRICTLY FORBIDDEN from inventing, fabricating, or guessing product specifications, prices, dimensions, or stock counts.
3. When computing numbers:
   - Call `calculate_metrics` with the expression.
   - Ground your answer completely on the numeric result returned by the tool.
4. Keep answers concise, clear, and professional.
""".strip()


# ---------------------------------------------------------------------------
# LLM Client Provider
# ---------------------------------------------------------------------------

def _get_llm_client_and_model():
    """
    Resolves client and model prioritizing GROQ or OPENAI from environment variables.
    """
    openai_key = os.getenv("OPENAI_API_KEY", "").strip()
    groq_key = os.getenv("GROQ_API_KEY", "").strip()

    if groq_key:
        from groq import AsyncGroq
        model = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
        return AsyncGroq(api_key=groq_key), model, "groq"
    elif openai_key:
        from openai import AsyncOpenAI
        model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        return AsyncOpenAI(api_key=openai_key), model, "openai"
    else:
        raise ValueError(
            "Neither GROQ_API_KEY nor OPENAI_API_KEY was found in environment variables. "
            "Please configure at least one in your .env file."
        )


# ---------------------------------------------------------------------------
# Core Agent Execution Loop
# ---------------------------------------------------------------------------

async def run_agent_query(query: str, max_turns: int = 5) -> Dict[str, Any]:
    """
    Runs the deterministic tool-calling AI agent for a user query.
    
    Returns:
        {
            "query": str,
            "response": str,
            "tools_used": list[{"tool_name": str, "tool_args": dict, "tool_output": any}],
            "execution_time_ms": float
        }
    """
    start_time = time.perf_counter()
    client, model_name, provider = _get_llm_client_and_model()

    messages: List[Dict[str, Any]] = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": query},
    ]

    tools_used: List[Dict[str, Any]] = []

    for _ in range(max_turns):
        completion = await client.chat.completions.create(
            model=model_name,
            messages=messages,
            tools=TOOLS_SCHEMA,
            tool_choice="auto",
            temperature=0.0,
            max_tokens=1024,
        )

        response_msg = completion.choices[0].message
        tool_calls = getattr(response_msg, "tool_calls", None)

        if not tool_calls:
            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
            return {
                "query": query,
                "response": response_msg.content or "",
                "tools_used": tools_used,
                "execution_time_ms": elapsed_ms,
            }

        # Append assistant message with tool calls to conversation history
        messages.append({
            "role": "assistant",
            "content": response_msg.content or "",
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

        # Execute each tool call
        for tc in tool_calls:
            fname = tc.function.name
            try:
                fargs = json.loads(tc.function.arguments) if isinstance(tc.function.arguments, str) else tc.function.arguments
            except Exception:
                fargs = {"raw": tc.function.arguments}

            handler = TOOL_FUNCTION_MAP.get(fname)
            if handler:
                try:
                    foutput = handler(**fargs)
                except Exception as exc:
                    foutput = {"status": "error", "error": f"Tool execution error: {str(exc)}"}
            else:
                foutput = {"status": "error", "error": f"Tool '{fname}' is not implemented."}

            tools_used.append({
                "tool_name": fname,
                "tool_args": fargs,
                "tool_output": foutput,
            })

            messages.append({
                "role": "tool",
                "tool_call_id": tc.id,
                "name": fname,
                "content": json.dumps(foutput),
            })

    elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
    return {
        "query": query,
        "response": response_msg.content or "Completed tool execution.",
        "tools_used": tools_used,
        "execution_time_ms": elapsed_ms,
    }
