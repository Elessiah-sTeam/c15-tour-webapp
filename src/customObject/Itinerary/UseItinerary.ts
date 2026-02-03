import type {ItineraryStore} from "./types.ts";
import {useSyncExternalStore} from "react";

/**
 * Fonction donnant l'accès du store au composant qui l'appel
 * @param store le store de l'itinéraire
 */
export function useItinerary(store: ItineraryStore) {
    return useSyncExternalStore(
        store.subscribe,
        store.getSnapshot
    );
}