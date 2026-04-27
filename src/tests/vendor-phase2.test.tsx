import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';

const mocks = vi.hoisted(() => ({
  listUsers: vi.fn(),
  discoveryList: vi.fn(),
  discoveryPromote: vi.fn(),
  discoveryDismiss: vi.fn(),
  discoveryMerge: vi.fn(),
  vendorsList: vi.fn(),
  intakeCreate: vi.fn(),
  intakeList: vi.fn(),
  intakeDecide: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { count?: number }) =>
      typeof options?.count === 'number' ? `${key}:${options.count}` : key,
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: mocks.toastSuccess,
    error: mocks.toastError,
  },
}));

vi.mock('@/services/api/users', () => ({
  usersService: {
    listUsers: mocks.listUsers,
  },
}));

vi.mock('@/services/api/vendors', () => ({
  vendorsService: {
    list: mocks.vendorsList,
    discovery: {
      list: mocks.discoveryList,
      promote: mocks.discoveryPromote,
      dismiss: mocks.discoveryDismiss,
      merge: mocks.discoveryMerge,
    },
    intake: {
      create: mocks.intakeCreate,
      list: mocks.intakeList,
      decide: mocks.intakeDecide,
    },
  },
}));

import { RequestVendorDialog } from '@/app/pages/vendors/RequestVendorDialog';
import { VendorDiscoveryPage } from '@/app/pages/vendors/VendorDiscoveryPage';
import { VendorIntakeRequestsPage } from '@/app/pages/vendors/VendorIntakeRequestsPage';

function renderWithProviders(node: React.ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <MemoryRouter>
      <QueryClientProvider client={client}>{node}</QueryClientProvider>
    </MemoryRouter>,
  );
}

describe('vendor phase 2 frontend flows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.listUsers.mockResolvedValue([
      { id: 'user-1', name: 'Alice Owner', email: 'alice@example.com' },
    ]);
    mocks.vendorsList.mockResolvedValue([
      { id: 'vendor-1', name: 'Slack' },
      { id: 'vendor-2', name: 'Linear' },
    ]);
    mocks.discoveryList.mockResolvedValue([
      {
        id: 'cand-1',
        organizationId: 'org-1',
        source: 'OKTA',
        externalAppId: 'okta-1',
        appName: 'Notion',
        ssoEnabled: true,
        status: 'PENDING',
        mergedToVendorId: null,
        firstSeenAt: '2026-04-01T00:00:00.000Z',
        lastSeenAt: '2026-04-02T00:00:00.000Z',
      },
    ]);
    mocks.intakeList.mockResolvedValue([
      {
        id: 'req-1',
        organizationId: 'org-1',
        requestedByUserId: 'user-2',
        vendorName: 'Miro',
        vendorWebsite: 'https://miro.com',
        businessJustification: 'Whiteboarding',
        dataAccessRequested: 'Project data',
        expectedUserCount: 12,
        status: 'PENDING',
        reviewedByUserId: null,
        reviewedAt: null,
        reviewerNotes: null,
        createdVendorId: null,
        createdAt: '2026-04-01T00:00:00.000Z',
        updatedAt: '2026-04-01T00:00:00.000Z',
        requester: { id: 'user-2', name: 'Bob Requester', email: 'bob@example.com' },
      },
    ]);
  });

  it('submits a vendor intake request from the request dialog', async () => {
    const user = userEvent.setup();
    mocks.intakeCreate.mockResolvedValue({ id: 'req-99' });

    renderWithProviders(
      <RequestVendorDialog open onOpenChange={() => undefined} />,
    );

    await user.type(screen.getByPlaceholderText('intake.vendorName'), 'Linear');
    await user.type(
      screen.getByPlaceholderText('intake.businessJustification'),
      'Issue tracking',
    );
    await user.click(screen.getByRole('button', { name: 'intake.submit' }));

    await waitFor(() => {
      expect(mocks.intakeCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          vendorName: 'Linear',
          businessJustification: 'Issue tracking',
        }),
      );
    });
    expect(mocks.toastSuccess).toHaveBeenCalled();
  });

  it('promotes a discovery candidate', async () => {
    const user = userEvent.setup();
    mocks.discoveryPromote.mockResolvedValue({
      candidate: { id: 'cand-1' },
      vendor: { id: 'vendor-99', name: 'Notion' },
    });

    renderWithProviders(<VendorDiscoveryPage />);

    expect(await screen.findByText('Notion')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'discovery.promote' }));
    const dialog = screen.getByRole('dialog');
    await user.clear(screen.getByPlaceholderText('dialog.categoryField'));
    await user.type(screen.getByPlaceholderText('dialog.categoryField'), 'Knowledge Base');
    await user.selectOptions(
      within(dialog).getAllByRole('combobox')[0] as HTMLElement,
      'user-1',
    );
    await user.click(within(dialog).getByRole('button', { name: 'discovery.promote' }));

    await waitFor(() => {
      expect(mocks.discoveryPromote).toHaveBeenCalledWith(
        'cand-1',
        expect.objectContaining({
          category: 'Knowledge Base',
          ownerUserId: 'user-1',
        }),
      );
    });
    expect(mocks.toastSuccess).toHaveBeenCalled();
  });

  it('approves an intake request', async () => {
    const user = userEvent.setup();
    mocks.intakeDecide.mockResolvedValue({
      intake: { id: 'req-1', status: 'APPROVED' },
      vendor: { id: 'vendor-55', name: 'Miro' },
    });

    renderWithProviders(<VendorIntakeRequestsPage />);

    expect(await screen.findByText('Miro')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'intake.reviewRequest' }));
    const dialog = screen.getByRole('dialog');
    await user.type(screen.getByPlaceholderText('intake.reviewerNotes'), 'Approved for design collaboration');
    await user.selectOptions(
      within(dialog).getAllByRole('combobox')[1] as HTMLElement,
      'user-1',
    );
    await user.click(within(dialog).getByRole('button', { name: 'intake.submitDecision' }));

    await waitFor(() => {
      expect(mocks.intakeDecide).toHaveBeenCalledWith(
        'req-1',
        expect.objectContaining({
          decision: 'APPROVE',
          ownerUserId: 'user-1',
        }),
      );
    });
    expect(mocks.toastSuccess).toHaveBeenCalled();
  });
});
