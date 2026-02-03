import type {ItineraryListener, Itinerary, Segment, ItineraryStore} from "./types.ts";
import {TimeSpan} from "../TimeSpan.ts";
import {ItineraryModel} from "./ItineraryModel.ts";

export function createItineraryStore(initial?: Itinerary): ItineraryStore
{
    let itinerary: Itinerary;
    if (!initial) {
        itinerary = {
            name: "Nouveau Convoi",
            totalDuration: new TimeSpan(),
            totalDistance: 0,
            segments: new Array<Segment>()
        }
    } else {
        itinerary = initial;
    }

    const listeners = new Set<ItineraryListener>();

    return {
        getSnapshot: () => itinerary,
        subscribe: (l: ItineraryListener) => {
            listeners.add(l);
            return () => listeners.delete(l);
        },
        set(updater: (r: Itinerary) => Itinerary) {
            itinerary = updater(itinerary);
            listeners.forEach(l => l());
        }
    }
}

const now = new Date();
const starthour = new Date();
starthour.setHours(11);
starthour.setMinutes(10);
const endhour = new Date();
endhour.setHours(15);
endhour.setMinutes(0);
const duration: TimeSpan = new TimeSpan(6318000);

const initial: Itinerary = {
    name: "Mon premier convoi",
    totalDuration: new TimeSpan(),
    totalDistance: 157,
    segments: [{
        id: "start",
        content: {title: "", duration: duration, hour: starthour},
        isStartEnd: true,
        steps: [{
            id: "pdp-0",
            content: {
                title: "Départ",
                duration: duration,
                position: [47.253927, -1.516435]
            }
        }]
    },
        {
            id: "step-1",
            content: {
                title: "Etape1",
                duration: duration,
                hour: now
            },
            isStartEnd: false,
            steps: [{
                id: "pdp-1",
                content: {
                    title: "Point de passage 1",
                    duration: duration,
                    position: [47.253927, -1.516436]
                }
            },
                {
                    id: "pdp-2",
                    content: {
                        title: "Point de passage 2",
                        duration: duration,
                        position: [47.253927, -1.516439]
                    }
                }]
        },
        {
            id: "step-2",
            content: {
                title: "Etape2",
                duration: duration,
                hour: now
            },
            isStartEnd: false,
            steps: [{
                id: "pdp-3",
                content: {
                    title: "Point de passage 3",
                    duration: duration,
                    position: [47.253927, -1.516438]
                }
            }]
        },
        {
            id: "end",
            content: {title: "", duration: duration, hour: endhour},
            isStartEnd: true,
            steps: [{
                id: "pdp-4",
                content: {
                    title: "Arrivée",
                    duration: duration,
                    position: [47.253927, -1.516437]
                }
            }]
        }]
}

export const itineraryModel: ItineraryModel = new ItineraryModel({initial: initial});
