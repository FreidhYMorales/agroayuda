"""Contract models: every payload that crosses a module boundary. Behavior lives in docs/spec.md.

Frozen at H2. Changes need the lead, plus a regenerated schema and TS types in the same PR.
"""

from typing import Annotated, Final, Literal

from pydantic import BaseModel, ConfigDict, Field

# --- Shared literals -----------------------------------------------------------------------------

# A named alias so the schema and the generated TS type are both called CropId.
type CropId = Literal[
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
]
Season = Literal["primera", "postrera"]
Level = Literal["low", "medium", "high", "unknown"]
Confidence = Literal["low", "medium", "high"]
Tier = Literal["low", "medium", "high"]
Delta = Literal["better", "same", "worse"]
RiskId = Literal["canicula", "bare_field", "heat", "missing_data"]
ErrorCode = Literal["outside_region", "invalid_request", "not_found", "internal"]

Month = Annotated[int, Field(ge=1, le=12)]
Score = Annotated[int, Field(ge=1, le=5)]
Priority = Annotated[int, Field(ge=1, le=5)]

ERROR_HTTP_STATUS: Final[dict[str, int]] = {
    "outside_region": 404,
    "invalid_request": 422,
    "not_found": 404,
    "internal": 500,
}


class Contract(BaseModel):
    """Base for every contract: unknown fields are an error, not silently dropped."""

    model_config = ConfigDict(extra="forbid", json_schema_serialization_defaults_required=True)


# --- Geometry ------------------------------------------------------------------------------------


class Location(Contract):
    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)


class Polygon(Contract):
    """GeoJSON Polygon: rings of [lon, lat] positions."""

    type: Literal["Polygon"] = "Polygon"
    coordinates: list[list[list[float]]]


# --- Request -------------------------------------------------------------------------------------


class Priorities(Contract):
    water: Priority = 3
    soil: Priority = 3
    income: Priority = 3
    risk: Priority = 3


class Rotation(Contract):
    """One crop per season; `none` means the field is left empty that season."""

    primera: CropId
    postrera: CropId


class Constraints(Contract):
    irrigation: bool = False


class RecommendationRequest(Contract):
    location: Location
    current_rotation: Rotation
    priorities: Priorities = Field(default_factory=Priorities)
    constraints: Constraints = Field(default_factory=Constraints)


# --- Site ----------------------------------------------------------------------------------------


class SiteRisk(Contract):
    id: RiskId
    level: Level
    period_months: list[Month]
    value: float | None
    threshold: float | None
    unit: str
    source: str
    estimated: bool
    explanation_es: str


class Climate(Contract):
    monthly_precip_mm: list[float] = Field(min_length=12, max_length=12)
    monthly_tmax_c: list[float] = Field(min_length=12, max_length=12)
    dekadal_precip_mm: list[float] = Field(min_length=36, max_length=36)


class Soil(Contract):
    """SoilGrids sample near the cell center; each field is null when SoilGrids has no value."""

    clay_pct: float | None
    sand_pct: float | None
    ph: float | None
    soc_g_kg: float | None


class SiteProfile(Contract):
    location: Location
    cell_polygon: Polygon
    cell_resolution_km: float = Field(gt=0)
    climate: Climate
    soil: Soil
    soil_sample_location: Location | None
    risks: list[SiteRisk]


class SiteData(Contract):
    """One Parquet row per NASA POWER cell (data pipeline output, read by the API)."""

    cell_id: str
    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)
    cell_polygon: Polygon
    monthly_precip_mm: list[float] = Field(min_length=12, max_length=12)
    monthly_tmax_c: list[float] = Field(min_length=12, max_length=12)
    dekadal_precip_mm: list[float] = Field(min_length=36, max_length=36)
    dry_spell_year_share: float = Field(ge=0, le=1)
    dry_spell_rule: str
    soil: Soil
    soil_sample_lat: float | None
    soil_sample_lon: float | None
    data_version: str
    risks: list[SiteRisk]


# --- Response ------------------------------------------------------------------------------------


class Criteria(Contract):
    water: Score
    soil: Score
    income: Score
    risk: Score


class DeltaVsCurrent(Contract):
    water: Delta
    soil: Delta
    income: Delta
    risk: Delta


class Evidence(Contract):
    text_es: str
    dataset: str
    value: str


class RotationOption(Contract):
    sequence: Rotation
    is_current: bool
    recommended: bool
    not_recommended_reason: str | None
    bare_months: list[Month]
    criteria: Criteria
    delta_vs_current: DeltaVsCurrent
    confidence: Confidence
    reasons: list[str]
    evidence: list[Evidence]
    benefits: list[str]
    data_gaps: list[str]
    local_review: list[str]


class RecommendationResponse(Contract):
    site: SiteProfile
    options: list[RotationOption] = Field(min_length=3, max_length=3)


class ErrorResponse(Contract):
    error: ErrorCode
    detail: str


# --- Static files (web/public/data/ and data/output/) --------------------------------------------


class CropCatalogEntry(Contract):
    id: CropId
    name_es: str
    icon: str
    seasons: list[Season] = Field(min_length=1)
    cycle_days: int = Field(gt=0)
    water_need: Tier
    n_fixing: bool
    root_depth: Literal["shallow", "deep"]
    erosion_cover: Tier
    drought_tolerance: Tier
    market_tier: Tier
    local_source: bool
    source: str


class RotationTemplate(Contract):
    id: str
    primera: CropId
    postrera: CropId
    description_es: str
    source: str


class DemoPoint(Contract):
    id: str
    name_es: str
    location: Location


class RainCellProperties(Contract):
    value_mm: float
    unit: str
    source: str
    resolution_km: float = Field(gt=0)
