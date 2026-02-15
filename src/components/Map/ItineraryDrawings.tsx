import {useItinerary} from "../../customObject/Itinerary/UseItinerary.ts";
import {itineraryModel} from "../../customObject/Itinerary/ItineraryStore.ts";
import type {Itinerary, Segment} from "../../customObject/Itinerary/types.ts";
import {GeoJSON} from "react-leaflet";

export default function ItineraryDrawings() {
    const itinerary: Itinerary = useItinerary(itineraryModel.store);
    return (
            itinerary.segments.map((seg: Segment) => {
                if (seg.content.geometry) {
                    return <GeoJSON data={seg.content.geometry}/>
                }
            })
    );
}