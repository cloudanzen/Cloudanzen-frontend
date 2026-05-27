import { apiClient } from './client';

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * Which onboarding tasks apply to the user, derived from the per-role matrix on the backend.
 * Auditors (and any other role an admin exempts) get `false` for the disabled tasks. [T-91]
 */
export interface OnboardingRequiredBlock {
  policyAcceptance: boolean;
  mdmEnrollment: boolean;
  securityTraining: boolean;
}

export interface OnboardingStatus {
  id: string;
  userId: string;
  /** Per-role task requirements — the UI should only render cards where the flag is true. */
  required: OnboardingRequiredBlock;
  // Task 1
  policyAccepted: boolean;
  policyAcceptedAt: string | null;
  policyVersionAccepted: string | null; // JSON-serialised array of policy ids
  pendingPolicyIds: string[]; // published policies not yet accepted
  // Task 2
  mdmEnrolled: boolean;
  mdmEnrolledAt: string | null;
  deviceId: string | null;
  // Task 3
  trainingStarted: boolean;
  trainingStartedAt: string | null;
  trainingCompleted: boolean;
  trainingCompletedAt: string | null;
  trainingRequired: boolean;
  trainingCourses: TrainingCourse[];
  // Aggregates computed over *required* tasks only
  completedCount: number;
  totalCount: number;
  allComplete: boolean;
}

export interface TrainingCourse {
  courseSlug: string;
  frameworkSlug: string;
  frameworkName: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  version: number;
  passThresholdPct: number;
  startedAt: string | null;
  completedAt: string | null;
  scorePct: number | null;
  status: 'not_started' | 'in_progress' | 'completed' | 'retry_required';
}

export interface TrainingAttemptPayload {
  kind: 'course_attempt';
  moduleScores: Record<string, number>;
  quizAnswers: Record<string, string>;
  durationSeconds: number;
}

export interface UserOnboardingSummary {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
  onboarding: OnboardingStatus;
}

// ── Service ───────────────────────────────────────────────────────────────────

export const onboardingService = {
  /** Get (or auto-create) the calling user's onboarding status */
  async getMyStatus(): Promise<{ success: boolean; data: OnboardingStatus }> {
    return apiClient.get('/api/onboarding/me');
  },

  /** Task 1 — accept all org policies */
  async acceptPolicies(
    policyIds: string[],
  ): Promise<{ success: boolean; data: OnboardingStatus }> {
    return apiClient.post('/api/onboarding/accept-policies', { policyIds });
  },

  /** Task 3 — start one framework-specific course */
  async recordTrainingStart(
    courseSlug: string,
  ): Promise<{ success: boolean; data: OnboardingStatus }> {
    return apiClient.post(`/api/onboarding/training/${courseSlug}/start`, {});
  },

  /** Task 3 — complete one framework-specific course */
  async recordTrainingComplete(
    courseSlug: string,
    scorePct: number,
    attemptPayload: TrainingAttemptPayload,
  ): Promise<{ success: boolean; data: OnboardingStatus }> {
    return apiClient.post(`/api/onboarding/training/${courseSlug}/complete`, {
      scorePct,
      attemptPayload,
    });
  },

  /** Admin: list all users with their onboarding status */
  async listUsersOnboarding(): Promise<{
    success: boolean;
    data: UserOnboardingSummary[];
  }> {
    return apiClient.get('/api/onboarding/users');
  },

  /** Admin: get one user's detail */
  async getUserOnboarding(
    userId: string,
  ): Promise<{
    success: boolean;
    data: { user: UserOnboardingSummary; onboarding: OnboardingStatus };
  }> {
    return apiClient.get(`/api/onboarding/users/${userId}`);
  },
};
