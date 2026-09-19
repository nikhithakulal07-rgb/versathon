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

def test_curriculum_drilldown():
    # 1. Classes
    res = client.get("/api/curriculum/classes")
    assert res.status_code == 200
    classes = res.json()
    assert len(classes) >= 8

    # 2. Boards
    res_b = client.get("/api/curriculum/boards")
    assert res_b.status_code == 200
    boards = res_b.json()
    assert any(b["code"] == "CBSE" for b in boards)

    # 3. Topics
    res_t = client.get("/api/curriculum/topics")
    assert res_t.status_code == 200
    topics = res_t.json()
    assert len(topics) >= 1

    topic_id = topics[0]["id"]
    res_td = client.get(f"/api/curriculum/topics/{topic_id}")
    assert res_td.status_code == 200
    assert len(res_td.json()["subtopics"]) > 0

def test_diagnostic_flow():
    cookies = get_auth_cookies()
    topics = client.get("/api/curriculum/topics").json()
    topic_id = topics[0]["id"]

    # Start diagnostic
    res_start = client.post("/api/diagnostic/start", json={"topic_id": topic_id}, cookies=cookies)
    assert res_start.status_code == 200
    diag_id = res_start.json()["diagnostic_id"]

    # Get first question
    res_q = client.get(f"/api/diagnostic/{diag_id}/next", cookies=cookies)
    assert res_q.status_code == 200
    q_data = res_q.json()["question"]
    assert q_data is not None

    # Submit answer
    res_ans = client.post(
        f"/api/diagnostic/{diag_id}/answer",
        json={
            "question_id": q_data["id"],
            "chosen_index": 0,
            "time_taken_seconds": 25.0
        },
        cookies=cookies
    )
    assert res_ans.status_code == 200
    assert "is_correct" in res_ans.json()
    assert "explanation" in res_ans.json()

    # Finish diagnostic
    res_fin = client.post(f"/api/diagnostic/{diag_id}/finish", cookies=cookies)
    assert res_fin.status_code == 200
    assert "xp_earned" in res_fin.json()
    assert res_fin.json()["xp_earned"] >= 30

def test_flashcard_and_revision_flow():
    cookies = get_auth_cookies()
    topics = client.get("/api/curriculum/topics").json()
    topic_id = topics[0]["id"]
    topic_details = client.get(f"/api/curriculum/topics/{topic_id}").json()
    subtopic_id = topic_details["subtopics"][0]["id"]


    # Get flashcards
    res_f = client.get(f"/api/subtopics/{subtopic_id}/flashcards", cookies=cookies)
    assert res_f.status_code == 200
    fcs = res_f.json()
    assert len(fcs) > 0

    fc_id = fcs[0]["id"]

    # Swipe left (revision needed)
    res_swipe = client.post(
        f"/api/flashcards/{fc_id}/respond",
        json={"flashcard_id": fc_id, "response": "revise"},
        cookies=cookies
    )
    assert res_swipe.status_code == 200
    assert res_swipe.json()["new_box"] == 1

    # Check Revision Required queue
    res_rev = client.get("/api/revision/required", cookies=cookies)
    assert res_rev.status_code == 200
    assert res_rev.json()["total_cards"] >= 1
    assert any(c["flashcard_id"] == fc_id for c in res_rev.json()["revision_queue"])

def test_adaptive_test_and_report_card():
    cookies = get_auth_cookies()
    topics = client.get("/api/curriculum/topics").json()
    topic_id = topics[0]["id"]

    # Start test
    res_start = client.post("/api/tests/start", json={"topic_id": topic_id, "type": "adaptive"}, cookies=cookies)
    assert res_start.status_code == 200
    test_id = res_start.json()["test_id"]

    # Fetch and answer 3 questions
    for _ in range(3):
        res_next = client.get(f"/api/tests/{test_id}/next", cookies=cookies)
        q = res_next.json().get("question")
        if not q:
            break
        client.post(
            f"/api/tests/{test_id}/answer",
            json={"question_id": q["id"], "chosen_index": 0, "time_taken_seconds": 20.0},
            cookies=cookies
        )

    # Finish test
    res_fin = client.post(f"/api/tests/{test_id}/finish", cookies=cookies)
    assert res_fin.status_code == 200
    assert "accuracy" in res_fin.json()
    assert "recommended_next" in res_fin.json()

    # Get Report Card
    res_rep = client.get(f"/api/tests/{test_id}/report", cookies=cookies)
    assert res_rep.status_code == 200
    rep = res_rep.json()
    assert rep["test_id"] == test_id
    assert "accuracy" in rep
    assert len(rep["answers_review"]) > 0
