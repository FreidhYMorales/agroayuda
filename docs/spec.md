# Build spec: AgroAyuda

> Written before the event (2026-11-13) as part of the team's planning; see the SI disclosure on the project page.

The rules the team builds against: contracts list, engine rules (incl. Scoring v1), screen rules, states and copy, demo data. The Pydantic models in `contracts/src/` are the source of truth for field shapes once frozen at H2; this file is the source for behavior and copy. Values change only with a cited source, never to make a test pass.

## Product (v1)

A phone-first web app for farmers in Guatemala's Dry Corridor. The farmer picks a point on a map with a NASA rainfall layer (source visible), sees the site's risks (canícula, bare-field period, heat, missing data) in plain language, enters the current primera/postrera crops, priorities and irrigation, and compares the current rotation against two alternatives from a curated list of local rotations, ranked by the farmer's priorities. Each option shows why, NASA evidence, benefits, missing data and what to check with a local technician.

- Web, mobile-first: Chrome/Safari last 2 versions; phone width (~360 px) first; tablet (>= 768 px) and desktop (>= 1200 px) views that reuse the same screens and flow (work package 09). Public URL (Vercel web + Render API).
- Out of scope: native apps, offline mode, desktop-only screens or flows, accounts. No user data is stored server-side.

**Primary user:** the farmer (a technician may accompany). Copy rules: usted throughout; short plain sentences; icon plus text, never color alone; no jargon on the first level; sources, confidence and technical detail one tap away ("¿De dónde sale este dato?").

## Core model

```
Region             native NASA POWER grid cells + crop catalog + rotation templates
                   + season calendar; data files
Site               cell -> monthly + dekadal climate normals, soil sample (nullable),
                   cell polygon, cell_resolution_km, risks
SiteRisk           computed in engine (risks.py) from Site
Crop               catalog row; id is a frozen CropId literal
RotationTemplate   curated local rotation (primera, postrera) with source
FarmerInput        location, current_rotation, priorities (1-5 x4), constraints
Strategy           crop per season; is_current; recommended
Evaluation         criteria, deltas vs current, confidence, reasons, evidence, benefits,
                   data_gaps, local_review

Flow: pick point -> site risks -> current rotation + priorities -> compare 3 strategies
```

## Contracts (frozen by the lead at H2)

- `CropId` (frozen 2026-11-14): `maiz`, `frijol`, `maiz_frijol` (asocio), `maicillo`, `gandul`, `mucuna` (abono verde), `canavalia` (abono verde), `ajonjoli`, `ayote`, `none`. Every id is a crop grown in Guatemala with a cited source (`docs/crop-sources.md`). A test checks `crops.csv` covers exactly these ids. Adding a crop is a contract change (lead): new id, regenerated schema and TS types, and the `crops.csv` row in the same PR.
- `Level = Literal["low", "medium", "high", "unknown"]`; `Confidence = Literal["low", "medium", "high"]`; `Tier = Literal["low", "medium", "high"]`; months are integers 1-12; scores are integers 1-5.
- `Location { lat: float, lon: float }`; `Polygon { type: "Polygon", coordinates: float[][][] }` (hand-written, no new dependency).
- `Priorities { water: 1-5, soil: 1-5, income: 1-5, risk: 1-5 }` (default 3 each).
- `RecommendationRequest { location, current_rotation: { primera: CropId, postrera: CropId }, priorities, constraints: { irrigation: bool } }` (`none` is a valid CropId for an empty season).
- `SiteRisk { id: Literal["canicula", "bare_field", "heat", "missing_data"], level, period_months: int[], value: float | null, threshold: float | null, unit: str, source: str, estimated: bool, explanation_es: str }`
- `SiteProfile { location, cell_polygon: Polygon, cell_resolution_km, climate: { monthly_precip_mm[12], monthly_tmax_c[12], dekadal_precip_mm[36] }, soil: { clay_pct, sand_pct, ph, soc_g_kg } (each nullable, sampled at the cell center; nearest non-null offset is SHOULD 1), soil_sample_location: Location | null, risks: SiteRisk[] }`
- `Criteria { water: 1-5, soil: 1-5, income: 1-5, risk: 1-5 }`; `Delta = Literal["better", "same", "worse"]`
- `Evidence { text_es: str, dataset: str, value: str }`
- `RotationOption { sequence: { primera: CropId, postrera: CropId }, is_current: bool, recommended: bool, not_recommended_reason: str | null, bare_months: int[] (months 1-12 with no crop in the field), criteria, delta_vs_current: { water, soil, income, risk: Delta }, confidence, reasons: str[], evidence: Evidence[], benefits: str[], data_gaps: str[], local_review: str[] }`
- `RecommendationResponse { site: SiteProfile, options: RotationOption[] }` (exactly 3: current + 2 alternatives).
- `ErrorResponse { error: Literal["outside_region", "invalid_request", "not_found", "internal"], detail: str }` mapped to HTTP 404, 422, 404, 500. Both `/site` and `/recommendations` return `outside_region` for the same points. One example fixture per code.
- Static-file models (same freeze, with examples):
  - `CropCatalogEntry { id: CropId, name_es, icon (emoji from Unicode 11 or earlier, or a small SVG path; always shown with the text label), seasons: ("primera"|"postrera")[], cycle_days, water_need: Tier, n_fixing: bool, root_depth: Literal["shallow","deep"], erosion_cover: Tier, drought_tolerance: Tier, market_tier: Tier, local_source: bool (true when the values come from a Guatemalan source such as ICTA/MAGA, false when only generic FAO values exist), source }`
  - `RotationTemplate { id, primera: CropId, postrera: CropId, description_es, source }`
  - `DemoPoint { id, name_es, location }`
  - `RainCellProperties { value_mm (1991-2020 annual normal), unit, source, resolution_km }`
- `SiteData` (one Parquet row per POWER cell, input of `risks.py`, frozen at H2): `{ cell_id, lat, lon, cell_polygon: Polygon, monthly_precip_mm[12], monthly_tmax_c[12], dekadal_precip_mm[36], dry_spell_year_share: float, dry_spell_rule: str, soil: { clay_pct, sand_pct, ph, soc_g_kg } (nullable), soil_sample_lat: float | null, soil_sample_lon: float | null, data_version: str (pipeline run date), risks: SiteRisk[] (precomputed) }`. The API maps `SiteData` to `SiteProfile`; it never reads files other than Parquet.
- Codegen: one combined schema `contracts/schema/contracts.schema.json` (`uv run --package contracts python -m contracts.export`) -> `web/src/contracts/contracts.ts` (`npm --prefix web run contracts`, `json-schema-to-typescript` with `ignoreMinAndMaxItems`); lengths stay validated in Pydantic. CI fails if either file drifts from the models.
- Fixtures: `contracts/examples/<model>[_variant].json`; a test validates each one against its model. Catalog and template fixtures are marked "EXAMPLE FIXTURE, not real data".

### Files

- Sources live in `data/catalog/` (`crops.csv` owned by the engine owner, `rotation_templates.csv` owned by the web-results owner; ownership is by agreement, no CODEOWNERS file).
- One pipeline run emits `data/output/*.parquet` (incl. `crops.parquet` and `rotation_templates.parquet`, one schema each, read by the API) and `web/public/data/` (`layers/rain.geojson`, `crops.json`, `rotation_templates.json`, `demo_points.json`, `region.geojson`, `region_mask.geojson`), owned by the data owner.
- Tests in `data/`: catalog covers exactly `CropId`; `rain.geojson` cells equal Parquet cells; POWER fill value -999 becomes NaN before any statistic.
- `data_version` is written into the Parquet, the static files and `/health`; the phone check compares them after each deploy.

### Grid and region

- POWER grid: nodes are cell centers (lat = -90 + 0.5 i, lon = -180 + 0.625 j; bounds ± half a step). Point -> cell is arithmetic snapping to the nearest node. Unit test on the Chiquimula cell bounds. A cell is 0.5° x 0.625° (~55 x 67 km at 14.7° N); the UI says "zona de unos 60 km de lado".
- Region = Chiquimula, Jutiapa, Zacapa, El Progreso and Jalapa (geoBoundaries ADM1, simplified), written by the pipeline as `region.geojson` (web) and `region.parquet` rings (API). Point-in-region uses hand-written MultiPolygon ray casting in `api/` (no new dependency, edge tests); the point is then snapped to its POWER cell.
- The grid includes every POWER cell that intersects the region (roughly 10-14 cells), so a tap inside the region always highlights the cell that contains it. Cells are drawn whole, with the region outline above them and the area outside the region dimmed by `region_mask.geojson` (world ring with the region as holes), so a tap on a dimmed part reads as "outside" rather than a bug.

### Confidence and missing data

- Confidence is per option: factors = (1 if any of the site's soil fields is null) + (number of non-`none` crops in the option with `local_source=false`); 0 = high, 1 = medium, 2 or more = low. The bare-field estimate is always `estimated=true` and is not a factor. If every option comes out low, that is the honest result and the UI shows it; values are never tuned to change it.
- `missing_data` risk fires when any soil field is null or a climate series has NaN after the -999 cleanup; its level is `unknown` and it sorts last.

## Engine rules

- Season calendar: constants in `engine/src/engine/calendar.py` (source: team research guide, sec. 2): primera planted in May, postrera planted in September (one month pinned for the bare-month count; the sources give August-September). Shared by `risks.py` and the bare-month count.
- Selection: templates are season-valid by construction (test in `data`). Score every template that differs from the current rotation. Slot 1 = the best passing alternative (if any); slot 2 = the best remaining template, passing or not; if none passes, the top 2 by score. Only site-risk failures set `recommended=false` with `not_recommended_reason`; they never remove a template. The catalog has enough templates that every season-valid current rotation (including none/none) yields 3 distinct options.

### Scoring v1

Values change only with a test.

| Step | Rule |
|---|---|
| Tier to number | low = 1, medium = 2, high = 3 |
| Water (per crop) | 7 - 2 x water_need (low 5, medium 3, high 1). "Water" means water saved, so irrigation never raises it |
| Soil (per crop) | 1 + 2 x n_fixing + (erosion_cover - 1); if the site's SoilGrids SOC is below the low-SOC threshold (cited and fixed in `data/README.md` at H2), n_fixing crops get +1 more and the option gets an `Evidence` item citing SoilGrids SOC; null soil -> no adjustment plus a `data_gaps` line |
| Income (per crop) | market_tier 1 -> 1, 2 -> 3, 3 -> 5 |
| Risk (per crop) | drought_tolerance 1 -> 1, 2 -> 3, 3 -> 5; primera crops lose 1 if canícula is high, 0.5 if medium (the canícula falls in the primera cycle); with irrigation, high-water crops get +1 |
| `none` row | water 5, soil 1, income 1, risk 5 (fallow saves water but leaves soil bare and earns nothing); exempt from the canícula penalty |
| Long-cycle primera | when postrera is `none` and the primera crop still covers the postrera planting month (`calendar.py` + `cycle_days`, e.g. gandul, canavalia), postrera scores with the primera crop's row instead of the `none` row; the canícula penalty stays on primera only; bare months are unchanged |
| Season combination | water, soil, income = mean of primera and postrera; risk = min of the two |
| Bare months | soil - 0.5 when `bare_months` has 6 or more months |
| Clamp and rank | clamp each criterion to 1-5 as a float; weighted score = sum(priority x criterion) / sum(priority); rank on floats; tie-break by CSV order; `criteria` in the response are rounded with `math.floor(x + 0.5)` (not Python `round`, which rounds half to even; unit test at 2.5) |
| Deltas | computed from the rounded integer criteria, so bars and arrows always agree: better if higher, worse if lower, else same |
| Failure rules (`recommended=false`, option still shown) | F1: canícula high and primera crop water_need high and no irrigation -> "Necesita mucha agua justo en la canícula". F2: canícula high and primera crop drought_tolerance low and no irrigation -> "Aguanta poco la sequía de la canícula" |

### Recommendation and texts

- `recommended` is true for the best passing alternative only, and only when its priority-weighted score is strictly greater than the current rotation's; never for the current one. If no alternative beats the current, none is recommended and the UI says "Su rotación actual ya es la mejor para sus prioridades" (both alternatives still shown). Ties break by template order in `rotation_templates.csv`.
- One `reasons` line cites the farmer's top priority. When several priorities tie at the top it names none as "the" priority: it lists each tied one with the option's score, in the order water > soil > income > risk ("Usted dio la misma importancia a varias cosas. Esta opción saca: cuidar el agua 4 de 5 y el ingreso 3 de 5.").
- `bare_months` lists the months each option leaves the field bare (from `calendar.py` and `cycle_days`).
- Irrigation lifts the risk criterion of high-water crops and disables F1/F2.
- The current rotation also gets F1/F2 checks: its `not_recommended_reason` is shown as a ⚠ warning on the current column (never "No recomendada").
- Engine input errors (e.g. a crop in a season it does not support, from an edited URL) raise a typed `InvalidRequestError`; the API maps it to 422 `invalid_request`. The API also handles `HTTPException` (unknown route -> 404 `not_found` as `ErrorResponse`). One API test each.

### Required engine tests

- Water-first (5/3/3/3) vs income-first (1/1/5/1) at Chiquimula with maíz -> maicillo each return a non-null recommended option, and the two differ (pinned 2026-11-14 on the real data and templates: gandul -> none vs maíz -> frijol; with maíz -> frijol as the current rotation nothing beats it on income, so it cannot be the demo rotation). The demo vectors and current rotation are pinned at H2 from hand-computed scores on the real `crops.csv`; more extreme vectors (5/1/1/1 vs 1/1/5/1) or another current rotation may be used instead of changing values.
- A current rotation that beats every alternative yields no recommended option.
- Ties resolve by CSV order.
- Every season-valid current rotation yields 3 distinct options.
- Irrigation changes the risk criterion, never the water criterion.

### Risks (`risks.py`, pure, run by the data pipeline; results stored in `SiteData.risks`)

- **Canícula:** dry-spell frequency from daily NASA POWER rainfall, 1991-2020: share of years with at least N consecutive dry days in July-August, mapped to low/medium/high.
  - N comes from refs [7] https://revistas.usac.edu.gt/index.php/cytes/article/download/1284/993/6098 and [8] https://revistayuam.com/wp-content/uploads/2025/10/La-canicula-y-su-comportamiento-en-Guatemala.pdf. The share cut-offs are fixed in `data/README.md` before any cell is computed (low < 1/3 of years, medium 1/3-2/3, high > 2/3); they are never changed after looking at the golden cell.
  - The H0-H2 check only chooses the dry-day definition, over the whole region, never one cell: (a) < 1 mm; (b) if that shows no dry spells anywhere, < 10 % of the cell's mean daily July-August rain; (c) if neither works, a documented dekadal-ratio rule. The rule used is stored in `dry_spell_rule`, labeled "adaptado de" refs [7] [8] (official INSIVUMEH index pending); N, cut-offs and date go in `data/README.md`.
  - `explanation_es` and `data_gaps` mention that POWER rain is a regional estimate (MERRA-2 source change). The UI shows the share next to the level (e.g. "en 18 de 30 años"). The period text comes from `explanation_es`.
  - Tests: a synthetic fixture with fewer and shorter dry spells (not just scaled rain) gives a lower level (`engine`); the golden cell's level equals the documented rule applied to its data (`data`).
- **Bare field:** uses the same `calendar.bare_months(primera, postrera)` function as the engine, applied to the typical rotation (maíz -> frijol), `estimated=true`; levels: 3 months or fewer = low, 4-5 = medium, 6 or more = high.
  - `bare_months`: a crop covers ceil(cycle_days / 30) months from its planting month, wrapping past December; months covered by either season count as covered. Unit test: maíz -> frijol = Dec-Apr = 5 months.
  - Copy: "Suelo sin cultivo … (estimado, con la rotación típica maíz → frijol)".
- **Heat:** SHOULD.

## Screens

UI copy is Spanish (Guatemala), always "usted". The full request (point, crops, priorities, irrigation, step) lives in the URL query; results are keyed by the full request; missing inputs redirect to step 1.

### 1. Map

```
┌──────────────────────────┐
│ 📍 Usar mi ubicación     │
│[Lluvia]  (+Calor/Suelo*) │
│ ▓▓▒▒░░░░▒▒▓▓▓▒▒░░░░▒▒▓▓▓ │
│ ▓▒▒░░┌─────┐▒▓▓▒▒░░▒▒▓▓▓ │
│ ▒▒░░│  ●  │▓▓▓▒▒░░▒▒▓▓▓ │
│ ▒░░░░└─────┘▓▓▒▒░░▒▒▓▓▓▓ │
│ ░ poca lluvia ▓ mucha    │
│ Dato: NASA POWER ›       │
│──────────── ═ ───────────│
│ Chiquimula               │
│ Zona de unos 60 km de    │
│ lado (dato regional, no  │
│ de su parcela)           │
│ ● Canícula baja          │
│ [ Ver riesgos ]          │
│ [ Ver recomendaciones → ]│
│ O elija un lugar: ›      │
└──────────────────────────┘
 * SHOULD: heat/soil chips, municipio search
```

- Layer chips over the map, with a summary card.
- The selected native data cell is highlighted, not a fixed radius. Every layer shows source and resolution. v1 has one layer (rain). A list of demo places is the non-map alternative (MUST). Latest request wins (abort older `/site` calls).
- States:
  - empty -> "Toque el mapa o elija un lugar de la lista"
  - loading -> grey card
  - slow API (> 5 s) -> "Despertando el servidor, un momento…"
  - error -> message + "Intentar de nuevo"
  - `outside_region` -> "Por ahora solo cubrimos el Corredor Seco. Toque dentro de la línea."
  - geolocation denied -> "No pudimos ver su ubicación. Toque el mapa o elija un lugar."
  - basemap or layer load error -> "No pudimos cargar el mapa; elija un lugar de la lista"
  - basemap tiles failing -> MapLibre falls back to a plain background style that still draws the region, mask and cell GeoJSON.

| UI element | Backend demand |
|---|---|
| Rain layer | Static `layers/rain.geojson` (`RainCellProperties`) |
| Region boundary | Static `region.geojson` (geoBoundaries ADM1) |
| Demo places list | Static `demo_points.json` (`DemoPoint`) |
| My location | Browser Geolocation API |
| Summary card | `GET /site?lat&lon` -> `SiteProfile` or `ErrorResponse` |
| Basemap | OpenFreeMap tiles (keyless) with attribution |

### 2. Site risks (expanded card)

```
┌──────────────────────────┐
│ ← Su parcela             │
│ Riesgos en Chiquimula    │
│──────────────────────────│
│ ⚠ Suelo sin cultivo    › │
│   dic-abr (estimado)     │
│ ● Canícula baja        › │
│   1 de 30 años, jul-ago  │
│ ● Calor moderado *     › │
│ ❔ Suelo: sin dato **   › │
│──────────────────────────│
│ ¿Qué significa esto? ›*  │
│ [ Ver recomendaciones → ]│
└──────────────────────────┘
 * SHOULD: heat risk, glossary, monthly chart inside a risk
 ** only where SoilGrids was fetched and returned null; if soil is cut,
    one data_gaps line "suelo no incluido en esta versión" instead
```

- Risks first, detail one tap away. Sorted by severity; tapping a risk shows a plain explanation, period and "¿De dónde sale este dato?" (source, value, threshold).
- Bare-field period is an estimate and says "estimado". Soil says "muestra cerca del centro de la zona".
- Risk wording is generated from `level` (e.g. "fuerte" for high, "moderada" for medium, "baja" for low; bare field reads "Suelo sin cultivo · alto/moderado/bajo"). Each row has a drawn level badge (⚠ high, ! medium, ✓ low) plus the level in words, never the badge alone; mocks and the video script follow the real level found in the H0-H2 check. ❔ rows appear only for data the system tried to load and did not get.
- States: no strong risks -> "No encontramos riesgos fuertes en esta zona"; loading -> grey rows; error -> "Intentar de nuevo".

| UI element | Backend demand |
|---|---|
| Risk list | `SiteProfile.risks` from `engine/src/engine/risks.py` |
| Risk detail | `SiteRisk.explanation_es`, `value`, `threshold`, `unit`, `source` |
| Glossary (SHOULD) | Static UI copy in `web/` |

### 3. Farmer input (one form)

```
┌──────────────────────────┐
│ ← Su parcela             │
│ (arriba: primera y       │
│  postrera, íconos)       │
│ ¿Qué es lo más           │
│ importante para usted?   │
│ 💧 Ahorrar agua          │
│   ○ ○ ○ ● ○              │
│ 🟫 Cuidar suelo          │
│   ○ ○ ○ ○ ●              │
│ 💰 Ganar más             │
│   ○ ○ ● ○ ○              │
│ 🛡 Menos riesgo          │
│   ○ ○ ○ ● ○              │
│──────────────────────────│
│ ¿Tiene riego? (Sí) (No)  │
│ [ Comparar opciones → ]  │
└──────────────────────────┘
 One scrolling form, three blocks: ¿Qué siembra en primera? (icon grid,
 incl. maíz con frijol) / ¿Y en postrera? (icon grid + "Nada") / priorities
 and irrigation (shown above).
```

- One scrolling form, three blocks. Priorities are tap selectors 1-5 (five circles, targets >= 44 px, label above the circles so the row fits 360 px), default 3. Answers are kept in the URL; crops filtered by season from `crops.json`. Both seasons "Nada" is allowed (fallow; the engine says so).
- States: catalog loading -> skeleton; catalog error -> "Intentar de nuevo"; defaults never block submission.

| UI element | Backend demand |
|---|---|
| Crop options per season | Static `crops.json` (`CropCatalogEntry`) |
| Current rotation, priorities, irrigation | `RecommendationRequest` |
| Crop/season validity, irrigation effect | `engine/` rules |

### 4. Strategy comparison

```
┌──────────────────────────┐
│ ← Sus cultivos           │
│ 👆 Toque una opción para │
│    ver por qué           │
│ Puntaje 1-5: 5 es mejor  │
│          Actual Op.1 Op.2│
│ 💧Ahorrar ▓▓░   ▓▓▓  ▓▓▓▓│
│ 🟫Cuidar  ▓░░   ▓▓▓  ▓▓░ │
│ 💰Ganar   ▓▓▓   ▓▓░  ▓▓░ │
│ 🛡Menos r.▓░░   ▓▓▓  ▓▓░ │
│ Confianza ●●○   ●●○  ●○○ │
│                 ✓    ✗ no│
│                 recom.   │
│ ⓘ Esto es una ayuda; no  │
│   reemplaza su criterio  │
│ [ Cambiar prioridades ]  │
└──────────────────────────┘
 Tap a column -> detail:
┌──────────────────────────┐
│ ← Comparación            │
│ Opción 1                 │
│ Maíz con frijol →        │
│ Maicillo                 │
│ Comparada con lo actual: │
│ 💧 Agua     ▲ mejor      │
│ 💰 Ingreso  ▼ menos      │
│ Confianza: ●●○ media     │
│ Por qué: …(1 línea)      │
│ Evidencia (datos): …     │
│ Beneficio: …             │
│ ⚠ Consulte con un técnico│
│ ❔ Lo que no sabemos: …   │
└──────────────────────────┘
```

- Comparison table; tapping a column opens the detail. Always exactly 3 columns (current + 2 alternatives); at most one alternative is "Recomendada", and none when the current rotation scores best ("Su rotación actual ya es la mejor para sus prioridades").
- Badges per column are icons only (a column is ~65 px at 360 px, too narrow for words): ✓ if `recommended`; ✗ if an alternative has `not_recommended_reason`; ⚠ on the current column when it has one; otherwise no badge. The words go in notes above the table, recommended first: "✓ Recomendada: Op.1 (Gandul → Nada)", "⚠ Actual: <reason>", "✗ Op.2 no recomendada: <reason>". Screen readers still hear the full badge text in the column. If the current rotation is the best but carries a ⚠, the message adds "pero tenga cuidado con la canícula".
- Evidence items are labelled "Evidencia (datos)" with the dataset named per item (NASA POWER, SoilGrids). Bars plus text/icons, never color alone. Crop values say "valor general, validar localmente". Each option states how many months it leaves the field bare (row "Meses sin cultivo").
- "Cambiar prioridades" scrolls the form to the priorities block with the current answers and recomputes.
- The option detail is a plain list: crops, deltas, confidence, then one line each for why, evidence, benefits, check with a technician, what we do not know.
- States: loading -> table skeleton; slow API -> "Despertando el servidor…"; 5xx or network error -> "Intentar de nuevo"; 422 (`invalid_request`, e.g. stale link) -> back to the form with valid answers kept, "Revise sus respuestas"; `outside_region` -> back to the map with "Por ahora solo cubrimos el Corredor Seco"; low confidence -> highlighted in the column.

| UI element | Backend demand |
|---|---|
| Table rows | `RotationOption.criteria`, `is_current`, `recommended`; row "Meses sin cultivo" from `bare_months` |
| ▲▼ vs current | `delta_vs_current` from `engine/` |
| Confidence | `confidence` from data completeness |
| Detail sections | `reasons`, `evidence`, `benefits`, `local_review`, `data_gaps`, `not_recommended_reason` |

## Demo data

- Golden point: Chiquimula (14.70 N, -89.50 W), snapping to the POWER cell centered at (14.5, -89.375); its id goes in `data/README.md`. Expected: canícula risk equals the documented rule applied to the cell's real data (H0-H2 check, 2026-11-14: "low", 1 of 30 years with a 20+ day dry spell; every region cell is low, see `data/README.md`); current rotation maíz (primera) -> maicillo (postrera); exactly 3 options; water-first (5/3/3/3) recommends gandul -> none and income-first (1/1/5/1) recommends maíz -> frijol (engine golden test).
- If the golden cell is not high, the demo uses the highest-share cell in the region (its name in `demo_points.json`); if no cell is high, the demo shows the comparison without F1/F2 badges. Cut-offs are never tuned.
- Contrast for tests: a synthetic wetter fixture (not a real cell).
- ❔ demo: only if a null-soil cell exists once the grid exists; otherwise uncertainty shows through "estimado" (bare field) and the confidence row.
- A point outside the region, to show the `outside_region` state.
- Fixtures in `contracts/examples/`; data in `data/output/` and `web/public/data/`.

### Demo flow

1. Map with the NASA rainfall layer and source visible -> pick Chiquimula.
2. Site risks: canícula (dry spells from NASA POWER daily data) and bare-field period marked "estimado".
3. Form: maíz -> maicillo, water first (5/3/3/3), no irrigation.
4. Comparison: current vs 2 alternatives, trade-offs and bare months visible, one "Recomendada"; open it to show evidence, gaps and "consulte con un técnico". Tap "Cambiar prioridades", set income first (1/1/5/1: water, soil and risk on 1, income on 5), and show the recommendation change (gandul -> nada to maíz -> frijol).

## Data sources and attribution

- NASA POWER is the core dataset (listed in the challenge Resources). Branding: no NASA logos or insignia; text "Datos: NASA POWER" only.
- SoilGrids, FAO ECOCROP and geoBoundaries are supplements. Respect each site's data-use terms: source and licence in the README and in the UI source line.
- SoilGrids is a point sample: taken at the cell center (nearest non-null offset is SHOULD 1), labeled "muestra cerca del centro de la zona".
- Crop attributes: FAO ECOCROP, AquaCrop-OSPy / FAO-56 for water and roots, ICTA/MAGA guides for local varieties, calendars and rotations; USDA PLANTS only as "referencia general (EE. UU.)". Every value cites its source.
- Income is a qualitative market tier, not prices.
- NASA POWER requests use exact node coordinates; raw responses are cached in `data/cache/` (gitignored) with retry and backoff.

## Deferred to v2

Live data for any point; other regions; a catalog data-entry view; global crop database; satellite NDVI, soil moisture and SI pattern detection; SRTM slope and erosion risk; scenario sliders and timelines; read-aloud; offline mode, accounts, saved farms.
