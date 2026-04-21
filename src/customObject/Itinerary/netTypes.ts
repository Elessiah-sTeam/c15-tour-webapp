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
    pauseDuration?: number,
    waypoints: Waypoint[],
}

export type ItineraryRequest = {
    name: string,
    departureTime?: string,
    speedPercentage: number,
    minSegmentDuration: number,
    maxSegmentDuration: number,
    segments: SegmentRequest[],
}

export type ItineraryPatchRequest = {
    departureTime: string,
}

export type SegmentResponse = {
    name: string,
    pauseDuration?: number,
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
    departureTime?: string,
    speedPercentage?: number,
    minSegmentDuration?: number,
    maxSegmentDuration?: number,
    totalDistance: number,
    totalDuration: number,
    segments: SegmentResponse[]
}