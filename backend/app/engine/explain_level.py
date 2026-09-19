def determine_explanation_level(mastery: float) -> str:
    """
    Selects explanation depth based on student mastery:
    - mastery < 40 -> beginner (simple language, analogies, step-by-step)
    - 40 <= mastery <= 75 -> intermediate (examples, applications)
    - mastery > 75 -> advanced (deeper reasoning, edge cases, challenge problems)
    """
    if mastery < 40.0:
        return "beginner"
    elif mastery <= 75.0:
        return "intermediate"
    else:
        return "advanced"
