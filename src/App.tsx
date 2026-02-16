import { useState } from "react";
import type { LatLngExpression } from "leaflet";
import BackgroundMap from "./components/Map/BackgroundMap.tsx";
import Panels from "./components/Panels/Panels.tsx";
import SearchBar from "./components/Search/SearchBar.tsx";
import HomeLanding from "./components/Home/HomeLanding.tsx";
import "./App.css";

/**
 * Fonction racine de l'application.
 */
export default function App() {
  const [view, setView] = useState<"home" | "planner">("home");
  const [searchPosition, setSearchPosition] =
    useState<LatLngExpression | null>(null);
  const [searchLabel, setSearchLabel] = useState("");
  const [panelOpen, setPanelOpen] = useState(true);

  const openPlanner = () => {
    setPanelOpen(true);
    setView("planner");
  };

  if (view === "home") {
    return (
      <HomeLanding
        onCreateNew={openPlanner}
      />
    );
  }

  return (
    <div className="window">
      <button
        className="home-return"
        type="button"
        onClick={() => setView("home")}
      >
        ↩ Accueil
      </button>
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
