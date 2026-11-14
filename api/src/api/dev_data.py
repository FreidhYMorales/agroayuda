"""Dev fixture data so the API answers before the data pipeline has run.

The API uses api/dev-data/ only while data/output/sites.parquet does not exist (see
main.resolve_data_dir). It holds the Chiquimula cell from contracts/examples/site_data.json and a
region that is exactly that cell; /health reports data_version "dev-fixture".

Regenerate: uv run --package api python -m api.dev_data
"""

from pathlib import Path
from typing import Final

import duckdb

from contracts import SiteData

REPO_ROOT: Final = Path(__file__).resolve().parents[3]
EXAMPLE: Final = REPO_ROOT / "contracts" / "examples" / "site_data.json"
DEV_DATA_DIR: Final = REPO_ROOT / "api" / "dev-data"
DEV_DATA_VERSION: Final = "dev-fixture"


def build_dev_data(out_dir: Path) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    ring = SiteData.model_validate_json(EXAMPLE.read_text("utf-8")).cell_polygon.coordinates[0]
    with duckdb.connect() as con:
        # read_json would infer data_version as a DATE; the contract says string.
        con.execute(
            "COPY (SELECT * REPLACE (CAST(? AS VARCHAR) AS data_version) FROM read_json(?)) "
            "TO ? (FORMAT parquet)",
            [DEV_DATA_VERSION, EXAMPLE.as_posix(), (out_dir / "sites.parquet").as_posix()],
        )
        con.execute("CREATE TABLE region (ring DOUBLE[][])")
        con.execute("INSERT INTO region VALUES (?)", [ring])
        con.execute("COPY region TO ? (FORMAT parquet)", [(out_dir / "region.parquet").as_posix()])


if __name__ == "__main__":
    build_dev_data(DEV_DATA_DIR)
    print(f"Wrote {DEV_DATA_DIR}")
