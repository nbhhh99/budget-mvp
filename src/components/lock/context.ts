import { createContext } from 'react'

export interface LockContextValue {
  loaded: boolean
  hasPin: boolean
  pinLength: number // 0이면 알 수 없음(과거에 설정된 비밀번호)
  tryUnlock: (pin: string) => Promise<boolean>
  setPin: (pin: string) => Promise<void>
  changePin: (currentPin: string, newPin: string) => Promise<boolean>
  clearPin: (currentPin: string) => Promise<boolean>
}

export const LockContext = createContext<LockContextValue | null>(null)
