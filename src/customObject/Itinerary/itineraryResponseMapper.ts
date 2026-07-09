import type { Feature, LineString } from "geojson";
import { TimeSpan } from "../TimeSpan.ts";
import type { Itinerary, Segment, Step } from "./types.ts";
import type { ItineraryResponse, SegmentResponse, Waypoint } from "./netTypes.ts";
import { updateStarts } from "./utils.ts";

function parseOptionalIsoDate(iso: string | undefined): Date | undefined {
    if (iso === undefined || iso === null || iso === "") {
        return undefined;
    }

    const parsed = new Date(iso);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function normalizeNetDate(iso: string | undefined): Date {
    return parseOptionalIsoDate(iso) ?? new Date(NaN);
}

function parseGeometry(geometry: string | undefined): Feature<LineString> | undefined {
    if (!geometry) {
        return undefined;
    }

    try {
        return JSON.parse(geometry) as Feature<LineString>;
    } catch {
        return undefined;
    }
}

function buildStepDuration(previousArrival: Date | undefined, estimatedArrival: Date | undefined): TimeSpan {
    if (!previousArrival || !estimatedArrival) {
        return new TimeSpan();
    }

    return new TimeSpan(Math.max(0, estimatedArrival.getTime() - previousArrival.getTime()));
}

function normalizeWaypoints(
    waypoints: Waypoint[],
    refId: { id: number },
    isFirstSeg: boolean,
): Step[] {
    const startId = refId.id;
    let previousArrival: Date | undefined;

    return waypoints.map((waypoint) => {
        const estimatedArrival = parseOptionalIsoDate(waypoint.estimatedArrival);
        const duration = buildStepDuration(previousArrival, estimatedArrival);
        previousArrival = estimatedArrival;

        return {
            id: `${refId.id++}`,
            content: {
                title: waypoint.name,
                duration,
                location: {
                    lat: waypoint.coordinates.latitude,
                    lon: waypoint.coordinates.longitude,
                },
                ...(estimatedArrival !== undefined ? { estimatedArrival } : {}),
            },
            isDefaultSegStart: !isFirstSeg && startId === refId.id,
        };
    });
}

function addStartEndSegment(segments: Segment[]): Segment[] {
    const startHour = segments[0]?.content.hour ?? new Date();
    const start: Segment = {
        id: "start",
        content: {
            title: " ",
            hour: new Date(startHour.getTime()),
            duration: new TimeSpan(),
            distance: 0,
            geometry: undefined,
        },
        isStartEnd: true,
        steps: [],
    };

    return [start, ...segments, { ...start, id: "end", steps: [] }];
}

function normalizeSegments(
    segments: SegmentResponse[],
    itineraryDepartureTime: string | undefined,
    refId: { id: number },
): Segment[] {
    const startId = refId.id;

    return addStartEndSegment(
        segments.map((segment, index) => {
            const steps = normalizeWaypoints(segment.waypoints, refId, refId.id === startId);
            if (index > 0) {
                steps.splice(0, 1);
            }

            return {
                id: `${refId.id++}`,
                isStartEnd: false,
                content: {
                    title: segment.name,
                    duration: new TimeSpan(segment.duration * 1000),
                    distance: segment.distance * 0.001,
                    geometry: parseGeometry(segment.geometry),
                    hour: index === 0
                        ? normalizeNetDate(itineraryDepartureTime ?? segment.waypoints[0]?.estimatedArrival ?? segment.estimatedDeparture)
                        : normalizeNetDate(segment.estimatedDeparture),
                    ...(segment.breakDuration !== undefined && segment.breakDuration !== null
                        ? { breakDuration: segment.breakDuration }
                        : {}),
                },
                steps,
            };
        }),
    );
}

export function itineraryResponseToItinerary(response: ItineraryResponse): Itinerary {
    const refId = { id: 0 };

    return {
        id: response.id,
        name: response.name,
        shareCode: response.shareCode ?? "",
        organiserCode: response.organiserCode ?? "",
        totalDuration: new TimeSpan((response.totalDuration ?? 0) * 1000),
        totalDistance: (response.totalDistance ?? 0) * 0.001,
        segments: updateStarts(normalizeSegments(response.segments ?? [], response.departureTime, refId)),
        draft: response.draft ?? true,
    };
}
