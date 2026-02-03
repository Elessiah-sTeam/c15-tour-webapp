import type { ReactNode } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import { c15Marker } from "../icons";
import roadTour from "../assets/road_tour.svg";
import byC15Tour from "../assets/by_c15_tour.svg";
import logo from "../assets/logo.svg";
import { useItinerary } from "../customObject/Itinerary/UseItinerary.ts";
import { itineraryModel } from "../customObject/Itinerary/ItineraryStore.ts";
import "./BackgroundMap.css";
import "leaflet/dist/leaflet.css";

const initialPosition: LatLngExpression = [47.253927, -1.516436];

type BackgroundMapProps = {
  searchPosition?: LatLngExpression | null;
  searchLabel?: string;
  children?: ReactNode;
};

export default function BackgroundMap({
  children,
}: BackgroundMapProps) {
  const itinerary = useItinerary(itineraryModel.store);

  return (
    <div className="map-wrapper">
      <div className="map-branding">
        <img src={roadTour} alt="Roads Tour" className="brand-road" />
        <img src={byC15Tour} alt="By C15 Tour" className="brand-by" />
      </div>

      <div className="map-logo">
        <img src={logo} alt="C15 Tour" />
      </div>

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

        {itinerary.segments.flatMap((segment) =>
          segment.steps
            .filter((step) => step.content.location)
            .map((step) => {
              const loc = step.content.location!;
              const pos: LatLngExpression = [loc.lat, loc.lon];
              return (
                <Marker key={`${segment.id}-${step.id}`} position={pos} icon={c15Marker}>
                  <Popup>{step.content.title}</Popup>
                </Marker>
              );
            })
        )}
        {children}
      </MapContainer>
    </div>
  );
}
