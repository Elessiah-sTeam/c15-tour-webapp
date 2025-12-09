import { useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import { c15Marker } from "../icons";
import SearchBar from "./Search/SearchBar";
import "./BackgroundMap.css";
import "./Search/SearchBar.css";
import "leaflet/dist/leaflet.css";

const initialPosition: LatLngExpression = [47.253927, -1.516436];

export default function BackgroundMap() {
  const [searchPosition, setSearchPosition] =
    useState<LatLngExpression | null>(null);
  const [searchLabel, setSearchLabel] = useState("");

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
        <SearchBar
          onLocationSelected={(coords, label) => {
            setSearchPosition(coords);
            setSearchLabel(label);
          }}
        />
      </MapContainer>
    </div>
  );
}
