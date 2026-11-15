import type { RotationOption } from "../../contracts/contracts";
import { confidenceText, deltaText } from "./badges";
import { sequenceLabel } from "./cropLabels";
import { Page } from "./theme";

type OptionDetailProps = {
  option: RotationOption;
  /** Name of the column: "Actual", "Opción 1" or "Opción 2". */
  title: string;
  onBack: () => void;
};

const CRITERIA = [
  { key: "water", icon: "💧", label: "Agua" },
  { key: "soil", icon: "🟫", label: "Suelo" },
  { key: "income", icon: "💰", label: "Ingreso" },
  { key: "risk", icon: "🛡", label: "Riesgo" },
] as const;

export function bareMonthsText(count: number): string {
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
  const evidence = option.evidence.map(
    (item) => `${item.text_es} (${item.dataset}: ${item.value})`,
  );
  return (
    <Page>
      <button type="button" className="ag-btn ag-link" onClick={onBack}>
        {`← ${title}`}
      </button>
      <h2 style={{ marginTop: 8 }}>{sequenceLabel(option.sequence)}</h2>

      {option.is_current ? null : (
        <section className="ag-card">
          <h3>Comparada con lo actual:</h3>
          <ul style={{ listStyle: "none", paddingLeft: 0 }}>
            {CRITERIA.map(({ key, icon, label }) => (
              <li key={key}>
                <span aria-hidden="true">{icon}</span>
                {` ${label}: ${deltaText(option.delta_vs_current[key])}`}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="ag-card">
        <p style={{ margin: 0 }}>{`Confianza: ${confidenceText(option.confidence)}`}</p>
        <p style={{ marginBottom: 0 }}>{bareMonthsText(option.bare_months.length)}</p>
      </div>

      <Section title="Por qué:" items={option.reasons} />
      <Section title="Evidencia (datos):" items={evidence} />
      <p className="ag-muted">Valores de cultivos: valor general, validar localmente.</p>
      <Section title="Beneficio:" items={option.benefits} />
      <Section title="⚠ Consulte con un técnico" items={option.local_review} />
      <Section title="❔ Lo que no sabemos:" items={option.data_gaps} />
    </Page>
  );
}
