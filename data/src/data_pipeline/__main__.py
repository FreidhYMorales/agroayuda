"""Pipeline entry point: uv run --package data-pipeline python -m data_pipeline [--map-layers]

Full run: region (geoBoundaries ADM1 + the listed ADM2 municipalities) -> POWER cells that
intersect it -> per cell: POWER daily features, SoilGrids soil, precomputed risks ->
data/output/*.parquet and web/public/data/**, all with the same data_version (the run date).

--map-layers writes only the web map files that need neither the crop catalog nor the engine:
web/public/data/layers/rain.geojson, region.geojson and demo_points.json.

Raw downloads are cached in data/cache/ (gitignored), so a second run works offline.
"""

import argparse
import sys
import time
from collections.abc import Callable, Sequence
from dataclasses import dataclass
from datetime import date
from pathlib import Path
from typing import Any, Final

import httpx
import pandas as pd  # type: ignore[import-untyped]

from contracts import CropCatalogEntry, Polygon, RotationTemplate, SiteData, Soil
from data_pipeline import power, soilgrids
from data_pipeline.features import (
    DRY_SPELL_RULE,
    dekadal_precip_mm,
    dry_spell_share,
    monthly_precip_mm,
    monthly_tmax_c,
)
from data_pipeline.grid import cell_id, cell_polygon, cells_intersecting
from data_pipeline.outputs import (
    DEMO_POINTS,
    Municipality,
    RainCell,
    rain_geojson,
    read_catalog_csv,
    region_geojson,
    region_mask_geojson,
    region_rings,
    write_catalog_parquet,
    write_json,
    write_region_parquet,
)
from data_pipeline.parquet_io import write_site_data
from engine.risks import site_risks

REPO_ROOT: Final = Path(__file__).resolve().parents[3]
# Chiquimula, Jutiapa, Zacapa, El Progreso, Jalapa
REGION_ISO: Final = frozenset({"GT-CQ", "GT-JU", "GT-ZA", "GT-PR", "GT-JA"})
GEOBOUNDARIES_URL: Final = (
    "https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/GTM/ADM1/"
    "geoBoundaries-GTM-ADM1_simplified.geojson"
)
ADM2_URL: Final = GEOBOUNDARIES_URL.replace("/ADM1/", "/ADM2/").replace("ADM1_", "ADM2_")
# Dry Corridor municipalities (municipality, department) added to the five departments above,
# spelled as in geoBoundaries ADM2. Source: SESAN (2016), Plan de Respuesta para la Atención del
# Hambre Estacional 2016, Anexo 1, pp. 28-30 (see data/README.md).
MUNICIPALITIES: Final[tuple[Municipality, ...]] = (
    # Huehuetenango (Anexo 1, p. 29)
    ("Aguacatán", "Huehuetenango"),
    ("Huehuetenango", "Huehuetenango"),
    ("Malacatancito", "Huehuetenango"),
)
TYPICAL_ROTATION: Final = ("maiz", "frijol")

DailyFetcher = Callable[[float, float, Path], pd.DataFrame]
SoilFetcher = Callable[[float, float, Path], dict[str, float | None]]


@dataclass(frozen=True)
class Paths:
    cache: Path = REPO_ROOT / "data" / "cache"
    catalog: Path = REPO_ROOT / "data" / "catalog"
    output: Path = REPO_ROOT / "data" / "output"
    web: Path = REPO_ROOT / "web" / "public" / "data"


def _fetch_daily(lat: float, lon: float, cache: Path) -> pd.DataFrame:
    return power.fetch_daily(lat, lon, cache / "power")


def _fetch_soil(lat: float, lon: float, cache: Path) -> dict[str, float | None]:
    try:
        return soilgrids.fetch_soil(lat, lon, cache / "soilgrids")
    except power.PowerDownloadError as exc:  # cut (4): soil stays null, the app says so
        print(f"SoilGrids failed at ({lat}, {lon}), soil left null: {exc}", file=sys.stderr)
        return dict.fromkeys(soilgrids.FIELDS.values())


def build_site(
    lat: float,
    lon: float,
    daily: pd.DataFrame,
    soil: dict[str, float | None],
    data_version: str,
    typical: tuple[CropCatalogEntry, CropCatalogEntry],
) -> SiteData:
    has_soil = any(value is not None for value in soil.values())
    site = SiteData(
        cell_id=cell_id(lat, lon),
        lat=lat,
        lon=lon,
        cell_polygon=Polygon.model_validate(cell_polygon(lat, lon)),
        monthly_precip_mm=monthly_precip_mm(daily),
        monthly_tmax_c=monthly_tmax_c(daily),
        dekadal_precip_mm=dekadal_precip_mm(daily),
        dry_spell_year_share=dry_spell_share(daily),
        dry_spell_rule=DRY_SPELL_RULE,
        soil=Soil.model_validate(soil),
        soil_sample_lat=lat if has_soil else None,
        soil_sample_lon=lon if has_soil else None,
        data_version=data_version,
        risks=[],
    )
    return site.model_copy(update={"risks": site_risks(site, *typical)})


def run(
    paths: Paths,
    data_version: str,
    boundaries: dict[str, Any],
    *,
    adm2: dict[str, Any] | None = None,
    municipalities: Sequence[Municipality] = (),
    fetch_daily: DailyFetcher = _fetch_daily,
    fetch_soil: SoilFetcher = _fetch_soil,
) -> list[SiteData]:
    """Compute every cell and write all outputs; returns the sites written."""
    crops = read_catalog_csv(paths.catalog / "crops.csv", CropCatalogEntry)
    templates = read_catalog_csv(paths.catalog / "rotation_templates.csv", RotationTemplate)
    by_id = {crop.id: crop for crop in crops}
    typical = (by_id[TYPICAL_ROTATION[0]], by_id[TYPICAL_ROTATION[1]])

    rings = region_rings(boundaries, set(REGION_ISO), adm2, municipalities)
    sites = []
    for lat, lon in cells_intersecting(rings):
        daily = fetch_daily(lat, lon, paths.cache)
        soil = fetch_soil(lat, lon, paths.cache)
        sites.append(build_site(lat, lon, daily, soil, data_version, typical))
        print(f"cell {cell_id(lat, lon)}: share {sites[-1].dry_spell_year_share:.2f}")

    paths.output.mkdir(parents=True, exist_ok=True)
    write_site_data(sites, paths.output / "sites.parquet")
    write_region_parquet(rings, paths.output / "region.parquet")
    write_catalog_parquet(crops, paths.output / "crops.parquet")
    write_catalog_parquet(templates, paths.output / "rotation_templates.parquet")

    cells = [RainCell(s.lat, s.lon, sum(s.monthly_precip_mm)) for s in sites]
    write_map_layers(paths, data_version, boundaries, cells, adm2, municipalities)
    write_json([crop.model_dump() for crop in crops], paths.web / "crops.json")
    write_json([t.model_dump() for t in templates], paths.web / "rotation_templates.json")
    return sites


def write_map_layers(
    paths: Paths,
    data_version: str,
    boundaries: dict[str, Any],
    cells: Sequence[RainCell],
    adm2: dict[str, Any] | None = None,
    municipalities: Sequence[Municipality] = (),
) -> None:
    """rain.geojson, region.geojson, region_mask.geojson and demo_points.json under paths.web."""
    write_json(rain_geojson(cells, data_version), paths.web / "layers" / "rain.geojson")
    write_json(
        region_geojson(boundaries, set(REGION_ISO), data_version, adm2, municipalities),
        paths.web / "region.geojson",
    )
    rings = region_rings(boundaries, set(REGION_ISO), adm2, municipalities)
    write_json(region_mask_geojson(rings, data_version), paths.web / "region_mask.geojson")
    write_json(DEMO_POINTS, paths.web / "demo_points.json")


def map_layers(
    paths: Paths,
    data_version: str,
    boundaries: dict[str, Any],
    *,
    adm2: dict[str, Any] | None = None,
    municipalities: Sequence[Municipality] = (),
    fetch_daily: DailyFetcher = _fetch_daily,
) -> list[RainCell]:
    """Annual rain normal for every region cell, then the three map files."""
    rings = region_rings(boundaries, set(REGION_ISO), adm2, municipalities)
    cells = [
        RainCell(lat, lon, sum(monthly_precip_mm(fetch_daily(lat, lon, paths.cache))))
        for lat, lon in cells_intersecting(rings)
    ]
    write_map_layers(paths, data_version, boundaries, cells, adm2, municipalities)
    return cells


def load_boundaries(paths: Paths) -> dict[str, Any]:
    return power.cached_json(
        paths.cache / "geoboundaries" / "GTM_ADM1_simplified.geojson",
        GEOBOUNDARIES_URL,
        httpx.QueryParams(),
        None,
        time.sleep,
    )


def load_adm2(paths: Paths) -> dict[str, Any] | None:
    """geoBoundaries ADM2, only when a municipality list needs it (cached like ADM1)."""
    if not MUNICIPALITIES:
        return None
    return power.cached_json(
        paths.cache / "geoboundaries" / "GTM_ADM2_simplified.geojson",
        ADM2_URL,
        httpx.QueryParams(),
        None,
        time.sleep,
    )


def main(argv: Sequence[str] | None = None) -> None:
    parser = argparse.ArgumentParser(prog="python -m data_pipeline")
    parser.add_argument(
        "--map-layers",
        action="store_true",
        help="only write rain.geojson, region.geojson and demo_points.json",
    )
    args = parser.parse_args(argv)
    paths = Paths()
    data_version = date.today().isoformat()
    if args.map_layers:
        cells = map_layers(
            paths,
            data_version,
            load_boundaries(paths),
            adm2=load_adm2(paths),
            municipalities=MUNICIPALITIES,
        )
        print(f"Wrote {len(cells)} rain cells, the region and demo points to {paths.web}")
        return
    sites = run(
        paths,
        data_version,
        load_boundaries(paths),
        adm2=load_adm2(paths),
        municipalities=MUNICIPALITIES,
    )
    print(f"Wrote {len(sites)} cells to {paths.output} and {paths.web}")


if __name__ == "__main__":
    main()
