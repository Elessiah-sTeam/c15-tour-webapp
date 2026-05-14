import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TimeSpan } from '../TimeSpan';
import type { Itinerary, ItineraryStore, Segment, Step } from './types';

vi.mock('../../auth/useAuth', () => ({
  getAuthToken: vi.fn(() => null),
}));

import { getAuthToken } from '../../auth/useAuth';
import { ItineraryNetModel } from './ItineraryNetModel';

function makeStep(id: string, title = id, lat = 47.2, lon = -1.55): Step {
  return {
    id,
    content: {
      title,
      duration: new TimeSpan(),
      location: { lat, lon },
    },
    isDefaultSegStart: false,
  };
}

/** Structure [start, segment réel, end] acceptée par `checkSegmentsValidity` + `buildNetSegments`. */
function makeValidItinerary(overrides: Partial<Itinerary> = {}): Itinerary {
  const departure = new Date('2024-06-01T08:00:00.000Z');
  const segments: Segment[] = [
    {
      id: 'start',
      isStartEnd: true,
      steps: [makeStep('start-w', 'Départ')],
      content: {
        title: ' ',
        hour: departure,
        duration: new TimeSpan(0),
        distance: 0,
      },
    },
    {
      id: 'seg-1',
      isStartEnd: false,
      steps: [makeStep('w1', 'Étape A'), makeStep('w2', 'Étape B')],
      content: {
        title: 'Segment principal',
        hour: new Date(departure.getTime()),
        duration: new TimeSpan(3600_000),
        distance: 10_000,
        breakDuration: 600,
      },
    },
    {
      id: 'end',
      isStartEnd: true,
      steps: [makeStep('end-w', 'Arrivée')],
      content: {
        title: ' ',
        hour: new Date(departure.getTime()),
        duration: new TimeSpan(0),
        distance: 0,
      },
    },
  ];
  return {
    id: 42,
    name: 'Convoi test',
    shareCode: 'SHARE1',
    totalDuration: new TimeSpan(3600_000),
    totalDistance: 10,
    segments,
    ...overrides,
  };
}

function createStore(initial: Itinerary): ItineraryStore {
  let snap = initial;
  return {
    getSnapshot: () => snap,
    set(updater: (prev: Itinerary) => Itinerary) {
      snap = updater(snap);
    },
    subscribe: () => () => {},
  };
}

const lineFeatureJson = JSON.stringify({
  type: 'Feature',
  properties: {},
  geometry: { type: 'LineString', coordinates: [[-1.5, 47.2], [-1.51, 47.21]] },
});

describe('ItineraryNetModel', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.mocked(getAuthToken).mockReset();
    vi.mocked(getAuthToken).mockReturnValue(null);
  });

  describe('get()', () => {
    it('applique un TourResponse minimal (id, name) au store', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ id: 7, name: 'Tour API' }),
      } as Response);

      const initial = makeValidItinerary({ id: -1, name: 'Local' });
      const store = createStore(initial);
      const net = new ItineraryNetModel(store, false);

      await net.get(7);

      const snap = store.getSnapshot();
      expect(snap.id).toBe(7);
      expect(snap.name).toBe('Tour API');
      expect(snap.shareCode).toBe('');
      expect(snap.totalDistance).toBe(0);
      expect(snap.segments.length).toBeGreaterThanOrEqual(2);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8080/tours/7',
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('mappe segments, waypoints, breakDuration et estimatedArrival', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 1,
          name: 'Roadtrip',
          shareCode: 'C15ROC',
          totalDistance: 5000,
          totalDuration: 120,
          segments: [
            {
              name: 'Seg 1',
              distance: 5000,
              duration: 120,
              geometry: lineFeatureJson,
              breakDuration: 90,
              estimatedDeparture: '2024-06-01T12:00:00.000Z',
              waypoints: [
                {
                  name: 'WP1',
                  coordinates: { latitude: 47.1, longitude: -1.5 },
                  estimatedArrival: '2024-06-01T10:00:00.000Z',
                },
                {
                  name: 'WP2',
                  coordinates: { latitude: 47.2, longitude: -1.52 },
                },
              ],
            },
          ],
        }),
      } as Response);

      const store = createStore(makeValidItinerary({ id: -1 }));
      const net = new ItineraryNetModel(store, false);
      await net.get(1);

      const snap = store.getSnapshot();
      const realSeg = snap.segments.find(s => s.id !== 'start' && s.id !== 'end' && !s.isStartEnd);
      expect(realSeg).toBeDefined();
      expect(realSeg!.content.title).toBe('Seg 1');
      expect(realSeg!.content.breakDuration).toBe(90);
      expect(realSeg!.content.distance).toBe(5000);
      const withEta = realSeg!.steps.find(s => s.content.title === 'WP1');
      expect(withEta?.content.estimatedArrival?.toISOString()).toBe('2024-06-01T10:00:00.000Z');
    });

    it('accepte une géométrie JSON null (pas de tracé OSRM)', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 2,
          name: 'Sans geo',
          segments: [
            {
              name: 'S',
              distance: 0,
              duration: 0,
              geometry: 'null',
              waypoints: [
                { name: 'A', coordinates: { latitude: 0, longitude: 0 } },
                { name: 'B', coordinates: { latitude: 1, longitude: 1 } },
              ],
            },
          ],
        }),
      } as Response);

      const store = createStore(makeValidItinerary({ id: -1 }));
      const net = new ItineraryNetModel(store, false);
      await net.get(2);

      const realSeg = store.getSnapshot().segments.find(s => s.id !== 'start' && s.id !== 'end' && !s.isStartEnd);
      expect(realSeg!.content.geometry).toBeUndefined();
    });
  });

  describe('post()', () => {
    it('omet departureTime dans le corps si l’heure de départ locale est invalide', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({ id: 8, name: 'X', segments: [] }),
      } as Response);

      const badHour = makeValidItinerary({ id: -1 });
      badHour.segments[0] = {
        ...badHour.segments[0],
        content: { ...badHour.segments[0].content, hour: new Date(Number.NaN) },
      };
      const store = createStore(badHour);
      const net = new ItineraryNetModel(store, false);
      await net.post();

      const [, init] = vi.mocked(fetch).mock.calls[0];
      const body = JSON.parse((init as RequestInit).body as string);
      expect(body.departureTime).toBeUndefined();
    });

    it('envoie TourCreateRequest (POST /tours) et applique la réponse 201', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({
          id: 99,
          name: 'Convoi test',
          shareCode: 'NEW',
          totalDuration: 3600,
          totalDistance: 1000,
          segments: [],
        }),
      } as Response);

      const store = createStore(makeValidItinerary({ id: -1 }));
      const net = new ItineraryNetModel(store, false);
      const ok = await net.post();

      expect(ok).toBe(true);
      expect(store.getSnapshot().id).toBe(99);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8080/tours',
        expect.objectContaining({ method: 'POST' }),
      );
      const [, init] = vi.mocked(fetch).mock.calls[0];
      const body = JSON.parse((init as RequestInit).body as string);
      expect(body.name).toBe('Convoi test');
      expect(body.segments).toHaveLength(1);
      expect(body.segments[0].waypoints).toHaveLength(2);
      expect(body.segments[0].breakDuration).toBe(600);
      expect(body.departureTime).toBe('2024-06-01T08:00:00.000Z');
    });

    it('renvoie false si la réponse HTTP est en erreur', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({}),
      } as Response);

      const store = createStore(makeValidItinerary({ id: -1 }));
      const net = new ItineraryNetModel(store, false);
      expect(await net.post()).toBe(false);
    });

    it('renvoie false si l’ID du tour est absent dans la réponse', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ name: 'Sans id' }),
      } as Response);

      const store = createStore(makeValidItinerary({ id: -1 }));
      const net = new ItineraryNetModel(store, false);
      expect(await net.post()).toBe(false);
    });

    it('renvoie false si buildNetObject est impossible (itinéraire incomplet)', async () => {
      const invalid: Itinerary = {
        id: -1,
        name: 'X',
        shareCode: '',
        totalDuration: new TimeSpan(),
        totalDistance: 0,
        segments: [],
      };
      const store = createStore(invalid);
      const net = new ItineraryNetModel(store, false);
      expect(await net.post()).toBe(false);
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe('put()', () => {
    it('redirige vers post() si id === -1', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({
          id: 5,
          name: 'Convoi test',
          segments: [],
        }),
      } as Response);

      const store = createStore(makeValidItinerary({ id: -1 }));
      const net = new ItineraryNetModel(store, false);
      await net.put();

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8080/tours',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('envoie PUT /tours/:id avec le corps JSON', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 42,
          name: 'Convoi test',
          shareCode: 'SHARE1',
          totalDuration: 3600,
          totalDistance: 10000,
          segments: [],
        }),
      } as Response);

      const store = createStore(makeValidItinerary());
      const net = new ItineraryNetModel(store, false);
      const ok = await net.put();

      expect(ok).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8080/tours/42',
        expect.objectContaining({ method: 'PUT' }),
      );
    });

    it('renvoie false si le serveur répond une erreur', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Error',
        json: async () => ({}),
      } as Response);

      const store = createStore(makeValidItinerary());
      const net = new ItineraryNetModel(store, false);
      expect(await net.put()).toBe(false);
    });
  });

  describe('constructor post flag', () => {
    it('lance post() au chargement du module quand post === true', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({
          id: 3,
          name: 'Convoi test',
          segments: [],
        }),
      } as Response);

      const store = createStore(makeValidItinerary({ id: -1 }));
      new ItineraryNetModel(store, true);
      await vi.waitFor(() => expect(store.getSnapshot().id).toBe(3));
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8080/tours',
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  describe('patchEstimatedDeparture()', () => {
    it('envoie PatchDepartureTimeRequest et applique la réponse', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 42,
          name: 'Convoi test',
          segments: [],
        }),
      } as Response);

      const store = createStore(makeValidItinerary());
      const net = new ItineraryNetModel(store, false);
      const d = new Date('2025-01-15T14:30:00.000Z');
      const ok = await net.patchEstimatedDeparture(d);

      expect(ok).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8080/tours/42',
        expect.objectContaining({ method: 'PATCH' }),
      );
      const [, init] = vi.mocked(fetch).mock.calls[0];
      expect(JSON.parse((init as RequestInit).body as string)).toEqual({
        departureTime: d.toISOString(),
      });
    });

    it('ne fait pas de requête si id === -1', async () => {
      const store = createStore(makeValidItinerary({ id: -1 }));
      const net = new ItineraryNetModel(store, false);
      expect(await net.patchEstimatedDeparture(new Date())).toBe(false);
      expect(fetch).not.toHaveBeenCalled();
    });

    it('ne fait pas de requête si la date est invalide', async () => {
      const store = createStore(makeValidItinerary());
      const net = new ItineraryNetModel(store, false);
      expect(await net.patchEstimatedDeparture(new Date(Number.NaN))).toBe(false);
      expect(fetch).not.toHaveBeenCalled();
    });

    it('renvoie false si fetch lève (réseau)', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('network down'));
      const store = createStore(makeValidItinerary());
      const net = new ItineraryNetModel(store, false);
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(await net.patchEstimatedDeparture(new Date('2024-01-01T00:00:00Z'))).toBe(false);
      errSpy.mockRestore();
    });

    it('renvoie false si le PATCH HTTP échoue', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({}),
      } as Response);
      const store = createStore(makeValidItinerary());
      const net = new ItineraryNetModel(store, false);
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(await net.patchEstimatedDeparture(new Date('2024-01-01T00:00:00Z'))).toBe(false);
      errSpy.mockRestore();
    });
  });

  describe('setupSave / drag', () => {
    it('setupSave appelle put hors drag', async () => {
      const putSpy = vi.spyOn(ItineraryNetModel.prototype, 'put').mockResolvedValue(true);
      const store = createStore(makeValidItinerary());
      const net = new ItineraryNetModel(store, false);
      net.setupSave();
      await vi.waitFor(() => expect(putSpy).toHaveBeenCalled());
      putSpy.mockRestore();
    });

    it('setupSave n’appelle pas put pendant un drag', async () => {
      const putSpy = vi.spyOn(ItineraryNetModel.prototype, 'put').mockResolvedValue(true);
      const store = createStore(makeValidItinerary());
      const net = new ItineraryNetModel(store, false);
      net.startDrag();
      net.setupSave();
      expect(putSpy).not.toHaveBeenCalled();
      putSpy.mockRestore();
    });

    it('endDrag relance put une fois le drag terminé', async () => {
      const putSpy = vi.spyOn(ItineraryNetModel.prototype, 'put').mockResolvedValue(true);
      const store = createStore(makeValidItinerary());
      const net = new ItineraryNetModel(store, false);
      net.startDrag();
      net.endDrag();
      expect(putSpy).toHaveBeenCalledTimes(1);
      putSpy.mockRestore();
    });

    it('endDrag sans startDrag préalable ne déclenche pas put', async () => {
      const putSpy = vi.spyOn(ItineraryNetModel.prototype, 'put').mockResolvedValue(true);
      const store = createStore(makeValidItinerary());
      const net = new ItineraryNetModel(store, false);
      net.endDrag();
      expect(putSpy).not.toHaveBeenCalled();
      putSpy.mockRestore();
    });
  });

  describe('authHeaders', () => {
    it('ajoute Authorization quand un jeton est présent', async () => {
      vi.mocked(getAuthToken).mockReturnValue('jwt-secret');
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ id: 1, name: 'T', segments: [] }),
      } as Response);

      const store = createStore(makeValidItinerary({ id: 1 }));
      const net = new ItineraryNetModel(store, false);
      await net.get(1);

      const [, init] = vi.mocked(fetch).mock.calls[0];
      const headers = (init as RequestInit).headers as Record<string, string>;
      expect(headers.Authorization).toBe('Bearer jwt-secret');
    });
  });
});
