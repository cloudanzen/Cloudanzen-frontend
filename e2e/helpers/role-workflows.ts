import { type Page, expect } from '@playwright/test';

export type AppRole =
  | 'SUPER_ADMIN'
  | 'ORG_ADMIN'
  | 'SECURITY_OWNER'
  | 'AUDITOR'
  | 'CONTRIBUTOR'
  | 'VIEWER';

type MockHandler = {
  method?: string;
  pattern: RegExp;
  status?: number;
  body?: unknown;
};

type UserShape = {
  id: string;
  email: string;
  name: string;
  role: AppRole;
  organizationId: string;
  createdAt: string;
};

const ORG_ID = 'org-demo-1';
const NOW = '2026-04-18T10:00:00.000Z';

export const USERS: Record<AppRole, UserShape> = {
  SUPER_ADMIN: {
    id: 'user-super-admin',
    email: 'super.admin@example.com',
    name: 'Super Admin',
    role: 'SUPER_ADMIN',
    organizationId: ORG_ID,
    createdAt: NOW,
  },
  ORG_ADMIN: {
    id: 'user-org-admin',
    email: 'org.admin@example.com',
    name: 'Org Admin',
    role: 'ORG_ADMIN',
    organizationId: ORG_ID,
    createdAt: NOW,
  },
  SECURITY_OWNER: {
    id: 'user-security-owner',
    email: 'security.owner@example.com',
    name: 'Security Owner',
    role: 'SECURITY_OWNER',
    organizationId: ORG_ID,
    createdAt: NOW,
  },
  AUDITOR: {
    id: 'user-auditor',
    email: 'auditor@example.com',
    name: 'Auditor',
    role: 'AUDITOR',
    organizationId: ORG_ID,
    createdAt: NOW,
  },
  CONTRIBUTOR: {
    id: 'user-contributor',
    email: 'contributor@example.com',
    name: 'Contributor',
    role: 'CONTRIBUTOR',
    organizationId: ORG_ID,
    createdAt: NOW,
  },
  VIEWER: {
    id: 'user-viewer',
    email: 'viewer@example.com',
    name: 'Viewer',
    role: 'VIEWER',
    organizationId: ORG_ID,
    createdAt: NOW,
  },
};

const adminOrganizations = {
  success: true,
  data: [
    {
      id: ORG_ID,
      name: 'Demo Org',
      createdAt: NOW,
      userCount: 3,
      controlCount: 42,
      policyCount: 9,
      activeFrameworks: 2,
    },
  ],
};

const adminOrganizationDetail = {
  success: true,
  data: {
    id: ORG_ID,
    name: 'Demo Org',
    createdAt: NOW,
    users: [USERS.SUPER_ADMIN, USERS.ORG_ADMIN, USERS.AUDITOR].map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    })),
    frameworks: [
      {
        id: 'fw-iso-27001',
        slug: 'iso-27001',
        name: 'ISO 27001',
        version: '2022',
        status: 'active',
        activatedAt: NOW,
      },
    ],
    allowedFrameworks: [
      {
        id: 'fw-iso-27001',
        slug: 'iso-27001',
        name: 'ISO 27001',
        version: '2022',
      },
    ],
    counts: {
      controls: 42,
      policies: 9,
      risks: 5,
    },
  },
};

const adminFrameworks = {
  success: true,
  data: [
    {
      id: 'fw-iso-27001',
      slug: 'iso-27001',
      name: 'ISO 27001',
      version: '2022',
      requirementCount: 93,
    },
  ],
};

const usersList = {
  success: true,
  data: [
    {
      ...USERS.SUPER_ADMIN,
      gitAccounts: [],
    },
    {
      ...USERS.ORG_ADMIN,
      gitAccounts: [],
    },
    {
      ...USERS.AUDITOR,
      gitAccounts: [],
    },
  ],
};

const onboardingList = {
  success: true,
  data: [
    {
      id: USERS.SUPER_ADMIN.id,
      onboarding: { allComplete: true },
    },
    {
      id: USERS.ORG_ADMIN.id,
      onboarding: { allComplete: true },
    },
    {
      id: USERS.AUDITOR.id,
      onboarding: { allComplete: false },
    },
  ],
};

const auditRecord = {
  id: 'audit-1',
  name: 'ISO 27001 External Audit',
  type: 'EXTERNAL',
  frameworkName: 'ISO 27001',
  periodStart: '2026-01-01',
  periodEnd: '2026-03-31',
  startDate: '2026-04-01',
  endDate: '2026-04-30',
  status: 'IN_PROGRESS',
  assignedAuditorId: USERS.AUDITOR.id,
  externalAuditorEmail: USERS.AUDITOR.email,
  ownerId: USERS.ORG_ADMIN.id,
  organizationId: ORG_ID,
  createdAt: NOW,
  closedAt: null,
  executiveSummary: null,
  auditConclusion: null,
  signedPdfUrl: null,
  signedAt: null,
  signedById: null,
  isLocked: false,
  findings: [
    {
      id: 'finding-1',
      auditId: 'audit-1',
      controlId: 'control-1',
      severity: 'MAJOR',
      description: 'MFA evidence expired',
      remediation: 'Upload current MFA evidence',
      status: 'OPEN',
      createdAt: NOW,
      control: {
        id: 'control-1',
        isoReference: 'A.5.17',
        title: 'Authentication information',
      },
    },
  ],
};

const auditControls = {
  success: true,
  data: [
    {
      id: 'audit-control-1',
      auditId: 'audit-1',
      controlId: 'control-1',
      reviewStatus: 'PENDING',
      reviewedBy: null,
      reviewedAt: null,
      notes: null,
      control: {
        id: 'control-1',
        isoReference: 'A.5.17',
        title: 'Authentication information',
        status: 'IMPLEMENTED',
        description: 'Ensure authentication methods are managed securely.',
        evidence: [
          {
            id: 'evidence-1',
            type: 'FILE',
            fileName: 'mfa-policy.pdf',
            fileUrl: '/files/mfa-policy.pdf',
            automated: false,
            createdAt: NOW,
          },
        ],
        policyMappings: [],
        riskMappings: [],
        testMappings: [],
        findings: [],
        auditEvidences: [
          {
            id: 'audit-evidence-1',
            evidenceId: 'evidence-1',
            status: 'READY',
            flagReason: null,
            flaggedAt: null,
            approvedAt: null,
          },
        ],
      },
    },
  ],
};

const reportPayload = {
  success: true,
  data: {
    audit: auditRecord,
    metrics: {
      totalControls: 1,
      compliantControls: 0,
      nonCompliantControls: 0,
      notApplicableControls: 0,
      pendingControls: 1,
      compliancePct: 0,
      totalFindings: 1,
      openFindings: 1,
      closedFindings: 0,
      majorFindings: 1,
      minorFindings: 0,
      observationFindings: 0,
      ofiFindings: 0,
    },
  },
};

const commentsPayload = {
  success: true,
  data: [
    {
      id: 'comment-1',
      auditId: 'audit-1',
      controlId: 'control-1',
      authorId: USERS.AUDITOR.id,
      text: 'Please upload the latest evidence pack.',
      createdAt: NOW,
      author: {
        id: USERS.AUDITOR.id,
        name: USERS.AUDITOR.name,
        email: USERS.AUDITOR.email,
        role: USERS.AUDITOR.role,
      },
    },
  ],
};

const partnerCatalogue = {
  data: [
    {
      provider: 'Wiz',
      category: 'Cloud Security',
      logoUrl: null,
      status: 'available',
    },
  ],
  count: 1,
};

export async function mockRoleApi(page: Page): Promise<void> {
  const handlers: MockHandler[] = [
    { pattern: /\/api\/setup\/setup-status$/, body: { canSetup: false, setup: true } },
    { pattern: /\/api\/users$/, body: usersList },
    { pattern: /\/api\/onboarding\/users$/, body: onboardingList },
    { pattern: /\/api\/admin\/organizations$/, body: adminOrganizations },
    { pattern: /\/api\/admin\/organizations\/[^/]+$/, body: adminOrganizationDetail },
    { pattern: /\/api\/admin\/frameworks$/, body: adminFrameworks },
    { pattern: /\/api\/audits(\?.*)?$/, body: { success: true, data: [auditRecord] } },
    { pattern: /\/api\/audits\/audit-1\/controls$/, body: auditControls },
    { pattern: /\/api\/audits\/audit-1\/report$/, body: reportPayload },
    { pattern: /\/api\/audits\/audit-1\/comments(\?.*)?$/, body: commentsPayload },
    { pattern: /\/api\/partner\/keys$/, body: { data: [] } },
    { pattern: /\/api\/partner\/results$/, body: { data: [], total: 0 } },
    { pattern: /\/api\/partner\/catalogue$/, body: partnerCatalogue },
    { pattern: /\/api\/partner\/tool-requests$/, body: { data: [], total: 0 } },
  ];

  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (!url.pathname.startsWith('/api/')) {
      await route.continue();
      return;
    }

    const handler = handlers.find((candidate) => {
      const methodMatches = !candidate.method || candidate.method === request.method();
      return methodMatches && candidate.pattern.test(url.pathname + url.search);
    });

    if (!handler) {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Not mocked', path: url.pathname }),
      });
      return;
    }

    await route.fulfill({
      status: handler.status ?? 200,
      contentType: 'application/json',
      body: JSON.stringify(handler.body ?? {}),
    });
  });
}

export async function loginAsRole(page: Page, role: AppRole): Promise<void> {
  const user = USERS[role];

  await page.addInitScript((currentUser) => {
    window.sessionStorage.setItem('isms_token', 'test-token');
    window.sessionStorage.setItem('isms_user', JSON.stringify(currentUser));
    window.localStorage.removeItem('isms_token');
    window.localStorage.removeItem('isms_user');
  }, user);
}

export async function expectSidebarRoleLabel(page: Page, roleLabel: string): Promise<void> {
  await expect(page.getByText(roleLabel, { exact: true })).toBeVisible();
}
