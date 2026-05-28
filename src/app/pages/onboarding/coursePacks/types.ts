/**
 * Types for CloudAnzen Academy course packs.
 *
 * v1 modules had exactly one question per module. v2 modules carry an
 * array of CourseQuestion. The renderer reads `module.questions` if
 * present, otherwise falls back to a synthesised v1 question from the
 * legacy `module.question + module.choices` fields. See
 * `wrapLegacyModule` for the compat shim.
 */

export type QuestionKind =
  | 'single_choice'
  | 'multi_choice'
  | 'scenario'
  | 'ranking';

export interface CourseChoice {
  id: string;
  label: string;
  /** True for the correct choice(s). For ranking, `rankOrder` (1-based)
      pins the canonical sequence; `isCorrect` is unused on ranking. */
  isCorrect?: boolean;
  /** Ranking only — 1-based position in the correct order. */
  rankOrder?: number;
  /** Per-choice explanation shown after the user submits. */
  feedback?: string;
}

export interface CourseQuestion {
  id: string;
  kind: QuestionKind;
  /** Required for kind='scenario'. 'single' = one correct choice;
      'multi' = one or more correct. Ignored for other kinds. */
  selectionMode?: 'single' | 'multi';
  /** Narrative shown above the prompt for scenario questions. */
  scenario?: string;
  prompt: string;
  choices: CourseChoice[];
  /** Plain-English "why the correct answer is correct" shown after
      submission. Required on v2 questions. */
  rationale: string;
  /** Weight in the course-score formula — defaults to 1. */
  weight?: number;
}

export interface CourseModule {
  id: string;
  title: string;
  summary: string;
  body: string;
  bullets: string[];

  // v2 — multi-question modules use `questions`.
  questions?: CourseQuestion[];

  // v1 legacy — single-question shape. The renderer wraps this into a
  // synthetic CourseQuestion[] via `wrapLegacyModule` so all UI code
  // can assume v2 shape.
  question?: string;
  choices?: CourseChoice[];
}

export interface CoursePack {
  slug: string;
  version: number;
  passThresholdPct: number;
  estimatedMinutes: number;
  modules: CourseModule[];
}

/** v1: one answer per moduleId. v2: one or more answers per questionId. */
export interface AcademyAttemptPayload {
  kind: 'course_attempt';
  moduleScores: Record<string, number>;
  quizAnswers: Record<string, string> | Record<string, string[]>;
  durationSeconds: number;
}

/**
 * Build a synthetic v2 questions[] from a v1 module so the renderer
 * never has to branch. The questionId equals the moduleId (the same
 * convention the BE answer-key v1 ports use).
 */
export function wrapLegacyModule(m: CourseModule): CourseQuestion[] {
  if (m.questions && m.questions.length > 0) return m.questions;
  if (!m.question || !m.choices) return [];
  return [
    {
      id: m.id,
      kind: 'single_choice',
      prompt: m.question,
      choices: m.choices,
      rationale:
        'Review the module guidance — this question reinforces the core idea above.',
    },
  ];
}
