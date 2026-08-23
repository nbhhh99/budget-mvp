import { useState, type FormEvent } from 'react'
import { ScreenHeader } from '../../components/ScreenHeader'
import { useToast } from '../../components/toast/useToast'
import { useLock } from '../../components/lock/useLock'
import './LockSettingsScreen.css'

type Mode = 'view' | 'set' | 'change' | 'remove'

export function LockSettingsScreen() {
  const { showToast } = useToast()
  const { loaded, hasPin, setPin, changePin, clearPin } = useLock()
  const [mode, setMode] = useState<Mode>('view')
  const [error, setError] = useState('')

  const [newPin, setNewPin] = useState('')
  const [newPinConfirm, setNewPinConfirm] = useState('')
  const [currentPin, setCurrentPin] = useState('')

  function enterMode(next: Mode) {
    setNewPin('')
    setNewPinConfirm('')
    setCurrentPin('')
    setError('')
    setMode(next)
  }

  async function handleSetSubmit(e: FormEvent) {
    e.preventDefault()
    if (newPin.length < 4) return setError('숫자 4~8자리로 입력해 주세요.')
    if (newPin !== newPinConfirm) return setError('비밀번호가 서로 달라요.')
    await setPin(newPin)
    showToast({ message: '잠금 비밀번호를 설정했어요.' })
    enterMode('view')
  }

  async function handleChangeSubmit(e: FormEvent) {
    e.preventDefault()
    if (newPin.length < 4) return setError('숫자 4~8자리로 입력해 주세요.')
    if (newPin !== newPinConfirm) return setError('새 비밀번호가 서로 달라요.')
    const ok = await changePin(currentPin, newPin)
    if (!ok) return setError('현재 비밀번호가 올바르지 않아요.')
    showToast({ message: '비밀번호를 변경했어요.' })
    enterMode('view')
  }

  async function handleRemoveSubmit(e: FormEvent) {
    e.preventDefault()
    const ok = await clearPin(currentPin)
    if (!ok) return setError('비밀번호가 올바르지 않아요.')
    showToast({ message: '잠금을 해제했어요.' })
    enterMode('view')
  }

  return (
    <div>
      <ScreenHeader title="잠금 설정" />
      <div className="lock-settings__body">
        <p className="lock-settings__desc">
          통계 보기 · 월별 내역 · 자산 관리 화면을 열 때 비밀번호를 요구해요. 수입·지출 입력
          화면은 잠기지 않아요.
        </p>

        {loaded && mode === 'view' && (
          <>
            <p className="lock-settings__status">
              {hasPin ? '🔒 잠금이 설정되어 있어요.' : '잠금이 설정되어 있지 않아요.'}
            </p>
            {hasPin ? (
              <div className="lock-settings__actions">
                <button type="button" onClick={() => enterMode('change')}>
                  비밀번호 변경
                </button>
                <button
                  type="button"
                  className="lock-settings__danger-text"
                  onClick={() => enterMode('remove')}
                >
                  잠금 해제
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="lock-settings__primary"
                onClick={() => enterMode('set')}
              >
                비밀번호 설정
              </button>
            )}
          </>
        )}

        {mode === 'set' && (
          <form className="lock-settings__form" onSubmit={handleSetSubmit}>
            <PinField label="새 비밀번호" value={newPin} onChange={setNewPin} />
            <PinField label="새 비밀번호 확인" value={newPinConfirm} onChange={setNewPinConfirm} />
            {error && <p className="lock-settings__error">{error}</p>}
            <FormActions onCancel={() => enterMode('view')} submitLabel="설정" />
          </form>
        )}

        {mode === 'change' && (
          <form className="lock-settings__form" onSubmit={handleChangeSubmit}>
            <PinField label="현재 비밀번호" value={currentPin} onChange={setCurrentPin} />
            <PinField label="새 비밀번호" value={newPin} onChange={setNewPin} />
            <PinField label="새 비밀번호 확인" value={newPinConfirm} onChange={setNewPinConfirm} />
            {error && <p className="lock-settings__error">{error}</p>}
            <FormActions onCancel={() => enterMode('view')} submitLabel="변경" />
          </form>
        )}

        {mode === 'remove' && (
          <form className="lock-settings__form" onSubmit={handleRemoveSubmit}>
            <PinField label="현재 비밀번호" value={currentPin} onChange={setCurrentPin} />
            {error && <p className="lock-settings__error">{error}</p>}
            <FormActions onCancel={() => enterMode('view')} submitLabel="잠금 해제" danger />
          </form>
        )}
      </div>
    </div>
  )
}

function PinField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="lock-settings__field">
      <span>{label}</span>
      <input
        type="password"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={8}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 8))}
      />
    </label>
  )
}

function FormActions({
  onCancel,
  submitLabel,
  danger,
}: {
  onCancel: () => void
  submitLabel: string
  danger?: boolean
}) {
  return (
    <div className="lock-settings__form-actions">
      <button type="button" onClick={onCancel}>
        취소
      </button>
      <button
        type="submit"
        className={danger ? 'lock-settings__danger' : 'lock-settings__primary'}
      >
        {submitLabel}
      </button>
    </div>
  )
}
