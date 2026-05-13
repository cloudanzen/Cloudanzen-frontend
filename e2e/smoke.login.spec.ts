import { expect, test } from '@playwright/test';
import { mockSmokeApi } from './smoke.helpers';

test.describe('@smoke login', () => {
  test('renders the login form and signs in with mocked API', async ({
    page,
  }) => {
    await mockSmokeApi(page);

    await page.goto('/login');
    await expect(
      page.getByRole('heading', { name: /sign in to your account/i }),
    ).toBeVisible();

    await page
      .getByPlaceholder('you@organization.com')
      .fill('smoke.admin@cloudanzen.test');
    await page.getByPlaceholder('Enter your password').fill('Password123!');
    await page.getByRole('button', { name: /^sign in$/i }).click();

    await page.waitForURL((url) => url.pathname === '/');
    await expect(
      page.getByRole('heading', { name: 'Dashboard' }),
    ).toBeVisible();
  });
});
