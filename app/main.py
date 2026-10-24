"""
app/main.py
-----------
Unified Modular FastAPI Application.
Integrates:
- Health & Root Router
- Module 1: CSS Parser & Groq Auditor Router
- Module 2: Grounded Function-Calling AI Agent Router
"""

from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.agent import GroqAgent
from app.routers.health_router import router as health_router
from app.routers.milestone1_router import router as milestone1_router
from app.routers.milestone2_router import get_m2_router

# Initialize application
app = FastAPI(
    title="Milestone Unified Modular API",
    description=(
        "Production-grade, modular API for Milestone 1 (CSS Parser & AI Review) "
        "and Milestone 2 (Grounded Function-Calling AI Agent)."
    ),
    version="2.0.0",
)

# Enable CORS for flexible integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize GroqAgent singleton
agent = GroqAgent()

# Mount Modular Routers
app.include_router(health_router)
app.include_router(milestone1_router)
app.include_router(get_m2_router(agent))

# Mount Static Assets if directory exists
STATIC_DIR = Path(__file__).resolve().parent.parent / "static"
if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")
