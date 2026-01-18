import type {Active, Over} from "@dnd-kit/core";
import type {Itinerary, Segment, Step} from "../../../customObject/Itinerary/types.ts";
import type {ItineraryModel} from "../../../customObject/Itinerary/ItineraryModel.ts";

export function getActiveItem(active: Active, categories: Segment[]): Step | undefined {
    const catId: string = active.data.current?.categoryId;
    if (!catId)
        return;
    return (categories.find(c => c.id === catId)?.steps.find(i => i.id === active.id));
}

export function getActiveCat(active: Active, categories: Segment[]): Segment | undefined {
    const catId: string = active.id as string;
    if (!catId)
        return;
    return (categories.find(c => c.id === catId));
}

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
    if (!OGnT)
        return;
    itineraryModel.reorderStep(OGnT.category.from.id, OGnT.itemIndex.old, OGnT.category.to.id, OGnT.itemIndex.new);
}