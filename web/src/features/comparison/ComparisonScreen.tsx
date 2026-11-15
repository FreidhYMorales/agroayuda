import { useEffect, useRef, useState } from "react";
import { isAbortError } from "../../api/client";
import { postRecommendations } from "../../api/recommendations";
import type { RecommendationRequest, RotationOption } from "../../contracts/contracts";
import { type Badge, columnBadge, confidenceText, summaryMessage } from "./badges";
import { sequenceLabel } from "./cropLabels";
import { OptionDetail } from "./OptionDetail";
import { Page, visuallyHidden } from "./theme";

export const SLOW_MESSAGE = "Despertando el servidor…";
export const RETRY_LABEL = "Intentar de nuevo";

const COLUMN_TITLES = ["Actual", "Op.1", "Op.2"] as const;
const DETAIL_TITLES = ["Actual", "Opción 1", "Opción 2"] as const;
const CRITERIA = [
  { key: "water", icon: "💧", label: "Agua" },
  { key: "soil", icon: "🟫", label: "Suelo" },
  { key: "income", icon: "💰", label: "Ingreso" },
  { key: "risk", icon: "🛡", label: "Riesgo" },
] as const;

/** Current rotation first, then the alternatives in the order the engine sent them. */
export function orderOptions(options: RotationOption[]): RotationOption[] {
  const current = options.filter((option) => option.is_current);
  const others = options.filter((option) => !option.is_current);
  return [...current, ...others].slice(0, 3);
}

function ScoreBar({ value }: { value: number }) {
  return (
    <span className="ag-bar">
      <span className="ag-track" aria-hidden="true">
        <span className="ag-fill" style={{ width: `${(value / 5) * 100}%` }} />
      </span>
      <strong>{value}</strong>
    </span>
  );
}

function BadgeView({ badge }: { badge: Badge }) {
  if (badge.kind === "none") return null;
  return (
    <span className="ag-badge" data-badge={badge.kind}>
      {badge.text}
    </span>
  );
}

type ComparisonTableProps = {
  options: RotationOption[];
  onSelect: (index: number) => void;
};

/** Always three columns: Actual, Op.1, Op.2. Bars come with their number, never color alone. */
export function ComparisonTable({ options, onSelect }: ComparisonTableProps) {
  const columns = orderOptions(options);
  const recommended = (index: number) =>
    columns[index] && columnBadge(columns[index]).kind === "recommended"
      ? "ag-col-recommended"
      : "";
  return (
    <table className="ag-table">
      <thead>
        <tr>
          <th>
            <span style={visuallyHidden}>Criterio</span>
          </th>
          {COLUMN_TITLES.map((title, index) => {
            const option = columns[index];
            return (
              <th key={title} scope="col" className={recommended(index)}>
                <button type="button" className="ag-btn ag-colhead" onClick={() => onSelect(index)}>
                  {title}
                </button>
                {option ? (
                  <>
                    <div style={{ fontSize: 13, fontWeight: 400, marginTop: 4 }}>
                      {sequenceLabel(option.sequence)}
                    </div>
                    <BadgeView badge={columnBadge(option)} />
                  </>
                ) : null}
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {CRITERIA.map(({ key, icon, label }) => (
          <tr key={key}>
            <th scope="row">
              <span aria-hidden="true">{icon}</span>
              {` ${label}`}
            </th>
            {COLUMN_TITLES.map((title, index) => (
              <td key={title} className={recommended(index)}>
                {columns[index] ? <ScoreBar value={columns[index].criteria[key]} /> : "—"}
              </td>
            ))}
          </tr>
        ))}
        <tr>
          <th scope="row">Confianza</th>
          {COLUMN_TITLES.map((title, index) => {
            const option = columns[index];
            const low = option?.confidence === "low";
            return (
              <td
                key={title}
                data-low-confidence={low ? "true" : undefined}
                className={low ? "ag-low" : recommended(index)}
              >
                {option ? confidenceText(option.confidence) : "—"}
              </td>
            );
          })}
        </tr>
        <tr>
          <th scope="row">Meses sin cultivo</th>
          {COLUMN_TITLES.map((title, index) => (
            <td key={title} className={recommended(index)}>
              {columns[index] ? columns[index].bare_months.length : "—"}
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  );
}

function TableSkeleton() {
  return (
    <div aria-busy="true">
      <span style={visuallyHidden}>Cargando las opciones…</span>
      {[0, 1, 2, 3, 4].map((row) => (
        <div
          key={row}
          data-skeleton-row=""
          className="ag-skel"
          style={{ height: 40, margin: "10px 0" }}
        />
      ))}
    </div>
  );
}

type LoadState =
  | { status: "loading"; slow: boolean }
  | { status: "ready"; options: RotationOption[] }
  | { status: "error"; error: "network" | "internal" | "not_found" };

type ResultsViewProps = {
  request: RecommendationRequest;
  onBack: () => void;
  onChangePriorities: () => void;
  onInvalidRequest: () => void;
  onOutsideRegion: () => void;
  onRetry: () => void;
};

function ResultsView(props: ResultsViewProps) {
  const { request, onBack, onChangePriorities, onRetry } = props;
  const [state, setState] = useState<LoadState>({ status: "loading", slow: false });
  const [selected, setSelected] = useState<number | null>(null);
  const handlers = useRef(props);
  handlers.current = props;
  // The key restarts the request when the full request changes: the latest one wins.
  const requestKey = JSON.stringify(request);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    postRecommendations(JSON.parse(requestKey) as RecommendationRequest, {
      signal: controller.signal,
      onSlow: () => {
        if (active) {
          setState((prev) =>
            prev.status === "loading" ? { status: "loading", slow: true } : prev,
          );
        }
      },
    })
      .then((result) => {
        if (!active) return;
        if (result.ok) {
          setState({ status: "ready", options: result.data.options });
        } else if (result.error === "invalid_request") {
          handlers.current.onInvalidRequest();
        } else if (result.error === "outside_region") {
          handlers.current.onOutsideRegion();
        } else {
          setState({ status: "error", error: result.error });
        }
      })
      .catch((error: unknown) => {
        if (!isAbortError(error)) throw error;
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [requestKey]);

  const back = (
    <button type="button" className="ag-btn ag-link" onClick={onBack}>
      ← Sus opciones
    </button>
  );

  if (state.status === "loading") {
    return (
      <Page>
        {back}
        <TableSkeleton />
        {state.slow ? (
          <output className="ag-info" style={{ display: "block" }}>
            {SLOW_MESSAGE}
          </output>
        ) : null}
      </Page>
    );
  }

  if (state.status === "error") {
    return (
      <Page>
        {back}
        <div className="ag-card">
          <p>No pudimos traer sus opciones.</p>
          {state.error === "not_found" ? null : (
            <button type="button" className="ag-btn ag-primary" onClick={onRetry}>
              {RETRY_LABEL}
            </button>
          )}
        </div>
      </Page>
    );
  }

  const columns = orderOptions(state.options);
  if (selected !== null && columns[selected]) {
    return (
      <OptionDetail
        option={columns[selected]}
        title={DETAIL_TITLES[selected]}
        onBack={() => setSelected(null)}
      />
    );
  }

  const summary = summaryMessage(state.options);
  return (
    <Page>
      {back}
      {summary ? <p className="ag-info">{summary}</p> : null}
      <div className="ag-card" style={{ padding: "8px 4px" }}>
        <ComparisonTable options={state.options} onSelect={setSelected} />
      </div>
      <p className="ag-muted">Toque una opción ›</p>
      <p className="ag-muted">ⓘ Esto es una ayuda; no reemplaza su criterio</p>
      <button type="button" className="ag-btn ag-primary" onClick={onChangePriorities}>
        [ Cambiar prioridades ]
      </button>
    </Page>
  );
}

export type ComparisonScreenProps = {
  request: RecommendationRequest;
  /** "← Sus opciones": back to the form. */
  onBack: () => void;
  /** "[ Cambiar prioridades ]": show the form at the priorities block, answers kept. */
  onChangePriorities: () => void;
  /** 422 invalid_request: the parent shows the form again with "Revise sus respuestas". */
  onInvalidRequest: () => void;
  /** 404 outside_region: the parent goes back to the map with its message. */
  onOutsideRegion: () => void;
};

/** Sends the request, shows the three states (loading, slow, error) and the comparison. */
export function ComparisonScreen(props: ComparisonScreenProps) {
  const [attempt, setAttempt] = useState(0);
  const key = `${attempt}:${JSON.stringify(props.request)}`;
  return <ResultsView key={key} {...props} onRetry={() => setAttempt((n) => n + 1)} />;
}
