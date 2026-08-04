/**
 * Cross-repo parity contract for the course-scoring engine.
 *
 * Both copies of `course-scoring.ts` claim in their headers that
 * `tests/fixtures/course-scoring-golden.json` is "the shared cross-repo parity
 * contract". No such file existed in either repo, so nothing stopped one side's
 * scoring from drifting away from the other's — on code that decides whether
 * someone passes ISO training.
 *
 * This runs the frontend implementation against that fixture. The backend runs
 * its own implementation against a byte-identical copy, so a change to either
 * side that is not mirrored fails CI on whichever side drifted.
 *
 * To add a rule: add a case to the fixture, copy it to the backend, and make
 * both pass.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  isQuestionCorrect,
  scoreCoursePct,
  type AnswerKey,
  type QuestionAnswer,
} from '@/lib/training/course-scoring';

interface GoldenCase {
  name: string;
  answerKeys: AnswerKey[];
  answers: Record<string, QuestionAnswer>;
  expectedPerQuestion: Record<string, 0 | 1>;
  expectedCoursePct: number;
}

interface GoldenFixture {
  version: number;
  cases: GoldenCase[];
}

const fixture = JSON.parse(
  readFileSync(
    resolve(__dirname, 'fixtures', 'course-scoring-golden.json'),
    'utf-8',
  ),
) as GoldenFixture;

describe('course-scoring golden fixture', () => {
  it('is loaded and non-trivial', () => {
    expect(fixture.version).toBe(1);
    expect(fixture.cases.length).toBeGreaterThan(15);
  });

  it('has uniquely named cases', () => {
    const names = fixture.cases.map((c) => c.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it.each(fixture.cases.map((c) => [c.name, c] as const))(
    'course score — %s',
    (_name, testCase) => {
      expect(scoreCoursePct(testCase.answerKeys, testCase.answers)).toBe(
        testCase.expectedCoursePct,
      );
    },
  );

  it.each(fixture.cases.map((c) => [c.name, c] as const))(
    'per-question — %s',
    (_name, testCase) => {
      for (const key of testCase.answerKeys) {
        const expected = testCase.expectedPerQuestion[key.questionId];
        expect(
          isQuestionCorrect(key, testCase.answers[key.questionId]),
          `question ${key.questionId}`,
        ).toBe(expected);
      }
    },
  );

  it('covers every question kind', () => {
    // Guards against the fixture silently losing coverage of a kind as cases
    // are edited over time.
    const kinds = new Set(
      fixture.cases.flatMap((c) => c.answerKeys.map((k) => k.kind)),
    );

    expect(kinds).toEqual(
      new Set(['single_choice', 'multi_choice', 'scenario', 'ranking']),
    );
  });
});
