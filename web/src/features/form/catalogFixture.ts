import type { CropCatalogEntry, CropId } from "../../contracts/contracts";

type Season = "primera" | "postrera";

function crop(id: CropId, name: string, icon: string, seasons: Season[]): CropCatalogEntry {
  return {
    id,
    name_es: name,
    icon,
    seasons,
    cycle_days: 100,
    water_need: "medium",
    n_fixing: false,
    root_depth: "deep",
    erosion_cover: "medium",
    drought_tolerance: "medium",
    market_tier: "medium",
    local_source: false,
    source: "TEST FIXTURE, not real data",
  };
}

/** Small catalog for tests: same seasons as the real crops.csv. */
export const CATALOG_FIXTURE: CropCatalogEntry[] = [
  crop("maiz", "Maíz", "🌽", ["primera"]),
  crop("frijol", "Frijol", "🌱", ["primera", "postrera"]),
  crop("maiz_frijol", "Maíz con frijol", "🌽", ["primera"]),
  crop("maicillo", "Maicillo", "🌾", ["postrera"]),
  crop("none", "Nada", "⬜", ["primera", "postrera"]),
];
