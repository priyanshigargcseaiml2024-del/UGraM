import { describe, expect, it } from 'vitest'
import { EMPTY_STORE, normalizeStore } from './store'

describe('store normalization', () => {
  it('returns empty store for invalid value', () => {
    expect(normalizeStore(null)).toEqual(EMPTY_STORE)
  })

  it('migrates prior shape with profile and attempts', () => {
    const normalized = normalizeStore({
      profile: {
        name: 'Asha',
        email: 'asha@example.com',
        userType: 'Student',
        level: 'Beginner',
        interests: ['Retail & Small Business'],
        skills: ['Pricing'],
        language: 'English',
      },
      attempts: [
        {
          id: 1,
          simId: 'market',
          simTitle: 'Market Day',
          level: 'Beginner',
          dateISO: '2026-10-01T10:00:00.000Z',
          dateLabel: '1 Oct 2026',
          score: 72,
          outcome: {
            score: 72,
            headline: 'ok',
            summary: 'ok',
            metrics: [],
            wins: [],
            misses: [],
            tips: [],
            decisions: {},
            skills: ['Pricing'],
          },
        },
      ],
    })

    expect(normalized.profile?.name).toBe('Asha')
    expect(normalized.attempts[0].simId).toBe('market')
    expect(normalized.version).toBe(2)
  })

  it('drops malformed profile values', () => {
    const normalized = normalizeStore({ profile: { name: '', email: '' } })
    expect(normalized.profile).toBeNull()
  })
})
