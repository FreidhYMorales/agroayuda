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
  onClose: () => void;
  onRetry: () => void;
  onContinue: () => void;
}

// Touch targets of at least 44 px.

// Width, centering and side padding come from .ag-screen (src/ui/layout.ts);
// the top padding keeps the phone view as it was.
const screenStyle: CSSProperties = { paddingTop: 16 };
const headerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};
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

export function RisksScreen({ view, onClose, onRetry, onContinue }: RisksScreenProps) {
  const copy = risksCopy(useLang());
  return (
    <section
      className="ag-screen"
      style={screenStyle}
      aria-labelledby="risks-title"
      aria-busy={view.status === "loading"}
    >
      <header style={headerStyle}>
        <h2 id="risks-title">{copy.header}</h2>
        <button
          type="button"
          style={buttonStyle("secondary")}
          aria-label={copy.close}
          onClick={onClose}
        >
          ✕
        </button>
      </header>
      <RisksBody view={view} onRetry={onRetry} onContinue={onContinue} />
    </section>
  );
}
