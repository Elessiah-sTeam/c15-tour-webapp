import {useDroppable} from "@dnd-kit/core";

export function EmptyDropZone({categoryId}: {categoryId: string}) {
    const {setNodeRef} = useDroppable({
        id: `emptyDropZone_${categoryId}`,
        data: {
            type: "item",
            categoryId
        }
    });

    return (
        <div
            ref={setNodeRef}
            style={{
                minHeight: "30px",
                border: "1px dashed #888",
                margin: "4px 0",
                borderRadius: "4px",
                opacity: 0.5
            }}
        />
    );
}