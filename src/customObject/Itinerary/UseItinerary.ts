import type {ItineraryStore} from "./types.ts";
import {useSyncExternalStore} from "react";
import {
    applySpeedSettings,
    getGlobalSettingsStorageValue,
    loadGlobalSettings,
    subscribeToGlobalSettingsChanges
} from "../../components/SettingsModal/settingsStorage.ts";

/**
 * Retourne l'itineraire courant en tenant compte des parametres globaux,
 * notamment du coefficient de vitesse de conduite.
 * @param store le store de l'itinéraire
 */
export function useItinerary(store: ItineraryStore) {
    const itinerary = useSyncExternalStore(
        store.subscribe,
        store.getSnapshot
    );

    const readStoredSettings = () => getGlobalSettingsStorageValue(itinerary.id);
    useSyncExternalStore(subscribeToGlobalSettingsChanges, readStoredSettings, readStoredSettings);

    const settings = loadGlobalSettings(itinerary);

    return applySpeedSettings(itinerary, settings.speedPercentage);
}
