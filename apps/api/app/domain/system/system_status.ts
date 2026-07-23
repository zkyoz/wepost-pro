export type SystemComponentStatus = 'operational' | 'degraded' | 'down' | 'disabled' | 'unknown'

export type SystemComponent = {
  id: string
  label: string
  status: SystemComponentStatus
  message: string
  latencyMs?: number
}

export type WorkerHeartbeat = {
  timestamp: string
  pid?: number
}

export function heartbeatStatus(
  heartbeat: WorkerHeartbeat | null,
  now = Date.now(),
  maximumAgeMs = 5 * 60_000
): SystemComponent {
  if (!heartbeat) {
    return {
      id: 'worker',
      label: 'Worker',
      status: 'down',
      message: 'Aucun heartbeat worker reçu.',
    }
  }

  const ageMs = now - Date.parse(heartbeat.timestamp)
  if (!Number.isFinite(ageMs) || ageMs < 0 || ageMs > maximumAgeMs) {
    return {
      id: 'worker',
      label: 'Worker',
      status: 'down',
      message: 'Le heartbeat worker est expiré.',
    }
  }

  return {
    id: 'worker',
    label: 'Worker',
    status: 'operational',
    message: 'Heartbeat reçu.',
    latencyMs: ageMs,
  }
}

export function aggregateReadiness(components: readonly SystemComponent[]) {
  const unavailable = components.filter((component) => component.status === 'down')
  const degraded = components.filter((component) => component.status === 'degraded')
  return {
    status: unavailable.length > 0 ? 'unavailable' : degraded.length > 0 ? 'degraded' : 'ready',
    ready: unavailable.length === 0,
    components,
  } as const
}
