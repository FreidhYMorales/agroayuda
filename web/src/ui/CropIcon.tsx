import { useState } from "react";
import type { CropId } from "../contracts/contracts";
import { cropPhoto } from "./cropPhotos";

/** Crop photo (decorative: the text next to it names the crop); the emoji if it fails. */
export function CropIcon({ id, icon }: { id: CropId; icon: string }) {
  const [failed, setFailed] = useState(false);
  const photo = cropPhoto(id);
  if (!photo || failed) {
    return (
      <span className="ag-icon" aria-hidden="true">
        {icon}
      </span>
    );
  }
  return (
    <img
      className="ag-crop-photo"
      src={photo}
      alt=""
      width={48}
      height={48}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
