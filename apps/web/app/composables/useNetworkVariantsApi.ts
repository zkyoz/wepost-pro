import type {
  NetworkVariant,
  NetworkVariantGenerationInput,
  NetworkVariantList,
} from "~/types/network-variant";
import type { SocialNetwork } from "~/types/publication";

export function useNetworkVariantsApi(api: typeof $fetch = useNuxtApp().$api) {
  async function mutation<T>(url: string, options: Parameters<typeof api>[1]) {
    await api("/auth/csrf");
    return api<T>(url, options);
  }

  return {
    list: (publicationId: string) =>
      api<NetworkVariantList>(
        `/publications/${publicationId}/network-variants`,
      ),
    effective: (publicationId: string, network: SocialNetwork) =>
      api<{
        data: {
          text: string;
          source: "publication" | "variant";
          variantId: string | null;
        };
      }>(
        `/publications/${publicationId}/network-variants/${network}/effective`,
      ),
    create: (publicationId: string, network: SocialNetwork, text: string) =>
      mutation<{ data: NetworkVariant }>(
        `/publications/${publicationId}/network-variants`,
        { method: "POST", body: { network, text } },
      ),
    generate: (publicationId: string, input: NetworkVariantGenerationInput) =>
      mutation<{ data: NetworkVariant[] }>(
        `/publications/${publicationId}/network-variants/generate`,
        { method: "POST", body: input },
      ),
    update: (variantId: string, text: string) =>
      mutation<{ data: NetworkVariant }>(`/network-variants/${variantId}`, {
        method: "PATCH",
        body: { text },
      }),
    approve: (variantId: string) =>
      mutation<{ data: NetworkVariant }>(
        `/network-variants/${variantId}/approve`,
        { method: "POST" },
      ),
    markStale: (variantId: string) =>
      mutation<{ data: NetworkVariant }>(
        `/network-variants/${variantId}/stale`,
        { method: "POST" },
      ),
  };
}
