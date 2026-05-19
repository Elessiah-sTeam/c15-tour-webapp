/**
 * DTOs alignés sur l'OpenAPI (`api-docs.json`) : schémas Tour*, Segment*, Waypoints, PatchDepartureTimeRequest.
 * Les noms d'export restent orientés itinéraire pour limiter les changements dans le reste du code.
 */

export type NetGeometry = {
    coordinates: [number, number][];
    type: string;
}

export type NetCoordinates = {
    latitude: number;
    longitude: number;
}

/** OpenAPI `Waypoints` */
export type Waypoint = {
    name: string;
    coordinates: NetCoordinates;
    /** ISO 8601 — renseigné quand le tour a un `departureTime` */
    estimatedArrival?: string;
}

/** OpenAPI `SegmentRequest` */
export type SegmentRequest = {
    name: string;
    waypoints: Waypoint[];
    /** Secondes ; défaut 0 côté API */
    breakDuration?: number;
}

/** OpenAPI `TourCreateRequest` */
export type ItineraryRequest = {
    name: string;
    segments: SegmentRequest[];
    /** ISO 8601 — optionnel ; requis côté API pour le calcul des ETA */
    departureTime?: string;
    /** true = brouillon, false = finalisé */
    draft?: boolean;
}

/** OpenAPI `PatchDepartureTimeRequest` */
export type ItineraryPatchRequest = {
    departureTime: string;
}

/** OpenAPI `SegmentResponse` */
export type SegmentResponse = {
    name: string;
    distance: number;
    duration: number;
    geometry: string;
    waypoints: Waypoint[];
    steps?: string;
    breakDuration?: number;
    /** Fin de segment (dernier waypoint + pause), ISO 8601 */
    estimatedDeparture?: string;
}

/** OpenAPI `TourResponse` */
export type ItineraryResponse = {
    id: number;
    name: string;
    shareCode?: string;
    organiserCode?: string;
    totalDistance?: number;
    totalDuration?: number;
    createdAt?: string;
    departureTime?: string;
    segments?: SegmentResponse[];
    role?: "PARTICIPANT" | "ORGANISER";
    draft?: boolean;
}
