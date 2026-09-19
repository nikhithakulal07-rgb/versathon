from fastapi import APIRouter, HTTPException, status
from app.config import settings
from app.schemas.meta import MetaResponse, AIHealthResponse
from app.ai.service import ai_service

router = APIRouter(tags=["Meta"])

@router.get("/meta", response_model=MetaResponse)
def get_meta():
    """
    Returns app metadata, environment, and demo mode indicator.
    NEVER exposes secrets, API keys, or private tokens.
    """
    return MetaResponse(
        demoMode=settings.is_demo_mode,
        aiAvailable=bool(settings.AI_API_KEY) and not settings.is_demo_mode,
        appEnv=settings.APP_ENV,
        showDemoBadge=settings.SHOW_DEMO_BADGE,
        version="1.0.0"
    )

@router.get("/ai/health", response_model=AIHealthResponse)
async def get_ai_health():
    """
    Development health check for AI provider connectivity.
    Disabled in production environment for security.
    """
    if settings.APP_ENV == "production":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Endpoint disabled in production mode."
        )
    
    health_data = await ai_service.health_check()
    return AIHealthResponse(**health_data)
