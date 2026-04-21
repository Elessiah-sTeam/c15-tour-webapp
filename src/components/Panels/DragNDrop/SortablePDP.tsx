import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Step } from "../../../customObject/Itinerary/types.ts";
import Item from "../Item.tsx";
import SubTitleWHour from "../SubTitleWHour.tsx";

type Props = {
    visible: boolean,
    item: Step;
    categoryId: string;
    isStartEnd: boolean;
    hour?: Date;
};

/**
 * Composant DragNDrop d'une étape
 * @param visible défini sa visibilité
 * @param item objet snapshot de l'étape
 * @param categoryId ID de la catégorie parent
 * @param isStartEnd Signifie s'il est l'arrivée ou le départ
 * @param hour durée de l'étape
 */
export default function SortablePDP({visible, item, categoryId, isStartEnd, hour}: Props) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
        id: item.id,
        data: { type: "item", categoryId}
    });

    return (
      <div
          ref={setNodeRef}
          className={"item-row"}
          style={{ transform: CSS.Translate.toString(transform), transition, opacity: visible ? 1 : 0 }}
          {...attributes}
          {...listeners}
      >
          <Item
              isStartEnd={isStartEnd}
              duration={item.content.duration}
              hour={isStartEnd ? hour : undefined}
              itemId={item.id}
              categoryId={categoryId}
              isDefault={item.isDefaultSegStart}
              title={item.content.title}
          >
              <SubTitleWHour
                  tag={isStartEnd ? "h2" : "h3"}
                  imgPath={isStartEnd ? '/icons/depart-icon.png' : '/icons/pdp-icon.png'}
                  segmentId={categoryId}
                  stepId={item.id}
                  subtitle={item.content.title}
                  hour={null}
                  isDefaultSegStart={isStartEnd}
              />
          </Item>
      </div>
    );
}
