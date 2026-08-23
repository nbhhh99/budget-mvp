import { createContext } from 'react'

export interface LockContextValue {
  loaded: boolean
  hasPin: boolean
  unlocked: boolean
  tryUnlock: (pin: string) => Promise<boolean>
  setPin: (pin: string) => Promise<void>
  changePin: (currentPin: string, newPin: string) => Promise<boolean>
  clearPin: (currentPin: string) => Promise<boolean>
  lockNow: () => void
}

export const LockContext = createContext<LockContextValue | null>(null)
