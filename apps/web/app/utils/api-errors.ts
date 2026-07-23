import type { ApiValidationError } from "~/types/auth";

export function getApiErrors(error: unknown): ApiValidationError[] {
  const candidate = error as {
    data?: { errors?: ApiValidationError[] };
    response?: { _data?: { errors?: ApiValidationError[] } };
  };
  return candidate.data?.errors ?? candidate.response?._data?.errors ?? [];
}

export function getStatusCode(error: unknown) {
  const candidate = error as {
    statusCode?: number;
    status?: number;
    response?: { status?: number };
  };
  return candidate.statusCode ?? candidate.status ?? candidate.response?.status;
}
