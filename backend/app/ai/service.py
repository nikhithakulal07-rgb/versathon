import logging
from typing import Dict, Any, List, Optional
from app.config import settings
from app.ai.base import BaseAIProvider
from app.ai.mock import MockAIProvider
from app.ai.gemini import GeminiAIProvider

logger = logging.getLogger("learnquest.ai.service")

class AIService:
    def __init__(self):
        self.mock_provider = MockAIProvider()
        self.gemini_provider = GeminiAIProvider() if settings.AI_API_KEY else None

    def _get_provider(self) -> BaseAIProvider:
        if settings.is_demo_mode:
            return self.mock_provider
        
        if settings.AI_PROVIDER == "gemini" and self.gemini_provider:
            return self.gemini_provider
        
        return self.mock_provider

    async def generate_learning_path(
        self,
        topic_text: str,
        learner_type: str = "general",
        level_hint: str = "beginner"
    ) -> Dict[str, Any]:
        provider = self._get_provider()
        try:
            return await provider.generate_learning_path(topic_text, learner_type, level_hint)
        except Exception as e:
            logger.warning(f"AI provider failed, falling back to mock: {e}")
            return await self.mock_provider.generate_learning_path(topic_text, learner_type, level_hint)

    async def generate_questions(
        self,
        subtopic_title: str,
        concept_tag: str,
        difficulty: int = 3,
        n: int = 4,
        avoid_stems: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        provider = self._get_provider()
        try:
            return await provider.generate_questions(subtopic_title, concept_tag, difficulty, n, avoid_stems)
        except Exception as e:
            logger.warning(f"AI question generation failed, falling back: {e}")
            return await self.mock_provider.generate_questions(subtopic_title, concept_tag, difficulty, n, avoid_stems)

    async def generate_flashcards(
        self,
        subtopic_title: str,
        concept_tag: str,
        n: int = 5
    ) -> List[Dict[str, Any]]:
        provider = self._get_provider()
        try:
            return await provider.generate_flashcards(subtopic_title, concept_tag, n)
        except Exception as e:
            logger.warning(f"AI flashcard generation failed, falling back: {e}")
            return await self.mock_provider.generate_flashcards(subtopic_title, concept_tag, n)

    async def explain(
        self,
        subtopic_title: str,
        concept_tag: str,
        level: str = "intermediate",
        student_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        provider = self._get_provider()
        try:
            return await provider.explain(subtopic_title, concept_tag, level, student_context)
        except Exception as e:
            logger.warning(f"AI explanation failed, falling back: {e}")
            return await self.mock_provider.explain(subtopic_title, concept_tag, level, student_context)

    async def tutor_reply(
        self,
        message: str,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        provider = self._get_provider()
        try:
            res = await provider.tutor_reply(message, context)
            res["is_demo_fallback"] = settings.is_demo_mode
            return res
        except Exception as e:
            logger.warning(f"AI tutor reply failed, falling back to scripted tutor: {e}")
            res = await self.mock_provider.tutor_reply(message, context)
            res["is_demo_fallback"] = True
            return res

    async def health_check(self) -> Dict[str, Any]:
        if settings.is_demo_mode:
            return {
                "provider": "mock",
                "model": "demo-packs-v1",
                "reachable": True,
                "demoMode": True
            }

        provider = self._get_provider()
        is_reachable = await provider.health_check()
        return {
            "provider": settings.AI_PROVIDER,
            "model": settings.AI_MODEL,
            "reachable": is_reachable,
            "demoMode": False
        }

ai_service = AIService()
