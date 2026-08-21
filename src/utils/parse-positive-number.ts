export function parsePositiveNumber(
  raw: string | undefined,
  fallback: number,
): number {
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
