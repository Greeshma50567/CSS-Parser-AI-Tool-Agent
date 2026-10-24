"""
groq_service.py
---------------
Groq AI integration layer for the CSS Parser API.

Provides a single async function `get_css_analysis()` that takes the
already-parsed CSS rules list and asks the Groq LLM to review them,
returning structured AI feedback.
"""

import json
import os
import re

from groq import AsyncGroq
from dotenv import load_dotenv

# override=True ensures .env always wins over any inherited OS environment
load_dotenv(override=True)

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

_SYSTEM_PROMPT = """
You are a senior frontend engineer and CSS expert performing a structured code review.
You will be given a list of parsed CSS rules as JSON.
Your task is to analyse them and return a JSON object with EXACTLY these four keys:

{
  "summary": "<2-3 sentence overall summary of the stylesheet's purpose and structure>",
  "suggestions": ["<concise improvement #1>", "<concise improvement #2>"],
  "accessibility": ["<concise a11y note #1>", "<concise a11y note #2>"],
  "best_practices": ["<concise best practice tip #1>", "<concise best practice tip #2>"]
}

Rules:
- Return ONLY valid JSON matching the schema above.
- Provide 2 to 4 concise, specific, and actionable items per category.
- Reference actual selectors/properties from the input.
""".strip()


def _extract_and_parse_json(raw_text: str) -> dict:
    """Safely extract and parse JSON, handling markdown blocks or partial output."""
    raw = raw_text.strip()

    # Strip markdown fences if present
    if "```" in raw:
        match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", raw)
        if match:
            raw = match.group(1).strip()
        else:
            lines = [l for l in raw.splitlines() if not l.strip().startswith("```")]
            raw = "\n".join(lines).strip()

    # Direct JSON parse attempt
    try:
        data = json.loads(raw)
        if isinstance(data, dict):
            return _normalize_analysis(data)
    except Exception:
        pass

    # Extract JSON object substring
    start = raw.find("{")
    end = raw.rfind("}")
    if start != -1 and end != -1 and end > start:
        try:
            data = json.loads(raw[start:end + 1])
            if isinstance(data, dict):
                return _normalize_analysis(data)
        except Exception:
            pass

    # Attempt progressive auto-repair if truncated
    if start != -1:
        snippet = raw[start:].strip()
        snippet = re.sub(r",\s*$", "", snippet)
        
        quote_count = snippet.count('"') - snippet.count('\\"')
        if quote_count % 2 != 0:
            snippet += '"'
        
        open_b = snippet.count('[') - snippet.count(']')
        if open_b > 0:
            snippet += ']' * open_b
        open_c = snippet.count('{') - snippet.count('}')
        if open_c > 0:
            snippet += '}' * open_c

        try:
            data = json.loads(snippet)
            if isinstance(data, dict):
                return _normalize_analysis(data)
        except Exception:
            pass

    raise ValueError(f"Groq returned non-JSON output. Raw response:\n{raw_text}")


def _normalize_analysis(data: dict) -> dict:
    """Ensure all required keys exist with proper types."""
    return {
        "summary": str(data.get("summary") or "CSS stylesheet analysis completed."),
        "suggestions": list(data.get("suggestions") or []),
        "accessibility": list(data.get("accessibility") or []),
        "best_practices": list(data.get("best_practices") or [])
    }


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def get_css_analysis(rules: list[dict]) -> dict:
    """
    Send parsed CSS rules to Groq and return AI-generated review.

    Args:
        rules: Output of `parse_css()` - list of selector/properties/count dicts.

    Returns:
        A dict with keys: summary, suggestions, accessibility, best_practices.

    Raises:
        ValueError: If the API key is missing or the model returns unparseable JSON.
        Exception:  Propagates any network / Groq API errors.
    """
    api_key = os.getenv("GROQ_API_KEY", "")
    model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

    if not api_key:
        raise ValueError("GROQ_API_KEY is not set. Add it to your .env file.")

    client = AsyncGroq(api_key=api_key)

    # Sample top 80 rules if stylesheet is huge to stay comfortably within context limit
    sampled_rules = rules[:80] if len(rules) > 80 else rules

    user_message = (
        "Here are the parsed CSS rules to review:\n\n"
        + json.dumps(sampled_rules, indent=2)
    )

    try:
        completion = await client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user",   "content": user_message},
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
            max_tokens=3000,
        )
    except Exception as exc:
        err_msg = str(exc).lower()
        if "response_format" in err_msg or "json_object" in err_msg:
            completion = await client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": _SYSTEM_PROMPT},
                    {"role": "user",   "content": user_message},
                ],
                temperature=0.3,
                max_tokens=3000,
            )
        else:
            raise exc

    raw_text = completion.choices[0].message.content or ""
    return _extract_and_parse_json(raw_text)
