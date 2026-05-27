import React from 'react';
import { ShieldCheck, Clock, Award, Target, ArrowRight } from 'lucide-react';
import { MASCOT_LINES } from '../content/copy';
import { BADGES } from '../content/badges';

interface IntroScreenProps {
  onStart: () => void;
  /** If user has prior progress, show resume option */
  hasProgress?: boolean;
  onResume?: () => void;
}

export function IntroScreen({
  onStart,
  hasProgress,
  onResume,
}: IntroScreenProps) {
  return (
    <div className="max-w-xl mx-auto space-y-6 py-6">
      {/* Hero */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 mb-2">
          <ShieldCheck className="w-9 h-9 text-slate-700" aria-hidden="true" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
          CloudAnzen Academy
        </h2>
        <p className="text-base text-slate-500 font-medium">
          Security awareness training
        </p>
      </div>

      {/* Mascot welcome */}
      <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-slate-600" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <p className="text-sm text-slate-700 leading-relaxed">
            {MASCOT_LINES.welcome}
          </p>
          <p className="text-sm text-slate-500">{MASCOT_LINES.startPrompt}</p>
        </div>
      </div>

      {/* Info chips */}
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
          <Clock className="w-3.5 h-3.5" aria-hidden="true" />
          10-15 min
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-xs font-medium">
          <Award className="w-3.5 h-3.5" aria-hidden="true" />
          {BADGES.length} badges
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
          <Target className="w-3.5 h-3.5" aria-hidden="true" />
          Real-world scenarios
        </div>
      </div>

      {/* What you'll learn */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-2">
        <h3 className="text-sm font-semibold text-gray-900">
          What you'll cover
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {[
            'Your role in security',
            'Passwords & password managers',
            'Multi-factor authentication',
            'Phishing & social engineering',
            'Device & data protection',
            'Final challenge',
          ].map((topic) => (
            <div
              key={topic}
              className="flex items-center gap-2 text-sm text-gray-600"
            >
              <span
                className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-blue-400"
                aria-hidden="true"
              />
              {topic}
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={onStart}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 shadow-sm"
          autoFocus
        >
          Start Mission
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
        {hasProgress && onResume && (
          <button
            onClick={onResume}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Resume previous session
          </button>
        )}
      </div>
    </div>
  );
}
