import { describe, expect, test } from "vitest";
import type { CropId } from "../contracts/contracts";
import { CROP_LABELS } from "../features/comparison/cropLabels";
import { cropPhoto } from "./cropPhotos";

// The photo files in web/public/crops/, found by Vite at test time (no network).
const PUBLIC_FILES = Object.keys(import.meta.glob("../../public/crops/*.webp")).map((path) =>
  path.replace("../../public", ""),
);

const CROP_IDS = Object.keys(CROP_LABELS) as CropId[];

describe("crop photos", () => {
  test.each(CROP_IDS.filter((id) => id !== "none"))("%s has a photo file in public/crops", (id) => {
    const photo = cropPhoto(id);
    expect(photo).toBe(`/crops/${id}.webp`);
    expect(PUBLIC_FILES).toContain(photo);
  });

  test("'Nada' has no photo: it keeps its icon", () => {
    expect(cropPhoto("none")).toBeUndefined();
  });
});
