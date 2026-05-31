import { api } from "./api";

export interface AppNotification {
  id: string;
  typeId: number;
  typeName: string;
  title: string;
  body?: string;
  relatedEntity?: string;
  relatedId?: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

export const notificationsService = {
  list: () => api.get<AppNotification[]>("/notifications"),
  unreadCount: () => api.get<{ count: number }>("/notifications/unread-count"),
  markRead: (id: string) => api.put<AppNotification>(`/notifications/${id}/read`),
  markAllRead: () => api.put<void>("/notifications/read-all"),
  remove: (id: string) => api.delete<boolean>(`/notifications/${id}`),
};
