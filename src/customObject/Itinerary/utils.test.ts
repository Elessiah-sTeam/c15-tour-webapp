import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { updateStarts } from './utils';
import { TimeSpan } from '../TimeSpan';
import type { Segment, Step } from './types';

// Helpers de construction
function makeStep(id: string, overrides: Partial<Step> = {}): Step {
  return {
    id,
    content: { title: id, duration: new TimeSpan() },
    isDefaultSegStart: false,
    ...overrides,
  };
}

function makeSegment(id: string, durationMs = 0, steps: Step[] = [], overrides: Partial<Segment> = {}): Segment {
  return {
    id,
    content: {
      title: id,
      hour: new Date(0),
      duration: new TimeSpan(durationMs),
      distance: 0,
    },
    isStartEnd: false,
    steps,
    ...overrides,
  };
}

describe('updateStarts()', () => {
  const FIXED_DATE = new Date('2024-01-01T08:00:00.000Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_DATE);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renvoie un tableau vide si segments est vide', () => {
    expect(updateStarts([])).toEqual([]);
  });

  it('supprime les étapes isDefaultSegStart existantes', () => {
    const step = makeStep('s1', { isDefaultSegStart: true });
    const seg = makeSegment('seg1', 0, [step]);
    // updateStarts nécessite au moins 2 segments pour fonctionner sans crash
    const seg2 = makeSegment('seg2', 0, []);
    const result = updateStarts([seg, seg2]);
    expect(result[0].steps.filter(s => s.isDefaultSegStart)).toHaveLength(0);
  });

  it('ne propage pas de départ automatique si seulement 2 segments (start+end)', () => {
    const start = makeSegment('start', 0, [], { isStartEnd: true });
    const end = makeSegment('end', 0, [], { isStartEnd: true });
    const result = updateStarts([start, end]);
    expect(result[0].steps).toHaveLength(0);
    expect(result[1].steps).toHaveLength(0);
  });

  it('calcule l\'heure du segment suivant en ajoutant la durée du précédent', () => {
    const ONE_HOUR = 3_600_000;
    const start = makeSegment('start', ONE_HOUR, []);
    start.content.hour = new Date('2024-01-01T08:00:00.000Z');
    const mid = makeSegment('mid', ONE_HOUR, [makeStep('s1'), makeStep('s2')]);
    const end = makeSegment('end', 0, []);

    const result = updateStarts([start, mid, end]);

    // seg mid doit commencer 1h après start
    expect(result[1].content.hour.getTime()).toBe(
      new Date('2024-01-01T09:00:00.000Z').getTime()
    );
    // seg end doit commencer 1h après mid
    expect(result[2].content.hour.getTime()).toBe(
      new Date('2024-01-01T10:00:00.000Z').getTime()
    );
  });

  it('ajoute une étape isDefaultSegStart au segment start quand le premier segment intermédiaire a des steps', () => {
    const start = makeSegment('start', 0, []);
    const mid = makeSegment('mid', 0, [makeStep('step-a'), makeStep('step-b')]);
    const end = makeSegment('end', 0, []);

    const result = updateStarts([start, mid, end]);

    const defaultStart = result[0].steps.find(s => s.isDefaultSegStart);
    expect(defaultStart).toBeDefined();
    expect(defaultStart?.id).toBe('start-start');
  });

  it('propage les départs automatiques entre les segments intermédiaires', () => {
    const start = makeSegment('start', 0, []);
    const mid1 = makeSegment('mid1', 0, [makeStep('a'), makeStep('b')]);
    const mid2 = makeSegment('mid2', 0, [makeStep('c'), makeStep('d')]);
    const end = makeSegment('end', 0, []);

    const result = updateStarts([start, mid1, mid2, end]);

    // mid2 doit avoir un step automatique qui correspond à la dernière étape de mid1
    const autoStart = result[2].steps.find(s => s.isDefaultSegStart);
    expect(autoStart).toBeDefined();
    expect(autoStart?.id).toBe('start-mid2');
  });

  it('normalise une heure invalide (NaN) vers la date système courante', () => {
    const seg = makeSegment('seg1', 0, []);
    seg.content.hour = new Date('invalid');
    // 2 segments minimum pour éviter le crash sur out[FIRST_SEG_INDEX]
    const seg2 = makeSegment('seg2', 0, []);
    const result = updateStarts([seg, seg2]);
    expect(result[0].content.hour.getTime()).toBe(FIXED_DATE.getTime());
  });

  it('conserve les steps non-default existants', () => {
    const realStep = makeStep('real');
    const seg = makeSegment('seg1', 0, [realStep]);
    const seg2 = makeSegment('seg2', 0, []);
    const result = updateStarts([seg, seg2]);
    expect(result[0].steps.some(s => s.id === 'real')).toBe(true);
  });

  it('ajoute la pause du segment precedent au depart du suivant et a l arrivee finale', () => {
    const start = makeSegment('start', 0, []);
    start.content.hour = new Date('2024-01-01T08:00:00.000Z');
    const first = makeSegment('first', 3_600_000, [makeStep('s1')], {
      content: {
        title: 'first',
        hour: new Date(0),
        duration: new TimeSpan(3_600_000),
        distance: 0,
        breakDuration: 600,
      },
    });
    const second = makeSegment('second', 1_800_000, [makeStep('s2')], {
      content: {
        title: 'second',
        hour: new Date(0),
        duration: new TimeSpan(1_800_000),
        distance: 0,
        breakDuration: 300,
      },
    });
    const end = makeSegment('end', 0, []);

    const result = updateStarts([start, first, second, end]);

    expect(result[1].content.hour.getTime()).toBe(
      new Date('2024-01-01T08:00:00.000Z').getTime()
    );
    expect(result[2].content.hour.getTime()).toBe(
      new Date('2024-01-01T09:10:00.000Z').getTime()
    );
    expect(result[3].content.hour.getTime()).toBe(
      new Date('2024-01-01T09:45:00.000Z').getTime()
    );
  });

  it('recalcule les heures d etape a partir du depart du segment et des pauses appliquees', () => {
    const start = makeSegment('start', 0, []);
    start.content.hour = new Date('2024-01-01T08:00:00.000Z');
    const first = makeSegment('first', 3_600_000, [
      makeStep('a', {
        content: {
          title: 'a',
          duration: new TimeSpan(0),
          estimatedArrival: new Date('2024-01-01T07:30:00.000Z'),
        }
      }),
      makeStep('b', {
        content: {
          title: 'b',
          duration: new TimeSpan(600_000),
          estimatedArrival: new Date('2024-01-01T07:40:00.000Z'),
        }
      }),
    ], {
      content: {
        title: 'first',
        hour: new Date(0),
        duration: new TimeSpan(3_600_000),
        distance: 0,
        breakDuration: 900,
      },
    });
    const second = makeSegment('second', 1_800_000, [
      makeStep('c', {
        content: {
          title: 'c',
          duration: new TimeSpan(300_000),
        }
      }),
    ], {
      content: {
        title: 'second',
        hour: new Date(0),
        duration: new TimeSpan(1_800_000),
        distance: 0,
        breakDuration: 300,
      },
    });
    const end = makeSegment('end', 0, []);

    const result = updateStarts([start, first, second, end]);

    expect(result[1].steps[0].content.estimatedArrival?.getTime()).toBe(
      new Date('2024-01-01T08:15:00.000Z').getTime()
    );
    expect(result[1].steps[1].content.estimatedArrival?.getTime()).toBe(
      new Date('2024-01-01T08:25:00.000Z').getTime()
    );
    expect(result[2].steps[0].content.estimatedArrival?.getTime()).toBe(
      new Date('2024-01-01T09:20:00.000Z').getTime()
    );
    expect(result[2].steps[1].content.estimatedArrival?.getTime()).toBe(
      new Date('2024-01-01T09:25:00.000Z').getTime()
    );
  });
});
