export type HeartbeatStore = {
  set(key: string, value: string, options: { EX: number }): Promise<unknown>;
};

export type HeartbeatOptions = {
  store: HeartbeatStore;
  key: string;
  ttlSeconds: number;
  pushUrl?: string;
  now?: () => Date;
  fetcher?: typeof fetch;
};

export async function sendWorkerHeartbeat(options: HeartbeatOptions) {
  const now = (options.now ?? (() => new Date()))();
  await options.store.set(
    options.key,
    JSON.stringify({ timestamp: now.toISOString(), pid: process.pid }),
    { EX: options.ttlSeconds },
  );

  if (!options.pushUrl) return { pushed: false };
  const target = new URL(options.pushUrl);
  target.searchParams.set("status", "up");
  target.searchParams.set("msg", "worker-heartbeat");
  target.searchParams.set("ping", now.toISOString());
  const response = await (options.fetcher ?? fetch)(target, {
    method: "GET",
    signal: AbortSignal.timeout(5_000),
  });
  if (!response.ok) throw new Error("uptime_kuma_push_failed");
  return { pushed: true };
}
