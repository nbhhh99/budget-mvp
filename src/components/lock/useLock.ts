import { useContext } from 'react'
import { LockContext } from './context'

export function useLock() {
  const ctx = useContext(LockContext)
  if (!ctx) throw new Error('useLock must be used within LockProvider')
  return ctx
}
