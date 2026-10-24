"""
app/config.py
-------------
Centralized configuration management for Milestone 2 AI Agent.
Loads settings from environment variables using python-dotenv.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Ensure .env is loaded
load_dotenv(override=True)

# Project base directory
BASE_DIR = Path(__file__).resolve().parent.parent

# Groq API Configuration
GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "").strip()
GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile").strip()
GROQ_MAX_TOOL_CALLS: int = int(os.getenv("GROQ_MAX_TOOL_CALLS", "8"))

# Application Timezone
APP_TIMEZONE: str = os.getenv("APP_TIMEZONE", "UTC").strip()

# Security: Explicitly permitted roots for File Search tool
# Restricts file search strictly to allowed project folders
ALLOWED_SEARCH_ROOTS: list[Path] = [
    (BASE_DIR / "allowed_data").resolve(),
    (BASE_DIR / "static").resolve(),
]

# Path to Knowledge Base JSON
KNOWLEDGE_BASE_PATH: Path = (Path(__file__).resolve().parent / "knowledge_base.json").resolve()
if not KNOWLEDGE_BASE_PATH.exists():
    KNOWLEDGE_BASE_PATH = (BASE_DIR / "knowledge_base.json").resolve()


def validate_config(require_api_key: bool = True) -> dict[str, str]:
    """
    Validates essential configuration parameters.
    Never prints or exposes secret keys.
    """
    status = {
        "model": GROQ_MODEL,
        "max_tool_calls": str(GROQ_MAX_TOOL_CALLS),
        "timezone": APP_TIMEZONE,
        "api_key_configured": "yes" if bool(GROQ_API_KEY) else "no",
        "allowed_roots_count": str(len(ALLOWED_SEARCH_ROOTS)),
    }
    if require_api_key and not GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY environment variable is missing. Please configure it in .env.")
    return status
