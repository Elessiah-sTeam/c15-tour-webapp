import { itineraryModel } from "../../customObject/Itinerary/ItineraryStore.ts";
import type { Segment } from "../../customObject/Itinerary/types.ts";
import { TimeSpan } from "../../customObject/TimeSpan.ts";
import { reverseGeocode } from "../../customObject/Search/geocode.ts";

/**
 * Ajoute une étape au dernier segment (créé si nécessaire) à partir d'un clic carte.
 *
 * L'adresse réelle est résolue par géocodage inverse AVANT l'ajout : la sauvegarde
 * backend déclenchée par addStep réassigne des ids numériques aux étapes, donc un
 * renommage différé viserait un id devenu obsolète et serait sans effet. Résoudre
 * le libellé en amont garantit qu'il est persisté. Repli sur les coordonnées si
 * le géocodage échoue.
 *
 * @param lat latitude du clic
 * @param lon longitude du clic
 */
export async function addStepFromClick(lat: number, lon: number): Promise<void> {
    const fallbackTitle = `${lat.toFixed(6)} ${lon.toFixed(6)}`;
    let title = fallbackTitle;

    try {
        const address = await reverseGeocode(lat, lon);
        if (address) {
            title = address;
        }
    } catch {
        // Géocodage indisponible : on conserve les coordonnées comme libellé.
    }

    const regularSegments = itineraryModel.route.segments.filter(
        (seg: Segment) => !seg.isStartEnd
    );

    let targetSegmentId: string;

    if (regularSegments.length > 0) {
        targetSegmentId = regularSegments.at(-1)!.id;
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
            location: { lat, lon },
        },
        isDefaultSegStart: false,
    });
}
