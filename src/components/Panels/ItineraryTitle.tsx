import './Panels.css';
import {useItinerary} from "../../customObject/Itinerary/UseItinerary.ts";
import ClickInput from "../ClickInput.tsx";
import {itineraryModel} from "../../customObject/Itinerary/ItineraryStore.ts";

export default function ItineraryTitle() {
    const itinerary = useItinerary(itineraryModel.store);

    return (
            <ClickInput
                currentStr={itinerary.name}
                setter={(newString) => itineraryModel.renameItinerary(newString)}
                Tag={"h1"}
                className={"title"}
            />
    );
}