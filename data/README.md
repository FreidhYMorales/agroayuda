# Data pipeline (`data/`)

Offline pipeline that turns NASA POWER, SoilGrids and geoBoundaries into the files the app reads:
`data/output/*.parquet` (API) and `web/public/data/**` (web). Everything is precomputed; the app
never calls these providers at run time.

```
uv run --package data-pipeline python -m data_pipeline
```

One run downloads what is missing into `data/cache/` (gitignored, so a second run works offline),
computes every POWER cell that intersects the region, and writes all outputs with the same
`data_version` (the run date, `YYYY-MM-DD`). It needs `data/catalog/crops.csv` (engine owner)
and `data/catalog/rotation_templates.csv` (web-results owner).

## Decisions fixed before any cell was computed (Sat 2026-11-14)

| Item | Value | Source |
|---|---|---|
| Dry-spell length N | **20** consecutive dry days in July-August | [7] about 20 consecutive days without rain in Jul-Aug (38-station mean, 1971-1995; about 30 in 1996-2019); [8] canícula lasts 20-65 days. N = 20 is the lower bound both support. |
| Cut-offs (share of the 30 years 1991-2020) | low < 1/3, medium 1/3 to 2/3 (both edges medium), high > 2/3 | Team plan (`docs/spec.md`); never tuned after seeing a cell |
| Period | July-August, 1991-2020, daily `PRECTOTCORR` | `docs/spec.md` |

These values live in code as `data_pipeline.features.DRY_SPELL_N_DAYS` / `DRY_DAY_MM` and
`engine.risks.LOW_BELOW` / `HIGH_ABOVE`.

## Dry-day definition check (region-wide, Sat 2026-11-14)

Rule order from the plan: (a) dry day < 1 mm; (b) only if (a) shows no dry spells anywhere,
< 10 % of the cell's mean daily Jul-Aug rain; (c) only if neither works, a dekadal-ratio rule.

Rule (a) was run over all 10 region cells:

| Cell | Mean Jul-Aug rain (mm/day) | Longest Jul-Aug dry run in 30 years (days) | Years with ≥ 20 days | Share |
|---|---|---|---|---|
| 13.5_-90.0 | 6.94 | 13 | 0 | 0.00 |
| 14.0_-90.0 | 5.65 | 28 | 1 | 0.03 |
| 14.0_-89.375 | 5.42 | 25 | 1 | 0.03 |
| 14.5_-90.625 | 6.42 | 11 | 0 | 0.00 |
| 14.5_-90.0 | 5.34 | 22 | 1 | 0.03 |
| **14.5_-89.375** (golden) | 5.15 | 25 | 1 | 0.03 |
| 15.0_-90.625 | 6.37 | 8 | 0 | 0.00 |
| 15.0_-90.0 | 5.57 | 17 | 0 | 0.00 |
| 15.0_-89.375 | 5.24 | 19 | 0 | 0.00 |
| 15.5_-89.375 | 5.50 | 10 | 0 | 0.00 |

Rule (a) shows dry spells of 20+ days in 4 cells, so **rule (a) is used**; (b) and (c) were not
needed. Stored in `SiteData.dry_spell_rule`:

> dry day < 1 mm (PRECTOTCORR); at least 20 consecutive dry days in Jul-Aug, 1991-2020 (adaptado
> de refs [7] [8]; official INSIVUMEH index pending)

**Result: canícula is "low" in every region cell** (at most 1 year in 30). POWER rain is a
0.5° x 0.625° model estimate (MERRA-2 based), and model drizzle breaks up dry runs that station
data shows, so long runs of days under 1 mm are rare in POWER. The cut-offs were not changed.

## Golden cell

- Chiquimula (14.70, -89.50) snaps to the node (14.5, -89.375): **cell id `14.5_-89.375`**,
  bounds (-89.6875, 14.25, -89.0625, 14.75).
- The documented rule on its real data: only 1994 (25 days) reaches 20 days, share 1/30 = 0.03,
  level **low** (`data/tests/test_golden_canicula.py`, fixture
  `data/tests/fixtures/power_jul_aug_14.5_-89.375.csv`).
- The golden cell is not high and no cell is high, so (`docs/spec.md`) `demo_points.json` keeps
  Chiquimula and the demo shows the comparison without F1/F2 badges.

## Soil (SoilGrids 2.0)

- REST `properties/query`, properties clay, sand, phh2o, soc, value `mean`, sampled at the cell
  center (`soil_sample_lat/lon` = the center; null when SoilGrids returns nothing there).
- **Depth: 5-15 cm.** One SoilGrids layer in the middle of the 0-30 cm topsoil where maize and
  bean roots are densest; it avoids the 0-5 cm surface peak in organic carbon.
- Scaling: SOC dg/kg, pH x10, clay and sand g/kg; all divided by 10 -> g/kg, pH, %.
- Two of the 10 cell centers return no data (13.5_-90.0, over the Pacific; 15.5_-89.375): their
  soil fields are null and the cell gets a `missing_data` risk. SHOULD 1 (nearest non-null value
  inside the region) would fill them.
- **Low-SOC threshold: PENDING.** Must be fixed with a citation before the engine uses it.
  For reference, SOC at 5-15 cm in the 8 cells with data is 24.7-39.9 g/kg.

## Region and grid

- Region: Chiquimula (GT-CQ), Jutiapa (GT-JU), Zacapa (GT-ZA), El Progreso (GT-PR), Jalapa (GT-JA),
  from geoBoundaries gbOpen GTM ADM1, simplified geometry (release commit `9469f09`).
- `region.parquet` holds every ring of the 5 departments (one row per ring, even-odd rule in the
  API). `region.geojson` holds one feature per department.
- Grid: POWER nodes at lat = -90 + 0.5 i, lon = -180 + 0.625 j, round half up (same as
  `api/src/api/geo.py`); every cell that intersects the region: **10 cells**.

## Outputs

| File | Content |
|---|---|
| `data/output/sites.parquet` | One `SiteData` row per cell, risks precomputed by `engine.risks.site_risks` |
| `data/output/region.parquet` | Region rings, column `ring DOUBLE[][]` |
| `data/output/crops.parquet`, `rotation_templates.parquet` | `data/catalog/*.csv`, CSV row order kept |
| `web/public/data/layers/rain.geojson` | One Polygon per cell, feature `id` = `cell_id`, `RainCellProperties` (annual normal in mm/año), top-level `data_version` |
| `web/public/data/region.geojson` | The 5 departments, top-level `data_version` |
| `web/public/data/crops.json`, `rotation_templates.json`, `demo_points.json` | Catalogs and the 2 demo points |

## Sources and licences

| Data | Use | Licence / terms |
|---|---|---|
| NASA POWER Daily API, `PRECTOTCORR` and `T2M_MAX`, community AG, 1991-2020 (https://power.larc.nasa.gov/) | Climate normals, dry spells, rain layer | Free and open, no restrictions. Acknowledgement: "These data were obtained from the NASA Langley Research Center (LaRC) POWER Project funded through the NASA Earth Science/Applied Science Program." |
| SoilGrids 2.0, ISRIC - World Soil Information (https://soilgrids.org/) | Soil at cell centers | CC BY 4.0 |
| geoBoundaries gbOpen GTM ADM1 (https://www.geoboundaries.org/), source OpenStreetMap | Region outline | ODbL 1.0 (© OpenStreetMap contributors) |

## References

- [7] Ochoa-Orozco, W. A., Rivera-Ramos, P. F., & Herrera, E. (2022). Comportamiento meteorológico
  durante la sequía de medio verano en Guatemala. *Ciencia, Tecnología y Salud*, 9(2).
  https://doi.org/10.36829/63CTS.v9i2.1284
- [8] Orrego León, E. A., González Batres, N. C., & Hernández Quevedo, M. P. (2022). La canícula y
  su comportamiento en Guatemala. *Revista Mesoamericana de Biodiversidad y Cambio Climático -
  Yu'am*, 6(1), 2-18.
