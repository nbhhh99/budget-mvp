import { useState, type FormEvent, type ReactNode } from 'react'
import { useLock } from './useLock'
import './LockGate.css'

export function LockGate({ children }: { children: ReactNode }) {
  const { loaded, hasPin, unlocked, tryUnlock } = useLock()
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [checking, setChecking] = useState(false)

  if (!loaded) return null
  if (!hasPin || unlocked) return <>{children}</>

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setChecking(true)
    const ok = await tryUnlock(pin)
    setChecking(false)
    if (!ok) {
      setError(true)
      setPin('')
    }
  }

  return (
    <div className="lock-gate">
      <div className="lock-gate__icon">🔒</div>
      <h1 className="lock-gate__title">잠긴 화면이에요</h1>
      <p className="lock-gate__desc">비밀번호를 입력하면 볼 수 있어요.</p>
      <form className="lock-gate__form" onSubmit={handleSubmit}>
        <input
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          autoFocus
          value={pin}
          onChange={(e) => {
            setPin(e.target.value.replace(/\D/g, ''))
            setError(false)
          }}
          placeholder="비밀번호"
          className="lock-gate__input"
        />
        {error && <p className="lock-gate__error">비밀번호가 올바르지 않아요.</p>}
        <button type="submit" className="lock-gate__submit" disabled={!pin || checking}>
          확인
        </button>
      </form>
    </div>
  )
}
