import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { LockContext, type LockContextValue } from './context'
import { settingsRepo } from '../../db'
import { hashPin } from '../../utils/pinHash'

// 잠금 해제 여부는 여기서 전역으로 들고 있지 않는다 — 화면 하나를 풀었다고
// 다른 잠긴 화면까지 같이 풀리면 안 되고, 같은 화면도 나갔다가 다시 들어오면
// 다시 비밀번호를 물어봐야 한다. 그래서 unlocked 상태는 각 LockGate가 자기
// 안에서만(로컬 state로) 들고, 여기서는 비밀번호 확인/설정 기능만 제공한다.
export function LockProvider({ children }: { children: ReactNode }) {
  const [pinHash, setPinHash] = useState('')
  const [pinLength, setPinLength] = useState(0)
  const [loaded, setLoaded] = useState(false)

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
      return inputHash === pinHash
    },
    [pinHash],
  )

  const setPin = useCallback(async (pin: string) => {
    const hash = await hashPin(pin)
    await settingsRepo.updateSettings({ lockPinHash: hash, lockPinLength: pin.length })
    setPinHash(hash)
    setPinLength(pin.length)
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

  const value: LockContextValue = {
    loaded,
    hasPin: Boolean(pinHash),
    pinLength,
    tryUnlock,
    setPin,
    changePin,
    clearPin,
  }

  return <LockContext.Provider value={value}>{children}</LockContext.Provider>
}
