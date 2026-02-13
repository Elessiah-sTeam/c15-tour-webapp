import { Trash, Pencil, Settings, Upload } from "lucide-react";
import './Panels.css';
import {deleteModStore} from "../../customObject/DeleteMod/DeleteModStore.ts";
import {useDeleteMod} from "../../customObject/DeleteMod/useDeleteMod.ts";
import {itineraryModel} from "../../customObject/Itinerary/ItineraryStore.ts";

export default function ActionButtons() {
    const delMod = useDeleteMod(deleteModStore);

    return (
        <div className={"action-buttons"}>
            <button
                className={"global-settings-btn"}
                aria-label={"Paramètres globaux"}
            >
                <Settings color={"#BB487C"}/>
            </button>
            <button
                className={"delete-btn"}
                aria-label={"Supprimer"}
                onClick={() => {deleteModStore.set(prev => !prev)}}
            >
                { delMod
                    ?
                    <Pencil color={"#BB487C"}/>
                    :
                    <Trash color={"#BB487C"}/>
                }

            </button>
            <button
                className={"export-btn"}
                aria-label={"Export"}
                onClick={async() => {await itineraryModel.netModel.put()}}
            >
                <Upload color={"#BB487C"}/>
            </button>
        </div>
    );
}