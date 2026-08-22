export function parseDigitsToNumber(raw: string): number {
  const digitsOnly = raw.replace(/[^0-9]/g, '')
  return digitsOnly === '' ? 0 : Number(digitsOnly)
}
