import type {Itinerary, Segment, Step} from "../../../customObject/Itinerary/types.ts";
import {useState} from "react";
import {type DragEndEvent, type DragMoveEvent, type DragStartEvent} from "@dnd-kit/core";
import {getActiveCat, getActiveItem, reorderSegment, reorderItems} from "./DragNDropUtils.tsx";
import {useItinerary} from "../../../customObject/Itinerary/UseItinerary.ts";
import {itineraryModel} from "../../../customObject/Itinerary/ItineraryStore.ts";

export type DndProps = {
    activeItem: Step | null;
    activeCat: Segment | null;
    handleDragStart: (event: DragStartEvent) => void;
    handleDragMove: (event: DragEndEvent) => void;
    handleDragEnd: (event: DragEndEvent) => void;
}

/**
 * Fonction renvoyant les outils pour faire fonctionner le dragNDrop
 * Contient les fonctions métier du DragNDrop
 */
export function useDragNDrop(): DndProps {
    const [activeItem, setActiveItem] = useState<Step | null>(null);
    const [activeCat, setActiveCat] = useState<Segment | null>(null);
    const itinerary: Itinerary = useItinerary(itineraryModel.store);

    function isItemActionModalOpen(): boolean {
        return document.body.classList.contains("item-action-modal-open");
    }

    /**
     * Gère le début du dragNDrop quand l'élément est agripé,
     * Mets à jour les variables activeItem, et activeCat qui représente les éléments saisis
     * @param event informations sur le début du Drag
     */
    function handleDragStart(event: DragStartEvent) {
        if (isItemActionModalOpen()) {
            return;
        }

        const {active} = event;
        const type = active.data.current?.type;

        if (type === "item") {
            const item: Step | undefined = getActiveItem(active, itinerary.segments);
            if (item && !item.isDefaultSegStart) {
                setActiveItem(item);
                itineraryModel.netModel.startDrag();
            }
        } else if (type === "category") {
            const category: Segment | undefined = getActiveCat(active, itinerary.segments);
            if (category && !category.isStartEnd) {
                setActiveCat(category);
                itineraryModel.netModel.startDrag();
            }
        }
    }

    /**
     * Gère le mouvement de dragNDrop
     * Reordonne l'itinéraire fonction du survol
     * @param event
     */
    function handleDragMove(event: DragMoveEvent) {
        if (isItemActionModalOpen()) {
            return;
        }

        const { active, over } = event;

        if (!over) {
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

    /**
     * Gère la fin du dragNDrop
     * Désactive les actifs, et reordonne une dernière fois
     * @param event
     */
    function handleDragEnd(event: DragEndEvent) {
        if (isItemActionModalOpen()) {
            setActiveItem(null);
            setActiveCat(null);
            return;
        }

        setActiveItem(null);
        setActiveCat(null);
        handleDragMove(event);
        itineraryModel.netModel.endDrag();
    }

    return ({
        activeItem,
        activeCat,
        handleDragStart,
        handleDragMove,
        handleDragEnd
    })
}
