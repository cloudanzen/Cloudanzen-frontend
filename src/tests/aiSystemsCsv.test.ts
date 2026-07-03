import { describe, it, expect } from 'vitest';

import { parseCsv, rowsToPayload, truthy } from '../app/pages/ai/aiSystemsCsv';

describe('parseCsv', () => {
  it('parses a simple header + rows, skipping blank lines', () => {
    const out = parseCsv('a,b\n1,2\n\n3,4\n');
    expect(out).toEqual([
      ['a', 'b'],
      ['1', '2'],
      ['3', '4'],
    ]);
  });

  it('honours quoted fields with embedded commas and escaped quotes', () => {
    const out = parseCsv('name,note\n"Copilot, v2","say ""hi"""');
    expect(out).toEqual([
      ['name', 'note'],
      ['Copilot, v2', 'say "hi"'],
    ]);
  });

  it('handles CRLF newlines', () => {
    expect(parseCsv('a\r\n1\r\n')).toEqual([['a'], ['1']]);
  });
});

describe('truthy', () => {
  it('accepts common truthy tokens, rejects others', () => {
    for (const t of ['true', '1', 'yes', 'Y', ' TRUE ']) {
      expect(truthy(t)).toBe(true);
    }
    for (const f of ['false', '0', 'no', '']) {
      expect(truthy(f)).toBe(false);
    }
  });
});

describe('rowsToPayload', () => {
  it('errors when there is no data row', () => {
    const { rows, error } = rowsToPayload([['externalId', 'name']]);
    expect(rows).toHaveLength(0);
    expect(error).toMatch(/at least one data row/);
  });

  it('errors when required columns are missing from the header', () => {
    const { error } = rowsToPayload([
      ['name', 'riskTier'],
      ['x', 'HIGH'],
    ]);
    expect(error).toMatch(/externalId and name/);
  });

  it('errors when a data row lacks externalId or name', () => {
    const { error } = rowsToPayload([
      ['externalId', 'name'],
      ['', 'x'],
    ]);
    expect(error).toMatch(/missing externalId or name/);
  });

  it('maps known columns and coerces booleans; ignores unknown columns', () => {
    const { rows, error } = rowsToPayload([
      [
        'externalId',
        'name',
        'riskTier',
        'customerFacing',
        'ragUsage',
        'ignored',
      ],
      ['sys-1', 'Copilot', 'HIGH', 'true', 'no', 'whatever'],
    ]);
    expect(error).toBeNull();
    expect(rows).toEqual([
      {
        externalId: 'sys-1',
        name: 'Copilot',
        riskTier: 'HIGH',
        customerFacing: true,
        ragUsage: false,
      },
    ]);
  });
});
