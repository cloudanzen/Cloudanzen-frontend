import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Circle,
  GraduationCap,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import type {
  AcademyAttemptPayload,
  CoursePack,
} from '@/app/pages/onboarding/coursePacks/types';

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
  answers: Record<string, string>;
};

function storageKey(userId: string, course: CoursePack) {
  return `cloudanzen-academy-state:${userId}:${course.slug}:${course.version}`;
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
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    try {
      const state: SavedState = { startedAt, activeModuleId, answers };
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      /* localStorage is best-effort only */
    }
  }, [activeModuleId, answers, key, startedAt]);

  const activeModule =
    course.modules.find((item) => item.id === activeModuleId) ??
    course.modules[0];

  const answeredCount = Object.keys(answers).length;
  const correctCount = useMemo(
    () =>
      course.modules.filter(
        (module) =>
          module.choices.find((choice) => choice.id === answers[module.id])
            ?.isCorrect,
      ).length,
    [answers, course.modules],
  );
  const scorePct =
    course.modules.length === 0
      ? 0
      : Math.round((correctCount / course.modules.length) * 100);
  const completeReady = answeredCount === course.modules.length;
  const passed = scorePct >= course.passThresholdPct;
  const showEnglishOnlyNote = !i18n.language.toLowerCase().startsWith('en');

  async function startIfNeeded() {
    if (startedAt) return;
    const now = new Date().toISOString();
    setStartedAt(now);
    await onStart();
  }

  async function complete() {
    setError(null);
    if (!completeReady) {
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
      const moduleScores = Object.fromEntries(
        course.modules.map((module) => [
          module.id,
          module.choices.find((choice) => choice.id === answers[module.id])
            ?.isCorrect
            ? 100
            : 0,
        ]),
      );
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
      <div className="border-b border-border px-5 py-4">
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
                total: course.modules.length,
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
      </div>

      <div className="grid min-h-[420px] lg:grid-cols-[240px_1fr]">
        <div className="border-b border-border p-3 lg:border-b-0 lg:border-r">
          <div className="space-y-1">
            {course.modules.map((module) => {
              const isActive = module.id === activeModule.id;
              const answered = answers[module.id];
              const correct = module.choices.find(
                (choice) => choice.id === answered,
              )?.isCorrect;
              return (
                <button
                  key={module.id}
                  type="button"
                  onClick={() => {
                    void startIfNeeded();
                    setActiveModuleId(module.id);
                  }}
                  className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {answered ? (
                    <CheckCircle2
                      className={`h-4 w-4 ${correct ? 'text-green-600' : 'text-amber-600'}`}
                    />
                  ) : (
                    <Circle className="h-4 w-4" />
                  )}
                  <span className="truncate">{module.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-5">
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
            <p>{activeModule.body}</p>
            <ul>
              {activeModule.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </div>

          <div className="mt-6 rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-sm font-semibold text-foreground">
              {activeModule.question}
            </p>
            <div className="mt-3 grid gap-2">
              {activeModule.choices.map((choice) => {
                const selected = answers[activeModule.id] === choice.id;
                return (
                  <button
                    key={choice.id}
                    type="button"
                    onClick={() => {
                      void startIfNeeded();
                      setAnswers((current) => ({
                        ...current,
                        [activeModule.id]: choice.id,
                      }));
                    }}
                    className={`rounded-md border px-3 py-2 text-left text-sm ${
                      selected
                        ? choice.isCorrect
                          ? 'border-green-300 bg-green-50 text-green-800'
                          : 'border-amber-300 bg-amber-50 text-amber-800'
                        : 'border-border bg-card hover:bg-muted'
                    }`}
                  >
                    {choice.label}
                  </button>
                );
              })}
            </div>
            {answers[activeModule.id] && (
              <p className="mt-3 text-sm text-muted-foreground">
                {
                  activeModule.choices.find(
                    (choice) => choice.id === answers[activeModule.id],
                  )?.feedback
                }
              </p>
            )}
          </div>

          {error && (
            <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
