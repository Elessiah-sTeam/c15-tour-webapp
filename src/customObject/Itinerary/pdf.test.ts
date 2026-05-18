import { describe, expect, it } from "vitest";
import type { Feature, LineString } from "geojson";
import { TimeSpan } from "../TimeSpan";
import { collectPdfSections } from "./pdf";
import type { Itinerary, Segment } from "./types";

type SegmentOverride = {
    id?: string;
    isStartEnd?: boolean;
    content?: Partial<Segment["content"]>;
    steps?: Segment["steps"];
};

function buildSegment(overrides: SegmentOverride = {}): Segment {
    return {
        id: overrides.id ?? "segment-1",
        isStartEnd: overrides.isStartEnd ?? false,
        content: {
            title: overrides.content?.title ?? "Trajet",
            hour: overrides.content?.hour ?? new Date("2026-05-14T08:00:00.000Z"),
            duration: overrides.content?.duration ?? new TimeSpan(3_600_000),
            distance: overrides.content?.distance ?? 42,
            geometry: overrides.content?.geometry,
        },
        steps: overrides.steps ?? [],
    };
}

function buildItinerary(segments: Segment[]): Itinerary {
    return {
        id: 1,
        name: "C15 Tour",
        shareCode: "",
        totalDuration: new TimeSpan(7_200_000),
        totalDistance: 84,
        segments,
        draft: true,
    };
}

describe("collectPdfSections", () => {
    it("ignores synthetic start and end segments", () => {
        const geometry: Feature<LineString> = {
            type: "Feature",
            geometry: {
                type: "LineString",
                coordinates: [
                    [2, 48],
                    [3, 49],
                ],
            },
            properties: {},
        };

        const itinerary = buildItinerary([
            buildSegment({ id: "start", isStartEnd: true, content: { title: " ", geometry: undefined } }),
            buildSegment({
                id: "leg-1",
                content: {
                    title: "Premier tronçon",
                    hour: new Date("2026-05-14T08:15:00.000Z"),
                    duration: new TimeSpan(1_800_000),
                    distance: 15,
                    geometry,
                },
                steps: [
                    { id: "a", isDefaultSegStart: false, content: { title: "Départ", duration: new TimeSpan(), location: { lat: 48, lon: 2 } } },
                    { id: "b", isDefaultSegStart: false, content: { title: "Arrivée", duration: new TimeSpan(), location: { lat: 49, lon: 3 } } },
                ],
            }),
            buildSegment({ id: "end", isStartEnd: true, content: { title: " ", geometry: undefined } }),
        ]);

        const sections = collectPdfSections(itinerary);

        expect(sections).toHaveLength(1);
        expect(sections[0].title).toBe("Premier tronçon");
        expect(sections[0].routePoints).toHaveLength(2);
        expect(sections[0].stepTitles).toEqual(["Départ", "Arrivée"]);
    });

    it("falls back to step locations when geometry is missing", () => {
        const itinerary = buildItinerary([
            buildSegment({
                id: "start",
                isStartEnd: true,
                content: { title: " ", geometry: undefined },
            }),
            buildSegment({
                id: "leg-2",
                content: {
                    title: "Sans géométrie",
                    hour: new Date("2026-05-14T09:00:00.000Z"),
                    duration: new TimeSpan(900_000),
                    distance: 5,
                    geometry: undefined,
                },
                steps: [
                    { id: "x", isDefaultSegStart: false, content: { title: "Point A", duration: new TimeSpan(), location: { lat: 47.2, lon: -1.4 } } },
                    { id: "y", isDefaultSegStart: false, content: { title: "Point B", duration: new TimeSpan(), location: { lat: 47.3, lon: -1.2 } } },
                ],
            }),
            buildSegment({ id: "end", isStartEnd: true, content: { title: " ", geometry: undefined } }),
        ]);

        const sections = collectPdfSections(itinerary);

        expect(sections).toHaveLength(1);
        expect(sections[0].routePoints).toEqual([
            { lat: 47.2, lon: -1.4, label: "Point A" },
            { lat: 47.3, lon: -1.2, label: "Point B" },
        ]);
    });
});
