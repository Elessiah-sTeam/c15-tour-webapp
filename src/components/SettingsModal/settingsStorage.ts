import type { Itinerary, Segment } from "../../customObject/Itinerary/types.ts";
import type { GlobalSettings, PauseConfig } from "./settingsTypes.ts";
import { DEFAULT_PAUSE_DURATION } from "./settingsTypes.ts";

type StoredGlobalSettings = Partial<GlobalSettings> & {
    removedPauseSegmentIds?: string[];
};

function formatLocalDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function formatLocalTime(date: Date): string {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
}

function isRegularSegment(segment: Segment): boolean {
    return !segment.isStartEnd && segment.id !== "start" && segment.id !== "end";
}

export function getGlobalSettingsStorageKey(itineraryId: number): string {
    return `globalSettings_${itineraryId}`;
}

export function createDefaultGlobalSettings(itinerary: Itinerary): GlobalSettings {
    const currentDeparture = itinerary.segments[0]?.content.hour ?? new Date();

    return {
        convoyName: itinerary.name || "Mon convoi",
        departureDate: formatLocalDate(currentDeparture),
        departureTime: formatLocalTime(currentDeparture),
        speedPercentage: 100,
        minSegmentDuration: 1,
        maxSegmentDuration: 4,
        pauseConfigs: []
    };
}

export function buildPauseConfigs(itinerary: Itinerary, baseSettings: StoredGlobalSettings): PauseConfig[] {
    const removedPauseSegmentIds = new Set(baseSettings.removedPauseSegmentIds ?? []);
    const existingPauseConfigs = baseSettings.pauseConfigs ?? [];

    return itinerary.segments
        .filter(isRegularSegment)
        .filter((segment) => !removedPauseSegmentIds.has(segment.id))
        .map((segment) => {
            const existingPause = existingPauseConfigs.find((pause) =>
                pause.segmentId === segment.id || pause.segmentName === segment.content.title
            );

            return {
                segmentId: segment.id,
                segmentName: segment.content.title || "Segment sans nom",
                duration: existingPause?.duration ?? DEFAULT_PAUSE_DURATION
            };
        });
}

export function persistGlobalSettings(itineraryId: number, settings: GlobalSettings): void {
    localStorage.setItem(getGlobalSettingsStorageKey(itineraryId), JSON.stringify(settings));
}

export function loadGlobalSettings(itinerary: Itinerary): GlobalSettings {
    const storageKey = getGlobalSettingsStorageKey(itinerary.id);
    const isNewEmptyConvoy = itinerary.id === -1 &&
        itinerary.segments.filter(isRegularSegment).length === 0;

    let baseSettings: StoredGlobalSettings | null = null;
    const saved = localStorage.getItem(storageKey);

    if (saved && !isNewEmptyConvoy) {
        try {
            baseSettings = JSON.parse(saved) as StoredGlobalSettings;
        } catch {
            baseSettings = null;
        }
    }

    const defaultSettings = createDefaultGlobalSettings(itinerary);
    const safeSettings: StoredGlobalSettings = {
        ...defaultSettings,
        ...baseSettings
    };

    return {
        ...safeSettings,
        convoyName: itinerary.name || safeSettings.convoyName || defaultSettings.convoyName,
        departureDate: safeSettings.departureDate || defaultSettings.departureDate,
        departureTime: safeSettings.departureTime || defaultSettings.departureTime,
        speedPercentage: safeSettings.speedPercentage ?? defaultSettings.speedPercentage,
        minSegmentDuration: safeSettings.minSegmentDuration ?? defaultSettings.minSegmentDuration,
        maxSegmentDuration: safeSettings.maxSegmentDuration ?? defaultSettings.maxSegmentDuration,
        pauseConfigs: buildPauseConfigs(itinerary, safeSettings)
    };
}

export function getSegmentPauseDuration(itinerary: Itinerary, segmentId: string): number {
    const settings = loadGlobalSettings(itinerary);
    return settings.pauseConfigs.find((pause) => pause.segmentId === segmentId)?.duration ?? DEFAULT_PAUSE_DURATION;
}

export function upsertSegmentPauseConfig(
    itinerary: Itinerary,
    segmentId: string,
    segmentName: string,
    duration: number
): GlobalSettings {
    const currentSettings = loadGlobalSettings(itinerary);
    const storedSettings = getStoredSettings(itinerary.id);
    const normalizedDuration = Math.max(0, Math.min(120, Number.isFinite(duration) ? duration : DEFAULT_PAUSE_DURATION));
    const nextPauseConfigs = currentSettings.pauseConfigs.some((pause) => pause.segmentId === segmentId)
        ? currentSettings.pauseConfigs.map((pause) =>
            pause.segmentId === segmentId
                ? { ...pause, segmentName, duration: normalizedDuration }
                : pause
        )
        : [
            ...currentSettings.pauseConfigs,
            { segmentId, segmentName, duration: normalizedDuration }
        ];

    const nextSettings = {
        ...currentSettings,
        removedPauseSegmentIds: (storedSettings.removedPauseSegmentIds ?? []).filter((id) => id !== segmentId),
        pauseConfigs: buildPauseConfigs(itinerary, {
            ...currentSettings,
            removedPauseSegmentIds: (storedSettings.removedPauseSegmentIds ?? []).filter((id) => id !== segmentId),
            pauseConfigs: nextPauseConfigs
        })
    };

    persistGlobalSettings(itinerary.id, nextSettings);
    return nextSettings;
}

export function removeSegmentPauseConfig(itinerary: Itinerary, segmentId: string): GlobalSettings {
    const currentSettings = loadGlobalSettings(itinerary);
    const storedSettings = getStoredSettings(itinerary.id);
    const nextSettings = {
        ...currentSettings,
        removedPauseSegmentIds: [...new Set([...(storedSettings.removedPauseSegmentIds ?? []), segmentId])],
        pauseConfigs: currentSettings.pauseConfigs.filter((pause) => pause.segmentId !== segmentId)
    };

    persistGlobalSettings(itinerary.id, nextSettings);
    return nextSettings;
}

function getStoredSettings(itineraryId: number): StoredGlobalSettings {
    const saved = localStorage.getItem(getGlobalSettingsStorageKey(itineraryId));
    if (!saved) {
        return { removedPauseSegmentIds: [], pauseConfigs: [] } as StoredGlobalSettings;
    }

    try {
        return JSON.parse(saved) as StoredGlobalSettings;
    } catch {
        return { removedPauseSegmentIds: [], pauseConfigs: [] } as StoredGlobalSettings;
    }
}