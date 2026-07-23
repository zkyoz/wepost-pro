import type {
  AiGeneration,
  AiGenerationInput,
  ApplyAiVariantResult,
} from "~/types/ai";

export function useAiGenerationApi(api: typeof $fetch = useNuxtApp().$api) {
  async function mutation<T>(url: string, options: Parameters<typeof api>[1]) {
    await api("/auth/csrf");
    return api<T>(url, options);
  }

  return {
    list: (publicationId: string) =>
      api<{ data: AiGeneration[] }>(
        `/publications/${publicationId}/ai-generations`,
      ),
    create: (publicationId: string, input: AiGenerationInput) =>
      mutation<{ data: AiGeneration }>(
        `/publications/${publicationId}/ai-generations`,
        { method: "POST", body: input },
      ),
    get: (generationId: string) =>
      api<{ data: AiGeneration }>(`/ai-generations/${generationId}`),
    apply: (generationId: string, variantId: string, contentVersion: number) =>
      mutation<{ data: ApplyAiVariantResult }>(
        `/ai-generations/${generationId}/apply`,
        { method: "POST", body: { variantId, contentVersion } },
      ),
    cancel: (generationId: string) =>
      mutation<{ data: AiGeneration }>(
        `/ai-generations/${generationId}/cancel`,
        { method: "POST" },
      ),
  };
}
