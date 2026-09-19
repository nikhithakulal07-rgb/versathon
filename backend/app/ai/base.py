from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional

class BaseAIProvider(ABC):
    @abstractmethod
    async def generate_learning_path(
        self,
        topic_text: str,
        learner_type: str = "general",
        level_hint: str = "beginner"
    ) -> Dict[str, Any]:
        """Generates topic title, description, and list of structured subtopics with concept tags."""
        pass

    @abstractmethod
    async def generate_questions(
        self,
        subtopic_title: str,
        concept_tag: str,
        difficulty: int = 3,
        n: int = 4,
        avoid_stems: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """Generates n validated multiple choice questions."""
        pass

    @abstractmethod
    async def generate_flashcards(
        self,
        subtopic_title: str,
        concept_tag: str,
        n: int = 5
    ) -> List[Dict[str, Any]]:
        """Generates n flashcards."""
        pass

    @abstractmethod
    async def explain(
        self,
        subtopic_title: str,
        concept_tag: str,
        level: str = "intermediate",
        student_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Generates markdown explanation + visual_spec JSON."""
        pass

    @abstractmethod
    async def tutor_reply(
        self,
        message: str,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generates context-aware conversational response for the AI tutor."""
        pass

    @abstractmethod
    async def health_check(self) -> bool:
        """Returns True if provider is reachable."""
        pass
