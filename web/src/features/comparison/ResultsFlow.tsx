import { useState } from "react";
import { toRequest, useAppState } from "../../lib/urlState";
import { FormScreen } from "../form/FormScreen";
import { ComparisonScreen } from "./ComparisonScreen";

export const INVALID_NOTICE = "Revise sus respuestas";
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
  const [notice, setNotice] = useState<string | null>(null);
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
          setNotice(INVALID_NOTICE);
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
      notice={notice}
      focusPriorities={focusPriorities}
      onChange={(patch) => setState(patch)}
      onBack={() => {
        setState({ step: "map" });
        onBackToMap?.();
      }}
      onSubmit={() => {
        setNotice(null);
        setFocusPriorities(false);
        // Without a place on the map there is nothing to send: go back and pick one.
        setState({ step: toRequest(state) ? "results" : "map" });
      }}
    />
  );
}
