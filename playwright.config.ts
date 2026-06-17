import { defineConfig, devices } from '@playwright/test';

/**
 * Tests E2E (UI) du cahier de test C15 Tour — partie webapp.
 * Le serveur applicatif est démarré automatiquement (build + preview Vite).
 * Aucune dépendance réseau réelle : le backend et les tuiles de carte sont
 * interceptés au niveau de la page (voir e2e/helpers.ts).
 */
const PORT = 4173;

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
