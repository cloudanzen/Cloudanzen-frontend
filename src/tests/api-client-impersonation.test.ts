import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { apiClient } from '@/services/api/client';
import {
  writeImpersonationSessionId,
  clearImpersonationSessionId,
} from '@/services/impersonationStorage';

// Captures the headers the api client built for the most recent request.
// We can't inspect document.cookie (HttpOnly cookies aren't visible to JS
// anyway), so the test pins the only thing under app control: whether the
// X-Impersonation-Session header gets attached based on sessionStorage.
function makeMockFetch() {
  return vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }),
  );
}

describe('apiClient X-Impersonation-Session header', () => {
  let originalFetch: typeof globalThis.fetch;
  let mockFetch: ReturnType<typeof makeMockFetch>;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    mockFetch = makeMockFetch();
    globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;
    clearImpersonationSessionId();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    clearImpersonationSessionId();
  });

  it('omits the header when no impersonation session is active', async () => {
    await apiClient.get('/api/auth/me');
    const init = mockFetch.mock.calls[0][1] as RequestInit;
    const headers = new Headers(init.headers);
    expect(headers.has('X-Impersonation-Session')).toBe(false);
  });

  it('attaches the header when sessionStorage holds an id', async () => {
    writeImpersonationSessionId('abc-123-session-id');
    await apiClient.get('/api/auth/me');
    const init = mockFetch.mock.calls[0][1] as RequestInit;
    const headers = new Headers(init.headers);
    expect(headers.get('X-Impersonation-Session')).toBe('abc-123-session-id');
  });

  it('omits the header again after clearing the id (session-end)', async () => {
    writeImpersonationSessionId('abc-123-session-id');
    clearImpersonationSessionId();
    await apiClient.get('/api/auth/me');
    const init = mockFetch.mock.calls[0][1] as RequestInit;
    const headers = new Headers(init.headers);
    expect(headers.has('X-Impersonation-Session')).toBe(false);
  });
});
