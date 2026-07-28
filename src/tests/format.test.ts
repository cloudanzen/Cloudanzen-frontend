import { describe, it, expect } from 'vitest';

import { titleCase } from '../lib/format';
import {
  SEVERITY_COLORS,
  RISK_TIER_COLORS,
  type SeverityLevel,
  type AiRiskTierLevel,
} from '../lib/statusColors';

describe('titleCase', () => {
  it('title-cases UPPER_SNAKE enum values', () => {
    expect(titleCase('PROMPT_INJECTION')).toBe('Prompt injection');
    expect(titleCase('HUMAN_IN_LOOP')).toBe('Human in loop');
    expect(titleCase('HIGH')).toBe('High');
  });

  it('leaves the first character as-is and lowercases the rest', () => {
    expect(titleCase('a')).toBe('a');
    expect(titleCase('OK')).toBe('Ok');
  });
});

describe('status colour maps', () => {
  it('covers every severity level with a badge class', () => {
    const levels: SeverityLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    for (const l of levels) {
      expect(SEVERITY_COLORS[l]).toMatch(/bg-.*text-.*border-/);
    }
  });

  it('covers every AI risk tier with a badge class', () => {
    const tiers: AiRiskTierLevel[] = [
      'MINIMAL',
      'LIMITED',
      'HIGH',
      'UNACCEPTABLE',
    ];
    for (const t of tiers) {
      expect(RISK_TIER_COLORS[t]).toMatch(/bg-.*text-.*border-/);
    }
  });

  it('escalates HIGH and CRITICAL/UNACCEPTABLE to warning/danger hues', () => {
    expect(SEVERITY_COLORS.HIGH).toContain('amber');
    expect(SEVERITY_COLORS.CRITICAL).toContain('rose');
    expect(RISK_TIER_COLORS.UNACCEPTABLE).toContain('rose');
  });
});
