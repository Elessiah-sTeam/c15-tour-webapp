import { describe, it, expect, vi } from 'vitest';
import ItineraryModel from './ItineraryModel';
import { TimeSpan } from '../TimeSpan';
import type { Itinerary, Segment, Step } from './types';

// Mock ItineraryStore pour casser la dépendance circulaire
// (ItineraryStore.ts crée une instance d'ItineraryModel au niveau module)
vi.mock('./ItineraryStore', () => {
  function createItineraryStore(initial?: Itinerary) {
    let itinerary: Itinerary = initial ?? ({
      id: -1,
      name: 'Nouveau Convoi',
      totalDuration: { _duration: 0 },
      totalDistance: 0,
      segments: [],
    } as unknown as Itinerary);
    const listeners = new Set<() => void>();
    return {
      getSnapshot: () => itinerary,
      subscribe: (l: () => void) => {
        listeners.add(l);
        return () => listeners.delete(l);
      },
      set(updater: (prev: Itinerary) => Itinerary) {
        itinerary = updater(itinerary);
        listeners.forEach(l => l());
      },
    };
  }
  return { createItineraryStore };
});

// Mock ItineraryNetModel pour éviter les appels réseau
vi.mock('./ItineraryNetModel', () => ({
  ItineraryNetModel: class MockItineraryNetModel {
    timeoutID = -1;
    store = null;
    setupSave() {}
    async put() { return true; }
    async post() { return true; }
    async get() { return undefined; }
  },
}));

// Mock getAuthToken
vi.mock('../../auth/useAuth', () => ({
  getAuthToken: vi.fn(() => null),
}));

// Import createItineraryStore après les mocks pour les tests qui en ont besoin
import { createItineraryStore } from './ItineraryStore';

// Helpers
function makeStep(id: string, title = id, hasLocation = false): Step {
  return {
    id,
    content: {
      title,
      duration: new TimeSpan(),
      ...(hasLocation ? { location: { lat: 1, lon: 2 } } : {}),
    },
    isDefaultSegStart: false,
  };
}

function makeSegment(id: string, steps: Step[] = [], durationMs = 0): Segment {
  return {
    id,
    content: {
      title: id,
      hour: new Date('2024-01-01T08:00:00Z'),
      duration: new TimeSpan(durationMs),
      distance: 0,
    },
    isStartEnd: false,
    steps,
  };
}

function createModel(initial?: Partial<Itinerary>): ItineraryModel {
  const base: Itinerary = {
    id: -1,
    name: 'Test',
    totalDuration: new TimeSpan(),
    totalDistance: 0,
    segments: [],
    ...initial,
  };
  return new ItineraryModel({ initial: base });
}

describe('ItineraryModel', () => {
  describe('constructor', () => {
    it('se construit sans arguments et crée start/end', () => {
      const model = new ItineraryModel({});
      const route = model.route;
      expect(route.segments.some(s => s.id === 'start')).toBe(true);
      expect(route.segments.some(s => s.id === 'end')).toBe(true);
    });

    it('se construit avec un store existant', () => {
      const store = createItineraryStore();
      const model = new ItineraryModel({ _store: store });
      expect(model.store).toBe(store);
    });

    it('se construit avec un itinéraire initial', () => {
      const model = createModel({ name: 'Mon tour' });
      expect(model.route.name).toBe('Mon tour');
    });

    it('formatItinerary() ajoute start et end si absents', () => {
      const model = createModel();
      const segs = model.route.segments;
      expect(segs[0].id).toBe('start');
      expect(segs[segs.length - 1].id).toBe('end');
    });

    it('formatItinerary() déplace start en première position si mal placé', () => {
      const model = new ItineraryModel({
        initial: {
          id: -1,
          name: 'X',
          totalDuration: new TimeSpan(),
          totalDistance: 0,
          segments: [
            makeSegment('mid'),
            makeSegment('start'),
            makeSegment('end'),
          ],
        },
      });
      expect(model.route.segments[0].id).toBe('start');
    });

    it('formatItinerary() déplace end en dernière position si mal placé', () => {
      const model = new ItineraryModel({
        initial: {
          id: -1,
          name: 'X',
          totalDuration: new TimeSpan(),
          totalDistance: 0,
          segments: [
            makeSegment('start'),
            makeSegment('end'),
            makeSegment('mid'),
          ],
        },
      });
      const segs = model.route.segments;
      expect(segs[segs.length - 1].id).toBe('end');
    });
  });

  describe('reset()', () => {
    it('réinitialise l\'itinéraire avec start et end', () => {
      const model = createModel({ name: 'Ancien' });
      model.reset();
      expect(model.route.name).toBe('Nouveau Convoi');
      expect(model.route.segments.some(s => s.id === 'start')).toBe(true);
      expect(model.route.segments.some(s => s.id === 'end')).toBe(true);
    });
  });

  describe('renameItinerary()', () => {
    it('renomme l\'itinéraire', () => {
      const model = createModel({ name: 'Ancien nom' });
      model.renameItinerary('Nouveau nom');
      expect(model.route.name).toBe('Nouveau nom');
    });
  });

  describe('setDepartureDateTime()', () => {
    it('met à jour l\'heure du premier segment', () => {
      const model = createModel();
      const newDate = new Date('2024-06-01T10:00:00Z');
      model.setDepartureDateTime(newDate);
      expect(model.route.segments[0].content.hour.getTime()).toBe(newDate.getTime());
    });

    it('ignore une date invalide (NaN)', () => {
      const model = createModel();
      const before = model.route.segments[0].content.hour.getTime();
      model.setDepartureDateTime(new Date('invalid'));
      expect(model.route.segments[0].content.hour.getTime()).toBe(before);
    });
  });

  describe('getSegment()', () => {
    it('renvoie le segment correspondant à l\'ID', () => {
      const model = createModel();
      const found = model.getSegment('start');
      expect(found).toBeDefined();
      expect(found?.id).toBe('start');
    });

    it('renvoie undefined si l\'ID n\'existe pas', () => {
      const model = createModel();
      expect(model.getSegment('inexistant')).toBeUndefined();
    });
  });

  describe('addSegment()', () => {
    it('ajoute un segment avant le segment end', () => {
      const model = createModel();
      const seg = makeSegment('seg-test');
      model.addSegment(seg);
      const segs = model.route.segments;
      const endIdx = segs.findIndex(s => s.id === 'end');
      const testIdx = segs.findIndex(s => s.id === 'seg-test');
      expect(testIdx).toBeGreaterThan(-1);
      expect(testIdx).toBeLessThan(endIdx);
    });
  });

  describe('removeSegment()', () => {
    it('supprime un segment par son ID', () => {
      const model = createModel();
      model.addSegment(makeSegment('seg-a'));
      model.removeSegment('seg-a');
      expect(model.route.segments.find(s => s.id === 'seg-a')).toBeUndefined();
    });

    it('ne fait rien si l\'ID n\'existe pas', () => {
      const model = createModel();
      const before = model.route.segments.length;
      model.removeSegment('ghost');
      expect(model.route.segments.length).toBe(before);
    });
  });

  describe('renameSegment()', () => {
    it('renomme un segment par son ID', () => {
      const model = createModel();
      model.addSegment(makeSegment('seg-a'));
      model.renameSegment('seg-a', 'Renommé');
      const seg = model.route.segments.find(s => s.id === 'seg-a');
      expect(seg?.content.title).toBe('Renommé');
    });
  });

  describe('updateSegmentInfo()', () => {
    it('met à jour le contenu d\'un segment', () => {
      const model = createModel();
      model.addSegment(makeSegment('seg-a'));
      model.updateSegmentInfo('seg-a', {
        title: 'Updated',
        hour: new Date(),
        duration: new TimeSpan(1000),
        distance: 5,
      });
      const seg = model.route.segments.find(s => s.id === 'seg-a');
      expect(seg?.content.title).toBe('Updated');
      expect(seg?.content.distance).toBe(5);
    });
  });

  describe('reorderSegment()', () => {
    it('déplace un segment à un nouvel index', () => {
      const model = createModel();
      model.addSegment(makeSegment('seg-a'));
      model.addSegment(makeSegment('seg-b'));
      // [start, seg-a, seg-b, end]
      const beforeIdx = model.route.segments.findIndex(s => s.id === 'seg-a');
      model.reorderSegment('seg-b', beforeIdx);
      // seg-b devrait maintenant être à la position de seg-a
      expect(model.route.segments[beforeIdx].id).toBe('seg-b');
    });

    it('ne modifie pas si l\'ID n\'existe pas', () => {
      const model = createModel();
      const before = [...model.route.segments.map(s => s.id)];
      model.reorderSegment('ghost', 0);
      expect(model.route.segments.map(s => s.id)).toEqual(before);
    });
  });

  describe('getStep()', () => {
    it('renvoie une étape par segmentId et stepId', () => {
      const step = makeStep('step-1');
      const model = createModel();
      model.addSegment(makeSegment('seg-a', [step]));
      const found = model.getStep('seg-a', 'step-1');
      expect(found?.id).toBe('step-1');
    });

    it('renvoie undefined si segment non trouvé', () => {
      const model = createModel();
      expect(model.getStep('ghost', 'step-1')).toBeUndefined();
    });

    it('renvoie undefined si step non trouvée dans le segment', () => {
      const model = createModel();
      model.addSegment(makeSegment('seg-a', [makeStep('s1')]));
      expect(model.getStep('seg-a', 'ghost')).toBeUndefined();
    });
  });

  describe('addStep()', () => {
    it('ajoute une étape dans le segment spécifié', () => {
      const model = createModel();
      model.addSegment(makeSegment('seg-a'));
      model.addStep('seg-a', makeStep('new-step'));
      const seg = model.route.segments.find(s => s.id === 'seg-a');
      expect(seg?.steps.some(s => s.id === 'new-step')).toBe(true);
    });

    it('insère l\'étape à l\'index spécifié', () => {
      const model = createModel();
      model.addSegment(makeSegment('seg-a', [makeStep('s1'), makeStep('s2')]));
      model.addStep('seg-a', makeStep('inserted'), 1);
      const seg = model.route.segments.find(s => s.id === 'seg-a');
      const steps = seg?.steps.filter(s => !s.isDefaultSegStart);
      expect(steps?.[1].id).toBe('inserted');
    });
  });

  describe('removeStep()', () => {
    it('supprime une étape d\'un segment', () => {
      const model = createModel();
      model.addSegment(makeSegment('seg-a', [makeStep('s1'), makeStep('s2')]));
      model.removeStep('seg-a', 's1');
      const seg = model.route.segments.find(s => s.id === 'seg-a');
      expect(seg?.steps.find(s => s.id === 's1')).toBeUndefined();
      expect(seg?.steps.some(s => s.id === 's2')).toBe(true);
    });
  });

  describe('renameStep()', () => {
    it('renomme une étape', () => {
      const model = createModel();
      model.addSegment(makeSegment('seg-a', [makeStep('s1')]));
      model.renameStep('seg-a', 's1', 'Nouveau titre');
      const step = model.getStep('seg-a', 's1');
      expect(step?.content.title).toBe('Nouveau titre');
    });
  });

  describe('setStepLocation()', () => {
    it('met à jour la localisation d\'une étape', () => {
      const model = createModel();
      model.addSegment(makeSegment('seg-a', [makeStep('s1')]));
      model.setStepLocation('seg-a', 's1', { lat: 48.8566, lon: 2.3522 });
      const step = model.getStep('seg-a', 's1');
      expect(step?.content.location?.lat).toBe(48.8566);
      expect(step?.content.location?.lon).toBe(2.3522);
    });
  });

  describe('reorderStep()', () => {
    it('déplace une étape dans le même segment', () => {
      const model = createModel();
      model.addSegment(makeSegment('seg-a', [makeStep('s1'), makeStep('s2'), makeStep('s3')]));
      // Récupère index réels (après updateStarts peut-être)
      const seg = model.route.segments.find(s => s.id === 'seg-a')!;
      const s3Idx = seg.steps.findIndex(s => s.id === 's3');
      model.reorderStep('seg-a', s3Idx, 'seg-a', 0);
      const updated = model.route.segments.find(s => s.id === 'seg-a')!;
      const nonAuto = updated.steps.filter(s => !s.isDefaultSegStart);
      expect(nonAuto[0].id).toBe('s3');
    });

    it('déplace une étape vers un autre segment', () => {
      const model = createModel();
      model.addSegment(makeSegment('seg-a', [makeStep('s1'), makeStep('s2')]));
      model.addSegment(makeSegment('seg-b', [makeStep('s3'), makeStep('s4')]));
      const segA = model.route.segments.find(s => s.id === 'seg-a')!;
      const s2Idx = segA.steps.findIndex(s => s.id === 's2');
      model.reorderStep('seg-a', s2Idx, 'seg-b', 0);
      const updatedB = model.route.segments.find(s => s.id === 'seg-b')!;
      expect(updatedB.steps.some(s => s.id === 's2')).toBe(true);
    });

    it('ne fait rien si le segment source n\'existe pas', () => {
      const model = createModel();
      const before = model.route.segments.length;
      model.reorderStep('ghost', 0, 'end', 0);
      expect(model.route.segments.length).toBe(before);
    });

    it('ne fait rien si fromStepIndex est hors limites', () => {
      const model = createModel();
      model.addSegment(makeSegment('seg-a', [makeStep('s1')]));
      const before = JSON.stringify(model.route.segments);
      model.reorderStep('seg-a', 99, 'seg-a', 0);
      expect(JSON.stringify(model.route.segments)).toBe(before);
    });
  });

  describe('route getter', () => {
    it('renvoie le snapshot courant du store', () => {
      const model = createModel({ name: 'Test' });
      expect(model.route).toBe(model.store.getSnapshot());
    });
  });
});
