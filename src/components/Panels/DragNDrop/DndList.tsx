import {
    DndContext,
    DragOverlay,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors
} from "@dnd-kit/core";

import type { DragEndEvent } from "@dnd-kit/core";

import {
    SortableContext,
    verticalListSortingStrategy,
    arrayMove
} from "@dnd-kit/sortable";

import {type Dispatch, type SetStateAction} from "react";
import type { DndCat, DndItem } from "../../../dndTypes";
import SortableCategory from "./SortableCategory";

type CategorySetter = Dispatch<SetStateAction<DndCat[]>>;

type Props = {
    categories: DndCat[];
    setCategories: CategorySetter;
}

export default function DndList({categories, setCategories}: Props) {
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (!over)
            return;

        const activeType: string | null = active.data.current?.type;
        const overType: string | null = over.data.current?.type;

        if (activeType === "category" && overType === "category") {
            setCategories((prev) => {
               const oldIndex: number = prev.findIndex((c) => c.id === active.id);
               const newIndex: number = prev.findIndex((c) => c.id === over.id);
               if (oldIndex === -1 || newIndex === -1)
                   return prev;
               return arrayMove(prev, oldIndex, newIndex);
            });
        } else if (activeType === "item") {
            const srcCategory: string | undefined = active.data.current?.categoryId;
            const destCategory: string | undefined = over.data.current?.categoryId ?? srcCategory;

            if (!srcCategory || !destCategory) {
                console.error("Missing source or destination category id");
                return null;
            }

            console.log("srcCategory: ", srcCategory, "destCategory: ", destCategory);

            setCategories((prev: DndCat[]): DndCat[] => {
                const newCats: DndCat[] = structuredClone(prev);

                const from: DndCat | undefined = newCats.find((c: DndCat): boolean => c.id === srcCategory);
                const to: DndCat | undefined = newCats.find((c: DndCat): boolean => c.id === destCategory);

                if (!from || !to) {
                    console.error("Failed to find the source or destination category !");
                    return newCats;
                }

                const oldIndex: number = from.items.findIndex((i: DndItem): boolean => i.id === active.id);
                let newIndex: number = to.items.findIndex((i: DndItem): boolean => i.id === over.id);

                if (oldIndex == -1 || (newIndex == -1 && to == from)) {
                    console.error("Failed to find the index item of origin");
                    return newCats;
                } else if (newIndex == -1)
                {
                    newIndex = 0;
                }

                const [moved] = from.items.splice(oldIndex, 1);

                if (from === to) {
                    from.items.splice(newIndex, 0, moved);
                } else {
                    to.items.splice(newIndex, 0, moved);
                }

                return newCats;
            });
        }
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={categories.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
            >
                {categories.map((cat) => (
                    <SortableCategory key={cat.id} category={cat}/>
                ))}
            </SortableContext>
        </DndContext>
    );
}