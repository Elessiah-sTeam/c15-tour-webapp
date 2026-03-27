import type {ItineraryListener, Itinerary, Segment, ItineraryStore} from "./types.ts";
import {TimeSpan} from "../TimeSpan.ts";
import ItineraryModel from "./ItineraryModel.ts";

export function createItineraryStore(initial?: Itinerary): ItineraryStore
{
    let itinerary: Itinerary;
    if (!initial) {
        itinerary = {
            id: -1,
            name: "Nouveau Convoi",
            shareCode: "",
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

export const itineraryModel: ItineraryModel = new ItineraryModel({});
