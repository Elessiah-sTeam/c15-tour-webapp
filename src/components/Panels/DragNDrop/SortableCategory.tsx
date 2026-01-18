import { SortableContext, verticalListSortingStrategy} from "@dnd-kit/sortable";
import SortableStepHeader from "./SortableStepHeader.tsx";
import SortablePDP from "./SortablePDP.tsx";
import type {Segment} from "../../../customObject/Itinerary/types.ts";
import {EmptyDropZone} from "./EmptyDropZone.tsx";

export default function SortableCategory({ category, visible, idActiveItem}: { category: Segment, visible: boolean, idActiveItem: string  | null }) {
    return (
        <div
            className={"category-box"}
            style={{opacity: visible ? 1 : 0}}
        >
            { !category.isStartEnd ? <SortableStepHeader category={category} /> : <></> }

            <SortableContext
                items={category.steps.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
            >
                {category.steps.length > 0 ? category.steps.map((item) => (
                    <SortablePDP
                        key={item.id}
                        visible={!(item.id === idActiveItem)}
                        item={item}
                        categoryId={category.id}
                        isStartEnd={category.isStartEnd}
                        hour={category.isStartEnd ? category.content.hour : undefined}
                    />
                )) :
                <EmptyDropZone categoryId={category.id}/>}
            </SortableContext>
        </div>
    )
}