// web/src/lib/urlState.ts
import { useCallback, useEffect, useState } from "react";
import type { CropId, Priorities, RecommendationRequest } from "../contracts/contracts";

export type Step = "map" | "risks" | "form" | "results";

export interface AppState {
  step: Step;
  lat?: number;
  lon?: number;
  place?: string; // place = DemoPoint.id
  primera?: CropId;
  postrera?: CropId;
  priorities: Priorities;
  irrigation?: boolean;
}

const STEPS: readonly Step[] = ["map", "risks", "form", "results"];
const DEFAULT_PRIORITY = 3;

function parseNumber(value: string | null): number | undefined {
  if (value === null || value.trim() === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function parsePriority(value: string | null): Priorities["water"] {
  const n = parseNumber(value);
  if (n === undefined || !Number.isInteger(n) || n < 1 || n > 5) {
    return DEFAULT_PRIORITY as Priorities["water"];
  }
  return n as Priorities["water"];
}

export function readState(search: string): AppState {
  const params = new URLSearchParams(search);
  const step = params.get("step");

  const state: AppState = {
    step: STEPS.find((s) => s === step) ?? "map",
    priorities: {
      water: parsePriority(params.get("w")),
      soil: parsePriority(params.get("so")),
      income: parsePriority(params.get("i")),
      risk: parsePriority(params.get("r")),
    },
  };

  const lat = parseNumber(params.get("lat"));
  if (lat !== undefined) state.lat = lat;

  const lon = parseNumber(params.get("lon"));
  if (lon !== undefined) state.lon = lon;

  const place = params.get("place");
  if (place) state.place = place;

  const primera = params.get("p");
  if (primera) state.primera = primera as CropId;

  const postrera = params.get("s");
  if (postrera) state.postrera = postrera as CropId;

  const irr = params.get("irr");
  if (irr === "1") state.irrigation = true;
  else if (irr === "0") state.irrigation = false;

  return state;
}

export function toSearch(state: AppState): string {
  const params = new URLSearchParams();
  params.set("step", state.step);
  if (state.lat !== undefined) params.set("lat", String(state.lat));
  if (state.lon !== undefined) params.set("lon", String(state.lon));
  if (state.place !== undefined) params.set("place", state.place);
  if (state.primera !== undefined) params.set("p", state.primera);
  if (state.postrera !== undefined) params.set("s", state.postrera);
  params.set("w", String(state.priorities.water));
  params.set("so", String(state.priorities.soil));
  params.set("i", String(state.priorities.income));
  params.set("r", String(state.priorities.risk));
  if (state.irrigation !== undefined) params.set("irr", state.irrigation ? "1" : "0");
  return `?${params.toString()}`;
}

export function toRequest(state: AppState): RecommendationRequest | null {
  const { lat, lon, primera, postrera } = state;
  if (lat === undefined || lon === undefined) return null;
  if (primera === undefined || postrera === undefined) return null;

  return {
    constraints: { irrigation: state.irrigation ?? false },
    current_rotation: { primera, postrera },
    location: { lat, lon },
    priorities: state.priorities,
  };
}

export function useAppState(): [AppState, (patch: Partial<AppState>) => void] {
  const [state, setState] = useState<AppState>(() => readState(window.location.search));

  // El botón "atrás" o "adelante" del navegador cambia la URL: el estado la sigue.
  useEffect(() => {
    const onPopState = () => setState(readState(window.location.search));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const update = useCallback((patch: Partial<AppState>) => {
    // La URL es la fuente de verdad: se combina el parche con lo que hay ahora,
    // así dos parches seguidos nunca trabajan sobre un estado viejo.
    const next: AppState = { ...readState(window.location.search), ...patch };
    window.history.pushState(null, "", toSearch(next));
    setState(next);
  }, []);

  return [state, update];
}
