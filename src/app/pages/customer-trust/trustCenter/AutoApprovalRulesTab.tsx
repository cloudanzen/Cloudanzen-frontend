import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, GitBranch, AlertTriangle } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import {
  trustCenterService,
  type AutoApprovalAction,
  type AutoApprovalMatchType,
  type TrustAutoApprovalRule,
} from '@/services/api/trustCenter';

const MATCH_LABEL: Record<AutoApprovalMatchType, string> = {
  DOMAIN_EXACT: 'Domain exact match',
  DOMAIN_SUFFIX: 'Domain suffix match',
  CRM_CONTACT_EXISTS: 'CRM contact exists (Phase D)',
  CRM_ACCOUNT_OPP_STAGE: 'CRM account opportunity stage (Phase D)',
};

const ACTION_LABEL: Record<AutoApprovalAction, string> = {
  APPROVE: 'Approve',
  APPROVE_BYPASS_NDA: 'Approve + bypass NDA',
  DENY: 'Deny',
};

export function AutoApprovalRulesTab() {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['trust-auto-approval-rules'],
    queryFn: () => trustCenterService.listAutoApprovalRules(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => trustCenterService.deleteAutoApprovalRule(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['trust-auto-approval-rules'] }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      trustCenterService.updateAutoApprovalRule(id, { enabled }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['trust-auto-approval-rules'] }),
  });

  const rules = data?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            Auto-approval rules
          </h3>
          <p className="text-sm text-muted-foreground">
            Rules are evaluated in priority order (lowest number first). First
            match wins. CRM_* match types are reserved for Phase D and are inert
            today.
          </p>
        </div>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus className="w-4 h-4 mr-1.5" /> New rule
        </Button>
      </div>

      {warning && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div className="flex-1">{warning}</div>
          <button
            className="text-xs underline"
            onClick={() => setWarning(null)}
          >
            dismiss
          </button>
        </div>
      )}

      {creating && (
        <RuleEditor
          onCancel={() => setCreating(false)}
          onSaved={(w) => {
            setCreating(false);
            if (w) setWarning(w);
            qc.invalidateQueries({ queryKey: ['trust-auto-approval-rules'] });
          }}
        />
      )}

      {isLoading && (
        <p className="text-sm text-muted-foreground">Loading rules…</p>
      )}

      <div className="space-y-2">
        {rules.map((rule) => (
          <RuleRow
            key={rule.id}
            rule={rule}
            onDelete={() => deleteMutation.mutate(rule.id)}
            onToggle={(enabled) =>
              toggleMutation.mutate({ id: rule.id, enabled })
            }
          />
        ))}
        {!isLoading && rules.length === 0 && !creating && (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-muted-foreground">
            No rules yet. Every access request is queued for manual review.
          </div>
        )}
      </div>
    </div>
  );
}

function RuleRow({
  rule,
  onDelete,
  onToggle,
}: {
  rule: TrustAutoApprovalRule;
  onDelete: () => void;
  onToggle: (enabled: boolean) => void;
}) {
  const isCrm = rule.matchType.startsWith('CRM_');
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 flex-1">
        <GitBranch className="w-5 h-5 text-slate-400 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-medium text-foreground">
            {rule.name}{' '}
            <span className="text-xs text-muted-foreground">
              · priority {rule.priority}
            </span>
          </p>
          <p className="text-xs text-muted-foreground">
            {MATCH_LABEL[rule.matchType]} · {rule.matchValue} →{' '}
            <span
              className={
                rule.action === 'DENY'
                  ? 'text-rose-700 font-medium'
                  : 'text-emerald-700 font-medium'
              }
            >
              {ACTION_LABEL[rule.action]}
            </span>
            {isCrm && (
              <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-800">
                inert until Phase D
              </span>
            )}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={rule.enabled}
            onChange={(e) => onToggle(e.target.checked)}
          />
          Enabled
        </label>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (confirm(`Delete rule "${rule.name}"?`)) onDelete();
          }}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function RuleEditor({
  onCancel,
  onSaved,
}: {
  onCancel: () => void;
  onSaved: (warning?: string) => void;
}) {
  const [name, setName] = useState('');
  const [matchType, setMatchType] =
    useState<AutoApprovalMatchType>('DOMAIN_EXACT');
  const [matchValue, setMatchValue] = useState('');
  const [action, setAction] = useState<AutoApprovalAction>('APPROVE');
  const [priority, setPriority] = useState(100);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      trustCenterService.createAutoApprovalRule({
        name,
        matchType,
        matchValue,
        action,
        enabled: true,
        priority,
      }),
    onSuccess: (res) => onSaved(res.warning),
    onError: (err: unknown) =>
      setError(err instanceof Error ? err.message : 'Save failed'),
  });

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-3">
      <h4 className="font-semibold">New rule</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="rule-name">Name</Label>
          <Input
            id="rule-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Approve Acme Corp"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rule-priority">Priority (lower = earlier)</Label>
          <Input
            id="rule-priority"
            type="number"
            min={1}
            max={10_000}
            value={priority}
            onChange={(e) => setPriority(parseInt(e.target.value || '0', 10))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rule-match-type">Match type</Label>
          <select
            id="rule-match-type"
            value={matchType}
            onChange={(e) =>
              setMatchType(e.target.value as AutoApprovalMatchType)
            }
            className="w-full rounded-md border border-input bg-input-background px-3 py-2 text-sm"
          >
            {(Object.keys(MATCH_LABEL) as AutoApprovalMatchType[]).map((m) => (
              <option key={m} value={m}>
                {MATCH_LABEL[m]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rule-match-value">Match value</Label>
          <Input
            id="rule-match-value"
            value={matchValue}
            onChange={(e) => setMatchValue(e.target.value)}
            placeholder="acme.com"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rule-action">Action</Label>
          <select
            id="rule-action"
            value={action}
            onChange={(e) => setAction(e.target.value as AutoApprovalAction)}
            className="w-full rounded-md border border-input bg-input-background px-3 py-2 text-sm"
          >
            {(Object.keys(ACTION_LABEL) as AutoApprovalAction[]).map((a) => (
              <option key={a} value={a}>
                {ACTION_LABEL[a]}
              </option>
            ))}
          </select>
        </div>
      </div>
      {error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700">
          {error}
        </div>
      )}
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || !name.trim() || !matchValue.trim()}
        >
          {mutation.isPending ? 'Saving…' : 'Save rule'}
        </Button>
      </div>
    </div>
  );
}
