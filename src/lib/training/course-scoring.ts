/**
 * Course-scoring engine for CloudAnzen Academy.
 *
 * Identical implementation lives in the backend repo at
 * `src/lib/training/course-scoring.ts`. Keep both copies in lock-step.
 *
 * Canonical formula:
 *   coursePct = sum(weight * isCorrect) / sum(weight) * 100
 *
 * No partial credit on multi-choice (full set match or 0).
 */

export type QuestionKind =
  | 'single_choice'
  | 'multi_choice'
  | 'scenario'
  | 'ranking';

export interface AnswerKey {
  questionId: string;
  kind: QuestionKind;
  weight?: number;
  correctIds?: string[];
  rankOrder?: string[];
  selectionMode?: 'single' | 'multi';
}

export type QuestionAnswer = string[];

export function isQuestionCorrect(
  key: AnswerKey,
  answer: QuestionAnswer | undefined,
): 0 | 1 {
  if (!answer || answer.length === 0) return 0;

  if (key.kind === 'ranking') {
    const expected = key.rankOrder ?? [];
    if (expected.length !== answer.length) return 0;
    for (let i = 0; i < expected.length; i++) {
      if (expected[i] !== answer[i]) return 0;
    }
    return 1;
  }

  const correctIds = new Set(key.correctIds ?? []);
  const chosen = new Set(answer);

  const isSingle =
    key.kind === 'single_choice' ||
    (key.kind === 'scenario' && key.selectionMode === 'single');

  if (isSingle) {
    if (chosen.size !== 1) return 0;
    const onlyChoice = [...chosen][0];
    return onlyChoice !== undefined && correctIds.has(onlyChoice) ? 1 : 0;
  }

  if (chosen.size !== correctIds.size) return 0;
  for (const id of chosen) if (!correctIds.has(id)) return 0;
  return 1;
}

export function scoreCoursePct(
  answerKeys: AnswerKey[],
  answers: Record<string, QuestionAnswer>,
): number {
  if (answerKeys.length === 0) return 0;
  let weighted = 0;
  let totalWeight = 0;
  for (const key of answerKeys) {
    const weight = key.weight ?? 1;
    totalWeight += weight;
    weighted += weight * isQuestionCorrect(key, answers[key.questionId]);
  }
  if (totalWeight === 0) return 0;
  return Math.round((weighted / totalWeight) * 100);
}
