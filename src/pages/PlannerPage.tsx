import { useState, useSyncExternalStore } from "react";
import type { LatLngExpression } from "leaflet";
import { useNavigate } from "react-router-dom";
import BackgroundMap from "../components/Map/BackgroundMap.tsx";
import Panels from "../components/Panels/Panels.tsx";
import SearchBar from "../components/Search/SearchBar.tsx";
import SaveDialog from "../components/Panels/SaveDialog.tsx";
import { itineraryModel } from "../customObject/Itinerary/ItineraryStore.ts";
import { dirtyStore } from "../customObject/Itinerary/DirtyStore.ts";
import "../App.css";
import IdRoutingManager from "../components/IdRoutingManager.tsx";

export default function PlannerPage() {
  const navigate = useNavigate();
  const isDirty = useSyncExternalStore(dirtyStore.subscribe, dirtyStore.getSnapshot);

  const [searchPosition, setSearchPosition] =
    useState<LatLngExpression | null>(null);
  const [searchLabel, setSearchLabel] = useState("");
  const [panelOpen, setPanelOpen] = useState(true);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const goHome = () => navigate("/");

  const handleHomeClick = () => {
    if (isDirty) {
      setShowSaveDialog(true);
    } else {
      goHome();
    }
  };

  const handleSave = async () => {
    await itineraryModel.save();
    setShowSaveDialog(false);
    goHome();
  };

  const handleSaveDraft = () => {
    dirtyStore.set(false);
    setShowSaveDialog(false);
    goHome();
  };

  const handleDiscard = async () => {
    await itineraryModel.deleteCurrent();
    setShowSaveDialog(false);
    goHome();
  };

  return (
    <div className="window">
      <IdRoutingManager/>
      <button
        className="home-return"
        type="button"
        onClick={handleHomeClick}
      >
        ↩ Accueil
      </button>

      <BackgroundMap searchPosition={searchPosition} searchLabel={searchLabel}>
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

      {showSaveDialog && (
        <SaveDialog
          onSave={handleSave}
          onSaveDraft={handleSaveDraft}
          onDiscard={handleDiscard}
          onCancel={() => setShowSaveDialog(false)}
        />
      )}
    </div>
  );
}
