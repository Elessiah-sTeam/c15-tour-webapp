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
    const steps = segment.steps.length === 0
        ? [startCopy]
        : [startCopy, ...segment.steps.slice(1)]

    return { ...segment, steps};
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

    if (segments.length == NB_START_END || segments[FIRST_SEG_INDEX].steps.length == 0)
        return segments;

    const out = [...segments];

    out[0] = applyStart(out[0], out[FIRST_SEG_INDEX].steps[0]);

    applyStart(segments[0], segments[FIRST_SEG_INDEX].steps[0]);
    for (let i = FIRST_SEG_INDEX; i < END_SEG_INDEX; i++) {
        out[i + 1] = applyStart(out[i + 1], out[i].steps[out[i].steps.length - 1]);
    }

    return out;
}