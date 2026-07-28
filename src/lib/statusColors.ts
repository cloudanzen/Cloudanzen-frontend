/**
 * statusColors.ts — shared badge colour maps for severity/tier enums.
 *
 * Extracted from per-page copies (Quality Plan Phase 1.4). Keyed on the plain
 * string unions (not service-specific types) so any service whose enum matches
 * these values can use them. Page-specific one-off maps stay in their pages.
 */

export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/** Finding/threshold severity badges (runtime findings, RAG hygiene, …). */
export const SEVERITY_COLORS: Record<SeverityLevel, string> = {
  LOW: 'bg-gray-50 text-gray-600 border-gray-200',
  MEDIUM: 'bg-blue-50 text-blue-700 border-blue-200',
  HIGH: 'bg-amber-50 text-amber-700 border-amber-200',
  CRITICAL: 'bg-rose-50 text-rose-700 border-rose-200',
};

export type AiRiskTierLevel = 'MINIMAL' | 'LIMITED' | 'HIGH' | 'UNACCEPTABLE';

/** EU AI Act-aligned risk-tier badges (AI systems registry + use cases). */
export const RISK_TIER_COLORS: Record<AiRiskTierLevel, string> = {
  MINIMAL: 'bg-gray-50 text-gray-600 border-gray-200',
  LIMITED: 'bg-blue-50 text-blue-700 border-blue-200',
  HIGH: 'bg-amber-50 text-amber-700 border-amber-200',
  UNACCEPTABLE: 'bg-rose-50 text-rose-700 border-rose-200',
};
