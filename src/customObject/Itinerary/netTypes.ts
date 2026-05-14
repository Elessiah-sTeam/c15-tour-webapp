export type NetGeometry = {
    coordinates: [number, number][];
    type: string;
}

export type NetCoordinates = {
    latitude: number;
    longitude: number;
}

export type Waypoint = {
    name: string,
    coordinates: NetCoordinates,
}

export type SegmentRequest = {
    name: string,
    waypoints: Waypoint[],
}

export type ItineraryRequest = {
    name: string,
    segments: SegmentRequest[],
}

export type ItineraryPatchRequest = {
    departureTime: string,
}

export type SegmentResponse = {
    name: string,
    distance: number,
    duration: number,
    geometry: string,
    estimatedDeparture: string,
    waypoints: Waypoint[],
}

export type ItineraryResponse = {
    id: number,
    name: string,
    shareCode: string,
    totalDistance: number,
    totalDuration: number,
    createdAt?: string,
    segments: SegmentResponse[]
}