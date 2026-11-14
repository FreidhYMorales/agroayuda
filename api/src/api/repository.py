"""Typed example: query a Parquet file with DuckDB and return a validated contract model.

Pattern to copy: parameterized SQL (never f-strings with user input), map the row to a dict by
column name, and let Pydantic validate it.
"""

from pathlib import Path
from typing import Any

import duckdb
from pydantic import BaseModel

from contracts import SiteData


def find_site(parquet_path: Path, cell_id: str) -> SiteData | None:
    """Return the SiteData row for one POWER cell, or None when the cell is not in the file."""
    with duckdb.connect() as con:
        cursor = con.execute(
            "SELECT * FROM read_parquet(?) WHERE cell_id = ?",
            [parquet_path.as_posix(), cell_id],
        )
        names = [column[0] for column in cursor.description or []]
        row: tuple[Any, ...] | None = cursor.fetchone()
    if row is None:
        return None
    return SiteData.model_validate(dict(zip(names, row, strict=True)))


def read_models[M: BaseModel](parquet_path: Path, model: type[M]) -> list[M]:
    """Every row as a validated model, in file order (templates break ties by CSV order)."""
    with duckdb.connect() as con:
        cursor = con.execute(
            "SELECT * EXCLUDE (file_row_number) "
            "FROM read_parquet(?, file_row_number = true) ORDER BY file_row_number",
            [parquet_path.as_posix()],
        )
        names = [column[0] for column in cursor.description or []]
        rows: list[tuple[Any, ...]] = cursor.fetchall()
    return [model.model_validate(dict(zip(names, row, strict=True))) for row in rows]


def read_region_rings(parquet_path: Path) -> list[list[list[float]]]:
    """region.parquet: one row per ring, column `ring` = [[lon, lat], ...] (even-odd rule)."""
    with duckdb.connect() as con:
        rows: list[tuple[Any, ...]] = con.execute(
            "SELECT ring FROM read_parquet(?)", [parquet_path.as_posix()]
        ).fetchall()
    return [row[0] for row in rows]


def read_data_version(parquet_path: Path) -> str | None:
    """The pipeline run date stored in sites.parquet, or None before the first pipeline run."""
    if not parquet_path.exists():
        return None
    with duckdb.connect() as con:
        row: tuple[Any, ...] | None = con.execute(
            "SELECT max(data_version) FROM read_parquet(?)", [parquet_path.as_posix()]
        ).fetchone()
    return None if row is None else row[0]
