import type { Itinerary, Segment } from "../../customObject/Itinerary/types.ts";
import type { GlobalSettings, PauseConfig } from "./settingsTypes.ts";
import { DEFAULT_PAUSE_DURATION } from "./settingsTypes.ts";
import { TimeSpan } from "../../customObject/TimeSpan.ts";
import { updateStarts } from "../../customObject/Itinerary/utils.ts";

const GLOBAL_SETTINGS_CHANGE_EVENT = "global-settings-changed";

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
                duration: existingPause?.duration ?? DEFAULT_PAUSE_DURATION
            };
        });
}

export function persistGlobalSettings(itineraryId: number, settings: GlobalSettings): void {
    localStorage.setItem(getGlobalSettingsStorageKey(itineraryId), JSON.stringify(settings));
    if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(GLOBAL_SETTINGS_CHANGE_EVENT));
    }
}

/**
 * Retourne la valeur brute stockee pour les parametres globaux d'un itineraire.
 * @param itineraryId identifiant de l'itineraire
 */
export function getGlobalSettingsStorageValue(itineraryId: number): string | null {
    return localStorage.getItem(getGlobalSettingsStorageKey(itineraryId));
}

/**
 * Ecoute les changements des parametres globaux, y compris ceux emis depuis
 * un autre contexte de navigation.
 * @param onChange rappel declenche quand les parametres evoluent
 */
export function subscribeToGlobalSettingsChanges(onChange: () => void): () => void {
    if (typeof window === "undefined") {
        return () => undefined;
    }

    const handleChange = () => onChange();
    window.addEventListener(GLOBAL_SETTINGS_CHANGE_EVENT, handleChange);
    window.addEventListener("storage", handleChange);

    return () => {
        window.removeEventListener(GLOBAL_SETTINGS_CHANGE_EVENT, handleChange);
        window.removeEventListener("storage", handleChange);
    };
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

/**
 * Convertit le pourcentage de vitesse en coefficient d'allongement des durees.
 * Exemple: 80% -> 1.25, donc +25% sur les durees.
 * @param speedPercentage pourcentage de vitesse de conduite
 */
export function getSpeedMultiplier(speedPercentage: number): number {
    const normalizedSpeed = Number.isFinite(speedPercentage) && speedPercentage > 0
        ? speedPercentage
        : 100;

    return 100 / normalizedSpeed;
}

function scaleTimeSpan(duration: TimeSpan | undefined, multiplier: number): TimeSpan {
    const normalizedDuration = Object.assign(new TimeSpan(), duration);
    return new TimeSpan(Math.round(normalizedDuration.duration * multiplier));
}

function scaleSegment(segment: Segment, multiplier: number): Segment {
    return {
        ...segment,
        content: {
            ...segment.content,
            duration: scaleTimeSpan(segment.content.duration, multiplier)
        },
        steps: segment.steps.map((step) => ({
            ...step,
            content: {
                ...step.content,
                duration: scaleTimeSpan(step.content.duration, multiplier)
            }
        }))
    };
}

/**
 * Applique le coefficient de vitesse aux durees du trajet, des segments et des etapes.
 * @param itinerary itineraire source
 * @param speedPercentage pourcentage de vitesse a appliquer
 */
export function applySpeedSettings(itinerary: Itinerary, speedPercentage: number): Itinerary {
    const multiplier = getSpeedMultiplier(speedPercentage);
    const scaledSegments = updateStarts(itinerary.segments.map((segment) => scaleSegment(segment, multiplier)));

    return {
        ...itinerary,
        totalDuration: scaleTimeSpan(itinerary.totalDuration, multiplier),
        segments: scaledSegments
    };
}
