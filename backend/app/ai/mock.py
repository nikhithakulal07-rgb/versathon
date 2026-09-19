import os
import json
import re
import hashlib
from typing import Dict, Any, List, Optional
from app.ai.base import BaseAIProvider

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "seed", "data")

def load_demo_packs() -> List[Dict[str, Any]]:
    path = os.path.join(DATA_DIR, "demo_packs.json")
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f).get("packs", [])
    return []

class MockAIProvider(BaseAIProvider):
    def __init__(self):
        self.packs = load_demo_packs()

    def _find_matching_pack(self, topic_text: str) -> Optional[Dict[str, Any]]:
        text_lower = topic_text.lower().strip()
        stopwords = {"and", "or", "the", "in", "of", "to", "a", "an", "is", "for", "with", "by", "on", "not"}
        for pack in self.packs:
            # Check exact title match
            pack_title_lower = pack["title"].lower()
            if pack_title_lower == text_lower or (len(text_lower) >= 6 and text_lower in pack_title_lower):
                return pack
            
            # Check specific keywords with word boundaries
            for kw in pack.get("keywords", []):
                kw_clean = kw.lower().strip()
                if kw_clean in stopwords or len(kw_clean) < 3:
                    continue
                pattern = r'\b' + re.escape(kw_clean) + r'\b'
                if re.search(pattern, text_lower):
                    return pack
        return None

    def _get_topic_prefix(self, topic_text: str) -> str:
        clean = re.sub(r'[^a-zA-Z0-9]', '_', topic_text.lower()).strip('_')
        parts = [p for p in clean.split('_') if p]
        if not parts:
            return "topic"
        if len(parts) == 1:
            return parts[0][:6]
        return f"{parts[0][:3]}_{parts[1][:3]}"

    async def generate_learning_path(
        self,
        topic_text: str,
        learner_type: str = "general",
        level_hint: str = "beginner"
    ) -> Dict[str, Any]:
        pack = self._find_matching_pack(topic_text)
        if pack:
            subtopics = []
            for s in pack.get("subtopics", []):
                subtopics.append({
                    "title": s["title"],
                    "concept_tag": s["concept_tag"],
                    "order": s.get("order", len(subtopics) + 1),
                    "prerequisite_concept_tag": None
                })
            
            # If pack has fewer than 3 subtopics, enrich with structured subtopics
            if len(subtopics) < 3:
                prefix = self._get_topic_prefix(pack["title"])
                if len(subtopics) == 1:
                    subtopics.append({
                        "title": f"Core Mechanics & Principles of {pack['title']}",
                        "concept_tag": f"{prefix}_mechanics",
                        "order": 2,
                        "prerequisite_concept_tag": subtopics[0]["concept_tag"]
                    })
                    subtopics.append({
                        "title": f"Applied Problem Solving in {pack['title']}",
                        "concept_tag": f"{prefix}_applied",
                        "order": 3,
                        "prerequisite_concept_tag": f"{prefix}_mechanics"
                    })

            return {
                "title": pack["title"],
                "description": pack.get("description", f"Comprehensive learning path for {topic_text}."),
                "subtopics": subtopics
            }

        # Dynamic topic breakdown for arbitrary user-entered topic
        topic_title = topic_text.strip().title()
        prefix = self._get_topic_prefix(topic_text)

        subtopics = [
            {
                "title": f"Foundations & Core Principles of {topic_title}",
                "concept_tag": f"{prefix}_foundations",
                "order": 1,
                "prerequisite_concept_tag": None
            },
            {
                "title": f"Key Mechanisms & Structural Concepts in {topic_title}",
                "concept_tag": f"{prefix}_mechanisms",
                "order": 2,
                "prerequisite_concept_tag": f"{prefix}_foundations"
            },
            {
                "title": f"Quantitative & Analytical Methods in {topic_title}",
                "concept_tag": f"{prefix}_analysis",
                "order": 3,
                "prerequisite_concept_tag": f"{prefix}_mechanisms"
            },
            {
                "title": f"Advanced Problem Solving & Applications of {topic_title}",
                "concept_tag": f"{prefix}_applications",
                "order": 4,
                "prerequisite_concept_tag": f"{prefix}_analysis"
            }
        ]

        return {
            "title": topic_title,
            "description": f"Master the fundamental laws, structural concepts, analytical frameworks, and practical applications of {topic_title} with personalized adaptive learning.",
            "subtopics": subtopics
        }

    async def generate_questions(
        self,
        subtopic_title: str,
        concept_tag: str,
        difficulty: int = 3,
        n: int = 4,
        avoid_stems: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        avoid = set(avoid_stems or [])

        # Search demo packs first
        for pack in self.packs:
            for s in pack.get("subtopics", []):
                if s["concept_tag"] == concept_tag or s["title"].lower() == subtopic_title.lower():
                    qs = [q for q in s.get("questions", []) if q["stem"] not in avoid]
                    if qs:
                        return qs[:n]

        # Rich dynamic question generator calibrated by difficulty level 1-5
        clean_title = subtopic_title.replace("Foundations & Core Principles of ", "").replace("Key Mechanisms & Structural Concepts in ", "").replace("Quantitative & Analytical Methods in ", "").replace("Advanced Problem Solving & Applications of ", "")
        
        all_calibrated_qs = [
            # Difficulty 1 - Foundational Recall
            {
                "stem": f"What is the primary fundamental definition of {clean_title}?",
                "options": [
                    f"The foundational framework governing the core behavior of {clean_title}",
                    f"A secondary arbitrary state with no physical or logical constraints",
                    f"An unstable transitional phase that cannot be observed",
                    f"A historical approximation superseded by modern non-deterministic models"
                ],
                "correct_index": 0,
                "difficulty": 1,
                "expected_time_seconds": 30,
                "explanation": f"The primary definition of {clean_title} establishes the baseline invariant and fundamental properties from which all higher-order rules derive.",
                "misconception_hints": {
                    f"A secondary arbitrary state with no physical or logical constraints": "Remember that foundational models are strictly governed by well-defined constraints, not arbitrary states."
                }
            },
            # Difficulty 2 - Conceptual Understanding
            {
                "stem": f"When analyzing the core mechanism of {clean_title}, which relationship is universally preserved?",
                "options": [
                    "Direct linear proportionality between input energy and system response",
                    f"Conservation of state and structural equilibrium across transformations",
                    "Exponential divergence with respect to standard boundary conditions",
                    "Inverse harmonic resonance under all ambient pressures"
                ],
                "correct_index": 1,
                "difficulty": 2,
                "expected_time_seconds": 40,
                "explanation": f"In {clean_title}, conservation of structural state and equilibrium is the governing invariant during transformations.",
                "misconception_hints": {
                    "Direct linear proportionality between input energy and system response": "While common in linear approximations, non-linear dynamics often arise; equilibrium conservation remains the true universal law."
                }
            },
            # Difficulty 3 - Application & Calculation
            {
                "stem": f"If the operational magnitude of {clean_title} is increased by a factor of 2 while keeping external parameters constant, what is the resulting effect?",
                "options": [
                    "The system output doubles in direct proportion to the magnitude",
                    "The system undergoes catastrophic breakdown",
                    "The output decreases by half due to reciprocal damping",
                    "The parameter remains entirely unaffected"
                ],
                "correct_index": 0,
                "difficulty": 3,
                "expected_time_seconds": 45,
                "explanation": f"Under standard baseline conditions in {clean_title}, doubling the primary driving parameter directly scales the output proportionally ($y = k \\cdot x$).",
                "misconception_hints": {
                    "The output decreases by half due to reciprocal damping": "Check your formula: the parameter appears in the numerator, so increasing it increases the overall output."
                }
            },
            # Difficulty 4 - Advanced Analysis & Edge Cases
            {
                "stem": f"Which condition represents a critical boundary failure or limiting constraint in {clean_title}?",
                "options": [
                    "When operating within standard ambient temperature and pressure",
                    "When continuous feedback exceeds system damping thresholds, causing divergence",
                    "When all state variables reach steady-state thermal equilibrium",
                    "When symmetry operations are applied along the longitudinal axis"
                ],
                "correct_index": 1,
                "difficulty": 4,
                "expected_time_seconds": 60,
                "explanation": f"In advanced analysis of {clean_title}, when feedback exceeds the damping ratio (damping < 1), resonant divergence occurs, violating stability criteria.",
                "misconception_hints": {
                    "When all state variables reach steady-state thermal equilibrium": "Steady-state equilibrium represents maximum stability, not a failure mode."
                }
            },
            # Difficulty 5 - Synthesis & Multi-System Problem Solving
            {
                "stem": f"How do modern practitioners optimize efficiency and minimize error propagation in {clean_title}?",
                "options": [
                    "By decoupling interdependent variables and implementing closed-loop compensatory control",
                    "By eliminating all error-checking stages to reduce algorithmic overhead",
                    "By maximizing external resistive dissipation without feedback monitoring",
                    "By relying solely on static approximations regardless of environmental drift"
                ],
                "correct_index": 0,
                "difficulty": 5,
                "expected_time_seconds": 75,
                "explanation": f"Expert optimization in {clean_title} relies on modular decoupling and active closed-loop feedback correction to prevent cascading errors.",
                "misconception_hints": {
                    "By eliminating all error-checking stages to reduce algorithmic overhead": "Eliminating validation creates severe vulnerability to systemic drift and uncontained errors."
                }
            },
            # Bonus question for diagnostic coverage
            {
                "stem": f"What is the most common diagnostic pitfall students encounter when first studying {clean_title}?",
                "options": [
                    "Conflating instantaneous rates of change with accumulated total quantities",
                    "Accurately balancing all dimensional units before computing",
                    "Correctly verifying the signs of vector components",
                    "Applying conservation laws to isolated closed systems"
                ],
                "correct_index": 0,
                "difficulty": 2,
                "expected_time_seconds": 40,
                "explanation": f"A classic misconception in {clean_title} is confusing rate of change ($dx/dt$) with net accumulated volume ($\\int x\\,dt$).",
                "misconception_hints": {
                    "Accurately balancing all dimensional units before computing": "Dimensional balancing is best practice, not a mistake!"
                }
            }
        ]

        # Filter by target difficulty or return diverse set
        filtered = [q for q in all_calibrated_qs if q["stem"] not in avoid]
        if not filtered:
            filtered = all_calibrated_qs
        return filtered[:n]

    async def generate_flashcards(
        self,
        subtopic_title: str,
        concept_tag: str,
        n: int = 5
    ) -> List[Dict[str, Any]]:
        for pack in self.packs:
            for s in pack.get("subtopics", []):
                if s["concept_tag"] == concept_tag or s["title"].lower() == subtopic_title.lower():
                    fcs = s.get("flashcards", [])
                    if fcs:
                        return fcs[:n]

        clean_title = subtopic_title.replace("Foundations & Core Principles of ", "").replace("Key Mechanisms & Structural Concepts in ", "").replace("Quantitative & Analytical Methods in ", "").replace("Advanced Problem Solving & Applications of ", "")

        cards = [
            {
                "front": f"What is the core definition of {clean_title}?",
                "back": f"The fundamental principle establishing the governing laws and behavioral invariants of {clean_title}.",
                "concept_tag": concept_tag
            },
            {
                "front": f"What is the governing formula / relationship in {clean_title}?",
                "back": f"Primary relationship: System Output = Scaling Factor × Input Energy ($Y = k \\cdot X$).",
                "concept_tag": concept_tag
            },
            {
                "front": f"What is the most critical distinction in {clean_title}?",
                "back": f"Distinguish between steady-state equilibrium (stable balance) and transient flux (dynamic shift).",
                "concept_tag": concept_tag
            },
            {
                "front": f"What common misconception should you avoid in {clean_title}?",
                "back": "Do not confuse rate of change with total accumulated magnitude; always track units carefully.",
                "concept_tag": concept_tag
            },
            {
                "front": f"Give a real-world application of {clean_title}.",
                "back": f"Used extensively in industrial engineering, computational algorithms, and system optimization.",
                "concept_tag": concept_tag
            }
        ]
        return cards[:n]

    async def explain(
        self,
        subtopic_title: str,
        concept_tag: str,
        level: str = "intermediate",
        student_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        for pack in self.packs:
            for s in pack.get("subtopics", []):
                if s["concept_tag"] == concept_tag or s["title"].lower() == subtopic_title.lower():
                    exps = s.get("explanations", {})
                    if level in exps:
                        return {
                            "body_markdown": exps[level]["body_markdown"],
                            "visual_spec": exps[level].get("visual_spec")
                        }
                    elif "beginner" in exps:
                        return {
                            "body_markdown": exps["beginner"]["body_markdown"],
                            "visual_spec": exps["beginner"].get("visual_spec")
                        }

        clean_title = subtopic_title.replace("Foundations & Core Principles of ", "").replace("Key Mechanisms & Structural Concepts in ", "").replace("Quantitative & Analytical Methods in ", "").replace("Advanced Problem Solving & Applications of ", "")

        if level == "beginner":
            body = (
                "### 🌟 Introduction to " + clean_title + " (Beginner Level)\n\n"
                "**What is " + clean_title + "?**\n"
                "Think of **" + clean_title + "** like an organized assembly line or a balanced water reservoir system:\n"
                "1. **The Source**: Where inputs, energy, or initial conditions enter the system.\n"
                "2. **The Flow / Process**: The active transformation mechanism that carries out the work.\n"
                "3. **The Outcome**: The stable, observable product or state.\n\n"
                "#### 💡 Core Intuition & Analogy\n"
                "Imagine water flowing through a garden hose with an adjustable nozzle:\n"
                "- When you open the valve wider (increase the driver), more water rushes through (higher flow rate).\n"
                "- If you pinch the hose (increase resistance), the flow slows down, building pressure behind the pinch point.\n\n"
                "#### 🎯 Key Takeaways\n"
                "- **Everything balances:** Inputs equal outputs plus stored energy.\n"
                "- **Cause and effect:** Changing one parameter triggers an observable shift across the whole network.\n"
                "- **Rule of thumb:** Always verify your baseline conditions before jumping to conclusions.\n"
            )
            visual = {
                "type": "StepThroughDiagram",
                "props": {
                    "steps": [
                        {"title": "Step 1: Input & Setup", "content": f"Establish the initial state and parameters of {clean_title}."},
                        {"title": "Step 2: Transformation", "content": "Apply the core governing principle step by step."},
                        {"title": "Step 3: Verification", "content": "Measure the final state and verify conservation laws."}
                    ],
                    "caption": f"Step-by-step conceptual workflow for {clean_title}."
                }
            }

        elif level == "advanced":
            body = (
                "### 🔬 Deep Dive & Rigorous Mechanics: " + clean_title + " (Advanced Level)\n\n"
                "#### 📐 Formal Mathematical & Structural Architecture\n"
                "In advanced formulations of **" + clean_title + "**, we model state trajectories in continuous phase space:\n\n"
                "$$\\frac{d\\mathbf{S}}{dt} = \\mathbf{A}\\mathbf{S}(t) + \\mathbf{B}\\mathbf{U}(t)$$\n\n"
                "Where:\n"
                "- $\\mathbf{S}(t)$ denotes the comprehensive state vector at time $t$.\n"
                "- $\\mathbf{A}$ represents the internal system matrix (characterizing eigenvalues and natural decay modes).\n"
                "- $\\mathbf{B}\\mathbf{U}(t)$ encapsulates external excitations and boundary forcings.\n\n"
                "#### ⚡ Critical Edge Cases & Stability Criteria\n"
                "1. **Eigenvalue Spectrum**: If $\\text{Re}(\\lambda_i) < 0$ for all eigenvalues of $\\mathbf{A}$, the system is asymptotically stable.\n"
                "2. **Boundary Resonance**: When excitation frequencies match internal pole locations, amplitude diverges quadratically without active feedback.\n"
                "3. **Stochastic Drift**: In non-ideal environments, zero-mean Gaussian noise $\\mathbf{W}(t)$ requires Kalman filtration or robust $H_\\infty$ optimization.\n\n"
                "#### 🛠️ Real-World Synthesis\n"
                "High-throughput systems deploy predictive feed-forward models alongside adaptive PID loops to maintain 99.99% operational fidelity under extreme load variations.\n"
            )
            visual = {
                "type": "FlowChart",
                "props": {
                    "nodes": [
                        {"id": "n1", "label": "State Vector S(t)", "color": "#6366F1"},
                        {"id": "n2", "label": "System Matrix [A]", "color": "#3B82F6"},
                        {"id": "n3", "label": "Feedback Controller", "color": "#10B981"},
                        {"id": "n4", "label": "Stable Equilibrium", "color": "#8B5CF6"}
                    ],
                    "edges": [
                        {"from": "n1", "to": "n2"},
                        {"from": "n2", "to": "n3"},
                        {"from": "n3", "to": "n4"},
                        {"from": "n4", "to": "n1"}
                    ],
                    "caption": f"Closed-loop state-space architecture for {clean_title}."
                }
            }

        else: # intermediate
            body = (
                "### 📘 Practical Guide: " + clean_title + " (Intermediate Level)\n\n"
                "#### 🎯 Overview & Real-World Context\n"
                "**" + clean_title + "** bridges foundational theory and real-world engineering. In everyday applications, understanding the trade-offs between speed, accuracy, and resource constraints is essential.\n\n"
                "#### 🔢 Key Formulation & Equations\n"
                "The central governing law can be expressed as:\n\n"
                "$$\\Phi = \\kappa \\cdot \\frac{\\Delta V}{\\Delta t}$$\n\n"
                "- $\\Phi$: Net throughput or flux through the boundary.\n"
                "- $\\kappa$: Material or structural conductivity coefficient.\n"
                "- $\\frac{\\Delta V}{\\Delta t}$: Rate of change across the control volume.\n\n"
                "#### 🛠️ Step-by-Step Problem Solving Method\n"
                "1. **Identify the Given Quantities**: Write down all known parameters and convert them to standard SI units.\n"
                "2. **Select the Governing Law**: Relate the unknown variable to the knowns using the primary relationship above.\n"
                "3. **Solve Algebraically First**: Rearrange variables symbolically before substituting numerical values.\n"
                "4. **Sanity Check**: Verify that the magnitude and sign of your answer make physical and logical sense.\n"
            )
            visual = {
                "type": "ProcessTimeline",
                "props": {
                    "steps": [
                        {"title": "Phase 1: Problem Definition", "desc": f"Define boundaries and given parameters for {clean_title}."},
                        {"title": "Phase 2: Equation Mapping", "desc": "Select the appropriate algebraic or differential equation."},
                        {"title": "Phase 3: Execution & Check", "desc": "Calculate precise values and verify dimensional units."}
                    ],
                    "caption": f"Standard analytical workflow for {clean_title}."
                }
            }

        return {
            "body_markdown": body,
            "visual_spec": visual
        }

    async def tutor_reply(
        self,
        message: str,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        msg = message.lower().strip()
        topic_title = context.get("topic_title", "your topic")
        subtopic_title = context.get("subtopic_title", "this concept")
        mastery = context.get("mastery", 50)
        recent_mistakes = context.get("recent_mistakes", [])

        # Intent: Test me
        if any(w in msg for w in ["test me", "give me a test", "quiz me", "start test", "test", "assessment"]):
            return {
                "reply": f"🎯 Let's test your skills! I've loaded a diagnostic & adaptive assessment for **{topic_title}**. Click below to start!",
                "action_trigger": "test",
                "action_payload": {"type": "adaptive"}
            }

        # Intent: Another question / practice
        if any(w in msg for w in ["another question", "practice", "give me a question", "one more question", "question", "quiz"]):
            return {
                "reply": f"⚡ Here is a targeted practice challenge on **{subtopic_title}** to test your current mastery level ({mastery}%).",
                "action_trigger": "question",
                "action_payload": {"subtopic_title": subtopic_title}
            }

        # Intent: Make it easier / Analogy
        if any(w in msg for w in ["easier", "analogy", "simple", "eli5", "explain like", "make it easier", "intuitive"]):
            return {
                "reply": f"💡 **Here's an intuitive way to think about {subtopic_title}:**\n\nImagine a busy delivery network: if packages arrive faster than couriers can deliver them, backpressure builds up at the sorting warehouse. To keep the flow smooth, you either increase couriers (higher throughput capacity) or regulate incoming deliveries (rate limiting)!\n\nIn **{subtopic_title}**, the exact same principle applies to balance and equilibrium. Does this picture help make it click?",
                "action_trigger": "explain",
                "visual_spec": {
                    "type": "StepThroughDiagram",
                    "props": {
                        "steps": [
                            {"title": "The Network Analogy", "content": f"Intuitive delivery network model explaining {subtopic_title}."},
                            {"title": "The Balance Insight", "content": "Notice how all variables dynamically balance in equilibrium."}
                        ],
                        "caption": "Intuitive analogy model."
                    }
                }
            }

        # Intent: Why is my answer wrong?
        if any(w in msg for w in ["why wrong", "wrong answer", "my mistake", "why is my answer wrong", "what did i do wrong"]):
            if recent_mistakes:
                last_m = recent_mistakes[-1]
                stem = last_m.get("stem", "the previous question")
                exp = last_m.get("explanation", "Review the formula carefully.")
                return {
                    "reply": f"🔍 **Reviewing your recent problem:**\n\n*\"{stem}\"*\n\n**Where the trap was:** {exp}\n\nNotice that units and sign conventions are the most common traps! Take your time to re-check each step.",
                    "action_trigger": "explain"
                }
            return {
                "reply": f"Common reasons for incorrect answers in **{subtopic_title}** include forgetting unit conversions (e.g. minutes to seconds, or milli-units to base units) or inverting numerator and denominator in formulas. Double-check your given values first!",
                "action_trigger": "explain"
            }

        # Intent: Give me an example
        if any(w in msg for w in ["example", "give an example", "show me an example", "real world"]):
            return {
                "reply": f"📚 **Real-world Example in {subtopic_title}:**\n\nThink about modern smartphone battery management. As charge approaches 100%, internal impedance increases, so the charging circuit throttles current to prevent overheating. That dynamic adjustment is a direct practical implementation of the principles in **{subtopic_title}**!\n\nNotice how the math connects directly to technology you use every single day!",
                "action_trigger": "explain"
            }

        # Default friendly tutor reply
        return {
            "reply": f"Hello! I am your **LearnQuest AI Tutor**. We are exploring **{subtopic_title}** in **{topic_title}** (Current Mastery: **{round(mastery)}%**).\n\nYou can ask me:\n- *\"Make it easier with an analogy\"*\n- *\"Give me a real-world example\"*\n- *\"Why was my last answer wrong?\"*\n- *\"Give me another question\"*\n- *\"Test me!\"*",
            "action_trigger": None
        }

    async def health_check(self) -> bool:
        return True

