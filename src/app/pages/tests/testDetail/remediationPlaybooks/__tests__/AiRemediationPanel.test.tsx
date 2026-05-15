import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';

const { mocks, FakeApiError } = vi.hoisted(() => {
  class FakeApiError extends Error {
    constructor(
      public error: string,
      public override message: string,
      public statusCode: number,
    ) {
      super(message);
    }
  }
  return {
    mocks: {
      getConfig: vi.fn(),
      generateAiRemediation: vi.fn(),
    },
    FakeApiError,
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/services/api/ai', () => ({
  aiService: {
    getConfig: mocks.getConfig,
  },
}));

vi.mock('@/services/api/tests', () => ({
  testsService: {
    generateAiRemediation: mocks.generateAiRemediation,
  },
}));

vi.mock('@/services/api/client', () => ({
  ApiError: FakeApiError,
}));

import { AiRemediationPanel } from '../AiRemediationPanel';

function renderPanel() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <MemoryRouter>
      <QueryClientProvider client={client}>
        <AiRemediationPanel testId="test-1" />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  mocks.getConfig.mockReset();
  mocks.generateAiRemediation.mockReset();
});

describe('AiRemediationPanel', () => {
  it('renders nothing when AI is not configured', async () => {
    mocks.getConfig.mockResolvedValue({ configured: false, enabled: false });
    const { container } = renderPanel();
    await waitFor(() => {
      expect(mocks.getConfig).toHaveBeenCalledTimes(1);
    });
    // Once config resolves, the panel returns null.
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('renders nothing when AI is configured but disabled', async () => {
    mocks.getConfig.mockResolvedValue({ configured: true, enabled: false });
    const { container } = renderPanel();
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('renders the Generate button when configured and enabled', async () => {
    mocks.getConfig.mockResolvedValue({ configured: true, enabled: true });
    renderPanel();
    expect(
      await screen.findByRole('button', { name: 'remediation.ai.generate' }),
    ).toBeInTheDocument();
    expect(mocks.generateAiRemediation).not.toHaveBeenCalled();
  });

  it('calls generateAiRemediation when the button is clicked and renders the result', async () => {
    mocks.getConfig.mockResolvedValue({ configured: true, enabled: true });
    mocks.generateAiRemediation.mockResolvedValue({
      success: true,
      data: {
        generationId: 'gen-1',
        cached: false,
        playbookId: 'aws.no-stale-iam-access-keys',
        playbookVersion: 1,
        model: 'gpt-4o',
        provider: 'openai',
        inputTokens: 800,
        outputTokens: 400,
        outputText: JSON.stringify({
          whatFailed: 'Stale key for user alice',
          fixPath: 'Rotate and deactivate',
          steps: ['Create new key', 'Deactivate old key'],
          evidence: ['list-access-keys output'],
          verify: ['Re-run validation'],
          pitfalls: ['Do not delete user'],
        }),
      },
    });

    renderPanel();
    const button = await screen.findByRole('button', {
      name: 'remediation.ai.generate',
    });
    await userEvent.click(button);

    expect(mocks.generateAiRemediation).toHaveBeenCalledWith('test-1', {
      forceRegenerate: false,
    });

    expect(
      await screen.findByText('remediation.ai.tailoredHeader'),
    ).toBeInTheDocument();
    expect(screen.getByText('Stale key for user alice')).toBeInTheDocument();
    expect(screen.getByText('Create new key')).toBeInTheDocument();
    expect(screen.getByText('Deactivate old key')).toBeInTheDocument();
    // Token total displayed
    expect(screen.getByText(/1200/)).toBeInTheDocument();
  });

  it('shows the BYOK_REQUIRED hint with a link to /settings/ai on 412', async () => {
    mocks.getConfig.mockResolvedValue({ configured: true, enabled: true });
    mocks.generateAiRemediation.mockRejectedValue(
      new FakeApiError('BYOK_REQUIRED', 'BYOK_REQUIRED', 412),
    );

    renderPanel();
    const button = await screen.findByRole('button', {
      name: 'remediation.ai.generate',
    });
    await userEvent.click(button);

    expect(
      await screen.findByText('remediation.ai.errors.byokRequired'),
    ).toBeInTheDocument();
    const cta = screen.getByRole('link', {
      name: 'remediation.ai.errors.byokRequiredCta',
    });
    expect(cta).toHaveAttribute('href', '/settings/ai');
  });

  it('shows the PLAYBOOK_NOT_RESOLVED message on 409', async () => {
    mocks.getConfig.mockResolvedValue({ configured: true, enabled: true });
    mocks.generateAiRemediation.mockRejectedValue(
      new FakeApiError('PLAYBOOK_NOT_RESOLVED', 'PLAYBOOK_NOT_RESOLVED', 409),
    );

    renderPanel();
    await userEvent.click(
      await screen.findByRole('button', { name: 'remediation.ai.generate' }),
    );

    expect(
      await screen.findByText('remediation.ai.errors.noPlaybook'),
    ).toBeInTheDocument();
  });

  it('requires confirmation before force-regenerate and passes forceRegenerate=true', async () => {
    mocks.getConfig.mockResolvedValue({ configured: true, enabled: true });
    const guide = {
      success: true,
      data: {
        generationId: 'gen-1',
        cached: false,
        playbookId: 'p1',
        playbookVersion: 1,
        model: 'gpt-4o',
        provider: 'openai',
        inputTokens: 100,
        outputTokens: 100,
        outputText: '{"whatFailed":"first"}',
      },
    };
    mocks.generateAiRemediation.mockResolvedValueOnce(guide);

    renderPanel();
    await userEvent.click(
      await screen.findByRole('button', { name: 'remediation.ai.generate' }),
    );
    await screen.findByText('first');

    // Regenerate button visible after first generation.
    const regen = screen.getByRole('button', {
      name: 'remediation.ai.regenerate',
    });
    await userEvent.click(regen);

    // Confirmation prompt + Yes button shown; mutation NOT called yet.
    expect(mocks.generateAiRemediation).toHaveBeenCalledTimes(1);
    const confirmYes = screen.getByRole('button', {
      name: 'remediation.ai.regenerateConfirmYes',
    });

    mocks.generateAiRemediation.mockResolvedValueOnce({
      ...guide,
      data: { ...guide.data, outputText: '{"whatFailed":"second"}' },
    });

    await userEvent.click(confirmYes);
    expect(mocks.generateAiRemediation).toHaveBeenCalledTimes(2);
    expect(mocks.generateAiRemediation).toHaveBeenLastCalledWith('test-1', {
      forceRegenerate: true,
    });
  });

  it('renders the raw outputText when JSON parsing fails', async () => {
    mocks.getConfig.mockResolvedValue({ configured: true, enabled: true });
    mocks.generateAiRemediation.mockResolvedValue({
      success: true,
      data: {
        generationId: 'gen-1',
        cached: false,
        playbookId: 'p1',
        playbookVersion: 1,
        model: 'gpt-4o',
        provider: 'openai',
        inputTokens: 50,
        outputTokens: 50,
        outputText: 'This is not JSON, the model misbehaved.',
      },
    });

    renderPanel();
    await userEvent.click(
      await screen.findByRole('button', { name: 'remediation.ai.generate' }),
    );
    expect(
      await screen.findByText('This is not JSON, the model misbehaved.'),
    ).toBeInTheDocument();
  });
});
