import type { CropId, Rotation } from "../../contracts/contracts";

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

export function cropLabel(id: CropId): string {
  return CROP_LABELS[id];
}

/** "Maíz con frijol → Maicillo" */
export function sequenceLabel(sequence: Rotation): string {
  return `${cropLabel(sequence.primera)} → ${cropLabel(sequence.postrera)}`;
}
