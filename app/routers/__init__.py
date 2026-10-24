from app.routers.health_router import router as health_router
from app.routers.milestone1_router import router as milestone1_router
from app.routers.milestone2_router import get_m2_router

__all__ = [
    "health_router",
    "milestone1_router",
    "get_m2_router",
]
