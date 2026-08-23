// 날짜 문자열(YYYY-MM-DD)을 문구 배열의 인덱스로 결정적으로 바꾼다 — 같은 날짜면
// 앱을 다시 열어도 항상 같은 인덱스가 나오고, 네트워크나 난수 없이 오프라인에서도 동작한다.
export function getDailyQuoteIndex(dateString: string, quoteCount: number): number {
  if (quoteCount <= 0) return 0
  const daysSinceEpoch = Math.floor(Date.parse(`${dateString}T00:00:00`) / 86_400_000)
  if (!Number.isFinite(daysSinceEpoch)) return 0
  return ((daysSinceEpoch % quoteCount) + quoteCount) % quoteCount
}

export function getDailyQuote(quotes: string[], dateString: string): string | null {
  if (quotes.length === 0) return null
  return quotes[getDailyQuoteIndex(dateString, quotes.length)]
}
