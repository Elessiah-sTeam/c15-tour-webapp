import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  subscribeSearchIntent,
  getSearchIntentSnapshot,
  requestSearchForStep,
  clearSearchIntent,
} from './SearchIntentStore';
import type { SearchTarget } from './SearchIntentStore';

// Le store est un singleton avec état global ; on remet à zéro entre les tests
beforeEach(() => {
  clearSearchIntent();
});

describe('SearchIntentStore', () => {
  describe('getSearchIntentSnapshot()', () => {
    it('renvoie target null par défaut', () => {
      const snap = getSearchIntentSnapshot();
      expect(snap.target).toBeNull();
    });
  });

  describe('requestSearchForStep()', () => {
    it('met à jour target avec les infos de l\'étape', () => {
      const target: SearchTarget = { segmentId: 'seg-1', stepId: 'step-1' };
      requestSearchForStep(target);
      const snap = getSearchIntentSnapshot();
      expect(snap.target).toEqual(target);
    });

    it('met à jour focusRequestId à chaque appel', () => {
      const target: SearchTarget = { segmentId: 'seg-1', stepId: 'step-1' };
      requestSearchForStep(target);
      const id1 = getSearchIntentSnapshot().focusRequestId;
      requestSearchForStep(target);
      const id2 = getSearchIntentSnapshot().focusRequestId;
      expect(id2).toBeGreaterThanOrEqual(id1);
    });

    it('notifie les listeners', () => {
      const listener = vi.fn();
      subscribeSearchIntent(listener);
      requestSearchForStep({ segmentId: 's', stepId: 'step' });
      expect(listener).toHaveBeenCalledOnce();
    });
  });

  describe('clearSearchIntent()', () => {
    it('remet target à null', () => {
      requestSearchForStep({ segmentId: 's', stepId: 'step' });
      clearSearchIntent();
      expect(getSearchIntentSnapshot().target).toBeNull();
    });

    it('conserve le focusRequestId lors du clear', () => {
      requestSearchForStep({ segmentId: 's', stepId: 'step' });
      const idBefore = getSearchIntentSnapshot().focusRequestId;
      clearSearchIntent();
      expect(getSearchIntentSnapshot().focusRequestId).toBe(idBefore);
    });

    it('notifie les listeners', () => {
      const listener = vi.fn();
      subscribeSearchIntent(listener);
      clearSearchIntent();
      expect(listener).toHaveBeenCalledOnce();
    });
  });

  describe('subscribeSearchIntent()', () => {
    it('enregistre un listener et retourne une fonction de désabonnement', () => {
      const listener = vi.fn();
      const unsub = subscribeSearchIntent(listener);
      requestSearchForStep({ segmentId: 's', stepId: 'step' });
      expect(listener).toHaveBeenCalledOnce();
      unsub();
      requestSearchForStep({ segmentId: 's', stepId: 'step' });
      expect(listener).toHaveBeenCalledOnce(); // pas de second appel
    });

    it('plusieurs listeners sont tous notifiés', () => {
      const l1 = vi.fn();
      const l2 = vi.fn();
      subscribeSearchIntent(l1);
      subscribeSearchIntent(l2);
      requestSearchForStep({ segmentId: 's', stepId: 'step' });
      expect(l1).toHaveBeenCalledOnce();
      expect(l2).toHaveBeenCalledOnce();
    });
  });
});
