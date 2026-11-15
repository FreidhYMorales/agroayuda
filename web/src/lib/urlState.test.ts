import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test } from "vitest";
import { type AppState, readState, toRequest, toSearch, useAppState } from "./urlState";

test("URL round trip", () => {
  const state: AppState = {
    step: "results",
    lat: 14.7,
    lon: -89.5,
    primera: "maiz",
    postrera: "frijol",
    priorities: { water: 5, soil: 3, income: 3, risk: 3 },
  };

  // toSearch y luego readState devuelve el mismo estado
  expect(readState(toSearch(state))).toEqual(state);

  // las prioridades que faltan en la URL quedan en 3 por defecto
  const fromUrl = readState("?step=results&lat=14.7&lon=-89.5&p=maiz&s=frijol&w=5");
  expect(fromUrl.priorities).toEqual({ water: 5, soil: 3, income: 3, risk: 3 });
});

test("toRequest returns null when postrera is missing", () => {
  const state: AppState = {
    step: "results",
    lat: 14.7,
    lon: -89.5,
    primera: "maiz",
    priorities: { water: 3, soil: 3, income: 3, risk: 3 },
  };

  expect(toRequest(state)).toBeNull();
});

test("toRequest returns null when the point is missing", () => {
  const state: AppState = {
    step: "results",
    primera: "maiz",
    postrera: "frijol",
    priorities: { water: 3, soil: 3, income: 3, risk: 3 },
  };

  expect(toRequest(state)).toBeNull();
});

test("toRequest builds the request when point and crops are present", () => {
  const state: AppState = {
    step: "results",
    lat: 14.7,
    lon: -89.5,
    primera: "maiz",
    postrera: "frijol",
    priorities: { water: 5, soil: 3, income: 3, risk: 3 },
    irrigation: true,
  };

  expect(toRequest(state)).toEqual({
    constraints: { irrigation: true },
    current_rotation: { primera: "maiz", postrera: "frijol" },
    location: { lat: 14.7, lon: -89.5 },
    priorities: { water: 5, soil: 3, income: 3, risk: 3 },
  });
});

describe("useAppState", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/");
  });

  test("reads the initial state from the URL", () => {
    window.history.replaceState(null, "", "/?step=risks&lat=14.7&lon=-89.5");

    const { result } = renderHook(() => useAppState());

    expect(result.current[0]).toMatchObject({ step: "risks", lat: 14.7, lon: -89.5 });
  });

  test("a patch updates the state and the URL, and pushes history", () => {
    const entriesBefore = window.history.length;
    const { result } = renderHook(() => useAppState());

    act(() => {
      result.current[1]({ step: "risks", lat: 14.7, lon: -89.5 });
    });

    expect(result.current[0]).toMatchObject({ step: "risks", lat: 14.7, lon: -89.5 });
    expect(readState(window.location.search)).toMatchObject({
      step: "risks",
      lat: 14.7,
      lon: -89.5,
    });
    expect(window.history.length).toBe(entriesBefore + 1);
  });

  test("a patch keeps the fields it does not mention", () => {
    const { result } = renderHook(() => useAppState());

    act(() => {
      result.current[1]({ lat: 14.7, lon: -89.5 });
    });
    act(() => {
      result.current[1]({ step: "form", primera: "maiz" });
    });

    expect(result.current[0]).toMatchObject({
      step: "form",
      lat: 14.7,
      lon: -89.5,
      primera: "maiz",
    });
  });

  test("follows the URL when the user goes back (popstate)", () => {
    const { result } = renderHook(() => useAppState());

    act(() => {
      window.history.replaceState(null, "", "/?step=form&lat=14.7&lon=-89.5");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    expect(result.current[0]).toMatchObject({ step: "form", lat: 14.7, lon: -89.5 });
  });
});
