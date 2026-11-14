from typing import get_args

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
)

CHIQUIMULA = {"lat": 14.70, "lon": -89.50}


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
