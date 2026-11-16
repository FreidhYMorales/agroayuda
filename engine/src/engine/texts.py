"""One-line texts for each option: Spanish (Guatemala, usted; story 15) and English (i18n 05)."""

from contracts import (
    Criteria,
    CropCatalogEntry,
    CropId,
    DeltaVsCurrent,
    Evidence,
    Priorities,
    SiteProfile,
)
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
PRIORITY_LABEL_EN = {
    "water": "saving water",
    "soil": "caring for the soil",
    "income": "income",
    "risk": "lowering the risk",
}


LOCAL_REVIEW_ES = "Consulte con un técnico local antes de cambiar su siembra."
LOCAL_REVIEW_EN = "Talk to a local technician before changing what you plant."


def top_priorities(priorities: Priorities) -> list[str]:
    """Every priority at the highest weight, in PRIORITY_ORDER."""
    weights = priorities.model_dump()
    best = max(weights[name] for name in PRIORITY_ORDER)
    return [name for name in PRIORITY_ORDER if weights[name] == best]


def _join(parts: list[str], word: str) -> str:
    """'a', 'a y b', 'a, b y c' (word is 'y' or 'and')."""
    if len(parts) == 1:
        return parts[0]
    return f"{', '.join(parts[:-1])} {word} {parts[-1]}"


def reason_line(priorities: Priorities, criteria: Criteria) -> str:
    """How the option does on the farmer's top priority, or on each tied top one.

    A tie never names one priority as "the" priority: the farmer did not say so.
    """
    names = top_priorities(priorities)
    scores = criteria.model_dump()
    if len(names) == 1:
        name = names[0]
        return f"Su prioridad es {PRIORITY_LABEL_ES[name]}: esta opción saca {scores[name]} de 5."
    listed = _join([f"{PRIORITY_LABEL_ES[n]} {scores[n]} de 5" for n in names], "y")
    return f"Usted dio la misma importancia a varias cosas. Esta opción saca: {listed}."


def reason_line_en(priorities: Priorities, criteria: Criteria) -> str:
    """English version of reason_line."""
    names = top_priorities(priorities)
    scores = criteria.model_dump()
    if len(names) == 1:
        name = names[0]
        label = PRIORITY_LABEL_EN[name]
        return f"Your top priority is {label}: this option scores {scores[name]} of 5."
    listed = _join([f"{PRIORITY_LABEL_EN[n]} {scores[n]} of 5" for n in names], "and")
    return f"You gave several things the same importance. This option scores: {listed}."


# English of the canícula text in engine/risks.py, built from the stored level and share.
CANICULA_LEAD_EN = {
    "high": "Long dry spell (canícula) in July and August in most years.",
    "medium": "Long dry spell (canícula) in July and August in some years.",
    "low": "Few long dry spells in July and August.",
}
REGIONAL_NOTE_EN = (
    "NASA POWER rain is a regional estimate (MERRA-2 model), not a measurement on your plot."
)


def canicula_evidence(site: SiteProfile) -> list[Evidence]:
    """The NASA POWER canícula share, in the data owner's own words; none without a share."""
    for risk in site.risks:
        if risk.id == "canicula" and risk.value is not None:
            years = round_half_up(risk.value * POWER_YEARS)
            spell = f"There was a long dry spell in {years} of {POWER_YEARS} years (1991-2020)."
            lead = CANICULA_LEAD_EN.get(risk.level)
            text_en = " ".join(part for part in (lead, spell, REGIONAL_NOTE_EN) if part)
            return [
                Evidence(
                    text_es=risk.explanation_es,
                    text_en=text_en,
                    dataset="NASA POWER",
                    value=f"{years} de {POWER_YEARS} años",
                    value_en=f"{years} of {POWER_YEARS} years",
                )
            ]
    return []


POWER_GAP_ES = "La lluvia de NASA POWER es una estimación regional."
SOIL_GAP_ES = "No hay datos de suelo para este punto."


def _missing_soil(site: SiteProfile) -> bool:
    soil = site.soil
    return None in (soil.clay_pct, soil.sand_pct, soil.ph, soil.soc_g_kg)


def data_gaps(site: SiteProfile, crops: list[CropCatalogEntry]) -> list[str]:
    """What the advice cannot rest on: missing soil, non-local crops, then the regional rain."""
    missing_soil = _missing_soil(site)
    general = [
        f"{crop.name_es}: valor general, validar localmente."
        for crop in crops
        if crop.id != "none" and not crop.local_source
    ]
    return [*([SOIL_GAP_ES] if missing_soil else []), *general, POWER_GAP_ES]


POWER_GAP_EN = "NASA POWER rain is a regional estimate."
SOIL_GAP_EN = "There is no soil data for this point."
# The catalog only carries the Spanish name; same English names as the web form.
CROP_NAME_EN: dict[CropId, str] = {
    "maiz": "Maize",
    "frijol": "Beans",
    "maiz_frijol": "Maize with beans",
    "maicillo": "Sorghum",
    "gandul": "Pigeon pea",
    "mucuna": "Velvet bean",
    "canavalia": "Jack bean",
    "ajonjoli": "Sesame",
    "ayote": "Squash",
    "none": "Nothing",
}


def data_gaps_en(site: SiteProfile, crops: list[CropCatalogEntry]) -> list[str]:
    """English version of data_gaps."""
    missing_soil = _missing_soil(site)
    general = [
        f"{CROP_NAME_EN[crop.id]}: general value, check locally."
        for crop in crops
        if crop.id != "none" and not crop.local_source
    ]
    return [*([SOIL_GAP_EN] if missing_soil else []), *general, POWER_GAP_EN]


CRITERION_NAME_ES = {"water": "agua", "soil": "suelo", "income": "ingreso", "risk": "riesgo"}


CRITERION_NAME_EN = {"water": "water", "soil": "soil", "income": "income", "risk": "risk"}


def _better(deltas: DeltaVsCurrent, names: dict[str, str], conjunction: str) -> str | None:
    """The better criteria as "a, b and c", in priority order; None when nothing is better."""
    marks = deltas.model_dump()
    better = [names[name] for name in PRIORITY_ORDER if marks[name] == "better"]
    if not better:
        return None
    if len(better) < 3:
        return f" {conjunction} ".join(better)
    return f"{', '.join(better[:-1])} {conjunction} {better[-1]}"


def benefits(deltas: DeltaVsCurrent) -> list[str]:
    """One line naming the criteria that are better than the current rotation."""
    listed = _better(deltas, CRITERION_NAME_ES, "y")
    return [f"Mejora frente a su rotación en: {listed}."] if listed else []


def benefits_en(deltas: DeltaVsCurrent) -> list[str]:
    """English version of benefits."""
    listed = _better(deltas, CRITERION_NAME_EN, "and")
    return [f"Better than your rotation in: {listed}."] if listed else []
