import { useState } from "react";
import type { LatLngExpression } from "leaflet";
import BackgroundMap from "./components/Map/BackgroundMap.tsx";
import Panels from "./components/Panels/Panels.tsx";
import SearchBar from "./components/Search/SearchBar.tsx";
import "./App.css";

/**
 * Fonction racine de l'application.
 */
export default function App() {
  const [searchPosition, setSearchPosition] =
    useState<LatLngExpression | null>(null);
  const [searchLabel, setSearchLabel] = useState("");
  const [panelOpen, setPanelOpen] = useState(true);

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

      {panelOpen ? (
        <div className="panel">
          <Panels onClose={() => setPanelOpen(false)} />
        </div>
      ) : (
        <button
          className="panel-toggle"
          aria-label="Ouvrir le panneau"
          onClick={() => setPanelOpen(true)}
        >
          &#9776;
        </button>
      )}
    </div>
  );
}
