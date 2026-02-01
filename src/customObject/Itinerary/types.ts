import type {TimeSpan} from "../TimeSpan.ts";
import type {Dispatch, SetStateAction} from "react";

export type stepInfo = {
    title: string;
    duration: TimeSpan;
}

export type Step = {
    id: string;
    content: stepInfo;
}

export type segmentInfo = {
    title: string;
    hour: Date;
    duration: TimeSpan;
}

export type reorderStepInfo = {
    toSeg : Segment,
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