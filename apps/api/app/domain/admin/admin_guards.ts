import type { UserRole } from '#domain/auth/user_role'

export class LastActiveAdminError extends Error {
  constructor() {
    super('Le dernier administrateur actif ne peut pas perdre son accès.')
  }
}

export function assertActiveAdminRemains(input: {
  targetRole: UserRole
  targetIsActive: boolean
  nextRole: UserRole
  nextIsActive: boolean
  activeAdminCount: number
}) {
  const removesActiveAdmin =
    input.targetRole === 'admin' &&
    input.targetIsActive &&
    (input.nextRole !== 'admin' || !input.nextIsActive)

  if (removesActiveAdmin && input.activeAdminCount <= 1) {
    throw new LastActiveAdminError()
  }
}

const sensitiveKey = /(authorization|cookie|password|secret|session|token)/i

export function redactSensitive(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactSensitive)
  if (!value || typeof value !== 'object') return value

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, nested]) => [
      key,
      sensitiveKey.test(key) ? '[REDACTED]' : redactSensitive(nested),
    ])
  )
}
