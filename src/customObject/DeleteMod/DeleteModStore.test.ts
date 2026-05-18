import { describe, it, expect, vi, beforeEach } from 'vitest';
import { deleteModStore } from './DeleteModStore';

// Le store est un singleton — on réinitialise entre les tests
beforeEach(() => {
  deleteModStore.set(() => false);
});

describe('deleteModStore (singleton)', () => {
  it('getSnapshot() renvoie false par défaut', () => {
    expect(deleteModStore.getSnapshot()).toBe(false);
  });

  it('set() met à jour la valeur à true', () => {
    deleteModStore.set(() => true);
    expect(deleteModStore.getSnapshot()).toBe(true);
  });

  it('set() reçoit la valeur précédente et peut la toggler', () => {
    deleteModStore.set(prev => !prev);
    expect(deleteModStore.getSnapshot()).toBe(true);
    deleteModStore.set(prev => !prev);
    expect(deleteModStore.getSnapshot()).toBe(false);
  });

  it('set() notifie tous les listeners', () => {
    const l1 = vi.fn();
    const l2 = vi.fn();
    deleteModStore.subscribe(l1);
    deleteModStore.subscribe(l2);
    deleteModStore.set(() => true);
    expect(l1).toHaveBeenCalledOnce();
    expect(l2).toHaveBeenCalledOnce();
  });

  it('subscribe() retourne une fonction de désabonnement', () => {
    const listener = vi.fn();
    const unsub = deleteModStore.subscribe(listener);
    unsub();
    deleteModStore.set(() => true);
    expect(listener).not.toHaveBeenCalled();
  });

  it('après désabonnement d\'un listener les autres sont encore notifiés', () => {
    const l1 = vi.fn();
    const l2 = vi.fn();
    const unsub1 = deleteModStore.subscribe(l1);
    deleteModStore.subscribe(l2);
    unsub1();
    deleteModStore.set(() => true);
    expect(l1).not.toHaveBeenCalled();
    expect(l2).toHaveBeenCalledOnce();
  });
});
