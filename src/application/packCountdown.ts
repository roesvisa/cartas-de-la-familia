/** Elapsed time is monotonic: changing the phone's wall clock cannot grant packs. */
export function remainingPackMinutes(nextPackAt: string, serverNow: string, elapsedMs: number) {
  const remaining = Date.parse(nextPackAt) - Date.parse(serverNow) - Math.max(0, elapsedMs);
  return Number.isFinite(remaining) ? Math.max(0, Math.ceil(remaining / 60_000)) : null;
}
export function formatPackCountdown(minutes: number) {
  return `Próximo sobre en ${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}
