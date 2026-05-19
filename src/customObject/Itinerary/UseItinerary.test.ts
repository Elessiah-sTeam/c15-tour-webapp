import { beforeEach, describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { TimeSpan } from "../TimeSpan.ts";
import { createItineraryStore } from "./ItineraryStore.ts";
import { useItinerary } from "./UseItinerary.ts";
import { getGlobalSettingsStorageKey } from "../../components/SettingsModal/settingsStorage.ts";

beforeEach(() => {
    localStorage.clear();
});

describe("useItinerary()", () => {
    it("retourne l'itinéraire avec la vitesse à 100% par défaut (pas de transformation)", () => {
        const store = createItineraryStore({
            id: 1,
            name: "Convoi test",
            shareCode: "",
            totalDuration: new TimeSpan(3_600_000),
            totalDistance: 10,
            segments: [],
            draft: false,
        });

        const { result } = renderHook(() => useItinerary(store));

        expect(result.current.id).toBe(1);
        expect(result.current.name).toBe("Convoi test");
        expect(result.current.totalDuration.duration).toBe(3_600_000);
    });

    it("applique le coefficient de vitesse stocké en localStorage", () => {
        const baseItinerary = {
            id: 2,
            name: "Convoi rapide",
            shareCode: "",
            totalDuration: new TimeSpan(3_600_000),
            totalDistance: 0,
            segments: [],
            draft: false,
        };

        localStorage.setItem(
            getGlobalSettingsStorageKey(baseItinerary.id),
            JSON.stringify({ speedPercentage: 80, convoyName: "Convoi rapide", pauseConfigs: [] })
        );

        const store = createItineraryStore(baseItinerary);
        const { result } = renderHook(() => useItinerary(store));

        expect(result.current.totalDuration.duration).toBe(Math.round(3_600_000 * 1.2));
    });
});
