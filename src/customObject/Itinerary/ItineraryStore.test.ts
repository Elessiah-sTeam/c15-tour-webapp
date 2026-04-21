import { describe, it, expect, vi } from 'vitest';
import { createItineraryStore } from './ItineraryStore';
import { TimeSpan } from '../TimeSpan';
import type { Itinerary } from './types';

function makeDefaultItinerary(): Itinerary {
  return {
    id: -1,
    name: 'Test',
    shareCode: '',
    totalDuration: new TimeSpan(),
    totalDistance: 0,
    segments: [],
  };
}

describe('createItineraryStore()', () => {
  it('crée un store avec un itinéraire par défaut si aucun initial', () => {
    const store = createItineraryStore();
    const snap = store.getSnapshot();
    expect(snap.name).toBe('Nouveau Convoi');
    expect(snap.id).toBe(-1);
    expect(snap.segments).toEqual([]);
  });

  it('crée un store avec la valeur initiale fournie', () => {
    const initial = makeDefaultItinerary();
    initial.name = 'Mon itinéraire';
    const store = createItineraryStore(initial);
    expect(store.getSnapshot().name).toBe('Mon itinéraire');
  });

  it('getSnapshot() renvoie le snapshot courant', () => {
    const store = createItineraryStore();
    const snap = store.getSnapshot();
    expect(snap).toBeDefined();
    expect(typeof snap.name).toBe('string');
  });

  it('set() met à jour l\'itinéraire et notifie les listeners', () => {
    const store = createItineraryStore(makeDefaultItinerary());
    const listener = vi.fn();
    store.subscribe(listener);

    store.set(prev => ({ ...prev, name: 'Nouveau nom' }));

    expect(store.getSnapshot().name).toBe('Nouveau nom');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('subscribe() enregistre un listener et renvoie une fonction de désabonnement', () => {
    const store = createItineraryStore(makeDefaultItinerary());
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    store.set(prev => prev);
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    store.set(prev => prev);
    expect(listener).toHaveBeenCalledTimes(1); // pas de nouvel appel
  });

  it('plusieurs listeners sont tous notifiés', () => {
    const store = createItineraryStore(makeDefaultItinerary());
    const l1 = vi.fn();
    const l2 = vi.fn();
    store.subscribe(l1);
    store.subscribe(l2);

    store.set(prev => prev);

    expect(l1).toHaveBeenCalledOnce();
    expect(l2).toHaveBeenCalledOnce();
  });

  it('après désabonnement d\'un listener, les autres sont encore notifiés', () => {
    const store = createItineraryStore(makeDefaultItinerary());
    const l1 = vi.fn();
    const l2 = vi.fn();
    const unsub1 = store.subscribe(l1);
    store.subscribe(l2);

    unsub1();
    store.set(prev => prev);

    expect(l1).not.toHaveBeenCalled();
    expect(l2).toHaveBeenCalledOnce();
  });

  it('set() reçoit l\'état précédent en paramètre', () => {
    const store = createItineraryStore(makeDefaultItinerary());
    store.set(prev => {
      expect(prev.name).toBe('Test');
      return { ...prev, name: 'Updated' };
    });
    expect(store.getSnapshot().name).toBe('Updated');
  });
});
