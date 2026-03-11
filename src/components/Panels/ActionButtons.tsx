import {Settings, Upload} from "lucide-react";
import './Panels.css';
import {itineraryModel} from "../../customObject/Itinerary/ItineraryStore.ts";

export default function ActionButtons() {
    return (
        <div className={"action-buttons"}>
            <button
                className={"global-settings-btn"}
                aria-label={"Parametres globaux"}
            >
                <Settings color={"#BB487C"}/>
            </button>
            <button
                className={"export-btn"}
                aria-label={"Export"}
                onClick={async() => {await itineraryModel.netModel.put()}}
            >
                <Upload color={"#BB487C"}/>
            </button>
        </div>
    );
}
