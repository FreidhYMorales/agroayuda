import { useState } from "react";
import type { Location, RecommendationRequest } from "../../contracts/contracts";
import { DEFAULT_PRIORITIES, FormScreen, type FormValues } from "../form/FormScreen";
import { ComparisonScreen } from "./ComparisonScreen";

export const INVALID_NOTICE = "Revise sus respuestas";
export const OUTSIDE_NOTICE = "Por ahora solo cubrimos el Corredor Seco";

/** Same rule as `toRequest(state)` of package 03; null until both crops are chosen. */
export function buildRequest(values: FormValues, location: Location): RecommendationRequest | null {
  if (values.primera === undefined || values.postrera === undefined) return null;
  return {
    location,
    current_rotation: { primera: values.primera, postrera: values.postrera },
    priorities: values.priorities,
    constraints: { irrigation: values.irrigation === true },
  };
}

type View =
  | { kind: "form"; notice: string | null; focusPriorities: boolean }
  | { kind: "results"; request: RecommendationRequest };

export type ResultsFlowProps = {
  location: Location;
  /** Back to the map, with a message when the cause is "outside the region". */
  onBackToMap: (notice?: string) => void;
  initialValues?: FormValues;
};

/**
 * Form -> comparison -> detail -> "Cambiar prioridades". It keeps the answers in local state with
 * the shape of `AppState`; when `useAppState` (package 03) is wired, pass its values and patch to
 * `FormScreen` and `ComparisonScreen` directly, so the answers also live in the URL.
 */
export function ResultsFlow({ location, onBackToMap, initialValues }: ResultsFlowProps) {
  const [values, setValues] = useState<FormValues>(
    initialValues ?? { priorities: DEFAULT_PRIORITIES },
  );
  const [view, setView] = useState<View>({ kind: "form", notice: null, focusPriorities: false });

  if (view.kind === "results") {
    return (
      <ComparisonScreen
        request={view.request}
        onBack={() => setView({ kind: "form", notice: null, focusPriorities: false })}
        onChangePriorities={() => setView({ kind: "form", notice: null, focusPriorities: true })}
        onInvalidRequest={() =>
          setView({ kind: "form", notice: INVALID_NOTICE, focusPriorities: false })
        }
        onOutsideRegion={() => onBackToMap(OUTSIDE_NOTICE)}
      />
    );
  }

  return (
    <FormScreen
      values={values}
      notice={view.notice}
      focusPriorities={view.focusPriorities}
      onChange={(patch) => setValues((prev) => ({ ...prev, ...patch }))}
      onBack={() => onBackToMap()}
      onSubmit={() => {
        const request = buildRequest(values, location);
        if (request) setView({ kind: "results", request });
      }}
    />
  );
}
