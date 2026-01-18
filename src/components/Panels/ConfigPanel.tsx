import './Panels.css';
import Route from "./Route.tsx";
import type {ItineraryModel} from "../../customObject/Itinerary/ItineraryModel.ts";
import ItineraryTitle from "./ItineraryTitle.tsx";

export default function ConfigPanel({itineraryModel} : {itineraryModel: ItineraryModel}) {
    return (
    <div className={"config-panel"}>
        <ItineraryTitle store={itineraryModel.store} />
        <Route itineraryModel={itineraryModel} />
    </div>
    );
}