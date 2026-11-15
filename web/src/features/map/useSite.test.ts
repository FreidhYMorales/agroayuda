// web/src/features/map/useSite.test.ts
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { getSite, type SiteResult } from "../../api/site";
import { chiquimulaSite } from "./siteFixture";
import { useSite } from "./useSite";

vi.mock("../../api/site", () => ({ getSite: vi.fn() }));

type Opts = { signal: AbortSignal; onSlow: () => void };
type Call = {
  lat: number;
  lon: number;
  opts: Opts;
  resolve: (result: SiteResult) => void;
  reject: (error: unknown) => void;
};
type Point = { lat: number | undefined; lon: number | undefined };

const getSiteMock = vi.mocked(getSite);
const calls: Call[] = [];

const pointA: Point = { lat: 14.7, lon: -89.5 };
const pointB: Point = { lat: 14.6, lon: -89.4 };
const noPoint: Point = { lat: undefined, lon: undefined };
const siteB = { ...chiquimulaSite, location: { lat: 14.6, lon: -89.4 } };

const abortError = () => new DOMException("The operation was aborted.", "AbortError");

beforeEach(() => {
  calls.length = 0;
  getSiteMock.mockReset();
  getSiteMock.mockImplementation(
    (lat, lon, opts) =>
      new Promise<SiteResult>((resolve, reject) => {
        calls.push({ lat, lon, opts, resolve, reject });
      }),
  );
});

function renderSite(initial: Point) {
  return renderHook(({ lat, lon }: Point) => useSite(lat, lon), { initialProps: initial });
}

describe("useSite", () => {
  test("is empty and does not call the API when there is no point", () => {
    const { result } = renderSite(noPoint);

    expect(result.current.state).toEqual({ status: "empty" });
    expect(getSiteMock).not.toHaveBeenCalled();
  });

  test("starts loading and requests the point", () => {
    const { result } = renderSite(pointA);

    expect(result.current.state).toEqual({ status: "loading", slow: false });
    expect(getSiteMock).toHaveBeenCalledTimes(1);
    expect(calls[0].lat).toBe(14.7);
    expect(calls[0].lon).toBe(-89.5);
  });

  test("becomes ready with the site on success", async () => {
    const { result } = renderSite(pointA);

    await act(async () => {
      calls[0].resolve({ ok: true, site: chiquimulaSite });
    });

    expect(result.current.state).toEqual({ status: "ready", site: chiquimulaSite });
  });

  test("keeps the outside_region error code", async () => {
    const { result } = renderSite(pointA);

    await act(async () => {
      calls[0].resolve({ ok: false, error: "outside_region" });
    });

    expect(result.current.state).toEqual({ status: "error", error: "outside_region" });
  });

  test("keeps the network error code", async () => {
    const { result } = renderSite(pointA);

    await act(async () => {
      calls[0].resolve({ ok: false, error: "network" });
    });

    expect(result.current.state).toEqual({ status: "error", error: "network" });
  });

  test("onSlow marks the loading state as slow", () => {
    const { result } = renderSite(pointA);

    act(() => {
      calls[0].opts.onSlow();
    });

    expect(result.current.state).toEqual({ status: "loading", slow: true });
  });

  test("a slow callback from an older request does not affect the new one", () => {
    const { result, rerender } = renderSite(pointA);

    rerender(pointB);
    act(() => {
      calls[0].opts.onSlow();
    });

    expect(result.current.state).toEqual({ status: "loading", slow: false });
  });

  test("latest wins: a stale answer is aborted and never shown", async () => {
    const { result, rerender } = renderSite(pointA);

    rerender(pointB);
    expect(calls[0].opts.signal.aborted).toBe(true);
    expect(calls[1].opts.signal.aborted).toBe(false);

    await act(async () => {
      calls[0].resolve({ ok: true, site: chiquimulaSite }); // llega tarde
    });
    expect(result.current.state).toEqual({ status: "loading", slow: false });

    await act(async () => {
      calls[1].resolve({ ok: true, site: siteB });
    });
    expect(result.current.state).toEqual({ status: "ready", site: siteB });
  });

  test("an abort rejection is ignored, not shown as an error", async () => {
    const { result, rerender } = renderSite(pointA);

    rerender(pointB);
    await act(async () => {
      calls[0].reject(abortError());
    });

    expect(result.current.state).toEqual({ status: "loading", slow: false });
  });

  test("changing the point after a result goes back to loading", async () => {
    const { result, rerender } = renderSite(pointA);
    await act(async () => {
      calls[0].resolve({ ok: true, site: chiquimulaSite });
    });

    rerender(pointB);

    expect(result.current.state).toEqual({ status: "loading", slow: false });
  });

  test("clearing the point aborts the request and goes back to empty", () => {
    const { result, rerender } = renderSite(pointA);

    rerender(noPoint);

    expect(calls[0].opts.signal.aborted).toBe(true);
    expect(result.current.state).toEqual({ status: "empty" });
  });

  test("unmounting aborts the pending request", () => {
    const { unmount } = renderSite(pointA);

    unmount();

    expect(calls[0].opts.signal.aborted).toBe(true);
  });

  test("retry requests the same point again", async () => {
    const { result } = renderSite(pointA);
    await act(async () => {
      calls[0].resolve({ ok: false, error: "network" });
    });

    act(() => {
      result.current.retry();
    });

    expect(result.current.state).toEqual({ status: "loading", slow: false });
    expect(getSiteMock).toHaveBeenCalledTimes(2);
    expect(calls[1].lat).toBe(14.7);
    expect(calls[1].lon).toBe(-89.5);

    await act(async () => {
      calls[1].resolve({ ok: true, site: chiquimulaSite });
    });
    expect(result.current.state).toEqual({ status: "ready", site: chiquimulaSite });
  });
});
