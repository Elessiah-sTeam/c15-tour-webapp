import { test, expect } from '@playwright/test';
import { seedAuth, stubExternalMaps, json, buildToursPage } from './helpers';

/**
 * Cahier de test — Module Accueil (ACC-01..04).
 */
test.describe('Page d’accueil', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await stubExternalMaps(page);
    await page.route(/\/tours(\?|$)/, (route) => route.fulfill(json(buildToursPage([]))));
  });

  test('ACC-01 — affiche les deux actions principales (ACC-04 design C15)', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/C15 Fiesta Tour/i).first()).toBeVisible();
    await expect(page.getByText('Créer un nouveau convoi')).toBeVisible();
    await expect(page.getByText(/Accéder à l'historique des convois/i)).toBeVisible();
  });

  test('ACC-02 — créer un nouveau convoi redirige vers la carte (/planner)', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Créer un nouveau convoi').click();
    await expect(page).toHaveURL(/\/planner/);
  });

  test('ACC-03 — accéder à l’historique redirige vers la liste', async ({ page }) => {
    await page.goto('/');
    await page.getByText(/Accéder à l'historique des convois/i).click();
    await expect(page).toHaveURL(/\/history$/);
  });
});
