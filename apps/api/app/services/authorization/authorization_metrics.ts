let deniedTotal = 0

export function recordAuthorizationDenial(): number {
  deniedTotal += 1
  return deniedTotal
}

export function authorizationDenialsTotal(): number {
  return deniedTotal
}

export function resetAuthorizationMetrics(): void {
  deniedTotal = 0
}
