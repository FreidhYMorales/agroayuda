// web/src/features/map/DemoPlaceList.tsx
import type { CSSProperties } from "react";
import type { DemoPoint } from "../../contracts/contracts";

export interface DemoPlaceListProps {
  places: DemoPoint[];
  onPick: (place: DemoPoint) => void;
}

const listStyle: CSSProperties = { padding: 0, margin: 0 };
const itemStyle: CSSProperties = { listStyle: "none", marginBottom: 8 };
// Áreas táctiles >= 44 px.
const buttonStyle: CSSProperties = {
  minHeight: 44,
  width: "100%",
  padding: "0 16px",
  textAlign: "left",
};

export function DemoPlaceList({ places, onPick }: DemoPlaceListProps) {
  return (
    <ul style={listStyle}>
      {places.map((place) => (
        <li key={place.id} style={itemStyle}>
          <button type="button" style={buttonStyle} onClick={() => onPick(place)}>
            {place.name_es}
          </button>
        </li>
      ))}
    </ul>
  );
}
