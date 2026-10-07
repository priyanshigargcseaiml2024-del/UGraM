import { describe, expect, it } from 'vitest'
import { buildRecommendation, recommendAfterResult } from './recommendations'
import type { Attempt, Profile } from './types'

const profile: Profile = {
  name: 'Priya Devi',
  email: 'priya@example.com',
  userType: 'Rural Entrepreneur',
  level: 'Intermediate',
  interests: ['Finance & Banking'],
  skills: ['Negotiation'],
  language: 'English',
}

const attempt = (score: number, simId: Attempt['simId'], skills: string[]): Attempt => ({
  id: Date.now() + score,
  simId,
  simTitle: simId,
  level: 'Intermediate',
  dateISO: new Date().toISOString(),
  dateLabel: '01 Jan 2026',
  score,
  improvementFromPrevious: null,
  outcome: {
    score,
    headline: 'headline',
    summary: 'summary',
    metrics: [],
    wins: [],
    misses: [],
    tips: [],
    decisions: {},
    skills,
  },
})

describe('recommendations', () => {
  it('uses profile for first recommendation', () => {
    const recommendation = buildRecommendation(profile, [])
    expect(recommendation.simId).toBe('bank')
    expect(recommendation.reason).toContain('profile focus')
  })

  it('uses weak skill from attempts', () => {
    const attempts = [attempt(40, 'ledger', ['Cash Flow', 'Business Planning']), attempt(82, 'market', ['Pricing', 'Inventory'])]
    const recommendation = buildRecommendation(profile, attempts)

    expect(recommendation.simId).toBe('ledger')
  })

  it('adds improvement reason after result', () => {
    const attempts = [attempt(62, 'bank', ['Financial Decisions', 'Negotiation']), attempt(51, 'bank', ['Financial Decisions', 'Negotiation'])]
    const recommendation = recommendAfterResult(profile, attempts)

    expect(recommendation.reason).toContain('improved')
  })
})
