// 이번 달 재무 브리핑 데이터 수집 스크립트.
// 실행: npm run collect:briefing [YYYY-MM]  (생략하면 이번 달 기준)
//
// 흐름: 소스별 adapter 호출(키 없으면 스킵) + manual/{yearMonth}.json(사람이 직접
// 쓴 항목) 병합 → 항목 단위로 검증(§10 출처 필수 등) → 기존 파일(검수 완료든
// draft든)의 항목과 새로 수집된 항목을 병합(§10) → 신규·변경분이 있을 때만
// public/data/briefings/{yearMonth}.json을 status:'draft'로 다시 쓰고 index.json
// 갱신.
//
// 예전에는 status:'reviewed'인 달을 만나면 수집 자체를 건너뛰었다 — 그래서 이미
// 검수된 달에 새로운 공식 발표(또는 manual/{yearMonth}.json에 사람이 새로 추가한
// 항목)가 생겨도 다음 실행에서 영원히 반영되지 않는 버그가 있었다. 지금은 항상
// 수집하되, 기존에 검수된 항목은 절대 자동으로 지우거나 덮어쓰지 않고(§10 "기존
// reviewed 항목 보존"), 새 항목이나 내용이 달라진 항목이 있을 때만 파일을 다시
// 쓰며 status를 다시 'draft'로 내려 사람이 그 신규·변경분만 검수하도록 한다. 이
// 스크립트는 파일을 로컬에 쓸 뿐이고, GitHub Actions에서는 그 결과가 main이 아니라
// 별도 브랜치의 draft PR로만 올라간다(.github/workflows/collect-briefing.yml).
import { appendFile, mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { validateBriefingFile } from '../../src/domain/briefingSchema'
import type { BriefingIndex, BriefingItem, FinancialBriefing } from '../../src/types/models'
import { mergeItems } from './merge'
import { collectBokEcosItems } from './sources/bokEcos'
import { collectEcbItems } from './sources/ecbSdw'
import { collectFredItems } from './sources/fred'
import { collectKosisItems } from './sources/kosis'

const here = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.resolve(here, '../../public/data/briefings')
const manualDir = path.resolve(here, 'manual')

function currentYearMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
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

async function loadManualItems(yearMonth: string): Promise<BriefingItem[]> {
  const items = await readJsonIfExists<BriefingItem[]>(path.join(manualDir, `${yearMonth}.json`))
  return items ?? []
}

// 항목 단위로 검증한다 — 소스 하나가 이상해도 나머지 항목은 살린다(§11).
function keepValidItems(items: BriefingItem[]): BriefingItem[] {
  const valid: BriefingItem[] = []
  for (const item of items) {
    const probe: FinancialBriefing = {
      yearMonth: '0000-00',
      generatedAt: new Date().toISOString(),
      status: 'draft',
      summary: 'probe',
      items: [item],
    }
    const result = validateBriefingFile(probe)
    if (result.valid) {
      valid.push(item)
    } else {
      console.warn(`[collect-briefing] 항목 "${item.id}" 검증 실패, 제외합니다:`, result.errors)
    }
  }
  return valid
}

async function rebuildIndex(): Promise<void> {
  const files = (await readdir(dataDir)).filter((f) => /^\d{4}-\d{2}\.json$/.test(f))
  const entries: BriefingIndex['entries'] = []
  for (const file of files) {
    const yearMonth = file.replace('.json', '')
    const briefing = await readJsonIfExists<FinancialBriefing>(path.join(dataDir, file))
    if (!briefing) continue
    entries.push({
      yearMonth,
      status: briefing.status,
      updatedAt: briefing.reviewedAt ?? briefing.generatedAt,
    })
  }
  entries.sort((a, b) => a.yearMonth.localeCompare(b.yearMonth))
  const reviewed = entries.filter((e) => e.status === 'reviewed').map((e) => e.yearMonth)
  const index: BriefingIndex = {
    latestReviewed: reviewed.length > 0 ? reviewed[reviewed.length - 1] : null,
    entries,
  }
  await writeFile(path.join(dataDir, 'index.json'), `${JSON.stringify(index, null, 2)}\n`)
}

async function main() {
  const yearMonth = process.argv[2] || currentYearMonth()
  console.log(`[collect-briefing] ${yearMonth} 수집을 시작합니다.`)

  await mkdir(dataDir, { recursive: true })

  const existingPath = path.join(dataDir, `${yearMonth}.json`)
  const existing = await readJsonIfExists<FinancialBriefing>(existingPath)
  // 검수 완료(reviewed) 상태든 draft 상태든, 병합의 기준이 되는 "지금 갖고 있는
  // 항목"은 항상 existing.items다 — 상태에 따라 수집 자체를 건너뛰지 않는다(§10).
  const baseItems = existing?.items ?? []

  const collected = await Promise.all([
    loadManualItems(yearMonth),
    collectFredItems(yearMonth),
    collectBokEcosItems(yearMonth),
    collectEcbItems(yearMonth),
    collectKosisItems(yearMonth),
  ])
  const allItems: BriefingItem[] = collected
    .filter((x): x is BriefingItem[] => Array.isArray(x))
    .flat()
  const validCollected = keepValidItems(allItems)

  const { mergedItems, newItems, changedItems } = mergeItems(baseItems, validCollected)

  if (newItems.length === 0 && changedItems.length === 0) {
    console.log(
      existing
        ? `[collect-briefing] 새로 추가되거나 변경된 공식 자료가 없어 ${yearMonth}.json을 다시 쓰지 않습니다.`
        : '[collect-briefing] 수집된 항목이 없어 파일을 만들지 않습니다. 수동 검토가 필요합니다.',
    )
    await rebuildIndex()
    return
  }

  const keptCount = mergedItems.length - newItems.length - changedItems.length
  const briefing: FinancialBriefing = {
    yearMonth,
    generatedAt: new Date().toISOString(),
    status: 'draft', // 기존에 reviewed였어도 신규·변경 항목이 섞였으니 다시 사람 검수를 거쳐야 한다(§10).
    summary: `${yearMonth} 브리핑 초안입니다. 신규·변경 항목만 확인한 뒤 status를 "reviewed"로 바꿔야 화면에 노출됩니다. (신규 ${newItems.length}건 · 변경 ${changedItems.length}건 · 기존 유지 ${keptCount}건)`,
    items: mergedItems,
  }

  await writeFile(existingPath, `${JSON.stringify(briefing, null, 2)}\n`)
  console.log(
    `[collect-briefing] ${existingPath} 작성 완료 (draft, 신규 ${newItems.length}건 · 변경 ${changedItems.length}건 · 총 ${mergedItems.length}건).`,
  )

  if (process.env.GITHUB_STEP_SUMMARY) {
    const lines = [
      `## ${yearMonth} 재무 브리핑 수집 결과`,
      '',
      `- 신규 항목: ${newItems.length}건`,
      `- 변경된 항목: ${changedItems.length}건`,
      `- 기존 유지: ${keptCount}건`,
      '',
      ...(newItems.length > 0 ? ['### 신규', ...newItems.map((i) => `- ${i.title} (${i.referenceDate})`)] : []),
      ...(changedItems.length > 0 ? ['### 변경', ...changedItems.map((i) => `- ${i.title} (${i.referenceDate})`)] : []),
    ]
    await appendFile(process.env.GITHUB_STEP_SUMMARY, `${lines.join('\n')}\n`)
  }

  await rebuildIndex()
  console.log('[collect-briefing] index.json 갱신 완료.')
}

main().catch((err) => {
  console.error('[collect-briefing] 실패:', err)
  process.exitCode = 1
})
