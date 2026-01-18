import {useSortable} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Segment } from "../../../customObject/Itinerary/types.ts";
import SubTitleWHour from "../SubTitleWHour.tsx";
import Item from "../Item.tsx";

export default function SortableStepHeader({category} : {category: Segment}) {
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
            <Item duration={category.content.duration} isStartEnd={false}>
                <SubTitleWHour
                    tag={"h2"}
                    imgPath={"/icons/etape-icon.png"}
                    txt={category.content.title}
                    hour={category.content.hour}
                />
            </Item>
        </div>
    );
}