import './Panels.css';
import {useItinerary} from "../../customObject/Itinerary/UseItinerary.ts";
import ClickInput from "../ClickInput.tsx";
import {itineraryModel} from "../../customObject/Itinerary/ItineraryStore.ts";

/**
 * Contient le titre de l'itinéraire
 * Est raffraichi à chaque mise à jour de l'itinéraire
 */
type ItineraryTitleProps = {
    onClose?: () => void;
}

export default function ItineraryTitle({onClose}: ItineraryTitleProps) {
    const itinerary = useItinerary(itineraryModel.store);

    return (
        <div className="title-row">
            <button
                className="panel-close-btn"
                aria-label="Fermer le panneau"
                onClick={onClose}
                type="button"
            >
                &#10005;
            </button>
            <ClickInput
                    currentStr={itinerary.name}
                    setter={(newString) => itineraryModel.renameItinerary(newString)}
                    Tag={"h1"}
                    className={"title"}
                    isDesactivated={false}
            />
        </div>
    );
}
