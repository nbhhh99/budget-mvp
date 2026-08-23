import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { LockContext, type LockContextValue } from './context'
import { settingsRepo } from '../../db'
import { hashPin } from '../../utils/pinHash'

// 잠금 해제 상태는 메모리에만 두고 저장하지 않는다. 앱을 완전히 껐다 켜면
// (즉 JS가 새로 로드되면) 다시 잠긴 상태로 시작하는 것이 자연스러운 동작이다.
export function LockProvider({ children }: { children: ReactNode }) {
  const [pinHash, setPinHash] = useState('')
  const [pinLength, setPinLength] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [unlocked, setUnlocked] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const settings = await settingsRepo.getSettings()
      if (cancelled) return
      setPinHash(settings.lockPinHash ?? '')
      setPinLength(settings.lockPinLength ?? 0)
      setLoaded(true)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const tryUnlock = useCallback(
    async (pin: string) => {
      if (!pinHash) return true
      const inputHash = await hashPin(pin)
      const ok = inputHash === pinHash
      if (ok) setUnlocked(true)
      return ok
    },
    [pinHash],
  )

  const setPin = useCallback(async (pin: string) => {
    const hash = await hashPin(pin)
    await settingsRepo.updateSettings({ lockPinHash: hash, lockPinLength: pin.length })
    setPinHash(hash)
    setPinLength(pin.length)
    setUnlocked(true)
  }, [])

  const changePin = useCallback(
    async (currentPin: string, newPin: string) => {
      const inputHash = await hashPin(currentPin)
      if (inputHash !== pinHash) return false
      const newHash = await hashPin(newPin)
      await settingsRepo.updateSettings({ lockPinHash: newHash, lockPinLength: newPin.length })
      setPinHash(newHash)
      setPinLength(newPin.length)
      return true
    },
    [pinHash],
  )

  const clearPin = useCallback(
    async (currentPin: string) => {
      const inputHash = await hashPin(currentPin)
      if (inputHash !== pinHash) return false
      await settingsRepo.updateSettings({ lockPinHash: '', lockPinLength: 0 })
      setPinHash('')
      setPinLength(0)
      return true
    },
    [pinHash],
  )

  const lockNow = useCallback(() => setUnlocked(false), [])

  const value: LockContextValue = {
    loaded,
    hasPin: Boolean(pinHash),
    pinLength,
    unlocked,
    tryUnlock,
    setPin,
    changePin,
    clearPin,
    lockNow,
  }

  return <LockContext.Provider value={value}>{children}</LockContext.Provider>
}
