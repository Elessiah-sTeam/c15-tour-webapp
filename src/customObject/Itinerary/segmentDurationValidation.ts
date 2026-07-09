import type { Itinerary, Segment } from "./types.ts";
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
 * Recense les segments dont la durée sort des bornes min/max définies dans les
 * paramètres globaux. Les segments de départ/arrivée sont ignorés.
 * @param itinerary itinéraire à contrôler
 * @param bounds durées min et max autorisées, en heures
 */
export function findSegmentDurationViolations(
    itinerary: Itinerary,
    bounds: SegmentDurationBounds
): SegmentDurationViolation[] {
    const { minSegmentDuration, maxSegmentDuration } = bounds;

    return itinerary.segments.filter(isCheckableSegment).flatMap((segment) => {
        const hours = normalizeDuration(segment.content.duration).duration / MS_PER_HOUR;
        const segmentName = segment.content.title || "Segment sans nom";
        const durationLabel = formatDurationLabel(segment.content.duration);

        if (hours < minSegmentDuration) {
            return [{ segmentName, durationLabel, kind: "min" as const }];
        }
        if (hours > maxSegmentDuration) {
            return [{ segmentName, durationLabel, kind: "max" as const }];
        }
        return [];
    });
}

/**
 * Construit le message d'erreur affiché lorsqu'un ou plusieurs segments ne
 * respectent pas les bornes de durée.
 * @param violations segments hors bornes
 * @param bounds durées min et max autorisées, en heures
 */
export function buildSegmentDurationErrorMessage(
    violations: SegmentDurationViolation[],
    bounds: SegmentDurationBounds
): string {
    const details = violations
        .map((violation) => {
            const bound = violation.kind === "min"
                ? `en dessous du minimum de ${bounds.minSegmentDuration}h`
                : `au-dessus du maximum de ${bounds.maxSegmentDuration}h`;
            return `« ${violation.segmentName} » (${violation.durationLabel}) est ${bound}`;
        })
        .join(" ; ");

    return `Impossible d'enregistrer : ${details}.`;
}
