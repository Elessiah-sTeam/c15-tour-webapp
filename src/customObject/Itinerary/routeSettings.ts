import type { ItineraryResponse, SegmentResponse } from "./netTypes.ts";

export type StoredPauseConfig = {
    segmentId?: string,
    segmentName?: string,
    duration?: number,
}

export type StoredGlobalSettings = {
    convoyName?: string,
    departureDate?: string,
    departureTime?: string,
    speedPercentage?: number,
    minSegmentDuration?: number,
    maxSegmentDuration?: number,
    pauseConfigs?: StoredPauseConfig[],
}

export const DEFAULT_ROUTE_SETTINGS = {
    speedPercentage: 100,
    minSegmentDuration: 1,
    maxSegmentDuration: 4,
} as const;

function isStorageAvailable(): boolean {
    return typeof localStorage !== "undefined";
}

function buildStorageKey(itineraryId: number): string {
    return `globalSettings_${itineraryId}`;
}

export function formatLocalDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

export function formatLocalTime(date: Date): string {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
}

export function getStoredSettings(itineraryId: number): StoredGlobalSettings {
    if (!isStorageAvailable()) {
        return {};
    }

    const saved: string | null = localStorage.getItem(buildStorageKey(itineraryId));
    if (!saved) {
        return {};
    }

    try {
        return JSON.parse(saved) as StoredGlobalSettings;
    } catch {
        return {};
    }
}

export function saveStoredSettings(itineraryId: number, settings: StoredGlobalSettings): void {
    if (!isStorageAvailable()) {
        return;
    }

    localStorage.setItem(buildStorageKey(itineraryId), JSON.stringify(settings));
}

export function moveStoredSettings(fromItineraryId: number, toItineraryId: number): void {
    if (!isStorageAvailable() || fromItineraryId === toItineraryId) {
        return;
    }

    const sourceKey: string = buildStorageKey(fromItineraryId);
    const targetKey: string = buildStorageKey(toItineraryId);
    const saved: string | null = localStorage.getItem(sourceKey);
    if (!saved) {
        return;
    }

    if (!localStorage.getItem(targetKey)) {
        localStorage.setItem(targetKey, saved);
    }
    localStorage.removeItem(sourceKey);
}

function hasResponseSettings(response: ItineraryResponse): boolean {
    return response.departureTime !== undefined
        || response.speedPercentage !== undefined
        || response.minSegmentDuration !== undefined
        || response.maxSegmentDuration !== undefined
        || response.segments.some((segment: SegmentResponse) => segment.pauseDuration !== undefined);
}

export function syncStoredSettingsFromResponse(
    previousItineraryId: number,
    response: ItineraryResponse
): void {
    if (!isStorageAvailable()) {
        return;
    }

    moveStoredSettings(previousItineraryId, response.id);

    if (!hasResponseSettings(response)) {
        return;
    }

    const existing: StoredGlobalSettings = getStoredSettings(response.id);
    const departure: Date | null = response.departureTime ? new Date(response.departureTime) : null;
    const responsePauseConfigs: StoredPauseConfig[] = response.segments
        .filter((segment: SegmentResponse) => segment.pauseDuration !== undefined)
        .map((segment: SegmentResponse) => ({
            segmentName: segment.name,
            duration: segment.pauseDuration,
        }));

    saveStoredSettings(response.id, {
        ...existing,
        convoyName: response.name,
        departureDate: departure && !Number.isNaN(departure.getTime())
            ? formatLocalDate(departure)
            : existing.departureDate,
        departureTime: departure && !Number.isNaN(departure.getTime())
            ? formatLocalTime(departure)
            : existing.departureTime,
        speedPercentage: response.speedPercentage ?? existing.speedPercentage,
        minSegmentDuration: response.minSegmentDuration ?? existing.minSegmentDuration,
        maxSegmentDuration: response.maxSegmentDuration ?? existing.maxSegmentDuration,
        pauseConfigs: responsePauseConfigs.length > 0 ? responsePauseConfigs : existing.pauseConfigs,
    });
}
