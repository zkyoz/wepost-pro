const MAX_SAMPLES = 500
const durations: number[] = []
let requestCount = 0
let errorCount = 0

export function recordHttpRequest(durationMs: number, statusCode: number) {
  requestCount += 1
  if (statusCode >= 500) errorCount += 1
  durations.push(Math.max(0, Math.round(durationMs * 100) / 100))
  if (durations.length > MAX_SAMPLES) durations.shift()
}

export function httpMetricsSnapshot() {
  const sorted = [...durations].sort((left, right) => left - right)
  const index = sorted.length === 0 ? 0 : Math.ceil(sorted.length * 0.95) - 1
  return {
    requestCount,
    errorCount,
    errorRate: requestCount === 0 ? 0 : Math.round((errorCount / requestCount) * 10_000) / 100,
    p95LatencyMs: sorted.length === 0 ? null : sorted[index],
    sampleSize: sorted.length,
  }
}

export function resetHttpMetrics() {
  durations.length = 0
  requestCount = 0
  errorCount = 0
}
