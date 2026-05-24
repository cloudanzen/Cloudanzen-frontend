import { describe, it, expect, vi, beforeEach } from 'vitest';
import { platformOpsService } from '@/services/api/platformOps';
import { platformCatalogService } from '@/services/api/platformCatalog';
import { apiClient } from '@/services/api/client';

// Pin the URL shapes the new platform-ops + catalog clients produce.
// Service-layer regressions usually surface as wrong paths or missing
// segments; checking the apiClient method call covers that.

describe('platformOpsService URL contracts', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('listSessions → GET /api/platform/support-sessions', async () => {
    const spy = vi.spyOn(apiClient, 'get').mockResolvedValue({ sessions: [] });
    await platformOpsService.listSessions();
    expect(spy).toHaveBeenCalledWith('/api/platform/support-sessions');
  });

  it('endSession → POST /api/platform/support-sessions/:id/end', async () => {
    const spy = vi
      .spyOn(apiClient, 'post')
      .mockResolvedValue({ success: true });
    await platformOpsService.endSession('s-1');
    expect(spy).toHaveBeenCalledWith(
      '/api/platform/support-sessions/s-1/end',
      undefined,
    );
  });

  it('addAllowlistEntry → POST /api/platform/allowlist with email + notes', async () => {
    const spy = vi.spyOn(apiClient, 'post').mockResolvedValue({});
    await platformOpsService.addAllowlistEntry({
      email: 'ops@x.com',
      notes: 'n',
    });
    expect(spy).toHaveBeenCalledWith('/api/platform/allowlist', {
      email: 'ops@x.com',
      notes: 'n',
    });
  });

  it('removeAllowlistEntry → DELETE /api/platform/allowlist/:id', async () => {
    const spy = vi.spyOn(apiClient, 'delete').mockResolvedValue({});
    await platformOpsService.removeAllowlistEntry('a-1');
    expect(spy).toHaveBeenCalledWith('/api/platform/allowlist/a-1');
  });

  it('listActivity with filters → encodes query params', async () => {
    const spy = vi
      .spyOn(apiClient, 'get')
      .mockResolvedValue({ rows: [], nextCursor: null });
    await platformOpsService.listActivity({
      action: 'PUBLISHED',
      limit: 25,
    });
    const calledWith = spy.mock.calls[0]?.[0] ?? '';
    expect(calledWith).toMatch(/^\/api\/platform\/activity\?/);
    expect(calledWith).toContain('action=PUBLISHED');
    expect(calledWith).toContain('limit=25');
  });

  it('listActivity without filters → no query string', async () => {
    const spy = vi
      .spyOn(apiClient, 'get')
      .mockResolvedValue({ rows: [], nextCursor: null });
    await platformOpsService.listActivity();
    expect(spy).toHaveBeenCalledWith('/api/platform/activity');
  });
});

describe('platformCatalogService URL contracts', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('createBatch → POST /api/platform/catalog/batches', async () => {
    const spy = vi.spyOn(apiClient, 'post').mockResolvedValue({});
    await platformCatalogService.createBatch({
      name: 'b',
      scopeTypes: ['control'],
    });
    expect(spy).toHaveBeenCalledWith('/api/platform/catalog/batches', {
      name: 'b',
      scopeTypes: ['control'],
    });
  });

  it('listBatches with status filter encodes the param', async () => {
    const spy = vi.spyOn(apiClient, 'get').mockResolvedValue({ batches: [] });
    await platformCatalogService.listBatches('OPEN');
    expect(spy).toHaveBeenCalledWith(
      '/api/platform/catalog/batches?status=OPEN',
    );
  });

  it('createDraft → POST /api/platform/catalog/batches/:id/<kind>-drafts', async () => {
    const spy = vi.spyOn(apiClient, 'post').mockResolvedValue({});
    await platformCatalogService.createDraft('b-1', 'control', {
      proposalJson: {},
      changeKind: 'CREATE',
    });
    expect(spy).toHaveBeenCalledWith(
      '/api/platform/catalog/batches/b-1/control-drafts',
      expect.objectContaining({ changeKind: 'CREATE' }),
    );
  });

  it('publishBatch → POST /api/platform/catalog/batches/:id/publish', async () => {
    const spy = vi.spyOn(apiClient, 'post').mockResolvedValue({});
    await platformCatalogService.publishBatch('b-1');
    expect(spy).toHaveBeenCalledWith(
      '/api/platform/catalog/batches/b-1/publish',
      undefined,
    );
  });

  it('getApplyStatus → GET /api/platform/catalog/versions/:id/apply-status', async () => {
    const spy = vi.spyOn(apiClient, 'get').mockResolvedValue({
      pending: 0,
      applied: 0,
      failed: 0,
      recentErrors: [],
    });
    await platformCatalogService.getApplyStatus('v-1');
    expect(spy).toHaveBeenCalledWith(
      '/api/platform/catalog/versions/v-1/apply-status',
    );
  });
});
