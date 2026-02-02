import './Panels.css';
import {useItinerary} from "../../customObject/Itinerary/UseItinerary.ts";
import ClickInput from "../ClickInput.tsx";
import {itineraryModel} from "../../customObject/Itinerary/ItineraryStore.ts";

/**
 * Contient le titre de l'itinéraire
 * Est raffraichi à chaque mise à jour de l'itinéraire
 */
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