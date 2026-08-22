import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScreenHeader } from '../../components/ScreenHeader'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { useToast } from '../../components/toast/useToast'
import {
  buildBackupFile,
  restoreFromBackup,
  settingsRepo,
  validateBackupFile,
  type BackupFile,
} from '../../db'
import { downloadTextFile, readFileAsText } from './fileIo'
import { todayDateString } from '../../utils/date'
import './BackupScreen.css'

export function BackupScreen() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [lastBackupAt, setLastBackupAt] = useState<string | undefined>(undefined)
  const [pendingRestore, setPendingRestore] = useState<BackupFile | null>(null)
  const [importErrors, setImportErrors] = useState<string[]>([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    settingsRepo.getSettings().then((s) => {
      if (!cancelled) setLastBackupAt(s.lastBackupAt)
    })
    return () => {
      cancelled = true
    }
  }, [])

  async function handleExport() {
    setBusy(true)
    try {
      const file = await buildBackupFile()
      downloadTextFile(`budget-backup-${todayDateString()}.json`, JSON.stringify(file, null, 2))
      const now = new Date().toISOString()
      await settingsRepo.updateSettings({ lastBackupAt: now })
      setLastBackupAt(now)
      showToast({ message: '백업 파일을 저장했습니다.' })
    } finally {
      setBusy(false)
    }
  }

  async function handleFileSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setImportErrors([])
    let parsed: unknown
    try {
      const text = await readFileAsText(file)
      parsed = JSON.parse(text)
    } catch {
      setImportErrors(['파일을 읽을 수 없습니다. 올바른 JSON 백업 파일인지 확인해 주세요.'])
      return
    }

    const result = validateBackupFile(parsed)
    if (!result.valid || !result.file) {
      setImportErrors(result.errors)
      return
    }
    setPendingRestore(result.file)
  }

  async function handleConfirmRestore() {
    if (!pendingRestore) return
    setBusy(true)
    try {
      await restoreFromBackup(pendingRestore)
      setPendingRestore(null)
      showToast({ message: '복원이 완료되었습니다.' })
      navigate('/')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <ScreenHeader title="백업 / 복원" />
      <div className="backup-screen__body">
        <section className="backup-screen__card">
          <h2 className="backup-screen__card-title">JSON으로 백업</h2>
          <p className="backup-screen__desc">
            모든 거래·분류·예산·설정을 하나의 JSON 파일로 내보냅니다.
          </p>
          <p className="backup-screen__last">
            마지막 백업: {lastBackupAt ? new Date(lastBackupAt).toLocaleString('ko-KR') : '없음'}
          </p>
          <button
            type="button"
            className="backup-screen__primary"
            onClick={handleExport}
            disabled={busy}
          >
            백업 파일 저장
          </button>
        </section>

        <section className="backup-screen__card">
          <h2 className="backup-screen__card-title">JSON 파일로 복원</h2>
          <p className="backup-screen__desc backup-screen__desc--warning">
            복원하면 현재 기기에 있는 모든 데이터가 백업 파일 내용으로 덮어써집니다.
          </p>
          <button
            type="button"
            className="backup-screen__secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
          >
            백업 파일 선택
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            hidden
            onChange={handleFileSelected}
          />
          {importErrors.length > 0 && (
            <ul className="backup-screen__errors">
              {importErrors.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          )}
        </section>

        <p className="backup-screen__notice">
          이 앱의 데이터는 이 기기에만 저장됩니다. 브라우저 데이터를 삭제하거나 앱을 삭제하면
          데이터가 사라질 수 있으니, 주기적으로 백업해 주세요.
        </p>
      </div>

      <ConfirmDialog
        open={pendingRestore !== null}
        title="기존 데이터를 덮어쓸까요?"
        message="복원하면 현재 데이터가 모두 사라지고 백업 파일의 내용으로 바뀝니다. 이 작업은 되돌릴 수 없습니다."
        confirmLabel="복원"
        danger
        onConfirm={handleConfirmRestore}
        onCancel={() => setPendingRestore(null)}
      />
    </div>
  )
}
