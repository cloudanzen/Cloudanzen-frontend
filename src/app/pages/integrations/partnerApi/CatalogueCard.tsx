import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/app/components/ui/badge';
import { CatalogueTool } from '@/services/api/partner';
import { SEVERITY_META, categoryBadge } from './helpers';
import { ChevronDownIcon, ChevronRightIcon } from './icons';

/** Catalogue tool card with expand/collapse */
export function CatalogueCard({ tool }: { tool: CatalogueTool }) {
  const { t } = useTranslation('integrations');
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <button
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors rounded-lg"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div>
            <p className="text-sm font-semibold text-slate-800">
              {tool.provider}
            </p>
            <p className="text-xs text-slate-400 truncate max-w-xs">
              {tool.description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge
            variant="outline"
            className={`text-xs ${categoryBadge(tool.category)}`}
          >
            {tool.category}
          </Badge>
          <Badge
            variant="outline"
            className="text-xs bg-slate-50 text-slate-500 border-slate-200"
          >
            {t('partnerApi.catalogue.tests', {
              count: tool.suggestedTests.length,
            })}
          </Badge>
          {expanded ? (
            <ChevronDownIcon className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronRightIcon className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 px-4 pb-4 pt-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
            {t('partnerApi.catalogue.suggestedIsoTests')}
          </p>
          <div className="space-y-1.5">
            {tool.suggestedTests.map((t, i) => {
              const sm = (SEVERITY_META[t.severity?.toLowerCase() ?? ''] ??
                SEVERITY_META['medium'])!;
              return (
                <div
                  key={i}
                  className="flex items-center justify-between gap-2 rounded-md bg-slate-50 px-3 py-2"
                >
                  <p className="text-xs text-slate-700 flex-1">{t.name}</p>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge
                      variant="outline"
                      className={`text-xs ${sm.className}`}
                    >
                      {sm.label}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-xs bg-white font-mono text-slate-500 border-slate-200"
                    >
                      {t.isoControl}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
