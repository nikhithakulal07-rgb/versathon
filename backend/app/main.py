import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.db import engine, Base
from app.seed.seed import seed_database
from app.routers import (
    meta, auth, curriculum, open, learn, diagnostic,
    tests, flashcards, progress, gamification, game, ai
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("learnquest.main")

# Rate limiter setup
limiter = Limiter(key_func=get_remote_address, default_limits=["120/minute"])

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing LearnQuest backend...")
    Base.metadata.create_all(bind=engine)
    # Ensure database is seeded
    try:
        seed_database()
    except Exception as e:
        logger.warning(f"Database auto-seed notice: {e}")
    yield
    logger.info("Shutting down LearnQuest backend.")

app = FastAPI(
    title="LearnQuest API",
    description="Adaptive, AI-Powered, Gamified Learning Platform Backend",
    version="1.0.0",
    lifespan=lifespan
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Strict CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

# Standardized Error Handler for HTTPExceptions
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    detail = exc.detail
    if isinstance(detail, dict) and "code" in detail:
        error_code = detail.get("code", "ERROR")
        error_message = detail.get("message", "An error occurred.")
    elif isinstance(detail, str):
        error_code = "HTTP_ERROR"
        error_message = detail
    else:
        error_code = "HTTP_ERROR"
        error_message = str(detail)

    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": error_code, "message": error_message}}
    )

# Include All Routers under /api
app.include_router(meta.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(curriculum.router, prefix="/api")
app.include_router(open.router, prefix="/api")
app.include_router(learn.router, prefix="/api")
app.include_router(diagnostic.router, prefix="/api")
app.include_router(tests.router, prefix="/api")
app.include_router(flashcards.router, prefix="/api")
app.include_router(progress.router, prefix="/api")
app.include_router(gamification.router, prefix="/api")
app.include_router(game.router, prefix="/api")
app.include_router(ai.router, prefix="/api")

@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": "LearnQuest", "version": "1.0.0"}
