import type {Active, Over} from "@dnd-kit/core";
import type {Itinerary, Segment, Step} from "../../../customObject/Itinerary/types.ts";
import ItineraryModel from "../../../customObject/Itinerary/ItineraryModel.ts";

/**
 * Permet de récupérer l'étape qui est saisi
 * @param active information information DragNDrop
 * @param categories tableaux des segments de l'itinéraire
 */
export function getActiveItem(active: Active, categories: Segment[]): Step | undefined {
    const catId: string = active.data.current?.categoryId;
    if (!catId)
        return;
    return (categories.find(c => c.id === catId)?.steps.find(i => i.id === active.id));
}

/**
 * Permet de récupérer le segment qui est saisi
 * @param active information DragNDrop
 * @param categories tableaux des segments de l'itinéraire
 */
export function getActiveCat(active: Active, categories: Segment[]): Segment | undefined {
    const catId: string = active.id as string;
    if (!catId)
        return;
    return (categories.find(c => c.id === catId));
}

/**
 * Permet de replacer le segment dans l'itinéraire
 * @param itinerary snapshot de l'itinéraire
 * @param itineraryModel model du store de l'itinéraire
 * @param active information DragNDrop
 * @param over information DragNDrop
 */
export function reorderSegment(itinerary: Itinerary,
                               itineraryModel: ItineraryModel,
                               active: Active,
                               over: Over): void
{
    const newIndex: number = itinerary.segments.findIndex((seg: Segment) => seg.id == over.id);
    itineraryModel.reorderSegment(active.id as string, newIndex);
}

type OriginsNTarget = {
    category: {from: Segment, to: Segment},
    itemIndex: {old: number, new: number}
};

/**
 * Récupère les segments d'origines et de destinations, ainsi que les index origine et destination des étapes
 * @param categories snapshot des categories de l'itinéraire
 * @param srcCategory ID de la catégorie source
 * @param destCategory ID de la catégorie de destination
 * @param active information DragNDrop
 * @param over information DragNDrop
 */
function getOriginsNTargets(categories: Segment[],
                            srcCategory: string,
                            destCategory: string,
                            active: Active,
                            over: Over): OriginsNTarget | null {
    const from: Segment | undefined = categories.find((c: Segment): boolean => c.id === srcCategory);
    const to: Segment | undefined = categories.find((c: Segment): boolean => c.id === destCategory);

    if (!from || !to) {
        console.error("Failed to find the source or destination category !");
        return null;
    }

    const result: OriginsNTarget = {category: {from: from, to: to}, itemIndex: {old: -1, new: -1}};

    result.itemIndex.old = from.steps.findIndex((i: Step): boolean => i.id === active.id);
    result.itemIndex.new = to.steps.findIndex((i: Step): boolean => i.id === over.id);

    if (result.itemIndex.old == -1 || (result.itemIndex.new == -1 && to == from)) {
        // console.error("Failed to find the index item of origin");
        return null;
    } else if (result.itemIndex.new == -1) {
        result.itemIndex.new = 0;
    }

    return result;
}

/**
 * Permet de replacer l'étape dans l'itinéraire
 * @param itinerary snapshot de l'itinéraire
 * @param itineraryModel model du store de l'itinéraire
 * @param active information DragNDrop
 * @param over information DragNDrop
 */
export function reorderItems(itinerary: Itinerary,
                             itineraryModel: ItineraryModel,
                             active: Active,
                             over: Over): void
{
    const srcCategory: string | undefined = active.data.current?.categoryId;
    const destCategory: string | undefined = over.data.current?.categoryId ?? srcCategory;

    if (!srcCategory || !destCategory) {
        console.error("Missing source or destination category id");
        return;
    }

    let OGnT: OriginsNTarget | null;
    // eslint-disable-next-line prefer-const
    OGnT = getOriginsNTargets(itinerary.segments, srcCategory, destCategory, active, over);
    if (!OGnT || OGnT.category.from.isStartEnd || OGnT.category.to.isStartEnd || OGnT.category.from.steps[OGnT.itemIndex.old].isDefaultSegStart)
        return;
    console.log("Passed !");
    itineraryModel.reorderStep(OGnT.category.from.id, OGnT.itemIndex.old, OGnT.category.to.id, OGnT.itemIndex.new);
}