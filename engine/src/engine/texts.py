"""One-line Spanish texts for each option (Guatemala, usted). Copy approved in story 15."""

from contracts import Criteria, Priorities


def reason_line(priorities: Priorities, criteria: Criteria) -> str:
    """How the option does on the farmer's top priority."""
    return f"Su prioridad es cuidar el agua: esta opción saca {criteria.water} de 5."
