/**
 * Course-scoring engine — CloudAnzen Academy.
 *
 * This decides whether someone passes a training module, which is evidence for
 * an ISO control. It was untested on both sides despite its own header saying
 * an identical copy lives in the backend at `src/lib/training/course-scoring.ts`
 * and the two must stay in lock-step. Nothing enforced that, and nothing
 * enforced the formula itself.
 *
 * The rules being pinned here:
 *   coursePct = sum(weight * isCorrect) / sum(weight) * 100
 *   no partial credit on multi-choice — full set match or zero
 */

import { describe, it, expect } from 'vitest';
import {
  isQuestionCorrect,
  scoreCoursePct,
  type AnswerKey,
} from '@/lib/training/course-scoring';

const single = (correctIds: string[]): AnswerKey => ({
  questionId: 'q1',
  kind: 'single_choice',
  correctIds,
});

const multi = (correctIds: string[]): AnswerKey => ({
  questionId: 'q1',
  kind: 'multi_choice',
  correctIds,
});

describe('isQuestionCorrect — unanswered', () => {
  it.each([
    ['undefined', undefined],
    ['empty array', [] as string[]],
  ])('scores 0 for an %s answer', (_label, answer) => {
    expect(isQuestionCorrect(single(['a']), answer)).toBe(0);
  });
});

describe('isQuestionCorrect — single choice', () => {
  it('scores 1 for the correct option', () => {
    expect(isQuestionCorrect(single(['a']), ['a'])).toBe(1);
  });

  it('scores 0 for the wrong option', () => {
    expect(isQuestionCorrect(single(['a']), ['b'])).toBe(0);
  });

  it('scores 0 when more than one option is selected', () => {
    // Selecting everything must not pass a single-choice question.
    expect(isQuestionCorrect(single(['a']), ['a', 'b'])).toBe(0);
  });

  it('treats a scenario with selectionMode single the same way', () => {
    const key: AnswerKey = {
      questionId: 'q1',
      kind: 'scenario',
      selectionMode: 'single',
      correctIds: ['a'],
    };

    expect(isQuestionCorrect(key, ['a'])).toBe(1);
    expect(isQuestionCorrect(key, ['a', 'b'])).toBe(0);
  });
});

describe('isQuestionCorrect — multi choice has no partial credit', () => {
  it('scores 1 only for the exact set', () => {
    expect(isQuestionCorrect(multi(['a', 'b']), ['a', 'b'])).toBe(1);
  });

  it('is order-insensitive', () => {
    expect(isQuestionCorrect(multi(['a', 'b']), ['b', 'a'])).toBe(1);
  });

  it('scores 0 for a subset — two of three right is still zero', () => {
    expect(isQuestionCorrect(multi(['a', 'b', 'c']), ['a', 'b'])).toBe(0);
  });

  it('scores 0 for a superset', () => {
    expect(isQuestionCorrect(multi(['a']), ['a', 'b'])).toBe(0);
  });

  it('scores 0 for the right count but wrong members', () => {
    // Guards the size-then-membership check: equal sizes alone must not pass.
    expect(isQuestionCorrect(multi(['a', 'b']), ['a', 'c'])).toBe(0);
  });

  it('ignores duplicate selections when comparing sets', () => {
    // Answers are de-duplicated into a Set, so a repeated id must not inflate
    // the size and fail the comparison.
    expect(isQuestionCorrect(multi(['a', 'b']), ['a', 'b', 'b'])).toBe(1);
  });

  it('treats a scenario without selectionMode as multi', () => {
    const key: AnswerKey = {
      questionId: 'q1',
      kind: 'scenario',
      correctIds: ['a', 'b'],
    };

    expect(isQuestionCorrect(key, ['a', 'b'])).toBe(1);
    expect(isQuestionCorrect(key, ['a'])).toBe(0);
  });
});

describe('isQuestionCorrect — ranking is order-sensitive', () => {
  const ranking: AnswerKey = {
    questionId: 'q1',
    kind: 'ranking',
    rankOrder: ['a', 'b', 'c'],
  };

  it('scores 1 for the exact order', () => {
    expect(isQuestionCorrect(ranking, ['a', 'b', 'c'])).toBe(1);
  });

  it('scores 0 for the right members in the wrong order', () => {
    // This is the one kind where order matters — a set comparison would
    // wrongly pass this.
    expect(isQuestionCorrect(ranking, ['b', 'a', 'c'])).toBe(0);
  });

  it('scores 0 for an incomplete ranking', () => {
    expect(isQuestionCorrect(ranking, ['a', 'b'])).toBe(0);
  });

  it('scores 0 for extra entries', () => {
    expect(isQuestionCorrect(ranking, ['a', 'b', 'c', 'd'])).toBe(0);
  });
});

describe('scoreCoursePct', () => {
  it('returns 0 for a course with no questions rather than NaN', () => {
    // 0/0 would be NaN, which would render as "NaN%" on a certificate.
    expect(scoreCoursePct([], {})).toBe(0);
  });

  it('scores 100 when everything is right', () => {
    const keys = [single(['a']), { ...single(['b']), questionId: 'q2' }];

    expect(scoreCoursePct(keys, { q1: ['a'], q2: ['b'] })).toBe(100);
  });

  it('scores 0 when everything is wrong', () => {
    expect(scoreCoursePct([single(['a'])], { q1: ['z'] })).toBe(0);
  });

  it('defaults an absent weight to 1', () => {
    const keys = [single(['a']), { ...single(['b']), questionId: 'q2' }];

    expect(scoreCoursePct(keys, { q1: ['a'] })).toBe(50);
  });

  it('weights questions unequally when weights are given', () => {
    // q1 weight 3 correct, q2 weight 1 wrong → 3/4 = 75
    const keys: AnswerKey[] = [
      { questionId: 'q1', kind: 'single_choice', correctIds: ['a'], weight: 3 },
      { questionId: 'q2', kind: 'single_choice', correctIds: ['b'], weight: 1 },
    ];

    expect(scoreCoursePct(keys, { q1: ['a'], q2: ['z'] })).toBe(75);
  });

  it('rounds to the nearest whole percent', () => {
    // 2 of 3 → 66.67 → 67
    const keys = [
      single(['a']),
      { ...single(['b']), questionId: 'q2' },
      { ...single(['c']), questionId: 'q3' },
    ];

    expect(scoreCoursePct(keys, { q1: ['a'], q2: ['b'], q3: ['z'] })).toBe(67);
  });

  it('returns 0 when every weight is zero rather than dividing by zero', () => {
    const keys: AnswerKey[] = [
      { questionId: 'q1', kind: 'single_choice', correctIds: ['a'], weight: 0 },
    ];

    expect(scoreCoursePct(keys, { q1: ['a'] })).toBe(0);
  });

  it('treats a missing answer as wrong rather than skipping the question', () => {
    // Skipping would shrink the denominator and inflate the score.
    const keys = [single(['a']), { ...single(['b']), questionId: 'q2' }];

    expect(scoreCoursePct(keys, { q1: ['a'] })).toBe(50);
  });
});
