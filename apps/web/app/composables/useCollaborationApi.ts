import type {
  Comment,
  Discussion,
  Notification,
  ReviewDecision,
  ReviewResult,
} from "~/types/collaboration";

export function useCollaborationApi(api: typeof $fetch = useNuxtApp().$api) {
  async function mutation<T>(url: string, options: Parameters<typeof api>[1]) {
    await api("/auth/csrf");
    return api<T>(url, options);
  }

  return {
    discussion: (publicationId: string) =>
      api<{ data: Discussion }>(`/publications/${publicationId}/discussion`),
    createComment: (publicationId: string, body: string) =>
      mutation<{ data: Comment }>(`/publications/${publicationId}/comments`, {
        method: "POST",
        body: { body },
      }),
    updateComment: (commentId: string, body: string) =>
      mutation<{ data: Comment }>(`/comments/${commentId}`, {
        method: "PATCH",
        body: { body },
      }),
    deleteComment: (commentId: string) =>
      mutation<unknown>(`/comments/${commentId}`, { method: "DELETE" }),
    review: (
      publicationId: string,
      contentVersion: number,
      decision: ReviewDecision,
      message: string | null,
    ) =>
      mutation<{ data: ReviewResult }>(
        `/publications/${publicationId}/reviews`,
        {
          method: "POST",
          body: { contentVersion, decision, message },
        },
      ),
    notifications: (filters: { page?: number; unread?: boolean } = {}) =>
      api<{
        data: Notification[];
        meta: {
          currentPage: number;
          lastPage: number;
          total: number;
          unreadCount: number;
        };
      }>("/notifications", { query: filters }),
    markNotification: (notificationId: string, read: boolean) =>
      mutation<{ data: Notification }>(`/notifications/${notificationId}`, {
        method: "PATCH",
        body: { read },
      }),
  };
}
