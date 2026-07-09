import { describe, it, expect } from "vitest";
import {
    buildSegmentDurationErrorMessage,
    findSegmentDurationViolations,
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

describe("findSegmentDurationViolations", () => {
    it("ne retourne aucune violation quand tous les segments sont dans les bornes", () => {
        const itinerary = makeItinerary([makeSegment("a", 2), makeSegment("b", 3.5)]);

        expect(findSegmentDurationViolations(itinerary, bounds)).toEqual([]);
    });

    it("signale un segment trop court", () => {
        const itinerary = makeItinerary([makeSegment("a", 0.5)]);

        const violations = findSegmentDurationViolations(itinerary, bounds);

        expect(violations).toHaveLength(1);
        expect(violations[0].kind).toBe("min");
        expect(violations[0].durationLabel).toBe("0h30");
    });

    it("signale un segment trop long", () => {
        const itinerary = makeItinerary([makeSegment("a", 5)]);

        const violations = findSegmentDurationViolations(itinerary, bounds);

        expect(violations).toHaveLength(1);
        expect(violations[0].kind).toBe("max");
    });

    it("accepte les segments exactement aux bornes", () => {
        const itinerary = makeItinerary([makeSegment("a", 1), makeSegment("b", 4)]);

        expect(findSegmentDurationViolations(itinerary, bounds)).toEqual([]);
    });

    it("ignore les segments de départ/arrivée", () => {
        const itinerary = makeItinerary([
            makeSegment("start", 0, { isStartEnd: true }),
            makeSegment("end", 0, { isStartEnd: true }),
        ]);

        expect(findSegmentDurationViolations(itinerary, bounds)).toEqual([]);
    });
});

describe("buildSegmentDurationErrorMessage", () => {
    it("mentionne le nom du segment et la borne dépassée", () => {
        const itinerary = makeItinerary([makeSegment("a", 5)]);
        const violations = findSegmentDurationViolations(itinerary, bounds);

        const message = buildSegmentDurationErrorMessage(violations, bounds);

        expect(message).toContain("Segment a");
        expect(message).toContain("maximum de 4h");
        expect(message).toContain("Impossible d'enregistrer");
    });
});
