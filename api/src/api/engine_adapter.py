"""Calls engine.recommend once package 02 provides it; the stub until then (task L7).

The import is dynamic so the API keeps working while engine/src/engine/recommend.py does not exist.
When the engine lands, nothing here needs to change: /health switches to "engine": "real".
"""

import importlib
from collections.abc import Callable
from typing import Literal, cast

from api import engine_stub
from contracts import (
    CropCatalogEntry,
    RecommendationRequest,
    RotationOption,
    RotationTemplate,
    SiteProfile,
)

RecommendFn = Callable[
    [SiteProfile, RecommendationRequest, list[CropCatalogEntry], list[RotationTemplate]],
    list[RotationOption],
]
ENGINE_MODULES = {"engine.recommend", "engine.errors"}


class EngineRejectedRequest(ValueError):
    """The engine raised InvalidRequestError (e.g. a crop in a season it does not support)."""


def _load_engine() -> tuple[RecommendFn, type[Exception]] | None:
    try:
        recommend_module = importlib.import_module("engine.recommend")
        errors_module = importlib.import_module("engine.errors")
    except ModuleNotFoundError as exc:
        if exc.name in ENGINE_MODULES:
            return None
        raise  # a real import bug inside the engine must not hide behind the stub
    return (
        cast(RecommendFn, recommend_module.recommend),
        cast(type[Exception], errors_module.InvalidRequestError),
    )


def engine_mode() -> Literal["real", "stub"]:
    return "stub" if _load_engine() is None else "real"


def recommend_options(
    site: SiteProfile,
    request: RecommendationRequest,
    crops: list[CropCatalogEntry],
    templates: list[RotationTemplate],
) -> list[RotationOption]:
    engine = _load_engine()
    if engine is None:
        return engine_stub.recommend(site, request)
    recommend, invalid_request = engine
    try:
        return recommend(site, request, crops, templates)
    except invalid_request as exc:
        raise EngineRejectedRequest(str(exc)) from exc
