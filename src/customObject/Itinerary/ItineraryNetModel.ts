import type {
    Itinerary,
    ItineraryStore,
    Segment,
    Step
} from "./types.ts";

import type {
    ItineraryPatchRequest,
    ItineraryRequest,
    ItineraryResponse,
    SegmentRequest,
    SegmentResponse,
    Waypoint
} from "./netTypes.ts";
import {TimeSpan} from "../TimeSpan.ts";
import type {Feature, LineString} from "geojson";
import {updateStarts} from "./utils.ts";
import {getAuthToken} from "../../auth/useAuth";
import {saveStateStore} from "../SaveState/SaveStateStore.ts";
import {pushErrorToast, pushSuccessToast} from "../Toast/ToastStore.ts";
import { BACKEND_URL } from '../../config';

function authHeaders(): HeadersInit {
    const token = getAuthToken();
    return {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    };
}

export class ItineraryNetModel {
    // Attributs
    public readonly store: ItineraryStore;
    private isDragging: boolean = false;

    // Constructeur
    constructor(store: ItineraryStore, post: boolean = false) {
        this.store = store;

        if (post)
            this.post().then();
    }

    // Méthodes publics

    /**
     * Charge un itinéraire depuis le backend
     * @param id ID de l'itinéraire à charger
     */
    public async get(id: number): Promise<void> {
        const response: ItineraryResponse = await this.retrieveItinerary(id);
        await this.applyItinerary(response);
        saveStateStore.set(() => false);
    }

    /**
     * Mets à jour dans le backend la version locale
     */
    public async put(): Promise<boolean>
    {
        const itinerary: Itinerary = this.store.getSnapshot();
        if (itinerary.id == -1)
            return this.post();
        const request: ItineraryRequest | null = this.buildNetObject();
        if (!request)
        {
            pushErrorToast("Erreur ! Impossible d'envoyer un itinéraire incomplet !");
            return false;
        }
        const response: Response = await fetch(BACKEND_URL + `/tours/${itinerary.id}`, {
            method: "PUT",
            headers: authHeaders(),
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            pushErrorToast(`Erreur API: ${response.status} ${response.statusText}`);
            return false;
        }
        await this.applyItinerary((await response.json()) as ItineraryResponse);
        return true;
    }

    /**
     * Met a jour l'heure de depart cote backend pour recalculer les ETA.
     * @param estimatedDeparture nouvelle heure de depart
     */
    public async patchEstimatedDeparture(estimatedDeparture: Date): Promise<boolean> {
        const itinerary: Itinerary = this.store.getSnapshot();
        if (itinerary.id == -1 || Number.isNaN(estimatedDeparture.getTime())) {
            return false;
        }

        const request: ItineraryPatchRequest = {
           departureTime: estimatedDeparture.toISOString(),
        };

        try {
            const response: Response = await fetch(BACKEND_URL + `/tours/${itinerary.id}`, {
                method: "PATCH",
                headers: authHeaders(),
                body: JSON.stringify(request),
            });

            if (!response.ok) {
                pushErrorToast(`Erreur API: ${response.status} ${response.statusText}`);
                return false;
            }

            await this.applyItinerary((await response.json()) as ItineraryResponse);
            return true;
        } catch {
            pushErrorToast("Erreur API: impossible de mettre a jour l'heure de depart");
            return false;
        }
    }

    /**
     * Créer un nouvel itinéraire dans le backend
     * Assigne l'ID fournit par le backend à l'itinéraire local
     */
    public async post() : Promise<boolean>
    {
        const request: ItineraryRequest | null = this.buildNetObject();

        if (!request) {
            pushErrorToast("Erreur ! Impossible d'envoyer un itinéraire incomplet !");
            return false;
        }

        const response: Response = await fetch(BACKEND_URL + `/tours`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify(request),
        })

        if (!response.ok) {
            pushErrorToast(`Erreur API: ${response.status} ${response.statusText}`);
            return false;
        }

        const itinerary: ItineraryResponse = await response.json();

        if (!itinerary.id && itinerary.id !== 0) {
            pushErrorToast("Erreur API: Impossible de récupérer l'ID de l'itinéraire dans la réponse du backend");
            return false;
        }

        await this.applyItinerary(itinerary);

        return true;
    }

    /**
     * Lance un put immédiatement.
     * Ne fait rien pendant un drag (voir startDrag/endDrag).
     */
    public setupSave(): void {
        if (this.isDragging) return;
        saveStateStore.set(() => true);
        this.put().then();
    }

    /**
     * Enregistre le convoi en tant que brouillon (draft = true).
     * Marque l'état comme sauvegardé si le backend répond OK.
     */
    public async saveAsDraft(): Promise<boolean> {
        this.store.set(it => ({ ...it, draft: true }));
        const ok = await this.put();
        if (ok) {
            saveStateStore.set(() => false);
            pushSuccessToast("Convoi enregistré en brouillon.");
        } else {
            pushErrorToast("Impossible d'enregistrer le convoi en brouillon.");
        }
        return ok;
    }

    /**
     * Finalise le convoi (draft = false).
     * Marque l'état comme sauvegardé si le backend répond OK.
     */
    public async saveAsFinalized(): Promise<boolean> {
        this.store.set(it => ({ ...it, draft: false }));
        const ok = await this.put();
        if (ok) {
            saveStateStore.set(() => false);
            pushSuccessToast("Convoi finalisé et enregistré.");
        } else {
            pushErrorToast("Impossible de finaliser le convoi.");
        }
        return ok;
    }

    /**
     * Signale le début d'un drag : bloque les appels setupSave intermédiaires
     */
    public startDrag(): void {
        this.isDragging = true;
    }

    /**
     * Signale la fin d'un drag : relance immédiatement un put sans délai
     */
    public endDrag(hasChanges: boolean = true): void {
        if (!this.isDragging) return;
        this.isDragging = false;
        if (hasChanges) {
            this.put().then();
        }
    }

    // Méthodes Privées
    /**
     * Récupère un itinéraire depuis le backend
     * @param id ID de l'itinéraire à charger
     */
    private async retrieveItinerary(id: number): Promise<ItineraryResponse> {
        const response: Response = await fetch(BACKEND_URL + `/tours/${id}`, {
            method: "GET",
            headers: authHeaders(),
        });

        if (!response.ok) {
            pushErrorToast(`Erreur API: ${response.status} ${response.statusText}`);
        }

        return (await response.json()) as ItineraryResponse;
    }

    /**
     * Transforme l'objet geometry brut en un objet utilisable pour le dessin.
     * @param geometry
     * @private
     */
    private normalizeNetGeometry(geometry: string): Feature<LineString> | undefined {
        const netResponse: Feature<LineString> = JSON.parse(geometry) as Feature<LineString>;
        if (!netResponse)
            return undefined;
        return netResponse;
    }

    /**
     * Parse une date ISO renvoyée par l'API. Chaîne absente ou invalide → Date invalide (pas « maintenant »).
     */
    private normalizeNetDate(date: string | undefined): Date {
        if (date === undefined || date === null || date === "") {
            return new Date(NaN);
        }
        const normalized: Date = new Date(date);
        return Number.isNaN(normalized.getTime()) ? new Date(NaN) : normalized;
    }

    private parseOptionalIsoDate(iso: string | undefined): Date | undefined {
        if (iso === undefined || iso === null || iso === "") {
            return undefined;
        }
        const d = new Date(iso);
        return Number.isNaN(d.getTime()) ? undefined : d;
    }

    private buildStepDuration(previousArrival: Date | undefined, estimatedArrival: Date | undefined): TimeSpan {
        if (!previousArrival || !estimatedArrival) {
            return new TimeSpan();
        }

        const durationMs = estimatedArrival.getTime() - previousArrival.getTime();
        return new TimeSpan(Math.max(0, durationMs));
    }

    /**
     * Transforme des steps Net en steps utilisable pour le front
     * @param waypoints steps Net à normaliser
     * @param refId Compteur d'ID pour définir les id des nouvelles étapes
     * @param isFirstSeg Défini si ces étapes sont dans le premier segment pour bloquer ou non le départ
     * @private
     */
    private normalizeWaypoints(waypoints: Waypoint[],
                               refId: {id: number} = {id: 0},
                               isFirstSeg: boolean): Step[] {
        const startId: number = refId.id;
        let previousArrival: Date | undefined;

        return waypoints.map((waypoint: Waypoint) => {
            const estimatedArrival = this.parseOptionalIsoDate(waypoint.estimatedArrival);
            const duration = this.buildStepDuration(previousArrival, estimatedArrival);
            previousArrival = estimatedArrival;

            return {
                id: `${refId.id++}`,
                content: {
                    title: waypoint.name,
                    duration,
                    location: {lat: waypoint.coordinates.latitude, lon: waypoint.coordinates.longitude},
                    ...(estimatedArrival !== undefined ? {estimatedArrival} : {}),
                },
                isDefaultSegStart: !isFirstSeg && startId == refId.id,
            }
        });
    }

    /**
     * Ajoute le segment conteneur du départ et d'arrivée
     * @param segments segments à ajouter
     * @private
     */
    private addStartEndSegment(segments: Segment[]): Segment[] {
        const startHour: Date = segments[0]?.content.hour ?? new Date();
        const start: Segment = {
            id: "start",
            content: {
                title: " ",
                hour: new Date(startHour.getTime()),
                duration: new TimeSpan(0),
                distance: 0,
                geometry: undefined
            },
            isStartEnd: true,
            steps: []
        };
        const end: Segment = {...start, id: "end", steps: []};
        return [start, ...segments, end];
    }

    /**
     * Transforme des segments Net en segments utilisable pour le front
     * @param segments segments Net à normaliser
     * @param refId Compteur d'ID pour définir les ids des nouveaux segments
     * @private
     */
    private normalizeSegments(segments: SegmentResponse[],
                              itineraryDepartureTime: string | undefined,
                              refId: {id: number} = {id: 0}): Segment[] {
        const startId: number = refId.id;
        return this.addStartEndSegment(segments.map((seg: SegmentResponse, index: number) => {
                const steps: Step[] = this.normalizeWaypoints(seg.waypoints, refId, refId.id == startId);
                if (index > 0) {
                    // On est pas le premier segment, on retire le départ par défaut
                    steps.splice(0, 1);
                }
                return {
                    id: `${refId.id++}`,
                    isStartEnd: false,
                    content: {
                        title: seg.name,
                        duration: new TimeSpan(seg.duration * 1000),
                        distance: seg.distance * 0.001,
                        geometry: this.normalizeNetGeometry(seg.geometry),
                        hour: index === 0
                            ? this.normalizeNetDate(itineraryDepartureTime ?? seg.waypoints[0]?.estimatedArrival ?? seg.estimatedDeparture)
                            : this.normalizeNetDate(seg.estimatedDeparture),
                        ...(seg.breakDuration !== undefined && seg.breakDuration !== null
                            ? {breakDuration: seg.breakDuration}
                            : {}),
                    },
                    steps: steps,
                }
            })
        );
    }

    /**
     * Applique l'itinéraire reçu au store
     * @param response Itinéraire reçu à appliquer
     * @private
     */
    private async applyItinerary(response: ItineraryResponse): Promise<void> {
        this.store.set(() => {
            // Une ref pour incrémenter au sein des fonctions et pas perdre le fil
            const refId: {id: number} = {id: 0};
            const segments: Segment[] = this.normalizeSegments(response.segments ?? [], response.departureTime, refId);
            const totalDurationSec = response.totalDuration ?? 0;
            const totalDistanceM = response.totalDistance ?? 0;
            return {
                id: response.id,
                name: response.name,
                shareCode: response.shareCode ?? "",
                totalDuration: new TimeSpan(totalDurationSec * 1000),
                totalDistance: totalDistanceM * 0.001,
                segments: updateStarts(segments),
                draft: response.draft ?? true,
            };
        });
    }

    /**
     * Transforme le tableau de steps en waypoints expédiable au backend
     * @param steps Steps à transformer
     * @private
     */
    private buildNetWaypoints(steps: Step[]): Waypoint[] {
        return steps.map((step: Step) => ({
            name: step.content.title,
            coordinates: {
                latitude: step.content.location?.lat ?? 0,
                longitude: step.content.location?.lon ?? 0,
            },
        }));
    }

    /**
     * Vérifie que les segments ont bien un départ et une arrivée
     * @param segments Segments à vérifier
     * @private
     */
    private checkSegmentsValidity(segments: Segment[]): boolean {
        if (segments.length < 2) {
            return false;
        }
        if (segments[0].steps.length == 0) {
            return false;
        }
        let i;
        for (i = 1; i < segments.length - 1; i++) {
            if (segments[i].steps.length < 2) {
                return false;
            }
        }
        return segments[i].steps.length != 0;
    }

    /**
     * Fais une copie profonde des segments
     * @param segments segments à copier
     * @private
     */
    private segmentsDeepCopy(segments: Segment[]): Segment[] {
        const copy: Segment[] = [...segments];
        for (let i = 0; i < segments.length - 1; i++) {
            copy[i].steps = [...segments[i].steps];
        }
        return copy;
    }

    /**
     * Transforme le tableau de segments en segments expédiable au backend
     * @param segments Segments à transformer
     * @private
     */
    private buildNetSegments(segments: Segment[]): SegmentRequest[] | null {
        if (!this.checkSegmentsValidity(segments))
            return null;
        const copy: Segment[] = this.segmentsDeepCopy(segments);
        if (!copy) return null;
        // On retire le départ et l'arrivée qui ne sont qu'esthétique
        copy.splice(0, 1);
        copy.pop();
        return copy.map((seg: Segment) => ({
            name: seg.content.title.length > 1 ? seg.content.title : "No Name",
            waypoints: this.buildNetWaypoints(seg.steps),
            breakDuration: seg.content.breakDuration ?? 0,
        }))
    }

    /**
     * Construit l'objet net à envoyer
     * @private
     */
    private buildNetObject(): ItineraryRequest | null {
        const itinerary: Itinerary = this.store.getSnapshot();
        const netSegments: SegmentRequest[] | null = this.buildNetSegments(itinerary.segments);
        if (!netSegments)
            return null;

        const startSeg = itinerary.segments[0];
        const startHour = startSeg?.content.hour;
        const departureTime =
            startHour !== undefined && !Number.isNaN(startHour.getTime())
                ? startHour.toISOString()
                : undefined;

        return {
            name: itinerary.name.length > 1 ? itinerary.name : "No Name",
            segments: netSegments,
            ...(departureTime !== undefined ? {departureTime} : {}),
            draft: itinerary.draft,
        }
    }
}
