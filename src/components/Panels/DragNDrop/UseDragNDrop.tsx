import type {Itinerary, Segment, Step} from "../../../customObject/Itinerary/types.ts";
import {useState} from "react";
import {type DragEndEvent, type DragMoveEvent, type DragStartEvent} from "@dnd-kit/core";
import {getActiveCat, getActiveItem, reorderSegment, reorderItems} from "./DragNDropUtils.tsx";
import type {ItineraryModel} from "../../../customObject/Itinerary/ItineraryModel.ts";
import {useItinerary} from "../../../customObject/Itinerary/UseItinerary.ts";

type Props = {
    itineraryModel: ItineraryModel;
}

export type DndProps = {
    activeItem: Step | null;
    activeCat: Segment | null;
    handleDragStart: (event: DragStartEvent) => void;
    handleDragMove: (event: DragEndEvent) => void;
    handleDragEnd: (event: DragEndEvent) => void;
}

export function useDragNDrop({ itineraryModel } : Props): DndProps {
    const [activeItem, setActiveItem] = useState<Step | null>(null);
    const [activeCat, setActiveCat] = useState<Segment | null>(null);
    const itinerary: Itinerary = useItinerary(itineraryModel.store);

    function handleDragStart(event: DragStartEvent) {
        const {active} = event;
        const type = active.data.current?.type;

        if (type === "item") {
            const item: Step | undefined = getActiveItem(active, itinerary.segments);
            if (item) {
                setActiveItem(item);
            }
        } else if (type === "category") {
            const category: Segment | undefined = getActiveCat(active, itinerary.segments);
            if (category) {
                setActiveCat(category);
            }
        }
    }

    function handleDragMove(event: DragMoveEvent) {
        const { active, over } = event;

        if (!over) {
            // Fonctionne pas, over toujours actif
            // removeActive(active, itineraryModel);
            return;
        }

        const activeType: string | null = active.data.current?.type;
        const overType: string | null = over.data.current?.type;

        if (activeType === "category" && overType === "category") {
            reorderSegment(itinerary, itineraryModel, active, over);
        } else if (activeType === "item") {
            reorderItems(itinerary, itineraryModel, active, over);
        }
    }

    function handleDragEnd(event: DragEndEvent) {
        setActiveItem(null);
        setActiveCat(null);
        handleDragMove(event);
    }

    return ({
        activeItem,
        activeCat,
        handleDragStart,
        handleDragMove,
        handleDragEnd
    })
}