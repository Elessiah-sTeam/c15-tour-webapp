import { useState } from "react";
import type { LatLngExpression } from "leaflet";
import BackgroundMap from "./components/Map/BackgroundMap.tsx";
import Panels from "./components/Panels/Panels.tsx";
import SearchBar from "./components/Search/SearchBar.tsx";
import { ConvoyHistory } from './components/PageHistory/ConvoyHistory';
import { itineraryModel } from './customObject/Itinerary/ItineraryStore';
import "./App.css";

/**
 * Fonction racine de l'application.
 */
export default function App() {
  const [searchPosition, setSearchPosition] =
    useState<LatLngExpression | null>(null);
  const [searchLabel, setSearchLabel] = useState("");
  const [panelOpen, setPanelOpen] = useState(true);

  const [showHistory, setShowHistory] = useState(true);

    const handleCreateNew = () => {
        setShowHistory(false);
    };

    const handleOpenConvoy = async (id: number) => {
        await itineraryModel.netModel.get(id);
        setShowHistory(false);
    };

    if (showHistory) {
        return (
            <ConvoyHistory
                onCreateNew={handleCreateNew}
                onOpenConvoy={handleOpenConvoy}
            />
        );
    }

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
