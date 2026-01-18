import "./Panels.css";
import StepList from "./DragNDrop/StepList.tsx";
import type {ItineraryModel} from "../../customObject/Itinerary/ItineraryModel.ts";


export default function Route({itineraryModel}: {itineraryModel: ItineraryModel}) {
    return (
        <div>
            <StepList itineraryModel={itineraryModel} />
        </div>
    );
}