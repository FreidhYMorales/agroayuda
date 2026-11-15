// web/src/features/map/useSite.ts
import { useCallback, useEffect, useState } from "react";
import { isAbortError } from "../../api/client";
import { getSite, type SiteResult } from "../../api/site";
import type { SiteProfile } from "../../contracts/contracts";

export type SiteError = Extract<SiteResult, { ok: false }>["error"];

export type SiteState =
  | { status: "empty" }
  | { status: "loading"; slow: boolean }
  | { status: "ready"; site: SiteProfile }
  | { status: "error"; error: SiteError };

export function useSite(
  lat: number | undefined,
  lon: number | undefined,
): { state: SiteState; retry: () => void } {
  const hasPoint = lat !== undefined && lon !== undefined;
  const [state, setState] = useState<SiteState>(
    hasPoint ? { status: "loading", slow: false } : { status: "empty" },
  );
  // Bumping this counter requests the same point again.
  const [attempt, setAttempt] = useState(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: attempt only exists to repeat the request
  useEffect(() => {
    if (lat === undefined || lon === undefined) {
      setState({ status: "empty" });
      return;
    }

    const controller = new AbortController();
    setState({ status: "loading", slow: false });

    getSite(lat, lon, {
      signal: controller.signal,
      onSlow: () => {
        if (controller.signal.aborted) return; // a newer request has already replaced this one
        setState((current) =>
          current.status === "loading" ? { status: "loading", slow: true } : current,
        );
      },
    })
      .then((result) => {
        if (controller.signal.aborted) return; // stale answer: the latest request wins
        setState(
          result.ok
            ? { status: "ready", site: result.site }
            : { status: "error", error: result.error },
        );
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || isAbortError(error)) return;
        setState({ status: "error", error: "internal" });
      });

    return () => controller.abort();
  }, [lat, lon, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { state, retry };
}
