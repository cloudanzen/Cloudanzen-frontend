import { describe, it, expect } from 'vitest';
import {
  getNotificationSeverityMeta,
  getNotificationTargetPath,
  getNotificationEventLabel,
  groupPreferences,
} from '@/app/features/notifications/notificationHelpers';
import { NOTIFICATION_EVENT_DEFINITIONS } from '@/shared/notifications/eventTypes';
import type { NotificationDto, NotificationPreferenceDto, NotificationSeverity } from '@/services/api/notifications';
import type { NotificationEventType } from '@/shared/notifications/eventTypes';

// ── getNotificationSeverityMeta ───────────────────────────────────────────────

describe('getNotificationSeverityMeta', () => {
  it('returns red styles for critical severity', () => {
    const meta = getNotificationSeverityMeta('critical');
    expect(meta.className).toContain('red');
  });

  it('returns amber styles for warning severity', () => {
    const meta = getNotificationSeverityMeta('warning');
    expect(meta.className).toContain('amber');
  });

  it('returns blue styles for info severity', () => {
    const meta = getNotificationSeverityMeta('info');
    expect(meta.className).toContain('blue');
  });

  it('returns blue styles for unknown severity (default)', () => {
    const meta = getNotificationSeverityMeta('unknown' as NotificationSeverity);
    expect(meta.className).toContain('blue');
  });

  it('returns an icon for each severity', () => {
    expect(getNotificationSeverityMeta('critical').icon).toBeTruthy();
    expect(getNotificationSeverityMeta('warning').icon).toBeTruthy();
    expect(getNotificationSeverityMeta('info').icon).toBeTruthy();
  });
});

// ── getNotificationTargetPath ─────────────────────────────────────────────────

type NotifResource = Pick<NotificationDto, 'resourceType' | 'resourceId'>;

describe('getNotificationTargetPath', () => {
  it('returns test detail path for test resourceType with id', () => {
    const n: NotifResource = { resourceType: 'test', resourceId: 'test-123' };
    expect(getNotificationTargetPath(n)).toBe('/validations/test-123');
  });

  it('returns /notifications for test without resourceId', () => {
    const n: NotifResource = { resourceType: 'test', resourceId: null };
    expect(getNotificationTargetPath(n)).toBe('/notifications');
  });

  it('returns risk detail path for risk resourceType with id', () => {
    const n: NotifResource = { resourceType: 'risk', resourceId: 'risk-456' };
    expect(getNotificationTargetPath(n)).toBe('/risk/risks/risk-456');
  });

  it('returns /notifications for risk without resourceId', () => {
    const n: NotifResource = { resourceType: 'risk', resourceId: null };
    expect(getNotificationTargetPath(n)).toBe('/notifications');
  });

  it('returns framework list path for framework resourceType', () => {
    const n: NotifResource = { resourceType: 'framework', resourceId: null };
    expect(getNotificationTargetPath(n)).toBe('/compliance/frameworks');
  });

  it('returns control list path for control resourceType', () => {
    const n: NotifResource = { resourceType: 'control', resourceId: null };
    expect(getNotificationTargetPath(n)).toBe('/compliance/controls');
  });

  it('returns audit list path for audit resourceType', () => {
    const n: NotifResource = { resourceType: 'audit', resourceId: null };
    expect(getNotificationTargetPath(n)).toBe('/compliance/audits');
  });

  it('returns /notifications for unknown resourceType', () => {
    const n: NotifResource = { resourceType: 'unknown-type', resourceId: null };
    expect(getNotificationTargetPath(n)).toBe('/notifications');
  });
});

// ── getNotificationEventLabel ─────────────────────────────────────────────────

describe('getNotificationEventLabel', () => {
  it('returns label for known event types', () => {
    expect(getNotificationEventLabel('test.failed')).toBe('Validation failed');
    expect(getNotificationEventLabel('risk.critical')).toBe('Critical risk');
    expect(getNotificationEventLabel('framework.activated')).toBe('Framework activated');
  });

  it('returns raw event type for unknown event types', () => {
    expect(getNotificationEventLabel('custom.unknown')).toBe('custom.unknown');
  });
});

// ── groupPreferences ──────────────────────────────────────────────────────────

describe('groupPreferences', () => {
  function makePreference(eventType: string): NotificationPreferenceDto {
    return {
      id: `pref-${eventType}`,
      organizationId: 'org-1',
      userId: 'user-1',
      userEmail: 'user@test.com',
      eventType: eventType as NotificationEventType,
      emailEnabled: true,
      inAppEnabled: true,
      slackEnabled: false,
      digestMode: 'immediate',
      createdAt: null,
      updatedAt: null,
    };
  }

  it('groups preferences by category', () => {
    const prefs = [
      makePreference('test.failed'),
      makePreference('test.overdue'),
      makePreference('risk.critical'),
    ];
    const groups = groupPreferences(prefs);
    expect(groups['Validations']).toHaveLength(2);
    expect(groups['Risks']).toHaveLength(1);
  });

  it('returns empty groups when preferences list is empty', () => {
    const groups = groupPreferences([]);
    // All categories with no matches should not appear
    const allEmpty = Object.values(groups).every(arr => arr.length === 0);
    expect(allEmpty).toBe(true);
  });

  it('covers all categories defined in NOTIFICATION_EVENT_DEFINITIONS', () => {
    // Create preferences for every defined event type
    const allPrefs = NOTIFICATION_EVENT_DEFINITIONS.map(def => makePreference(def.eventType));
    const groups = groupPreferences(allPrefs);

    const expectedCategories = [...new Set(NOTIFICATION_EVENT_DEFINITIONS.map(d => d.category))];
    for (const cat of expectedCategories) {
      expect(groups[cat]).toBeDefined();
      expect(groups[cat]!.length).toBeGreaterThan(0);
    }
  });

  it('skips preferences that have no matching event definition', () => {
    const prefs = [makePreference('test.failed'), makePreference('nonexistent.event')];
    const groups = groupPreferences(prefs);
    // nonexistent.event has no definition so it won't appear
    const allEventTypes = Object.values(groups).flat().map(p => p.eventType);
    expect(allEventTypes).not.toContain('nonexistent.event');
    expect(allEventTypes).toContain('test.failed');
  });
});
