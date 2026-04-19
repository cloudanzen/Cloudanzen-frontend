import { test, expect, type Page } from '@playwright/test';
import { loginAsRole } from './helpers/role-workflows';

type NotificationSeverity = 'info' | 'warning' | 'critical';
type NotificationDigestMode = 'immediate' | 'hourly' | 'daily' | 'weekly';

type NotificationRecord = {
  id: string;
  organizationId: string;
  recipientUserId: string;
  eventType: string;
  title: string;
  body: string;
  resourceType: string | null;
  resourceId: string | null;
  severity: NotificationSeverity;
  readAt: string | null;
  actionedAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

type NotificationPreferenceRecord = {
  id: string | null;
  organizationId: string;
  userId: string;
  userEmail: string | null;
  eventType: string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  slackEnabled: boolean;
  digestMode: NotificationDigestMode;
  createdAt: string | null;
  updatedAt: string | null;
};

const NOW = '2026-04-19T10:00:00.000Z';
const USER_ID = 'user-org-admin';
const ORG_ID = 'org-demo-1';

function buildNotification(
  overrides: Partial<NotificationRecord> & Pick<NotificationRecord, 'id' | 'title'>,
): NotificationRecord {
  return {
    id: overrides.id,
    organizationId: ORG_ID,
    recipientUserId: USER_ID,
    eventType: 'audit.created',
    title: overrides.title,
    body: overrides.body ?? 'Notification body',
    resourceType: overrides.resourceType ?? null,
    resourceId: overrides.resourceId ?? null,
    severity: overrides.severity ?? 'info',
    readAt: overrides.readAt ?? null,
    actionedAt: overrides.actionedAt ?? null,
    metadata: overrides.metadata ?? {},
    createdAt: overrides.createdAt ?? NOW,
  };
}

function buildPreference(
  overrides: Partial<NotificationPreferenceRecord> & Pick<NotificationPreferenceRecord, 'eventType'>,
): NotificationPreferenceRecord {
  return {
    id: overrides.id ?? `pref-${overrides.eventType}`,
    organizationId: ORG_ID,
    userId: USER_ID,
    userEmail: 'org.admin@example.com',
    eventType: overrides.eventType,
    inAppEnabled: overrides.inAppEnabled ?? true,
    emailEnabled: overrides.emailEnabled ?? true,
    slackEnabled: overrides.slackEnabled ?? false,
    digestMode: overrides.digestMode ?? 'immediate',
    createdAt: overrides.createdAt ?? NOW,
    updatedAt: overrides.updatedAt ?? NOW,
  };
}

async function mockNotificationApi(page: Page, opts?: {
  notifications?: NotificationRecord[];
  preferences?: NotificationPreferenceRecord[];
  onMarkRead?: (notificationId: string) => void;
  onMarkAllRead?: () => void;
  onPreferenceUpdate?: (eventType: string, body: Record<string, unknown>) => void;
}) {
  let notifications = [...(opts?.notifications ?? [])];
  let preferences = [...(opts?.preferences ?? [])];

  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const { pathname, searchParams } = url;

    if (!pathname.startsWith('/api/')) {
      await route.continue();
      return;
    }

    if (pathname === '/api/setup/setup-status') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ canSetup: false, setup: true }),
      });
      return;
    }

    if (pathname === '/api/notifications/unread-count') {
      const count = notifications.filter((item) => !item.readAt).length;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { count } }),
      });
      return;
    }

    if (pathname === '/api/notifications' && request.method() === 'GET') {
      const unreadOnly = searchParams.get('unreadOnly') === 'true';
      const severity = searchParams.get('severity');
      const eventType = searchParams.get('eventType');
      const limit = Number(searchParams.get('limit') ?? notifications.length);
      const offset = Number(searchParams.get('offset') ?? 0);

      let filtered = notifications;
      if (unreadOnly) filtered = filtered.filter((item) => !item.readAt);
      if (severity) filtered = filtered.filter((item) => item.severity === severity);
      if (eventType) filtered = filtered.filter((item) => item.eventType === eventType);

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            notifications: filtered.slice(offset, offset + limit),
            total: filtered.length,
          },
        }),
      });
      return;
    }

    if (pathname === '/api/notifications/read-all' && request.method() === 'POST') {
      notifications = notifications.map((item) => ({
        ...item,
        readAt: item.readAt ?? NOW,
      }));
      opts?.onMarkAllRead?.();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
      return;
    }

    const readMatch = pathname.match(/^\/api\/notifications\/([^/]+)\/read$/);
    if (readMatch && request.method() === 'POST') {
      const notificationId = readMatch[1]!;
      notifications = notifications.map((item) =>
        item.id === notificationId ? { ...item, readAt: item.readAt ?? NOW } : item,
      );
      opts?.onMarkRead?.(notificationId);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
      return;
    }

    if (pathname === '/api/notifications/preferences' && request.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: preferences }),
      });
      return;
    }

    const preferenceMatch = pathname.match(/^\/api\/notifications\/preferences\/(.+)$/);
    if (preferenceMatch && request.method() === 'PUT') {
      const eventType = decodeURIComponent(preferenceMatch[1]!);
      const body = request.postDataJSON() as Record<string, unknown>;
      preferences = preferences.map((item) =>
        item.eventType === eventType
          ? { ...item, ...body, updatedAt: NOW }
          : item,
      );
      opts?.onPreferenceUpdate?.(eventType, body);
      const updated = preferences.find((item) => item.eventType === eventType);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: updated }),
      });
      return;
    }

    if (pathname === '/api/audits' && request.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
      return;
    }

    if (pathname === '/api/users' && request.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
      return;
    }

    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Not mocked', path: pathname }),
    });
  });
}

test.describe('In-app notification workflows', () => {
  test('notification bell shows unread badge and panel content', async ({ page }) => {
    await loginAsRole(page, 'ORG_ADMIN');
    await mockNotificationApi(page, {
      notifications: [
        buildNotification({
          id: 'notif-critical',
          title: 'Critical audit reminder',
          severity: 'critical',
          eventType: 'audit.reminder',
        }),
        buildNotification({
          id: 'notif-read',
          title: 'Read framework update',
          eventType: 'framework.activated',
          readAt: NOW,
        }),
      ],
    });

    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('button[title="Notifications"]')).toContainText('1');
    await page.locator('button[title="Notifications"]').click();
    const panel = page.getByRole('dialog');
    await expect(panel.getByRole('button', { name: /critical audit reminder/i })).toBeVisible();
    await expect(panel.getByRole('link', { name: /view all/i })).toBeVisible();
    await expect(panel.getByRole('link', { name: /^settings$/i })).toBeVisible();
  });

  test('opening a notification marks it read and routes to the target page', async ({ page }) => {
    const markedRead: string[] = [];

    await loginAsRole(page, 'ORG_ADMIN');
    await mockNotificationApi(page, {
      notifications: [
        buildNotification({
          id: 'notif-audit',
          title: 'Audit evidence overdue',
          body: 'Audit evidence needs attention',
          severity: 'warning',
          eventType: 'audit.reminder',
          resourceType: 'audit',
          resourceId: 'audit-99',
        }),
      ],
      onMarkRead: (notificationId) => {
        markedRead.push(notificationId);
      },
    });

    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /audit evidence overdue/i }).click();

    await expect.poll(() => markedRead).toContain('notif-audit');
    await expect(page).toHaveURL(/\/compliance\/audits$/);
  });

  test('notifications inbox filters items and mark all read clears unread results', async ({ page }) => {
    let markAllCount = 0;

    await loginAsRole(page, 'ORG_ADMIN');
    await mockNotificationApi(page, {
      notifications: [
        buildNotification({
          id: 'notif-audit',
          title: 'Audit reminder',
          eventType: 'audit.reminder',
          severity: 'critical',
        }),
        buildNotification({
          id: 'notif-risk',
          title: 'Risk escalated',
          eventType: 'risk.critical',
          severity: 'critical',
          readAt: NOW,
        }),
        buildNotification({
          id: 'notif-test',
          title: 'Test assigned',
          eventType: 'test.assigned',
          severity: 'info',
        }),
      ],
      onMarkAllRead: () => {
        markAllCount += 1;
      },
    });

    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');

    const inbox = page.locator('#main-content');

    await expect(inbox.getByRole('button', { name: /audit reminder/i })).toBeVisible();
    await expect(inbox.getByRole('button', { name: /risk escalated/i })).toBeVisible();
    await expect(inbox.getByRole('button', { name: /test assigned/i })).toBeVisible();

    await page.getByRole('tab', { name: /unread/i }).click();
    await expect(inbox.getByRole('button', { name: /audit reminder/i })).toBeVisible();
    await expect(inbox.getByRole('button', { name: /test assigned/i })).toBeVisible();
    await expect(inbox.getByRole('button', { name: /risk escalated/i })).toHaveCount(0);

    await page.getByRole('tab', { name: /critical/i }).click();
    await expect(inbox.getByRole('button', { name: /audit reminder/i })).toBeVisible();
    await expect(inbox.getByRole('button', { name: /risk escalated/i })).toBeVisible();
    await expect(inbox.getByRole('button', { name: /test assigned/i })).toHaveCount(0);

    await page.getByRole('button', { name: /mark all read/i }).click();
    await expect.poll(() => markAllCount).toBe(1);

    await page.getByRole('tab', { name: /unread/i }).click();
    await expect(inbox.getByRole('button', { name: /audit reminder/i })).toHaveCount(0);
    await expect(inbox.getByRole('button', { name: /test assigned/i })).toHaveCount(0);
    await expect(
      inbox.getByRole('heading', { name: /nothing to review right now/i }),
    ).toBeVisible();
  });

  test('notification settings updates channel preferences and digest mode', async ({ page }) => {
    const preferenceUpdates: Array<{ eventType: string; body: Record<string, unknown> }> = [];

    await loginAsRole(page, 'ORG_ADMIN');
    await mockNotificationApi(page, {
      notifications: [],
      preferences: [
        buildPreference({
          eventType: 'test.failed',
          inAppEnabled: true,
          emailEnabled: true,
          slackEnabled: false,
          digestMode: 'immediate',
        }),
        buildPreference({
          eventType: 'audit.reminder',
          inAppEnabled: true,
          emailEnabled: false,
          slackEnabled: false,
          digestMode: 'daily',
        }),
      ],
      onPreferenceUpdate: (eventType, body) => {
        preferenceUpdates.push({ eventType, body });
      },
    });

    await page.goto('/settings/notifications');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Tests' })).toBeVisible();
    await expect(page.getByText('Test failed')).toBeVisible();

    await page.getByRole('switch', { name: 'In-app' }).first().click();
    await expect.poll(() => preferenceUpdates).toContainEqual({
      eventType: 'test.failed',
      body: { inAppEnabled: false },
    });

    await page.getByRole('combobox').first().click();
    await page.getByRole('option', { name: /weekly/i }).click();
    await expect.poll(() => preferenceUpdates).toContainEqual({
      eventType: 'test.failed',
      body: { digestMode: 'weekly' },
    });
  });
});
