"""NASA POWER daily point download: raw-response cache, exponential backoff, -999 -> NaN.

Daily PRECTOTCORR (mm/day) and T2M_MAX (degC), 1991-2020, community AG, requested at the exact
node coordinates so every request lands on one native POWER cell. No token needed.
"""

import json
import time
from collections.abc import Callable
from pathlib import Path
from typing import Any, Final

import httpx
import pandas as pd  # type: ignore[import-untyped]

FILL_VALUE: Final = -999.0
POWER_URL: Final = "https://power.larc.nasa.gov/api/temporal/daily/point"
PARAMETERS: Final = {"PRECTOTCORR": "precip_mm", "T2M_MAX": "tmax_c"}
START: Final = "19910101"
END: Final = "20201231"
ATTEMPTS: Final = 5
FIRST_WAIT_S: Final = 2.0
TIMEOUT_S: Final = 120.0
RETRY_STATUS: Final = frozenset({429, 500, 502, 503, 504})
USER_AGENT: Final = "agroayuda-data-pipeline"


class PowerDownloadError(RuntimeError):
    """A data provider (POWER, SoilGrids) did not answer with data after every retry."""


def clean_fill(series: pd.Series) -> pd.Series:
    """POWER fill value -999 becomes NaN, so no statistic ever averages it in."""
    return series.mask(series == FILL_VALUE)


def cache_path(lat: float, lon: float, cache_dir: Path) -> Path:
    return cache_dir / f"power_daily_{float(lat)}_{float(lon)}_{START}_{END}.json"


def parse_daily(payload: dict[str, Any]) -> pd.DataFrame:
    """Raw POWER JSON -> frame indexed by date with columns precip_mm and tmax_c (NaN-cleaned)."""
    parameters = payload["properties"]["parameter"]
    columns = {
        column: clean_fill(pd.Series(parameters[name], dtype="float64"))
        for name, column in PARAMETERS.items()
    }
    frame = pd.DataFrame(columns)
    frame.index = pd.to_datetime(frame.index, format="%Y%m%d")
    frame.index.name = "date"
    return frame.sort_index()


def get_with_backoff(
    client: httpx.Client,
    url: str,
    params: httpx.QueryParams,
    sleep: Callable[[float], None],
) -> str:
    """GET with exponential backoff (2, 4, 8, 16 s) on 429/5xx and network errors."""
    wait = FIRST_WAIT_S
    last_error = "no attempt"
    for attempt in range(1, ATTEMPTS + 1):
        try:
            response = client.get(url, params=params, timeout=TIMEOUT_S)
            if response.status_code == 200:
                return response.text
            last_error = f"HTTP {response.status_code}"
            if response.status_code not in RETRY_STATUS:
                break
        except httpx.TransportError as exc:
            last_error = repr(exc)
        if attempt < ATTEMPTS:
            sleep(wait)
            wait *= 2
    raise PowerDownloadError(f"{url} {params} failed: {last_error}")


def cached_json(
    path: Path,
    url: str,
    params: httpx.QueryParams,
    client: httpx.Client | None,
    sleep: Callable[[float], None],
) -> dict[str, Any]:
    """The cached raw response at `path`, downloading and caching it first if missing."""
    if not path.exists():
        path.parent.mkdir(parents=True, exist_ok=True)
        if client is None:
            with httpx.Client(headers={"User-Agent": USER_AGENT}, follow_redirects=True) as own:
                text = get_with_backoff(own, url, params, sleep)
        else:
            text = get_with_backoff(client, url, params, sleep)
        json.loads(text)  # never cache a broken body
        path.write_text(text, encoding="utf-8")
    payload: dict[str, Any] = json.loads(path.read_text("utf-8"))
    return payload


def fetch_daily(
    lat: float,
    lon: float,
    cache_dir: Path,
    *,
    client: httpx.Client | None = None,
    sleep: Callable[[float], None] = time.sleep,
) -> pd.DataFrame:
    """Daily series for one node; reads data/cache/ first, downloads (with backoff) otherwise."""
    params = httpx.QueryParams(
        {
            "parameters": ",".join(PARAMETERS),
            "community": "AG",
            "latitude": str(float(lat)),
            "longitude": str(float(lon)),
            "start": START,
            "end": END,
            "format": "JSON",
        }
    )
    payload = cached_json(cache_path(lat, lon, cache_dir), POWER_URL, params, client, sleep)
    return parse_daily(payload)
