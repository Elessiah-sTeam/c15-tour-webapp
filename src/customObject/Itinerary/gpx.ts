import type { Feature, LineString } from "geojson";
import { sanitizeFileName } from "./fileName.ts";
import { pushErrorToast } from "../Toast/ToastStore.ts";

type LineStringGeometry = {
    type?: string;
    coordinates?: unknown;
};

export type GpxGeometryInput = string | LineStringGeometry | Feature<LineString> | null | undefined;

export type GpxSegmentSource = {
    geometry?: GpxGeometryInput;
};

function isCoordinatePair(value: unknown): value is [number, number] {
    return Array.isArray(value)
        && value.length >= 2
        && typeof value[0] === "number"
        && Number.isFinite(value[0])
        && typeof value[1] === "number"
        && Number.isFinite(value[1]);
}

function parseGeometryInput(geometry: GpxGeometryInput): unknown {
    if (typeof geometry !== "string") {
        return geometry;
    }

    try {
        return JSON.parse(geometry) as unknown;
    } catch (error) {
        pushErrorToast("Impossible de parser la geometrie GPX");
        return null;
    }
}

export function extractLineStringCoordinates(geometry: GpxGeometryInput): [number, number][] {
    const parsed = parseGeometryInput(geometry);
    if (!parsed || typeof parsed !== "object") {
        return [];
    }

    const candidate = parsed as {
        type?: string;
        geometry?: LineStringGeometry;
        coordinates?: unknown;
    };

    if (candidate.type === "Feature" && candidate.geometry) {
        return extractLineStringCoordinates(candidate.geometry);
    }

    if (!Array.isArray(candidate.coordinates)) {
        return [];
    }

    return candidate.coordinates.filter(isCoordinatePair);
}

function escapeXml(value: string): string {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("\"", "&quot;")
        .replaceAll("'", "&apos;");
}

function buildTrackSegmentXml(coordinates: [number, number][]): string {
    const points = coordinates
        .map(([longitude, latitude]) => `      <trkpt lat="${latitude}" lon="${longitude}"></trkpt>`)
        .join("\n");

    return `    <trkseg>\n${points}\n    </trkseg>`;
}

export function hasGpxGeometry(segments: GpxSegmentSource[]): boolean {
    return segments.some((segment) => extractLineStringCoordinates(segment.geometry).length > 0);
}

export function buildGpxDocument(itineraryName: string, segments: GpxSegmentSource[]): string {
    const trackSegments = segments
        .map((segment) => extractLineStringCoordinates(segment.geometry))
        .filter((coordinates) => coordinates.length > 0);

    if (trackSegments.length === 0) {
        throw new Error("Aucune geometrie exploitable pour generer un GPX.");
    }

    const escapedName = escapeXml(itineraryName || "Itinerary");
    const generatedAt = new Date().toISOString();
    const segmentsXml = trackSegments.map(buildTrackSegmentXml).join("\n");

    return [
        "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
        "<gpx version=\"1.1\" creator=\"C15 Tour\" xmlns=\"http://www.topografix.com/GPX/1/1\">",
        "  <metadata>",
        `    <name>${escapedName}</name>`,
        `    <time>${generatedAt}</time>`,
        "  </metadata>",
        "  <trk>",
        `    <name>${escapedName}</name>`,
        segmentsXml,
        "  </trk>",
        "</gpx>",
    ].join("\n");
}

export function downloadGpx(itineraryName: string, segments: GpxSegmentSource[]): void {
    const gpxContent = buildGpxDocument(itineraryName, segments);
    const blob = new Blob([gpxContent], { type: "application/gpx+xml;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `${sanitizeFileName(itineraryName)}.gpx`;
    anchor.style.display = "none";

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
}
