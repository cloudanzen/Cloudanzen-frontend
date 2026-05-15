import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  Check,
  ClipboardCheck,
  Copy,
  Lightbulb,
  Wrench,
} from 'lucide-react';
import { COPY_FEEDBACK_MS } from '@/lib/constants';
import type { Playbook, PlaybookCodeBlock } from './types';

function CodeSnippet({ block }: { block: PlaybookCodeBlock }) {
  const { t } = useTranslation('tests');
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(block.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
    });
  }

  return (
    <div className="rounded-md border border-gray-200 bg-gray-50 overflow-hidden">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-3 py-1.5">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
          {block.title ?? block.language}
        </span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
          aria-label={t('remediation.playbook.copyCode')}
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-green-600" />
              {t('remediation.playbook.copied')}
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              {t('remediation.playbook.copy')}
            </>
          )}
        </button>
      </div>
      <pre className="m-0 overflow-x-auto p-3 text-xs leading-relaxed text-gray-800">
        <code>{block.code}</code>
      </pre>
    </div>
  );
}

export function PlaybookPanel({ playbook }: { playbook: Playbook }) {
  const { t } = useTranslation('tests');

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <Wrench className="h-4 w-4 text-blue-700" />
          <p className="text-sm font-semibold text-blue-900">
            {playbook.title}
          </p>
        </div>
        <p className="mt-1 text-xs text-blue-900/80">{playbook.whatFailed}</p>
      </div>

      <section className="space-y-1">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {t('remediation.playbook.whyItMatters')}
        </h4>
        <p className="text-sm text-gray-700">{playbook.whyItMatters}</p>
      </section>

      <section className="space-y-1">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {t('remediation.playbook.fixPath')}
        </h4>
        <p className="text-sm text-gray-700">{playbook.fixPath}</p>
      </section>

      {playbook.toolSpecificSteps.map((section, idx) => (
        <section key={section.heading ?? idx} className="space-y-2">
          {section.heading && (
            <h4 className="text-sm font-semibold text-gray-900">
              {section.heading}
            </h4>
          )}
          <ol className="space-y-3">
            {section.steps.map((step, stepIdx) => (
              <li
                key={step.title}
                className="rounded-md border border-gray-100 bg-gray-50/50 p-3"
              >
                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-semibold text-white">
                    {stepIdx + 1}
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <p className="text-sm font-semibold text-gray-900">
                      {step.title}
                    </p>
                    <p className="text-sm leading-relaxed text-gray-700">
                      {step.body}
                    </p>
                    {step.code?.map((block, i) => (
                      <CodeSnippet
                        key={`${section.heading ?? idx}-${stepIdx}-${i}`}
                        block={block}
                      />
                    ))}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ))}

      <section className="space-y-1">
        <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          <ClipboardCheck className="h-3.5 w-3.5" />
          {t('remediation.playbook.evidence')}
        </h4>
        <ul className="ml-4 list-disc space-y-1 text-sm text-gray-700">
          {playbook.evidence.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="space-y-1">
        <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          <Lightbulb className="h-3.5 w-3.5" />
          {t('remediation.playbook.verify')}
        </h4>
        <ul className="ml-4 list-disc space-y-1 text-sm text-gray-700">
          {playbook.verify.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      {playbook.pitfalls.length > 0 && (
        <section className="space-y-1">
          <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-700">
            <AlertTriangle className="h-3.5 w-3.5" />
            {t('remediation.playbook.pitfalls')}
          </h4>
          <ul className="ml-4 list-disc space-y-1 text-sm text-amber-900">
            {playbook.pitfalls.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
