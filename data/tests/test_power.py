import json
import math
import shutil
from pathlib import Path

import httpx
import pandas as pd  # type: ignore[import-untyped]
import pytest

from data_pipeline.power import (
    FILL_VALUE,
    PowerDownloadError,
    cache_path,
    clean_fill,
    fetch_daily,
    parse_daily,
)

FIXTURES = Path(__file__).parent / "fixtures"
SAMPLE = FIXTURES / "power_daily_14.5_-89.375_sample.json"


def sample_payload() -> dict[str, object]:
    payload: dict[str, object] = json.loads(SAMPLE.read_text("utf-8"))
    return payload


def test_fill_value_becomes_nan() -> None:
    cleaned = clean_fill(pd.Series([1.0, FILL_VALUE, 3.0]))

    assert cleaned.iloc[0] == 1.0
    assert math.isnan(cleaned.iloc[1])
    assert cleaned.iloc[2] == 3.0
    assert cleaned.mean() == 2.0  # the statistic ignores the NaN


def test_parse_daily_returns_a_dated_frame_with_both_parameters() -> None:
    frame = parse_daily(sample_payload())

    assert list(frame.columns) == ["precip_mm", "tmax_c"]
    assert frame.index[0] == pd.Timestamp("1991-01-01")
    assert len(frame) == 41
    assert frame.loc["1991-01-05", "precip_mm"] == 4.42
    assert frame.loc["1991-01-05", "tmax_c"] == 26.53


def test_parse_daily_cleans_fill_values() -> None:
    payload = sample_payload()
    properties = payload["properties"]
    assert isinstance(properties, dict)
    properties["parameter"]["PRECTOTCORR"]["19910103"] = -999.0

    frame = parse_daily(payload)

    assert math.isnan(frame.loc["1991-01-03", "precip_mm"])


def test_fetch_daily_reads_the_cache_without_network(tmp_path: Path) -> None:
    shutil.copy(SAMPLE, cache_path(14.5, -89.375, tmp_path))

    def no_network(request: httpx.Request) -> httpx.Response:
        raise AssertionError(f"unexpected request {request.url}")

    with httpx.Client(transport=httpx.MockTransport(no_network)) as client:
        frame = fetch_daily(14.5, -89.375, tmp_path, client=client)

    assert len(frame) == 41


def test_fetch_daily_retries_with_backoff_and_caches(tmp_path: Path) -> None:
    calls: list[httpx.URL] = []
    sleeps: list[float] = []

    def flaky(request: httpx.Request) -> httpx.Response:
        calls.append(request.url)
        if len(calls) < 3:
            return httpx.Response(429)
        return httpx.Response(200, content=SAMPLE.read_bytes())

    with httpx.Client(transport=httpx.MockTransport(flaky)) as client:
        frame = fetch_daily(14.5, -89.375, tmp_path, client=client, sleep=sleeps.append)

    assert len(frame) == 41
    assert sleeps == [2.0, 4.0]
    assert calls[-1].params["latitude"] == "14.5"
    assert calls[-1].params["longitude"] == "-89.375"
    assert calls[-1].params["parameters"] == "PRECTOTCORR,T2M_MAX"
    assert calls[-1].params["community"] == "AG"
    assert calls[-1].params["start"] == "19910101"
    assert calls[-1].params["end"] == "20201231"
    assert cache_path(14.5, -89.375, tmp_path).exists()


def test_fetch_daily_gives_up_after_the_last_attempt(tmp_path: Path) -> None:
    def down(request: httpx.Request) -> httpx.Response:
        return httpx.Response(503)

    with (
        httpx.Client(transport=httpx.MockTransport(down)) as client,
        pytest.raises(PowerDownloadError),
    ):
        fetch_daily(14.5, -89.375, tmp_path, client=client, sleep=lambda _: None)

    assert not cache_path(14.5, -89.375, tmp_path).exists()
