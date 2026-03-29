import { NOTIFICATION_EVENT_DEFINITIONS, type NotificationEventType } from '@/shared/notifications/eventTypes';
import { apiClient } from './client';

export type NotificationSeverity = 'info' | 'warning' | 'critical';
export type NotificationDigestMode = 'immediate' | 'hourly' | 'daily' | 'weekly';

export interface NotificationDto {
  id: string;
  organizationId: string;
  recipientUserId: string;
  eventType: NotificationEventType;
  title: string;
  body: string;
  resourceType: string | null;
  resourceId: string | null;
  severity: NotificationSeverity;
  readAt: string | null;
  actionedAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface NotificationPreferenceDto {
  id: string | null;
  organizationId: string;
  userId: string;
  eventType: NotificationEventType;
  userEmail: string | null;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  slackEnabled: boolean;
  digestMode: NotificationDigestMode;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface PreferenceUpdateDto {
  inAppEnabled?: boolean;
  emailEnabled?: boolean;
  slackEnabled?: boolean;
  digestMode?: NotificationDigestMode;
}

class NotificationsService {
  readonly eventDefinitions = NOTIFICATION_EVENT_DEFINITIONS;

  async getUnreadCount(): Promise<{ count: number }> {
    const response = await apiClient.get<{ success: boolean; data: { count: number } }>('/api/notifications/unread-count');
    return response.data;
  }

  async listInbox(opts?: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
    eventType?: string;
    severity?: NotificationSeverity;
  }): Promise<{ notifications: NotificationDto[]; total: number }> {
    const params: Record<string, string> = {};
    if (opts?.limit !== undefined) params.limit = String(opts.limit);
    if (opts?.offset !== undefined) params.offset = String(opts.offset);
    if (opts?.unreadOnly !== undefined) params.unreadOnly = String(opts.unreadOnly);
    if (opts?.eventType) params.eventType = opts.eventType;
    if (opts?.severity) params.severity = opts.severity;
    const response = await apiClient.get<{ success: boolean; data: { notifications: NotificationDto[]; total: number } }>('/api/notifications', params);
    return response.data;
  }

  async markRead(notificationId: string): Promise<void> {
    await apiClient.post(`/api/notifications/${notificationId}/read`, {});
  }

  async markAllRead(): Promise<void> {
    await apiClient.post('/api/notifications/read-all', {});
  }

  async getPreferences(): Promise<NotificationPreferenceDto[]> {
    const response = await apiClient.get<{ success: boolean; data: NotificationPreferenceDto[] }>('/api/notifications/preferences');
    return response.data;
  }

  async updatePreference(eventType: string, body: PreferenceUpdateDto): Promise<NotificationPreferenceDto> {
    const response = await apiClient.put<{ success: boolean; data: NotificationPreferenceDto }>(`/api/notifications/preferences/${eventType}`, body);
    return response.data;
  }
}

export const notificationsService = new NotificationsService();
