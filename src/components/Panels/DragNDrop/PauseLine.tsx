import { Coffee } from "lucide-react";
import "../Panels.css";
import { formatTotalPauseDuration } from "../infoPanelUtils.ts";

type Props = {
    durationSeconds: number;
};

/**
 * Ligne affichant la pause d'un segment, intercalée entre deux segments
 * @param durationSeconds durée de la pause en secondes (breakDuration du segment)
 */
export default function PauseLine({ durationSeconds }: Props) {
    const label = `Pause de ${formatTotalPauseDuration(durationSeconds).trim()}`;

    return (
        <div className={"pause-line"} title={label} aria-label={label}>
            <span className={"pause-line-label"}>
                <Coffee className={"pause-line-icon"} aria-hidden={true} />
                Pause
            </span>
            <span className={"pause-line-value"}>
                {formatTotalPauseDuration(durationSeconds)}
            </span>
        </div>
    );
}
