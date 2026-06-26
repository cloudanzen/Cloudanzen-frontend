/**
 * Platform onboarding wizard API client (AI TrustOps Phase 1).
 *
 * Backed by Cloudanzen-backend `src/modules/platform-onboarding/routes.ts`.
 */
import { apiClient } from './client';

export type CompanyType =
  | 'AI_NATIVE'
  | 'SAAS'
  | 'HEALTHCARE'
  | 'ENTERPRISE_GRC'
  | 'OTHER';

export type PrimaryUseCase =
  | 'AI_TRUST'
  | 'SOC2'
  | 'ISO27001'
  | 'ISO42001'
  | 'TRUST_CENTER'
  | 'QUESTIONNAIRES'
  | 'VENDOR_RISK';

export type KnownBundle =
  | 'AI_GOVERNANCE'
  | 'COMPLIANCE_AUTOMATION'
  | 'CUSTOMER_TRUST'
  | 'VENDOR_RISK'
  | 'DEDICATED_CLOUD';

export interface OnboardingDefaults {
  companyType: CompanyType;
  primaryUseCase: PrimaryUseCase;
  enabledBundles: KnownBundle[];
  frameworkSlugs: string[];
}

export interface ApplySetupInput {
  organizationId: string;
  companyType: CompanyType;
  primaryUseCase?: PrimaryUseCase;
  enabledBundles?: KnownBundle[];
  frameworkIds?: string[];
  onboardingProfile?: Record<string, unknown>;
}

export interface ApplySetupResult {
  organizationId: string;
  companyType: CompanyType;
  primaryUseCase: PrimaryUseCase;
  enabledBundles: KnownBundle[];
  grantedFrameworkSlugs: string[];
  bundlesVersion: number;
}

export const platformOnboardingService = {
  getDefaults(
    companyType: CompanyType,
  ): Promise<{ success: boolean; data: OnboardingDefaults }> {
    return apiClient.get(
      `/api/platform/onboarding/setup/defaults?companyType=${encodeURIComponent(companyType)}`,
    );
  },
  applySetup(
    input: ApplySetupInput,
  ): Promise<{ success: boolean; data: ApplySetupResult }> {
    return apiClient.post('/api/platform/onboarding/setup', input);
  },
};
