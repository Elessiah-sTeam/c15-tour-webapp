import { SortableContext, verticalListSortingStrategy} from "@dnd-kit/sortable";
import SortableStepHeader from "./SortableStepHeader.tsx";
import SortablePDP from "./SortablePDP.tsx";
import type { DndCat } from "../../../dndTypes.ts";
import {EmptyDropZone} from "./EmptyDropZone.tsx";

export default function SortableCategory({ category }: { category: DndCat }) {
    return (
        <div className={"category-box"}>
            <SortableStepHeader category={category} />

            <SortableContext
                items={category.items.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
            >
                {category.items.length > 0 ? category.items.map((item) => (
                    <SortablePDP key={item.id} item={item} categoryId={category.id} />
                )) :
                <EmptyDropZone categoryId={category.id}/>}
            </SortableContext>
        </div>
    )
}