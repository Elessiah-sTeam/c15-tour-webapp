import { useMapEvents } from "react-leaflet";
import { itineraryModel } from "../../customObject/Itinerary/ItineraryStore.ts";
import { useItinerary } from "../../customObject/Itinerary/UseItinerary.ts";
import type { Segment } from "../../customObject/Itinerary/types.ts";
import { TimeSpan } from "../../customObject/TimeSpan.ts";

/**
 * Gère les clics sur la carte pour créer une nouvelle étape
 * L'étape est ajoutée au dernier segment, qui est créé si nécessaire
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

            itineraryModel.addStep(targetSegmentId, {
                id: "mapclick" + new Date().toISOString(),
                content: {
                    title,
                    duration: new TimeSpan(),
                    location: { lat, lon: lng },
                },
                isDefaultSegStart: false,
            });
        },
    });

    return null;
}
