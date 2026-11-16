import type { CropId } from "../contracts/contracts";

// Real photos of each crop, small round thumbnails in web/public/crops/ (sources and
// licences in docs/resources.md). The catalog emoji stays as the fallback when a photo
// is missing or fails to load. "Nada" (rest) has no photo: there is no crop to show.
const WITH_PHOTO: ReadonlySet<CropId> = new Set<CropId>([
  "maiz",
  "frijol",
  "maiz_frijol",
  "maicillo",
  "gandul",
  "mucuna",
  "canavalia",
  "ajonjoli",
  "ayote",
]);

/** Public URL of the crop photo, or undefined when the crop keeps its icon. */
export function cropPhoto(id: CropId): string | undefined {
  return WITH_PHOTO.has(id) ? `/crops/${id}.webp` : undefined;
}
