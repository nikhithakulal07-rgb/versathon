# LearnQuest ⚡

> **Adaptive, AI-Powered, Gamified Learning Platform MVP**  
> *Built with React 18, Vite, TypeScript, Tailwind CSS, FastAPI, SQLite / SQLAlchemy 2.0, and Google Gemini AI.*

---

## 📖 Table of Contents
1. [Product Overview](#1-product-overview)
2. [Key Architecture & Principles](#2-key-architecture--principles)
3. [The Three Learning Modes](#3-the-three-learning-modes)
4. [Unified Adaptive Engine](#4-unified-adaptive-engine)
5. [Interactive Visual Models](#5-interactive-visual-models)
6. [Demo Mode & Live AI Mode](#6-demo-mode--live-ai-mode)
7. [Getting Started Locally](#7-getting-started-locally)
8. [Configuring Google Gemini AI](#8-configuring-google-gemini-ai)
9. [Running Verification & Secret Scans](#9-running-verification--secret-scans)
10. [API Reference Summary](#10-api-reference-summary)

---

## 1. Product Overview

LearnQuest dynamically changes each student's learning path according to their performance:
- **Calibrates Mastery:** Uses Item Response Theory (IRT) $\theta$ ability tracking with confidence shrinkage.
- **Adapts Question Difficulty:** Targets the Zone of Proximal Development ($p \approx 0.70$) with hysteresis stepping to prevent jarring difficulty swings.
- **Identifies Weak Areas:** Detects repeated misconceptions and inserts remedial explanation steps.
- **Leitner Flashcards & Active Revision:** Swiping left on cards queues them into a "Revision Required" deck featuring concept re-explanations and mini-practice drills.
- **Gamified Progression:** Level scaling ($100 \times \text{level}^{1.5}$), daily challenge streaks, gold coins, quests, and privacy-first leaderboards.

---

## 2. Key Architecture & Principles

```
  ┌────────────────────────────────────────────────────────┐
  │                 LearnQuest Frontend                    │
  │     (React 18 + Vite + TypeScript + Tailwind CSS)      │
  │   School Mode  •  Open Learning Chat  •  Game Mode     │
  └───────────────────────────┬────────────────────────────┘
                              │ All requests to /api/...
                              ▼ (No client-side keys/secrets)
  ┌────────────────────────────────────────────────────────┐
  │                 FastAPI Backend                        │
  │  ├── app/engine/   (Pure, deterministic adaptive core) │
  │  ├── app/ai/       (Gemini Provider + Offline Mock)    │
  │  ├── app/routers/  (Pydantic validated REST endpoints) │
  │  └── app/models/   (SQLAlchemy 2.0 SQLite schema)      │
  └────────────────────────────────────────────────────────┘
```

1. **Zero Secrets in Frontend:** API keys exist ONLY on the backend in environment variables. Vite proxies `/api` to `http://localhost:8000`.
2. **One Engine, Three Modes:** All three interfaces share the same database models and learning state machine (`/app/engine/`).
3. **Demo Mode Parity:** Works 100% offline out-of-the-box with 6 seeded vertical slices, 6 demo packs, and a scripted AI tutor.

---

## 3. The Three Learning Modes

### 🏫 School Mode
- Curriculum drill-down: **Class (5–12) → Board (CBSE, ICSE, State) → Stream (11–12) → Subject → Chapter → Topic**.
- **Topic Hub:** Displays overall mastery rings, subtopic status badges (🟢 Strong, 🟡 Needs Practice, 🔴 Weak), and the 5-step learning pipeline.
- Fully seeded vertical slices:
  1. *Class 10 CBSE Science (Physics):* **Electricity & Circuits** (Current, Voltage, Resistance, Ohm's Law, Series/Parallel).
  2. *Class 10 CBSE Mathematics:* **Quadratic Equations**.
  3. *Class 8 Science:* **Cell Structure & Microorganisms**.
  4. *Class 12 Physics:* **Electrostatics & Capacitance**.
  5. *Class 11 Commerce:* **Accounting Fundamentals**.

### 💬 Open Learning Mode
- Conversational chat interface for any topic with quick suggestion chips (Python Functions, Data Structures, Machine Learning, Operating Systems, Thermodynamics, etc.).
- The AI / demo pack structures topics on-demand and renders in-chat interactive cards (Diagnostic cards, explanation cards, flashcards, test launchers).
- Contextual AI Tutor responds to natural student queries: *"Explain this again"*, *"Make it easier"*, *"Give me an example"*, *"Explain using an analogy"*, *"Why is my answer wrong?"*, *"Test me"*.

### 🎮 Game Mode ("Skyforge Academy")
- Original, non-violent sci-fantasy expedition realm across an interactive SVG World Map:
  - ⚡ *Floating Isles of Ohm* (Electricity)
  - 📐 *Matrix Highlands* (Quadratics)
  - 🧬 *Bio-Nexus Spires* (Cell Biology)
  - 🐍 *Python Citadel* (Functions)
- **5-Stage Expedition per Mission:**
  - Stage 1: **SCOUT** (Diagnostic Calibration)
  - Stage 2: **TRAINING** (Concept Explanation & Visual)
  - Stage 3: **INTEL** (Leitner Flashcards)
  - Stage 4: **CHALLENGE** (Adaptive MCQs)
  - Stage 5: **BOSS CHALLENGE** (Knowledge Guardian Final Trial)
- Earn gold coins 🪙 to unlock cosmetic avatar frames, titles, and realm themes in the **Cosmetics Shop**.

---

## 4. Unified Adaptive Engine

Located in `backend/app/engine/`:
- `difficulty.py`: Logit conversion $b = (d - 3) \times 0.9$, target success probability $p \approx 0.70$, and hysteresis stepping.
- `mastery.py`: Elo/IRT update $\theta \leftarrow \theta + K \cdot (\text{outcome} - p)$, confidence shrinkage $\text{confidence} = \min(1, \text{attempts}/6)$.
- `selector.py`: Balanced test question selector (60% weak concepts, 40% reinforcement).
- `flashcards.py`: Leitner box transitions (1–3), interval scheduling, mastery nudges (-3 on revise, +2 on know).
- `recommender.py`: Explainable multi-factor formula:
  $$\text{Priority} = 0.45(1 - M) + 0.20(\text{Mistakes}) + 0.15(\text{Flashcards}) + 0.10(\text{Forgetting}) + 0.10(\text{Prereqs})$$
- `xp.py` & `badges.py`: Server-side XP calculation, diminishing returns, level scaling ($100 \times \text{level}^{1.5}$), and achievement triggers.

---

## 5. Interactive Visual Models

LearnQuest includes a rich library of interactive, parameterized React visual components (SVG + CSS + Framer Motion):
1. `CircuitDiagram`: Live Ohm's Law circuit simulator with voltage/resistance sliders, animated electron flow, voltmeter, and live math readout.
2. `FunctionMachine`: Interactive function machine ($x \to f(x)$) with live evaluation animations and evaluation logs.
3. `CallStack`: LIFO stack frame memory visualizer with push/pop controls and nested execution tracing.
4. `ArrayVisualizer`: Array memory indexing with linear & binary search pointer animations.
5. `GraphPlotter`: Coordinate plane parabola plotter for quadratic equations with vertex and real roots markers.
6. `FlowChart`: Step-by-step logic decision pathway.
7. `StepThroughDiagram`: Multi-step conceptual progression with auto-play and step dots.
8. `ProcessTimeline`: Chronological milestone evolutions.
9. `BeforeAfterCompare`: Side-by-side conceptual comparison switcher.

---

## 6. Demo Mode & Live AI Mode

- **Demo Mode (`DEMO_MODE=auto` / `true`):** Active when `AI_API_KEY` is not provided. Provides deterministic, factually verified curriculum content, 6 rich demo packs, and a scripted conversational tutor.
- **Live AI Mode:** Set `AI_API_KEY` in `backend/.env`. Custom topics, dynamically generated questions, multi-level explanations, and tutor chat stream directly from Gemini.

---

## 7. Getting Started Locally

### Prerequisites
- Python 3.11+
- Node.js 18+ & npm

### Backend Setup
```bash
cd backend
python -m venv .venv

# On Windows:
.venv\Scripts\activate
# On Linux / macOS:
# source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env

# Seed database with vertical slices & demo users
python -m app.seed.seed

# Run backend dev server
python -m uvicorn app.main:app --reload --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Visit **`http://localhost:5173`** in your browser!

### Instant Pre-seeded Demo Accounts
- **Alex (Class 10 Beginner):** `alex_learner` / `Password123!`
- **Priya (College Intermediate):** `priya_sharma` / `Password123!`
- **Rahul (Engineer Advanced):** `rahul_dev` / `Password123!`

---

## 8. Configuring Google Gemini AI

1. Get a Gemini API key from [Google AI Studio](https://aistudio.google.com/).
2. Open `backend/.env` and configure:
   ```env
   AI_PROVIDER=gemini
   AI_API_KEY=your_gemini_api_key_here
   AI_MODEL=gemini-1.5-flash
   DEMO_MODE=auto
   ```
3. Test your AI connection:
   ```bash
   python backend/scripts/test_ai.py
   ```

---

## 9. Running Verification & Secret Scans

### Backend Unit & Integration Tests (17 tests)
```bash
cd backend
python -m pytest tests/ -v
```

### End-to-End Flow Live Verification (11 steps)
```bash
python backend/scripts/verify_e2e_flows.py
```

### Security & Secret Leak Scanner
```bash
python scripts/check_no_secrets.py
# Or on Linux/macOS:
# bash scripts/check_no_secrets.sh
```

---

## 10. API Reference Summary

All endpoints are hosted under `/api`:
- **Auth & Profile:** `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET/PATCH /api/auth/me`, `POST /api/auth/me/onboarding`, `POST /api/auth/forgot-password`.
- **Meta:** `GET /api/meta`, `GET /api/ai/health`.
- **Curriculum:** `GET /api/curriculum/classes`, `/boards`, `/streams`, `/subjects`, `/chapters`, `/topics`, `GET /api/curriculum/topics/{id}`.
- **Open Learning:** `POST /api/open/topics`, `GET /api/open/topics`.
- **Diagnostic:** `POST /api/diagnostic/start`, `GET /api/diagnostic/{id}/next`, `POST /api/diagnostic/{id}/answer`, `POST /api/diagnostic/{id}/finish`.
- **Lessons & Visuals:** `GET /api/learn/explanations?subtopic_id=...&level=...`.
- **Flashcards:** `GET /api/subtopics/{id}/flashcards`, `POST /api/flashcards/{id}/respond`, `GET /api/revision/required`.
- **Adaptive Tests:** `POST /api/tests/start`, `GET /api/tests/{id}/next`, `POST /api/tests/{id}/answer`, `POST /api/tests/{id}/finish`, `GET /api/tests/{id}/report`.
- **Gamification & Leaderboard:** `GET /api/xp`, `GET /api/streak`, `GET /api/badges`, `GET /api/daily-challenge`, `GET /api/leaderboard`.
- **Game Mode:** `GET /api/game/profile`, `GET /api/game/missions`, `POST /api/game/missions/{id}/complete-stage`, `GET /api/game/shop`, `POST /api/game/shop/buy`.
- **AI Tutor:** `POST /api/ai/tutor`.

---

## License
MIT License. Built for the E1 Hackathon.
>>>>>>> 955e6a3 (first frontend and back-end commit)
