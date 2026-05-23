import { test, expect, type Page } from '@playwright/test';
import { loginAsRole } from './helpers/role-workflows';

type AuditRecord = {
  id: string;
  name: string;
  type: 'INTERNAL' | 'EXTERNAL' | 'SURVEILLANCE' | 'RECERTIFICATION';
  frameworkName: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  startDate: string;
  endDate: string | null;
  status: 'DRAFT' | 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED';
  assignedAuditorId: string | null;
  externalAuditorEmail: string | null;
  ownerId: string;
  organizationId: string;
  createdAt: string;
  closedAt: string | null;
  executiveSummary: string | null;
  auditConclusion: string | null;
  signedPdfUrl: string | null;
  signedAt: string | null;
  signedById: string | null;
  isLocked: boolean;
  findings: Array<{
    id: string;
    auditId: string;
    controlId: string;
    severity: 'MINOR' | 'MAJOR' | 'OBSERVATION' | 'OFI';
    description: string;
    remediation: string | null;
    status: string;
    createdAt: string;
    control?: { id: string; isoReference: string; title: string };
  }>;
  auditControls?: Array<{
    id: string;
    auditId: string;
    controlId: string;
    reviewStatus: 'PENDING' | 'COMPLIANT' | 'NON_COMPLIANT' | 'NOT_APPLICABLE';
    reviewedBy: string | null;
    reviewedAt: string | null;
    notes: string | null;
    control: {
      id: string;
      isoReference: string;
      title: string;
      status: string;
      description?: string;
      evidence?: Array<{
        id: string;
        type: string;
        fileName?: string | null;
        fileUrl?: string | null;
        automated?: boolean;
        createdAt: string;
      }>;
      policyMappings?: unknown[];
      riskMappings?: unknown[];
      testMappings?: unknown[];
      findings?: unknown[];
      auditEvidences?: Array<{
        id: string;
        evidenceId: string;
        status: string;
        flagReason?: string | null;
        flaggedAt?: string | null;
        approvedAt?: string | null;
      }>;
    };
  }>;
  _count?: { auditControls: number };
};

const NOW = '2026-04-18T10:00:00.000Z';
const ORG_ID = 'org-demo-1';
const ORG_ADMIN_ID = '8f85f0af-6ed2-4bc5-a58d-20d95b3a8e01';
const AUDITOR_ID = 'c6c28d7f-4a35-4f05-8e39-830c6afb3553';
const CONTRIBUTOR_ID = '8b38f302-c5c8-43cf-bdda-90f5f7a57c82';

const users = [
  {
    id: ORG_ADMIN_ID,
    email: 'org.admin@example.com',
    name: 'Org Admin',
    role: 'ORG_ADMIN',
    organizationId: ORG_ID,
    createdAt: NOW,
    gitAccounts: [],
  },
  {
    id: AUDITOR_ID,
    email: 'auditor.jane@example.com',
    name: 'Auditor Jane',
    role: 'AUDITOR',
    organizationId: ORG_ID,
    createdAt: NOW,
    gitAccounts: [],
  },
  {
    id: CONTRIBUTOR_ID,
    email: 'contributor@example.com',
    name: 'Contributor Chris',
    role: 'CONTRIBUTOR',
    organizationId: ORG_ID,
    createdAt: NOW,
    gitAccounts: [],
  },
];

const controls = [
  {
    id: '27ea00b1-69b3-4880-8408-2ca5c230bc3c',
    isoReference: 'A.5.17',
    title: 'Authentication information',
  },
  {
    id: '9e535ccb-58ff-4608-81d6-7b6f6c6278e4',
    isoReference: 'A.8.1',
    title: 'User endpoint security',
  },
];

function buildAudit(overrides: Partial<AuditRecord> = {}): AuditRecord {
  return {
    id: 'a4d7ca4a-f96b-4eeb-ad9d-1548fc7e2b1a',
    name: 'Q2 External Audit',
    type: 'EXTERNAL',
    frameworkName: 'ISO 27001',
    periodStart: '2026-01-01',
    periodEnd: '2026-03-31',
    startDate: '2026-04-20',
    endDate: '2026-04-30',
    status: 'PLANNED',
    assignedAuditorId: AUDITOR_ID,
    externalAuditorEmail: null,
    ownerId: ORG_ADMIN_ID,
    organizationId: ORG_ID,
    createdAt: NOW,
    closedAt: null,
    executiveSummary: null,
    auditConclusion: null,
    signedPdfUrl: null,
    signedAt: null,
    signedById: null,
    isLocked: false,
    findings: [],
    auditControls: [
      {
        id: 'audit-control-1',
        auditId: 'a4d7ca4a-f96b-4eeb-ad9d-1548fc7e2b1a',
        controlId: controls[0].id,
        reviewStatus: 'PENDING',
        reviewedBy: null,
        reviewedAt: null,
        notes: null,
        control: {
          id: controls[0].id,
          isoReference: controls[0].isoReference,
          title: controls[0].title,
          status: 'IMPLEMENTED',
          description: 'Authentication controls are documented.',
          evidence: [],
          policyMappings: [],
          riskMappings: [],
          testMappings: [],
          findings: [],
          auditEvidences: [],
        },
      },
    ],
    _count: { auditControls: 1 },
    ...overrides,
  };
}

async function mockAuditApis(
  page: Page,
  options?: {
    initialAudits?: AuditRecord[];
    onCreate?: (payload: Record<string, unknown>) => void;
  },
): Promise<void> {
  const audits = [...(options?.initialAudits ?? [])];

  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (!url.pathname.startsWith('/api/')) {
      await route.continue();
      return;
    }

    const method = request.method();

    if (url.pathname === '/api/setup/setup-status') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ canSetup: false, setup: true }),
      });
      return;
    }

    if (url.pathname === '/api/users' && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: users }),
      });
      return;
    }

    if (url.pathname === '/api/controls' && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: controls }),
      });
      return;
    }

    if (url.pathname === '/api/audits' && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: audits }),
      });
      return;
    }

    if (url.pathname === '/api/audits' && method === 'POST') {
      const payload = (request.postDataJSON() ?? {}) as Record<string, unknown>;
      options?.onCreate?.(payload);
      const created = buildAudit({
        id: '81c13f81-0d57-4cf8-a2f7-f6165bfadfd8',
        name: String(payload.name ?? 'Untitled Audit'),
        type: (payload.type as AuditRecord['type']) ?? 'INTERNAL',
        frameworkName:
          (payload.frameworkName as string | undefined) ?? 'ISO 27001',
        startDate: String(payload.startDate ?? '2026-04-20'),
        endDate: (payload.endDate as string | undefined) ?? null,
        assignedAuditorId:
          (payload.assignedAuditorId as string | undefined) ?? null,
        externalAuditorEmail:
          (payload.externalAuditorEmail as string | undefined) ?? null,
      });
      audits.unshift(created);
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: created }),
      });
      return;
    }

    const auditIdMatch = url.pathname.match(/^\/api\/audits\/([^/]+)$/);
    if (auditIdMatch && method === 'GET') {
      const audit =
        audits.find((item) => item.id === auditIdMatch[1]) ??
        buildAudit({ id: auditIdMatch[1] });
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: audit }),
      });
      return;
    }

    const reportMatch = url.pathname.match(/^\/api\/audits\/([^/]+)\/report$/);
    if (reportMatch && method === 'GET') {
      const audit =
        audits.find((item) => item.id === reportMatch[1]) ??
        buildAudit({ id: reportMatch[1], status: 'IN_PROGRESS' });
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            audit,
            metrics: {
              totalControls: audit._count?.auditControls ?? 1,
              compliantControls: 0,
              nonCompliantControls: 0,
              notApplicableControls: 0,
              pendingControls: audit._count?.auditControls ?? 1,
              compliancePct: 0,
              totalFindings: audit.findings.length,
              openFindings: audit.findings.length,
              closedFindings: 0,
              majorFindings: 0,
              minorFindings: 0,
              observationFindings: 0,
              ofiFindings: 0,
            },
          },
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [] }),
    });
  });
}

async function openScheduleAuditModal(page: Page): Promise<void> {
  await page.goto('/compliance/audits');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: /schedule/i }).click();
}

async function fillScheduleStepOne(
  page: Page,
  auditName: string,
): Promise<void> {
  await page
    .getByPlaceholder('e.g. ISO 27001 Annual Surveillance Audit')
    .fill(auditName);
  await page.locator('input[type="date"]').nth(2).fill('2026-04-20');
  await page.getByRole('button', { name: /scope & auditor/i }).click();
}

test.describe('Audit workflow UX regressions', () => {
  test('newly scheduled audit should show the assigned auditor name in the audits list', async ({
    page,
  }) => {
    await loginAsRole(page, 'ORG_ADMIN');
    await mockAuditApis(page);

    await openScheduleAuditModal(page);
    await fillScheduleStepOne(page, 'ISO Recertification 2026');
    await page.locator('select').last().selectOption(AUDITOR_ID);
    await page.getByRole('button', { name: /create audit/i }).click();

    await expect(page.getByText('ISO Recertification 2026')).toBeVisible();
    await expect(page.getByText('Auditor Jane')).toBeVisible();
  });

  test('audit detail should show who the assigned auditor is', async ({
    page,
  }) => {
    await loginAsRole(page, 'ORG_ADMIN');
    const audit = buildAudit({ status: 'IN_PROGRESS' });
    await mockAuditApis(page, { initialAudits: [audit] });

    await page.goto(`/compliance/audits/${audit.id}`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Auditor Jane')).toBeVisible();
  });

  test('audit final report should display the auditor name, not the raw internal user id', async ({
    page,
  }) => {
    await loginAsRole(page, 'ORG_ADMIN');
    const audit = buildAudit({ status: 'IN_PROGRESS' });
    await mockAuditApis(page, { initialAudits: [audit] });

    await page.goto(`/auditor/audits/${audit.id}/final-report`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Auditor Jane')).toBeVisible();
  });

  test('external audit scheduling should block submission until auditor contact details are provided', async ({
    page,
  }) => {
    await loginAsRole(page, 'ORG_ADMIN');
    let createCount = 0;
    await mockAuditApis(page, {
      onCreate: () => {
        createCount += 1;
      },
    });

    await openScheduleAuditModal(page);
    await fillScheduleStepOne(page, 'Vendor Surveillance Audit');
    await page.locator('input[type="radio"]').nth(3).check();
    await page.getByRole('button', { name: /create audit/i }).click();

    await expect.poll(() => createCount).toBe(0);
  });

  test('IN_PROGRESS auditor dashboard shows Move to Awaiting Report button', async ({
    page,
  }) => {
    await loginAsRole(page, 'ORG_ADMIN');
    const audit = buildAudit({ status: 'IN_PROGRESS' });
    await mockAuditApis(page, { initialAudits: [audit] });

    await page.goto(`/auditor/dashboard?auditId=${audit.id}`);
    await page.waitForLoadState('networkidle');

    await expect(
      page.getByRole('button', { name: /move to awaiting report/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /^final report$/i }),
    ).toBeVisible();
  });

  test('AWAITING_REPORT auditor dashboard shows Open Final Report button instead of Move', async ({
    page,
  }) => {
    await loginAsRole(page, 'ORG_ADMIN');
    const audit = buildAudit({ status: 'AWAITING_REPORT' });
    await mockAuditApis(page, { initialAudits: [audit] });

    await page.goto(`/auditor/dashboard?auditId=${audit.id}`);
    await page.waitForLoadState('networkidle');

    await expect(
      page.getByRole('button', { name: /open final report/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /move to awaiting report/i }),
    ).not.toBeVisible();
  });

  test('AUDITOR role does not see Start Audit button on admin audit detail', async ({
    page,
  }) => {
    await loginAsRole(page, 'AUDITOR');
    const audit = buildAudit({ status: 'PLANNED' });
    await mockAuditApis(page, { initialAudits: [audit] });

    await page.goto(`/compliance/audits/${audit.id}`);
    await page.waitForLoadState('networkidle');

    // Tab into Report tab where Start Audit lives.
    const reportTab = page.getByRole('tab', { name: /report/i });
    if (await reportTab.isVisible()) {
      await reportTab.click();
    }

    await expect(
      page.getByRole('button', { name: /start audit/i }),
    ).not.toBeVisible();
  });

  test('Final Report Sign & Complete button is hidden in IN_PROGRESS and visible in AWAITING_REPORT', async ({
    page,
  }) => {
    await loginAsRole(page, 'ORG_ADMIN');
    const inProgressAudit = buildAudit({ status: 'IN_PROGRESS' });
    await mockAuditApis(page, { initialAudits: [inProgressAudit] });

    await page.goto(`/auditor/audits/${inProgressAudit.id}/final-report`);
    await page.waitForLoadState('networkidle');

    await expect(
      page.getByRole('button', { name: /sign & complete audit/i }),
    ).not.toBeVisible();

    // Now an AWAITING_REPORT audit: Sign & Complete should be visible.
    const awaitingAudit = buildAudit({
      id: '11111111-2222-3333-4444-555555555555',
      status: 'AWAITING_REPORT',
    });
    await mockAuditApis(page, { initialAudits: [awaitingAudit] });

    await page.goto(`/auditor/audits/${awaitingAudit.id}/final-report`);
    await page.waitForLoadState('networkidle');

    await expect(
      page.getByRole('button', { name: /sign & complete audit/i }),
    ).toBeVisible();
  });
});
