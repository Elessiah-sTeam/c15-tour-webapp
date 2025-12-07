import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import type {LatLngExpression} from "leaflet";
import {c15Marker} from "../icons";
import './BackgoundMap.css';

const position: LatLngExpression = [47.253927, -1.516436];

export default function BackgroundMap() {
    return (
        <MapContainer
            center={position}
            zoom={13}
            className={"map-container"}
            zoomControl={false}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
            />

            <Marker position={position} icon={c15Marker}>
                <Popup>Hi Hajar !</Popup>
            </Marker>
        </MapContainer>
    );
}
