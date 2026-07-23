import type {
  AnnotationListMeta,
  AnnotationPayload,
  MediaAnnotation,
} from "~/types/annotation";

export function useAnnotationsApi(api: typeof $fetch = useNuxtApp().$api) {
  async function mutation<T>(url: string, options: Parameters<typeof api>[1]) {
    await api("/auth/csrf");
    return api<T>(url, options);
  }

  return {
    list: (publicationId: string, mediaId: string, version?: number) =>
      api<{ data: MediaAnnotation[]; meta: AnnotationListMeta }>(
        `/publications/${publicationId}/media/${mediaId}/annotations`,
        { query: version ? { version } : undefined },
      ),
    create: (
      publicationId: string,
      mediaId: string,
      payload: AnnotationPayload,
    ) =>
      mutation<{ data: MediaAnnotation }>(
        `/publications/${publicationId}/media/${mediaId}/annotations`,
        { method: "POST", body: payload },
      ),
    update: (id: string, payload: AnnotationPayload) =>
      mutation<{ data: MediaAnnotation }>(`/annotations/${id}`, {
        method: "PATCH",
        body: payload,
      }),
    remove: (id: string) =>
      mutation(`/annotations/${id}`, { method: "DELETE" }),
  };
}
