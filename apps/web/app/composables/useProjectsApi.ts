import type {
  Project,
  ProjectClient,
  ProjectInput,
  ProjectListMeta,
  ProjectStatus,
} from "~/types/project";

export function useProjectsApi(api: typeof $fetch = useNuxtApp().$api) {
  async function prepareMutation() {
    await api("/auth/csrf");
  }

  return {
    list: (
      filters: {
        page?: number;
        q?: string;
        status?: ProjectStatus | "";
      },
      options: { signal?: AbortSignal } = {},
    ) => {
      const query = Object.fromEntries(
        Object.entries(filters).filter(
          ([, value]) => value !== "" && value !== undefined,
        ),
      );
      return api<{ data: Project[]; meta: ProjectListMeta }>("/projects", {
        query,
        ...(options.signal ? { signal: options.signal } : {}),
      });
    },
    get: (id: string) => api<{ data: Project }>(`/projects/${id}`),
    clients: () => api<{ data: ProjectClient[] }>("/projects/clients"),
    async create(input: ProjectInput) {
      await prepareMutation();
      return api<{ data: Project }>("/projects", {
        method: "POST",
        body: input,
      });
    },
    async update(id: string, input: ProjectInput) {
      await prepareMutation();
      return api<{ data: Project }>(`/projects/${id}`, {
        method: "PATCH",
        body: input,
      });
    },
    async archive(id: string) {
      await prepareMutation();
      return api<{ data: Project }>(`/projects/${id}`, { method: "DELETE" });
    },
    async restore(id: string) {
      await prepareMutation();
      return api<{ data: Project }>(`/projects/${id}/restore`, {
        method: "POST",
      });
    },
  };
}
