import { describe, expect, it } from "vitest";
import { itineraryResponseToItinerary } from "./itineraryResponseMapper";

describe("itineraryResponseToItinerary", () => {
    it("convertit la réponse backend au format attendu par l'export PDF", () => {
        const itinerary = itineraryResponseToItinerary({
            id: 42,
            name: "Convoi Nantes",
            shareCode: "ABC123",
            totalDistance: 32_660,
            totalDuration: 3_180,
            departureTime: "2026-05-29T07:55:00.000Z",
            draft: false,
            segments: [
                {
                    name: "Nouveau segment",
                    distance: 32_660,
                    duration: 3_180,
                    geometry: JSON.stringify({
                        type: "Feature",
                        geometry: {
                            type: "LineString",
                            coordinates: [
                                [-1.563987, 47.280171],
                                [-1.469212, 47.258286],
                            ],
                        },
                        properties: {},
                    }),
                    waypoints: [
                        {
                            name: "D\u00e9part",
                            coordinates: {
                                latitude: 47.280171,
                                longitude: -1.563987,
                            },
                            estimatedArrival: "2026-05-29T07:55:00.000Z",
                        },
                        {
                            name: "Arriv\u00e9e",
                            coordinates: {
                                latitude: 47.258286,
                                longitude: -1.469212,
                            },
                            estimatedArrival: "2026-05-29T08:48:00.000Z",
                        },
                    ],
                    estimatedDeparture: "2026-05-29T08:48:00.000Z",
                    breakDuration: 0,
                },
            ],
        });

        expect(itinerary.id).toBe(42);
        expect(itinerary.name).toBe("Convoi Nantes");
        expect(itinerary.draft).toBe(false);
        expect(itinerary.totalDistance).toBeCloseTo(32.66);
        expect(itinerary.totalDuration.duration).toBe(3_180_000);
        expect(itinerary.segments).toHaveLength(3);
        expect(itinerary.segments[1].isStartEnd).toBe(false);
        expect(itinerary.segments[1].content.title).toBe("Nouveau segment");
        expect(itinerary.segments[1].steps).toHaveLength(2);
        expect(itinerary.segments[1].steps[0].content.estimatedArrival?.toISOString()).toBe("2026-05-29T07:55:00.000Z");
        expect(itinerary.segments[1].steps[1].content.estimatedArrival?.toISOString()).toBe("2026-05-29T08:48:00.000Z");
    });
});
