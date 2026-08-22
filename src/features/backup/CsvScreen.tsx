import { useRef, useState, type ChangeEvent } from 'react'
import { ScreenHeader } from '../../components/ScreenHeader'
import { MonthPicker } from '../../components/MonthPicker'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { useToast } from '../../components/toast/useToast'
import { categoriesRepo, transactionsRepo } from '../../db'
import { buildTransactionsCsv } from './csvExport'
import { parseImportFile, type ImportPreview } from './csvImport'
import { commitImport } from './csvImportCommit'
import { downloadTextFile, readFileAsText } from './fileIo'
import { currentYearMonth, todayDateString } from '../../utils/date'
import './CsvScreen.css'

export function CsvScreen() {
  const { showToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [yearMonth, setYearMonth] = useState(currentYearMonth())
  const [exporting, setExporting] = useState(false)

  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [importing, setImporting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [fileReadError, setFileReadError] = useState<string | null>(null)

  async function handleExport(scope: 'month' | 'all') {
    setExporting(true)
    try {
      const [transactions, categories] = await Promise.all([
        scope === 'month'
          ? transactionsRepo.getTransactionsByMonth(yearMonth)
          : transactionsRepo.getAllTransactions(),
        categoriesRepo.getAllCategories(),
      ])
      const csv = buildTransactionsCsv(transactions, categories)
      const filename =
        scope === 'month'
          ? `transactions-${yearMonth}.csv`
          : `transactions-all-${todayDateString()}.csv`
      downloadTextFile(filename, csv, 'text/csv')
      showToast({ message: `${transactions.length}건을 내보냈습니다.` })
    } finally {
      setExporting(false)
    }
  }

  async function handleFileSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setFileReadError(null)
    setPreview(null)
    try {
      const text = await readFileAsText(file)
      const [categories, transactions] = await Promise.all([
        categoriesRepo.getAllCategories(),
        transactionsRepo.getAllTransactions(),
      ])
      setPreview(parseImportFile(text, categories, transactions))
    } catch {
      setFileReadError('파일을 읽을 수 없습니다. CSV 파일인지 확인해 주세요.')
    }
  }

  async function handleConfirmImport() {
    if (!preview) return
    setImporting(true)
    try {
      const categories = await categoriesRepo.getAllCategories()
      const result = await commitImport(preview, categories)
      setConfirmOpen(false)
      setPreview(null)
      showToast({
        message: `${result.importedCount}건을 가져왔습니다.${
          result.createdCategoryCount > 0 ? ` (새 분류 ${result.createdCategoryCount}개 생성)` : ''
        }`,
      })
    } finally {
      setImporting(false)
    }
  }

  return (
    <div>
      <ScreenHeader title="CSV 가져오기 / 내보내기" />
      <div className="csv-screen__body">
        <section className="csv-screen__card">
          <h2 className="csv-screen__card-title">CSV 내보내기</h2>
          <MonthPicker yearMonth={yearMonth} onChange={setYearMonth} />
          <div className="csv-screen__actions">
            <button type="button" onClick={() => handleExport('month')} disabled={exporting}>
              이 달만 내보내기
            </button>
            <button type="button" onClick={() => handleExport('all')} disabled={exporting}>
              전체 내보내기
            </button>
          </div>
        </section>

        <section className="csv-screen__card">
          <h2 className="csv-screen__card-title">CSV 가져오기</h2>
          <p className="csv-screen__desc">
            date, time, type, category, amount, memo, paymentMethod, sourceId 컬럼을 지원합니다.
            (date, type, category, amount는 필수)
          </p>
          <button
            type="button"
            className="csv-screen__pick"
            onClick={() => fileInputRef.current?.click()}
          >
            CSV 파일 선택
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            hidden
            onChange={handleFileSelected}
          />

          {fileReadError && <p className="csv-screen__error">{fileReadError}</p>}

          {preview && preview.headerErrors.length > 0 && (
            <ul className="csv-screen__error-list">
              {preview.headerErrors.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          )}

          {preview && preview.headerErrors.length === 0 && (
            <div className="csv-screen__preview">
              <p>총 {preview.totalRows}행</p>
              <p>
                유효 {preview.validRows.length}건 · 오류 {preview.invalidRows.length}건 · 중복{' '}
                {preview.duplicateRows.length}건
              </p>
              {preview.newCategoryNames.length > 0 && (
                <p>새 분류 {preview.newCategoryNames.length}개가 자동으로 생성됩니다.</p>
              )}
              {preview.invalidRows.length > 0 && (
                <ul className="csv-screen__error-list">
                  {preview.invalidRows.slice(0, 5).map((row) => (
                    <li key={row.rowNumber}>
                      {row.rowNumber}행: {row.errors.join(', ')}
                    </li>
                  ))}
                  {preview.invalidRows.length > 5 && <li>외 {preview.invalidRows.length - 5}건</li>}
                </ul>
              )}
              <button
                type="button"
                className="csv-screen__import-button"
                disabled={preview.validRows.length === 0}
                onClick={() => setConfirmOpen(true)}
              >
                {preview.validRows.length}건 가져오기
              </button>
            </div>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="CSV를 가져올까요?"
        message={`${preview?.validRows.length ?? 0}건의 거래가 새로 추가됩니다. 되돌리려면 삭제를 직접 해야 합니다.`}
        confirmLabel="가져오기"
        onConfirm={handleConfirmImport}
        onCancel={() => setConfirmOpen(false)}
      />
      {importing && <p className="csv-screen__importing">가져오는 중…</p>}
    </div>
  )
}
