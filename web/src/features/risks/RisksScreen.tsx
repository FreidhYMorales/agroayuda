// web/src/features/risks/RisksScreen.tsx
import type { CSSProperties } from "react";
import type { SiteRisk } from "../../contracts/contracts";
import { buttonStyle } from "../../ui/buttonStyles";
import { risksCopy } from "./copy";
import { useLang } from "../../lib/urlState";
import { RiskRow } from "./RiskRow";
import { sortRisks } from "./riskTitle";

export type RisksView =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; risks: SiteRisk[] };

export interface RisksScreenProps {
  view: RisksView;
  /** Name of the place picked from the list; absent for a tapped point. */
  placeName?: string;
  /** "← Su parcela": back to the map. */
  onClose: () => void;
  onRetry: () => void;
  onContinue: () => void;
}

// Touch targets of at least 44 px.

// Width, centering and side padding come from .ag-screen (src/ui/layout.ts);
// the top padding keeps the phone view as it was.
const screenStyle: CSSProperties = { paddingTop: 16 };
const skeletonStyle: CSSProperties = {
  height: 56,
  margin: "12px 0",
  borderRadius: 8,
  background: "#e0e0e0",
};

function RisksBody({ view, onRetry, onContinue }: Omit<RisksScreenProps, "onClose">) {
  const copy = risksCopy(useLang());
  if (view.status === "loading") {
    return (
      <div>
        {[0, 1, 2].map((n) => (
          <div key={n} data-testid="risk-skeleton" aria-hidden="true" style={skeletonStyle} />
        ))}
      </div>
    );
  }

  if (view.status === "error") {
    return (
      <button type="button" style={buttonStyle("secondary")} onClick={onRetry}>
        {copy.retry}
      </button>
    );
  }

  const risks = sortRisks(view.risks);
  const hasHighRisk = risks.some((risk) => risk.level === "high");

  return (
    <>
      {!hasHighRisk && <p>{copy.noStrongRisk}</p>}
      {risks.length > 0 && (
        // Two columns of risk rows on tablets and desktops (.ag-risk-grid).
        <ul className="ag-risk-grid" style={{ padding: 0, margin: 0 }}>
          {risks.map((risk) => (
            <RiskRow key={risk.id} risk={risk} />
          ))}
        </ul>
      )}
      <button
        type="button"
        // Full width on phones; .ag-action caps it at 420 px, centered, on wide screens.
        className="ag-action"
        style={{ ...buttonStyle("primary", { fullWidth: true }), marginTop: 16 }}
        onClick={onContinue}
      >
        {copy.continue}
      </button>
    </>
  );
}

export function RisksScreen({ view, placeName, onClose, onRetry, onContinue }: RisksScreenProps) {
  const copy = risksCopy(useLang());
  return (
    <section
      className="ag-screen"
      style={screenStyle}
      aria-labelledby="risks-title"
      aria-busy={view.status === "loading"}
    >
      {/* Same "← where it leads" link as the form and comparison, top left. */}
      <header>
        <button type="button" style={buttonStyle("link")} onClick={onClose}>
          {copy.back}
        </button>
        <h2 id="risks-title" style={{ marginTop: 8 }}>
          {placeName ? copy.headerAt(placeName) : copy.header}
        </h2>
      </header>
      <RisksBody view={view} onRetry={onRetry} onContinue={onContinue} />
    </section>
  );
}
