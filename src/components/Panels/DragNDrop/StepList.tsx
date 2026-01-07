import {
    DndContext,
    DragOverlay,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";

import {
    SortableContext,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import {type Dispatch, type SetStateAction} from "react";
import type { DndCat } from "../../../dndTypes";
import SortableCategory from "./SortableCategory";
import SortablePDP from "./SortablePDP.tsx";
import {type DndProps, useDragNDrop} from "./UseDragNDrop.tsx";

type CategorySetter = Dispatch<SetStateAction<DndCat[]>>;

type Props = {
    categories: DndCat[];
    setCategories: CategorySetter;
}

export default function StepList({categories, setCategories}: Props) {
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );
    const dnd: DndProps = useDragNDrop({ categories, setCategories });

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={dnd.handleDragStart}
            onDragMove={dnd.handleDragMove}
            onDragEnd={dnd.handleDragEnd}
        >
            <SortableContext
                items={categories.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
            >
                {categories.map((cat) => (
                    <SortableCategory
                        key={cat.id}
                        visible={!(cat.id == dnd.activeCat?.id)}
                        category={cat}
                        idActiveItem={dnd.activeItem?.id ? dnd.activeItem.id : null}
                    />
                ))}
            </SortableContext>

            <DragOverlay>
                {dnd.activeItem ? (
                    <SortablePDP visible={true} item={dnd.activeItem} categoryId={"overlay"} isStartEnd={false} />
                ) : null}
                {dnd.activeCat ? (
                    <SortableCategory visible={true} category={dnd.activeCat} idActiveItem={null}/>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}