import { describe, it, expect } from "vitest";
import {
    buildSegmentDurationHint,
    getSegmentDurationViolation,
} from "./segmentDurationValidation.ts";
import type { Segment } from "./types.ts";
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
