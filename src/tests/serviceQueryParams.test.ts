/**
 * Query-parameter construction across the API services.
 *
 * Every list endpoint hand-rolls its own parameter cleaning: dropping falsy
 * values, joining array filters into a comma string, stringifying numbers, and
 * omitting the params object entirely when nothing survives. None of it is
 * type-checked against the backend, and the failure mode is silent — a filter
 * that quietly stops being applied returns *more* rows, not an error.
 *
 * These are the cheapest meaningful frontend tests available: pure input →
 * request-shape assertions with apiClient mocked.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/services/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import { apiClient } from '@/services/api/client';
import { auditsService } from '@/services/api/audits';
import { controlsService } from '@/services/api/controls';
import { policiesService } from '@/services/api/policies';
import { testsService } from '@/services/api/tests';
import { vendorsService } from '@/services/api/vendors';

const get = apiClient.get as unknown as ReturnType<typeof vi.fn>;

/** The params argument of the most recent apiClient.get call. */
const sentParams = () => get.mock.calls[0]?.[1];
const sentUrl = () => get.mock.calls[0]?.[0];

beforeEach(() => {
  vi.clearAllMocks();
  get.mockResolvedValue({ success: true, data: [] });
});

describe('audits list — sentinel stripping', () => {
  it('omits the params object entirely when nothing is filtered', async () => {
    await auditsService.list();

    expect(sentUrl()).toBe('/api/audits');
    expect(sentParams()).toBeUndefined();
  });

  it('omits it for an empty params object too', async () => {
    await auditsService.list({});

    expect(sentParams()).toBeUndefined();
  });

  it.each(['undefined', 'all'])(
    'drops the sentinel string %s rather than sending it',
    async (sentinel) => {
      // The UI sends 'all' for "no filter" and can send the literal string
      // 'undefined' from a stringified value. Either reaching the API would
      // silently filter on a status nothing matches.
      await auditsService.list({
        status: sentinel as never,
        type: sentinel as never,
        search: sentinel,
      });

      expect(sentParams()).toBeUndefined();
    },
  );

  it('keeps real filter values', async () => {
    await auditsService.list({
      type: 'INTERNAL' as never,
      status: 'IN_PROGRESS' as never,
      search: 'soc',
    });

    expect(sentParams()).toEqual({
      type: 'INTERNAL',
      status: 'IN_PROGRESS',
      search: 'soc',
    });
  });

  it('stringifies pagination numbers', async () => {
    await auditsService.list({ page: 2, limit: 50 });

    expect(sentParams()).toEqual({ page: '2', limit: '50' });
  });

  it('keeps page 0 — a falsy number is still a value', async () => {
    // Guarded by `!== undefined` rather than truthiness; a truthiness check
    // here would silently drop the first page.
    await auditsService.list({ page: 0 });

    expect(sentParams()).toEqual({ page: '0' });
  });
});

describe('controls list — array filters', () => {
  it('joins frameworkSlugs into a comma-separated string', async () => {
    await controlsService.getControls({
      frameworkSlugs: ['soc-2', 'iso-27001'],
    });

    expect(sentParams()).toEqual({ frameworkSlugs: 'soc-2,iso-27001' });
  });

  it('drops an empty slug array instead of sending an empty string', async () => {
    // `frameworkSlugs=''` would be a filter matching nothing, rather than no
    // filter at all.
    await controlsService.getControls({ frameworkSlugs: [] });

    expect(sentParams()).toBeUndefined();
  });

  it('combines search, status and pagination', async () => {
    await controlsService.getControls({
      search: 'policy',
      status: 'IMPLEMENTED' as never,
      page: 3,
      limit: 25,
    });

    expect(sentParams()).toEqual({
      search: 'policy',
      status: 'IMPLEMENTED',
      page: '3',
      limit: '25',
    });
  });

  it('sends no params object when called with nothing', async () => {
    await controlsService.getControls();

    expect(sentUrl()).toBe('/api/controls');
    expect(sentParams()).toBeUndefined();
  });

  it('drops an empty search string', async () => {
    await controlsService.getControls({ search: '' });

    expect(sentParams()).toBeUndefined();
  });
});

describe('policies list', () => {
  it('joins frameworkSlugs and keeps other filters', async () => {
    await policiesService.getPolicies({
      search: 'access',
      status: 'PUBLISHED' as never,
      frameworkSlugs: ['soc-2'],
    });

    expect(sentParams()).toEqual({
      search: 'access',
      status: 'PUBLISHED',
      frameworkSlugs: 'soc-2',
    });
  });

  it('omits params when unfiltered', async () => {
    await policiesService.getPolicies();

    expect(sentParams()).toBeUndefined();
  });
});

describe('tests list — the widest filter set', () => {
  it('passes every supported filter through', async () => {
    await testsService.listTests({
      search: 'mfa',
      category: 'ACCESS' as never,
      status: 'PASSING' as never,
      type: 'AUTOMATED' as never,
      ownerId: 'user-1',
      integrationId: 'int-1',
      controlId: 'ctl-1',
      dueFrom: '2026-01-01',
      dueTo: '2026-12-31',
      frameworkSlugs: ['soc-2', 'gdpr'],
      page: 2,
      limit: 10,
      view: 'card' as never,
    });

    expect(sentParams()).toEqual({
      search: 'mfa',
      category: 'ACCESS',
      status: 'PASSING',
      type: 'AUTOMATED',
      ownerId: 'user-1',
      integrationId: 'int-1',
      controlId: 'ctl-1',
      dueFrom: '2026-01-01',
      dueTo: '2026-12-31',
      frameworkSlugs: 'soc-2,gdpr',
      page: '2',
      limit: '10',
      view: 'card',
    });
  });

  it('sends only what was supplied', async () => {
    await testsService.listTests({ ownerId: 'user-1' });

    expect(sentParams()).toEqual({ ownerId: 'user-1' });
  });

  it('omits params when unfiltered', async () => {
    await testsService.listTests();

    expect(sentParams()).toBeUndefined();
  });
});

describe('vendors list — paramsToRecord', () => {
  it('preserves number and boolean types rather than stringifying', async () => {
    // Unlike the other services this one passes primitives straight through,
    // so the client is responsible for serialising them.
    get.mockResolvedValue({ success: true, data: [] });

    await vendorsService.list({
      highRisk: true,
      dueWithinDays: 30,
      page: 2,
      limit: 20,
    });

    expect(sentParams()).toEqual({
      highRisk: true,
      dueWithinDays: 30,
      page: 2,
      limit: 20,
    });
  });

  it('keeps highRisk false — an explicit false is a real filter', async () => {
    await vendorsService.list({ highRisk: false });

    expect(sentParams()).toEqual({ highRisk: false });
  });

  it('carries every tier filter independently', async () => {
    await vendorsService.list({
      inherentTier: 'HIGH' as never,
      residualTier: 'LOW' as never,
      effectiveTier: 'MEDIUM' as never,
    });

    expect(sentParams()).toEqual({
      inherentTier: 'HIGH',
      residualTier: 'LOW',
      effectiveTier: 'MEDIUM',
    });
  });

  it('omits params for an empty object and for no argument', async () => {
    await vendorsService.list({});
    expect(sentParams()).toBeUndefined();

    vi.clearAllMocks();
    get.mockResolvedValue({ success: true, data: [] });
    await vendorsService.list();
    expect(sentParams()).toBeUndefined();
  });
});

describe('vendors list — response unwrapping', () => {
  it('unwraps the data array', async () => {
    get.mockResolvedValue({ success: true, data: [{ id: 'v1' }] });

    await expect(vendorsService.list()).resolves.toEqual([{ id: 'v1' }]);
  });

  it('returns an empty array when the payload has no data', async () => {
    // Callers render `.map()` over this directly, so a missing data key must
    // not become undefined.
    get.mockResolvedValue({ success: true });

    await expect(vendorsService.list()).resolves.toEqual([]);
  });

  it('returns an empty array when the response itself is null', async () => {
    get.mockResolvedValue(null);

    await expect(vendorsService.list()).resolves.toEqual([]);
  });

  it('listPage keeps the pagination block alongside the rows', async () => {
    get.mockResolvedValue({
      success: true,
      data: [{ id: 'v1' }],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });

    await expect(vendorsService.listPage()).resolves.toEqual({
      data: [{ id: 'v1' }],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });
  });
});
