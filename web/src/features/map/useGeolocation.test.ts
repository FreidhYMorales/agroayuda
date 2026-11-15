// web/src/features/map/useGeolocation.test.ts
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { useGeolocation } from "./useGeolocation";

type OnSuccess = (position: GeolocationPosition) => void;
type OnFailure = (error: GeolocationPositionError) => void;

// The browser callbacks of the latest getCurrentPosition call, so each test
// decides when and how the browser answers.
let succeed: OnSuccess = () => {};
let fail: OnFailure = () => {};

const getCurrentPosition = vi.fn((onSuccess: OnSuccess, onFailure: OnFailure) => {
  succeed = onSuccess;
  fail = onFailure;
});

const position = { coords: { latitude: 14.7, longitude: -89.5 } } as GeolocationPosition;
const deniedError = { code: 1, message: "User denied Geolocation" } as GeolocationPositionError;

beforeEach(() => {
  getCurrentPosition.mockClear();
  succeed = () => {};
  fail = () => {};
  // jsdom has no geolocation, so it is defined on the instance for each test.
  Object.defineProperty(navigator, "geolocation", {
    value: { getCurrentPosition },
    configurable: true,
  });
});

afterEach(() => {
  Reflect.deleteProperty(navigator, "geolocation");
});

function renderGeolocation() {
  const onFound = vi.fn();
  const hook = renderHook(() => useGeolocation(onFound));
  return { ...hook, onFound };
}

describe("useGeolocation", () => {
  test("starts idle and does not ask the browser for the position", () => {
    const { result } = renderGeolocation();

    expect(result.current.locating).toBe(false);
    expect(result.current.denied).toBe(false);
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });

  test("locate asks the browser for the position once", () => {
    const { result } = renderGeolocation();

    act(() => {
      result.current.locate();
    });

    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
  });

  test("is locating until the browser answers", () => {
    const { result } = renderGeolocation();

    act(() => {
      result.current.locate();
    });

    expect(result.current.locating).toBe(true);
    expect(result.current.denied).toBe(false);
  });

  test("a found position goes to onFound as lat and lon", () => {
    const { result, onFound } = renderGeolocation();
    act(() => {
      result.current.locate();
    });

    act(() => {
      succeed(position);
    });

    expect(onFound).toHaveBeenCalledTimes(1);
    expect(onFound).toHaveBeenCalledWith({ lat: 14.7, lon: -89.5 });
    expect(result.current.locating).toBe(false);
    expect(result.current.denied).toBe(false);
  });

  test("an error marks denied and does not call onFound", () => {
    const { result, onFound } = renderGeolocation();
    act(() => {
      result.current.locate();
    });

    act(() => {
      fail(deniedError);
    });

    expect(result.current.denied).toBe(true);
    expect(result.current.locating).toBe(false);
    expect(onFound).not.toHaveBeenCalled();
  });

  test("a browser without geolocation counts as denied", () => {
    Reflect.deleteProperty(navigator, "geolocation");
    const { result, onFound } = renderGeolocation();

    act(() => {
      result.current.locate();
    });

    expect(result.current.denied).toBe(true);
    expect(result.current.locating).toBe(false);
    expect(onFound).not.toHaveBeenCalled();
  });

  test("reset clears the denied flag", () => {
    const { result } = renderGeolocation();
    act(() => {
      result.current.locate();
    });
    act(() => {
      fail(deniedError);
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.denied).toBe(false);
  });

  test("locating again clears an earlier denial", () => {
    const { result } = renderGeolocation();
    act(() => {
      result.current.locate();
    });
    act(() => {
      fail(deniedError);
    });

    act(() => {
      result.current.locate();
    });

    expect(result.current.denied).toBe(false);
    expect(result.current.locating).toBe(true);
  });
});
