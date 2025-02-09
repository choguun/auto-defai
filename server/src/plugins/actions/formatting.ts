export function formatStringEstimation(
  value: string,
  decimals: number
): number {
  return Number(value) / 10 ** decimals;
}
