import type { CollectedIndicator } from '../types'

// 한국석유공사 오피넷 "전국 평균가격" Open API. 공공데이터포털에 등록돼 있다:
// https://www.data.go.kr/data/15150932/openapi.do (무료)
// 이 세션에서 실제로 요청을 보내 살아있는 엔드포인트인지 확인했다(무효 키로도
// {"RESULT":{"OIL":[]}} 형태의 구조화된 JSON이 돌아온다 — 추측이 아니라 관측한 값이다).
// 다만 유효한 키로 받은 실제 응답 필드명(PRODCD/PRICE/DIFF)까지는 이 세션에서
// 검증하지 못해, 아래 파싱은 방어적으로 작성했다 — 필드명이 예상과 다르면 그
// 항목만 조용히 건너뛰고(값을 지어내지 않음) 나머지 로직에는 영향을 주지 않는다.
const OPINET_BASE = 'https://www.opinet.co.kr/api/avgAllPrice.do'

interface OpinetOilRow {
  PRODCD?: string
  PRICE?: string | number
  DIFF?: string | number
  TRADE_DT?: string
}

const TARGET_PRODUCTS: { prodCode: string; id: string; name: string }[] = [
  { prodCode: 'B027', id: 'fuel-gasoline', name: '전국 평균 휘발유' },
  { prodCode: 'D047', id: 'fuel-diesel', name: '전국 평균 경유' },
]

function toNumber(raw: string | number | undefined): number | null {
  if (raw === undefined) return null
  const n = typeof raw === 'number' ? raw : Number(String(raw).replace(/,/g, ''))
  return Number.isFinite(n) ? n : null
}

export async function collectOpinetFuel(): Promise<CollectedIndicator[] | null> {
  const apiKey = process.env.OPINET_API_KEY
  if (!apiKey) {
    console.log('[opinet-fuel] OPINET_API_KEY가 없어 건너뜁니다.')
    return null
  }

  try {
    const url = new URL(OPINET_BASE)
    url.searchParams.set('code', apiKey)
    url.searchParams.set('out', 'json')

    const res = await fetch(url)
    if (!res.ok) throw new Error(`오피넷 API 요청 실패: ${res.status}`)
    const json = (await res.json()) as { RESULT?: { OIL?: OpinetOilRow[] } }
    const rows = json.RESULT?.OIL
    if (!Array.isArray(rows) || rows.length === 0) {
      console.warn('[opinet-fuel] 응답에 OIL 데이터가 없습니다(형식이 예상과 다르거나 데이터 없음).')
      return null
    }

    const today = new Date()
    const referenceDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    const items: CollectedIndicator[] = []
    for (const target of TARGET_PRODUCTS) {
      const row = rows.find((r) => r.PRODCD === target.prodCode)
      const value = toNumber(row?.PRICE)
      if (value === null) continue
      const change = toNumber(row?.DIFF)
      const changeRate = change !== null && value !== 0 ? Number(((change / (value - change)) * 100).toFixed(2)) : null

      items.push({
        id: target.id,
        category: 'fuel',
        name: target.name,
        value,
        unit: '원/리터',
        change,
        changeRate,
        referenceDate,
        sourceId: 'opinet-fuel',
        sourceName: '한국석유공사 오피넷',
        sourceUrl: 'https://www.opinet.co.kr',
        marketStatus: 'unknown',
      })
    }
    return items.length > 0 ? items : null
  } catch (err) {
    console.warn('[opinet-fuel] 수집 실패, 건너뜁니다:', err)
    return null
  }
}
