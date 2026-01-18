import {createItineraryStore} from "./ItineraryStore.ts";
import type {Step, Segment, segmentInfo, Itinerary, ItineraryStore, ItineraryArgs} from "./types.ts";

export class ItineraryModel {
    public readonly store: ItineraryStore;

    constructor({_store, initial}: ItineraryArgs) {
        if (_store) {
            this.store = _store;
        } else if (initial) {
            this.store = createItineraryStore(initial);
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
        this.store.set((route: Itinerary) => {
            const segments: Segment[] = [...route.segments];
            segments.push(segment);
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
            segments.splice(targetIndex, 0, route.segments.splice(index, 1)[0]);
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

    private moveInArray<T>(array: T[], from: number, to: number): T[] {
        if (from === to) return array;
        const copy = [...array];
        const [item] = copy.splice(from, 1);
        copy.splice(to, 0, item);
        return copy;
    }

    moveSegment(segmentId: string, toIndex: number): void {
        this.store.set((route: Itinerary) => {
            const fromIndex = route.segments.findIndex((s: Segment) => s.id === segmentId);
            if (fromIndex === -1) return route;

            const clamped = this.clamp(toIndex, 0, route.segments.length - 1);
            return {...route, segments: this.moveInArray(route.segments, fromIndex, clamped)};
        });
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