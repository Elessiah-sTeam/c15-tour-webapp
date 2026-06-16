import { useMapEvents } from "react-leaflet";
import { addStepFromClick } from "./mapClickUtils.ts";

/**
 * Gère les clics sur la carte pour créer une nouvelle étape avec son adresse réelle.
 */
export default function MapClickHandler() {
    useMapEvents({
        click(e) {
            const { lat, lng } = e.latlng;
            void addStepFromClick(lat, lng);
        },
    });

    return null;
}
