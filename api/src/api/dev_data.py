"""Parquet fixture data built from contracts/examples/ (dev fallback and test fixtures).

The API uses api/dev-data/ only while data/output/sites.parquet does not exist (see
main.resolve_data_dir). It holds the Chiquimula cell, a region that is exactly that cell, and the
example crop catalog and templates; /health reports data_version "dev-fixture".

Regenerate: uv run --package api python -m api.dev_data
"""

from pathlib import Path
from typing import Final

import duckdb

from contracts import SiteData

REPO_ROOT: Final = Path(__file__).resolve().parents[3]
EXAMPLES: Final = REPO_ROOT / "contracts" / "examples"
CROPS_CSV: Final = REPO_ROOT / "data" / "catalog" / "crops.csv"
DEV_DATA_DIR: Final = REPO_ROOT / "api" / "dev-data"
DEV_DATA_VERSION: Final = "dev-fixture"

Ring = list[list[float]]


def build_data_dir(out_dir: Path, rings: list[Ring], data_version: str | None = None) -> None:
    """Write sites, region, crops and rotation_templates Parquet files like the pipeline does.

    data_version None keeps the example's own value.
    """
    out_dir.mkdir(parents=True, exist_ok=True)
    site_json = (EXAMPLES / "site_data.json").as_posix()
    with duckdb.connect() as con:
        # read_json would infer data_version as a DATE; the contract says string.
        version_sql = (
            "CAST(data_version AS VARCHAR)" if data_version is None else "CAST(? AS VARCHAR)"
        )
        con.execute(
            f"COPY (SELECT * REPLACE ({version_sql} AS data_version) FROM read_json(?)) "
            "TO ? (FORMAT parquet)",
            [
                *([] if data_version is None else [data_version]),
                site_json,
                (out_dir / "sites.parquet").as_posix(),
            ],
        )
        con.execute("CREATE TABLE region (ring DOUBLE[][])")
        con.executemany("INSERT INTO region VALUES (?)", [[ring] for ring in rings])
        con.execute("COPY region TO ? (FORMAT parquet)", [(out_dir / "region.parquet").as_posix()])
        # The real, sourced catalog: the example catalog lacks crops the example templates use.
        con.execute(
            "COPY (SELECT * REPLACE (string_split(seasons, ';') AS seasons) FROM read_csv(?)) "
            "TO ? (FORMAT parquet)",
            [CROPS_CSV.as_posix(), (out_dir / "crops.parquet").as_posix()],
        )
        con.execute(
            "COPY (SELECT * FROM read_json(?)) TO ? (FORMAT parquet)",
            [
                (EXAMPLES / "rotation_templates.json").as_posix(),
                (out_dir / "rotation_templates.parquet").as_posix(),
            ],
        )


def build_dev_data(out_dir: Path) -> None:
    site = SiteData.model_validate_json((EXAMPLES / "site_data.json").read_text("utf-8"))
    build_data_dir(out_dir, [site.cell_polygon.coordinates[0]], DEV_DATA_VERSION)


if __name__ == "__main__":
    build_dev_data(DEV_DATA_DIR)
    print(f"Wrote {DEV_DATA_DIR}")
