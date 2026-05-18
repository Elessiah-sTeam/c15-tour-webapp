import {TimeSpan} from "../TimeSpan.ts";
import type {Segment, Step} from "./types.ts";

/**
 * Applique le départ à un segment
 * @param segment segment à modifier
 * @param start départ à ajouter
 * @private
 */
function applyStart(segment: Segment,
    start: Step): Segment {
    const startCopy: Step = {...start, id: "start-" + segment.id, isDefaultSegStart: true};
    const steps: Step[] = segment.steps.length === 0
        ? [startCopy]
        : [startCopy, ...segment.steps];

    return { ...segment, steps};
}

function normalizeHour(hour: Date | string | number | undefined): Date {
    const normalized = hour instanceof Date ? new Date(hour.getTime()) : new Date(hour ?? Date.now());
    return Number.isNaN(normalized.getTime()) ? new Date() : normalized;
}

function getSegmentDurationMs(segment: Segment): number {
    const duration = Object.assign(new TimeSpan(), segment.content.duration);
    return duration.duration;
}

/**
 * Mets à jour les départs de segment
 * @param segments à mettre jour
 * @private
 */
export function updateStarts(segments: Segment[]): Segment[] {
    const NB_START_END = 2;
    const FIRST_SEG_INDEX = 1;
    const END_SEG_INDEX = segments.length - 1;

    const out: Segment[] = segments.map(seg => ({
        ...seg,
        content: {
            ...seg.content,
            hour: normalizeHour(seg.content.hour)
        },
        steps: seg.steps.filter(s => !s.isDefaultSegStart),
    }));

    if (out.length === 0)
        return out;

    out[0].content.hour = normalizeHour(out[0].content.hour);
    for (let i = FIRST_SEG_INDEX; i < out.length; i++) {
        out[i].content.hour = new Date(out[i - 1].content.hour.getTime() + getSegmentDurationMs(out[i - 1]));
    }

    if (out.length == NB_START_END || out[FIRST_SEG_INDEX].steps.length == 0)
        return out;

    out[0] = applyStart(out[0], out[FIRST_SEG_INDEX].steps[0]);

    for (let i = FIRST_SEG_INDEX; i < END_SEG_INDEX; i++) {
        out[i + 1] = applyStart(out[i + 1], out[i].steps[out[i].steps.length - 1]);
    }

    return out;
}
