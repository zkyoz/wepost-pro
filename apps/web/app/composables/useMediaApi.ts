import type {
  MediaAsset,
  MediaListMeta,
  SignedMediaRequest,
} from "~/types/media";

export async function mediaChecksum(file: Blob) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    await file.arrayBuffer(),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export function useMediaApi(
  api: typeof $fetch = useNuxtApp().$api,
  rawFetch: typeof fetch = globalThis.fetch,
) {
  async function mutation<T>(url: string, options: Parameters<typeof api>[1]) {
    await api("/auth/csrf");
    return api<T>(url, options);
  }

  async function upload(
    publicationId: string,
    file: File,
    alternative: { altText: string | null; isDecorative: boolean },
    onProgress: (progress: number) => void = () => undefined,
  ) {
    onProgress(10);
    const initialized = await mutation<{
      data: MediaAsset;
      upload: SignedMediaRequest;
    }>(`/publications/${publicationId}/media/uploads`, {
      method: "POST",
      body: {
        originalName: file.name,
        declaredMimeType: file.type,
        sizeBytes: file.size,
        checksum: await mediaChecksum(file),
        ...alternative,
      },
    });
    onProgress(35);
    const uploadResponse = await rawFetch(initialized.upload.url, {
      method: initialized.upload.method,
      headers: initialized.upload.headers,
      body: file,
    });
    if (!uploadResponse.ok) {
      throw new Error("Le transfert du fichier vers le stockage a échoué.");
    }
    onProgress(75);
    await mutation(`/media/${initialized.data.id}/finalize`, {
      method: "POST",
    });
    const attached = await mutation<{ data: MediaAsset }>(
      `/publications/${publicationId}/media`,
      { method: "POST", body: { mediaId: initialized.data.id } },
    );
    onProgress(100);
    return attached;
  }

  return {
    list: (publicationId: string) =>
      api<{ data: MediaAsset[]; meta: MediaListMeta }>(
        `/publications/${publicationId}/media`,
      ),
    upload,
    update: (
      mediaId: string,
      alternative: { altText: string | null; isDecorative: boolean },
    ) =>
      mutation<{ data: MediaAsset }>(`/media/${mediaId}`, {
        method: "PATCH",
        body: alternative,
      }),
    reorder: (publicationId: string, mediaIds: string[]) =>
      mutation<{ data: string[] }>(
        `/publications/${publicationId}/media/order`,
        {
          method: "PATCH",
          body: { mediaIds },
        },
      ),
    detach: (publicationId: string, mediaId: string) =>
      mutation(`/publications/${publicationId}/media/${mediaId}`, {
        method: "DELETE",
      }),
    remove: (mediaId: string) =>
      mutation<{ data: MediaAsset }>(`/media/${mediaId}`, { method: "DELETE" }),
  };
}
