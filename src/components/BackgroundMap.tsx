import type { ReactNode } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import { c15Marker } from "../icons";
import roadTour from "../assets/road_tour.svg";
import byC15Tour from "../assets/by_c15_tour.svg";
import logo from "../assets/logo.svg";
import "./BackgroundMap.css";
import "leaflet/dist/leaflet.css";

const initialPosition: LatLngExpression = [47.253927, -1.516436];

type BackgroundMapProps = {
  searchPosition?: LatLngExpression | null;
  searchLabel?: string;
  children?: ReactNode;
};

export default function BackgroundMap({
  searchPosition = null,
  searchLabel = "",
  children,
}: BackgroundMapProps) {

  return (
    <div className="map-wrapper">
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

        <Marker position={initialPosition} icon={c15Marker}>
          <Popup>Hi Hajar !</Popup>
        </Marker>

        {searchPosition && (
          <Marker position={searchPosition} icon={c15Marker}>
            <Popup>{searchLabel}</Popup>
          </Marker>
        )}
        {children}
      </MapContainer>
    </div>
  );
}
