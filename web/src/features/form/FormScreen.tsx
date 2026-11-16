import { useEffect, useRef, useState } from "react";
import type { CropCatalogEntry, CropId, Priorities } from "../../contracts/contracts";
import { useLang } from "../../lib/urlState";
import { cropLabel } from "../comparison/cropLabels";
import { Page, visuallyHidden } from "../comparison/theme";
import { formCopy } from "./copy";

/** Same field names as `AppState` (web/src/lib/urlState.ts), so `onChange` can be its `patch`. */
export type FormValues = {
  primera?: CropId;
  postrera?: CropId;
  priorities: Priorities;
  irrigation?: boolean;
};

export const DEFAULT_PRIORITIES: Priorities = { water: 3, soil: 3, income: 3, risk: 3 };
export const CATALOG_URL = "/data/crops.json";

// The labels come from formCopy, by key.
const PRIORITY_ROWS = [
  { key: "water", icon: "💧" },
  { key: "soil", icon: "🟫" },
  { key: "income", icon: "💰" },
  { key: "risk", icon: "🛡" },
] as const;
const LEVELS = [1, 2, 3, 4, 5] as const;
const TARGET = 48; // px, above the 44 px minimum

type CatalogState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; crops: CropCatalogEntry[] };

async function loadCatalog(): Promise<CropCatalogEntry[]> {
  const response = await fetch(CATALOG_URL);
  if (!response.ok) throw new Error(`catalog ${response.status}`);
  const body: unknown = await response.json();
  if (!Array.isArray(body)) throw new Error("catalog is not a list");
  return body as CropCatalogEntry[];
}

function CropButton(props: {
  icon: string;
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const { icon, label, selected, onSelect } = props;
  return (
    <button type="button" className="ag-btn ag-crop" aria-pressed={selected} onClick={onSelect}>
      <span className="ag-icon" aria-hidden="true">
        {icon}
      </span>
      <span>
        {selected ? <span aria-hidden="true">✓ </span> : null}
        {label}
      </span>
    </button>
  );
}

type CropGridProps = {
  title: string;
  season: "primera" | "postrera";
  crops: CropCatalogEntry[];
  selected: CropId | undefined;
  onSelect: (id: CropId) => void;
};

/** Crops that allow the season, plus "Nada" (an empty season is allowed in both). */
function CropGrid({ title, season, crops, selected, onSelect }: CropGridProps) {
  const allowed = crops.filter((entry) => entry.id !== "none" && entry.seasons.includes(season));
  const none = crops.find((entry) => entry.id === "none");
  const lang = useLang();
  // Spanish keeps the catalog name; English names are kept in the web app by crop id.
  const label = (entry: CropCatalogEntry) =>
    lang === "en" ? cropLabel(entry.id, "en") : entry.name_es;
  return (
    <section className="ag-card">
      <h2>{title}</h2>
      {/* 2 columns on phones; ag-crop-grid gives 3 on tablets and 4 on desktops. */}
      <div className="ag-grid ag-crop-grid">
        {allowed.map((entry) => (
          <CropButton
            key={entry.id}
            icon={entry.icon}
            label={label(entry)}
            selected={selected === entry.id}
            onSelect={() => onSelect(entry.id)}
          />
        ))}
        <CropButton
          icon={none?.icon ?? "⬜"}
          label={cropLabel("none", lang)}
          selected={selected === "none"}
          onSelect={() => onSelect("none")}
        />
      </div>
    </section>
  );
}

function CatalogSkeleton({ label }: { label: string }) {
  return (
    <div aria-busy="true">
      <span style={visuallyHidden}>{label}</span>
      {[0, 1].map((row) => (
        <div
          key={row}
          data-skeleton-row=""
          className="ag-skel"
          style={{ height: 150, margin: 14 }}
        />
      ))}
    </div>
  );
}

const SCALE_HINT_ID = "priority-scale-hint";

function PriorityCircles(props: {
  name: string;
  icon: string;
  label: string;
  value: number;
  describedBy: string;
  onPick: (level: number) => void;
}) {
  const { name, icon, label, value, describedBy, onPick } = props;
  return (
    <fieldset
      aria-describedby={describedBy}
      style={{ border: "none", padding: 0, margin: "0 0 14px" }}
    >
      <legend style={{ padding: 0, marginBottom: 6, fontWeight: 600 }}>{`${icon} ${label}`}</legend>
      <div className="ag-circles">
        {LEVELS.map((level) => {
          const checked = value === level;
          return (
            <label
              key={level}
              className="ag-choice"
              data-checked={checked}
              style={{ width: TARGET, height: TARGET, borderRadius: "50%" }}
            >
              <input
                type="radio"
                name={name}
                value={level}
                checked={checked}
                onChange={() => onPick(level)}
              />
              {level}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export type FormScreenProps = {
  values: FormValues;
  onChange: (patch: Partial<FormValues>) => void;
  onSubmit: () => void;
  /** "← Su parcela": back to the map. */
  onBack: () => void;
  /** Message above the form, e.g. "Revise sus respuestas". */
  notice?: string | null;
  /** Scroll to the priorities block (used by "Cambiar prioridades"). */
  focusPriorities?: boolean;
  onRetryCatalog?: () => void;
};

function FormContent(props: FormScreenProps & { onRetryCatalog: () => void }) {
  const { values, onChange, onSubmit, onBack, notice, focusPriorities, onRetryCatalog } = props;
  const [catalog, setCatalog] = useState<CatalogState>({ status: "loading" });
  const prioritiesRef = useRef<HTMLHeadingElement>(null);
  const copy = formCopy(useLang());

  useEffect(() => {
    let active = true;
    loadCatalog().then(
      (crops) => {
        if (active) setCatalog({ status: "ready", crops });
      },
      () => {
        if (active) setCatalog({ status: "error" });
      },
    );
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (focusPriorities) {
      prioritiesRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    }
  }, [focusPriorities]);

  // Defaults (priorities on 3, no irrigation) never block the submit; only the two crops do.
  const canSubmit = values.primera !== undefined && values.postrera !== undefined;
  const irrigation = values.irrigation === true;

  return (
    <Page>
      <button type="button" className="ag-btn ag-link" onClick={onBack}>
        {copy.back}
      </button>
      {notice ? (
        <p role="alert" className="ag-notice">
          {notice}
        </p>
      ) : null}

      {/* Two columns on tablets and desktops (.ag-cols): crops on the left, priorities and
          irrigation on the right, the submit button below both. DOM order = reading order. */}
      <div className="ag-cols">
        <div>
          {catalog.status === "loading" ? <CatalogSkeleton label={copy.loading} /> : null}
          {catalog.status === "error" ? (
            <div className="ag-card">
              <p>{copy.catalogError}</p>
              <button type="button" className="ag-btn ag-primary" onClick={onRetryCatalog}>
                {copy.retry}
              </button>
            </div>
          ) : null}
          {catalog.status === "ready" ? (
            <>
              <CropGrid
                title={copy.primeraTitle}
                season="primera"
                crops={catalog.crops}
                selected={values.primera}
                onSelect={(id) => onChange({ primera: id })}
              />
              <CropGrid
                title={copy.postreraTitle}
                season="postrera"
                crops={catalog.crops}
                selected={values.postrera}
                onSelect={(id) => onChange({ postrera: id })}
              />
            </>
          ) : null}
        </div>

        <div>
          <section className="ag-card">
            <h2 ref={prioritiesRef}>{copy.prioritiesTitle}</h2>
            {/* Says what the numbers mean; each row of circles points to it for screen readers. */}
            <p id={SCALE_HINT_ID} className="ag-muted" style={{ marginTop: 0 }}>
              {copy.scaleHint}
            </p>
            {PRIORITY_ROWS.map(({ key, icon }) => (
              <PriorityCircles
                key={key}
                describedBy={SCALE_HINT_ID}
                name={`priority-${key}`}
                icon={icon}
                label={copy.priorities[key]}
                value={values.priorities[key]}
                onPick={(level) => onChange({ priorities: { ...values.priorities, [key]: level } })}
              />
            ))}
          </section>

          <fieldset className="ag-card" style={{ margin: "14px 0" }}>
            <legend style={{ fontWeight: 600, padding: "0 4px" }}>{copy.irrigationTitle}</legend>
            <div className="ag-grid">
              {[
                { label: copy.yes, value: true },
                { label: copy.no, value: false },
              ].map(({ label, value }) => (
                <label
                  key={label}
                  className="ag-choice"
                  data-checked={irrigation === value}
                  style={{ minHeight: TARGET, borderRadius: 12, gap: 8 }}
                >
                  <input
                    type="radio"
                    name="irrigation"
                    checked={irrigation === value}
                    onChange={() => onChange({ irrigation: value })}
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <button
          type="button"
          className="ag-btn ag-primary ag-span"
          disabled={!canSubmit}
          onClick={onSubmit}
        >
          {copy.submit}
        </button>
      </div>
    </Page>
  );
}

/** One scrolling page with three blocks: primera, postrera and priorities (+ irrigation). */
export function FormScreen(props: FormScreenProps) {
  const [attempt, setAttempt] = useState(0);
  return (
    <FormContent
      key={attempt}
      {...props}
      onRetryCatalog={() => {
        setAttempt((n) => n + 1);
        props.onRetryCatalog?.();
      }}
    />
  );
}
