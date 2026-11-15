// web/src/features/map/useGeolocation.ts
import { useCallback, useEffect, useRef, useState } from "react";

export interface FoundPoint {
  lat: number;
  lon: number;
}

export function useGeolocation(onFound: (point: FoundPoint) => void): {
  locating: boolean;
  denied: boolean;
  locate: () => void;
  reset: () => void;
} {
  const [locating, setLocating] = useState(false);
  const [denied, setDenied] = useState(false);

  // Keep the latest callback in a ref so `locate` stays stable even when the
  // parent passes a new function on every render.
  const onFoundRef = useRef(onFound);
  useEffect(() => {
    onFoundRef.current = onFound;
  });

  const locate = useCallback(() => {
    // A new attempt clears an earlier denial.
    setDenied(false);

    // A browser without geolocation is handled like a denied permission:
    // the farmer's remedy is the same (tap the map or pick a place).
    if (!navigator.geolocation) {
      setDenied(true);
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        onFoundRef.current({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      () => {
        setLocating(false);
        setDenied(true);
      },
    );
  }, []);

  // The parent calls this when the farmer taps the map or picks a place.
  const reset = useCallback(() => setDenied(false), []);

  return { locating, denied, locate, reset };
}
