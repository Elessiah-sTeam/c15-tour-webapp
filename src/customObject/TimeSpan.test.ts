import { describe, it, expect } from 'vitest';
import { TimeSpan, TimespanOffset } from './TimeSpan';

describe('TimeSpan', () => {
  describe('constructor', () => {
    it('crée un TimeSpan à 0 par défaut', () => {
      const ts = new TimeSpan();
      expect(ts.duration).toBe(0);
    });

    it('crée un TimeSpan avec une durée donnée', () => {
      const ts = new TimeSpan(5000);
      expect(ts.duration).toBe(5000);
    });
  });

  describe('set()', () => {
    it('met à jour la durée', () => {
      const ts = new TimeSpan(1000);
      ts.set(9000);
      expect(ts.duration).toBe(9000);
    });

    it('met à jour le timespan décomposé', () => {
      const ts = new TimeSpan();
      ts.set(3_661_000); // 1h 1min 1s
      const composed = ts.getTimeSpanComposed();
      expect(composed.hours).toBe(1);
      expect(composed.minutes).toBe(1);
      expect(composed.seconds).toBe(1);
    });
  });

  describe('calculTimespan()', () => {
    it('calcule la différence entre deux dates', () => {
      const ts = new TimeSpan();
      const dateA = new Date(2024, 0, 1, 2, 0, 0);
      const dateB = new Date(2024, 0, 1, 1, 0, 0);
      ts.calculTimespan(dateA, dateB);
      expect(ts.duration).toBe(3_600_000); // 1 heure
    });

    it('peut produire une durée négative si dateA < dateB', () => {
      const ts = new TimeSpan();
      const dateA = new Date(2024, 0, 1, 0, 0, 0);
      const dateB = new Date(2024, 0, 1, 1, 0, 0);
      ts.calculTimespan(dateA, dateB);
      expect(ts.duration).toBe(-3_600_000);
    });
  });

  describe('msToComposed()', () => {
    it('décompose 0 ms correctement', () => {
      const c = TimeSpan.msToComposed(0);
      expect(c).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });
    });

    it('décompose 1 jour (86 400 000 ms)', () => {
      const c = TimeSpan.msToComposed(86_400_000);
      expect(c.days).toBe(1);
      expect(c.hours).toBe(0);
      expect(c.minutes).toBe(0);
    });

    it('décompose 1 heure (3 600 000 ms)', () => {
      const c = TimeSpan.msToComposed(3_600_000);
      expect(c.days).toBe(0);
      expect(c.hours).toBe(1);
      expect(c.minutes).toBe(0);
    });

    it('décompose 1 minute (60 000 ms)', () => {
      const c = TimeSpan.msToComposed(60_000);
      expect(c.minutes).toBe(1);
      expect(c.seconds).toBe(0);
    });

    it('décompose 1 seconde (1 000 ms)', () => {
      const c = TimeSpan.msToComposed(1_000);
      expect(c.seconds).toBe(1);
      expect(c.milliseconds).toBe(0);
    });

    it('décompose 500 ms', () => {
      const c = TimeSpan.msToComposed(500);
      expect(c.milliseconds).toBe(500);
    });

    it('décompose une valeur complexe (1j 2h 3m 4s 5ms)', () => {
      const ms = 86_400_000 + 2 * 3_600_000 + 3 * 60_000 + 4 * 1_000 + 5;
      const c = TimeSpan.msToComposed(ms);
      expect(c.days).toBe(1);
      expect(c.hours).toBe(2);
      expect(c.minutes).toBe(3);
      expect(c.seconds).toBe(4);
      expect(c.milliseconds).toBe(5);
    });
  });

  describe('getTimeSpanComposed()', () => {
    it('renvoie la décomposition correcte après construction', () => {
      const ts = new TimeSpan(3_661_500); // 1h 1m 1s 500ms
      const c = ts.getTimeSpanComposed();
      expect(c.hours).toBe(1);
      expect(c.minutes).toBe(1);
      expect(c.seconds).toBe(1);
      expect(c.milliseconds).toBe(500);
    });
  });

  describe('toFStr()', () => {
    it('affiche les minutes par défaut', () => {
      const ts = new TimeSpan(90 * 60_000); // 1h30
      const str = ts.toFStr();
      expect(str).toContain('1');
      expect(str).toContain('30');
    });

    it('affiche uniquement les heures avec précision HOURS', () => {
      const ts = new TimeSpan(3_600_000); // 1h
      const str = ts.toFStr(TimespanOffset.HOURS);
      expect(str).toBe('1:');
    });

    it('affiche heures/minutes/secondes avec précision SECONDS', () => {
      const ts = new TimeSpan(5_000); // 5s
      const str = ts.toFStr(TimespanOffset.SECONDS);
      // toFStr inclut tous les composants >= start jusqu'à la précision (avec les zéros)
      expect(str).toBe('0:0:5:');
    });

    it('utilise les unités personnalisées', () => {
      const ts = new TimeSpan(3_600_000 + 30 * 60_000); // 1h30
      const str = ts.toFStr(TimespanOffset.MINUTES, {
        days: 'j ', hours: 'h ', minutes: 'm ', seconds: 's ', milliseconds: 'ms '
      });
      expect(str).toBe('1h 30m ');
    });

    it('affiche les jours si durée >= 1 jour', () => {
      const ts = new TimeSpan(2 * 86_400_000); // 2j
      const str = ts.toFStr(TimespanOffset.MINUTES);
      expect(str).toContain('2');
    });

    it('affiche heures/minutes/secondes/ms avec précision MS', () => {
      const ts = new TimeSpan(250);
      const str = ts.toFStr(TimespanOffset.MS);
      // Tous les composants jusqu'à MS sont inclus (avec les zéros)
      expect(str).toBe('0:0:0:250 ');
    });
  });

  describe('add()', () => {
    it('additionne deux durées', () => {
      const a = new TimeSpan(1000);
      const b = new TimeSpan(2000);
      a.add(b);
      expect(a.duration).toBe(3000);
    });

    it('renvoie this pour le chaînage', () => {
      const ts = new TimeSpan(500);
      const result = ts.add(new TimeSpan(500));
      expect(result).toBe(ts);
    });
  });

  describe('sub()', () => {
    it('soustrait deux durées', () => {
      const a = new TimeSpan(5000);
      const b = new TimeSpan(2000);
      a.sub(b);
      expect(a.duration).toBe(3000);
    });

    it('renvoie this pour le chaînage', () => {
      const ts = new TimeSpan(1000);
      const result = ts.sub(new TimeSpan(500));
      expect(result).toBe(ts);
    });

    it('peut produire une durée négative', () => {
      const a = new TimeSpan(100);
      const b = new TimeSpan(500);
      a.sub(b);
      expect(a.duration).toBe(-400);
    });
  });
});
