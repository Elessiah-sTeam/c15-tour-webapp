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
}

const units: unitTimeSpan = {days: ":", hours: ":", minutes: "", seconds: "", milliseconds: ""};

export default function Item({duration, hour, isStartEnd, children, categoryId, itemId}: Props) {
    const delMod = useDeleteMod(deleteModStore)
    duration = Object.assign(new TimeSpan(), duration);

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
            {delMod
                ?
                <Trash className={"reorder-icon"} color={"#BB487C"} onClick={() => {handleDelete();}}/>
                :
                <img className={"reorder-icon"} src="/icons/dragdrop-icon.png" alt={""}/>
            }
        </div>
    )
}