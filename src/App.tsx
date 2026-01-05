import { useState } from "react";
import type { LatLngExpression } from "leaflet";
import BackgroundMap from "./components/BackgroundMap.tsx";
import Panels from "./components/Panels/Panels.tsx";
import SearchBar from "./components/Search/SearchBar.tsx";
import "./App.css";

export default function App() {
  const [searchPosition, setSearchPosition] =
    useState<LatLngExpression | null>(null);
  const [searchLabel, setSearchLabel] = useState("");

  return (
    <div className="window">
      <BackgroundMap
        searchPosition={searchPosition}
        searchLabel={searchLabel}
      >
        <div className="search-panel">
          <SearchBar
            onLocationSelected={(coords, label) => {
              setSearchPosition(coords);
              setSearchLabel(label);
            }}
          />
        </div>
      </BackgroundMap>

      <div className="panel">
        <Panels />
      </div>
    </div>
  );
}
