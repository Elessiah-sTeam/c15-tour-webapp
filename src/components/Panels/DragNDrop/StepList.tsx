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

import { Fragment } from "react";
import type {Itinerary, Segment} from "../../../customObject/Itinerary/types.ts";
import SortableCategory from "./SortableCategory";
import SortablePDP from "./SortablePDP.tsx";
import PauseLine from "./PauseLine.tsx";
import {type DndProps, useDragNDrop} from "./UseDragNDrop.tsx";
import {useItinerary} from "../../../customObject/Itinerary/UseItinerary.ts";
import {itineraryModel} from "../../../customObject/Itinerary/ItineraryStore.ts";

/**
 * Contient toute la partie DragNDrop sur les segments, et les étapes
 */
export default function StepList() {
    const itinerary: Itinerary = useItinerary(itineraryModel.store);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );
    const dnd: DndProps = useDragNDrop();

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={dnd.handleDragStart}
            onDragEnd={dnd.handleDragEnd}
        >
            <SortableContext
                items={itinerary.segments.map((c: Segment) => c.id)}
                strategy={verticalListSortingStrategy}
            >
                {itinerary.segments.map((cat: Segment) =>
                    <Fragment key={cat.id}>
                        <SortableCategory
                            visible={!(cat.id == dnd.activeCat?.id)}
                            category={cat}
                            idActiveItem={dnd.activeItem?.id ? dnd.activeItem.id : null}
                        />
                        {!cat.isStartEnd && (cat.content.breakDuration ?? 0) > 0 && (
                            <PauseLine durationSeconds={cat.content.breakDuration ?? 0} />
                        )}
                    </Fragment>
            )}
            </SortableContext>
            <DragOverlay>
                {dnd.activeItem ? (
                    <SortablePDP
                        visible={true}
                        item={dnd.activeItem}
                        categoryId={"overlay"}
                        isStartEnd={false} />
                ) : null}
                {dnd.activeCat ? (
                    <SortableCategory
                        visible={true}
                        category={dnd.activeCat}
                        idActiveItem={null} />
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
