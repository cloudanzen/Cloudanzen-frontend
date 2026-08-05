/**
 * findings/EvidenceSynthesisPanel.tsx — split out of the original 1,487-line FindingsPage.tsx
 * in Phase 4. Component body is unchanged.
 */

import { useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  X,
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { ControlCandidate } from '@/services/api/ai';
import {
  useEvidenceSynthesis,
  type EvidenceSynthesisResult,
} from '@/app/pages/compliance/useFindingsData';

export function ConfidenceBadge({
  confidence,
}: {
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}) {
  const meta = {
    HIGH: 'bg-green-50 text-green-700',
    MEDIUM: 'bg-amber-50 text-amber-700',
    LOW: 'bg-red-50 text-red-700',
  }[confidence];
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${meta}`}
    >
      {confidence}
    </span>
  );
}

export function EvidenceSynthesisPanel({ findingId }: { findingId: string }) {
  const [summaryInput, setSummaryInput] = useState('');
  const [result, setResult] = useState<EvidenceSynthesisResult | null>(null);
  const [showInput, setShowInput] = useState(false);
  const [expandedCandidate, setExpandedCandidate] = useState<string | null>(
    null,
  );

  const {
    synthesizeMutation: rawSynthesize,
    acceptMutation,
    dismissMutation: rawDismiss,
  } = useEvidenceSynthesis(findingId);

  const synthesizeMutation = {
    ...rawSynthesize,
    mutate: (summary: string) =>
      rawSynthesize.mutate(summary, {
        onSuccess: (data: { data: EvidenceSynthesisResult }) => {
          setResult(data.data);
          setShowInput(false);
        },
      }),
  };

  const dismissMutation = {
    ...rawDismiss,
    mutate: (id: string) =>
      rawDismiss.mutate(id, {
        onSuccess: () => setResult(null),
      }),
  };

  if (!showInput && !result) {
    return (
      <button
        className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700"
        onClick={() => setShowInput(true)}
      >
        <Sparkles className="h-3.5 w-3.5" />
        Suggest control mappings with AI
      </button>
    );
  }

  if (showInput && !result) {
    return (
      <div className="space-y-3 rounded-lg border border-blue-100 bg-blue-50 p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-blue-700 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            AI evidence synthesis
          </p>
          <button
            onClick={() => setShowInput(false)}
            className="text-blue-400 hover:text-blue-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <textarea
          className="w-full min-h-[80px] rounded-lg border border-blue-200 bg-white p-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
          placeholder="Describe what evidence this finding contains (e.g. 'GitHub branch protection check failed — no required reviewers on default branch')"
          value={summaryInput}
          onChange={(e) => setSummaryInput(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => synthesizeMutation.mutate(summaryInput.trim())}
            disabled={!summaryInput.trim() || synthesizeMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
          >
            {synthesizeMutation.isPending ? (
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            ) : (
              <Sparkles className="mr-1 h-3 w-3" />
            )}
            Analyze
          </Button>
          <p className="text-xs text-blue-500">
            Output requires human review before any change is made
          </p>
        </div>
        {synthesizeMutation.isError && (
          <p className="text-xs text-red-600">
            Analysis failed. Please try again.
          </p>
        )}
      </div>
    );
  }

  if (result) {
    const isAccepted = acceptMutation.isSuccess;
    const isDismissed = dismissMutation.isSuccess;

    return (
      <div className="space-y-3 rounded-lg border border-blue-100 bg-blue-50 p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-blue-700 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            AI-suggested control mappings
          </p>
          <span className="text-xs text-blue-500 italic">
            Pending your review
          </span>
        </div>

        {result.controlCandidates.length === 0 ? (
          <p className="text-sm text-gray-500">
            No matching controls found. Try refining the evidence description.
          </p>
        ) : (
          <div className="space-y-2">
            {result.controlCandidates.map((candidate: ControlCandidate) => (
              <div
                key={candidate.controlId}
                className="rounded-lg border border-blue-200 bg-white p-3"
              >
                <button
                  className="flex w-full items-start justify-between gap-2 text-left"
                  onClick={() =>
                    setExpandedCandidate(
                      expandedCandidate === candidate.controlId
                        ? null
                        : candidate.controlId,
                    )
                  }
                >
                  <div className="flex items-center gap-2">
                    <ConfidenceBadge confidence={candidate.confidence} />
                    <span className="text-sm font-medium text-gray-800 truncate">
                      {candidate.controlTitle}
                    </span>
                  </div>
                  {expandedCandidate === candidate.controlId ? (
                    <ChevronUp className="h-4 w-4 flex-shrink-0 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 flex-shrink-0 text-gray-400" />
                  )}
                </button>
                {expandedCandidate === candidate.controlId && (
                  <p className="mt-2 text-xs text-gray-600 border-t border-gray-100 pt-2 leading-relaxed">
                    {candidate.rationale}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {result.recommendedControlId && (
          <p className="text-xs text-blue-600">
            Recommended: control{' '}
            <code className="font-mono">{result.recommendedControlId}</code>
          </p>
        )}

        {!isAccepted && !isDismissed && (
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              onClick={() => acceptMutation.mutate(result.generationId)}
              disabled={acceptMutation.isPending}
              className="bg-green-600 hover:bg-green-700 text-white text-xs"
            >
              {acceptMutation.isPending ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <ThumbsUp className="mr-1 h-3 w-3" />
              )}
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => dismissMutation.mutate(result.generationId)}
              disabled={dismissMutation.isPending}
              className="text-xs"
            >
              {dismissMutation.isPending ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <ThumbsDown className="mr-1 h-3 w-3" />
              )}
              Dismiss
            </Button>
          </div>
        )}

        {isAccepted && (
          <p className="text-xs text-green-700 flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Accepted — review the suggested controls and confirm mappings
            manually.
          </p>
        )}
        {isDismissed && (
          <p className="text-xs text-gray-500">Suggestion dismissed.</p>
        )}
      </div>
    );
  }

  return null;
}
