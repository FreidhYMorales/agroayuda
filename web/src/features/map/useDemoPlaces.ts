// web/src/features/map/useDemoPlaces.ts
import { useEffect, useState } from "react";
import type { DemoPoint } from "../../contracts/contracts";
import { loadDemoPlaces } from "./demoPlaces";

// Loads the demo places once. The list stays empty until the file arrives and
// also if it cannot be loaded.
export function useDemoPlaces(): DemoPoint[] {
  const [places, setPlaces] = useState<DemoPoint[]>([]);

  useEffect(() => {
    const controller = new AbortController();

    loadDemoPlaces({ signal: controller.signal })
      .then((result) => {
        // Leaving the screen aborts the request: ignore any late answer.
        if (controller.signal.aborted) return;
        if (result.ok) setPlaces(result.places);
      })
      // The loader only throws on abort, so there is nothing to show here.
      .catch(() => undefined);

    return () => controller.abort();
  }, []);

  return places;
}
