import { test, expect } from '@playwright/test';
import { seedAuth, stubExternalMaps, json, buildToursPage } from './helpers';

/**
 * Cahier de test — Module Authentification (AUTH-01..08).
 */
test.describe('Authentification', () => {
  test('AUTH-08 — accès sans connexion redirige vers /login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Connexion' })).toBeVisible();
  });

  test('AUTH-02 — connexion avec compte valide accède à l’accueil', async ({ page }) => {
    await page.route('**/auth/login', (route) =>
      route.fulfill(json({ token: 'jwt-valide' })),
    );

    await page.goto('/login');
    await page.getByLabel('Adresse email').fill('pilote@c15.fr');
    await page.getByLabel('Mot de passe').fill('motdepasse');
    await page.getByRole('button', { name: 'Se connecter' }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText(/Bienvenue sur l'outil C15/i)).toBeVisible();
  });

  test('AUTH-03 — mauvais mot de passe affiche une erreur', async ({ page }) => {
    await page.route('**/auth/login', (route) => route.fulfill({ status: 401 }));

    await page.goto('/login');
    await page.getByLabel('Adresse email').fill('pilote@c15.fr');
    await page.getByLabel('Mot de passe').fill('mauvais');
    await page.getByRole('button', { name: 'Se connecter' }).click();

    await expect(page.getByText('Identifiants incorrects. Veuillez réessayer.')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('AUTH-04 — email inconnu affiche une erreur', async ({ page }) => {
    await page.route('**/auth/login', (route) => route.fulfill({ status: 401 }));

    await page.goto('/login');
    await page.getByLabel('Adresse email').fill('inconnu@c15.fr');
    await page.getByLabel('Mot de passe').fill('peu importe');
    await page.getByRole('button', { name: 'Se connecter' }).click();

    await expect(page.getByText('Identifiants incorrects. Veuillez réessayer.')).toBeVisible();
  });

  test('AUTH-05 — champs vides : la validation empêche la soumission', async ({ page }) => {
    let loginCalled = false;
    await page.route('**/auth/login', (route) => {
      loginCalled = true;
      return route.fulfill(json({ token: 'x' }));
    });

    await page.goto('/login');
    await page.getByRole('button', { name: 'Se connecter' }).click();

    await expect(page).toHaveURL(/\/login$/);
    expect(loginCalled).toBe(false);
    // Le champ email natif est invalide (required).
    const emailValid = await page.getByLabel('Adresse email').evaluate(
      (el: HTMLInputElement) => el.checkValidity(),
    );
    expect(emailValid).toBe(false);
  });

  test('AUTH-06 — lien « Mot de passe oublié » ouvre le parcours de réinitialisation', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: 'Mot de passe oublié ?' }).click();
    await expect(page).toHaveURL(/\/forgot-password$/);
  });

  test('AUTH-01 — créer un compte puis être redirigé vers la connexion', async ({ page }) => {
    await page.route('**/auth/register', (route) =>
      route.fulfill({ status: 201, contentType: 'application/json', body: '{}' }),
    );

    await page.goto('/register');
    await page.getByLabel('Adresse email').fill('nouveau@c15.fr');
    await page.getByLabel('Mot de passe', { exact: true }).fill('Motdepasse1!');
    await page.getByLabel('Confirmer le mot de passe').fill('Motdepasse1!');
    await page.getByRole('button', { name: 'Créer mon compte' }).click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText(/Compte créé avec succès/i)).toBeVisible();
  });

  test('AUTH-07 — déconnexion ramène à la page de connexion', async ({ page }) => {
    await seedAuth(page);
    await stubExternalMaps(page);
    await page.route(/\/tours(\?|$)/, (route) => route.fulfill(json(buildToursPage([]))));

    await page.goto('/history');
    await page.getByRole('button', { name: 'Se déconnecter' }).click();
    await expect(page).toHaveURL(/\/login$/);
  });
});
