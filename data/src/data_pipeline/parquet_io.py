"""Typed example: write and read contract models as Parquet with DuckDB (no pyarrow needed).

Pattern to copy for other outputs: an explicit DDL that mirrors the contract model, insert
`model_dump()` values in field order, then COPY the table to Parquet.
"""

from collections.abc import Sequence
from pathlib import Path
from typing import Any, Final

import duckdb

from contracts import SiteData

# Column order must match the field order of contracts.SiteData.
SITE_DATA_DDL: Final = """
CREATE TABLE site_data (
    cell_id VARCHAR,
    lat DOUBLE,
    lon DOUBLE,
    cell_polygon STRUCT("type" VARCHAR, coordinates DOUBLE[][][]),
    monthly_precip_mm DOUBLE[],
    monthly_tmax_c DOUBLE[],
    dekadal_precip_mm DOUBLE[],
    dry_spell_year_share DOUBLE,
    dry_spell_rule VARCHAR,
    soil STRUCT(clay_pct DOUBLE, sand_pct DOUBLE, ph DOUBLE, soc_g_kg DOUBLE),
    soil_sample_lat DOUBLE,
    soil_sample_lon DOUBLE,
    data_version VARCHAR,
    risks STRUCT(
        id VARCHAR,
        level VARCHAR,
        period_months INTEGER[],
        value DOUBLE,
        threshold DOUBLE,
        unit VARCHAR,
        source VARCHAR,
        estimated BOOLEAN,
        explanation_es VARCHAR
    )[]
)
"""


def write_site_data(rows: Sequence[SiteData], path: Path) -> None:
    """Write one Parquet row per POWER cell."""
    fields = list(SiteData.model_fields)
    placeholders = ", ".join("?" for _ in fields)
    with duckdb.connect() as con:
        con.execute(SITE_DATA_DDL)
        con.executemany(
            f"INSERT INTO site_data VALUES ({placeholders})",
            [[row.model_dump()[name] for name in fields] for row in rows],
        )
        con.execute("COPY site_data TO ? (FORMAT parquet)", [path.as_posix()])


def read_site_data(path: Path) -> list[SiteData]:
    """Read every row back as validated contract models, ordered by cell_id."""
    with duckdb.connect() as con:
        cursor = con.execute("SELECT * FROM read_parquet(?) ORDER BY cell_id", [path.as_posix()])
        names = [column[0] for column in cursor.description or []]
        rows: list[tuple[Any, ...]] = cursor.fetchall()
    return [SiteData.model_validate(dict(zip(names, row, strict=True))) for row in rows]
