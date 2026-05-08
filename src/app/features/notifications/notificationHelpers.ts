import { AlertCircle, AlertTriangle, Bell, FileCheck, Info, ShieldAlert } from 'lucide-react';
import { NOTIFICATION_EVENT_DEFINITIONS, getNotificationEventDefinition } from '@/shared/notifications/eventTypes';
import type { NotificationDto, NotificationPreferenceDto, NotificationSeverity } from '@/services/api/notifications';

export const notificationEventDefinitions = NOTIFICATION_EVENT_DEFINITIONS;

export function getNotificationSeverityMeta(severity: NotificationSeverity) {
  switch (severity) {
    case 'critical':
      return { icon: AlertCircle, className: 'text-red-600 bg-red-50 border-red-100' };
    case 'warning':
      return { icon: AlertTriangle, className: 'text-amber-600 bg-amber-50 border-amber-100' };
    default:
      return { icon: Info, className: 'text-blue-600 bg-blue-50 border-blue-100' };
  }
}

export function getNotificationTargetPath(notification: Pick<NotificationDto, 'resourceType' | 'resourceId'>) {
  if (notification.resourceType === 'test' && notification.resourceId) return `/validations/${notification.resourceId}`;
  if (notification.resourceType === 'risk' && notification.resourceId) return `/risk/risks/${notification.resourceId}`;
  if (notification.resourceType === 'framework') return '/compliance/frameworks';
  if (notification.resourceType === 'control') return '/compliance/controls';
  if (notification.resourceType === 'audit') return '/compliance/audits';
  return '/notifications';
}

export function getNotificationEventLabel(eventType: string) {
  return getNotificationEventDefinition(eventType)?.label ?? eventType;
}

export function groupPreferences(preferences: NotificationPreferenceDto[]) {
  return notificationEventDefinitions.reduce<Record<string, NotificationPreferenceDto[]>>((groups, definition) => {
    const preference = preferences.find((item) => item.eventType === definition.eventType);
    if (!preference) return groups;
    groups[definition.category] = [...(groups[definition.category] ?? []), preference];
    return groups;
  }, {});
}

export const notificationNavigationIcon = Bell;
export const notificationPageIcons = {
  empty: Bell,
  settings: ShieldAlert,
  item: FileCheck,
};
