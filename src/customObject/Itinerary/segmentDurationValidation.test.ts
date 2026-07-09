import { describe, it, expect } from "vitest";
import {
    buildSegmentDurationHint,
    findSegmentDurationViolations,
    getSegmentDurationViolation,
} from "./segmentDurationValidation.ts";
import type { Itinerary, Segment } from "./types.ts";
import type { GlobalSettings } from "../../components/SettingsModal/settingsTypes.ts";
import { TimeSpan } from "../TimeSpan.ts";

const HOUR_MS = 3_600_000;

function makeSegment(id: string, hours: number, overrides: Partial<Segment> = {}): Segment {
    return {
        id,
        isStartEnd: false,
        steps: [],
        content: {
            title: `Segment ${id}`,
            hour: new Date(),
            duration: new TimeSpan(hours * HOUR_MS),
            distance: 0,
        },
        ...overrides,
    };
}

function makeItinerary(segments: Segment[]): Itinerary {
    return {
        id: 1,
        name: "Convoi",
        shareCode: "",
        totalDuration: new TimeSpan(),
        totalDistance: 0,
        segments,
        draft: true,
    };
}

const bounds: Pick<GlobalSettings, "minSegmentDuration" | "maxSegmentDuration"> = {
    minSegmentDuration: 1,
    maxSegmentDuration: 4,
};

describe("getSegmentDurationViolation", () => {
    it("retourne null quand la durée est dans les bornes", () => {
        expect(getSegmentDurationViolation(makeSegment("a", 2), bounds)).toBeNull();
    });

    it("retourne null pour un segment exactement aux bornes", () => {
        expect(getSegmentDurationViolation(makeSegment("a", 1), bounds)).toBeNull();
        expect(getSegmentDurationViolation(makeSegment("b", 4), bounds)).toBeNull();
    });

    it("signale un segment trop court", () => {
        const violation = getSegmentDurationViolation(makeSegment("a", 0.5), bounds);

        expect(violation?.kind).toBe("min");
        expect(violation?.durationLabel).toBe("0h30");
    });

    it("signale un segment trop long", () => {
        const violation = getSegmentDurationViolation(makeSegment("a", 5), bounds);

        expect(violation?.kind).toBe("max");
    });

    it("ignore les segments de départ/arrivée", () => {
        expect(getSegmentDurationViolation(makeSegment("start", 0, { isStartEnd: true }), bounds)).toBeNull();
        expect(getSegmentDurationViolation(makeSegment("end", 0), bounds)).toBeNull();
    });
});

describe("findSegmentDurationViolations", () => {
    it("ne retourne aucune violation quand tous les segments sont dans les bornes", () => {
        const itinerary = makeItinerary([makeSegment("a", 2), makeSegment("b", 3.5)]);

        expect(findSegmentDurationViolations(itinerary, bounds)).toEqual([]);
    });

    it("recense chaque segment hors bornes", () => {
        const itinerary = makeItinerary([makeSegment("a", 0.5), makeSegment("b", 2), makeSegment("c", 6)]);

        const violations = findSegmentDurationViolations(itinerary, bounds);

        expect(violations).toHaveLength(2);
        expect(violations.map((v) => v.kind)).toEqual(["min", "max"]);
    });
});

describe("buildSegmentDurationHint", () => {
    it("mentionne la durée et la borne max quand le segment est trop long", () => {
        const violation = getSegmentDurationViolation(makeSegment("a", 5), bounds)!;

        expect(buildSegmentDurationHint(violation, bounds)).toBe(
            "« Segment a » trop long : 5h00 (max 4h)"
        );
    });

    it("mentionne la borne min quand le segment est trop court", () => {
        const violation = getSegmentDurationViolation(makeSegment("a", 0.5), bounds)!;

        expect(buildSegmentDurationHint(violation, bounds)).toContain("trop court");
        expect(buildSegmentDurationHint(violation, bounds)).toContain("min 1h");
    });
});
