import type {TimeSpan} from "../TimeSpan.ts";
import type {Dispatch, SetStateAction} from "react";
import type {Feature, LineString} from "geojson";

export type Coordinates = { lat: number; lon: number };

export type stepInfo = {
    title: string;
    duration: TimeSpan;
    location?: Coordinates;
}

export type Step = {
    id: string;
    content: stepInfo;
    isDefaultSegStart: boolean;
}

export type segmentInfo = {
    title: string;
    hour: Date;
    duration: TimeSpan;
    distance: number;
    geometry?: Feature<LineString>;
}

export type reorderStepInfo = {
    fromSeg: Segment,
    toSeg : Segment,
    nextToSeg : Segment,
    newNextToSteps?: Step[],
    previousToSeg : Segment,
    newPreviousToSteps?: Step[],
    sameSeg: boolean
    newFromSteps: Step[],
    newToSteps: Step[],
    insertIndex : number,
}

export type Segment = {
    id: string;
    content: segmentInfo;
    isStartEnd: boolean;
    steps: Step[];
}

export type Itinerary = {
    id: number;
    name: string;
    totalDuration: TimeSpan;
    totalDistance: number;
    segments: Segment[];
}

export type ItineraryArgs = {
    _store?: ItineraryStore;
    initial?: Itinerary;
}

export type ItineraryStore = {
    getSnapshot(): Itinerary;
    subscribe(l: () => void): () => void;
    set(updater: (prev: Itinerary) => Itinerary): void;
}

export type ItineraryListener = () => void;
export type ItinerarySetter = Dispatch<SetStateAction<Itinerary>>;
