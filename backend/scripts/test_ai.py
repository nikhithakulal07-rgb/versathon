import asyncio
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')


from app.config import settings
from app.ai.service import ai_service

async def main():
    print("=== LearnQuest AI Diagnostic Test ===")
    print(f"Configured Provider: {settings.AI_PROVIDER}")
    print(f"Configured Model: {settings.AI_MODEL}")
    print(f"Demo Mode: {settings.is_demo_mode}")
    print(f"Has API Key: {'Yes (Length: ' + str(len(settings.AI_API_KEY)) + ')' if settings.AI_API_KEY else 'No (Demo Mode Active)'}")
    
    health = await ai_service.health_check()
    print(f"Health check result: {health}")

    print("\nTesting path generation for 'Python Functions'...")
    path = await ai_service.generate_learning_path("Python Functions", "general", "beginner")
    print(f"Generated Topic: {path.get('title')}")
    print(f"Subtopics count: {len(path.get('subtopics', []))}")
    for s in path.get("subtopics", []):
        print(f" - [{s.get('order')}] {s.get('title')} ({s.get('concept_tag')})")

    print("\nTesting tutor reply...")
    tutor_res = await ai_service.tutor_reply(
        message="Can you give me an example with an analogy?",
        context={"topic_title": "Python Functions", "subtopic_title": "Return Values", "mastery": 42}
    )
    print(f"Tutor Reply:\n{tutor_res.get('reply')}")
    print("\n=== AI Diagnostic Complete ===")

if __name__ == "__main__":
    asyncio.run(main())
