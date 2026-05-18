import './Panels.css';
import * as React from "react";
import {type unitTimeSpan, TimeSpan, TimespanOffset} from "../../customObject/TimeSpan.ts";
import {useDeleteMod} from "../../customObject/DeleteMod/useDeleteMod.ts";
import {deleteModStore} from "../../customObject/DeleteMod/DeleteModStore.ts";
import {Trash} from "lucide-react";
import {itineraryModel} from "../../customObject/Itinerary/ItineraryStore.ts";

type Props = {
    duration?: TimeSpan;
    hour?: Date;
    isStartEnd: boolean;
    children: React.ReactNode;
    categoryId: string;
    itemId?: string;
    isDefault: boolean;
}

const units: unitTimeSpan = {days: ":", hours: ":", minutes: "", seconds: "", milliseconds: ""};

/**
 * Composant qui englobe le titre et contient l'heure et la durée
 * @param duration durée à afficher
 * @param hour heure à afficher
 * @param isStartEnd indique si c'est un départ ou une arrivée
 * @param children Composant englobé
 * @param categoryId ID de la catégorie concerné
 * @param itemId ID de l'item concerné
 * @param isDefault Est-ce que c'est départ par défaut. Donc est-il DND
 */
export default function Item({
                                 duration,
                                 hour,
                                 isStartEnd,
                                 children,
                                 categoryId,
                                 itemId,
                                 isDefault
}: Props) {
    const delMod = useDeleteMod(deleteModStore)
    duration = Object.assign(new TimeSpan(), duration);

    /**
     * Gère la suppression de l'étape ou du segment
     */
    function handleDelete() {
        if (itemId != null)
            itineraryModel.removeStep(categoryId, itemId);
        else
            itineraryModel.removeSegment(categoryId);
    }

    return (
        <div className={"item"}>
            <div className={"left-part-item"}>
                {children}
            </div>
            {isStartEnd ? <b className={"hour"}>{hour?.getHours()}:{hour?.getMinutes().toString().padStart(2, "0")}</b> : <b className={"hour"}>{duration?.toFStr(TimespanOffset.MINUTES, units)}</b>}
            {isDefault ?
                <> </>
                : delMod
                    ?
                    <button type="button" className={"reorder-icon-btn"} aria-label="Supprimer" onClick={handleDelete}>
                        <Trash className={"reorder-icon"} color={"#BB487C"} />
                    </button>
                    :
                    <img className={"reorder-icon"} src="/icons/dragdrop-icon.png" alt={""}/>
            }
        </div>
    )
}