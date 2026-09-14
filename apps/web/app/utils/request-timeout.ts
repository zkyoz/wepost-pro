export const DEFAULT_REQUEST_TIMEOUT_MS = 5_000;

export class RequestTimeoutError extends Error {
  override name = "RequestTimeoutError";

  constructor(readonly timeoutMs: number) {
    super(`Request exceeded the ${timeoutMs} ms time limit`);
  }
}

export async function withRequestTimeout<T>(
  request: (signal: AbortSignal) => Promise<T>,
  timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
): Promise<T> {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new RangeError("timeoutMs must be a positive finite number");
  }

  const controller = new AbortController();
  const timeoutError = new RequestTimeoutError(timeoutMs);
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort(timeoutError);
      reject(timeoutError);
    }, timeoutMs);
  });

  try {
    return await Promise.race([request(controller.signal), timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
