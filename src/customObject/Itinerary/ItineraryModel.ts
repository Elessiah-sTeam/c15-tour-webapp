import {createItineraryStore} from "./ItineraryStore.ts";
import type {
    Step,
    Segment,
    segmentInfo,
    Itinerary,
    ItineraryStore,
    ItineraryArgs,
    reorderStepInfo,
} from "./types.ts";
import {TimeSpan} from "../TimeSpan.ts";
import {ItineraryNetModel} from "./ItineraryNetModel.ts";

/**
 * Modèle de l'itinéraire, regroupant toutes les fonctions métiers pour le manipuler
 */
class ItineraryModel {
    // Attributs
    public readonly store: ItineraryStore;
    public readonly netModel: ItineraryNetModel;

    // Constructeurs
    /**
     * Constructeur du modèle, peut se construire à partir d'un store ou d'un état initial ou de rien
     * POST l'itinéraire au backend
     * @param _store store sur lequel se basé
     * @param initial valeur initiale de l'itinéraire
     * @constructor
     */
    constructor({_store, initial}: ItineraryArgs) {
        if (_store) {
            this.store = _store;
        } else if (initial) {
            this.store = createItineraryStore(this.formatItinerary(initial));
        } else {
            this.store = createItineraryStore();
            this.store.set((route: Itinerary) => {
                return this.formatItinerary({...route});
            });
        }
        this.netModel = new ItineraryNetModel(this.store);
    }

    // Méthodes publiques
    /**
     * Récupèrer le snapshot de l'itinéraire
     */
    get route() {
        return this.store.getSnapshot();
    }

    /**
     * Fonction pour renommer l'itinéraire
     * @param newName nouveau nom à appliquer
     */
    renameItinerary(newName: string): void {
        this.store.set((route: Itinerary) => ({
           ...route,
            name: newName
        }));
    }

    /**
     * Permet de récuperer un segment à partir d'un id.
     *
     * Renvoi undefined si ne trouve pas sinon un Segment
     * @param segmentId ID du segment à récupérer
     */
    getSegment(segmentId: string): Segment | undefined {
        return this.route.segments.find((s: Segment) => s.id === segmentId);
    }

    /**
     * Permet d'ajouter un segment à l'itinéraire
     * @param segment Segment à ajouter
     */
    addSegment(segment: Segment): void {
        this.store.set((route: Itinerary) => {
            const segments: Segment[] = [...route.segments];
            segments.splice(segments.length - 1, 0, segment);
            return {...route, segments: this.updateStarts(segments)};
        });
    }

    /**
     * Permet de retirer un segment à partir de son id
     * @param segmentId ID du segment à retirer
     */
    removeSegment(segmentId: string): void {
        this.store.set((route: Itinerary) => {
            return {...route, segments: this.updateStarts(route.segments.filter(s => s.id != segmentId))}});
    }

    /**
     * Permet de mettre à jour les informations d'un Segment à partir de son ID
     * @param segmentId ID du segment à modifier
     * @param info nouvelles infos du segment
     */
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

    /**
     * Permet de déplacer un segment dans l'itinéraire
     * @param segmentId ID du segment à déplacer
     * @param targetIndex index cible
     */
    reorderSegment(segmentId: string, targetIndex: number): void {
        this.store.set((route: Itinerary) => {
            const segments: Segment[] = [...route.segments];
            const index = segments.findIndex((seg: Segment) => seg.id == segmentId);
            if (index == -1)
                return route;
            const [moved] = segments.splice(index, 1);
            segments.splice(targetIndex, 0, moved);
            return {...route, segments: this.updateStarts(segments)};
            }
        );
    }

    /**
     * Permet de renommer un segment à partir de son ID
     * @param segmentId ID du segment à renommer
     * @param newName nouveau nom à appliquer
     */
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

    /**
     * Permet de récupérer une étape
     * @param segmentId Id du segment parent
     * @param stepId Id de l'étape
     */
    getStep(segmentId: string, stepId: string): Step | undefined {
        return this.route.segments.find((s: Segment) => s.id === segmentId)?.steps.find((s: Step) => s.id === stepId);
    }

    /**
     * Permet d'ajouter une étape
     * @param segmentId ID du parent où on veut l'insérer
     * @param step Etape à ajouter
     * @param index Optionnel Index si on ne veut pas forcément l'ajouter à la fin
     */
    addStep(segmentId: string, step: Step, index?: number): void {
        this.store.set((route: Itinerary) => {
            const rebuilt: Segment[] = this.rebuildSegmentsWithNewStep(route.segments, segmentId, step, index);
            const segments: Segment[] = this.updateStarts(rebuilt);
            return {
                ...route,
                segments: segments
            };
        });
    }

    /**
     * Permet de supprimer une étape
     * @param segmentId ID du segment parent
     * @param stepId ID de l'étape à supprimer
     */
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

    /**
     * Permet de déplacer une étape dans l'itinéraire
     * @param fromSegmentId ID du segment parent de départ
     * @param fromStepIndex Index de l'étape au départ
     * @param toSegmentId ID du segment parent d'arrivée
     * @param toStepIndex Index de l'étape d'arrivée
     */
    reorderStep(fromSegmentId: string, fromStepIndex: number, toSegmentId: string, toStepIndex: number): void {
        this.store.set((route: Itinerary) => {
            const env = this.getReorderStepInfo(route, fromSegmentId, fromStepIndex, toSegmentId, toStepIndex)

            if (env != null && this.moveSteps(env, fromStepIndex)) {
                // Rebuild route en ne recréant que les segments touchés
                return {
                    ...route,
                    segments: this.applyStepReorder(route.segments, env, fromSegmentId, toSegmentId),
                }
            } else {
                return route;
            }
        });
    }

    /**
     * Permet de renommer une étape
     * @param segmentId ID du segment parent
     * @param stepId Id de l'étape
     * @param newName Nouveau nom à appliquer
     */
    renameStep(segmentId: string, stepId: string, newName: string): void {
        this.store.set((route: Itinerary) => ({
            ...route,
            segments: this.updateStarts(route.segments.map((seg: Segment) => {
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
                })),
        }));
    }

    /**
     * Met à jour les coordonnées d'une étape
     * @param segmentId ID du segment parent
     * @param stepId Id de l'étape
     * @param location nouvelle position {lat, lon}
     */
    setStepLocation(segmentId: string, stepId: string, location: {lat: number, lon: number}): void {
        this.store.set((route: Itinerary) => ({
            ...route,
            segments: this.updateStarts(route.segments.map((seg: Segment) => {
                if (seg.id !== segmentId) return seg;

                return {
                    ...seg,
                    steps: seg.steps.map((step: Step) => {
                        if (step.id !== stepId) return step;
                        return {
                            ...step,
                            content: {
                                ...step.content,
                                location,
                            },
                        };
                    })
                }
            })),
        }));
    }

    // Méthodes privées
    /**
     * Vérifie que le départ existe et qu'il est à la bonne place
     * Si besoin le créé et/ou le déplace
     * @param itinerary itinéraire concerné
     */
    private formatStart(itinerary: Itinerary): Itinerary {
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
                    duration: new TimeSpan(),
                    distance: 0
                },
                isStartEnd: true,
                steps: new Array<Step>()
            });
        } else if (!itinerary.segments[index].isStartEnd) {
            itinerary.segments[index].isStartEnd = true;
        }
        return itinerary;
    }

    /**
     * Vérifie que l'arrivée existe et qu'il est au bon endroit
     *
     * Si besoin le créé et/ou le déplace
     * @param itinerary Itinéraire concerné
     */
    private formatEnd(itinerary: Itinerary): Itinerary {
        const index: number = itinerary.segments.findIndex((seg: Segment) => seg.id == "end");
        console.log("Index end : ", index);
        const segments: Segment[] = itinerary.segments;
        if (index == -1) {
            segments.push({
                id: "end",
                content: {
                    title: " ",
                    hour: new Date(),
                    duration: new TimeSpan(),
                    distance: 0,
                },
                isStartEnd: true,
                steps: new Array<Step>()
            });
        } else if (index != segments.length - 1) {
            const [end] = segments.splice(index, 1);
            if (!end.isStartEnd)
                end.isStartEnd = true;
            segments.push(end);
        } else if (!itinerary.segments[index].isStartEnd) {
            itinerary.segments[index].isStartEnd = true;
        }
        return itinerary;
    }

    /**
     * Vérifie que l'arrivée et le départ existent et sont bien placés
     *
     * Si besoin les créés et les déplace
     * @param itinerary itinéraire concerné
     */
    private formatItinerary(itinerary: Itinerary): Itinerary {
        const result: Itinerary = this.formatStart(itinerary);
        return this.formatEnd(result);
    }

    /**
     * Renvoi n si compris entre min et max sinon renvoi la limite que dépasse n
     * @param n nombre à tester
     * @param min limite basse
     * @param max limite haute
     * @private
     */
    private clamp(n: number, min: number, max: number): number {
        if (n < min)
            return min;
        if (n > max)
            return max;
        return n;
    }

    /**
     * Récupère toutes les informations nécessaires au déplacement de l'étape
     *
     * Renvoi reorderStepInfo si tout est conforme sinon null
     * @param route itinéraire à modifier
     * @param fromSegmentId ID du segment de départ
     * @param fromStepIndex Index de l'étape au départ
     * @param toSegmentId ID du segment de fin
     * @param toStepIndex Index de l'étape à la fin
     * @private
     */
    private getReorderStepInfo(route: Itinerary,
                               fromSegmentId: string,
                               fromStepIndex: number,
                               toSegmentId: string,
                               toStepIndex: number): reorderStepInfo | null {
        const fromSeg: Segment | undefined = route.segments.find((s: Segment) => s.id === fromSegmentId);
        const toSeg: Segment | undefined = route.segments.find((s: Segment) => s.id === toSegmentId);

        if (!fromSeg || !toSeg) return null;


        // Vérifie l'index d'origine
        if (fromStepIndex < 0 || fromStepIndex >= fromSeg.steps.length) return null;

        const sameSeg = fromSegmentId == toSegmentId;

        // Préparer nouveaux tableaux de steps (immutables)
        const newFromSteps: Step[] = [...fromSeg.steps];
        const newToSteps = sameSeg ? newFromSteps : [...toSeg.steps];

        return {
            fromSeg: fromSeg,
            toSeg: toSeg,
            sameSeg: sameSeg,
            newFromSteps: newFromSteps,
            newToSteps: newToSteps,
            insertIndex: toStepIndex
        };
    }

    /**
     * Retire l'étape déplacée de l'itinéraire
     * Retire l'étape d'arrivée si on déplace dans une catégorie arrivée ou départ
     * @param env Toutes les informations liés au déplacement
     * @param fromStepIndex Index de l'étape au départ
     * @private
     */
    private retrieveTargets(env: reorderStepInfo, fromStepIndex: number): Step {
        // On récupère les items pour les replacer
        const [movedStep] = env.newFromSteps.splice(fromStepIndex, 1);
        return movedStep;
    }

    /**
     * Permet de replacer les étapes récupérées dans retrieveTargets
     * @param env Toutes les informations liées au déplacement
     * @param movedStep Etape cible du déplacement
     * @private
     */
    private replaceSteps(env: reorderStepInfo,
                         movedStep: Step): void {
        // On clamp après les suppressions pour avoir la dernière taille et éviter les problèmes
        const clamped = this.clamp(env.insertIndex, 0, env.newToSteps.length);
        env.newToSteps.splice(clamped, 0, movedStep);
    }

    /**
     * Déplace l'étape et gère les inversions d'étape en cas d'arrivée ou de départ
     * @param env Toutes les informations liés au déplacement
     * @param fromStepIndex Index de l'étape au départ
     * @private
     */
    private moveSteps(env: reorderStepInfo, fromStepIndex: number): boolean {

        const movedStep: Step = this.retrieveTargets(env, fromStepIndex);
        if(!movedStep) return false;
        this.replaceSteps(env, movedStep);
        return true;
    }

    /**
     * Reconstruit les segments avec la nouvelle étape ajoutée ainsi que les départs ajoutés
     * @param segments Snapshot des segments à reconstruire
     * @param segmentId ID du segment où insérer
     * @param step Etape à ajouter
     * @param index index dans le segment où insérer la nouvelle étape
     * @private
     */
    private rebuildSegmentsWithNewStep(segments: Segment[],
                                      segmentId: string,
                                      step: Step,
                                      index?: number): Segment[] {
       return segments.map((seg) => {
            if (seg.id != segmentId) return seg;
            const steps = [...seg.steps];
            index = index ?? steps.length;
            steps.splice(index, 0, step);
            return {...seg, steps: steps};
        });
    }

    /**
     * Applique le départ à un segment
     * @param segment segment à modifier
     * @param start départ à ajouter
     * @private
     */
    private applyStart(segment: Segment,
                       start: Step): Segment {
        const startCopy: Step = {...start, id: "start-" + segment.id, isDefaultSegStart: true};
        const steps = segment.steps.length === 0
            ? [startCopy]
            : [startCopy, ...segment.steps.slice(1)]

        return { ...segment, steps};
    }

    /**
     * Mets à jour les départs de segment
     * @param segments à mettre jour
     * @private
     */
    private updateStarts(segments: Segment[]): Segment[] {
        const NB_START_END = 2;
        const FIRST_SEG_INDEX = 1;
        const END_SEG_INDEX = segments.length - 1;

        if (segments.length == NB_START_END || segments[FIRST_SEG_INDEX].steps.length == 0)
            return segments;

        const out = [...segments];

        out[0] = this.applyStart(out[0], out[FIRST_SEG_INDEX].steps[0]);

        this.applyStart(segments[0], segments[FIRST_SEG_INDEX].steps[0]);
        for (let i = FIRST_SEG_INDEX; i < END_SEG_INDEX; i++) {
            out[i + 1] = this.applyStart(out[i + 1], out[i].steps[out[i].steps.length - 1]);
        }

        return out;
    }

    /**
     * Créé une copie des segments avec les étapes réagencées
     * et applique les départs
     * @param segments Segments à copier
     * @param env environnement de réorganisation
     * @param fromSegmentId ID du segment d'origine
     * @param toSegmentId ID du segment de départ
     * @private
     */
    private applyStepReorder(segments: Segment[],
                             env: reorderStepInfo,
                             fromSegmentId: string,
                             toSegmentId: string): Segment[] {
        const copy: Segment[] = segments.map((seg: Segment) => {
            if (seg.id == fromSegmentId && env.sameSeg) {
                return {...seg, steps: env.newToSteps};
            }
            if (seg.id == fromSegmentId) {
                return {...seg, steps: env.newFromSteps};
            }
            if (seg.id == toSegmentId) {
                return {...seg, steps: env.newToSteps};
            }
            return {...seg};
        });
        console.log("First Copy : ", copy.length, copy[0].steps.length, copy[1].steps.length, copy[2].steps.length);
        const result: Segment[] = this.updateStarts(copy);
        console.log("Second Copy : ", copy.length, copy[0].steps.length, copy[1].steps.length, copy[2].steps.length);
        return result;
    }
}

export default ItineraryModel
