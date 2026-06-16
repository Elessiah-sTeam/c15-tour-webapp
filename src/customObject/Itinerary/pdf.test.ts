import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Feature, LineString } from "geojson";
import { TimeSpan } from "../TimeSpan";
import { collectPdfSections, downloadItineraryPdf, waypointListColumns } from "./pdf";
import type { Itinerary, Segment } from "./types";

// Les tuiles OSM déclenchent des requêtes réseau : on force le repli vectoriel (drawn: false).
vi.mock("./pdfMapTiles.ts", () => ({
    drawOsmTilesAndProjector: vi.fn(async () => ({ drawn: false })),
}));

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

    it("collects geolocated waypoints with their labels", () => {
        const itinerary = buildItinerary([
            buildSegment({ id: "start", isStartEnd: true, content: { title: " ", geometry: undefined } }),
            buildSegment({
                id: "leg-wp",
                content: { title: "Tronçon", geometry: undefined },
                steps: [
                    { id: "a", isDefaultSegStart: false, content: { title: "Départ", duration: new TimeSpan(), location: { lat: 47, lon: -1 } } },
                    { id: "m", isDefaultSegStart: false, content: { title: "Halte", duration: new TimeSpan(), location: { lat: 47.5, lon: -1.5 } } },
                    { id: "n", isDefaultSegStart: false, content: { title: "Sans coord", duration: new TimeSpan() } },
                    { id: "b", isDefaultSegStart: false, content: { title: "Arrivée", duration: new TimeSpan(), location: { lat: 48, lon: -2 } } },
                ],
            }),
            buildSegment({ id: "end", isStartEnd: true, content: { title: " ", geometry: undefined } }),
        ]);

        const sections = collectPdfSections(itinerary);

        expect(sections[0].waypoints).toEqual([
            { lat: 47, lon: -1, label: "Départ" },
            { lat: 47.5, lon: -1.5, label: "Halte" },
            { lat: 48, lon: -2, label: "Arrivée" },
        ]);
    });

    it("formats segment distances with a French decimal comma", () => {
        const itinerary = buildItinerary([
            buildSegment({ id: "start", isStartEnd: true, content: { title: " ", geometry: undefined } }),
            buildSegment({
                id: "leg-3",
                content: {
                    title: "Distance décimale",
                    hour: new Date("2026-05-14T09:30:00.000Z"),
                    duration: new TimeSpan(1_200_000),
                    distance: 12.5,
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
        expect(sections[0].distanceLabel).toBe("12,5 km");
    });
});

describe("waypointListColumns", () => {
    it("garde une seule colonne pour les tronçons courts", () => {
        expect(waypointListColumns(1)).toBe(1);
        expect(waypointListColumns(7)).toBe(1);
    });

    it("passe à deux puis trois colonnes selon le nombre de points", () => {
        expect(waypointListColumns(8)).toBe(2);
        expect(waypointListColumns(16)).toBe(2);
        expect(waypointListColumns(17)).toBe(3);
        expect(waypointListColumns(40)).toBe(3);
    });
});

describe("downloadItineraryPdf", () => {
    // jsdom n'implémente pas le canvas : on simule un contexte 2D qui absorbe tous les appels de dessin.
    function createMockContext(): CanvasRenderingContext2D {
        const gradient = { addColorStop: vi.fn() };
        return new Proxy(
            {},
            {
                get(_target, prop) {
                    if (prop === "measureText") {
                        return () => ({ width: 100 });
                    }
                    if (prop === "createLinearGradient") {
                        return () => gradient;
                    }
                    return () => undefined;
                },
                set: () => true,
            },
        ) as unknown as CanvasRenderingContext2D;
    }

    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;

    beforeEach(() => {
        vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
            createMockContext() as unknown as RenderingContext,
        );
        vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue("data:image/jpeg;base64,AAAA");
        vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
        URL.createObjectURL = vi.fn(() => "blob:mock");
        URL.revokeObjectURL = vi.fn();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        URL.createObjectURL = originalCreateObjectURL;
        URL.revokeObjectURL = originalRevokeObjectURL;
    });

    // 18 points géolocalisés : force la grille 3 colonnes + pastilles à deux chiffres.
    function buildWaypointItinerary(stepCount: number): Itinerary {
        const steps: Segment["steps"] = Array.from({ length: stepCount }, (_, index) => ({
            id: `wp-${index}`,
            isDefaultSegStart: false,
            content: {
                title: `Point ${index}`,
                duration: new TimeSpan(),
                location: { lat: 47 + index * 0.05, lon: -1 - index * 0.05 },
            },
        }));
        return buildItinerary([
            buildSegment({ id: "start", isStartEnd: true, content: { title: " ", geometry: undefined } }),
            buildSegment({ id: "leg", content: { title: "Tronçon", geometry: undefined }, steps }),
            buildSegment({ id: "end", isStartEnd: true, content: { title: " ", geometry: undefined } }),
        ]);
    }

    it("génère le PDF en matérialisant les points de passage sur les cartes", async () => {
        await expect(downloadItineraryPdf(buildWaypointItinerary(18))).resolves.toBeUndefined();
        expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledTimes(1);
        expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    });

    it("génère le PDF sans planter quand aucune étape n'est géolocalisée", async () => {
        const itinerary = buildItinerary([
            buildSegment({ id: "start", isStartEnd: true, content: { title: " ", geometry: undefined } }),
            buildSegment({
                id: "leg",
                content: { title: "Tronçon sans coordonnées", geometry: undefined },
                steps: [
                    { id: "s1", isDefaultSegStart: false, content: { title: "Étape texte", duration: new TimeSpan() } },
                ],
            }),
            buildSegment({ id: "end", isStartEnd: true, content: { title: " ", geometry: undefined } }),
        ]);
        await expect(downloadItineraryPdf(itinerary)).resolves.toBeUndefined();
        expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledTimes(1);
    });
});
