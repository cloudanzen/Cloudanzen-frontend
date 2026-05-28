import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Award,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  GraduationCap,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import type {
  AcademyAttemptPayload,
  CoursePack,
  CourseModule,
  CourseQuestion,
} from '@/app/pages/onboarding/coursePacks/types';
import { wrapLegacyModule } from '@/app/pages/onboarding/coursePacks/types';
import {
  type AnswerKey,
  isQuestionCorrect,
  scoreCoursePct,
} from '@/lib/training/course-scoring';

interface CloudAnzenAcademyProps {
  course: CoursePack;
  userId: string;
  onStart: () => Promise<void> | void;
  onComplete: (
    payload: AcademyAttemptPayload,
    scorePct: number,
  ) => Promise<void>;
}

type SavedState = {
  startedAt: string | null;
  activeModuleId: string;
  /** questionId → user's selected choice ids (order matters for ranking). */
  answers: Record<string, string[]>;
};

function storageKey(userId: string, course: CoursePack) {
  return `cloudanzen-academy-state:${userId}:${course.slug}:${course.version}`;
}

/** Build an FE-local answer key from a question's `isCorrect` / `rankOrder`
    fields. The BE has the canonical key; this one is for inline scoring. */
function answerKeyFromQuestion(q: CourseQuestion): AnswerKey {
  if (q.kind === 'ranking') {
    const rankOrder = [...q.choices]
      .filter((c) => typeof c.rankOrder === 'number')
      .sort((a, b) => (a.rankOrder ?? 99) - (b.rankOrder ?? 99))
      .map((c) => c.id);
    return { questionId: q.id, kind: 'ranking', rankOrder, weight: q.weight };
  }
  const correctIds = q.choices.filter((c) => c.isCorrect).map((c) => c.id);
  return {
    questionId: q.id,
    kind: q.kind,
    selectionMode: q.selectionMode,
    correctIds,
    weight: q.weight,
  };
}

/** All questions in the course, flattened across modules. */
function allQuestions(course: CoursePack): Array<{
  module: CourseModule;
  question: CourseQuestion;
}> {
  const out: Array<{ module: CourseModule; question: CourseQuestion }> = [];
  for (const m of course.modules) {
    for (const q of wrapLegacyModule(m)) out.push({ module: m, question: q });
  }
  return out;
}

export function CloudAnzenAcademy({
  course,
  userId,
  onStart,
  onComplete,
}: CloudAnzenAcademyProps) {
  const { t, i18n } = useTranslation('onboarding');
  const key = storageKey(userId, course);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [activeModuleId, setActiveModuleId] = useState(
    course.modules[0]?.id ?? '',
  );
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load saved state (and migrate from the pre-Academy `manzen-…` key).
  useEffect(() => {
    try {
      const oldKey = `manzen-security-quest-state:${userId}`;
      const legacy = localStorage.getItem(oldKey);
      if (legacy && course.slug === 'iso-27001-security-awareness') {
        localStorage.setItem(key, legacy);
        localStorage.removeItem(oldKey);
      }
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<SavedState>;
      if (parsed.startedAt) setStartedAt(parsed.startedAt);
      if (parsed.activeModuleId) setActiveModuleId(parsed.activeModuleId);
      if (parsed.answers) setAnswers(parsed.answers);
    } catch {
      /* localStorage is best-effort only */
    }
  }, [course.slug, key, userId]);

  // Persist.
  useEffect(() => {
    try {
      const state: SavedState = { startedAt, activeModuleId, answers };
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      /* localStorage is best-effort only */
    }
  }, [activeModuleId, answers, key, startedAt]);

  const flatQuestions = useMemo(() => allQuestions(course), [course]);
  const answerKeys = useMemo(
    () => flatQuestions.map(({ question }) => answerKeyFromQuestion(question)),
    [flatQuestions],
  );
  const answeredQuestionIds = useMemo(
    () =>
      new Set(
        Object.keys(answers).filter((id) => (answers[id] ?? []).length > 0),
      ),
    [answers],
  );
  const totalQuestions = flatQuestions.length;
  const answeredCount = answeredQuestionIds.size;
  const allAnswered = totalQuestions > 0 && answeredCount === totalQuestions;
  const scorePct = useMemo(
    () => scoreCoursePct(answerKeys, answers),
    [answerKeys, answers],
  );
  const passed = scorePct >= course.passThresholdPct;
  const showEnglishOnlyNote = !i18n.language.toLowerCase().startsWith('en');

  const activeModule =
    course.modules.find((item) => item.id === activeModuleId) ??
    course.modules[0];
  const activeQuestions = activeModule ? wrapLegacyModule(activeModule) : [];

  async function startIfNeeded() {
    if (startedAt) return;
    const now = new Date().toISOString();
    setStartedAt(now);
    await onStart();
  }

  function setAnswer(questionId: string, value: string[]) {
    void startIfNeeded();
    setAnswers((current) => ({ ...current, [questionId]: value }));
  }

  async function complete() {
    setError(null);
    if (!allAnswered) {
      setError(t('cloudanzenAcademy.player.answerEveryModule'));
      return;
    }
    if (!passed) {
      setError(
        t('cloudanzenAcademy.player.passThreshold', {
          threshold: course.passThresholdPct,
        }),
      );
      return;
    }

    setSaving(true);
    try {
      // Per-module display score — UI only; not used by the pass-gate.
      const moduleScores: Record<string, number> = {};
      for (const m of course.modules) {
        const mq = wrapLegacyModule(m);
        if (mq.length === 0) {
          moduleScores[m.id] = 0;
          continue;
        }
        const mKeys = mq.map(answerKeyFromQuestion);
        moduleScores[m.id] = scoreCoursePct(mKeys, answers);
      }
      const durationSeconds = startedAt
        ? Math.max(0, Math.round((Date.now() - Date.parse(startedAt)) / 1000))
        : 0;
      await onComplete(
        {
          kind: 'course_attempt',
          moduleScores,
          quizAnswers: answers,
          durationSeconds,
        },
        scorePct,
      );
      localStorage.removeItem(key);
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setAnswers({});
    setActiveModuleId(course.modules[0]?.id ?? '');
    setError(null);
    try {
      localStorage.removeItem(key);
    } catch {
      /* localStorage is best-effort only */
    }
  }

  if (!activeModule) {
    return (
      <div className="rounded-lg border border-border bg-muted/40 p-6 text-sm text-muted-foreground">
        {t('cloudanzenAcademy.player.courseUnavailable')}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <header className="border-b border-border px-5 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-blue-600" />
              <h3 className="text-base font-semibold text-foreground">
                {t('cloudanzenAcademy.player.title')}
              </h3>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('cloudanzenAcademy.player.checksComplete', {
                done: answeredCount,
                total: totalQuestions,
              })}{' '}
              · {t('cloudanzenAcademy.player.score', { score: scorePct })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              <RotateCcw className="h-4 w-4" />
              {t('cloudanzenAcademy.player.reset')}
            </button>
            <button
              type="button"
              onClick={complete}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-blue-300"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Award className="h-4 w-4" />
              )}
              {t('cloudanzenAcademy.player.completeCourse')}
            </button>
          </div>
        </div>
      </header>

      <div className="grid min-h-[420px] lg:grid-cols-[240px_1fr]">
        <nav className="border-b border-border p-3 lg:border-b-0 lg:border-r">
          <ul className="space-y-1">
            {course.modules.map((m) => {
              const isActive = m.id === activeModule.id;
              const mq = wrapLegacyModule(m);
              const moduleAnswered = mq.every((q) =>
                answeredQuestionIds.has(q.id),
              );
              const moduleAllCorrect =
                mq.length > 0 &&
                mq.every(
                  (q) =>
                    isQuestionCorrect(
                      answerKeyFromQuestion(q),
                      answers[q.id],
                    ) === 1,
                );
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => {
                      void startIfNeeded();
                      setActiveModuleId(m.id);
                    }}
                    className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {moduleAnswered ? (
                      <CheckCircle2
                        className={`h-4 w-4 ${moduleAllCorrect ? 'text-green-600' : 'text-amber-600'}`}
                      />
                    ) : (
                      <Circle className="h-4 w-4" />
                    )}
                    <span className="truncate">{m.title}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <section className="p-5">
          {showEnglishOnlyNote && (
            <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {t('cloudanzenAcademy.player.englishOnlyNote')}
            </div>
          )}

          <div className="mb-5 flex items-start gap-3">
            <div className="rounded-md bg-blue-50 p-2 text-blue-600">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-foreground">
                {activeModule.title}
              </h4>
              <p className="mt-1 text-sm text-muted-foreground">
                {activeModule.summary}
              </p>
            </div>
          </div>

          <div className="prose prose-sm max-w-none text-foreground">
            {activeModule.body.split('\n\n').map((para, idx) => (
              <p key={idx}>{para}</p>
            ))}
            <ul>
              {activeModule.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </div>

          <div className="mt-6 space-y-4">
            {activeQuestions.map((q) => (
              <QuestionCard
                key={q.id}
                question={q}
                value={answers[q.id] ?? []}
                onChange={(v) => setAnswer(q.id, v)}
              />
            ))}
          </div>

          {error && (
            <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {error}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// ── question renderers ──────────────────────────────────────────────────────

interface QuestionCardProps {
  question: CourseQuestion;
  value: string[];
  onChange: (next: string[]) => void;
}

function QuestionCard({ question, value, onChange }: QuestionCardProps) {
  const answered = value.length > 0;
  const correct =
    answered && isQuestionCorrect(answerKeyFromQuestion(question), value) === 1;

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      {question.scenario && (
        <p className="mb-2 text-sm italic text-muted-foreground">
          {question.scenario}
        </p>
      )}
      <p className="text-sm font-semibold text-foreground">{question.prompt}</p>

      <QuestionBody question={question} value={value} onChange={onChange} />

      {answered && (
        <p
          className={`mt-3 text-sm ${correct ? 'text-green-700' : 'text-amber-700'}`}
        >
          <strong>{correct ? '✓ ' : '⚠ '}</strong>
          {question.rationale}
        </p>
      )}
    </div>
  );
}

function QuestionBody({ question, value, onChange }: QuestionCardProps) {
  const isSingle =
    question.kind === 'single_choice' ||
    (question.kind === 'scenario' && question.selectionMode === 'single');
  const isMulti =
    question.kind === 'multi_choice' ||
    (question.kind === 'scenario' && question.selectionMode === 'multi');

  if (question.kind === 'ranking') {
    return (
      <RankingBody question={question} value={value} onChange={onChange} />
    );
  }

  return (
    <div className="mt-3 grid gap-2">
      {question.choices.map((choice) => {
        const selected = value.includes(choice.id);
        const onClick = () => {
          if (isSingle) {
            onChange([choice.id]);
            return;
          }
          if (isMulti) {
            onChange(
              selected
                ? value.filter((id) => id !== choice.id)
                : [...value, choice.id],
            );
          }
        };
        return (
          <button
            key={choice.id}
            type="button"
            onClick={onClick}
            aria-pressed={selected}
            className={`flex items-start gap-2 rounded-md border px-3 py-2 text-left text-sm ${
              selected
                ? choice.isCorrect
                  ? 'border-green-300 bg-green-50 text-green-800'
                  : 'border-amber-300 bg-amber-50 text-amber-800'
                : 'border-border bg-card hover:bg-muted'
            }`}
          >
            <span className="mt-0.5">
              {isMulti ? (
                <span className="inline-block h-4 w-4 rounded border border-current">
                  {selected ? '✓' : ''}
                </span>
              ) : (
                <span className="inline-block h-4 w-4 rounded-full border border-current">
                  {selected ? '●' : ''}
                </span>
              )}
            </span>
            <span>{choice.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function RankingBody({ question, value, onChange }: QuestionCardProps) {
  // The displayed order starts from the user's current `value`, then
  // appends any choices they haven't placed yet (in declaration order).
  const ordered = useMemo(() => {
    const placed = value.filter((id) =>
      question.choices.some((c) => c.id === id),
    );
    const remaining = question.choices
      .map((c) => c.id)
      .filter((id) => !placed.includes(id));
    return [...placed, ...remaining];
  }, [question.choices, value]);

  function move(idx: number, delta: -1 | 1) {
    const next = [...ordered];
    const target = idx + delta;
    if (target < 0 || target >= next.length) return;
    const a = next[idx];
    const b = next[target];
    if (a === undefined || b === undefined) return;
    next[idx] = b;
    next[target] = a;
    onChange(next);
  }

  return (
    <ol className="mt-3 space-y-1">
      {ordered.map((id, idx) => {
        const choice = question.choices.find((c) => c.id === id);
        if (!choice) return null;
        return (
          <li
            key={id}
            className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm"
          >
            <span className="w-6 text-xs font-semibold text-muted-foreground">
              {idx + 1}.
            </span>
            <span className="flex-1">{choice.label}</span>
            <button
              type="button"
              onClick={() => move(idx, -1)}
              disabled={idx === 0}
              className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
              aria-label="Move up"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => move(idx, 1)}
              disabled={idx === ordered.length - 1}
              className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
              aria-label="Move down"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </li>
        );
      })}
    </ol>
  );
}
