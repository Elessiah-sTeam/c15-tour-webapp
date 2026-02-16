import {useSortable} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Segment } from "../../../customObject/Itinerary/types.ts";
import SubTitleWHour from "../SubTitleWHour.tsx";
import ItineraryModel from "../../../customObject/Itinerary/ItineraryModel.ts";
import Item from "../Item.tsx";

export default function SortableStepHeader({category, model} : {category: Segment, model: ItineraryModel}) {
    const { attributes, listeners, setNodeRef, transform, transition } =
        useSortable({
            id: category.id,
            data: { type: "category" }
        });

    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Translate.toString(transform), transition }}
            className={"StepHeader"}
            {...attributes}
            {...listeners}
        >
            <Item
                duration={category.content.duration}
                isStartEnd={false}
                categoryId={category.id}
                isDefault={false}
            >
                <SubTitleWHour
                    tag={"h2"}
                    model={model}
                    imgPath={"/icons/etape-icon.png"}
                    segmentId={category.id}
                    subtitle={category.content.title}
                    hour={category.content.hour}
                />
            </Item>
        </div>
    );
}