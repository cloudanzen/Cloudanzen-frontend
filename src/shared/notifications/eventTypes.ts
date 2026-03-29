export const NotificationEventType = {
  TEST_FAILED: 'test.failed',
  TEST_OVERDUE: 'test.overdue',
  TEST_ASSIGNED: 'test.assigned',
  ATTESTATION_REQUESTED: 'test.attestation_requested',
  ATTESTATION_SIGNED: 'test.attestation_signed',
  RISK_CRITICAL: 'risk.critical',
  RISK_CREATED: 'risk.created',
  RISK_DUE: 'risk.due',
  RISK_OWNER_ASSIGNED: 'risk.owner_assigned',
  RISK_STATUS_CHANGED: 'risk.status_changed',
  CONTROL_ASSIGNED: 'control.assigned',
  CONTROL_STATUS_CHANGED: 'control.status_changed',
  AUDIT_CREATED: 'audit.created',
  AUDIT_COMMENT_ADDED: 'audit.comment_added',
  AUDIT_REMINDER: 'audit.reminder',
  FRAMEWORK_ACTIVATED: 'framework.activated',
  COVERAGE_DROP: 'framework.coverage_drop',
  GAP_OWNER_ASSIGNED: 'framework.gap_owner_assigned',
  ACCESS_REVIEW_DUE: 'access.review_due',
  USER_INVITED: 'access.user_invited',
  TRUST_CENTER_REQUEST: 'trust_center.request',
} as const;

export type NotificationEventType = typeof NotificationEventType[keyof typeof NotificationEventType];

export type NotificationCategory = 'Tests' | 'Risks' | 'Controls' | 'Audits' | 'Frameworks' | 'Access' | 'Trust Center';

export interface NotificationEventDefinition {
  eventType: NotificationEventType;
  category: NotificationCategory;
  label: string;
  description: string;
}

export const NOTIFICATION_EVENT_DEFINITIONS: NotificationEventDefinition[] = [
  {
    eventType: NotificationEventType.TEST_FAILED,
    category: 'Tests',
    label: 'Test failed',
    description: 'Alerts when an automated or pipeline-backed compliance test fails.',
  },
  {
    eventType: NotificationEventType.TEST_OVERDUE,
    category: 'Tests',
    label: 'Test overdue',
    description: 'Reminds owners when evidence collection or test completion is overdue.',
  },
  {
    eventType: NotificationEventType.TEST_ASSIGNED,
    category: 'Tests',
    label: 'Test assigned',
    description: 'Notifies you when ownership of a test is assigned to you.',
  },
  {
    eventType: NotificationEventType.ATTESTATION_REQUESTED,
    category: 'Tests',
    label: 'Attestation requested',
    description: 'Prompts reviewers to attest evidence for a test.',
  },
  {
    eventType: NotificationEventType.ATTESTATION_SIGNED,
    category: 'Tests',
    label: 'Attestation signed',
    description: 'Confirms that a requested attestation has been completed.',
  },
  {
    eventType: NotificationEventType.RISK_CRITICAL,
    category: 'Risks',
    label: 'Critical risk',
    description: 'Highlights a newly detected or escalated critical risk.',
  },
  {
    eventType: NotificationEventType.RISK_CREATED,
    category: 'Risks',
    label: 'Risk created',
    description: 'Informs you when a new risk record is created.',
  },
  {
    eventType: NotificationEventType.RISK_DUE,
    category: 'Risks',
    label: 'Risk due soon',
    description: 'Reminds owners when risk remediation deadlines are approaching.',
  },
  {
    eventType: NotificationEventType.RISK_OWNER_ASSIGNED,
    category: 'Risks',
    label: 'Risk owner assigned',
    description: 'Notifies you when a risk is assigned to you.',
  },
  {
    eventType: NotificationEventType.RISK_STATUS_CHANGED,
    category: 'Risks',
    label: 'Risk status changed',
    description: 'Tracks important workflow state changes on risks you follow.',
  },
  {
    eventType: NotificationEventType.CONTROL_ASSIGNED,
    category: 'Controls',
    label: 'Control assigned',
    description: 'Notifies you when a control owner or steward assignment changes.',
  },
  {
    eventType: NotificationEventType.CONTROL_STATUS_CHANGED,
    category: 'Controls',
    label: 'Control status changed',
    description: 'Keeps you updated when control implementation status changes.',
  },
  {
    eventType: NotificationEventType.AUDIT_CREATED,
    category: 'Audits',
    label: 'Audit created',
    description: 'Notifies you when an audit engagement is created.',
  },
  {
    eventType: NotificationEventType.AUDIT_COMMENT_ADDED,
    category: 'Audits',
    label: 'Audit comment added',
    description: 'Shows new collaboration activity on audit items.',
  },
  {
    eventType: NotificationEventType.AUDIT_REMINDER,
    category: 'Audits',
    label: 'Audit reminder',
    description: 'Reminds audit owners and contributors about upcoming deadlines.',
  },
  {
    eventType: NotificationEventType.FRAMEWORK_ACTIVATED,
    category: 'Frameworks',
    label: 'Framework activated',
    description: 'Confirms when a compliance framework becomes active for your organization.',
  },
  {
    eventType: NotificationEventType.COVERAGE_DROP,
    category: 'Frameworks',
    label: 'Coverage dropped',
    description: 'Alerts you when framework coverage drops materially.',
  },
  {
    eventType: NotificationEventType.GAP_OWNER_ASSIGNED,
    category: 'Frameworks',
    label: 'Gap owner assigned',
    description: 'Notifies you when you are assigned ownership of a framework gap or requirement.',
  },
  {
    eventType: NotificationEventType.ACCESS_REVIEW_DUE,
    category: 'Access',
    label: 'Access review due',
    description: 'Reminds reviewers about upcoming access review obligations.',
  },
  {
    eventType: NotificationEventType.USER_INVITED,
    category: 'Access',
    label: 'User invited',
    description: 'Confirms that a user invite was issued or needs follow-up.',
  },
  {
    eventType: NotificationEventType.TRUST_CENTER_REQUEST,
    category: 'Trust Center',
    label: 'Trust center request',
    description: 'Notifies you about incoming trust center requests or follow-ups.',
  },
];

export const NOTIFICATION_EVENT_TYPES = NOTIFICATION_EVENT_DEFINITIONS.map((definition) => definition.eventType);

export function getNotificationEventDefinition(eventType: NotificationEventType | string) {
  return NOTIFICATION_EVENT_DEFINITIONS.find((definition) => definition.eventType === eventType);
}
