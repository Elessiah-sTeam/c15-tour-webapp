import type { ReactNode } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import "./BackgroundMap.css";
import "leaflet/dist/leaflet.css";
import Markers from "./Markers.tsx";
import ItineraryDrawings from "./ItineraryDrawings.tsx";
import Branding from "./Branding.tsx";

const initialPosition: LatLngExpression = [47.253927, -1.516436];

type BackgroundMapProps = {
  searchPosition?: LatLngExpression | null;
  searchLabel?: string;
  children?: ReactNode;
};

/**
 * Contient la carte et tout ce qui y touche
 * @param children Composant enfant à insérer en son sein
 * @constructor
 */
export default function BackgroundMap({
  children,
}: BackgroundMapProps) {

  return (
      <div className="map-wrapper">
          <Branding/>
          <MapContainer
            center={initialPosition}
            zoom={13}
            className="map-container"
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />

            <Markers/>

            <ItineraryDrawings/>

            {children}
        </MapContainer>
    </div>
  );
}
