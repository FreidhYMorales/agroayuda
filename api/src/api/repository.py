"""Typed example: query a Parquet file with DuckDB and return a validated contract model.

Pattern to copy: parameterized SQL (never f-strings with user input), map the row to a dict by
column name, and let Pydantic validate it.
"""

from pathlib import Path
from typing import Any

import duckdb

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
