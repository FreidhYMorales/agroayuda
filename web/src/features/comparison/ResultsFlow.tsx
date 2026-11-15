import { useState } from "react";
import { toRequest, useAppState, useLang } from "../../lib/urlState";
import { FormScreen } from "../form/FormScreen";
import { ComparisonScreen } from "./ComparisonScreen";

export const INVALID_NOTICE = { es: "Revise sus respuestas", en: "Check your answers" } as const;
export const OUTSIDE_NOTICE = "Por ahora solo cubrimos el Corredor Seco";

export type ResultsFlowProps = {
  /** Called after going back to the map; the notice is set when the cause is "outside region". */
  onBackToMap?: (notice?: string) => void;
};

/**
 * Form -> comparison -> detail -> "Cambiar prioridades". The answers and the step live in the
 * URL through `useAppState` (package 03), so a reload or the browser's back button keeps them.
 * Only the messages ("Revise sus respuestas", scroll to priorities) are local.
 */
export function ResultsFlow({ onBackToMap }: ResultsFlowProps) {
  const [state, setState] = useAppState();
  const lang = useLang();
  // Only the kind of notice is kept, so its text follows the current language.
  const [invalid, setInvalid] = useState(false);
  const [focusPriorities, setFocusPriorities] = useState(false);

  const request = state.step === "results" ? toRequest(state) : null;

  if (request) {
    return (
      <ComparisonScreen
        request={request}
        onBack={() => {
          setFocusPriorities(false);
          setState({ step: "form" });
        }}
        onChangePriorities={() => {
          setFocusPriorities(true);
          setState({ step: "form" });
        }}
        onInvalidRequest={() => {
          setInvalid(true);
          setFocusPriorities(false);
          setState({ step: "form" });
        }}
        onOutsideRegion={() => {
          setState({ step: "map" });
          onBackToMap?.(OUTSIDE_NOTICE);
        }}
      />
    );
  }

  return (
    <FormScreen
      values={{
        primera: state.primera,
        postrera: state.postrera,
        priorities: state.priorities,
        irrigation: state.irrigation,
      }}
      notice={invalid ? INVALID_NOTICE[lang] : null}
      focusPriorities={focusPriorities}
      onChange={(patch) => setState(patch)}
      onBack={() => {
        setState({ step: "map" });
        onBackToMap?.();
      }}
      onSubmit={() => {
        setInvalid(false);
        setFocusPriorities(false);
        // Without a place on the map there is nothing to send: go back and pick one.
        setState({ step: toRequest(state) ? "results" : "map" });
      }}
    />
  );
}
