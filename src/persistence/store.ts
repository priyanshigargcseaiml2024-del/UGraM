import { DEFAULT_PROFILE } from '../app/constants'
import type { AppStore, Attempt, Level, Milestone, Profile, SimId, UserType } from '../domain/types'

export const STORAGE_VERSION = 2
export const STORAGE_KEY = 'ugram.store'

export const EMPTY_STORE: AppStore = {
  version: STORAGE_VERSION,
  profile: null,
  attempts: [],
  milestones: [],
  lastSimulation: null,
}

const USER_TYPES: UserType[] = ['Student', 'Aspiring Entrepreneur', 'Rural Entrepreneur', 'Mentor / Educator']
const LEVELS: Level[] = ['Beginner', 'Intermediate', 'Advanced']
const SIMS: SimId[] = ['market', 'bank', 'ledger']

const asRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null

const asString = (value: unknown, fallback = ''): string => (typeof value === 'string' ? value : fallback)

const asStringArray = (value: unknown): string[] => (Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [])

const normalizeProfile = (value: unknown): Profile | null => {
  const record = asRecord(value)
  if (!record) return null

  const name = asString(record.name).trim()
  const email = asString(record.email).trim()
  if (!name || !email) return null

  const userType = USER_TYPES.includes(record.userType as UserType)
    ? (record.userType as UserType)
    : DEFAULT_PROFILE.userType
  const level = LEVELS.includes(record.level as Level) ? (record.level as Level) : DEFAULT_PROFILE.level

  return {
    name,
    email,
    userType,
    level,
    interests: asStringArray(record.interests),
    skills: asStringArray(record.skills),
    language: asString(record.language, 'English') || 'English',
  }
}

const normalizeAttempts = (value: unknown): Attempt[] => {
  if (!Array.isArray(value)) return []

  return value
    .map((attempt) => {
      const entry = asRecord(attempt)
      if (!entry) return null
      if (!SIMS.includes(entry.simId as SimId) || typeof entry.score !== 'number' || !asRecord(entry.outcome)) return null

      return {
        id: typeof entry.id === 'number' ? entry.id : Date.now(),
        simId: entry.simId as SimId,
        simTitle: asString(entry.simTitle, 'Simulation'),
        level: LEVELS.includes(entry.level as Level) ? (entry.level as Level) : 'Beginner',
        dateISO: asString(entry.dateISO, new Date().toISOString()),
        dateLabel: asString(entry.dateLabel, new Date().toLocaleDateString('en-IN')),
        score: Math.round(entry.score),
        improvementFromPrevious:
          typeof entry.improvementFromPrevious === 'number' ? Math.round(entry.improvementFromPrevious) : null,
        outcome: entry.outcome as Attempt['outcome'],
      } as Attempt
    })
    .filter((attempt): attempt is Attempt => Boolean(attempt))
    .slice(0, 60)
}

const normalizeMilestones = (value: unknown): Milestone[] => {
  if (!Array.isArray(value)) return []

  return value
    .map((milestone) => {
      const entry = asRecord(milestone)
      if (!entry) return null
      const id = asString(entry.id)
      const label = asString(entry.label)
      const achievedOn = asString(entry.achievedOn)
      if (!id || !label || !achievedOn) return null
      return { id, label, achievedOn }
    })
    .filter((item): item is Milestone => Boolean(item))
}

export const normalizeStore = (input: unknown): AppStore => {
  const record = asRecord(input)
  if (!record) return EMPTY_STORE

  const profile = normalizeProfile(record.profile)
  const attempts = normalizeAttempts(record.attempts)
  const milestones = normalizeMilestones(record.milestones)
  const version = typeof record.version === 'number' ? record.version : 1

  const migratedAttempts = attempts.map((attempt) => ({
    ...attempt,
    level: attempt.level ?? profile?.level ?? 'Beginner',
  }))

  const lastSimulation = SIMS.includes(record.lastSimulation as SimId)
    ? (record.lastSimulation as SimId)
    : migratedAttempts[0]?.simId ?? null

  return {
    version: version >= STORAGE_VERSION ? STORAGE_VERSION : STORAGE_VERSION,
    profile,
    attempts: migratedAttempts,
    milestones,
    lastSimulation,
  }
}

export const loadStore = (): { store: AppStore; warning: string | null } => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { store: EMPTY_STORE, warning: null }
    const parsed = JSON.parse(raw)
    return { store: normalizeStore(parsed), warning: null }
  } catch {
    return {
      store: EMPTY_STORE,
      warning: 'Saved local data could not be read and was reset. Please continue with a fresh profile.',
    }
  }
}

export const saveStore = (store: AppStore): { ok: boolean; error?: string } => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...store, version: STORAGE_VERSION }))
    return { ok: true }
  } catch {
    return { ok: false, error: 'Could not save progress in this browser session.' }
  }
}
