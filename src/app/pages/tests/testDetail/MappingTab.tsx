/**
 * testDetail/MappingTab.tsx — the test's control / framework / audit mapping.
 *
 * Split out of TestDetailPanel.tsx in Phase 4. Markup is unchanged; the values
 * this tab read from the panel's closure are now explicit props.
 */

import { Link2, Shield, Tag, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { TestRecord } from '@/services/api/tests';
import {
  AddFrameworkSection,
  AttachAuditSection,
  AttachControlSection,
} from './AttachSections';
import { Section } from './Section';

/** Only `mutate` is used here, so the panel can pass its react-query mutation
 * without this file depending on the mutation's generics. */
interface DetachMutation {
  mutate: (id: string) => void;
}

interface MappingTabProps {
  test: TestRecord;
  testId: string;
  canEditTest: boolean;
  detachControl: DetachMutation;
  detachFramework: DetachMutation;
}

export function MappingTab({
  test,
  testId,
  canEditTest,
  detachControl,
  detachFramework,
}: MappingTabProps) {
  const { t } = useTranslation('tests');

  return (
    <>
      <Section
        title={
          t('testDetail.mappingTab.linkedControls') +
          ` (${test.controls.length})`
        }
        icon={<Shield className="w-4 h-4 text-gray-500" />}
      >
        {test.controls.length === 0 ? (
          <p className="text-sm text-gray-400">
            {t('testDetail.mappingTab.noControls')}
          </p>
        ) : (
          <ul className="space-y-2">
            {test.controls.map(({ id, controlId, control }) => (
              <li
                key={id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50"
              >
                <div>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono font-semibold bg-blue-50 text-blue-800 border border-blue-200 mr-2">
                    {control.isoReference}
                  </span>
                  <span className="text-sm text-gray-700">{control.title}</span>
                  <span
                    className={`ml-2 text-xs px-1.5 py-0.5 rounded ${control.status === 'IMPLEMENTED' ? 'bg-green-50 text-green-700' : control.status === 'PARTIALLY_IMPLEMENTED' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}
                  >
                    {control.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <button
                  onClick={() => detachControl.mutate(controlId)}
                  disabled={!canEditTest}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  title={t('testDetail.mappingTab.detachControl')}
                >
                  <X className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
        {canEditTest && (
          <AttachControlSection
            testId={testId}
            existingIds={new Set(test.controls.map((c) => c.controlId))}
          />
        )}
      </Section>

      <Section
        title={
          t('testDetail.mappingTab.linkedFrameworks') +
          ` (${test.frameworks.length})`
        }
        icon={<Tag className="w-4 h-4 text-gray-500" />}
      >
        {test.frameworks.length === 0 ? (
          <p className="text-sm text-gray-400">
            {t('testDetail.mappingTab.noFrameworks')}
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {test.frameworks.map(({ id, frameworkName }) => (
              <span
                key={id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200"
              >
                {frameworkName}
                <button
                  onClick={() => detachFramework.mutate(id)}
                  className="hover:text-red-500 transition-colors"
                  title={t('testDetail.mappingTab.removeFramework')}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        {canEditTest && <AddFrameworkSection testId={testId} />}
      </Section>

      <Section
        title={
          t('testDetail.mappingTab.linkedAudits') + ` (${test.audits.length})`
        }
        icon={<Link2 className="w-4 h-4 text-gray-500" />}
      >
        {test.audits.length === 0 ? (
          <p className="text-sm text-gray-400">
            {t('testDetail.mappingTab.noAudits')}
          </p>
        ) : (
          <ul className="space-y-2">
            {test.audits.map(({ id, audit }) => (
              <li
                key={id}
                className="p-3 rounded-xl border border-gray-100 bg-gray-50 text-sm"
              >
                <p className="font-medium text-gray-800">{audit.type}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {t('testDetail.mappingTab.auditor', {
                    name: audit.auditor,
                  })}
                </p>
                {audit.scope && (
                  <p className="text-xs text-gray-400 mt-0.5">{audit.scope}</p>
                )}
              </li>
            ))}
          </ul>
        )}
        {canEditTest && (
          <AttachAuditSection
            testId={testId}
            existingIds={new Set(test.audits.map((a) => a.auditId))}
          />
        )}
      </Section>
    </>
  );
}
