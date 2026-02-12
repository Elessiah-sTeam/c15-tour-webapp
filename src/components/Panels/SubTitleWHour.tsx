import type {JSX} from "react";
import './Panels.css';
import ClickInput from "../ClickInput.tsx";
import {itineraryModel} from "../../customObject/Itinerary/ItineraryStore.ts";
import type {ItineraryModel} from "../../customObject/Itinerary/ItineraryModel.ts";
type Props = {
    tag: keyof JSX.IntrinsicElements,
    imgPath: string,
    segmentId: string,
    stepId?: string,
    subtitle: string,
    hour: Date | null,
    model?: ItineraryModel
}

/**
 * Affiche le sous-titre avec l'heure
 * @param Tag Nom de la balise HTML pour le sous-titre
 * @param imgPath Chemin de l'icone à afficher à gauche
 * @param segmentId ID du segment/segment parent
 * @param stepId Optionnel Id de l'étape
 * @param subtitle valeur initial du sous-titre
 * @param hour heure à afficher
 * @constructor
 */
export default function SubTitleWHour({tag: Tag, imgPath, segmentId, stepId, subtitle, hour}: Props) {

    /**
     * Fonction appelé par le composant ClickInput pour mettre à jour la valeur du sous-titre
     * @param newString Nouveau sous-titre à appliquer
     */
    function manageSetter(newString: string)
    {
        if (stepId != undefined) {
            itineraryModel.renameStep(segmentId, stepId, newString);
        } else {
            itineraryModel.renameSegment(segmentId, newString);
        }
    }

    const classNameIcon: string = "icon-" + Tag;
    const className: string = Tag == "h2" ? "segmentTitle" : "stepTitle";
    return (
        <div className={"subtitle"}>
            <div className={"left"}>
                <img src={imgPath} alt="" className={classNameIcon} />
                <ClickInput currentStr={subtitle} setter={manageSetter} Tag={Tag} className={className}/>
            </div>
            {hour ?
                <b className={"hour"}>{hour.getHours()}:{hour.getMinutes().toString().padStart(2, "0")}</b>
                :
                <></>
            }
        </div>
    )
}
