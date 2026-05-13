import type { Page } from '@playwright/test';

export const smokeUser = {
  id: 'smoke-user-1',
  email: 'smoke.admin@cloudanzen.test',
  name: 'Smoke Admin',
  role: 'ORG_ADMIN',
  organizationId: 'smoke-org-1',
  preferredLocale: 'en',
  createdAt: '2026-05-13T00:00:00.000Z',
};

const dashboardSummary = {
  success: true,
  sections: {
    compliance: {
      data: {
        total: 18,
        implemented: 12,
        partiallyImplemented: 4,
        notImplemented: 2,
        compliancePercentage: 67,
      },
    },
    risks: {
      data: {
        total: 3,
        open: 2,
        monitoring: 1,
        closed: 0,
        statusBreakdown: [],
        categoryBreakdown: [],
        severityBreakdown: [
          { label: 'CRITICAL', count: 0 },
          { label: 'HIGH', count: 1 },
          { label: 'MEDIUM', count: 1 },
          { label: 'LOW', count: 1 },
        ],
        sourceBreakdown: [],
        recentEntries: [],
      },
    },
    frameworks: {
      data: [
        {
          slug: 'soc-2',
          name: 'SOC 2',
          controlCoveragePct: 82,
          openGaps: 3,
          covered: 14,
          applicable: 17,
        },
      ],
    },
    tests: {
      data: {
        total: 9,
        completed: 7,
        passPercentage: 78,
        overdue: 1,
        dueSoon: 2,
      },
    },
    policies: {
      data: {
        total: 5,
        published: 4,
        draft: 1,
        review: 0,
      },
    },
    documents: {
      data: {
        total: 4,
        pending: 1,
        current: 3,
        needsReview: 0,
        expired: 0,
      },
    },
    vendors: {
      data: {
        total: 2,
        needAttention: 1,
      },
    },
  },
};

export async function seedSmokeSession(page: Page) {
  await page.addInitScript((user) => {
    window.sessionStorage.setItem('isms_token', 'smoke-token');
    window.sessionStorage.setItem('isms_user', JSON.stringify(user));
  }, smokeUser);
}

export async function mockSmokeApi(page: Page) {
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    const json = (body: unknown, status = 200) =>
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });

    if (url.pathname === '/api/setup/setup-status') {
      return json({
        setup: true,
        setupComplete: true,
        userCount: 1,
        organizationCount: 1,
        canSetup: false,
      });
    }

    if (url.pathname === '/api/auth/login' && method === 'POST') {
      return json({
        token: 'smoke-token',
        user: smokeUser,
      });
    }

    if (url.pathname === '/api/auth/me') {
      return json({
        success: true,
        data: smokeUser,
        user: smokeUser,
      });
    }

    if (url.pathname === '/api/dashboard/summary') {
      return json(dashboardSummary);
    }

    if (url.pathname === '/api/notifications/unread-count') {
      return json({
        success: true,
        data: { count: 0 },
      });
    }

    if (url.pathname === '/api/notifications') {
      return json({
        success: true,
        data: { notifications: [], total: 0 },
      });
    }

    return json({});
  });
}
