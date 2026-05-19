import { beforeEach, describe, expect, it } from "vitest";
import { TimeSpan } from "../../customObject/TimeSpan.ts";
import type { Itinerary } from "../../customObject/Itinerary/types.ts";
import {
    applySpeedSettings,
    buildPauseConfigs,
    createDefaultGlobalSettings,
    getGlobalSettingsStorageKey,
    getSegmentPauseDuration,
    getSpeedMultiplier,
    loadGlobalSettings,
    removeSegmentPauseConfig,
    upsertSegmentPauseConfig
} from "./settingsStorage.ts";

function makeItinerary(): Itinerary {
    return {
        id: 42,
        name: "Convoi test",
        shareCode: "",
        totalDuration: new TimeSpan(),
        totalDistance: 0,
        segments: [
            {
                id: "start",
                isStartEnd: true,
                content: {
                    title: " ",
                    hour: new Date("2026-04-21T08:00:00"),
                    duration: new TimeSpan(),
                    distance: 0
                },
                steps: []
            },
            {
                id: "seg-1",
                isStartEnd: false,
                content: {
                    title: "Segment 1",
                    hour: new Date("2026-04-21T09:00:00"),
                    duration: new TimeSpan(),
                    distance: 10
                },
                steps: []
            },
            {
                id: "seg-2",
                isStartEnd: false,
                content: {
                    title: "Segment 2",
                    hour: new Date("2026-04-21T10:00:00"),
                    duration: new TimeSpan(),
                    distance: 12
                },
                steps: []
            },
            {
                id: "end",
                isStartEnd: true,
                content: {
                    title: " ",
                    hour: new Date("2026-04-21T11:00:00"),
                    duration: new TimeSpan(),
                    distance: 0
                },
                steps: []
            }
        ]
    };
}

beforeEach(() => {
    localStorage.clear();
});

describe("settingsStorage", () => {
    it("crée les pauses par défaut pour les segments ordinaires", () => {
        const itinerary = makeItinerary();
        const settings = createDefaultGlobalSettings(itinerary);

        expect(buildPauseConfigs(itinerary, settings)).toEqual([
            { segmentId: "seg-1", segmentName: "Segment 1", duration: 30 },
            { segmentId: "seg-2", segmentName: "Segment 2", duration: 30 }
        ]);
    });

    it("charge les réglages et resynchronise les noms de segment", () => {
        const itinerary = makeItinerary();

        localStorage.setItem(
            getGlobalSettingsStorageKey(itinerary.id),
            JSON.stringify({
                ...createDefaultGlobalSettings(itinerary),
                convoyName: "Ancien nom",
                pauseConfigs: [
                    { segmentId: "seg-1", segmentName: "Vieux nom", duration: 45 }
                ]
            })
        );

        const settings = loadGlobalSettings({
            ...itinerary,
            name: "Convoi renommé",
            segments: itinerary.segments.map((segment) =>
                segment.id === "seg-1"
                    ? {
                        ...segment,
                        content: {
                            ...segment.content,
                            title: "Segment renommé"
                        }
                    }
                    : segment
            )
        });

        expect(settings.convoyName).toBe("Convoi renommé");
        expect(settings.pauseConfigs).toEqual([
            { segmentId: "seg-1", segmentName: "Segment renommé", duration: 45 },
            { segmentId: "seg-2", segmentName: "Segment 2", duration: 30 }
        ]);
    });

    it("met à jour la pause d'un segment et la relit correctement", () => {
        const itinerary = makeItinerary();

        upsertSegmentPauseConfig(itinerary, "seg-2", "Segment 2", 50);

        expect(getSegmentPauseDuration(itinerary, "seg-2")).toBe(50);
    });

    it("supprime la pause stockée d'un segment supprimé", () => {
        const itinerary = makeItinerary();

        upsertSegmentPauseConfig(itinerary, "seg-1", "Segment 1", 40);
        removeSegmentPauseConfig(itinerary, "seg-1");

        const itineraryWithoutSeg1 = {
            ...itinerary,
            segments: itinerary.segments.filter(s => s.id !== "seg-1")
        };

        expect(loadGlobalSettings(itineraryWithoutSeg1).pauseConfigs).toEqual([
            { segmentId: "seg-2", segmentName: "Segment 2", duration: 30 }
        ]);
    });

    it("calcule un multiplicateur de durée à partir du pourcentage de vitesse", () => {
        expect(getSpeedMultiplier(100)).toBe(1);
        expect(getSpeedMultiplier(80)).toBe(1.2);
        expect(getSpeedMultiplier(75)).toBe(1.25);
    });

    it("applique le pourcentage de vitesse aux durées et aux heures", () => {
        const itinerary = makeItinerary();
        const oneHour = 3_600_000;
        const quarterHour = 15 * 60_000;

        const route = {
            ...itinerary,
            totalDuration: new TimeSpan(oneHour + quarterHour),
            segments: itinerary.segments.map((segment) => {
                if (segment.id === "start") {
                    return {
                        ...segment,
                        content: {
                            ...segment.content,
                            duration: new TimeSpan(oneHour),
                        }
                    };
                }

                if (segment.id === "seg-1") {
                    return {
                        ...segment,
                        content: {
                            ...segment.content,
                            duration: new TimeSpan(oneHour),
                        },
                        steps: [
                            {
                                id: "step-1",
                                isDefaultSegStart: false,
                                content: {
                                    title: "Step 1",
                                    duration: new TimeSpan(quarterHour),
                                }
                            }
                        ]
                    };
                }

                if (segment.id === "seg-2") {
                    return {
                        ...segment,
                        content: {
                            ...segment.content,
                            duration: new TimeSpan(quarterHour),
                        }
                    };
                }

                return segment;
            })
        };

        const scaled = applySpeedSettings(route, 80);

        expect(scaled.totalDuration.duration).toBe(Math.round((oneHour + quarterHour) * 1.2));
        expect(scaled.segments[1].content.duration.duration).toBe(Math.round(oneHour * 1.2));
        expect(scaled.segments[1].steps[0].content.duration.duration).toBe(Math.round(quarterHour * 1.2));
        expect(scaled.segments[2].content.hour.getTime()).toBe(
            new Date("2026-04-21T10:24:00").getTime()
        );
    });
});
