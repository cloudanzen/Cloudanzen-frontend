/**
 * Salesforce Trust Center OAuth client (Phase D2).
 *
 * Wraps the BE module `src/modules/integrations/salesforce/oauth-routes.ts`:
 *   GET  /api/integrations/salesforce/connect
 *   GET  /api/integrations/salesforce/status
 *   POST /api/integrations/salesforce/sync
 *   POST /api/integrations/salesforce/disconnect
 *
 * NOTE: separate from `salesforceService` (engineer-A scan-only). The two
 * share the same prefix but serve different purposes; this file only
 * exposes the OAuth-backed CRM data-connector surface.
 */
import { apiClient } from './client';

export interface SalesforceTrustStatus {
  connected: boolean;
  instanceUrl: string | null;
  connectedAt: string | null;
  lastSyncedAt: string | null;
  opportunityCount: number;
  linkedAccountCount: number;
  revenueInfluencedUsd: number;
}

export interface SalesforceSyncResult {
  accountsProcessed: number;
  opportunitiesUpserted: number;
}

export const salesforceTrustService = {
  /** Returns an OAuth authUrl the FE pops in a window. */
  connect(): Promise<{ success: boolean; authUrl: string }> {
    return apiClient.get('/api/integrations/salesforce/connect');
  },

  status(): Promise<{ success: boolean; data: SalesforceTrustStatus }> {
    return apiClient.get('/api/integrations/salesforce/status');
  },

  sync(): Promise<{ success: boolean; data: SalesforceSyncResult }> {
    return apiClient.post('/api/integrations/salesforce/sync', {});
  },

  disconnect(): Promise<{ success: boolean }> {
    return apiClient.post('/api/integrations/salesforce/disconnect', {});
  },
};
