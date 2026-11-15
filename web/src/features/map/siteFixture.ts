// web/src/features/map/siteFixture.ts
// Datos de relleno del paquete (no son datos reales). Cuando se confirme el
// nombre del archivo en contracts/examples/, se cambia por ese ejemplo.
import type { DemoPoint, SiteProfile, SiteRisk } from "../../contracts/contracts";

export const caniculaRisk: SiteRisk = {
  id: "canicula",
  level: "high",
  period_months: [7, 8],
  value: 0.7,
  threshold: 0.67,
  unit: "share of years 1991-2020",
  source: "NASA POWER (PRECTOTCORR diario, 1991-2020)",
  estimated: false,
  explanation_es:
    "Racha seca larga a mediados de julio y agosto. La lluvia de NASA POWER es una estimación regional.",
};

export const bareFieldRisk: SiteRisk = {
  id: "bare_field",
  level: "medium",
  period_months: [12, 1, 2, 3, 4],
  value: 5,
  threshold: null,
  unit: "meses",
  source: "Calendario de siembra y catálogo de cultivos",
  estimated: true,
  explanation_es:
    "Suelo sin cultivo de diciembre a abril (estimado, con la rotación típica maíz → frijol).",
};

export const chiquimulaSite: SiteProfile = {
  location: { lat: 14.7, lon: -89.5 },
  cell_polygon: {
    type: "Polygon",
    coordinates: [
      [
        [-89.6875, 14.25],
        [-89.0625, 14.25],
        [-89.0625, 14.75],
        [-89.6875, 14.75],
        [-89.6875, 14.25],
      ],
    ],
  },
  cell_resolution_km: 60,
  climate: {
    monthly_precip_mm: [5, 5, 10, 40, 110, 190, 150, 160, 190, 150, 40, 10],
    monthly_tmax_c: [29, 30, 32, 33, 32, 30, 30, 30, 29, 28, 28, 28],
    dekadal_precip_mm: [
      2, 2, 1, 2, 2, 1, 3, 3, 4, 10, 15, 15, 30, 40, 40, 70, 60, 60, 60, 40, 50, 50, 50, 60, 60, 70,
      60, 60, 50, 40, 20, 10, 10, 4, 3, 3,
    ],
  },
  soil: { clay_pct: 30.0, sand_pct: 40.0, ph: 6.5, soc_g_kg: 12.0 },
  soil_sample_location: { lat: 14.5, lon: -89.375 },
  risks: [caniculaRisk, bareFieldRisk],
};

export const chiquimulaPlace: DemoPoint = {
  id: "chiquimula",
  name_es: "Chiquimula",
  location: { lat: 14.7, lon: -89.5 },
};

// Relleno: nombre y coordenadas reales llegan con demo_points.json (paquete 01).
export const outsidePlace: DemoPoint = {
  id: "fuera_de_region",
  name_es: "Punto fuera de la región",
  location: { lat: 15.7, lon: -88.6 },
};

export const demoPlaces: DemoPoint[] = [chiquimulaPlace, outsidePlace];
