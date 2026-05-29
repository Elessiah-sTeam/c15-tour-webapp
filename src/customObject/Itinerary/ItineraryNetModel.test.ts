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

/** Structure [start, segment rÃ©el, end] acceptÃ©e par `checkSegmentsValidity` + `buildNetSegments`. */
function makeValidItinerary(overrides: Partial<Itinerary> = {}): Itinerary {
  const departure = new Date('2024-06-01T08:00:00.000Z');
  const segments: Segment[] = [
    {
      id: 'start',
      isStartEnd: true,
      steps: [makeStep('start-w', 'DÃ©part')],
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
      steps: [makeStep('w1', 'Ã‰tape A'), makeStep('w2', 'Ã‰tape B')],
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
      steps: [makeStep('end-w', 'ArrivÃ©e')],
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
    draft: overrides.draft ?? true,
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
      vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({
          id: 1,
          name: 'Roadtrip',
          shareCode: 'C15ROC',
          departureTime: '2024-06-01T10:00:00.000Z',
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
                  estimatedArrival: '2024-06-01T10:12:00.000Z',
                },
              ],
            },
          ],
        })));

      const store = createStore(makeValidItinerary({ id: -1 }));
      const net = new ItineraryNetModel(store, false);
      await net.get(1);

      const snap = store.getSnapshot();
      const realSeg = snap.segments.find(s => s.id !== 'start' && s.id !== 'end' && !s.isStartEnd);
      expect(realSeg).toBeDefined();
      expect(realSeg!.content.title).toBe('Seg 1');
      expect(realSeg!.content.hour.toISOString()).toBe('2024-06-01T10:00:00.000Z');
      expect(realSeg!.content.breakDuration).toBe(90);
      expect(realSeg!.content.distance).toBe(5);
      const withEta = realSeg!.steps.find(s => s.content.title === 'WP1');
      expect(withEta?.content.estimatedArrival?.toISOString()).toBe('2024-06-01T10:01:30.000Z');
      expect(withEta?.content.duration.duration).toBe(0);
      const secondStep = realSeg!.steps.find(s => s.content.title === 'WP2');
      expect(secondStep?.content.duration.duration).toBe(12 * 60 * 1000);
    });

    it('conserve la durÃ©e de trajet du premier point visible des segments suivants', async () => {
      vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({
          id: 2,
          name: 'Roadtrip',
          segments: [
            {
              name: 'Seg 1',
              distance: 5000,
              duration: 120,
              geometry: lineFeatureJson,
              estimatedDeparture: '2024-06-01T10:12:00.000Z',
              waypoints: [
                {
                  name: 'DÃ©part',
                  coordinates: { latitude: 47.1, longitude: -1.5 },
                  estimatedArrival: '2024-06-01T10:00:00.000Z',
                },
                {
                  name: 'Point 1',
                  coordinates: { latitude: 47.2, longitude: -1.52 },
                  estimatedArrival: '2024-06-01T10:12:00.000Z',
                },
              ],
            },
            {
              name: 'Seg 2',
              distance: 3000,
              duration: 900,
              geometry: lineFeatureJson,
              estimatedDeparture: '2024-06-01T10:27:00.000Z',
              waypoints: [
                {
                  name: 'Point 1',
                  coordinates: { latitude: 47.2, longitude: -1.52 },
                  estimatedArrival: '2024-06-01T10:12:00.000Z',
                },
                {
                  name: 'Point 2',
                  coordinates: { latitude: 47.25, longitude: -1.55 },
                  estimatedArrival: '2024-06-01T10:27:00.000Z',
                },
              ],
            },
          ],
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }));

      const store = createStore(makeValidItinerary({ id: -1 }));
      const net = new ItineraryNetModel(store, false);
      await net.get(2);

      const realSegments = store.getSnapshot().segments.filter(s => !s.isStartEnd);
      expect(realSegments).toHaveLength(2);
      expect(realSegments[1].steps).toHaveLength(2);
      expect(realSegments[1].steps[0].isDefaultSegStart).toBe(true);
      expect(realSegments[1].steps[0].content.duration.duration).toBe(0);
      expect(realSegments[1].steps[1].content.title).toBe('Point 2');
      expect(realSegments[1].steps[1].content.duration.duration).toBe(15 * 60 * 1000);
    });

    it('accepte une gÃ©omÃ©trie JSON null (pas de tracÃ© OSRM)', async () => {
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
    it('omet departureTime dans le corps si lâ€™heure de dÃ©part locale est invalide', async () => {
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

    it('envoie TourCreateRequest (POST /tours) et applique la rÃ©ponse 201', async () => {
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

    it('renvoie false si la rÃ©ponse HTTP est en erreur', async () => {
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

    it('renvoie false si lâ€™ID du tour est absent dans la rÃ©ponse', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ name: 'Sans id' }),
      } as Response);

      const store = createStore(makeValidItinerary({ id: -1 }));
      const net = new ItineraryNetModel(store, false);
      expect(await net.post()).toBe(false);
    });

    it('renvoie false si buildNetObject est impossible (itinÃ©raire incomplet)', async () => {
      const invalid: Itinerary = {
        id: -1,
        name: 'X',
        shareCode: '',
        totalDuration: new TimeSpan(),
        totalDistance: 0,
        segments: [],
        draft: true,
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

    it('renvoie false si le serveur rÃ©pond une erreur', async () => {
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
    it('envoie PatchDepartureTimeRequest et applique la rÃ©ponse', async () => {
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

    it('ne fait pas de requÃªte si id === -1', async () => {
      const store = createStore(makeValidItinerary({ id: -1 }));
      const net = new ItineraryNetModel(store, false);
      expect(await net.patchEstimatedDeparture(new Date())).toBe(false);
      expect(fetch).not.toHaveBeenCalled();
    });

    it('ne fait pas de requÃªte si la date est invalide', async () => {
      const store = createStore(makeValidItinerary());
      const net = new ItineraryNetModel(store, false);
      expect(await net.patchEstimatedDeparture(new Date(Number.NaN))).toBe(false);
      expect(fetch).not.toHaveBeenCalled();
    });

    it('renvoie false si fetch lÃ¨ve (rÃ©seau)', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('network down'));
      const store = createStore(makeValidItinerary());
      const net = new ItineraryNetModel(store, false);
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(await net.patchEstimatedDeparture(new Date('2024-01-01T00:00:00Z'))).toBe(false);
      errSpy.mockRestore();
    });

    it('renvoie false si le PATCH HTTP Ã©choue', async () => {
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

    it('setupSave nâ€™appelle pas put pendant un drag', async () => {
      const putSpy = vi.spyOn(ItineraryNetModel.prototype, 'put').mockResolvedValue(true);
      const store = createStore(makeValidItinerary());
      const net = new ItineraryNetModel(store, false);
      net.startDrag();
      net.setupSave();
      expect(putSpy).not.toHaveBeenCalled();
      putSpy.mockRestore();
    });

    it('endDrag relance put une fois le drag terminÃ©', async () => {
      const putSpy = vi.spyOn(ItineraryNetModel.prototype, 'put').mockResolvedValue(true);
      const store = createStore(makeValidItinerary());
      const net = new ItineraryNetModel(store, false);
      net.startDrag();
      net.endDrag();
      expect(putSpy).toHaveBeenCalledTimes(1);
      putSpy.mockRestore();
    });

    it('endDrag sans startDrag prÃ©alable ne dÃ©clenche pas put', async () => {
      const putSpy = vi.spyOn(ItineraryNetModel.prototype, 'put').mockResolvedValue(true);
      const store = createStore(makeValidItinerary());
      const net = new ItineraryNetModel(store, false);
      net.endDrag();
      expect(putSpy).not.toHaveBeenCalled();
      putSpy.mockRestore();
    });
  });

  describe('drag sans changement', () => {
    it('endDrag sans changement ne déclenche pas put', async () => {
      const putSpy = vi.spyOn(ItineraryNetModel.prototype, 'put').mockResolvedValue(true);
      const store = createStore(makeValidItinerary());
      const net = new ItineraryNetModel(store, false);
      net.startDrag();
      net.endDrag(false);
      expect(putSpy).not.toHaveBeenCalled();
      putSpy.mockRestore();
    });
  });

  describe('authHeaders', () => {
    it('ajoute Authorization quand un jeton est prÃ©sent', async () => {
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

