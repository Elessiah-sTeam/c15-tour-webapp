import { SortableContext, verticalListSortingStrategy} from "@dnd-kit/sortable";
import SortableStepHeader from "./SortableStepHeader.tsx";
import SortablePDP from "./SortablePDP.tsx";
import type {DndCat} from "../../../dndTypes.ts";
import {EmptyDropZone} from "./EmptyDropZone.tsx";

export default function SortableCategory({ category, visible, idActiveItem}: { category: DndCat, visible: boolean, idActiveItem: string  | null }) {
    return (
        <div
            className={"category-box"}
            style={{opacity: visible ? 1 : 0}}
        >
            { !category.isStartEnd ? <SortableStepHeader category={category} /> : <></> }

            <SortableContext
                items={category.items.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
            >
                {category.items.length > 0 ? category.items.map((item) => (
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