import './Panels.css';
import type {ItineraryStore} from "../../customObject/Itinerary/types.ts";
import {useItinerary} from "../../customObject/Itinerary/UseItinerary.ts";
import ClickInput from "../ClickInput.tsx";
import type {ItineraryModel} from "../../customObject/Itinerary/ItineraryModel.ts";

export default function ItineraryTitle({store, model}: {store: ItineraryStore, model: ItineraryModel}) {
    const itinerary = useItinerary(store);

    return (
            <ClickInput
                currentStr={itinerary.name}
                setter={(newString) => model.renameItinerary(newString)}
                Tag={"h1"}
                className={"title"}
            />
    );
}