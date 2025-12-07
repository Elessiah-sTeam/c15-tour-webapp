import {useSortable} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { DndCat } from "../../../dndTypes.ts";
import SubTitleWHour from "../SubTitleWHour.tsx";
import Item from "../Item.tsx";

export default function SortableStepHeader({category} : {category: DndCat}) {
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
            <Item duration={category.content.duration}>
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