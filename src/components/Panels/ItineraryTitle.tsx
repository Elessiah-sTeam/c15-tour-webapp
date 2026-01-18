import './Panels.css';
import type {ItineraryStore} from "../../customObject/Itinerary/types.ts";
import {useItinerary} from "../../customObject/Itinerary/UseItinerary.ts";

export default function ItineraryTitle({store}: {store: ItineraryStore}) {
    const itinerary = useItinerary(store);

    return (
        <>
            <h1>{itinerary.name}</h1>
        </>
    );
}