import React from 'react';
import {
  Trophy,
  Shield,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import type { QuestState } from '../lib/types';
import {
  computePercentage,
  computeTopicSummaries,
  getTopicLabel,
  getTakeawaysForMistakes,
  isRetakeRecommended,
} from '../lib/scoring';
import { MASCOT_LINES } from '../content/copy';
import { BadgeTray } from './BadgeTray';
import { ALL_MODULES } from '../content/modules';

interface SummaryScreenProps {
  state: QuestState;
  onComplete: () => void;
  onRetake: () => void;
}

const RATING_CONFIG = {
  'Security Champion': {
    icon: Trophy,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    mascotLine: MASCOT_LINES.summaryChampion,
  },
  'Strong Defender': {
    icon: Shield,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    mascotLine: MASCOT_LINES.summaryStrong,
  },
  'Needs Reinforcement': {
    icon: AlertTriangle,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    mascotLine: MASCOT_LINES.summaryReinforcement,
  },
  'Retake Recommended': {
    icon: RotateCcw,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    mascotLine: MASCOT_LINES.summaryRetake,
  },
};

export function SummaryScreen({
  state,
  onComplete,
  onRetake,
}: SummaryScreenProps) {
  const percentage = computePercentage(state.score, state.maxPossibleScore);
  const rating = state.finalRating ?? 'Retake Recommended';
  const retake = isRetakeRecommended(state.score, state.maxPossibleScore);
  const ratingCfg = RATING_CONFIG[rating];
  const RatingIcon = ratingCfg.icon;

  const topicSummaries = computeTopicSummaries(
    state.correctByTopic,
    state.mistakesByTopic,
  );
  const strengths = topicSummaries.filter((t) => t.isStrength && t.correct > 0);
  const weaknesses = topicSummaries.filter((t) => !t.isStrength);
  const takeaways = getTakeawaysForMistakes(state.mistakesByTopic);

  const minutes = Math.floor(state.timeSpentMs / 60000);
  const seconds = Math.floor((state.timeSpentMs % 60000) / 1000);

  return (
    <div className="max-w-xl mx-auto space-y-5 py-4">
      {/* Rating hero */}
      <div
        className={`rounded-2xl border-2 ${ratingCfg.border} ${ratingCfg.bg} p-5 text-center space-y-3`}
      >
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-white/80 flex items-center justify-center shadow-sm">
            <RatingIcon
              className={`w-7 h-7 ${ratingCfg.color}`}
              aria-hidden="true"
            />
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{rating}</h2>
          <p className="text-3xl font-bold font-mono tabular-nums text-gray-900 mt-1">
            {percentage}%
          </p>
          <p className="text-sm text-gray-500 mt-0.5">
            {state.score} / {state.maxPossibleScore} points
          </p>
        </div>

        <div className="flex items-start gap-2 bg-white/60 rounded-lg px-3 py-2 text-left">
          <ShieldCheck
            className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <p className="text-sm text-slate-700">{ratingCfg.mascotLine}</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-gray-200 bg-white p-3 text-center">
          <p className="text-2xl font-bold font-mono text-gray-900">
            {state.badges.length}
          </p>
          <p className="text-xs text-gray-500">Badges</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3 text-center">
          <p className="text-2xl font-bold font-mono text-gray-900">
            {state.bestStreak}
          </p>
          <p className="text-xs text-gray-500">Best Streak</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3 text-center">
          <p className="text-2xl font-bold font-mono text-gray-900">
            {minutes}:{seconds.toString().padStart(2, '0')}
          </p>
          <p className="text-xs text-gray-500">Time</p>
        </div>
      </div>

      {/* Badges */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-2">
        <h3 className="text-sm font-semibold text-gray-900">Badges Earned</h3>
        <BadgeTray earnedBadgeIds={state.badges} />
      </div>

      {/* Module breakdown */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">Module Scores</h3>
        <div className="space-y-2">
          {ALL_MODULES.map((mod) => {
            const modScore = state.moduleScores[mod.id] ?? 0;
            const modMax = state.moduleMaxScores[mod.id] ?? 0;
            const modPct =
              modMax > 0 ? Math.round((modScore / modMax) * 100) : 0;
            return (
              <div key={mod.id} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-28 truncate">
                  {mod.shortTitle}
                </span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${modPct >= 70 ? 'bg-emerald-500' : modPct >= 50 ? 'bg-amber-500' : 'bg-red-400'}`}
                    style={{ width: `${modPct}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-gray-600 w-10 text-right">
                  {modPct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Strengths */}
      {strengths.length > 0 && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-2">
          <h3 className="text-sm font-semibold text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Strengths
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {strengths.map((s) => (
              <span
                key={s.topic}
                className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium"
              >
                {getTopicLabel(s.topic)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Weaknesses */}
      {weaknesses.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-2">
          <h3 className="text-sm font-semibold text-amber-900 flex items-center gap-2">
            <XCircle className="w-4 h-4" /> Areas to Review
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {weaknesses.map((w) => (
              <span
                key={w.topic}
                className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium"
              >
                {getTopicLabel(w.topic)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Key takeaways */}
      {takeaways.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-2">
          <h3 className="text-sm font-semibold text-gray-900">Key Takeaways</h3>
          <ul className="space-y-1.5">
            {takeaways.map((t, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-gray-600"
              >
                <ArrowRight
                  className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                {t}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Retake recommendation */}
      {retake && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-900">
              Retake recommended
            </p>
            <p className="text-xs text-red-700 mt-0.5">
              Your score indicates some topics need more review. Consider
              retaking the training to strengthen your knowledge.
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-center gap-3 pt-2">
        <button
          onClick={onComplete}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 shadow-sm"
        >
          <CheckCircle2 className="w-4 h-4" />
          Mark Complete
        </button>
        <button
          onClick={onRetake}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
        >
          <RotateCcw className="w-4 h-4" />
          Retake
        </button>
      </div>
    </div>
  );
}
