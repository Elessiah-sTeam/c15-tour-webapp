import './Panels.css';
import {TimespanOffset, type unitTimeSpan} from "../../customObject/TimeSpan.ts";
import {useItinerary} from "../../customObject/Itinerary/UseItinerary.ts";
import {itineraryModel} from "../../customObject/Itinerary/ItineraryStore.ts";

export default function InfoPanel() {
    const units: unitTimeSpan = {days: "J ", hours: "H ", minutes: "MIN ", seconds: "S ", milliseconds: "MS "}
    const itinerary = useItinerary(itineraryModel.store);

    return (
        <div className={"info-panel"}>
            <h1>Total</h1>
            <div className={"total-info"}>
                <h2>{itinerary.totalDistance + " KM"}</h2>
                <h2>{itinerary.totalDuration.toFStr(TimespanOffset.MINUTES, units)}</h2>
            </div>
        </div>
    )
}