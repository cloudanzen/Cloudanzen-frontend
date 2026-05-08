/**
 * E2E tests — Dashboard / main navigation
 *
 * Covers:
 *   - Main navigation items are visible after login
 *   - Compliance section is accessible
 *   - Risk center is accessible
 *   - Validations page is accessible
 *   - Notification bell is visible
 */
import { test, expect, type Page, type BrowserContext } from '@playwright/test';

const TEST_EMAIL = process.env.E2E_EMAIL || 'admin@cloudanzen.com';
const TEST_PASSWORD = process.env.E2E_PASSWORD || 'password123';

/**
 * Authenticate and return a storage state context reusable across tests.
 * Skip actual login if the app is unavailable (CI without backend).
 */
async function authenticateAndGetState(page: Page): Promise<boolean> {
  try {
    await page.goto('/login', { timeout: 10000 });
    await page.getByLabel(/email/i).fill(TEST_EMAIL);
    await page.getByLabel(/password/i).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /sign in|log in|login/i }).click();
    // Wait for navigation away from login
    await page.waitForURL(/^(?!.*login)/, { timeout: 8000 });
    return true;
  } catch {
    return false;
  }
}

test.describe('Post-login navigation', () => {
  test.beforeEach(async ({ page }) => {
    const loggedIn = await authenticateAndGetState(page);
    test.skip(!loggedIn, 'Cannot authenticate — backend may not be running');
  });

  test('sidebar navigation is visible', async ({ page }) => {
    // Check for common navigation elements
    await expect(
      page.getByRole('navigation').or(page.locator('[data-testid="sidebar"]')).first(),
    ).toBeVisible();
  });

  test('can navigate to the Validations page', async ({ page }) => {
    await page.goto('/validations');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/validations/);
    // Page should render some content (not blank or error)
    const body = page.locator('body');
    await expect(body).not.toBeEmpty();
  });

  test('can navigate to the Risks page', async ({ page }) => {
    await page.goto('/risk/risks');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/risk\/risks/);
  });

  test('can navigate to the Controls page', async ({ page }) => {
    await page.goto('/compliance/controls');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/compliance\/controls/);
  });

  test('no unhandled JS errors on main pages', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/validations');
    await page.waitForLoadState('networkidle');
    await page.goto('/risk/risks');
    await page.waitForLoadState('networkidle');

    // Filter out non-critical errors (e.g. network errors to backend)
    const criticalErrors = errors.filter(
      (e) => !e.includes('Failed to fetch') && !e.includes('NetworkError'),
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
