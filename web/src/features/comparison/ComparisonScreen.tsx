import { useEffect, useRef, useState } from "react";
import { isAbortError } from "../../api/client";
import { postRecommendations } from "../../api/recommendations";
import type { RecommendationRequest, RotationOption } from "../../contracts/contracts";
import { type Badge, columnBadge, confidenceText, summaryMessage } from "./badges";
import { type Lang, useLang } from "../../lib/urlState";
import { comparisonCopy } from "./copy";
import { sequenceLabel } from "./cropLabels";
import { OptionDetail } from "./OptionDetail";
import { Page, visuallyHidden } from "./theme";

// The labels come from comparisonCopy, by key.
const CRITERIA = [
  { key: "water", icon: "💧" },
  { key: "soil", icon: "🟫" },
  { key: "income", icon: "💰" },
  { key: "risk", icon: "🛡" },
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

// A column is ~65 px on a 360-390 px phone: "Recomendada" overflowed and the
// reasons took 5-6 lines. The column shows only the badge icon; the words are
// in the notes above the table (columnNotes). Screen readers still hear the
// full badge text here.
function BadgeView({ badge }: { badge: Badge }) {
  if (badge.kind === "none") return null;
  const [icon, ...rest] = Array.from(badge.text);
  return (
    <span className="ag-badge ag-badge-icon" data-badge={badge.kind}>
      <span aria-hidden="true">{icon}</span>
      <span style={visuallyHidden}>{rest.join("")}</span>
    </span>
  );
}

type ColumnNote = { kind: Badge["kind"]; text: string };

/**
 * One note per column badge, in column order after the recommended one:
 * "✓ Recomendada: Op.1 (Gandul → Nada)", "⚠ Actual: <reason>",
 * "✗ Op.2 no recomendada: <reason>".
 */
function columnNotes(columns: RotationOption[], lang: Lang): ColumnNote[] {
  const copy = comparisonCopy(lang);
  const notes: ColumnNote[] = [];
  columns.forEach((option, index) => {
    const kind = columnBadge(option).kind;
    const title = copy.columnTitles[index] ?? "";
    const reason =
      (lang === "en" ? option.not_recommended_reason_en : option.not_recommended_reason) ?? "";
    if (kind === "recommended") {
      notes.unshift({
        kind,
        text: copy.recommendedNote(title, sequenceLabel(option.sequence, lang)),
      });
    } else if (kind === "warning") {
      notes.push({ kind, text: copy.warningNote(title, reason) });
    } else if (kind === "not_recommended") {
      notes.push({ kind, text: copy.notRecommendedNote(title, reason) });
    }
  });
  return notes;
}

type ComparisonTableProps = {
  options: RotationOption[];
  onSelect: (index: number) => void;
};

/** Always three columns: Actual, Op.1, Op.2. Bars come with their number, never color alone. */
export function ComparisonTable({ options, onSelect }: ComparisonTableProps) {
  const lang = useLang();
  const copy = comparisonCopy(lang);
  const columns = orderOptions(options);
  const recommended = (index: number) =>
    columns[index] && columnBadge(columns[index]).kind === "recommended"
      ? "ag-col-recommended"
      : "";
  return (
    <table className="ag-table">
      {/* Visible and the table's name: without it "Menos riesgo 5" could read as more risk. */}
      <caption
        className="ag-muted"
        style={{ captionSide: "top", textAlign: "left", padding: "0 4px 6px" }}
      >
        {copy.scaleNote}
      </caption>
      <thead>
        <tr>
          <th>
            <span style={visuallyHidden}>{copy.criterion}</span>
          </th>
          {copy.columnTitles.map((title, index) => {
            const option = columns[index];
            return (
              <th key={title} scope="col" className={recommended(index)}>
                <button type="button" className="ag-btn ag-colhead" onClick={() => onSelect(index)}>
                  {title}
                </button>
                {option ? (
                  <>
                    <div style={{ fontSize: 13, fontWeight: 400, marginTop: 4 }}>
                      {sequenceLabel(option.sequence, lang)}
                    </div>
                    <BadgeView badge={columnBadge(option, lang)} />
                  </>
                ) : null}
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {CRITERIA.map(({ key, icon }) => (
          <tr key={key}>
            <th scope="row">
              <span aria-hidden="true">{icon}</span>
              {` ${copy.criteria[key]}`}
            </th>
            {copy.columnTitles.map((title, index) => (
              <td key={title} className={recommended(index)}>
                {columns[index] ? <ScoreBar value={columns[index].criteria[key]} /> : "—"}
              </td>
            ))}
          </tr>
        ))}
        <tr>
          <th scope="row">{copy.confidence}</th>
          {copy.columnTitles.map((title, index) => {
            const option = columns[index];
            const low = option?.confidence === "low";
            return (
              <td
                key={title}
                data-low-confidence={low ? "true" : undefined}
                className={low ? "ag-low" : recommended(index)}
              >
                {option ? confidenceText(option.confidence, lang) : "—"}
              </td>
            );
          })}
        </tr>
        <tr>
          <th scope="row">{copy.bareMonths}</th>
          {copy.columnTitles.map((title, index) => (
            <td key={title} className={recommended(index)}>
              {columns[index] ? columns[index].bare_months.length : "—"}
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  );
}

function TableSkeleton({ label }: { label: string }) {
  return (
    <div aria-busy="true">
      <span style={visuallyHidden}>{label}</span>
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
  const lang = useLang();
  const copy = comparisonCopy(lang);
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
      {copy.back}
    </button>
  );

  if (state.status === "loading") {
    return (
      <Page>
        {back}
        <TableSkeleton label={copy.loading} />
        {state.slow ? (
          <output className="ag-info" style={{ display: "block" }}>
            {copy.slow}
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
          <p>{copy.loadError}</p>
          {state.error === "not_found" ? null : (
            <button type="button" className="ag-btn ag-primary" onClick={onRetry}>
              {copy.retry}
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
        title={copy.detailTitles[selected] ?? ""}
        onBack={() => setSelected(null)}
      />
    );
  }

  const summary = summaryMessage(state.options, lang);
  const notes = columnNotes(columns, lang);
  return (
    <Page>
      {back}
      {summary ? <p className="ag-info">{summary}</p> : null}
      {notes.length > 0 ? (
        // Stacked on phones; a row of up to 3 cards on tablets and desktops (.ag-notes).
        <div className="ag-notes">
          {notes.map((note) => (
            <p key={note.text} className="ag-note" data-badge={note.kind}>
              {note.text}
            </p>
          ))}
        </div>
      ) : null}
      {/* Picking an option is the main action here, so the hint sits right above the table. */}
      <p style={{ fontWeight: 600, margin: "12px 0 6px" }}>{copy.tapOption}</p>
      <div className="ag-card" style={{ padding: "8px 4px" }}>
        {/* Safety net: a long English word scrolls inside the table, never the page. */}
        <div className="ag-table-wrap">
          <ComparisonTable options={state.options} onSelect={setSelected} />
        </div>
      </div>
      <p className="ag-muted">{copy.aid}</p>
      {/* Secondary: it changes the question, it is not the next step. */}
      <button
        type="button"
        className="ag-btn"
        style={{ width: "100%" }}
        onClick={onChangePriorities}
      >
        {copy.changePriorities}
      </button>
    </Page>
  );
}

export type ComparisonScreenProps = {
  request: RecommendationRequest;
  /** "← Sus cultivos": back to the form. */
  onBack: () => void;
  /** "Cambiar prioridades": show the form at the priorities block, answers kept. */
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
