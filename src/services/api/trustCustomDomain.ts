/**
 * Trust Center custom-domain admin client (Phase F).
 *
 *   GET    /api/trust/settings/custom-domain
 *   PUT    /api/trust/settings/custom-domain
 *   POST   /api/trust/settings/custom-domain/verify
 *   DELETE /api/trust/settings/custom-domain
 *
 * Backed by Cloudanzen-backend `src/modules/trust/custom-domain/routes.ts`.
 */
import { apiClient } from './client';

export interface TrustCustomDomainState {
  configured: boolean;
  customDomain: string | null;
  status: 'PENDING_DNS' | 'PENDING_TLS' | 'ACTIVE' | 'FAILED' | null;
  addedAt: string | null;
  verifiedAt: string | null;
  edgeCname: string;
  dnsRecords: {
    txt: { name: string; value: string } | null;
    cname: { name: string; value: string } | null;
  };
}

export interface TrustCustomDomainAttachResult {
  customDomain: string;
  status: TrustCustomDomainState['status'];
  edgeCname: string;
  dnsRecords: TrustCustomDomainState['dnsRecords'];
}

export interface TrustCustomDomainReconcileResult {
  customDomain: string | null;
  previousStatus: string | null;
  status: string | null;
  txtVerified: boolean;
  cnameVerified: boolean;
  vercelVerified: boolean;
  reason: string | null;
}

export const trustCustomDomainService = {
  get(): Promise<{ success: boolean; data: TrustCustomDomainState }> {
    return apiClient.get('/api/trust/settings/custom-domain');
  },
  attach(
    domain: string,
  ): Promise<{ success: boolean; data: TrustCustomDomainAttachResult }> {
    return apiClient.put('/api/trust/settings/custom-domain', { domain });
  },
  verify(): Promise<{
    success: boolean;
    data: TrustCustomDomainReconcileResult;
  }> {
    return apiClient.post('/api/trust/settings/custom-domain/verify', {});
  },
  detach(): Promise<{ success: boolean; data: { detached: boolean } }> {
    return apiClient.delete('/api/trust/settings/custom-domain');
  },
};
