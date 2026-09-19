import json
import logging
import httpx
from typing import Dict, Any, List, Optional
from app.ai.base import BaseAIProvider
from app.ai.prompts import (
    PATH_GENERATION_PROMPT,
    QUESTION_GENERATION_PROMPT,
    EXPLANATION_PROMPT,
    TUTOR_PROMPT
)
from app.config import settings

logger = logging.getLogger("learnquest.ai.gemini")

class GeminiAIProvider(BaseAIProvider):
    def __init__(self):
        self.api_key = settings.AI_API_KEY
        self.model = settings.AI_MODEL or "gemini-1.5-flash"
        self.timeout = settings.AI_TIMEOUT_SECONDS or 30

    async def _call_gemini(self, prompt: str, json_mode: bool = True) -> Dict[str, Any]:
        if not self.api_key:
            raise ValueError("AI_API_KEY is not configured.")

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
        
        generation_config = {
            "temperature": 0.3 if json_mode else 0.7,
            "maxOutputTokens": 2048,
        }
        if json_mode:
            generation_config["responseMimeType"] = "application/json"

        payload = {
            "contents": [
                {
                    "parts": [{"text": prompt}]
                }
            ],
            "generationConfig": generation_config
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(url, json=payload)
            if response.status_code != 200:
                logger.error(f"Gemini API returned {response.status_code}: {response.text}")
                response.raise_for_status()

            data = response.json()
            candidates = data.get("candidates", [])
            if not candidates:
                raise ValueError("No candidate responses returned from Gemini.")

            content_text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            
            if json_mode:
                # Strip markdown json backticks if present
                clean_text = content_text.strip()
                if clean_text.startswith("```json"):
                    clean_text = clean_text[7:]
                if clean_text.startswith("```"):
                    clean_text = clean_text[3:]
                if clean_text.endswith("```"):
                    clean_text = clean_text[:-3]
                clean_text = clean_text.strip()
                return json.loads(clean_text)
            else:
                return {"text": content_text}

    async def generate_learning_path(
        self,
        topic_text: str,
        learner_type: str = "general",
        level_hint: str = "beginner"
    ) -> Dict[str, Any]:
        prompt = PATH_GENERATION_PROMPT.format(
            topic_text=topic_text,
            learner_type=learner_type,
            level_hint=level_hint
        )
        return await self._call_gemini(prompt, json_mode=True)

    async def generate_questions(
        self,
        subtopic_title: str,
        concept_tag: str,
        difficulty: int = 3,
        n: int = 4,
        avoid_stems: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        prompt = QUESTION_GENERATION_PROMPT.format(
            subtopic_title=subtopic_title,
            concept_tag=concept_tag,
            difficulty=difficulty,
            n=n,
            avoid_stems=", ".join(avoid_stems or ["None"])
        )
        data = await self._call_gemini(prompt, json_mode=True)
        return data.get("questions", [])

    async def generate_flashcards(
        self,
        subtopic_title: str,
        concept_tag: str,
        n: int = 5
    ) -> List[Dict[str, Any]]:
        prompt = f"""Generate {n} flashcards for '{subtopic_title}' (concept: {concept_tag}).
Respond in JSON with schema: {{"flashcards": [{{"front": "Q/Concept", "back": "Answer", "concept_tag": "{concept_tag}"}}]}}"""
        data = await self._call_gemini(prompt, json_mode=True)
        return data.get("flashcards", [])

    async def explain(
        self,
        subtopic_title: str,
        concept_tag: str,
        level: str = "intermediate",
        student_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        prompt = EXPLANATION_PROMPT.format(
            subtopic_title=subtopic_title,
            concept_tag=concept_tag,
            level=level,
            student_context=json.dumps(student_context or {})
        )
        return await self._call_gemini(prompt, json_mode=True)

    async def tutor_reply(
        self,
        message: str,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        prompt = TUTOR_PROMPT.format(
            message=message,
            topic_title=context.get("topic_title", "General Topic"),
            subtopic_title=context.get("subtopic_title", "General Concept"),
            mastery=round(context.get("mastery", 50)),
            status=context.get("status", "unassessed"),
            difficulty=context.get("difficulty", 3),
            recent_mistakes=json.dumps(context.get("recent_mistakes", []))
        )
        return await self._call_gemini(prompt, json_mode=True)

    async def health_check(self) -> bool:
        try:
            res = await self._call_gemini("Respond with {\"status\": \"ok\"}", json_mode=True)
            return res.get("status") == "ok"
        except Exception as e:
            logger.warning(f"Gemini health check failed: {e}")
            return False
