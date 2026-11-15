import json
from pathlib import Path
from typing import Any, get_args

import pytest
from pydantic import ValidationError

from contracts import (
    ERROR_HTTP_STATUS,
    Climate,
    CropId,
    ErrorResponse,
    Priorities,
    RecommendationRequest,
    RecommendationResponse,
    RotationOption,
)

CHIQUIMULA = {"lat": 14.70, "lon": -89.50}
RESPONSE_EXAMPLE = Path(__file__).resolve().parents[1] / "examples" / "recommendation_response.json"
OPTION_EN_FIELDS = (
    "reasons_en",
    "benefits_en",
    "data_gaps_en",
    "local_review_en",
    "not_recommended_reason_en",
)


def spanish_only_option() -> dict[str, Any]:
    """The example's first option with every English sibling removed."""
    option: dict[str, Any] = json.loads(RESPONSE_EXAMPLE.read_text(encoding="utf-8"))["options"][0]
    for field in OPTION_EN_FIELDS:
        option.pop(field, None)
    for item in option["evidence"]:
        item.pop("text_en", None)
        item.pop("value_en", None)
    return option


def test_option_carries_english_next_to_spanish() -> None:
    option = spanish_only_option()
    option.update(
        reasons_en=["Your top priority is saving water: this option scores 4 of 5."],
        benefits_en=["Better than your rotation in: water and soil."],
        data_gaps_en=["NASA POWER rain is a regional estimate."],
        local_review_en=["Talk to a local technician before changing what you plant."],
        not_recommended_reason_en=None,
    )
    for item in option["evidence"]:
        item.update(text_en="Few long dry spells in July and August.", value_en="1 of 30 years")
    parsed = RotationOption.model_validate(option)
    assert parsed.reasons_en == ["Your top priority is saving water: this option scores 4 of 5."]
    assert parsed.local_review_en == ["Talk to a local technician before changing what you plant."]
    assert parsed.evidence[0].value_en == "1 of 30 years"


@pytest.mark.parametrize("field", OPTION_EN_FIELDS)
def test_option_without_an_english_sibling_is_rejected(field: str) -> None:
    option = spanish_only_option()
    option.update({name: [] for name in OPTION_EN_FIELDS if name != field})
    if field != "not_recommended_reason_en":
        option["not_recommended_reason_en"] = None
    for item in option["evidence"]:
        item.update(text_en="x", value_en="x")
    with pytest.raises(ValidationError, match=field):
        RotationOption.model_validate(option)


def test_crop_ids_are_the_frozen_list() -> None:
    assert get_args(CropId.__value__) == (
        "maiz",
        "frijol",
        "maiz_frijol",
        "maicillo",
        "gandul",
        "mucuna",
        "canavalia",
        "ajonjoli",
        "ayote",
        "none",
    )


def test_priorities_default_to_three() -> None:
    assert Priorities().model_dump() == {"water": 3, "soil": 3, "income": 3, "risk": 3}


@pytest.mark.parametrize("value", [0, 6])
def test_priorities_outside_one_to_five_are_rejected(value: int) -> None:
    with pytest.raises(ValidationError):
        Priorities(water=value)


def test_request_accepts_none_as_an_empty_season() -> None:
    request = RecommendationRequest.model_validate(
        {
            "location": CHIQUIMULA,
            "current_rotation": {"primera": "maiz", "postrera": "none"},
            "priorities": {"water": 5, "soil": 3, "income": 3, "risk": 3},
            "constraints": {"irrigation": False},
        }
    )

    assert request.current_rotation.postrera == "none"


def test_request_rejects_unknown_crop() -> None:
    with pytest.raises(ValidationError):
        RecommendationRequest.model_validate(
            {
                "location": CHIQUIMULA,
                "current_rotation": {"primera": "trigo", "postrera": "frijol"},
                "priorities": {},
                "constraints": {"irrigation": False},
            }
        )


def test_models_reject_unknown_fields() -> None:
    with pytest.raises(ValidationError):
        Priorities.model_validate({"water": 3, "speed": 5})


def test_climate_needs_twelve_months_and_thirty_six_dekads() -> None:
    with pytest.raises(ValidationError):
        Climate(
            monthly_precip_mm=[0.0] * 11,
            monthly_tmax_c=[30.0] * 12,
            dekadal_precip_mm=[0.0] * 36,
        )
    with pytest.raises(ValidationError):
        Climate(
            monthly_precip_mm=[0.0] * 12,
            monthly_tmax_c=[30.0] * 12,
            dekadal_precip_mm=[0.0] * 35,
        )


def test_response_needs_exactly_three_options() -> None:
    with pytest.raises(ValidationError, match="options"):
        RecommendationResponse.model_validate({"site": {}, "options": []})


def test_error_codes_map_to_http_statuses() -> None:
    assert ERROR_HTTP_STATUS == {
        "outside_region": 404,
        "invalid_request": 422,
        "not_found": 404,
        "internal": 500,
    }


def test_error_response_rejects_unknown_code() -> None:
    with pytest.raises(ValidationError):
        ErrorResponse.model_validate({"error": "teapot", "detail": "x"})
