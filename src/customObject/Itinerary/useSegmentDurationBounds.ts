import { useMemo, useSyncExternalStore } from "react";
import type { Itinerary } from "./types.ts";
import type { SegmentDurationBounds } from "./segmentDurationValidation.ts";
import type { GlobalSettings } from "../../components/SettingsModal/settingsTypes.ts";
import {
    createDefaultGlobalSettings,
    getGlobalSettingsStorageValue,
    subscribeToGlobalSettingsChanges,
} from "../../components/SettingsModal/settingsStorage.ts";

function parseStoredSettings(raw: string | null): GlobalSettings | null {
    if (!raw) {
        return null;
    }
    try {
        return JSON.parse(raw) as GlobalSettings;
    } catch {
        return null;
    }
}

/**
 * Expose les bornes de durée de segment (min/max) des paramètres globaux et
 * force un recalcul quand ces paramètres changent, y compris depuis un autre
 * onglet. Les bornes sont dérivées de la valeur stockée pour rester réactives
 * malgré la mémoïsation automatique (React Compiler).
 * @param itinerary itinéraire courant (les paramètres sont stockés par itinéraire)
 */
export function useSegmentDurationBounds(itinerary: Itinerary): SegmentDurationBounds {
    const raw = useSyncExternalStore(
        subscribeToGlobalSettingsChanges,
        () => getGlobalSettingsStorageValue(itinerary.id)
    );

    return useMemo(() => {
        const settings = parseStoredSettings(raw) ?? createDefaultGlobalSettings(itinerary);
        return {
            minSegmentDuration: settings.minSegmentDuration,
            maxSegmentDuration: settings.maxSegmentDuration,
        };
    }, [raw, itinerary]);
}
