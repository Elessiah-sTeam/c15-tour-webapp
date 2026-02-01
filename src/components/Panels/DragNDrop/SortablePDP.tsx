import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Step } from "../../../customObject/Itinerary/types.ts";
import Item from "../Item.tsx";
import SubTitleWHour from "../SubTitleWHour.tsx";
import type {ItineraryModel} from "../../../customObject/Itinerary/ItineraryModel.ts";

type Props = {
    visible: boolean,
    model: ItineraryModel,
    item: Step;
    categoryId: string;
    isStartEnd: boolean;
    hour?: Date;
};

export default function SortablePDP({visible, model, item, categoryId, isStartEnd, hour}: Props) {
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
          <Item isStartEnd={isStartEnd} duration={item.content.duration} hour={hour}>
              <SubTitleWHour
                  tag={isStartEnd ? "h2" : "h3"}
                  model={model}
                  imgPath={isStartEnd ? '/icons/depart-icon.png' : '/icons/pdp-icon.png'}
                  segmentId={categoryId}
                  stepId={item.id}
                  subtitle={item.content.title}
                  hour={null}/>
          </Item>
      </div>
    );
}