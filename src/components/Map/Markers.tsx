import type { LatLngExpression } from "leaflet";
import { c15Marker } from "../../icons.ts";
import { Marker, Popup } from "react-leaflet";
import {useItinerary} from "../../customObject/Itinerary/UseItinerary.ts";
import {itineraryModel} from "../../customObject/Itinerary/ItineraryStore.ts";

export default function Markers() {
    const itinerary = useItinerary(itineraryModel.store);
    return (
        itinerary.segments.flatMap((segment) =>
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
            )
    );
}