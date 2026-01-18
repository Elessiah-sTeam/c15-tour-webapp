import {createItineraryStore} from "./ItineraryStore.ts";
import type {Step, Segment, segmentInfo, Itinerary, ItineraryStore, ItineraryArgs} from "./types.ts";
import {TimeSpan} from "../TimeSpan.ts";

export class ItineraryModel {
    public readonly store: ItineraryStore;

    formatStart(itinerary: Itinerary): Itinerary {
        const index: number = itinerary.segments.findIndex((seg: Segment) => seg.id == "start");
        const segments: Segment[] = itinerary.segments;
        if (index > 0) {
            const [start] = segments.splice(index, 1);
            if (!start.isStartEnd)
                start.isStartEnd = true;
            segments.splice(0, 0, start);
        } else if (index == -1) {
            segments.splice(0, 0, {
                id: "start",
                content: {
                    title: " ",
                    hour: new Date(),
                    duration: new TimeSpan()
                },
                isStartEnd: true,
                steps: new Array<Step>()
            });
        } else if (!itinerary.segments[index].isStartEnd) {
            itinerary.segments[index].isStartEnd = true;
        }
        return itinerary;
    }

    formatEnd(itinerary: Itinerary): Itinerary {
        const index: number = itinerary.segments.findIndex((seg: Segment) => seg.id == "end");
        const segments: Segment[] = itinerary.segments;
        if (index != segments.length - 1) {
            const [end] = segments.splice(index, 1);
            if (!end.isStartEnd)
                end.isStartEnd = true;
            segments.push(end);
        } else if (index == -1) {
            segments.push({
                id: "end",
                content: {
                    title: " ",
                    hour: new Date(),
                    duration: new TimeSpan()
                },
                isStartEnd: true,
                steps: new Array<Step>()
            });
        } else if (!itinerary.segments[index].isStartEnd) {
            itinerary.segments[index].isStartEnd = true;
        }
        return itinerary;
    }

    formatItinerary(itinerary: Itinerary): Itinerary {
        const result: Itinerary = this.formatStart(itinerary);
        return this.formatEnd(result);
    }

    constructor({_store, initial}: ItineraryArgs) {
        if (_store) {
            this.store = _store;
        } else if (initial) {
            this.store = createItineraryStore(this.formatItinerary(initial));
        } else {
            this.store = createItineraryStore();
        }
    }

    get route() {
        return this.store.getSnapshot();
    }

    renameItinerary(newName: string): void {
        this.store.set((route: Itinerary) => ({
           ...route,
            name: newName
        }));
    }

    getSegment(segmentId: string): Segment | undefined {
        return this.route.segments.find((s: Segment) => s.id === segmentId);
    }

    addSegment(segment: Segment): void {
        console.log("Adding segment...");
        this.store.set((route: Itinerary) => {
            const segments: Segment[] = [...route.segments];
            segments.splice(segments.length - 1, 0, segment);
            return {...route, segments: segments};
        });
    }

    removeSegment(segmentId: string): void {
        this.store.set((route: Itinerary) => {
            return {...route, segments: route.segments.filter(s => s.id != segmentId)}});
    }

    updateSegmentInfo(segmentId: string,
                      info: segmentInfo): void {
        this.store.set((route: Itinerary) => {
                return {
                    ...route, segments: route.segments.map((seg: Segment) =>
                            seg.id !== segmentId
                                ? seg
                                : {...seg, info})
                };
            });
    }

    reorderSegment(segmentId: string, targetIndex: number): void {
        this.store.set((route: Itinerary) => {
            const segments: Segment[] = [...route.segments];
            const index = segments.findIndex((seg: Segment) => seg.id == segmentId);
            if (index == -1)
                return route;
            const [moved] = segments.splice(index, 1);
            segments.splice(targetIndex, 0, moved);
            return {...route, segments};
            }
        );
    }

    renameSegment(segmentId: string, newName: string): void {
        this.store.set((route: Itinerary) => {
            return {
                ...route,
                segments: route.segments.map((seg: Segment) => {
                        if (seg.id == segmentId)
                            return {...seg, content: {...seg.content, title: newName}}
                        return seg;
                    })
            };
        });
    }

    getStep(segmentId: string, stepId: string): Step | undefined {
        return this.route.segments.find((s: Segment) => s.id === segmentId)?.steps.find((s: Step) => s.id === stepId);
    }

    addStep(segmentId: string, step: Step, index?: number): void {
        this.store.set((route: Itinerary) => {
            return {
                ...route,
                segments: route.segments.map(seg => {
                        if (seg.id != segmentId) return seg;
                        const steps = [...seg.steps];
                        steps.splice(index ?? steps.length, 0, step);
                        return {...seg, steps: steps};
                    })
            };
        });
    }

    removeStep(segmentId: string, stepId: string): void {
        this.store.set((route: Itinerary) => {
            return {
                ...route,
                segments: route.segments.map((seg: Segment) =>
                        seg.id !== segmentId
                            ? seg
                            : {...seg, steps: seg.steps.filter((s) => s.id != stepId)})
                }
        });
    }

    private clamp(n: number, min: number, max: number): number {
        if (n < min)
            return min;
        if (n > max)
            return max;
        return n;
    }

    reorderStep(fromSegmentId: string, fromStepIndex: number, toSegmentId: string, toStepIndex: number): void {
        this.store.set((route: Itinerary) => {
            const fromSeg: Segment | undefined = route.segments.find((s: Segment) => s.id === fromSegmentId);
            const toSeg: Segment | undefined = route.segments.find((s: Segment) => s.id === toSegmentId);

            if (!fromSeg || !toSeg) return route;

            // Vérifie l'index d'origine
            if (fromStepIndex < 0 || fromStepIndex >= fromSeg.steps.length) return route;

            const sameSeg = fromSegmentId == toSegmentId;

            // Préparer nouveaux tableaux de steps (immutables)
            const newFromSteps: Step[] = [...fromSeg.steps];
            const [movedStep] = newFromSteps.splice(fromStepIndex, 1);
            if(!movedStep) return route;

            // Si on déplace dans le même segment, attention à l'index après suppression
            let insertIndex = toStepIndex;
            if (fromSegmentId == toSegmentId) {
                insertIndex = toStepIndex > fromStepIndex ? toStepIndex - 1 : toStepIndex;
            }

            const newToStepsBase = sameSeg ? newFromSteps : [...toSeg.steps];
            const clamped = this.clamp(insertIndex, 0, newToStepsBase.length);

            const newToSteps = [...newToStepsBase];
            newToSteps.splice(clamped, 0, movedStep);

            // Rebuild route en ne recréant que les segments touchés
            return {...route,
                segments: route.segments.map((seg: Segment) => {
                        if (seg.id == fromSegmentId && sameSeg) {
                            return {...seg, steps: newToSteps};
                        }
                        if (seg.id == fromSegmentId) {
                            return {...seg, steps: newFromSteps};
                        }
                        if (seg.id == toSegmentId) {
                            return {...seg, steps: newToSteps};
                        }
                        return seg;
                }),
            }
        });
    }

    renameStep(segmentId: string, stepId: string, newName: string): void {
        this.store.set((route: Itinerary) => ({
            ...route,
            segments: route.segments.map((seg: Segment) => {
                    if (seg.id != segmentId) return seg;

                    return {
                        ...seg,
                        steps: seg.steps.map((step: Step) => {
                            if (step.id != stepId) return step;
                            return {
                                ...step,
                                content: {
                                    ...step.content,
                                    title: newName
                                },
                            };
                        })
                    }
                }),
        }));
    }
}