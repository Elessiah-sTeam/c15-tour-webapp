import type {ItineraryStore} from "./types.ts";
import {useSyncExternalStore} from "react";
import {
    applySpeedSettings,
    getGlobalSettingsStorageValue,
    loadGlobalSettings,
    subscribeToGlobalSettingsChanges
} from "../../components/SettingsModal/settingsStorage.ts";

/**
 * Fonction donnant l'accès du store au composant qui l'appel
 * @param store le store de l'itinéraire
 */
export function useItinerary(store: ItineraryStore) {
    const itinerary = useSyncExternalStore(
        store.subscribe,
        store.getSnapshot
    );

    useSyncExternalStore(
        subscribeToGlobalSettingsChanges,
        () => getGlobalSettingsStorageValue(itinerary.id),
        () => getGlobalSettingsStorageValue(itinerary.id)
    );

    const settings = loadGlobalSettings(itinerary);

    return applySpeedSettings(itinerary, settings.speedPercentage);
}
