import type {ItineraryStore} from "./types.ts";
import {useSyncExternalStore} from "react";

export function useItinerary(store: ItineraryStore) {
    return useSyncExternalStore(
        store.subscribe,
        store.getSnapshot
    );
}