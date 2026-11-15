import type { CropId, Rotation } from "../../contracts/contracts";
import type { Lang } from "../../lib/urlState";

/** Spanish names for the table and the detail (text only: the table never relies on icons). */
export const CROP_LABELS: Record<CropId, string> = {
  maiz: "Maíz",
  frijol: "Frijol",
  maiz_frijol: "Maíz con frijol",
  maicillo: "Maicillo",
  gandul: "Gandul",
  mucuna: "Mucuna",
  canavalia: "Canavalia",
  ajonjoli: "Ajonjolí",
  ayote: "Ayote",
  none: "Nada",
};

/** English names, by crop id; the catalog only carries the Spanish one. */
const CROP_LABELS_EN: Record<CropId, string> = {
  maiz: "Maize",
  frijol: "Beans",
  maiz_frijol: "Maize with beans",
  maicillo: "Sorghum",
  gandul: "Pigeon pea",
  mucuna: "Velvet bean",
  canavalia: "Jack bean",
  ajonjoli: "Sesame",
  ayote: "Squash",
  none: "Nothing",
};

export function cropLabel(id: CropId, lang: Lang = "es"): string {
  return lang === "en" ? CROP_LABELS_EN[id] : CROP_LABELS[id];
}

/** "Maíz con frijol → Maicillo" */
export function sequenceLabel(sequence: Rotation): string {
  return `${cropLabel(sequence.primera)} → ${cropLabel(sequence.postrera)}`;
}
