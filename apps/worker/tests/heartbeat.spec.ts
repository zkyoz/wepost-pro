import { describe, expect, it, vi } from "vitest";
import { sendWorkerHeartbeat } from "../src/heartbeat.js";

describe("worker heartbeat", () => {
  it("stores a short-lived heartbeat without exposing the push URL", async () => {
    const store = { set: vi.fn().mockResolvedValue("OK") };
    await expect(
      sendWorkerHeartbeat({
        store,
        key: "wepost:test:worker-heartbeat",
        ttlSeconds: 300,
        now: () => new Date("2026-07-23T10:00:00.000Z"),
      }),
    ).resolves.toEqual({ pushed: false });
    expect(store.set).toHaveBeenCalledWith(
      "wepost:test:worker-heartbeat",
      expect.stringContaining("2026-07-23T10:00:00.000Z"),
      { EX: 300 },
    );
  });

  it("pushes an up status to Uptime Kuma", async () => {
    const store = { set: vi.fn().mockResolvedValue("OK") };
    const fetcher = vi.fn().mockResolvedValue({ ok: true });
    const result = await sendWorkerHeartbeat({
      store,
      key: "heartbeat",
      ttlSeconds: 300,
      pushUrl: "https://uptime.example/api/push/private-token",
      fetcher,
    });
    expect(result).toEqual({ pushed: true });
    expect(String(fetcher.mock.calls[0]?.[0])).toContain("status=up");
  });
});
