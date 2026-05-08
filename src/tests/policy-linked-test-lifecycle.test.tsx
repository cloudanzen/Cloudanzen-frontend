import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PolicyLinkedTestLifecycle } from '@/app/pages/tests/testDetail/PolicyLinkedTestLifecycle';
import type { TestRecord } from '@/services/api/tests';

const mocks = vi.hoisted(() => ({
  getPolicy: vi.fn(),
  getVersions: vi.fn(),
  getApprovals: vi.fn(),
  getAcceptances: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  initReactI18next: {
    type: '3rdParty',
    init: vi.fn(),
  },
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (typeof options?.defaultValue === 'string')
        return options.defaultValue;
      if (typeof options?.version === 'number')
        return `${key}:${options.version}`;
      if (typeof options?.count === 'number') return `${key}:${options.count}`;
      return key;
    },
  }),
}));

vi.mock('@/services/api/policies', () => ({
  policiesService: {
    getPolicy: mocks.getPolicy,
    getVersions: mocks.getVersions,
    getApprovals: mocks.getApprovals,
    getAcceptances: mocks.getAcceptances,
  },
}));

vi.mock('@/lib/format-date', () => ({
  fmtDate: (value?: string | null) => value ?? '—',
  fmtDateTime: (value?: string | null) => value ?? '—',
}));

const baseTest: TestRecord = {
  id: 'test-1',
  name: 'Review access policy',
  category: 'Policy',
  type: 'Document',
  status: 'Due_soon',
  ownerId: 'user-1',
  dueDate: '2026-05-20T00:00:00.000Z',
  nextDueDate: null,
  recurrenceRule: null,
  completedAt: null,
  organizationId: 'org-1',
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-01T00:00:00.000Z',
  riskEngineTestId: null,
  policyId: 'policy-1',
  testKey: 'policy-review-policy-1',
  controls: [],
  frameworks: [],
  audits: [],
  evidences: [],
};

function renderLifecycle(test: TestRecord = baseTest) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={client}>
      <PolicyLinkedTestLifecycle
        test={test}
        policyId="policy-1"
        initialPolicy={test.policy}
        onOpenPolicy={vi.fn()}
      />
    </QueryClientProvider>,
  );
}

describe('PolicyLinkedTestLifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getPolicy.mockResolvedValue({
      success: true,
      data: {
        id: 'policy-1',
        name: 'Access Policy',
        status: 'PUBLISHED',
        version: '1.0',
        versionNumber: 2,
        documentUrl: '/policy.html',
        pdfUrl: null,
        recurrenceMonths: 12,
        renewalDate: '2026-06-01T00:00:00.000Z',
        lastRenewedAt: '2026-01-01T00:00:00.000Z',
        organizationId: 'org-1',
        ownerId: 'user-1',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    });
    mocks.getVersions.mockResolvedValue({
      success: true,
      data: [
        {
          id: 'version-2',
          policyId: 'policy-1',
          versionNumber: 2,
          name: 'Access Policy',
          documentUrl: '/policy-v2.html',
          pdfUrl: null,
          status: 'PUBLISHED',
          publishedBy: 'user-1',
          publishedAt: '2026-01-02T00:00:00.000Z',
          changelog: 'Annual review',
          locales: [],
        },
      ],
    });
    mocks.getApprovals.mockResolvedValue({
      success: true,
      data: [
        {
          id: 'approval-1',
          policyId: 'policy-1',
          approvalRound: 1,
          approverId: 'user-2',
          approver: { id: 'user-2', name: 'Alice', email: 'alice@example.com' },
          status: 'APPROVED',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    });
    mocks.getAcceptances.mockResolvedValue({
      success: true,
      data: [
        {
          id: 'acceptance-1',
          policyId: 'policy-1',
          versionNumber: 2,
          userId: 'user-3',
          user: { id: 'user-3', name: 'Bob', email: 'bob@example.com' },
          status: 'PENDING',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    });
  });

  it('renders lifecycle content for policy-linked tests', async () => {
    renderLifecycle();

    expect((await screen.findAllByText('PUBLISHED')).length).toBeGreaterThan(0);
    expect(
      screen.getByText('testDetail.policyLifecycle.openPolicy'),
    ).toBeInTheDocument();
    expect(
      (await screen.findAllByText('Annual review')).length,
    ).toBeGreaterThan(0);
    expect(await screen.findByText('Bob')).toBeInTheDocument();
  });

  it('keeps sections visible when approvals fail', async () => {
    mocks.getApprovals.mockRejectedValue(new Error('forbidden'));

    renderLifecycle();

    expect(
      await screen.findByText('testDetail.policyLifecycle.approvalsFailed'),
    ).toBeInTheDocument();
    expect(
      (await screen.findAllByText('Annual review')).length,
    ).toBeGreaterThan(0);
    expect(await screen.findByText('Bob')).toBeInTheDocument();
  });

  it('shows an unavailable state when the canonical policy and seed are missing', async () => {
    mocks.getPolicy.mockRejectedValue(new Error('not found'));

    renderLifecycle({ ...baseTest, policy: null });

    await waitFor(() => {
      expect(
        screen.getByText('testDetail.policyLifecycle.unavailableTitle'),
      ).toBeInTheDocument();
    });
  });
});
