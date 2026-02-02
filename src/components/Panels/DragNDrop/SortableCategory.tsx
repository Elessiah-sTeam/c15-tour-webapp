import { SortableContext, verticalListSortingStrategy} from "@dnd-kit/sortable";
import SortableStepHeader from "./SortableStepHeader.tsx";
import SortablePDP from "./SortablePDP.tsx";
import type {Segment, Step} from "../../../customObject/Itinerary/types.ts";
import {EmptyDropZone} from "./EmptyDropZone.tsx";
import {itineraryModel} from "../../../customObject/Itinerary/ItineraryStore.ts";
import {TimeSpan} from "../../../customObject/TimeSpan.ts";

type Props = {
    category: Segment,
    visible: boolean,
    idActiveItem: string  | null,
}

/**
 * Composant DragNDrop pour les segments, étant des catégories
 * @param category objet snapshot du segment
 * @param visible visibilité du segment
 * @param idActiveItem ID de la potentielle étape active
 */
export default function SortableCategory({ category, visible, idActiveItem}: Props) {

    function handleNewStep()
    {
        itineraryModel.addStep(
            category.id,
            {
                id: "newstep" + new Date().toISOString(), content: {
                    title: "Nouvelle étape",
                    duration: new TimeSpan()
                }
            });
    }

    /**
     * Permet de créer un nouveau segment
     *
     * Génère un ID unique avec la date, il serait un intéressant de le passer en paramètre
     */
    function handleNewSegment(): void {
        itineraryModel.addSegment({
            id: "newseg" + new Date().toISOString(),
            content: {
                title: "Nouveau segment",
                hour: new Date(),
                duration: new TimeSpan(),
            },
            isStartEnd: false,
            steps: new Array<Step>()
        });
    }

    return (
        <div
            className={"category-box"}
            style={{opacity: visible ? 1 : 0}}
        >
            { !category.isStartEnd ? <SortableStepHeader category={category} model={itineraryModel} /> : <></> }
            { category.id == "end" ?
                <p
                    className={"add-seg-btn"}
                    onClick={handleNewSegment}
                >
                    Ajouter un segment
                </p>
            :
            <></>
            }

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
            { !category.isStartEnd ?
                <p
                    className={"add-step-btn"}
                    onClick={handleNewStep}
                >
                    Ajouter une étape
                </p>
                    :
                <></>
            }
        </div>
    )
}