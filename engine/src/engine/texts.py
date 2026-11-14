"""One-line Spanish texts for each option (Guatemala, usted). Copy approved in story 15."""

from contracts import Criteria, Evidence, Priorities, SiteProfile
from engine.scoring import round_half_up

# NASA POWER daily rain covers 1991-2020; the canícula share is a share of those years.
POWER_YEARS = 30

# Tie order from docs/spec.md: water > soil > income > risk.
PRIORITY_ORDER = ("water", "soil", "income", "risk")
PRIORITY_LABEL_ES = {
    "water": "cuidar el agua",
    "soil": "cuidar el suelo",
    "income": "el ingreso",
    "risk": "bajar el riesgo",
}


LOCAL_REVIEW_ES = "Consulte con un técnico local antes de cambiar su siembra."


def top_priority(priorities: Priorities) -> str:
    """The highest priority; max() keeps the first in PRIORITY_ORDER on a tie."""
    weights = priorities.model_dump()
    return max(PRIORITY_ORDER, key=lambda name: weights[name])


def reason_line(priorities: Priorities, criteria: Criteria) -> str:
    """How the option does on the farmer's top priority."""
    name = top_priority(priorities)
    score = criteria.model_dump()[name]
    return f"Su prioridad es {PRIORITY_LABEL_ES[name]}: esta opción saca {score} de 5."


def canicula_evidence(site: SiteProfile) -> list[Evidence]:
    """The NASA POWER canícula share, in the data owner's own words; none without a share."""
    for risk in site.risks:
        if risk.id == "canicula" and risk.value is not None:
            years = round_half_up(risk.value * POWER_YEARS)
            value = f"{years} de {POWER_YEARS} años"
            return [Evidence(text_es=risk.explanation_es, dataset="NASA POWER", value=value)]
    return []


POWER_GAP_ES = "La lluvia de NASA POWER es una estimación regional."


def data_gaps() -> list[str]:
    """What the option's advice cannot rest on."""
    return [POWER_GAP_ES]
