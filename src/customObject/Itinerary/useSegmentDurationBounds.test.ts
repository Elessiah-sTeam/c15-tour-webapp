import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import type { Itinerary } from "./types";

const { getGlobalSettingsStorageValue, subscribeToGlobalSettingsChanges, createDefaultGlobalSettings } = vi.hoisted(() => ({
    getGlobalSettingsStorageValue: vi.fn<() => string | null>(() => null),
    subscribeToGlobalSettingsChanges: vi.fn(() => () => undefined),
    createDefaultGlobalSettings: vi.fn(() => ({ minSegmentDuration: 1, maxSegmentDuration: 4 })),
}));
vi.mock("../../components/SettingsModal/settingsStorage", () => ({
    getGlobalSettingsStorageValue,
    subscribeToGlobalSettingsChanges,
    createDefaultGlobalSettings,
}));

import { useSegmentDurationBounds } from "./useSegmentDurationBounds";

const itinerary = { id: 1, segments: [] } as unknown as Itinerary;

describe("useSegmentDurationBounds", () => {
    beforeEach(() => {
        getGlobalSettingsStorageValue.mockReturnValue(null);
    });

    it("dérive les bornes des paramètres stockés", () => {
        getGlobalSettingsStorageValue.mockReturnValue(JSON.stringify({ minSegmentDuration: 2, maxSegmentDuration: 5 }));

        const { result } = renderHook(() => useSegmentDurationBounds(itinerary));

        expect(result.current).toEqual({ minSegmentDuration: 2, maxSegmentDuration: 5 });
        expect(subscribeToGlobalSettingsChanges).toHaveBeenCalled();
    });

    it("retombe sur les valeurs par défaut sans paramètres stockés", () => {
        getGlobalSettingsStorageValue.mockReturnValue(null);

        const { result } = renderHook(() => useSegmentDurationBounds(itinerary));

        expect(result.current).toEqual({ minSegmentDuration: 1, maxSegmentDuration: 4 });
    });

    it("recalcule quand la valeur stockée change", () => {
        getGlobalSettingsStorageValue.mockReturnValue(JSON.stringify({ minSegmentDuration: 2, maxSegmentDuration: 5 }));
        const { result, rerender } = renderHook(() => useSegmentDurationBounds(itinerary));
        expect(result.current).toEqual({ minSegmentDuration: 2, maxSegmentDuration: 5 });

        getGlobalSettingsStorageValue.mockReturnValue(JSON.stringify({ minSegmentDuration: 1, maxSegmentDuration: 3 }));
        rerender();

        expect(result.current).toEqual({ minSegmentDuration: 1, maxSegmentDuration: 3 });
    });

    it("ignore une valeur stockée invalide", () => {
        getGlobalSettingsStorageValue.mockReturnValue("{pas du json");

        const { result } = renderHook(() => useSegmentDurationBounds(itinerary));

        expect(result.current).toEqual({ minSegmentDuration: 1, maxSegmentDuration: 4 });
    });
});
