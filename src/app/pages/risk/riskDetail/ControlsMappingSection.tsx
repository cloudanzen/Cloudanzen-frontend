/**
 * riskDetail/ControlsMappingSection.tsx — linked controls and framework requirements.
 *
 * Split out of RiskDetailPage.tsx in Phase 4. Markup is unchanged; the values
 * this section read from the page's closure are now explicit props.
 */

import type { Dispatch, SetStateAction } from 'react';
import { Plus, ShieldCheck, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import type { Control } from '@/services/api/types';
import type { FrameworkDto } from '@/services/api/frameworks';
import type { RiskMappingsResponse } from '@/services/api/risk-library';

/** Only `mutate` is read from these mutations, so this file stays free of
 * react-query generics. */
interface LinkMutation {
  mutate: (id: string) => void;
  isPending: boolean;
}

interface ControlsMappingSectionProps {
  mappingsData: RiskMappingsResponse | undefined;
  allControls: Control[] | undefined;
  allFrameworks: FrameworkDto[] | undefined;
  linkedControlIds: Set<string>;
  linkedFrameworkIds: Set<string>;
  showControlPicker: boolean;
  setShowControlPicker: Dispatch<SetStateAction<boolean>>;
  showFrameworkPicker: boolean;
  setShowFrameworkPicker: Dispatch<SetStateAction<boolean>>;
  linkControlMut: LinkMutation;
  unlinkControlMut: LinkMutation;
  linkFrameworkMut: LinkMutation;
  unlinkFrameworkMut: LinkMutation;
}

export function ControlsMappingSection({
  mappingsData,
  allControls,
  allFrameworks,
  linkedControlIds,
  linkedFrameworkIds,
  showControlPicker,
  setShowControlPicker,
  showFrameworkPicker,
  setShowFrameworkPicker,
  linkControlMut,
  unlinkControlMut,
  linkFrameworkMut,
  unlinkFrameworkMut,
}: ControlsMappingSectionProps) {
  const { t } = useTranslation('risk');

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 text-foreground">
        <ShieldCheck className="h-4 w-4" />
        <h3 className="text-base font-semibold">{t('detail.mapping.title')}</h3>
      </div>
      <div className="mt-5 space-y-5">
        {/* Linked controls */}
        <div>
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t('detail.mapping.linkedControls')}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setShowControlPicker((p) => !p)}
            >
              <Plus className="mr-1 h-3 w-3" />
              {t('detail.mapping.add')}
            </Button>
          </div>

          {showControlPicker && (
            <div className="mt-2 rounded-lg border border-border bg-card p-3">
              <select
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) linkControlMut.mutate(e.target.value);
                }}
                disabled={linkControlMut.isPending}
                className="w-full rounded-md border border-border bg-card px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t('detail.mapping.selectControl')}</option>
                {allControls
                  ?.filter((c) => !linkedControlIds.has(c.id))
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.isoReference} — {c.title}
                    </option>
                  ))}
              </select>
              {linkControlMut.isPending && (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {t('detail.mapping.linking')}
                </p>
              )}
            </div>
          )}

          <div className="mt-3 space-y-2">
            {(mappingsData?.controls ?? []).length > 0 ? (
              mappingsData!.controls.map((ctrl) => (
                <div
                  key={ctrl.controlId}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {ctrl.isoReference ?? t('detail.mapping.control')}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {ctrl.controlTitle ?? ctrl.controlId}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => unlinkControlMut.mutate(ctrl.controlId)}
                    disabled={unlinkControlMut.isPending}
                    className="ml-2 shrink-0 rounded p-1 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                    title={t('detail.mapping.removeControl')}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                {t('detail.mapping.noControls')}
              </p>
            )}
          </div>
        </div>

        {/* Linked frameworks */}
        <div>
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t('detail.mapping.impactedFrameworks')}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setShowFrameworkPicker((p) => !p)}
            >
              <Plus className="mr-1 h-3 w-3" />
              {t('detail.mapping.add')}
            </Button>
          </div>

          {showFrameworkPicker && (
            <div className="mt-2 rounded-lg border border-border bg-card p-3">
              <select
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) linkFrameworkMut.mutate(e.target.value);
                }}
                disabled={linkFrameworkMut.isPending}
                className="w-full rounded-md border border-border bg-card px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t('detail.mapping.selectFramework')}</option>
                {allFrameworks
                  ?.filter((f) => !linkedFrameworkIds.has(f.id))
                  .map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.version})
                    </option>
                  ))}
              </select>
              {linkFrameworkMut.isPending && (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {t('detail.mapping.linking')}
                </p>
              )}
            </div>
          )}

          <div className="mt-3 space-y-2">
            {(mappingsData?.frameworks ?? []).length > 0 ? (
              mappingsData!.frameworks.map((fw) => (
                <div
                  key={fw.frameworkId}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {fw.frameworkName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {fw.frameworkSlug} v{fw.frameworkVersion}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => unlinkFrameworkMut.mutate(fw.frameworkId)}
                    disabled={unlinkFrameworkMut.isPending}
                    className="ml-2 shrink-0 rounded p-1 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                    title={t('detail.mapping.removeFramework')}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                {t('detail.mapping.noFrameworks')}
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
