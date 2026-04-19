export interface AuditorIdentity {
  id: string;
  name?: string | null;
  email: string;
}

export function resolveAuditorLabel(
  audit: {
    assignedAuditorId?: string | null;
    externalAuditorEmail?: string | null;
  },
  usersById?: Map<string, AuditorIdentity>,
): string {
  if (audit.externalAuditorEmail) return audit.externalAuditorEmail;
  if (!audit.assignedAuditorId) return '—';

  const user = usersById?.get(audit.assignedAuditorId);
  if (user) return user.name?.trim() || user.email;

  return 'Internal';
}
