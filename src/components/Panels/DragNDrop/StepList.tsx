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

import type {Itinerary, Segment} from "../../../customObject/Itinerary/types.ts";
import SortableCategory from "./SortableCategory";
import SortablePDP from "./SortablePDP.tsx";
import {type DndProps, useDragNDrop} from "./UseDragNDrop.tsx";
import type {ItineraryModel} from "../../../customObject/Itinerary/ItineraryModel.ts";
import {useItinerary} from "../../../customObject/Itinerary/UseItinerary.ts";

type Props = {
    itineraryModel: ItineraryModel;
}

export default function StepList({itineraryModel}: Props) {
    const itinerary: Itinerary = useItinerary(itineraryModel.store);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );
    const dnd: DndProps = useDragNDrop({ itineraryModel });

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={dnd.handleDragStart}
            onDragMove={dnd.handleDragMove}
            onDragEnd={dnd.handleDragEnd}
        >
            <SortableContext
                items={itinerary.segments.map((c: Segment) => c.id)}
                strategy={verticalListSortingStrategy}
            >
                {itinerary.segments.map((cat: Segment) =>
                    <SortableCategory
                        key={cat.id}
                        visible={!(cat.id == dnd.activeCat?.id)}
                        category={cat}
                        idActiveItem={dnd.activeItem?.id ? dnd.activeItem.id : null}
                        itineraryModel={itineraryModel}
                    />
            )}
            </SortableContext>
            <DragOverlay>
                {dnd.activeItem ? (
                    <SortablePDP
                        visible={true}
                        model={itineraryModel}
                        item={dnd.activeItem}
                        categoryId={"overlay"}
                        isStartEnd={false} />
                ) : null}
                {dnd.activeCat ? (
                    <SortableCategory
                        visible={true}
                        category={dnd.activeCat}
                        idActiveItem={null}
                        itineraryModel={itineraryModel} />
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}