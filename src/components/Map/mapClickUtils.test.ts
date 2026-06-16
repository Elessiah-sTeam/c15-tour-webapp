import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Itinerary } from "../../customObject/Itinerary/types";

const h = vi.hoisted(() => ({
    addStep: vi.fn(),
    addSegment: vi.fn(),
    reverseGeocode: vi.fn(),
    route: { segments: [] as Itinerary["segments"] } as Itinerary,
}));

vi.mock("../../customObject/Search/geocode.ts", () => ({
    reverseGeocode: h.reverseGeocode,
}));

vi.mock("../../customObject/Itinerary/ItineraryStore.ts", () => ({
    itineraryModel: {
        get route() {
            return h.route;
        },
        addStep: h.addStep,
        addSegment: h.addSegment,
    },
}));

import { addStepFromClick } from "./mapClickUtils";

function segment(id: string, isStartEnd = false) {
    return { id, isStartEnd, steps: [], content: {} } as unknown as Itinerary["segments"][number];
}

function lastAddedTitle(): string {
    const lastCall = h.addStep.mock.calls.at(-1);
    return lastCall?.[1].content.title;
}

describe("addStepFromClick()", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        h.route = { segments: [segment("s1")] } as Itinerary;
    });

    it("utilise l'adresse géocodée comme titre", async () => {
        h.reverseGeocode.mockResolvedValue("Rue de Test, Paris");
        await addStepFromClick(47.1, 2.2);
        expect(h.addStep).toHaveBeenCalledWith("s1", expect.anything());
        expect(lastAddedTitle()).toBe("Rue de Test, Paris");
    });

    it("retombe sur les coordonnées si le géocodage renvoie null", async () => {
        h.reverseGeocode.mockResolvedValue(null);
        await addStepFromClick(47, 2);
        expect(lastAddedTitle()).toBe("47.000000 2.000000");
    });

    it("retombe sur les coordonnées si le géocodage échoue", async () => {
        h.reverseGeocode.mockRejectedValue(new Error("network"));
        await addStepFromClick(47, 2);
        expect(lastAddedTitle()).toBe("47.000000 2.000000");
    });

    it("enregistre la localisation du clic sur l'étape", async () => {
        h.reverseGeocode.mockResolvedValue("Lieu");
        await addStepFromClick(48.5, -1.5);
        expect(h.addStep.mock.calls.at(-1)?.[1].content.location).toEqual({ lat: 48.5, lon: -1.5 });
    });

    it("crée un segment quand il n'existe que le départ/arrivée", async () => {
        h.route = { segments: [segment("start", true), segment("end", true)] } as Itinerary;
        h.reverseGeocode.mockResolvedValue("Lieu");
        await addStepFromClick(47, 2);
        expect(h.addSegment).toHaveBeenCalledTimes(1);
        expect(h.addStep).toHaveBeenCalledTimes(1);
    });
});
