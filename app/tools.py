"""
app/tools.py
------------
Deterministic execution implementations for all eight (8) backend tools.
Includes input validation, safe sandboxing, structured responses, and
Groq-compatible tool calling schemas.
"""

import csv
import io
import json
import math
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional
try:
    from zoneinfo import ZoneInfo
except ImportError:
    from backports.zoneinfo import ZoneInfo  # fallback for older environments

from app.config import ALLOWED_SEARCH_ROOTS, APP_TIMEZONE, KNOWLEDGE_BASE_PATH


# ===========================================================================
# TOOL 1: CALCULATOR
# ===========================================================================

def calculator(operation: str, a: float, b: float) -> Dict[str, Any]:
    """
    Safely perform basic arithmetic operations (add, subtract, multiply, divide).
    Never uses eval() or executes arbitrary code.
    """
    # Validate numbers
    try:
        val_a = float(a)
        val_b = float(b)
    except (TypeError, ValueError):
        return {"success": False, "error": f"Invalid numeric arguments: a={a}, b={b}."}

    if not (math.isfinite(val_a) and math.isfinite(val_b)):
        return {"success": False, "error": "Non-finite numeric inputs (NaN/Infinity) are rejected."}

    op = str(operation).strip().lower()
    op_map = {
        "add": ("+", lambda x, y: x + y),
        "+": ("+", lambda x, y: x + y),
        "addition": ("+", lambda x, y: x + y),
        "sum": ("+", lambda x, y: x + y),
        "subtract": ("-", lambda x, y: x - y),
        "-": ("-", lambda x, y: x - y),
        "subtraction": ("-", lambda x, y: x - y),
        "difference": ("-", lambda x, y: x - y),
        "multiply": ("*", lambda x, y: x * y),
        "*": ("*", lambda x, y: x * y),
        "multiplication": ("*", lambda x, y: x * y),
        "product": ("*", lambda x, y: x * y),
        "divide": ("/", None),
        "/": ("/", None),
        "division": ("/", None),
        "quotient": ("/", None),
    }

    if op not in op_map:
        return {
            "success": False,
            "error": f"Unsupported operation '{operation}'. Supported operations: add, subtract, multiply, divide."
        }

    symbol, fn = op_map[op]

    if symbol == "/":
        if val_b == 0.0:
            return {"success": False, "error": "Division by zero is undefined."}
        result = val_a / val_b
    else:
        result = fn(val_a, val_b)

    if not math.isfinite(result):
        return {"success": False, "error": "Calculation resulted in a non-finite value."}

    # Format cleanly (avoid .0 if integer)
    formatted_res = int(result) if result.is_integer() else round(result, 6)

    return {
        "success": True,
        "operation": op,
        "symbol": symbol,
        "a": val_a,
        "b": val_b,
        "result": formatted_res,
        "expression": f"{val_a} {symbol} {val_b} = {formatted_res}",
    }


# ===========================================================================
# TOOL 2: KNOWLEDGE-BASE SEARCH
# ===========================================================================

def search_knowledge_base(query: str) -> Dict[str, Any]:
    """
    Search factual documents from the local knowledge base using keyword matching.
    Returns explicit found: false if no reliable match exists.
    """
    cleaned_query = str(query).strip().lower()
    if not cleaned_query:
        return {
            "found": False,
            "query": query,
            "message": "Empty search query provided."
        }

    if not KNOWLEDGE_BASE_PATH.exists():
        return {
            "found": False,
            "query": query,
            "message": "Knowledge base file is missing or unreadable on the server."
        }

    try:
        with open(KNOWLEDGE_BASE_PATH, "r", encoding="utf-8") as f:
            documents: List[Dict[str, Any]] = json.load(f)
    except Exception as exc:
        return {
            "found": False,
            "query": query,
            "error": f"Failed to load knowledge base: {str(exc)}"
        }

    # Extract tokens with hyphens preserved (e.g. 'prd-101')
    query_tokens = set(re.findall(r"[a-z0-9\-]+", cleaned_query))
    stop_words = {"a", "an", "the", "in", "on", "at", "to", "for", "of", "and", "or", "is", "it", "item", "what", "how", "with"}
    significant_tokens = {t for t in query_tokens if len(t) > 2 and t not in stop_words}
    if not significant_tokens:
        significant_tokens = query_tokens

    # Check for specific target IDs (e.g. prd-999, doc-001)
    target_ids = {t for t in query_tokens if re.match(r"^(prd|doc)-\d+$", t)}

    scored_matches: List[tuple[int, Dict[str, Any]]] = []

    for doc in documents:
        doc_text = f"{doc.get('title', '')} {doc.get('content', '')} {' '.join(doc.get('keywords', []))}".lower()
        doc_tokens = set(re.findall(r"[a-z0-9\-]+", doc_text))

        # If a specific ID is queried, only match if that exact ID is present in document
        if target_ids and not target_ids.intersection(doc_tokens):
            continue

        score = 0
        if cleaned_query in doc_text:
            score += 15

        overlap = significant_tokens.intersection(doc_tokens)
        score += len(overlap) * 2

        if score >= 2:
            scored_matches.append((score, {
                "id": doc.get("id"),
                "title": doc.get("title"),
                "category": doc.get("category"),
                "source": doc.get("source"),
                "content": doc.get("content"),
            }))

    if not scored_matches:
        return {
            "found": False,
            "query": query,
            "message": "No matching information found in the available knowledge base."
        }

    scored_matches.sort(key=lambda x: x[0], reverse=True)
    best_matches = [m[1] for m in scored_matches[:3]]

    return {
        "found": True,
        "query": query,
        "matches_count": len(best_matches),
        "results": best_matches,
    }



# ===========================================================================
# TOOL 3: DATE AND TIME
# ===========================================================================

def get_current_datetime(timezone_name: Optional[str] = None) -> Dict[str, Any]:
    """
    Retrieve the actual current date and time at execution with timezone info.
    Returns a fresh timestamp every invocation.
    """
    target_tz_str = (timezone_name or APP_TIMEZONE or "UTC").strip()
    try:
        tz = ZoneInfo(target_tz_str)
        now = datetime.now(tz)
    except Exception:
        tz = timezone.utc
        target_tz_str = "UTC"
        now = datetime.now(tz)

    return {
        "timestamp_iso": now.isoformat(),
        "date": now.strftime("%Y-%m-%d"),
        "time": now.strftime("%H:%M:%S"),
        "day_of_week": now.strftime("%A"),
        "timezone": target_tz_str,
        "utc_offset": now.strftime("%z"),
        "is_dst": bool(now.dst()),
        "note": "Timestamp reflects server time. User local time may vary if situated in another timezone.",
    }


# ===========================================================================
# TOOL 4: UNIT CONVERTER
# ===========================================================================

_LINEAR_UNITS = {
    # Length -> base: meter
    "m": 1.0,
    "meter": 1.0,
    "meters": 1.0,
    "km": 1000.0,
    "kilometer": 1000.0,
    "kilometers": 1000.0,
    "mile": 1609.344,
    "miles": 1609.344,
    "mi": 1609.344,
    "ft": 0.3048,
    "feet": 0.3048,
    "foot": 0.3048,
    "cm": 0.01,
    "centimeter": 0.01,
    "centimeters": 0.01,
    "in": 0.0254,
    "inch": 0.0254,
    "inches": 0.0254,
    # Mass -> base: gram
    "g": 1.0,
    "gram": 1.0,
    "grams": 1.0,
    "kg": 1000.0,
    "kilogram": 1000.0,
    "kilograms": 1000.0,
    "lb": 453.59237,
    "lbs": 453.59237,
    "pound": 453.59237,
    "pounds": 453.59237,
}

_UNIT_CATEGORIES = {
    "m": "length", "meter": "length", "meters": "length",
    "km": "length", "kilometer": "length", "kilometers": "length",
    "mile": "length", "miles": "length", "mi": "length",
    "ft": "length", "feet": "length", "foot": "length",
    "cm": "length", "centimeter": "length", "centimeters": "length",
    "in": "length", "inch": "length", "inches": "length",
    "g": "mass", "gram": "mass", "grams": "mass",
    "kg": "mass", "kilogram": "mass", "kilograms": "mass",
    "lb": "mass", "lbs": "mass", "pound": "mass", "pounds": "mass",
    "c": "temp", "celsius": "temp",
    "f": "temp", "fahrenheit": "temp",
    "k": "temp", "kelvin": "temp",
}


def convert_units(value: float, from_unit: str, to_unit: str) -> Dict[str, Any]:
    """
    Convert measurements between compatible units (length, mass, temperature).
    Separates temperature formulas from linear factor conversions.
    """
    try:
        val = float(value)
    except (TypeError, ValueError):
        return {"success": False, "error": f"Invalid numeric value '{value}'."}

    if not math.isfinite(val):
        return {"success": False, "error": "Non-finite numeric values cannot be converted."}

    u_from = str(from_unit).strip().lower()
    u_to = str(to_unit).strip().lower()

    cat_from = _UNIT_CATEGORIES.get(u_from)
    cat_to = _UNIT_CATEGORIES.get(u_to)

    if not cat_from or not cat_to:
        return {
            "success": False,
            "error": f"Unsupported unit(s): '{from_unit}' or '{to_unit}'."
        }

    if cat_from != cat_to:
        return {
            "success": False,
            "error": f"Cannot convert between incompatible dimensions '{cat_from}' and '{cat_to}'."
        }

    # Handle Temperature Conversions
    if cat_from == "temp":
        # Normalize unit names
        u_f = "c" if u_from in ["c", "celsius"] else "f" if u_from in ["f", "fahrenheit"] else "k"
        u_t = "c" if u_to in ["c", "celsius"] else "f" if u_to in ["f", "fahrenheit"] else "k"

        # Convert to Celsius first
        if u_f == "c":
            temp_c = val
        elif u_f == "f":
            temp_c = (val - 32.0) * (5.0 / 9.0)
        else: # kelvin
            temp_c = val - 273.15

        # Convert from Celsius to target
        if u_t == "c":
            converted = temp_c
        elif u_t == "f":
            converted = (temp_c * (9.0 / 5.0)) + 32.0
        else: # kelvin
            converted = temp_c + 273.15

        return {
            "success": True,
            "original_value": val,
            "from_unit": from_unit,
            "target_unit": to_unit,
            "result": round(converted, 4),
            "category": "temperature",
        }

    # Handle Linear Conversions (Length, Mass)
    factor_from = _LINEAR_UNITS[u_from]
    factor_to = _LINEAR_UNITS[u_to]

    base_val = val * factor_from
    converted = base_val / factor_to

    return {
        "success": True,
        "original_value": val,
        "from_unit": from_unit,
        "target_unit": to_unit,
        "result": round(converted, 6),
        "category": cat_from,
    }


# ===========================================================================
# TOOL 5: TEXT ANALYZER
# ===========================================================================

def analyze_text(text: str) -> Dict[str, Any]:
    """
    Analyze user-provided text for word, character, line, and sentence counts.
    Deterministic execution without sending text to external services.
    """
    if not isinstance(text, str):
        text = str(text or "")

    words = text.split()
    word_count = len(words)
    char_count_with_spaces = len(text)
    char_count_without_spaces = len("".join(words))
    line_count = len(text.splitlines()) if text else 0

    # Count sentences based on standard terminal punctuation [.!?]
    sentences = re.split(r"[.!?]+", text)
    sentence_count = len([s for s in sentences if s.strip()]) if text.strip() else 0

    return {
        "word_count": word_count,
        "character_count_with_spaces": char_count_with_spaces,
        "character_count_without_spaces": char_count_without_spaces,
        "line_count": line_count,
        "sentence_count": sentence_count,
    }


# ===========================================================================
# TOOL 6: JSON VALIDATOR
# ===========================================================================

def validate_json(json_string: str) -> Dict[str, Any]:
    """
    Determine whether a supplied string is valid JSON without executing code.
    Reports top-level type or safe error location.
    """
    if not isinstance(json_string, str):
        return {"valid": False, "error": "Input must be a valid string."}

    # Input size protection (1 MB limit)
    if len(json_string.encode("utf-8")) > 1_048_576:
        return {"valid": False, "error": "JSON payload exceeds maximum permitted size of 1 MB."}

    if not json_string.strip():
        return {"valid": False, "error": "Supplied JSON string is empty."}

    try:
        parsed = json.loads(json_string)
        top_type = type(parsed).__name__
        count = len(parsed) if isinstance(parsed, (dict, list)) else 1

        return {
            "valid": True,
            "top_level_type": top_type,
            "element_count": count,
            "message": "Valid JSON format verified successfully.",
        }
    except json.JSONDecodeError as exc:
        return {
            "valid": False,
            "error": f"Invalid JSON syntax: {exc.msg}",
            "line": exc.lineno,
            "column": exc.colno,
        }


# ===========================================================================
# TOOL 7: CSV ANALYZER
# ===========================================================================

def analyze_csv(csv_content: Optional[str] = None, file_path: Optional[str] = None) -> Dict[str, Any]:
    """
    Analyze CSV data supplied as raw text or from an explicitly permitted file.
    Calculates row/col counts, missing values, and numeric summaries.
    """
    raw_data = ""

    # Load from file if specified
    if file_path:
        # Security: validate path stays within permitted directories
        target = Path(file_path).resolve()
        is_permitted = any(root in target.parents or target == root for root in ALLOWED_SEARCH_ROOTS)
        if not is_permitted:
            return {"success": False, "error": f"Access denied: Path '{file_path}' is outside permitted project directories."}
        if not target.exists() or not target.is_file():
            return {"success": False, "error": f"File '{file_path}' does not exist or is not a readable file."}
        if target.stat().st_size > 2_097_152: # 2MB limit
            return {"success": False, "error": "CSV file exceeds maximum permitted size of 2 MB."}
        try:
            with open(target, "r", encoding="utf-8", errors="replace") as f:
                raw_data = f.read()
        except Exception as exc:
            return {"success": False, "error": f"Failed to read CSV file: {str(exc)}"}
    elif csv_content:
        raw_data = str(csv_content)
    else:
        return {"success": False, "error": "Either 'csv_content' or 'file_path' must be provided."}

    if not raw_data.strip():
        return {"success": False, "error": "CSV content is empty."}

    try:
        reader = list(csv.reader(io.StringIO(raw_data.strip())))
    except Exception as exc:
        return {"success": False, "error": f"Malformed CSV structure: {str(exc)}"}

    if not reader:
        return {"success": False, "error": "No CSV data rows found."}

    headers = [h.strip() for h in reader[0]]
    data_rows = reader[1:]
    row_count = len(data_rows)
    col_count = len(headers)

    if row_count > 5000:
        return {"success": False, "error": "CSV row count exceeds maximum permitted limit of 5,000 rows."}

    missing_counts: Dict[str, int] = {h: 0 for h in headers}
    column_values: Dict[str, List[Any]] = {h: [] for h in headers}

    for row in data_rows:
        for idx, h in enumerate(headers):
            val = row[idx].strip() if idx < len(row) else ""
            if not val:
                missing_counts[h] += 1
            else:
                column_values[h].append(val)

    # Numeric summaries for numerical columns
    numeric_summaries: Dict[str, Any] = {}
    for h, vals in column_values.items():
        if not vals:
            continue
        try:
            num_vals = [float(v) for v in vals]
            numeric_summaries[h] = {
                "count": len(num_vals),
                "min": round(min(num_vals), 4),
                "max": round(max(num_vals), 4),
                "sum": round(sum(num_vals), 4),
                "average": round(sum(num_vals) / len(num_vals), 4),
            }
        except ValueError:
            # Non-numeric column
            pass

    return {
        "success": True,
        "row_count": row_count,
        "column_count": col_count,
        "headers": headers,
        "missing_values": missing_counts,
        "numeric_summaries": numeric_summaries,
    }


# ===========================================================================
# TOOL 8: RESTRICTED FILE SEARCH
# ===========================================================================

_PERMITTED_EXTENSIONS = {".txt", ".md", ".json", ".py", ".csv"}
_SENSITIVE_NAMES = {".env", "id_rsa", "credentials", "secrets", "password", "token", "key"}


def search_files(query: str, root_dir: str = "allowed_data", file_extension: Optional[str] = None) -> Dict[str, Any]:
    """
    Search for text within explicitly allowed project directories.
    Strictly prevents directory traversal and rejects sensitive configuration files.
    """
    cleaned_query = str(query).strip().lower()
    if not cleaned_query:
        return {"success": False, "error": "Search query cannot be empty."}

    # Resolve target directory safely
    # If root_dir is relative, resolve from project root
    base_dir = ALLOWED_SEARCH_ROOTS[0].parent
    candidate_path = (base_dir / root_dir).resolve() if not Path(root_dir).is_absolute() else Path(root_dir).resolve()

    # Verify candidate_path is within ALLOWED_SEARCH_ROOTS
    is_safe = any(
        allowed_root == candidate_path or allowed_root in candidate_path.parents
        for allowed_root in ALLOWED_SEARCH_ROOTS
    )

    if not is_safe:
        return {
            "success": False,
            "error": f"Security restriction: Access to directory '{root_dir}' is forbidden. Permitted roots: {[str(r.name) for r in ALLOWED_SEARCH_ROOTS]}."
        }

    if not candidate_path.exists() or not candidate_path.is_dir():
        return {"success": False, "error": f"Target directory '{root_dir}' does not exist."}

    results: List[Dict[str, Any]] = []

    for path in candidate_path.rglob("*"):
        if len(results) >= 10:
            break

        if not path.is_file():
            continue

        # Prevent symlink escapes
        if path.is_symlink():
            resolved_symlink = path.resolve()
            if not any(allowed_root in resolved_symlink.parents for allowed_root in ALLOWED_SEARCH_ROOTS):
                continue

        # Skip disallowed extensions
        if path.suffix.lower() not in _PERMITTED_EXTENSIONS:
            continue

        # Check requested file extension filter
        if file_extension and path.suffix.lower() != file_extension.lower().strip():
            continue

        # Exclude secrets & environment files
        if any(s in path.name.lower() for s in _SENSITIVE_NAMES):
            continue

        # Enforce file size limit (1MB max)
        try:
            if path.stat().st_size > 1_048_576:
                continue
        except OSError:
            continue

        # Search content
        try:
            with open(path, "r", encoding="utf-8", errors="replace") as f:
                for line_num, line in enumerate(f, 1):
                    if cleaned_query in line.lower():
                        rel_path = str(path.relative_to(base_dir)).replace("\\", "/")
                        results.append({
                            "file": rel_path,
                            "line_number": line_num,
                            "snippet": line.strip()[:150],
                        })
                        if len(results) >= 10:
                            break
        except Exception:
            continue

    return {
        "success": True,
        "query": query,
        "matches_count": len(results),
        "matches": results,
    }


# ===========================================================================
# Tool Registry & Groq Tool Call Schemas
# ===========================================================================

TOOL_REGISTRY = {
    "calculator": calculator,
    "search_knowledge_base": search_knowledge_base,
    "get_current_datetime": get_current_datetime,
    "convert_units": convert_units,
    "analyze_text": analyze_text,
    "validate_json": validate_json,
    "analyze_csv": analyze_csv,
    "search_files": search_files,
}

TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "calculator",
            "description": "Perform basic arithmetic operations (add, subtract, multiply, divide). Use for numerical math calculations.",
            "parameters": {
                "type": "object",
                "properties": {
                    "operation": {"type": "string", "enum": ["add", "subtract", "multiply", "divide"], "description": "Operation name"},
                    "a": {"type": "number", "description": "First numeric operand"},
                    "b": {"type": "number", "description": "Second numeric operand"},
                },
                "required": ["operation", "a", "b"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "search_knowledge_base",
            "description": "Search the local factual knowledge base for corporate policies, product catalogs (e.g. PRD-101), support hours, and specifications. Returns authoritative facts or found: false.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Search keywords or topic (e.g. 'PRD-101 price', 'return policy')"},
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_current_datetime",
            "description": "Retrieve the actual current server date and time at execution with timezone information.",
            "parameters": {
                "type": "object",
                "properties": {
                    "timezone_name": {"type": "string", "description": "Optional IANA timezone name (e.g. 'UTC', 'America/New_York')"},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "convert_units",
            "description": "Convert numerical values between length (km, miles, m, ft, cm, in), mass (kg, lbs, g), or temperature (celsius, fahrenheit, kelvin).",
            "parameters": {
                "type": "object",
                "properties": {
                    "value": {"type": "number", "description": "Quantity to convert"},
                    "from_unit": {"type": "string", "description": "Starting unit (e.g. 'km', 'celsius', 'kg', 'miles')"},
                    "to_unit": {"type": "string", "description": "Target unit (e.g. 'miles', 'fahrenheit', 'lbs', 'km')"},
                },
                "required": ["value", "from_unit", "to_unit"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "analyze_text",
            "description": "Analyze text string for word count, character count with and without spaces, line count, and sentence count.",
            "parameters": {
                "type": "object",
                "properties": {
                    "text": {"type": "string", "description": "Text content to inspect"},
                },
                "required": ["text"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "validate_json",
            "description": "Check if a string is valid JSON. Returns valid status, top-level type, and element counts, or safe error details.",
            "parameters": {
                "type": "object",
                "properties": {
                    "json_string": {"type": "string", "description": "JSON string to parse and validate"},
                },
                "required": ["json_string"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "analyze_csv",
            "description": "Analyze CSV data. Computes row and column counts, headers, missing values, and numerical column summaries (min, max, average, sum).",
            "parameters": {
                "type": "object",
                "properties": {
                    "csv_content": {"type": "string", "description": "Raw CSV string data"},
                    "file_path": {"type": "string", "description": "Relative path to permitted CSV file (e.g. 'allowed_data/quarterly_sales.csv')"},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "search_files",
            "description": "Search text files within explicitly permitted project directories (allowed_data/ or static/). Rejects sensitive or system files.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Search string or keyword to find within allowed files"},
                    "root_dir": {"type": "string", "description": "Directory to search within (defaults to 'allowed_data')"},
                    "file_extension": {"type": "string", "description": "Optional extension filter, e.g. '.txt', '.md', '.csv'"},
                },
                "required": ["query"],
            },
        },
    },
]
