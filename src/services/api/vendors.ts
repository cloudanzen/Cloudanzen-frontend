/* eslint-disable @typescript-eslint/no-explicit-any -- legacy: to be typed progressively */
import { apiClient } from './client';

export type VendorStatus = 'MONITORED' | 'ASSESSMENT_DUE' | 'IN_REVIEW' | 'BLOCKED';
export type VendorTier = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface VendorRecord {
  id: string;
  name: string;
  category: string;
  owner: string;
  website?: string | null;
  status: VendorStatus;
  tier: VendorTier;
  securityScore: number;
  openFindings: number;
  questionnaireCompletion: number;
  dpaSigned: boolean;
  subprocessors: number;
  businessCriticality: 'Mission-critical' | 'Business-important' | 'Operational';
  dataClass: 'PII' | 'Sensitive' | 'Internal' | 'Public';
  lastAssessmentAt: string;
  nextAssessmentAt: string;
  contractEndDate?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVendorInput {
  name: string;
  category: string;
  owner: string;
  website?: string;
  businessCriticality: VendorRecord['businessCriticality'];
  dataClass: VendorRecord['dataClass'];
}

type ApiResp<T> = { success: boolean; data: T };

export const vendorsService = {
  async get(id: string): Promise<VendorRecord | null> {
    const res = await apiClient.get<ApiResp<VendorRecord>>(`/api/vendors/${id}`);
    return res?.data ?? null;
  },

  async list(params?: { search?: string; status?: VendorStatus; tier?: VendorTier }): Promise<VendorRecord[]> {
    const res = await apiClient.get<ApiResp<VendorRecord[]>>('/api/vendors', params as any);
    return res?.data ?? [];
  },

  async create(input: CreateVendorInput): Promise<VendorRecord> {
    const res = await apiClient.post<ApiResp<VendorRecord>>('/api/vendors', input);
    return res.data;
  },

  async update(id: string, patch: Partial<VendorRecord>): Promise<VendorRecord | null> {
    const res = await apiClient.put<ApiResp<VendorRecord>>(`/api/vendors/${id}`, patch);
    return res?.data ?? null;
  },

  async completeAssessment(id: string): Promise<VendorRecord | null> {
    const res = await apiClient.post<ApiResp<VendorRecord>>(`/api/vendors/${id}/complete-assessment`, {});
    return res?.data ?? null;
  },
};
