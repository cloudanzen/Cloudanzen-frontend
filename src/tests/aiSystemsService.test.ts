import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/services/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import { apiClient } from '@/services/api/client';
import { aiSystemsService } from '@/services/api/aiSystems';
import { aiTrustService } from '@/services/api/aiTrust';

const get = apiClient.get as unknown as ReturnType<typeof vi.fn>;
const post = apiClient.post as unknown as ReturnType<typeof vi.fn>;
const patch = apiClient.patch as unknown as ReturnType<typeof vi.fn>;
const del = apiClient.delete as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('aiSystemsService', () => {
  it('list unwraps { data }', async () => {
    get.mockResolvedValue({ success: true, data: [{ id: 's1' }] });
    await expect(aiSystemsService.list()).resolves.toEqual([{ id: 's1' }]);
    expect(get).toHaveBeenCalledWith('/api/ai/systems');
  });

  it('get hits the id path', async () => {
    get.mockResolvedValue({ success: true, data: { id: 's1' } });
    await expect(aiSystemsService.get('s1')).resolves.toEqual({ id: 's1' });
    expect(get).toHaveBeenCalledWith('/api/ai/systems/s1');
  });

  it('create posts the body', async () => {
    post.mockResolvedValue({ success: true, data: { id: 's2' } });
    await aiSystemsService.create({ name: 'x' });
    expect(post).toHaveBeenCalledWith('/api/ai/systems', { name: 'x' });
  });

  it('update patches the id path', async () => {
    patch.mockResolvedValue({ success: true, data: { id: 's1' } });
    await aiSystemsService.update('s1', { riskTier: 'HIGH' });
    expect(patch).toHaveBeenCalledWith('/api/ai/systems/s1', {
      riskTier: 'HIGH',
    });
  });

  it('remove deletes the id path', async () => {
    del.mockResolvedValue(undefined);
    await aiSystemsService.remove('s1');
    expect(del).toHaveBeenCalledWith('/api/ai/systems/s1');
  });

  it('importCsv posts { rows } and unwraps the summary', async () => {
    post.mockResolvedValue({
      success: true,
      data: { created: 2, updated: 1, total: 3 },
    });
    const summary = await aiSystemsService.importCsv([
      { externalId: 'e1', name: 'a' },
    ]);
    expect(summary).toEqual({ created: 2, updated: 1, total: 3 });
    expect(post).toHaveBeenCalledWith('/api/ai/systems/import', {
      rows: [{ externalId: 'e1', name: 'a' }],
    });
  });

  it('use-case helpers hit nested paths', async () => {
    get.mockResolvedValue({ success: true, data: [] });
    await aiSystemsService.listUseCases('s1');
    expect(get).toHaveBeenCalledWith('/api/ai/systems/s1/use-cases');

    post.mockResolvedValue({ success: true, data: { id: 'uc1' } });
    await aiSystemsService.createUseCase('s1', { name: 'uc' });
    expect(post).toHaveBeenCalledWith('/api/ai/systems/s1/use-cases', {
      name: 'uc',
    });

    del.mockResolvedValue(undefined);
    await aiSystemsService.removeUseCase('uc1');
    expect(del).toHaveBeenCalledWith('/api/ai/systems/use-cases/uc1');
  });

  it('decideUseCase posts decision + reason to the decision path', async () => {
    post.mockResolvedValue(undefined);
    await aiSystemsService.decideUseCase('uc1', 'REJECTED', 'too risky');
    expect(post).toHaveBeenCalledWith(
      '/api/ai/systems/use-cases/uc1/decision',
      { decision: 'REJECTED', reason: 'too risky' },
    );
  });
});

describe('aiTrustService', () => {
  it('getDashboard unwraps { data }', async () => {
    get.mockResolvedValue({
      success: true,
      data: { readinessScore: 42, cards: {}, checklist: [] },
    });
    const d = await aiTrustService.getDashboard();
    expect(d.readinessScore).toBe(42);
    expect(get).toHaveBeenCalledWith('/api/ai/trust/dashboard');
  });
});
