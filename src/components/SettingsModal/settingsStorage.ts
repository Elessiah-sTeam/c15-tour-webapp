import type { Itinerary, Segment } from "../../customObject/Itinerary/types.ts";
import type { GlobalSettings, PauseConfig } from "./settingsTypes.ts";
import { DEFAULT_PAUSE_DURATION } from "./settingsTypes.ts";

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

export function buildPauseConfigs(itinerary: Itinerary, baseSettings: GlobalSettings): PauseConfig[] {
    return itinerary.segments
        .filter(isRegularSegment)
        .map((segment) => {
            const existingPause = baseSettings.pauseConfigs.find((pause) => pause.segmentId === segment.id);

            return {
                segmentId: segment.id,
                segmentName: segment.content.title || "Segment sans nom",
                duration: existingPause?.duration ?? ((segment.content.breakDuration ?? (DEFAULT_PAUSE_DURATION * 60)) / 60)
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

    let baseSettings: GlobalSettings | null = null;
    const saved = localStorage.getItem(storageKey);

    if (saved && !isNewEmptyConvoy) {
        try {
            baseSettings = JSON.parse(saved) as GlobalSettings;
        } catch {
            baseSettings = null;
        }
    }

    const safeSettings = baseSettings ?? createDefaultGlobalSettings(itinerary);

    return {
        ...safeSettings,
        convoyName: itinerary.name || safeSettings.convoyName || "Mon convoi",
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
        pauseConfigs: buildPauseConfigs(itinerary, {
            ...currentSettings,
            pauseConfigs: nextPauseConfigs
        })
    };

    persistGlobalSettings(itinerary.id, nextSettings);
    return nextSettings;
}

export function removeSegmentPauseConfig(itinerary: Itinerary, segmentId: string): GlobalSettings {
    const currentSettings = loadGlobalSettings(itinerary);
    const nextSettings = {
        ...currentSettings,
        pauseConfigs: currentSettings.pauseConfigs.filter((pause) => pause.segmentId !== segmentId)
    };

    persistGlobalSettings(itinerary.id, nextSettings);
    return nextSettings;
}
