import { db } from '../schema'
import type { Settings } from '../../types/models'

const DEFAULT_SETTINGS: Settings = {
  id: 'settings',
  largeAmountThreshold: 1_000_000,
  onboardingCompleted: false,
  lockPinHash: '',
}

export async function getSettings(): Promise<Settings> {
  const settings = await db.settings.get('settings')
  return settings ?? DEFAULT_SETTINGS
}

export async function updateSettings(patch: Partial<Omit<Settings, 'id'>>): Promise<void> {
  const current = await getSettings()
  await db.settings.put({ ...current, ...patch })
}
