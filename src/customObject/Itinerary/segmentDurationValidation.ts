import type { Segment } from "./types.ts";
import type { GlobalSettings } from "../../components/SettingsModal/settingsTypes.ts";
import { TimeSpan } from "../TimeSpan.ts";

const MS_PER_HOUR = 3_600_000;

export type SegmentDurationBounds = Pick<GlobalSettings, "minSegmentDuration" | "maxSegmentDuration">;

export type SegmentDurationViolation = {
    segmentName: string;
    durationLabel: string;
    kind: "min" | "max";
};

function isCheckableSegment(segment: Segment): boolean {
    return !segment.isStartEnd && segment.id !== "start" && segment.id !== "end";
}

function normalizeDuration(duration?: TimeSpan): TimeSpan {
    return Object.assign(new TimeSpan(), duration);
}

function formatDurationLabel(duration?: TimeSpan): string {
    const composed = normalizeDuration(duration).getTimeSpanComposed();
    const totalHours = composed.days * 24 + composed.hours;
    return `${totalHours}h${String(composed.minutes).padStart(2, "0")}`;
}

/**
 * Contrôle la durée d'un segment contre les bornes min/max des paramètres
 * globaux. Renvoie `null` si la durée respecte les bornes ou s'il s'agit d'un
 * segment de départ/arrivée.
 * @param segment segment à contrôler
 * @param bounds durées min et max autorisées, en heures
 */
export function getSegmentDurationViolation(
    segment: Segment,
    bounds: SegmentDurationBounds
): SegmentDurationViolation | null {
    if (!isCheckableSegment(segment)) {
        return null;
    }

    const hours = normalizeDuration(segment.content.duration).duration / MS_PER_HOUR;
    if (hours >= bounds.minSegmentDuration && hours <= bounds.maxSegmentDuration) {
        return null;
    }

    return {
        segmentName: segment.content.title || "Segment sans nom",
        durationLabel: formatDurationLabel(segment.content.duration),
        kind: hours < bounds.minSegmentDuration ? "min" : "max",
    };
}

/**
 * Construit le message court affiché à côté d'un segment hors bornes.
 * @param violation segment hors bornes
 * @param bounds durées min et max autorisées, en heures
 */
export function buildSegmentDurationHint(
    violation: SegmentDurationViolation,
    bounds: SegmentDurationBounds
): string {
    return violation.kind === "min"
        ? `« ${violation.segmentName} » trop court : ${violation.durationLabel} (min ${bounds.minSegmentDuration}h)`
        : `« ${violation.segmentName} » trop long : ${violation.durationLabel} (max ${bounds.maxSegmentDuration}h)`;
}
