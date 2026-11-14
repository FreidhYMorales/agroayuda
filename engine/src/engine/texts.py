"""One-line Spanish texts for each option (Guatemala, usted). Copy approved in story 15."""

from contracts import Criteria, Priorities

# Tie order from docs/spec.md: water > soil > income > risk.
PRIORITY_ORDER = ("water", "soil", "income", "risk")
PRIORITY_LABEL_ES = {
    "water": "cuidar el agua",
    "soil": "cuidar el suelo",
    "income": "el ingreso",
    "risk": "bajar el riesgo",
}


def top_priority(priorities: Priorities) -> str:
    """The highest priority; max() keeps the first in PRIORITY_ORDER on a tie."""
    weights = priorities.model_dump()
    return max(PRIORITY_ORDER, key=lambda name: weights[name])


def reason_line(priorities: Priorities, criteria: Criteria) -> str:
    """How the option does on the farmer's top priority."""
    name = top_priority(priorities)
    score = criteria.model_dump()[name]
    return f"Su prioridad es {PRIORITY_LABEL_ES[name]}: esta opción saca {score} de 5."
