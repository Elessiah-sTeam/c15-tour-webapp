import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { DndItem } from "../../../dndTypes.ts";
import Item from "../Item.tsx";
import SubTitleWHour from "../SubTitleWHour.tsx";

type Props = {
    item: DndItem;
    categoryId: string;
};

export default function SortablePDP({item, categoryId}: Props) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
        id: item.id,
        data: { type: "item", categoryId}
    });

    return (
      <div
          ref={setNodeRef}
          className={"item-row"}
          style={{ transform: CSS.Translate.toString(transform), transition }}
          {...attributes}
          {...listeners}
      >
          <Item duration={item.content.duration}>
              <SubTitleWHour tag={"h3"} imgPath={'/icons/pdp-icon.png'} txt={item.content.title} hour={null}/>
          </Item>
      </div>
    );
}