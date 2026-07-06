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
import { aiRuntimeService } from '@/services/api/aiRuntime';

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

describe('aiRuntimeService', () => {
  it('eval-run + finding endpoints hit the right paths', async () => {
    get.mockResolvedValue({ success: true, data: [] });
    await aiRuntimeService.listEvalRuns();
    expect(get).toHaveBeenCalledWith('/api/ai/runtime/eval-runs');
    await aiRuntimeService.listFindings();
    expect(get).toHaveBeenCalledWith('/api/ai/runtime/findings');

    post.mockResolvedValue({ success: true, data: { id: 'e1' } });
    await aiRuntimeService.createEvalRun({ name: 'nightly' });
    expect(post).toHaveBeenCalledWith('/api/ai/runtime/eval-runs', {
      name: 'nightly',
    });
    await aiRuntimeService.createFinding({ title: 'drift' });
    expect(post).toHaveBeenCalledWith('/api/ai/runtime/findings', {
      title: 'drift',
    });

    post.mockResolvedValue(undefined);
    await aiRuntimeService.resolveFinding('f1');
    expect(post).toHaveBeenCalledWith(
      '/api/ai/runtime/findings/f1/resolve',
      {},
    );

    del.mockResolvedValue(undefined);
    await aiRuntimeService.removeEvalRun('e1');
    expect(del).toHaveBeenCalledWith('/api/ai/runtime/eval-runs/e1');
    await aiRuntimeService.removeFinding('f1');
    expect(del).toHaveBeenCalledWith('/api/ai/runtime/findings/f1');
  });

  it('slice 2: metrics / thresholds / model-events hit the right paths', async () => {
    post.mockResolvedValue({
      success: true,
      data: { id: 'm1' },
      findingsCreated: 2,
    });
    const r = await aiRuntimeService.createMetric({
      metricKey: 'k',
      value: 1,
    });
    expect(r.findingsCreated).toBe(2);
    expect(post).toHaveBeenCalledWith('/api/ai/runtime/metrics', {
      metricKey: 'k',
      value: 1,
    });

    post.mockResolvedValue({ success: true, data: { id: 't1' } });
    await aiRuntimeService.createThreshold({
      metricKey: 'k',
      thresholdValue: 5,
    });
    expect(post).toHaveBeenCalledWith('/api/ai/runtime/thresholds', {
      metricKey: 'k',
      thresholdValue: 5,
    });

    patch.mockResolvedValue(undefined);
    await aiRuntimeService.updateThreshold('t1', { enabled: false });
    expect(patch).toHaveBeenCalledWith('/api/ai/runtime/thresholds/t1', {
      enabled: false,
    });

    post.mockResolvedValue({ success: true, data: { id: 'ev1' } });
    await aiRuntimeService.createModelEvent({
      modelName: 'm',
      toVersion: 'v2',
    });
    expect(post).toHaveBeenCalledWith('/api/ai/runtime/model-events', {
      modelName: 'm',
      toVersion: 'v2',
    });

    del.mockResolvedValue(undefined);
    await aiRuntimeService.removeThreshold('t1');
    expect(del).toHaveBeenCalledWith('/api/ai/runtime/thresholds/t1');
  });
});
