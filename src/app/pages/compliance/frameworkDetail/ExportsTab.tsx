import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { frameworksService } from '@/services/api/frameworks';
import { Download, FileDown } from 'lucide-react';

export function ExportsTab({ slug }: { slug: string }) {
  const { t } = useTranslation('compliance');
  const { data: fwRes } = useQuery({
    queryKey: ['frameworks', 'catalog-item', slug],
    queryFn: () => frameworksService.getFramework(slug),
  });
  const { data: coverageRes } = useQuery({
    queryKey: ['frameworks', 'coverage', slug],
    queryFn: () => frameworksService.getCoverage(slug),
  });
  const { data: requirementsRes } = useQuery({
    queryKey: ['frameworks', 'org-requirements', slug],
    queryFn: () => frameworksService.listOrgRequirements(slug),
  });
  const { data: mappingsRes } = useQuery({
    queryKey: ['frameworks', 'mappings', slug],
    queryFn: () => frameworksService.getFrameworkMappings(slug),
  });

  const framework = fwRes?.data;
  const coverage = coverageRes?.data;
  const requirements = requirementsRes?.data ?? [];
  const mappings = mappingsRes?.data;

  const downloadCsv = () => {
    const header = [
      ['Framework', framework?.name ?? slug],
      ['Version', framework?.version ?? ''],
      ['Generated At', new Date().toISOString()],
      ['Control Coverage %', String(coverage?.controlCoveragePct ?? 0)],
      ['Test Pass Rate %', String(coverage?.testPassRatePct ?? 0)],
      ['Open Gaps', String(coverage?.openGaps ?? 0)],
      [],
      ['Code', 'Title', 'Applicability', 'Justification', 'Review Status', 'Owner', 'Due Date'],
    ];
    const rows = requirements.map((req) => [
      req.code,
      req.title,
      req.applicabilityStatus,
      req.justification ?? '',
      req.reviewStatus,
      req.ownerId ?? '',
      req.dueDate ?? '',
    ]);
    const csv = [...header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${slug}-audit-pack.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const printPdf = () => {
    const win = window.open('', '_blank', 'noopener,noreferrer,width=1100,height=800');
    if (!win) return;
    const requirementRows = requirements.map((req) => `
      <tr>
        <td>${req.code}</td>
        <td>${req.title}</td>
        <td>${req.applicabilityStatus}</td>
        <td>${req.justification ?? ''}</td>
        <td>${req.reviewStatus}</td>
        <td>${req.ownerId ?? ''}</td>
        <td>${req.dueDate ? new Date(req.dueDate).toLocaleDateString() : ''}</td>
      </tr>
    `).join('');
    win.document.write(`<!doctype html><html><head><title>${slug} audit pack</title><style>
      body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
      h1,h2 { margin: 0 0 12px; }
      .meta { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 12px; margin: 16px 0 24px; }
      .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; }
      td, th { border: 1px solid #e5e7eb; padding: 8px; text-align: left; font-size: 12px; vertical-align: top; }
      th { background: #f9fafb; }
    </style></head><body>
      <h1>${framework?.name ?? slug} Audit Pack</h1>
      <p>Generated ${new Date().toLocaleString()}</p>
      <div class="meta">
        <div class="card"><strong>Control coverage</strong><br/>${coverage?.controlCoveragePct ?? 0}%</div>
        <div class="card"><strong>Test pass rate</strong><br/>${coverage?.testPassRatePct ?? 0}%</div>
        <div class="card"><strong>Open gaps</strong><br/>${coverage?.openGaps ?? 0}</div>
      </div>
      <h2>Mappings summary</h2>
      <p>Controls: ${mappings?.controls.length ?? 0} · Validations: ${mappings?.tests.length ?? 0} · Policies: ${mappings?.policies.length ?? 0}</p>
      <h2>Requirements</h2>
      <table>
        <thead><tr><th>Code</th><th>Title</th><th>Applicability</th><th>Justification</th><th>Review</th><th>Owner</th><th>Due</th></tr></thead>
        <tbody>${requirementRows}</tbody>
      </table>
    </body></html>`);
    win.document.close();
    win.focus();
    win.print();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('frameworkTabs.exports.auditPackExports')}</CardTitle>
          <p className="text-sm text-gray-500">{t('frameworkTabs.exports.auditPackDesc')}</p>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-3">
          <Button onClick={downloadCsv}><Download className="w-4 h-4 mr-2" /> {t('frameworkTabs.exports.downloadCsv')}</Button>
          <Button variant="outline" onClick={printPdf}><FileDown className="w-4 h-4 mr-2" /> {t('frameworkTabs.exports.printPdf')}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
