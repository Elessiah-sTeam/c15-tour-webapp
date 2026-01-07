import type {DndCat, DndItem} from "../../../dndTypes.ts";
import {type Dispatch, type SetStateAction, useState} from "react";
import {type DragEndEvent, type DragMoveEvent, type DragStartEvent} from "@dnd-kit/core";
import {getActiveCat, getActiveItem, reorderCategories, reorderItems} from "./DragNDropUtils.tsx";

type CategorySetter = Dispatch<SetStateAction<DndCat[]>>;

type Props = {
    categories: DndCat[];
    setCategories: CategorySetter;
}

export type DndProps = {
    activeItem: DndItem | null;
    activeCat: DndCat | null;
    handleDragStart: (event: DragStartEvent) => void;
    handleDragMove: (event: DragEndEvent) => void;
    handleDragEnd: (event: DragEndEvent) => void;
}

export function useDragNDrop({ categories, setCategories } : Props): DndProps {
    const [activeItem, setActiveItem] = useState<DndItem | null>(null);
    const [activeCat, setActiveCat] = useState<DndCat | null>(null);

    function handleDragStart(event: DragStartEvent) {
        const {active} = event;
        const type = active.data.current?.type;

        if (type === "item") {
            const item: DndItem | undefined = getActiveItem(active, categories);
            if (item) {
                setActiveItem(item);
            }
        } else if (type === "category") {
            const category: DndCat | undefined = getActiveCat(active, categories);
            if (category) {
                setActiveCat(category);
            }
        }
    }

    function handleDragMove(event: DragMoveEvent) {
        const { active, over } = event;

        if (!over)
            return;

        const activeType: string | null = active.data.current?.type;
        const overType: string | null = over.data.current?.type;

        if (activeType === "category" && overType === "category") {
            reorderCategories(active, over, setCategories);
        } else if (activeType === "item") {
            reorderItems(active, over, setCategories);
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