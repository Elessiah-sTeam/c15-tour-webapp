import './Panels.css';
import { Flag, Rocket } from "lucide-react";
import { TimespanOffset, type unitTimeSpan } from "../../customObject/TimeSpan.ts";
import { useItinerary } from "../../customObject/Itinerary/UseItinerary.ts";
import { itineraryModel } from "../../customObject/Itinerary/ItineraryStore.ts";
import { formatTime, isValidDate } from "../../utils/timeUtils";

export default function InfoPanel() {
    const units: unitTimeSpan = { days: "J ", hours: "H ", minutes: "MIN ", seconds: "S ", milliseconds: "MS " };
    const itinerary = useItinerary(itineraryModel.store);

    // Les heures affichees viennent du store, qui est mis a jour par le backend et les settings.
    const departureTime = itinerary.segments[0]?.content.hour;
    const arrivalTime = itinerary.segments[itinerary.segments.length - 1]?.content.hour;
    const hasDuration = itinerary.totalDuration.duration > 0;
    const canDisplayTimes = hasDuration && isValidDate(departureTime) && isValidDate(arrivalTime);

    return (
        <div className={"info-panel"}>
            <h1 className={"info-panel-title"}>Total</h1>
            <div className={"total-info"}>
                <h2>{itinerary.totalDistance.toFixed(2) + " KM"}</h2>
                <h2>{itinerary.totalDuration.toFStr(TimespanOffset.MINUTES, units)}</h2>
            </div>

            {canDisplayTimes && (
                <div className={"time-info"}>
                    <div className={"time-row"}>
                        <span className={"time-label"}>
                            <Rocket className={"time-icon"} aria-hidden={true} />
                            Départ :
                        </span>
                        <span className={"time-value"}>
                            {formatTime(departureTime)}
                        </span>
                    </div>
                    <div className={"time-row"}>
                        <span className={"time-label"}>
                            <Flag className={"time-icon"} aria-hidden={true} />
                            Arrivée :
                        </span>
                        <span className={"time-value"}>
                            {formatTime(arrivalTime)}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
