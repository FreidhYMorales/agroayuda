"""AgroAyuda API: reads precomputed Parquet with DuckDB and returns contract models.

Every error is an `ErrorResponse` (contracts.ERROR_HTTP_STATUS). Agronomic rules live in `engine`.
"""

import logging
import os
from pathlib import Path
from typing import Annotated, Final

from fastapi import Depends, FastAPI, Query, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from api import engine_stub
from api.geo import cell_resolution_km, point_in_rings, snap_to_cell
from api.repository import find_site, read_data_version, read_region_rings
from contracts import (
    ERROR_HTTP_STATUS,
    Climate,
    ErrorCode,
    ErrorResponse,
    Location,
    RecommendationRequest,
    RecommendationResponse,
    SiteProfile,
)

logger = logging.getLogger("api")

DEFAULT_DATA_DIR: Final = Path(__file__).resolve().parents[3] / "data" / "output"
ERROR_RESPONSES: Final[dict[int | str, dict[str, object]]] = {
    404: {"model": ErrorResponse},
    422: {"model": ErrorResponse},
    500: {"model": ErrorResponse},
}


def get_data_dir() -> Path:
    """Folder with sites.parquet and region.parquet; override with AGROAYUDA_DATA_DIR."""
    return Path(os.environ.get("AGROAYUDA_DATA_DIR", DEFAULT_DATA_DIR))


DataDir = Annotated[Path, Depends(get_data_dir)]


class ApiError(Exception):
    def __init__(self, code: ErrorCode, detail: str) -> None:
        super().__init__(detail)
        self.code: ErrorCode = code
        self.detail = detail


def error_response(code: ErrorCode, detail: str) -> JSONResponse:
    body = ErrorResponse(error=code, detail=detail)
    return JSONResponse(status_code=ERROR_HTTP_STATUS[code], content=body.model_dump())


app = FastAPI(title="AgroAyuda API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://[a-z0-9-]+\.vercel\.app|http://localhost(:\d+)?",
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@app.exception_handler(ApiError)
async def handle_api_error(_: Request, exc: ApiError) -> JSONResponse:
    return error_response(exc.code, exc.detail)


@app.exception_handler(RequestValidationError)
async def handle_validation_error(_: Request, exc: RequestValidationError) -> JSONResponse:
    first = exc.errors()[0] if exc.errors() else {}
    where = ".".join(str(part) for part in first.get("loc", ()))
    return error_response("invalid_request", f"{where}: {first.get('msg', 'invalid request')}")


@app.exception_handler(StarletteHTTPException)
async def handle_http_error(_: Request, exc: StarletteHTTPException) -> JSONResponse:
    if exc.status_code == 404:
        return error_response("not_found", "Route not found")
    if exc.status_code < 500:
        return error_response("invalid_request", str(exc.detail))
    return error_response("internal", "Unexpected server error")


@app.exception_handler(Exception)
async def handle_unexpected_error(_: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled error", exc_info=exc)
    return error_response("internal", "Unexpected server error")


def load_site(location: Location, data_dir: Path) -> SiteProfile:
    """Region check, grid snapping and the Parquet lookup, shared by /site and /recommendations."""
    rings = read_region_rings(data_dir / "region.parquet")
    if not point_in_rings(location.lat, location.lon, rings):
        raise ApiError("outside_region", "Point outside the Dry Corridor region")
    cell = snap_to_cell(location.lat, location.lon)
    data = find_site(data_dir / "sites.parquet", cell.cell_id)
    if data is None:
        raise ApiError("not_found", f"No data for cell {cell.cell_id}")
    sample = None
    if data.soil_sample_lat is not None and data.soil_sample_lon is not None:
        sample = Location(lat=data.soil_sample_lat, lon=data.soil_sample_lon)
    return SiteProfile(
        location=location,
        cell_polygon=data.cell_polygon,
        cell_resolution_km=cell_resolution_km(data.lat),
        climate=Climate(
            monthly_precip_mm=data.monthly_precip_mm,
            monthly_tmax_c=data.monthly_tmax_c,
            dekadal_precip_mm=data.dekadal_precip_mm,
        ),
        soil=data.soil,
        soil_sample_location=sample,
        risks=data.risks,
    )


@app.get("/health")
def health(data_dir: DataDir) -> dict[str, str | None]:
    return {"status": "ok", "data_version": read_data_version(data_dir / "sites.parquet")}


@app.get("/site", responses=ERROR_RESPONSES)
def site(
    data_dir: DataDir,
    lat: Annotated[float, Query(ge=-90, le=90)],
    lon: Annotated[float, Query(ge=-180, le=180)],
) -> SiteProfile:
    return load_site(Location(lat=lat, lon=lon), data_dir)


@app.post("/recommendations", responses=ERROR_RESPONSES)
def recommendations(request: RecommendationRequest, data_dir: DataDir) -> RecommendationResponse:
    profile = load_site(request.location, data_dir)
    return RecommendationResponse(site=profile, options=engine_stub.recommend(profile, request))
