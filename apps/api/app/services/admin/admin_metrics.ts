const actionTotals = new Map<string, number>()

export function recordAdminAction(action: string): number {
  const total = (actionTotals.get(action) ?? 0) + 1
  actionTotals.set(action, total)
  return total
}

export function adminActionTotal(action: string): number {
  return actionTotals.get(action) ?? 0
}

export function resetAdminMetrics() {
  actionTotals.clear()
}
