import { describe, it, expect, vi } from 'vitest';

// Casser la dépendance circulaire avant toute importation de DragNDropUtils
vi.mock('../../../customObject/Itinerary/ItineraryStore', () => ({
  createItineraryStore: vi.fn(() => ({
    getSnapshot: vi.fn(),
    subscribe: vi.fn(() => vi.fn()),
    set: vi.fn(),
  })),
}));
vi.mock('../../../customObject/Itinerary/ItineraryNetModel', () => ({
  ItineraryNetModel: class MockItineraryNetModel {
    timeoutID = -1;
    store = null;
    setupSave() {}
    async put() { return true; }
    async post() { return true; }
    async get() { return undefined; }
  },
}));
vi.mock('../../../auth/useAuth', () => ({
  getAuthToken: vi.fn(() => null),
}));

import { getActiveItem, getActiveCat, reorderSegment, reorderItems } from './DragNDropUtils';
import { TimeSpan } from '../../../customObject/TimeSpan';
import type ItineraryModel from '../../../customObject/Itinerary/ItineraryModel';
import type { Segment, Step, Itinerary } from '../../../customObject/Itinerary/types';
import type { Active, Over } from '@dnd-kit/core';

// Helpers
function makeStep(id: string, isDefaultSegStart = false): Step {
  return {
    id,
    content: { title: id, duration: new TimeSpan() },
    isDefaultSegStart,
  };
}

function makeSegment(id: string, steps: Step[] = [], isStartEnd = false): Segment {
  return {
    id,
    content: {
      title: id,
      hour: new Date(),
      duration: new TimeSpan(),
      distance: 0,
    },
    isStartEnd,
    steps,
  };
}

function makeActive(id: string, categoryId?: string): Active {
  return {
    id,
    data: { current: categoryId ? { categoryId } : undefined },
  } as unknown as Active;
}

function makeOver(id: string, categoryId?: string): Over {
  return {
    id,
    data: { current: categoryId ? { categoryId } : undefined },
  } as unknown as Over;
}

function makeItinerary(segments: Segment[]): Itinerary {
  return {
    id: 1,
    name: 'Test',
    shareCode: '',
    totalDuration: new TimeSpan(),
    totalDistance: 0,
    segments,
    draft: true,
  };
}

describe('getActiveItem()', () => {
  it('renvoie l\'étape correspondante', () => {
    const step = makeStep('step-1');
    const seg = makeSegment('seg-1', [step]);
    const active = makeActive('step-1', 'seg-1');
    const result = getActiveItem(active, [seg]);
    expect(result?.id).toBe('step-1');
  });

  it('renvoie undefined si categoryId absent', () => {
    const active = makeActive('step-1', undefined);
    expect(getActiveItem(active, [])).toBeUndefined();
  });

  it('renvoie undefined si la catégorie n\'existe pas', () => {
    const active = makeActive('step-1', 'ghost-seg');
    expect(getActiveItem(active, [makeSegment('seg-1')])).toBeUndefined();
  });

  it('renvoie undefined si l\'étape n\'existe pas dans la catégorie', () => {
    const seg = makeSegment('seg-1', [makeStep('other')]);
    const active = makeActive('ghost-step', 'seg-1');
    expect(getActiveItem(active, [seg])).toBeUndefined();
  });
});

describe('getActiveCat()', () => {
  it('renvoie le segment correspondant', () => {
    const seg = makeSegment('seg-1');
    const active = makeActive('seg-1');
    const result = getActiveCat(active, [seg]);
    expect(result?.id).toBe('seg-1');
  });

  it('renvoie undefined si le segment n\'existe pas', () => {
    const active = makeActive('ghost');
    expect(getActiveCat(active, [makeSegment('seg-1')])).toBeUndefined();
  });
});

describe('reorderSegment()', () => {
  it('ne fait rien si la cible est un segment technique start/end', () => {
    const segs = [makeSegment('start', [], true), makeSegment('seg-a'), makeSegment('end', [], true)];
    const itinerary = makeItinerary(segs);
    const model = { reorderSegment: vi.fn() } as unknown as ItineraryModel;
    const active = makeActive('seg-a');
    const over = makeOver('start');
    reorderSegment(itinerary, model, active, over);
    expect(model.reorderSegment).not.toHaveBeenCalled();
  });

  it('ne fait rien si le segment est survolé à sa position actuelle', () => {
    const segs = [makeSegment('start'), makeSegment('seg-a'), makeSegment('end')];
    const itinerary = makeItinerary(segs);
    const model = { reorderSegment: vi.fn() } as unknown as ItineraryModel;
    const active = makeActive('seg-a');
    const over = makeOver('seg-a');
    reorderSegment(itinerary, model, active, over);
    expect(model.reorderSegment).not.toHaveBeenCalled();
  });

  it('appelle itineraryModel.reorderSegment avec l\'index correct', () => {
    const segs = [makeSegment('start'), makeSegment('seg-a'), makeSegment('end')];
    const itinerary = makeItinerary(segs);
    const model = { reorderSegment: vi.fn() } as unknown as ItineraryModel;
    const active = makeActive('seg-a');
    const over = makeOver('end');
    reorderSegment(itinerary, model, active, over);
    expect(model.reorderSegment).toHaveBeenCalledWith('seg-a', 2);
  });
});

describe('reorderItems()', () => {
  it('ne fait rien si l\'étape est survolée à sa position actuelle', () => {
    const step = makeStep('step-1');
    const seg = makeSegment('seg-a', [step]);
    const model = { reorderStep: vi.fn() } as unknown as ItineraryModel;
    const active = makeActive('step-1', 'seg-a');
    const over = makeOver('step-1', 'seg-a');
    reorderItems(makeItinerary([seg]), model, active, over);
    expect(model.reorderStep).not.toHaveBeenCalled();
  });

  it('ne fait rien si srcCategory absent', () => {
    const model = { reorderStep: vi.fn() } as unknown as ItineraryModel;
    const active = makeActive('step-1', undefined); // pas de categoryId
    const over = makeOver('step-2', 'seg-1');
    reorderItems(makeItinerary([]), model, active, over);
    expect(model.reorderStep).not.toHaveBeenCalled();
  });

  it('ne fait rien si le segment source est un segment start/end', () => {
    const step = makeStep('step-1');
    const startSeg = makeSegment('start', [step], true);
    const over = makeOver('step-1', 'start');
    const active = makeActive('step-1', 'start');
    const model = { reorderStep: vi.fn() } as unknown as ItineraryModel;
    reorderItems(makeItinerary([startSeg]), model, active, over);
    expect(model.reorderStep).not.toHaveBeenCalled();
  });

  it('ne fait rien si l\'étape est un départ par défaut', () => {
    const defaultStep = makeStep('default-step', true);
    const step2 = makeStep('step-2');
    const seg = makeSegment('seg-a', [defaultStep, step2]);
    const active = makeActive('default-step', 'seg-a');
    const over = makeOver('step-2', 'seg-a');
    const model = { reorderStep: vi.fn() } as unknown as ItineraryModel;
    reorderItems(makeItinerary([seg]), model, active, over);
    expect(model.reorderStep).not.toHaveBeenCalled();
  });

  it('appelle reorderStep pour un déplacement valide dans le même segment', () => {
    const s1 = makeStep('step-1');
    const s2 = makeStep('step-2');
    const seg = makeSegment('seg-a', [s1, s2]);
    const itinerary = makeItinerary([seg]);
    const model = { reorderStep: vi.fn() } as unknown as ItineraryModel;
    const active = makeActive('step-1', 'seg-a');
    const over = makeOver('step-2', 'seg-a');
    reorderItems(itinerary, model, active, over);
    expect(model.reorderStep).toHaveBeenCalledWith('seg-a', 0, 'seg-a', 1);
  });

  it('appelle reorderStep pour un déplacement entre deux segments', () => {
    const s1 = makeStep('step-1');
    const s2 = makeStep('step-2');
    const segA = makeSegment('seg-a', [s1]);
    const segB = makeSegment('seg-b', [s2]);
    const itinerary = makeItinerary([segA, segB]);
    const model = { reorderStep: vi.fn() } as unknown as ItineraryModel;
    const active = makeActive('step-1', 'seg-a');
    const over = makeOver('step-2', 'seg-b');
    reorderItems(itinerary, model, active, over);
    expect(model.reorderStep).toHaveBeenCalledWith('seg-a', 0, 'seg-b', 0);
  });
});
