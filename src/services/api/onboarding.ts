import { apiClient } from './client';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface OnboardingStatus {
  id: string;
  userId: string;
  // Task 1
  policyAccepted: boolean;
  policyAcceptedAt: string | null;
  policyVersionAccepted: string | null; // JSON-serialised array of policy ids
  pendingPolicyIds: string[];           // published policies not yet accepted
  // Task 2
  mdmEnrolled: boolean;
  mdmEnrolledAt: string | null;
  deviceId: string | null;
  // Task 3
  trainingStarted: boolean;
  trainingStartedAt: string | null;
  trainingCompleted: boolean;
  trainingCompletedAt: string | null;
  // Overall
  allComplete: boolean;
}

export interface UserOnboardingSummary {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
  onboarding: OnboardingStatus & {
    completedCount: number;
    totalCount: number;
  };
}

// ── Service ───────────────────────────────────────────────────────────────────

export const onboardingService = {
  /** Get (or auto-create) the calling user's onboarding status */
  async getMyStatus(): Promise<{ success: boolean; data: OnboardingStatus }> {
    return apiClient.get('/api/onboarding/me');
  },

  /** Task 1 — accept all org policies */
  async acceptPolicies(policyIds: string[]): Promise<{ success: boolean; data: OnboardingStatus }> {
    return apiClient.post('/api/onboarding/accept-policies', { policyIds });
  },

  /** Task 3 — record video started */
  async recordTrainingStart(): Promise<{ success: boolean; data: OnboardingStatus }> {
    return apiClient.post('/api/onboarding/training-start', {});
  },

  /** Task 3 — record video completed (call when playback hits 100%) */
  async recordTrainingComplete(): Promise<{ success: boolean; data: OnboardingStatus }> {
    return apiClient.post('/api/onboarding/training-complete', {});
  },

  /** Admin: list all users with their onboarding status */
  async listUsersOnboarding(): Promise<{ success: boolean; data: UserOnboardingSummary[] }> {
    return apiClient.get('/api/onboarding/users');
  },

  /** Admin: get one user's detail */
  async getUserOnboarding(userId: string): Promise<{ success: boolean; data: { user: UserOnboardingSummary; onboarding: OnboardingStatus } }> {
    return apiClient.get(`/api/onboarding/users/${userId}`);
  },
};
