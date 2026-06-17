import { test, expect } from '@playwright/test';
import { seedAuth, stubExternalMaps, json, buildTour, buildToursPage } from './helpers';

// Patterns mutuellement exclusifs : la liste (/tours ou /tours?...) vs le détail (/tours/<id>).
const TOURS_LIST = /\/tours(\?|$)/;
const TOUR_DETAIL = /\/tours\/1$/;

/**
 * Cahier de test — Module Historique (HIST-01..08).
 */
test.describe('Historique des convois', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await stubExternalMaps(page);
  });

  test('HIST-02 — aucun convoi affiche le message vide', async ({ page }) => {
    await page.route(TOURS_LIST, (route) => route.fulfill(json(buildToursPage([]))));

    await page.goto('/history');
    await expect(page.getByText(/Aucun convoi trouvé/i)).toBeVisible();
  });

  test('HIST-01 — liste uniquement les convois renvoyés par le backend', async ({ page }) => {
    await page.route(TOURS_LIST, (route) =>
      route.fulfill(
        json(
          buildToursPage([
            buildTour({ id: 1, name: 'Tour de Bretagne', draft: false }),
            buildTour({ id: 2, name: 'Virée des Alpes', draft: true }),
          ]),
        ),
      ),
    );

    await page.goto('/history');
    await expect(page.getByRole('heading', { name: 'Tour de Bretagne' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Virée des Alpes' })).toBeVisible();
  });

  test('HIST-07 — la recherche filtre la liste par nom', async ({ page }) => {
    await page.route(TOURS_LIST, (route) =>
      route.fulfill(
        json(
          buildToursPage([
            buildTour({ id: 1, name: 'Tour de Bretagne' }),
            buildTour({ id: 2, name: 'Virée des Alpes' }),
          ]),
        ),
      ),
    );

    await page.goto('/history');
    await page.getByPlaceholder(/Rechercher un convoi/i).fill('Bretagne');

    await expect(page.getByRole('heading', { name: 'Tour de Bretagne' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Virée des Alpes' })).toHaveCount(0);
  });

  test('HIST-08 — le filtre Finalisés ne garde que les convois finalisés', async ({ page }) => {
    await page.route(TOURS_LIST, (route) =>
      route.fulfill(
        json(
          buildToursPage([
            buildTour({ id: 1, name: 'Tour Finalise', draft: false }),
            buildTour({ id: 2, name: 'Tour Brouillon', draft: true }),
          ]),
        ),
      ),
    );

    await page.goto('/history');
    await page.getByRole('button', { name: 'Finalisés' }).click();

    await expect(page.getByRole('heading', { name: 'Tour Finalise' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Tour Brouillon' })).toHaveCount(0);
  });

  test('HIST-03 — ouvrir un convoi mène à la carte', async ({ page }) => {
    await page.route(TOUR_DETAIL, (route) => route.fulfill(json(buildTour({ id: 1 }))));
    await page.route(TOURS_LIST, (route) =>
      route.fulfill(json(buildToursPage([buildTour({ id: 1, name: 'Convoi à ouvrir' })]))),
    );

    await page.goto('/history');
    await page.getByRole('button', { name: /Ouvrir/ }).click();
    await expect(page).toHaveURL(/\/planner\?id=1/);
  });
});
