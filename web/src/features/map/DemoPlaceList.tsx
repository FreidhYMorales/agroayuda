// web/src/features/map/DemoPlaceList.tsx
import type { CSSProperties } from "react";
import type { DemoPoint } from "../../contracts/contracts";
import { buttonStyle } from "../../ui/buttonStyles";

export interface DemoPlaceListProps {
  places: DemoPoint[];
  onPick: (place: DemoPoint) => void;
}

const listStyle: CSSProperties = { padding: 0, margin: 0 };
const itemStyle: CSSProperties = { listStyle: "none", marginBottom: 8 };
// The shared style keeps the 44 px touch target.
const placeStyle: CSSProperties = {
  ...buttonStyle("secondary", { fullWidth: true }),
  textAlign: "left",
};

export function DemoPlaceList({ places, onPick }: DemoPlaceListProps) {
  return (
    <ul style={listStyle}>
      {places.map((place) => (
        <li key={place.id} style={itemStyle}>
          <button type="button" style={placeStyle} onClick={() => onPick(place)}>
            {place.name_es}
          </button>
        </li>
      ))}
    </ul>
  );
}
