import './Panels.css';
import * as React from "react";
import {type unitTimeSpan, TimeSpan, TimespanOffset} from "../../customObject/TimeSpan.ts";

type Props = {
    duration?: TimeSpan;
    hour?: Date;
    isStartEnd: boolean;
    children: React.ReactNode;
    categoryId: string;
    itemId?: string;
    isDefault: boolean;
    rightComponent?: React.ReactNode;
}

const units: unitTimeSpan = {days: ":", hours: ":", minutes: "", seconds: "", milliseconds: ""};

/**
 * Composant qui englobe le titre et contient l'heure et la durÃ©e
 * @param duration durÃ©e Ã  afficher
 * @param hour heure Ã  afficher
 * @param isStartEnd indique si c'est un dÃ©part ou une arrivÃ©e
 * @param children Composant englobÃ©
 * @param categoryId ID de la catÃ©gorie concernÃ©
 * @param itemId ID de l'item concernÃ©
 * @param isDefault Est-ce que c'est dÃ©part par dÃ©faut. Donc est-il DND
 * @param rightComponent Bouton d'action affichÃ© Ã  droite
 */
export default function Item({
                                 duration,
                                 hour,
                                 isStartEnd,
                                 children,
                                 isDefault,
                                 rightComponent
}: Props) {
    duration = Object.assign(new TimeSpan(), duration);

    return (
        <div className={"item"}>
            <div className={"left-part-item"}>
                {children}
            </div>
            {isStartEnd
                ? <b className={"hour"}>{hour?.getHours()}:{hour?.getMinutes().toString().padStart(2, "0")}</b>
                : <b className={"hour"}>{duration?.toFStr(TimespanOffset.MINUTES, units)}</b>}
            {!isDefault && rightComponent ? rightComponent : <></>}
        </div>
    )
}
