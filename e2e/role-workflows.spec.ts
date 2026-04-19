import { test, expect } from '@playwright/test';
import {
  loginAsRole,
  mockRoleApi,
} from './helpers/role-workflows';

test.describe('Role workflows', () => {
  test.beforeEach(async ({ page }) => {
    await mockRoleApi(page);
  });

  test('super admin can access platform admin organizations', async ({ page }) => {
    await loginAsRole(page, 'SUPER_ADMIN');

    await page.goto('/admin/organizations');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/admin\/organizations$/);
    await expect(page.getByText('Demo Org')).toBeVisible();
    await expect(page.getByRole('button', { name: /new organization/i })).toBeVisible();
  });

  test('org admin can manage users from access users', async ({ page }) => {
    await loginAsRole(page, 'ORG_ADMIN');

    await page.goto('/settings/access/users');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/settings\/access\/users$/);
    await expect(page.getByRole('heading', { name: /user management/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /invite user/i })).toBeVisible();
    await expect(page.getByText('org.admin@example.com')).toBeVisible();
  });

  test('org admin can access partner api workflow', async ({ page }) => {
    await loginAsRole(page, 'ORG_ADMIN');

    await page.goto('/integrations/partner-api');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/integrations\/partner-api$/);
    await expect(page.getByRole('heading', { name: /partner api/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /issue key/i }).first()).toBeVisible();
  });

  test('auditor dashboard shows assigned audit workflow', async ({ page }) => {
    await loginAsRole(page, 'AUDITOR');

    await page.goto('/auditor/dashboard');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/auditor\/dashboard$/);
    await expect(page.getByRole('heading', { name: /auditor dashboard/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /final report/i })).toBeVisible();
    await expect(page.getByText('Controls in Scope')).toBeVisible();
  });

  test('auditor is blocked from user management routes', async ({ page }) => {
    await loginAsRole(page, 'AUDITOR');

    await page.goto('/settings/access/users');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/settings\/access\/requests$/);
    await expect(page.getByRole('heading', { name: /access requests/i })).toBeVisible();
  });
});
