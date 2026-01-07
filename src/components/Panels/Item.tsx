import './Panels.css';
import * as React from "react";
import {type unitTimeSpan, TimeSpan, TimespanOffset} from "../../customObject/TimeSpan.ts";

type Props = {
    duration?: TimeSpan;
    hour?: Date;
    isStartEnd: boolean;
    children: React.ReactNode;
}

const units: unitTimeSpan = {days: ":", hours: ":", minutes: "", seconds: "", milliseconds: ""};

export default function Item({duration, hour, isStartEnd, children}: Props) {
    duration = Object.assign(new TimeSpan(), duration);
    return (
        <div className={"item"}>
            <div className={"left-part-item"}>
                {children}
            </div>
            {isStartEnd ? <b className={"hour"}>{hour?.getHours()}:{hour?.getMinutes().toString().padStart(2, "0")}</b> : <b className={"hour"}>{duration?.toFStr(TimespanOffset.MINUTES, units)}</b>}
            <img className={"reorder-icon"} src="/icons/dragdrop-icon.png" alt={""}/>
        </div>
    )
}