import { useSyncExternalStore } from "react";
import type { Itinerary } from "./types.ts";
import type { SegmentDurationBounds } from "./segmentDurationValidation.ts";
import {
    getGlobalSettingsStorageValue,
    loadGlobalSettings,
    subscribeToGlobalSettingsChanges,
} from "../../components/SettingsModal/settingsStorage.ts";

/**
 * Expose les bornes de durée de segment (min/max) des paramètres globaux et
 * force un recalcul quand ces paramètres changent, y compris depuis un autre
 * onglet.
 * @param itinerary itinéraire courant (les paramètres sont stockés par itinéraire)
 */
export function useSegmentDurationBounds(itinerary: Itinerary): SegmentDurationBounds {
    useSyncExternalStore(
        subscribeToGlobalSettingsChanges,
        () => getGlobalSettingsStorageValue(itinerary.id)
    );

    const { minSegmentDuration, maxSegmentDuration } = loadGlobalSettings(itinerary);
    return { minSegmentDuration, maxSegmentDuration };
}
