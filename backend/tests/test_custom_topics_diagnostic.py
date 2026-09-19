import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def get_auth_cookies():
    res = client.post("/api/auth/login", json={
        "username_or_email": "alex_learner",
        "password": "Password123!"
    })
    return res.cookies

def test_custom_user_topic_ai_and_diagnostic_flow():
    cookies = get_auth_cookies()
    # 1. Create a brand new custom user topic
    custom_topic_payload = {
        "topic_text": "Quantum Computing Superposition and Gates",
        "learner_type": "visual",
        "level_hint": "beginner"
    }
    create_res = client.post("/api/open/topics", json=custom_topic_payload, cookies=cookies)
    assert create_res.status_code == 200, create_res.text
    topic_data = create_res.json()
    assert topic_data["title"] is not None
    assert len(topic_data["subtopics"]) >= 3
    topic_id = topic_data["id"]
    subtopic_0 = topic_data["subtopics"][0]

    # 2. Verify all 3 explanation levels exist with visual specifications
    for level in ["beginner", "intermediate", "advanced"]:
        exp_res = client.get(f"/api/learn/explanations?subtopic_id={subtopic_0['id']}&level={level}", cookies=cookies)
        assert exp_res.status_code == 200, exp_res.text
        exp_data = exp_res.json()
        assert exp_data["level"] == level
        assert exp_data["body_markdown"] is not None
        assert exp_data["visual_spec"] is not None

    # 3. Verify flashcards exist for subtopic
    fc_res = client.get(f"/api/subtopics/{subtopic_0['id']}/flashcards", cookies=cookies)
    assert fc_res.status_code == 200, fc_res.text
    flashcards = fc_res.json()
    assert len(flashcards) >= 4

    # 4. Start diagnostic assessment on this custom user topic
    diag_start_res = client.post("/api/diagnostic/start", json={"topic_id": topic_id, "mode_used": "open"}, cookies=cookies)
    assert diag_start_res.status_code == 200, diag_start_res.text
    diag_id = diag_start_res.json()["diagnostic_id"]

    # 5. Take diagnostic questions until completed (guaranteeing coverage across subtopics)
    questions_taken = 0
    while questions_taken < 10:
        next_res = client.get(f"/api/diagnostic/{diag_id}/next", cookies=cookies)
        assert next_res.status_code == 200, next_res.text
        next_data = next_res.json()
        if next_data["is_completed"] or next_data["question"] is None:
            break
        
        q = next_data["question"]
        assert q["id"] is not None
        assert q["stem"] is not None
        assert len(q["options"]) == 4

        # Submit answer
        ans_res = client.post(f"/api/diagnostic/{diag_id}/answer", json={
            "question_id": q["id"],
            "chosen_index": 0,
            "time_taken_seconds": 25,
            "hint_used": False
        }, cookies=cookies)
        assert ans_res.status_code == 200, ans_res.text
        questions_taken += 1

    assert questions_taken >= 3, "Diagnostic test should present questions across subtopics"

    # 6. Finish diagnostic test
    finish_res = client.post(f"/api/diagnostic/{diag_id}/finish", cookies=cookies)
    assert finish_res.status_code == 200, finish_res.text
    summary = finish_res.json()["summary"]
    assert "subtopics" in summary
    assert len(summary["subtopics"]) >= 3
    assert finish_res.json()["xp_earned"] >= 30

    # 7. Start adaptive test on the newly mastered custom topic
    test_start_res = client.post("/api/tests/start", json={"topic_id": topic_id, "type": "adaptive", "mode_used": "open"}, cookies=cookies)
    assert test_start_res.status_code == 200, test_start_res.text
    test_id = test_start_res.json()["test_id"]

    # 8. Answer 5 adaptive test questions
    for _ in range(5):
        next_t_res = client.get(f"/api/tests/{test_id}/next", cookies=cookies)
        assert next_t_res.status_code == 200, next_t_res.text
        t_data = next_t_res.json()
        if t_data["is_completed"] or t_data["question"] is None:
            break
        t_q = t_data["question"]
        client.post(f"/api/tests/{test_id}/answer", json={
            "question_id": t_q["id"],
            "chosen_index": 0,
            "time_taken_seconds": 30,
            "hint_used": False
        }, cookies=cookies)

    # 9. Finish adaptive test and verify report
    t_finish_res = client.post(f"/api/tests/{test_id}/finish", cookies=cookies)
    assert t_finish_res.status_code == 200, t_finish_res.text
    assert t_finish_res.json()["xp_earned"] > 0
    assert "recommended_next" in t_finish_res.json()

