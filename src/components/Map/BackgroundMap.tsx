import type { ReactNode } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import "./BackgroundMap.css";
import "leaflet/dist/leaflet.css";
import Markers from "./Markers.tsx";
import ItineraryDrawings from "./ItineraryDrawings.tsx";
import Branding from "./Branding.tsx";
import type {Feature, LineString} from "geojson";
import {GeoJSON} from "react-leaflet";

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

    const route: Feature<LineString> = {
        type: "Feature",
        geometry: {
            type: "LineString",
            coordinates: [
                [2.3522, 48.8566],   // Paris
                [1.0000, 49.5000],
                [0.2000, 50.2000],
                [-0.1278, 51.5074],  // Londres
            ],
        },
        properties: {},
    };

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
              <GeoJSON data={route} />

            {children}
        </MapContainer>
    </div>
  );
}
