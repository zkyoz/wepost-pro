const baseUrl = process.argv[2] || process.env.WEPOST_API_URL;

if (!baseUrl) {
  console.error("Usage: pnpm smoke:health -- https://api.example.test");
  process.exitCode = 2;
} else {
  const normalized = baseUrl.replace(/\/$/, "");
  const checks = [
    { path: "/health/live", expected: "ok" },
    { path: "/health/ready", expected: "ready" },
  ];

  for (const check of checks) {
    const startedAt = performance.now();
    const response = await fetch(`${normalized}${check.path}`, {
      signal: AbortSignal.timeout(10_000),
    });
    const payload = await response.json();
    if (!response.ok || payload.status !== check.expected) {
      throw new Error(`Smoke check failed: ${check.path}`);
    }
    console.info(
      JSON.stringify({
        event: "deployment.smoke_check",
        path: check.path,
        status: payload.status,
        durationMs: Math.round((performance.now() - startedAt) * 100) / 100,
      }),
    );
  }
}
