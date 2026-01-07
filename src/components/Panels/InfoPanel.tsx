import './Panels.css';
import {type TimeSpan, TimespanOffset, type unitTimeSpan} from "../../customObject/TimeSpan.ts";
import {useEffect} from "react";

type Props = {
    totalDistance: number,
    totalTime: TimeSpan,
}

export default function InfoPanel({ totalDistance, totalTime }: Props) {
    const units: unitTimeSpan = {days: "J ", hours: "H ", minutes: "MIN ", seconds: "S ", milliseconds: "MS "}

    useEffect(() => {}, [totalDistance, totalTime]);

    return (
        <div className={"info-panel"}>
            <h1>Total</h1>
            <div className={"total-info"}>
                <h2>{totalDistance + " KM"}</h2>
                <h2>{totalTime.toFStr(TimespanOffset.MINUTES, units)}</h2>
            </div>
        </div>
    )
}