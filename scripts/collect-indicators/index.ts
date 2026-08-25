// 오늘의 경제지표 수집 스크립트.
// 실행: npm run collect:indicators [-- --group=domestic|fuel|global|all]
// (그룹을 생략하면 all — 전체 소스를 수집한다. GitHub Actions는 트리거된 cron에
// 맞는 그룹만 넘긴다 — §13.)
//
// 흐름: 그룹에 해당하는 소스만 독립 호출(Promise.allSettled — 하나가 실패해도
// 나머지 진행) → 넓은 합리적 범위로 이상치 차단 → 기존
// public/data/indicators/latest.json과 병합(검증 통과한 지표만 교체, 나머지는
// 기존 값 유지) → history/{id}.json에 최근 30개 포인트 누적 → latest.json 다시
// 쓰기 → 공급자별 결과를 GitHub Actions Job Summary에 표로 남긴다(§2).
//
// 이 스크립트는 public/data/indicators/ 아래만 쓴다 — 앱 소스코드는 절대 건드리지
// 않는다(GitHub Actions가 이 스크립트의 출력만 커밋 범위로 삼는다).
import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { IndicatorCategory, IndicatorHistoryPoint, IndicatorSnapshot, MarketIndicator } from '../../src/types/models'
import type { CollectedIndicator, ProviderResult } from './types'
import { buildIndicator, describeProviderResult, isValidCollected, shouldUseNewValue } from './buildIndicator'
import { collectEximbankFx } from './sources/eximbankFx'
import { collectOpinetFuel } from './sources/opinetFuel'
import { collectFscIndex } from './sources/fscIndex'
import { collectFscGold } from './sources/fscCommodity'
import { collectEiaOil } from './sources/eiaOil'
import { collectAlphaVantageMarkets } from './sources/alphaVantageMarkets'

const here = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.resolve(here, '../../public/data/indicators')
const historyDir = path.join(dataDir, 'history')

type Group = 'domestic' | 'fuel' | 'global' | 'all'

// §13 발표 시간대별 그룹. 소스 하나(providerId)는 항상 한 그룹에만 속한다 —
// GitHub Actions가 어느 cron으로 실행됐는지에 따라 이 중 필요한 그룹만 호출한다.
const PROVIDER_GROUP: Record<string, Exclude<Group, 'all'>> = {
  'eximbank-fx': 'domestic', // 환율 — 평일 16:30 KST
  'fsc-index': 'domestic', // KOSPI·KOSDAQ — 평일 16:30 KST(금융위 데이터가 T+1이라도 화면엔 실제 기준일 표시)
  'fsc-gold': 'domestic', // KRX 금 — 평일 16:30 KST
  'opinet-fuel': 'fuel', // 국내 기름값 — 매일 07:00 KST
  eia: 'global', // WTI·Brent — 평일 09:00 KST
  'alpha-vantage': 'global', // 해외지수·국제 금(현재 미구현) — 평일 09:00 KST
}

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

function parseGroup(argv: string[]): Group {
  const arg = argv.find((a) => a.startsWith('--group='))
  const value = arg?.split('=')[1]
  if (value === 'domestic' || value === 'fuel' || value === 'global' || value === 'all') return value
  return 'all'
}

async function readJsonIfExists<T>(filePath: string): Promise<T | null> {
  try {
    const text = await readFile(filePath, 'utf-8')
    return JSON.parse(text) as T
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw err
  }
}

// 그룹에 해당하는 소스만 호출한다. 호출하지 않은 소스는 결과 자체가 없으므로(맵에
// 키가 없음) buildIndicator에서 "이번엔 시도하지 않았다"로 취급해 기존 상태를
// 그대로 유지한다 — 예를 들어 새벽에 국내 기름값만 갱신할 때 환율 자리를
// pending으로 되돌리지 않는다.
async function collectAll(group: Group): Promise<{ collected: CollectedIndicator[]; resultsByProvider: Map<string, ProviderResult> }> {
  const calls: { providerId: string; run: () => Promise<ProviderResult> }[] = [
    { providerId: 'eximbank-fx', run: collectEximbankFx },
    { providerId: 'opinet-fuel', run: collectOpinetFuel },
    { providerId: 'fsc-index', run: collectFscIndex },
    { providerId: 'fsc-gold', run: collectFscGold },
    { providerId: 'eia', run: collectEiaOil },
    { providerId: 'alpha-vantage', run: collectAlphaVantageMarkets },
  ].filter((c) => group === 'all' || PROVIDER_GROUP[c.providerId] === group)

  const settled = await Promise.allSettled(calls.map((c) => c.run()))

  const collected: CollectedIndicator[] = []
  const resultsByProvider = new Map<string, ProviderResult>()
  settled.forEach((result, i) => {
    const providerId = calls[i].providerId
    if (result.status === 'fulfilled') {
      resultsByProvider.set(providerId, result.value)
      if (result.value.status === 'success') collected.push(...result.value.indicators)
    } else {
      console.warn(`[collect-indicators] ${providerId} 소스가 예외를 던졌습니다(다른 지표에는 영향 없음):`, result.reason)
      resultsByProvider.set(providerId, {
        status: 'failed',
        provider: providerId,
        reason: result.reason instanceof Error ? result.reason.message : String(result.reason),
      })
    }
  })
  return { collected: collected.filter((item) => isValidCollected(item, MANIFEST)), resultsByProvider }
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

async function writeSummary(resultsByProvider: Map<string, ProviderResult>, group: Group): Promise<void> {
  if (!process.env.GITHUB_STEP_SUMMARY) return
  const lines = [`## 경제지표 수집 결과 (그룹: ${group})`, '', '| 공급자 | 결과 |', '| --- | --- |']
  for (const [providerId, result] of resultsByProvider) {
    lines.push(`| ${providerId} | ${describeProviderResult(result)} |`)
  }
  await appendFile(process.env.GITHUB_STEP_SUMMARY, `${lines.join('\n')}\n`)
}

async function main() {
  const group = parseGroup(process.argv.slice(2))
  await mkdir(dataDir, { recursive: true })
  await mkdir(historyDir, { recursive: true })

  const existingSnapshot = await readJsonIfExists<IndicatorSnapshot>(path.join(dataDir, 'latest.json'))
  const existingById = new Map((existingSnapshot?.indicators ?? []).map((i) => [i.id, i]))

  console.log(`[collect-indicators] 수집을 시작합니다 (그룹: ${group}).`)
  const { collected, resultsByProvider } = await collectAll(group)
  const collectedById = new Map(collected.map((i) => [i.id, i]))

  const nowIso = new Date().toISOString()
  const indicators: MarketIndicator[] = []
  for (const manifestEntry of MANIFEST) {
    const newItem = collectedById.get(manifestEntry.id)
    const existing = existingById.get(manifestEntry.id)
    const providerResult = resultsByProvider.get(manifestEntry.sourceId)

    const useNew = shouldUseNewValue(existing, newItem)
    const indicator = buildIndicator(manifestEntry, useNew ? newItem : undefined, existing, providerResult, nowIso)
    indicators.push(indicator)

    if (useNew && newItem) {
      await updateHistory(manifestEntry.id, newItem.referenceDate, newItem.value)
    }
  }

  await writeSummary(resultsByProvider, group)

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
