import { SortableContext, verticalListSortingStrategy} from "@dnd-kit/sortable";
import { useEffect, useState } from "react";
import SortableStepHeader from "./SortableStepHeader.tsx";
import SortablePDP from "./SortablePDP.tsx";
import type {Segment, Step} from "../../../customObject/Itinerary/types.ts";
import {EmptyDropZone} from "./EmptyDropZone.tsx";
import {itineraryModel} from "../../../customObject/Itinerary/ItineraryStore.ts";
import {TimeSpan} from "../../../customObject/TimeSpan.ts";
import {requestSearchForStep} from "../../../customObject/Search/SearchIntentStore.ts";

const DURATION_ALERT_DURATION_MS = 4000;

/**
 * Message temporaire signalant une durée de segment hors bornes. Il se masque
 * seul après quelques secondes ; on le remonte via une `key` pour rejouer
 * l'alerte à chaque nouveau dépassement.
 */
function SegmentDurationAlert({ message }: Readonly<{ message: string }>) {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setVisible(false), DURATION_ALERT_DURATION_MS);
        return () => clearTimeout(timer);
    }, []);

    if (!visible) {
        return null;
    }

    return <output className={"segment-duration-alert"}>{message}</output>;
}

type Props = {
    category: Segment,
    visible: boolean,
    idActiveItem: string  | null,
    durationHint?: string | null,
}

/**
 * Composant DragNDrop pour les segments, étant des catégories
 * @param category objet snapshot du segment
 * @param visible visibilité du segment
 * @param idActiveItem ID de la potentielle étape active
 * @param durationHint message si la durée du segment sort des bornes, sinon null
 */
export default function SortableCategory({ category, visible, idActiveItem, durationHint = null}: Readonly<Props>) {
    const [previousHint, setPreviousHint] = useState<string | null>(durationHint);
    const [flashId, setFlashId] = useState(0);

    if (durationHint !== previousHint) {
        setPreviousHint(durationHint);
        if (durationHint) {
            setFlashId((id) => id + 1);
        }
    }

    function handleNewStep()
    {
        const newStepId = "newstep" + new Date().toISOString();
        itineraryModel.addStep(
            category.id,
            {
                id: newStepId, content: {
                    title: "Nouvelle étape",
                    duration: new TimeSpan()
                },
                isDefaultSegStart: false,
            });
        requestSearchForStep({segmentId: category.id, stepId: newStepId});
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
                distance: 0,
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
            { !category.isStartEnd ? <SortableStepHeader category={category} model={itineraryModel} durationHint={durationHint} /> : <></> }
            { durationHint && flashId > 0 && (
                <SegmentDurationAlert key={flashId} message={durationHint} />
            )}
            { category.id == "end" ?
                <button
                    type="button"
                    className={"add-seg-btn"}
                    onClick={handleNewSegment}
                >
                    Ajouter un segment
                </button>
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
                <button
                    type="button"
                    className={"add-step-btn"}
                    onClick={handleNewStep}
                >
                    Ajouter une étape
                </button>
                    :
                <></>
            }
        </div>
    )
}
