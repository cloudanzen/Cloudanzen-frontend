/**
 * roleOnboarding.ts — client for /api/role-onboarding [T-91]
 *
 * Per-role onboarding task-requirement matrix. Admin-only — readers/writers must have
 * SUPER_ADMIN or ORG_ADMIN permission on the backend.
 */

import { apiClient } from './client';

export type OnboardingTaskType =
  | 'POLICY_ACCEPTANCE'
  | 'MDM_ENROLLMENT'
  | 'SECURITY_TRAINING';

export type RoleOnboardingMatrix = Record<
  string, // Role enum key
  Record<OnboardingTaskType, boolean>
>;

export interface UpdateRoleRequirementInput {
  role: string;
  taskType: OnboardingTaskType;
  required: boolean;
}

export const roleOnboardingService = {
  /** Admin: fetch the full per-role task requirement matrix for the current org. */
  async getMatrix(): Promise<{ success: boolean; data: RoleOnboardingMatrix }> {
    return apiClient.get('/api/role-onboarding');
  },

  /** Admin: toggle one (role, taskType) cell. Returns the updated matrix + cleanup count. */
  async updateRequirement(
    input: UpdateRoleRequirementInput,
  ): Promise<{ success: boolean; data: RoleOnboardingMatrix; cleanedPendingPolicyCount: number }> {
    return apiClient.patch('/api/role-onboarding', input);
  },
};
