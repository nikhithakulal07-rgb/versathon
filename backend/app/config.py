import os
import secrets
import logging
from typing import Optional, Literal
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger("learnquest.config")

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    APP_ENV: Literal["development", "production", "test"] = "development"
    SECRET_KEY: Optional[str] = None
    DATABASE_URL: str = "sqlite:///./learnquest.db"
    FRONTEND_ORIGIN: str = "http://localhost:5173"
    COOKIE_SECURE: bool = False

    AI_PROVIDER: str = "gemini"
    AI_API_KEY: Optional[str] = None
    AI_MODEL: str = "gemini-1.5-flash"
    AI_TIMEOUT_SECONDS: int = 30
    AI_RATE_LIMIT_PER_MINUTE: int = 10
    DEMO_MODE: str = "auto"
    SHOW_DEMO_BADGE: bool = True

    SMTP_HOST: Optional[str] = None
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None

    _ephemeral_secret: Optional[str] = None

    def get_secret_key(self) -> str:
        if self.SECRET_KEY and len(self.SECRET_KEY) >= 16:
            return self.SECRET_KEY
        if not self._ephemeral_secret:
            self._ephemeral_secret = secrets.token_hex(32)
            if self.APP_ENV == "development":
                logger.warning("SECRET_KEY not set or too short. Generated ephemeral secret for development.")
            elif self.APP_ENV == "production":
                raise ValueError("SECRET_KEY must be configured in production environment!")
        return self._ephemeral_secret

    @property
    def is_demo_mode(self) -> bool:
        mode = self.DEMO_MODE.strip().lower()
        if mode == "true":
            return True
        if mode == "false":
            if not self.AI_API_KEY and self.AI_PROVIDER != "mock":
                raise ValueError("DEMO_MODE is false but AI_API_KEY is not configured.")
            return False
        # mode == "auto"
        if not self.AI_API_KEY or len(self.AI_API_KEY.strip()) == 0 or self.AI_PROVIDER == "mock":
            return True
        return False

settings = Settings()
