/**
 * ai.ts — API client for the AI layer (AI-1/AI-2/AI-3).
 *
 * Covers:
 *   - Document registration for AI indexing (AI-1)
 *   - Evidence synthesis — control mapping suggestions (AI-2)
 *   - AI generation lifecycle — accept / dismiss (AI-2)
 *   - Questionnaire assistant — generate, approve, dismiss, list (AI-3)
 */

import { apiClient } from './client';

// ── Types ─────────────────────────────────────────────────────────────────────

export type AiDocumentSourceType =
  | 'POLICY'
  | 'HANDBOOK'
  | 'AUDIT_REPORT'
  | 'QUESTIONNAIRE'
  | 'NOTE'
  | 'EVIDENCE'
  | 'UPLOAD';

export type AiGenerationStatus = 'PENDING_REVIEW' | 'ACCEPTED' | 'DISMISSED';

export interface AiDocument {
  id: string;
  sourceType: AiDocumentSourceType;
  sourceEntityId: string | null;
  title: string;
  mimeType: string;
  indexedAt: string | null;
  createdAt: string;
  indexed?: boolean;
  chunkCount?: number;
}

export interface AiCitation {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  excerpt: string;
}

export interface AiGeneration {
  id: string;
  type: string;
  outputText: string;
  citationsJson: AiCitation[];
  model: string;
  status: AiGenerationStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface ControlCandidate {
  controlId: string;
  controlTitle: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  rationale: string;
}

export interface EvidenceSynthesisResult {
  generationId: string;
  controlCandidates: ControlCandidate[];
  recommendedControlId: string | null;
  overallExplanation: string;
  reviewRequired: true;
}

export interface QuestionnaireAnswerResult {
  generationId: string;
  draftAnswer: string;
  citations: AiCitation[];
  status: 'PENDING_REVIEW';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface ApprovedQuestionnaireAnswer {
  id: string;
  question: string;
  approvedAnswer: string;
  approvedAt: string;
}

// AI-4: Auditor note generation
export interface AuditorNoteResult {
  generationId: string;
  noteText: string;
  citations: AiCitation[];
  controlId: string;
  controlTitle: string;
  isoReference: string;
  status: 'PENDING_REVIEW';
}

// AI Settings / configuration status
export interface AiSettings {
  llmConfigured: boolean;
  vectorStoreConfigured: boolean;
  llmProvider: string;
  embeddingModel: string;
  usingOrgKey?: boolean;
}

// BYOK AI configuration
export interface AiConfig {
  configured: boolean;
  provider: string;
  enabled: boolean;
  keyFingerprint: string | null;
  completionModel: string | null;
  embeddingModel: string | null;
  lastTestedAt: string | null;
  lastTestResult: string | null;
}

export interface AiKeyTestResult {
  success: boolean;
  provider?: string;
  model?: string;
  message?: string;
  error?: string;
}

export interface RegisterDocumentRequest {
  sourceType: AiDocumentSourceType;
  sourceEntityId?: string;
  title: string;
  mimeType: string;
  storageUrl: string;
}

// ── AI Service ────────────────────────────────────────────────────────────────

export const aiService = {
  // ── Document ingestion (AI-1) ──────────────────────────────────────────────

  /** Register a document for AI indexing. Returns immediately; indexing is async. */
  registerDocument: (data: RegisterDocumentRequest) =>
    apiClient.post<{ success: boolean; data: AiDocument; message: string }>(
      '/api/ai/documents',
      data,
    ),

  /** List all AI-indexed documents for this org. */
  listDocuments: () =>
    apiClient.get<{ success: boolean; data: AiDocument[] }>(
      '/api/ai/documents',
    ),

  /** Get a single document with chunk count and indexing status. */
  getDocument: (id: string) =>
    apiClient.get<{
      success: boolean;
      data: AiDocument & { chunkCount: number; indexed: boolean };
    }>(`/api/ai/documents/${id}`),

  // ── Evidence synthesis (AI-2) ──────────────────────────────────────────────

  /**
   * Start evidence synthesis for an evidence item.
   * Calls the LLM via RAG pipeline to suggest control mappings.
   * Returns immediately with the result (runs inline, stores to AiGeneration).
   */
  synthesizeEvidence: (evidenceId: string, evidenceSummary: string) =>
    apiClient.post<{ success: boolean; data: EvidenceSynthesisResult }>(
      `/api/ai/evidence/${evidenceId}/synthesize`,
      { evidenceSummary },
    ),

  /** Poll for a generation's status and result. */
  getGeneration: (id: string) =>
    apiClient.get<{ success: boolean; data: AiGeneration }>(
      `/api/ai/generations/${id}`,
    ),

  /** Accept an AI-suggested control mapping. Does not auto-apply any records. */
  acceptSuggestion: (id: string) =>
    apiClient.post<{ success: boolean; message: string }>(
      `/api/ai/generations/${id}/accept`,
    ),

  /** Dismiss an AI-suggested control mapping. */
  dismissSuggestion: (id: string) =>
    apiClient.post<{ success: boolean; message: string }>(
      `/api/ai/generations/${id}/dismiss`,
    ),

  // ── Questionnaire assistant (AI-3) ─────────────────────────────────────────

  /**
   * Generate a draft answer for a security questionnaire question.
   * Result is PENDING_REVIEW — user must edit/approve before sending.
   */
  generateQuestionnaireAnswer: (question: string, context?: string) =>
    apiClient.post<{ success: boolean; data: QuestionnaireAnswerResult }>(
      '/api/ai/questionnaire/generate',
      { question, context },
    ),

  /** Approve a draft answer (possibly with human edits) for reuse. */
  approveQuestionnaireAnswer: (id: string, approvedText: string) =>
    apiClient.post<{ success: boolean; message: string }>(
      `/api/ai/questionnaire/${id}/approve`,
      { approvedText },
    ),

  /** Dismiss a draft answer. */
  dismissQuestionnaireAnswer: (id: string) =>
    apiClient.post<{ success: boolean; message: string }>(
      `/api/ai/questionnaire/${id}/dismiss`,
    ),

  /** List previously approved questionnaire answers for reuse. */
  listApprovedAnswers: () =>
    apiClient.get<{ success: boolean; data: ApprovedQuestionnaireAnswer[] }>(
      '/api/ai/questionnaire/approved',
    ),

  // ── AI-4: Auditor note generation ─────────────────────────────────────────

  /** Generate a draft auditor note for a control, with cited evidence and policies. */
  generateAuditorNote: (controlId: string, auditId?: string) =>
    apiClient.post<{ success: boolean; data: AuditorNoteResult }>(
      '/api/ai/auditor-note/generate',
      { controlId, auditId },
    ),

  /** Apply an approved auditor note to an audit control record. */
  applyAuditorNote: (
    generationId: string,
    auditId: string,
    controlId: string,
    approvedNoteText: string,
  ) =>
    apiClient.post<{ success: boolean; message: string }>(
      `/api/ai/auditor-note/${generationId}/apply`,
      { auditId, controlId, approvedNoteText },
    ),

  // ── AI Settings ────────────────────────────────────────────────────────────

  /** Check the current AI configuration status (LLM configured, vector store, etc.) */
  getSettings: () =>
    apiClient.get<{ success: boolean; data: AiSettings }>('/api/ai/settings'),

  // ── BYOK AI Configuration ─────────────────────────────────────────────────

  /** Get the org's AI key configuration (never returns the actual key). */
  getConfig: () =>
    apiClient.get<AiConfig>('/api/ai/config'),

  /** Update AI settings (provider, apiKey, models, enabled). */
  updateConfig: (data: {
    provider?: string;
    apiKey?: string;
    completionModel?: string | null;
    embeddingModel?: string | null;
    enabled?: boolean;
  }) =>
    apiClient.put<AiConfig>('/api/ai/config', data),

  /** Test the configured API key with a minimal LLM call. */
  testKey: () =>
    apiClient.post<AiKeyTestResult>('/api/ai/config/test'),

  /** Remove the org's API key and revert to platform default. */
  removeKey: () =>
    apiClient.delete('/api/ai/config/key'),
};
