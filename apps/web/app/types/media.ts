export type MediaScanStatus =
  "pending_upload" | "clean" | "rejected" | "quarantined";

export type MediaAsset = {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  checksum: string;
  width: number | null;
  height: number | null;
  durationMs: number | null;
  altText: string | null;
  isDecorative: boolean;
  scanStatus: MediaScanStatus;
  position?: number;
  readUrl?: string;
  createdAt: string;
  deletedAt: string | null;
};

export type MediaListMeta = {
  storageBytes: number;
  agencyStorageBytes: number;
  quotaBytes: number;
};

export type SignedMediaRequest = {
  url: string;
  method: "GET" | "PUT";
  headers: Record<string, string>;
  expiresAt: string;
};
