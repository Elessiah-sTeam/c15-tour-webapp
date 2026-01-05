import { useState } from "react";
import type { LatLngExpression } from "leaflet";
import BackgroundMap from "./components/BackgroundMap.tsx";
import Panels from "./components/Panels/Panels.tsx";
import SearchBar from "./components/Search/SearchBar.tsx";
import roadTour from "./assets/road_tour.svg";
import byC15Tour from "./assets/by_c15_tour.svg";
import logo from "./assets/logo.svg";
import "./App.css";

/**
 * Fonction racine de l'application.
 */
export default function App() {
  const [searchPosition, setSearchPosition] =
    useState<LatLngExpression | null>(null);
  const [searchLabel, setSearchLabel] = useState("");
  const [pingMessage, setPingMessage] = useState<string | null>(null);
  const [isPinging, setIsPinging] = useState(false);

  const handlePing = async () => {
    setIsPinging(true);
    setPingMessage(null);
    try {
      const response = await fetch("http://localhost:8080/ping");
      const text = await response.text();
      if (!response.ok) throw new Error(text || "Ping failed");
      setPingMessage(text || "OK");
    } catch (error) {
      console.error(error);
      setPingMessage("Erreur /ping");
    } finally {
      setIsPinging(false);
    }
  };

  return (
    <div className="window">
      <BackgroundMap
        searchPosition={searchPosition}
        searchLabel={searchLabel}
      >
        <>
          <SearchBar
            onLocationSelected={(coords, label) => {
              setSearchPosition(coords);
              setSearchLabel(label);
            }}
          />
          <div className="ping-control">
            <button
              className="ping-button"
              type="button"
              onClick={handlePing}
              disabled={isPinging}
            >
              {isPinging ? "Ping..." : "Ping"}
            </button>
            {pingMessage && (
              <span className="ping-status">{pingMessage}</span>
            )}
          </div>
        </>
      </BackgroundMap>

      <div className="map-branding">
        <img src={roadTour} alt="Roads Tour" className="brand-road" />
        <img src={byC15Tour} alt="By C15 Tour" className="brand-by" />
      </div>

      <div className="map-logo">
        <img src={logo} alt="C15 Tour" />
      </div>

      <div className="panel">
        <Panels />
      </div>
    </div>
  );
}
