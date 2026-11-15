// web/src/features/map/useDemoPlaces.test.ts
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { type DemoPlacesResult, loadDemoPlaces } from "./demoPlaces";
import { demoPlaces } from "./siteFixture";
import { useDemoPlaces } from "./useDemoPlaces";

vi.mock("./demoPlaces", () => ({ loadDemoPlaces: vi.fn() }));

const loadMock = vi.mocked(loadDemoPlaces);

beforeEach(() => {
  loadMock.mockReset();
});

describe("useDemoPlaces", () => {
  test("starts with an empty list and asks for the file once", () => {
    loadMock.mockReturnValue(new Promise<DemoPlacesResult>(() => {}));

    const { result } = renderHook(() => useDemoPlaces());

    expect(result.current).toEqual([]);
    expect(loadMock).toHaveBeenCalledTimes(1);
  });

  test("gives the places once the file has loaded", async () => {
    loadMock.mockResolvedValue({ ok: true, places: demoPlaces });

    const { result } = renderHook(() => useDemoPlaces());

    await waitFor(() => expect(result.current).toEqual(demoPlaces));
  });

  test("stays empty when the file cannot be loaded", async () => {
    loadMock.mockResolvedValue({ ok: false });

    const { result } = renderHook(() => useDemoPlaces());
    await act(async () => {});

    expect(result.current).toEqual([]);
  });

  test("aborts the request when the component unmounts", () => {
    loadMock.mockReturnValue(new Promise<DemoPlacesResult>(() => {}));
    const { unmount } = renderHook(() => useDemoPlaces());
    const [options] = loadMock.mock.calls[0];

    unmount();

    expect(options.signal.aborted).toBe(true);
  });
});
