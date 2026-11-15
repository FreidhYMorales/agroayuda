// web/src/features/risks/RisksScreen.tsx
import type { CSSProperties } from "react";
import type { SiteRisk } from "../../contracts/contracts";
import { buttonStyle } from "../../ui/buttonStyles";
import { RISKS_COPY } from "./copy";
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

const screenStyle: CSSProperties = { padding: 16, maxWidth: 480, margin: "0 auto" };
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
        {RISKS_COPY.retry}
      </button>
    );
  }

  const risks = sortRisks(view.risks);
  const hasHighRisk = risks.some((risk) => risk.level === "high");

  return (
    <>
      {!hasHighRisk && <p>{RISKS_COPY.noStrongRisk}</p>}
      {risks.length > 0 && (
        <ul style={{ padding: 0, margin: 0 }}>
          {risks.map((risk) => (
            <RiskRow key={risk.id} risk={risk} />
          ))}
        </ul>
      )}
      <button
        type="button"
        style={{ ...buttonStyle("primary", { fullWidth: true }), marginTop: 16 }}
        onClick={onContinue}
      >
        {RISKS_COPY.continue}
      </button>
    </>
  );
}

export function RisksScreen({ view, onClose, onRetry, onContinue }: RisksScreenProps) {
  return (
    <section
      style={screenStyle}
      aria-labelledby="risks-title"
      aria-busy={view.status === "loading"}
    >
      <header style={headerStyle}>
        <h2 id="risks-title">{RISKS_COPY.header}</h2>
        <button
          type="button"
          style={buttonStyle("secondary")}
          aria-label={RISKS_COPY.close}
          onClick={onClose}
        >
          ✕
        </button>
      </header>
      <RisksBody view={view} onRetry={onRetry} onContinue={onContinue} />
    </section>
  );
}
