import type { Page, Route } from '@playwright/test';

/**
 * Helpers partagés pour les tests E2E.
 * Le backend (localhost:8080) et les ressources cartographiques externes
 * sont interceptés pour rendre les tests déterministes et hors-ligne.
 */

/** Pré-charge un jeton d'authentification afin de simuler un utilisateur connecté. */
export async function seedAuth(page: Page, email = 'pilote@c15.fr'): Promise<void> {
  await page.addInitScript(
    ([token, mail]) => {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_email', mail);
    },
    ['e2e-token', email],
  );
}

/** Bloque les tuiles de carte et les requêtes Nominatim (réseau externe). */
export async function stubExternalMaps(page: Page): Promise<void> {
  await page.route(/tile\.openstreetmap\.org/, (route: Route) => route.abort());
  await page.route(/nominatim\.openstreetmap\.org.*/, (route: Route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  );
}

/** Réponse JSON pratique. */
export function json(body: unknown, status = 200) {
  return { status, contentType: 'application/json', body: JSON.stringify(body) };
}

/** Construit un convoi minimal conforme à TourResponse. */
export function buildTour(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    name: 'Convoi Démo',
    shareCode: 'DEMO01',
    totalDistance: 50000,
    totalDuration: 3600,
    draft: false,
    segments: [
      {
        name: 'Étape 1',
        distance: 50000,
        duration: 3600,
        geometry: JSON.stringify({ type: 'LineString', coordinates: [[2.1, 48.1], [2.2, 48.2]] }),
        waypoints: [
          { name: 'Paris', coordinates: { latitude: 48.85, longitude: 2.35 } },
          { name: 'Versailles', coordinates: { latitude: 48.8, longitude: 2.13 } },
        ],
      },
    ],
    ...overrides,
  };
}

/** Page de listing /tours paginée. */
export function buildToursPage(content: unknown[]) {
  return { content, totalPages: content.length > 0 ? 1 : 0, totalElements: content.length };
}
