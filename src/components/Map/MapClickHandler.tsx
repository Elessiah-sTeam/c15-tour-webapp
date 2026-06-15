import { useMapEvents } from "react-leaflet";
import { itineraryModel } from "../../customObject/Itinerary/ItineraryStore.ts";
import { useItinerary } from "../../customObject/Itinerary/UseItinerary.ts";
import type { Segment } from "../../customObject/Itinerary/types.ts";
import { TimeSpan } from "../../customObject/TimeSpan.ts";
import { reverseGeocode } from "../../customObject/Search/geocode.ts";

/**
 * Gère les clics sur la carte pour créer une nouvelle étape
 * L'étape est ajoutée au dernier segment, qui est créé si nécessaire.
 * Le libellé affiche d'abord les coordonnées puis est remplacé par l'adresse
 * réelle obtenue par géocodage inverse (les coordonnées restent en cas d'échec).
 */
export default function MapClickHandler() {
    const itinerary = useItinerary(itineraryModel.store);

    useMapEvents({
        click(e) {
            const { lat, lng } = e.latlng;
            const title = `${lat.toFixed(6)} ${lng.toFixed(6)}`;

            const regularSegments = itinerary.segments.filter(
                (seg: Segment) => !seg.isStartEnd
            );

            let targetSegmentId: string;

            if (regularSegments.length > 0) {
                targetSegmentId = regularSegments[regularSegments.length - 1].id;
            } else {
                const newSegment: Segment = {
                    id: "newseg" + new Date().toISOString(),
                    content: {
                        title: "Nouveau segment",
                        hour: new Date(),
                        duration: new TimeSpan(),
                        distance: 0,
                    },
                    isStartEnd: false,
                    steps: [],
                };
                itineraryModel.addSegment(newSegment);
                targetSegmentId = newSegment.id;
            }

            const stepId = "mapclick" + new Date().toISOString();
            itineraryModel.addStep(targetSegmentId, {
                id: stepId,
                content: {
                    title,
                    duration: new TimeSpan(),
                    location: { lat, lon: lng },
                },
                isDefaultSegStart: false,
            });

            reverseGeocode(lat, lng)
                .then((address) => {
                    if (address) {
                        itineraryModel.renameStep(targetSegmentId, stepId, address);
                    }
                })
                .catch(() => {
                    // Géocodage indisponible : on conserve les coordonnées comme libellé.
                });
        },
    });

    return null;
}
