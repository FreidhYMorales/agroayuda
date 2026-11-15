// web/src/features/map/siteFixture.ts
// Test fixtures built from the frozen contract examples, so tests fail loudly
// if the examples drift. The JSON files are only read here, never edited.
import type { DemoPoint, SiteProfile, SiteRisk } from "../../contracts/contracts";
import siteProfileJson from "../../../../contracts/examples/site_profile.json";
import siteProfileNullSoilJson from "../../../../contracts/examples/site_profile_null_soil.json";

// JSON modules are typed with wide types (string instead of the literal
// unions), so they are asserted once here against the generated contract types.
export const chiquimulaSite = siteProfileJson as SiteProfile;
export const nullSoilSite = siteProfileNullSoilJson as SiteProfile;

function riskById(site: SiteProfile, id: SiteRisk["id"]): SiteRisk {
  const risk = site.risks.find((candidate) => candidate.id === id);
  if (risk === undefined) {
    throw new Error(`The example site has no "${id}" risk`);
  }
  return risk;
}

export const caniculaRisk = riskById(chiquimulaSite, "canicula");
export const bareFieldRisk = riskById(chiquimulaSite, "bare_field");
export const missingDataRisk = riskById(nullSoilSite, "missing_data");

export const chiquimulaPlace: DemoPoint = {
  id: "chiquimula",
  name_es: "Chiquimula",
  location: { lat: 14.7, lon: -89.5 },
};

// Placeholder: the real name and coordinates arrive with demo_points.json (package 01).
export const outsidePlace: DemoPoint = {
  id: "fuera_de_region",
  name_es: "Punto fuera de la región",
  location: { lat: 15.7, lon: -88.6 },
};

export const demoPlaces: DemoPoint[] = [chiquimulaPlace, outsidePlace];
