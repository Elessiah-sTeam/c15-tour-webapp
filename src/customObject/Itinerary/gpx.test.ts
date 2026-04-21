import { describe, expect, it } from "vitest";
import { buildGpxDocument, extractLineStringCoordinates, hasGpxGeometry } from "./gpx";

describe("gpx helpers", () => {
    it("extracts coordinates from a GeoJSON Feature LineString", () => {
        const coordinates = extractLineStringCoordinates({
            type: "Feature",
            geometry: {
                type: "LineString",
                coordinates: [[2.1, 48.1], [2.2, 48.2]],
            },
            properties: {},
        });

        expect(coordinates).toEqual([[2.1, 48.1], [2.2, 48.2]]);
    });

    it("extracts coordinates from a serialized LineString geometry", () => {
        const coordinates = extractLineStringCoordinates(JSON.stringify({
            type: "LineString",
            coordinates: [[-1.55, 47.21], [-1.54, 47.22]],
        }));

        expect(coordinates).toEqual([[-1.55, 47.21], [-1.54, 47.22]]);
    });

    it("detects when at least one segment can be exported to GPX", () => {
        expect(hasGpxGeometry([
            { geometry: undefined },
            { geometry: { type: "LineString", coordinates: [[1, 2], [3, 4]] } },
        ])).toBe(true);
    });

    it("builds a GPX track with one trkseg per itinerary segment", () => {
        const gpx = buildGpxDocument("Convoi & test", [
            {
                geometry: {
                    type: "LineString",
                    coordinates: [[2.1, 48.1], [2.2, 48.2]],
                },
            },
            {
                geometry: JSON.stringify({
                    type: "LineString",
                    coordinates: [[2.3, 48.3], [2.4, 48.4]],
                }),
            },
        ]);

        expect(gpx).toContain("<gpx version=\"1.1\"");
        expect(gpx).toContain("<name>Convoi &amp; test</name>");
        expect(gpx).toContain("<trkpt lat=\"48.1\" lon=\"2.1\"></trkpt>");
        expect(gpx).toContain("<trkpt lat=\"48.4\" lon=\"2.4\"></trkpt>");
        expect(gpx.match(/<trkseg>/g)).toHaveLength(2);
    });

    it("throws when no geometry is exportable", () => {
        expect(() => buildGpxDocument("Vide", [{ geometry: undefined }]))
            .toThrow("Aucune geometrie exploitable pour generer un GPX.");
    });
});
