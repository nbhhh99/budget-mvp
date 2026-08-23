import { useState, type ChangeEvent, type ReactNode } from 'react'
import { useLock } from './useLock'
import './LockGate.css'

const MIN_PIN_LENGTH = 4
const MAX_PIN_LENGTH = 8

export function LockGate({ children }: { children: ReactNode }) {
  const { loaded, hasPin, pinLength, unlocked, tryUnlock } = useLock()
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [checking, setChecking] = useState(false)

  if (!loaded) return null
  if (!hasPin || unlocked) return <>{children}</>

  // 저장된 자릿수를 알면(과거에 설정한 비밀번호가 아니라면) 그만큼 입력됐을 때
  // 바로 맞는지 확인한다. 모르면(구버전 비밀번호) 최소 자릿수부터 최대 자릿수까지
  // 입력할 때마다 조용히 확인해보다가, 최대 자릿수에서도 안 맞으면 오류로 안내한다.
  async function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const next = e.target.value.replace(/\D/g, '').slice(0, MAX_PIN_LENGTH)
    setPin(next)
    setError(false)

    const shouldCheck = pinLength > 0 ? next.length === pinLength : next.length >= MIN_PIN_LENGTH
    if (!shouldCheck) return

    setChecking(true)
    const ok = await tryUnlock(next)
    setChecking(false)
    if (ok) return

    const exhausted = pinLength > 0 ? next.length === pinLength : next.length >= MAX_PIN_LENGTH
    if (exhausted) {
      setError(true)
      setPin('')
    }
  }

  return (
    <div className="lock-gate">
      <div className="lock-gate__icon">🔒</div>
      <h1 className="lock-gate__title">잠긴 화면이에요</h1>
      <p className="lock-gate__desc">비밀번호를 입력하면 바로 확인돼요.</p>
      <input
        type="password"
        inputMode="numeric"
        pattern="[0-9]*"
        autoFocus
        value={pin}
        onChange={handleChange}
        disabled={checking}
        placeholder="비밀번호"
        className="lock-gate__input"
      />
      {error && <p className="lock-gate__error">비밀번호가 올바르지 않아요.</p>}
    </div>
  )
}
