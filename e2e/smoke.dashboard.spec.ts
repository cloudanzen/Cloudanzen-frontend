import { expect, test } from '@playwright/test';
import { mockSmokeApi, seedSmokeSession } from './smoke.helpers';

test.describe('@smoke dashboard', () => {
  test('renders dashboard summary widgets with mocked API', async ({
    page,
  }) => {
    await mockSmokeApi(page);
    await seedSmokeSession(page);

    await page.goto('/');

    await expect(
      page.getByRole('heading', { name: 'Dashboard' }),
    ).toBeVisible();
    await expect(page.getByText('Progress Overview')).toBeVisible();
    await expect(page.getByText('SOC 2')).toBeVisible();
  });
});
