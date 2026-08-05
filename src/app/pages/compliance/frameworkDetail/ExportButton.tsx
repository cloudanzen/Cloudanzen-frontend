/**
 * frameworkDetail/ExportButton.tsx — split out of FrameworkDetailPage.tsx in
 * Phase 4. Component body is unchanged.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/app/components/ui/button';
import { Download, FileDown } from 'lucide-react';
import {
  type CoverageSnapshotDto,
  type RequirementDetailRow,
} from '@/services/api/frameworks';

export function ExportButton({
  slug,
  framework,
  coverage,
  requirements,
}: {
  slug: string;
  framework: { name: string; version: string } | null;
  coverage: CoverageSnapshotDto | null;
  requirements: RequirementDetailRow[];
}) {
  const { t } = useTranslation('compliance');
  const [open, setOpen] = useState(false);

  const downloadCsv = () => {
    const header = [
      ['Framework', framework?.name ?? slug],
      ['Version', framework?.version ?? ''],
      ['Generated At', new Date().toISOString()],
      ['Control Coverage %', String(coverage?.controlCoveragePct ?? 0)],
      ['Test Pass Rate %', String(coverage?.testPassRatePct ?? 0)],
      ['Open Gaps', String(coverage?.openGaps ?? 0)],
      [],
      [
        'Code',
        'Title',
        'Domain',
        'Applicability',
        'Justification',
        'Review Status',
        'Owner',
        'Due Date',
        'Controls',
        'Validations',
        'Policies',
        'Risks',
      ],
    ];
    const rows = requirements.map((req) => [
      req.code,
      req.title,
      req.domain ?? '',
      req.applicabilityStatus,
      req.justification ?? '',
      req.reviewStatus,
      req.ownerName ?? '',
      req.dueDate ?? '',
      String(req.controls.length),
      String(req.tests.length),
      String(req.policies.length),
      String(req.risks.length),
    ]);
    const csv = [...header, ...rows]
      .map((row) =>
        row
          .map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`)
          .join(','),
      )
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${slug}-audit-pack.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  };

  const printPdf = () => {
    const reqRows = requirements
      .map(
        (req) => `<tr>
        <td>${req.code}</td>
        <td>${req.title}</td>
        <td>${req.applicabilityStatus}</td>
        <td>${req.justification ?? ''}</td>
        <td>${req.reviewStatus}</td>
        <td>${req.ownerName ?? ''}</td>
        <td>${req.dueDate ? new Date(req.dueDate).toLocaleDateString() : ''}</td>
      </tr>`,
      )
      .join('');
    const win = window.open(
      '',
      '_blank',
      'noopener,noreferrer,width=1100,height=800',
    );
    if (!win) return;
    win.document
      .write(`<!doctype html><html><head><title>${slug} audit pack</title><style>
      body{font-family:Arial,sans-serif;padding:24px;color:#111827}
      h1,h2{margin:0 0 12px}
      .meta{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:16px 0 24px}
      .card{border:1px solid #e5e7eb;border-radius:8px;padding:12px}
      table{width:100%;border-collapse:collapse;margin-top:12px}
      td,th{border:1px solid #e5e7eb;padding:8px;text-align:left;font-size:12px;vertical-align:top}
      th{background:#f9fafb}
    </style></head><body>
      <h1>${framework?.name ?? slug} Audit Pack</h1>
      <p>Generated ${new Date().toLocaleString()}</p>
      <div class="meta">
        <div class="card"><strong>Control coverage</strong><br/>${coverage?.controlCoveragePct ?? 0}%</div>
        <div class="card"><strong>Test pass rate</strong><br/>${coverage?.testPassRatePct ?? 0}%</div>
        <div class="card"><strong>Open gaps</strong><br/>${coverage?.openGaps ?? 0}</div>
      </div>
      <h2>Requirements</h2>
      <table>
        <thead><tr><th>Code</th><th>Title</th><th>Applicability</th><th>Justification</th><th>Review</th><th>Owner</th><th>Due</th></tr></thead>
        <tbody>${reqRows}</tbody>
      </table>
    </body></html>`);
    win.document.close();
    win.focus();
    win.print();
    setOpen(false);
  };

  return (
    <div className="relative">
      <Button variant="outline" size="sm" onClick={() => setOpen(!open)}>
        <Download className="w-4 h-4 mr-1.5" />{' '}
        {t('frameworkDetail.export.export')}
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-44">
            <button
              onClick={downloadCsv}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <Download className="w-3.5 h-3.5" />{' '}
              {t('frameworkDetail.export.downloadCsv')}
            </button>
            <button
              onClick={printPdf}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <FileDown className="w-3.5 h-3.5" />{' '}
              {t('frameworkDetail.export.printPdf')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
