// 오늘의 경제지표 수집 스크립트.
// 실행: npm run collect:indicators
//
// 흐름: 지표별 소스 독립 호출(Promise.allSettled — 하나가 실패해도 나머지 진행) →
// 넓은 합리적 범위로 이상치 차단 → 기존 public/data/indicators/latest.json과 병합
// (검증 통과한 지표만 교체, 나머지는 기존 값 유지) → history/{id}.json에 최근 30개
// 포인트 누적 → latest.json 다시 쓰기.
//
// 이 스크립트는 public/data/indicators/ 아래만 쓴다 — 앱 소스코드는 절대 건드리지
// 않는다(GitHub Actions가 이 스크립트의 출력만 커밋 범위로 삼는다).
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { IndicatorCategory, IndicatorHistoryPoint, IndicatorSnapshot, MarketIndicator, MarketStatus } from '../../src/types/models'
import type { CollectedIndicator } from './types'
import { collectEximbankFx } from './sources/eximbankFx'
import { collectOpinetFuel } from './sources/opinetFuel'
import { collectFscIndex } from './sources/fscIndex'
import { collectFscGold } from './sources/fscCommodity'
import { collectEiaOil } from './sources/eiaOil'
import { collectAlphaVantageMarkets } from './sources/alphaVantageMarkets'

const here = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.resolve(here, '../../public/data/indicators')
const historyDir = path.join(dataDir, 'history')

// 이 스크립트가 다루는 지표 전체 목록. 아직 한 번도 수집되지 않은 항목은 여기
// 메타데이터로 "데이터 제공 준비 중"(pending) 플레이스홀더를 만든다 — 화면이 6장을
// 항상 같은 자리에 보여줄 수 있게 하기 위해서다(코인·거시지표는 이 파일에 없다:
// 코인은 브라우저가 직접 수집하고, 거시지표는 재무 브리핑에서 파생된다).
const MANIFEST: {
  id: string
  category: IndicatorCategory
  name: string
  unit: string
  sourceId: string
  sourceName: string
  sourceUrl: string
  range: [number, number]
}[] = [
  { id: 'fx-usd-krw', category: 'exchange', name: '원·달러 환율', unit: '원', sourceId: 'eximbank-fx', sourceName: '한국수출입은행', sourceUrl: 'https://www.koreaexim.go.kr', range: [100, 5000] },
  { id: 'fx-jpy100-krw', category: 'exchange', name: '원·100엔 환율', unit: '원', sourceId: 'eximbank-fx', sourceName: '한국수출입은행', sourceUrl: 'https://www.koreaexim.go.kr', range: [100, 5000] },
  { id: 'fx-eur-krw', category: 'exchange', name: '원·유로 환율', unit: '원', sourceId: 'eximbank-fx', sourceName: '한국수출입은행', sourceUrl: 'https://www.koreaexim.go.kr', range: [100, 5000] },
  { id: 'stock-kospi', category: 'stock', name: 'KOSPI', unit: '포인트', sourceId: 'fsc-index', sourceName: '금융위원회(한국거래소 제공)', sourceUrl: 'https://www.data.go.kr/data/15094807/openapi.do', range: [100, 10000] },
  { id: 'stock-kosdaq', category: 'stock', name: 'KOSDAQ', unit: '포인트', sourceId: 'fsc-index', sourceName: '금융위원회(한국거래소 제공)', sourceUrl: 'https://www.data.go.kr/data/15094807/openapi.do', range: [50, 5000] },
  { id: 'stock-sp500', category: 'stock', name: 'S&P 500', unit: '포인트', sourceId: 'alpha-vantage', sourceName: 'Alpha Vantage', sourceUrl: 'https://www.alphavantage.co', range: [100, 20000] },
  { id: 'stock-nasdaq', category: 'stock', name: 'NASDAQ Composite', unit: '포인트', sourceId: 'alpha-vantage', sourceName: 'Alpha Vantage', sourceUrl: 'https://www.alphavantage.co', range: [100, 50000] },
  { id: 'oil-wti', category: 'oil', name: 'WTI', unit: '달러/배럴', sourceId: 'eia', sourceName: 'U.S. Energy Information Administration', sourceUrl: 'https://www.eia.gov/opendata', range: [0, 500] },
  { id: 'oil-brent', category: 'oil', name: 'Brent', unit: '달러/배럴', sourceId: 'eia', sourceName: 'U.S. Energy Information Administration', sourceUrl: 'https://www.eia.gov/opendata', range: [0, 500] },
  { id: 'fuel-gasoline', category: 'fuel', name: '전국 평균 휘발유', unit: '원/리터', sourceId: 'opinet-fuel', sourceName: '한국석유공사 오피넷', sourceUrl: 'https://www.opinet.co.kr', range: [300, 5000] },
  { id: 'fuel-diesel', category: 'fuel', name: '전국 평균 경유', unit: '원/리터', sourceId: 'opinet-fuel', sourceName: '한국석유공사 오피넷', sourceUrl: 'https://www.opinet.co.kr', range: [300, 5000] },
  { id: 'gold-krx', category: 'gold', name: 'KRX 금시장(국내 금)', unit: '원/g', sourceId: 'fsc-gold', sourceName: '금융위원회(한국거래소 제공)', sourceUrl: 'https://www.data.go.kr/data/15094805/openapi.do', range: [1000, 1000000] },
  { id: 'gold-international', category: 'gold', name: '국제 금', unit: '달러/트로이온스', sourceId: 'alpha-vantage', sourceName: 'Alpha Vantage', sourceUrl: 'https://www.alphavantage.co', range: [100, 100000] },
]

async function readJsonIfExists<T>(filePath: string): Promise<T | null> {
  try {
    const text = await readFile(filePath, 'utf-8')
    return JSON.parse(text) as T
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw err
  }
}

function isValidCollected(item: CollectedIndicator): boolean {
  const manifestEntry = MANIFEST.find((m) => m.id === item.id)
  if (!manifestEntry) return false
  if (!Number.isFinite(item.value)) return false
  const [min, max] = manifestEntry.range
  return item.value >= min && item.value <= max
}

async function collectAll(): Promise<CollectedIndicator[]> {
  const results = await Promise.allSettled([
    collectEximbankFx(),
    collectOpinetFuel(),
    collectFscIndex(),
    collectFscGold(),
    collectEiaOil(),
    collectAlphaVantageMarkets(),
  ])

  const collected: CollectedIndicator[] = []
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      collected.push(...result.value)
    } else if (result.status === 'rejected') {
      console.warn('[collect-indicators] 소스 하나가 예외를 던졌습니다(다른 지표에는 영향 없음):', result.reason)
    }
  }
  return collected.filter(isValidCollected)
}

async function updateHistory(id: string, referenceDate: string, value: number): Promise<void> {
  const historyPath = path.join(historyDir, `${id}.json`)
  const existing = (await readJsonIfExists<IndicatorHistoryPoint[]>(historyPath)) ?? []
  const withoutSameDate = existing.filter((p) => p.referenceDate !== referenceDate)
  const next = [...withoutSameDate, { referenceDate, value }]
    .sort((a, b) => a.referenceDate.localeCompare(b.referenceDate))
    .slice(-30)
  await writeFile(historyPath, `${JSON.stringify(next, null, 2)}\n`)
}

function buildIndicator(
  manifestEntry: (typeof MANIFEST)[number],
  collected: CollectedIndicator | undefined,
  existing: MarketIndicator | undefined,
  nowIso: string,
): MarketIndicator {
  // 1) 이번 실행에서 유효한 값을 얻었으면 그 값을 쓴다.
  if (collected) {
    return {
      id: manifestEntry.id,
      category: manifestEntry.category,
      name: manifestEntry.name,
      symbol: collected.symbol,
      value: collected.value,
      unit: manifestEntry.unit,
      change: collected.change,
      changeRate: collected.changeRate,
      referenceDate: collected.referenceDate,
      updatedAt: nowIso,
      timezone: 'Asia/Seoul',
      sourceId: collected.sourceId,
      sourceName: collected.sourceName,
      sourceUrl: collected.sourceUrl,
      marketStatus: collected.marketStatus as MarketStatus,
      freshness: 'fresh',
    }
  }
  // 2) 이번엔 못 얻었지만 기존 정상 값이 있으면 그대로 보존한다(§4 "마지막 정상
  //    데이터 보존", "오래된 데이터에는 업데이트 지연 표시" — freshness는 화면에서
  //    updatedAt 기준으로 다시 계산되므로 여기서는 'stale'로만 표시해둔다).
  if (existing && existing.value !== null) {
    return { ...existing, freshness: 'stale' }
  }
  // 3) 한 번도 수집된 적이 없으면(대부분 키 미설정) "준비 중"으로 표시한다. 이미
  //    직전 실행에서도 pending이었다면 그 값을 그대로 재사용한다 — 매번 nowIso로
  //    새로 채우면 실제로는 아무것도 바뀐 게 없는데도 파일 내용이 매일 달라져서
  //    "변경사항이 있을 때만 커밋"이 무력화되고 매일 빈 커밋만 쌓이게 된다.
  if (existing && existing.value === null && existing.freshness === 'pending') {
    return existing
  }
  return {
    id: manifestEntry.id,
    category: manifestEntry.category,
    name: manifestEntry.name,
    value: null,
    unit: manifestEntry.unit,
    change: null,
    changeRate: null,
    referenceDate: nowIso.slice(0, 10),
    updatedAt: nowIso,
    timezone: 'Asia/Seoul',
    sourceId: manifestEntry.sourceId,
    sourceName: manifestEntry.sourceName,
    sourceUrl: manifestEntry.sourceUrl,
    marketStatus: 'unknown',
    freshness: 'pending',
  }
}

async function main() {
  await mkdir(dataDir, { recursive: true })
  await mkdir(historyDir, { recursive: true })

  const existingSnapshot = await readJsonIfExists<IndicatorSnapshot>(path.join(dataDir, 'latest.json'))
  const existingById = new Map((existingSnapshot?.indicators ?? []).map((i) => [i.id, i]))

  console.log('[collect-indicators] 수집을 시작합니다.')
  const collected = await collectAll()
  const collectedById = new Map(collected.map((i) => [i.id, i]))

  const nowIso = new Date().toISOString()
  const indicators: MarketIndicator[] = []
  for (const manifestEntry of MANIFEST) {
    const newItem = collectedById.get(manifestEntry.id)
    const existing = existingById.get(manifestEntry.id)

    // referenceDate가 기존 값보다 과거로 역행하면 새 값을 쓰지 않는다(오래된 응답으로
    // 최신값을 덮어쓰지 않기 위함).
    const useNew = newItem && (!existing || existing.referenceDate <= newItem.referenceDate)
    const indicator = buildIndicator(manifestEntry, useNew ? newItem : undefined, existing, nowIso)
    indicators.push(indicator)

    if (useNew && newItem) {
      await updateHistory(manifestEntry.id, newItem.referenceDate, newItem.value)
    }
  }

  // 지표 내용 자체가 이전과 완전히 같으면(전부 여전히 pending이거나, 기존 값이
  // 그대로 보존된 경우) generatedAt조차 갱신하지 않고 파일을 다시 쓰지 않는다 —
  // GitHub Actions의 "변경사항이 있을 때만 커밋" 단계가 실제로 아무 것도 하지
  // 않게 만들어, 실질적인 변화가 없는데 매일 빈 커밋이 쌓이는 것을 막는다.
  const unchanged =
    existingSnapshot !== null && JSON.stringify(indicators) === JSON.stringify(existingSnapshot.indicators)

  if (unchanged) {
    console.log('[collect-indicators] 이전 실행과 내용이 완전히 같아 latest.json을 다시 쓰지 않습니다.')
    return
  }

  const snapshot: IndicatorSnapshot = { generatedAt: nowIso, indicators }
  await writeFile(path.join(dataDir, 'latest.json'), `${JSON.stringify(snapshot, null, 2)}\n`)

  const collectedCount = indicators.filter((i) => i.freshness === 'fresh').length
  console.log(`[collect-indicators] latest.json 작성 완료 (총 ${indicators.length}개 중 ${collectedCount}개 신규 수집).`)
}

main().catch((err) => {
  console.error('[collect-indicators] 실패:', err)
  process.exitCode = 1
})
