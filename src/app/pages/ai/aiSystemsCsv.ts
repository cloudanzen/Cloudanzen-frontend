/**
 * aiSystemsCsv.ts — pure CSV helpers for the AI Systems Registry import
 * (Phase 4 slice 2). Extracted from AiSystemsPage so the parsing/mapping
 * logic is unit-testable without rendering the page.
 */

import type { ImportAiSystemRow } from '@/services/api/aiSystems';

// Minimal CSV parser: handles double-quoted fields (with escaped "" and
// embedded commas/newlines). Good enough for a paste-in import; each row is
// validated server-side.
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      if (row.some((f) => f.trim() !== '')) rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    if (row.some((f) => f.trim() !== '')) rows.push(row);
  }
  return rows;
}

export const truthy = (v: string) =>
  ['true', '1', 'yes', 'y'].includes(v.trim().toLowerCase());

// Maps parsed CSV (header row + data) into upsert rows. externalId + name
// are required; unknown columns are ignored. Enum values pass through and are
// validated by the backend.
export function rowsToPayload(csv: string[][]): {
  rows: ImportAiSystemRow[];
  error: string | null;
} {
  const [headerRow, ...dataRows] = csv;
  if (!headerRow || dataRows.length === 0) {
    return { rows: [], error: 'Need a header row and at least one data row.' };
  }
  const header = headerRow.map((h) => h.trim());
  const idx = (name: string) => header.indexOf(name);
  if (idx('externalId') === -1 || idx('name') === -1) {
    return {
      rows: [],
      error: 'Header must include externalId and name columns.',
    };
  }
  const cell = (r: string[], name: string) => {
    const i = idx(name);
    return i === -1 ? '' : (r[i] ?? '').trim();
  };
  const rows: ImportAiSystemRow[] = [];
  for (const r of dataRows) {
    const externalId = cell(r, 'externalId');
    const name = cell(r, 'name');
    if (!externalId || !name) {
      return {
        rows: [],
        error: `Row missing externalId or name: "${r.join(',')}"`,
      };
    }
    const row: ImportAiSystemRow = { externalId, name };
    const bag = row as unknown as Record<string, unknown>;
    const set = (k: string, col: string) => {
      const v = cell(r, col);
      if (v) bag[k] = v;
    };
    set('description', 'description');
    set('productArea', 'productArea');
    set('modelProvider', 'modelProvider');
    set('lifecycleStage', 'lifecycleStage');
    set('riskTier', 'riskTier');
    set('humanOversight', 'humanOversight');
    set('customerDataExposure', 'customerDataExposure');
    if (cell(r, 'customerFacing'))
      row.customerFacing = truthy(cell(r, 'customerFacing'));
    if (cell(r, 'ragUsage')) row.ragUsage = truthy(cell(r, 'ragUsage'));
    if (cell(r, 'fineTuned')) row.fineTuned = truthy(cell(r, 'fineTuned'));
    rows.push(row);
  }
  return { rows, error: null };
}

export const CSV_TEMPLATE =
  'externalId,name,productArea,lifecycleStage,riskTier,customerFacing,modelProvider\n' +
  'sys-001,Support Copilot,Support,PRODUCTION,HIGH,true,OpenAI';
