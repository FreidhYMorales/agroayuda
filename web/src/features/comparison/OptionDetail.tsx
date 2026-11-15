import type { RotationOption } from "../../contracts/contracts";
import { confidenceText, deltaText } from "./badges";
import { sequenceLabel } from "./cropLabels";
import { type Lang, useLang } from "../../lib/urlState";
import { Page } from "./theme";

type OptionDetailProps = {
  option: RotationOption;
  /** Name of the column: "Actual", "Opción 1" or "Opción 2". */
  title: string;
  onBack: () => void;
};

// The labels come from DETAIL_COPY, by key.
const CRITERIA = [
  { key: "water", icon: "💧" },
  { key: "soil", icon: "🟫" },
  { key: "income", icon: "💰" },
  { key: "risk", icon: "🛡" },
] as const;

const DETAIL_COPY = {
  es: {
    criteria: { water: "Agua", soil: "Suelo", income: "Ingreso", risk: "Riesgo" },
    compared: "Comparada con lo actual:",
    confidence: "Confianza",
    why: "Por qué:",
    evidence: "Evidencia (datos):",
    cropNote: "Valores de cultivos: valor general, validar localmente.",
    benefit: "Beneficio:",
    localReview: "⚠ Consulte con un técnico",
    dataGaps: "❔ Lo que no sabemos:",
  },
  en: {
    criteria: { water: "Water", soil: "Soil", income: "Income", risk: "Risk" },
    compared: "Compared with current:",
    confidence: "Confidence",
    why: "Why:",
    evidence: "Evidence (data):",
    cropNote: "Crop values: general value, check locally.",
    benefit: "Benefit:",
    localReview: "⚠ Talk to a technician",
    dataGaps: "❔ What we do not know:",
  },
} as const;

export function bareMonthsText(count: number, lang: Lang = "es"): string {
  if (lang === "en") {
    if (count === 0) return "Leaves no month without a crop (estimated)";
    const unit = count === 1 ? "month" : "months";
    return `Leaves the field without a crop for ${count} ${unit} (estimated)`;
  }
  if (count === 0) return "No deja el terreno sin cultivo (estimado)";
  const unit = count === 1 ? "mes" : "meses";
  return `Deja el terreno sin cultivo ${count} ${unit} (estimado)`;
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="ag-card">
      <h3>{title}</h3>
      {items.length === 0 ? (
        <p>—</p>
      ) : (
        <ul>
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Plain-list detail of one column. */
export function OptionDetail({ option, title, onBack }: OptionDetailProps) {
  const lang = useLang();
  const copy = DETAIL_COPY[lang];
  const evidence = option.evidence.map(
    (item) => `${item.text_es} (${item.dataset}: ${item.value})`,
  );
  return (
    <Page>
      <button type="button" className="ag-btn ag-link" onClick={onBack}>
        {`← ${title}`}
      </button>
      <h2 style={{ marginTop: 8 }}>{sequenceLabel(option.sequence, lang)}</h2>

      {option.is_current ? null : (
        <section className="ag-card">
          <h3>{copy.compared}</h3>
          <ul style={{ listStyle: "none", paddingLeft: 0 }}>
            {CRITERIA.map(({ key, icon }) => (
              <li key={key}>
                <span aria-hidden="true">{icon}</span>
                {` ${copy.criteria[key]}: ${deltaText(option.delta_vs_current[key], lang)}`}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="ag-card">
        <p
          style={{ margin: 0 }}
        >{`${copy.confidence}: ${confidenceText(option.confidence, lang)}`}</p>
        <p style={{ marginBottom: 0 }}>{bareMonthsText(option.bare_months.length, lang)}</p>
      </div>

      <Section title={copy.why} items={option.reasons} />
      <Section title={copy.evidence} items={evidence} />
      <p className="ag-muted">{copy.cropNote}</p>
      <Section title={copy.benefit} items={option.benefits} />
      <Section title={copy.localReview} items={option.local_review} />
      <Section title={copy.dataGaps} items={option.data_gaps} />
    </Page>
  );
}
