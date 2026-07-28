/**
 * format.ts — tiny shared text formatters.
 *
 * Extracted from per-page copies (Quality Plan Phase 1.4). Add new pure text
 * helpers here instead of redefining them in pages.
 */

/** "PROMPT_INJECTION" → "Prompt injection". For enum-style UPPER_SNAKE values. */
export const titleCase = (s: string): string =>
  s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, ' ');
