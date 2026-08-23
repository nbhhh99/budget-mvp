// 이번 달 재무 브리핑 데이터 수집 스크립트.
// 실행: npm run collect:briefing [YYYY-MM]  (생략하면 이번 달 기준)
//
// 흐름: 소스별 adapter 호출(키 없으면 스킵) + manual/{yearMonth}.json(사람이 직접
// 쓴 항목) 병합 → 항목 단위로 검증(§10 출처 필수 등) → public/data/briefings/
// {yearMonth}.json에 항상 status:'draft'로 기록 → index.json 갱신.
//
// 이미 사람이 검수해 status:'reviewed'로 바꿔둔 달은 절대 덮어쓰지 않는다 — 자동
// 수집 결과가 검수 없이 화면에 노출되는 일을 막기 위해서다(§10).
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { validateBriefingFile } from '../../src/domain/briefingSchema'
import type { BriefingIndex, BriefingItem, FinancialBriefing } from '../../src/types/models'
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
  if (existing?.status === 'reviewed') {
    console.log(
      `[collect-briefing] ${yearMonth}.json은 이미 검수(reviewed)된 상태라 덮어쓰지 않습니다.`,
    )
    await rebuildIndex()
    return
  }

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
  const items = keepValidItems(allItems)

  if (items.length === 0) {
    console.log('[collect-briefing] 수집된 항목이 없어 파일을 만들지 않습니다. 수동 검토가 필요합니다.')
    await rebuildIndex()
    return
  }

  const briefing: FinancialBriefing = {
    yearMonth,
    generatedAt: new Date().toISOString(),
    status: 'draft',
    summary: `${yearMonth} 브리핑 초안입니다. 사람이 문구를 검수한 뒤 status를 "reviewed"로 바꿔야 화면에 노출됩니다. (자동/수동 합산 ${items.length}건)`,
    items,
  }

  await writeFile(existingPath, `${JSON.stringify(briefing, null, 2)}\n`)
  console.log(`[collect-briefing] ${existingPath} 작성 완료 (draft, ${items.length}건).`)

  await rebuildIndex()
  console.log('[collect-briefing] index.json 갱신 완료.')
}

main().catch((err) => {
  console.error('[collect-briefing] 실패:', err)
  process.exitCode = 1
})
