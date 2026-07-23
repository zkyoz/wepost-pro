import type {
  AdminOverview,
  AdminPageMeta,
  AdminResource,
  AdminResourceName,
  BackupRun,
  BackupSummary,
  SystemStatus,
} from "~/types/admin";
import type { PublicUser, UserRole } from "~/types/auth";

export function useAdminApi(api: typeof $fetch = useNuxtApp().$api) {
  async function prepareMutation() {
    await api("/auth/csrf");
  }

  return {
    overview: () => api<{ data: AdminOverview }>("/admin/overview"),
    systemStatus: () => api<{ data: SystemStatus }>("/admin/system/status"),
    backups: (query: Record<string, string | number | undefined> = {}) =>
      api<{
        data: BackupRun[];
        meta: AdminPageMeta;
        summary: BackupSummary;
      }>("/admin/backups", { query }),
    users: (query: Record<string, string | number | undefined>) =>
      api<{ data: PublicUser[]; meta: AdminPageMeta }>("/admin/users", {
        query,
      }),
    user: (id: string) => api<{ data: PublicUser }>(`/admin/users/${id}`),
    resourceList: (
      resource: AdminResourceName,
      query: Record<string, unknown>,
    ) =>
      api<{ data: AdminResource[]; meta: AdminPageMeta }>(
        `/admin/${resource}`,
        { query },
      ),
    resource: (
      resource: Exclude<AdminResourceName, "audit-logs">,
      id: string,
    ) => api<{ data: AdminResource }>(`/admin/${resource}/${id}`),
    async updateUserRole(id: string, role: UserRole) {
      await prepareMutation();
      return api<{ data: PublicUser }>(`/admin/users/${id}/role`, {
        method: "PATCH",
        body: { role },
      });
    },
    async updateUserStatus(id: string, isActive: boolean) {
      await prepareMutation();
      return api<{ data: PublicUser }>(`/admin/users/${id}/status`, {
        method: "PATCH",
        body: { isActive },
      });
    },
    async changeArchiveState(
      resource: "projects" | "publications",
      id: string,
      action: "archive" | "restore",
    ) {
      await prepareMutation();
      return api<{ data: AdminResource }>(
        `/admin/${resource}/${id}/${action}`,
        {
          method: "POST",
        },
      );
    },
    async retrySystemJob(jobId: string) {
      await prepareMutation();
      return api<{ data: { id: string; status: string } }>(
        `/admin/system/jobs/${encodeURIComponent(jobId)}/retry`,
        { method: "POST" },
      );
    },
  };
}
