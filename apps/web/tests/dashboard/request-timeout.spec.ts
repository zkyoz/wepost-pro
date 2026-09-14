import { afterEach, describe, expect, it, vi } from "vitest";
import {
  RequestTimeoutError,
  withRequestTimeout,
} from "~/utils/request-timeout";

describe("withRequestTimeout", () => {
  afterEach(() => vi.useRealTimers());

  it("returns a response completed before the limit", async () => {
    await expect(
      withRequestTimeout(async (signal) => {
        expect(signal.aborted).toBe(false);
        return "ok";
      }, 100),
    ).resolves.toBe("ok");
  });

  it("aborts and rejects a request that never settles", async () => {
    vi.useFakeTimers();
    let requestSignal: AbortSignal | undefined;
    const result = withRequestTimeout((signal) => {
      requestSignal = signal;
      return new Promise<never>(() => undefined);
    }, 5_000);
    const rejection = expect(result).rejects.toEqual(
      new RequestTimeoutError(5_000),
    );

    await vi.advanceTimersByTimeAsync(5_000);

    await rejection;
    expect(requestSignal?.aborted).toBe(true);
  });

  it("keeps the original failure when it happens before the limit", async () => {
    const failure = new Error("upstream unavailable");
    await expect(
      withRequestTimeout(() => Promise.reject(failure), 100),
    ).rejects.toBe(failure);
  });

  it("rejects an invalid time limit", async () => {
    await expect(
      withRequestTimeout(() => Promise.resolve("ok"), 0),
    ).rejects.toThrow(RangeError);
  });
});
