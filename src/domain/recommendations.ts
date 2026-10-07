import type { Attempt, Profile, Recommendation, SimId } from './types'

const simSkillMap: Record<SimId, string[]> = {
  market: ['Pricing', 'Inventory'],
  bank: ['Financial Decisions', 'Negotiation'],
  ledger: ['Cash Flow', 'Business Planning'],
}

const simTitleMap: Record<SimId, string> = {
  market: 'Market Day',
  bank: 'Bank Visit',
  ledger: 'Virtual Shop Ledger',
}

const interestSimMap: Record<string, SimId> = {
  'Retail & Small Business': 'market',
  'Marketing & Sales': 'market',
  'Finance & Banking': 'bank',
  Entrepreneurship: 'bank',
  'Agriculture & Agribusiness': 'ledger',
  'Supply Chain': 'ledger',
}

export const buildRecommendation = (profile: Profile, attempts: Attempt[]): Recommendation => {
  if (attempts.length === 0) {
    const basedOnInterest = profile.interests.map((item) => interestSimMap[item]).find(Boolean)
    const basedOnSkill =
      profile.skills.includes('Financial Decisions') || profile.skills.includes('Negotiation')
        ? 'bank'
        : profile.skills.includes('Cash Flow') || profile.skills.includes('Business Planning')
          ? 'ledger'
          : 'market'

    const simId = (basedOnInterest ?? basedOnSkill) as SimId

    return {
      simId,
      title: simTitleMap[simId],
      reason: `Recommended from your profile focus: ${profile.interests[0] ?? profile.skills[0] ?? 'core business practice'}.`,
      nextSkillFocus: simSkillMap[simId],
    }
  }

  const skillScores = new Map<string, number[]>()
  attempts.forEach((attempt) => {
    attempt.outcome.skills.forEach((skill) => {
      const existing = skillScores.get(skill) ?? []
      existing.push(attempt.score)
      skillScores.set(skill, existing)
    })
  })

  const weakSkill = [...skillScores.entries()]
    .map(([skill, scores]) => ({ skill, avg: scores.reduce((a, b) => a + b, 0) / scores.length }))
    .sort((a, b) => a.avg - b.avg)[0]?.skill

  const weaknessSim = (Object.entries(simSkillMap).find(([, skills]) => weakSkill && skills.includes(weakSkill))?.[0] ??
    'market') as SimId

  const latest = attempts[0]
  const latestSkill = latest.outcome.skills.join(' & ')

  return {
    simId: weaknessSim,
    title: simTitleMap[weaknessSim],
    reason: weakSkill
      ? `Based on your recent scores, strengthening ${weakSkill} is your best next step. Last attempt practiced ${latestSkill}.`
      : 'Recommended to continue balanced practice across core business skills.',
    nextSkillFocus: simSkillMap[weaknessSim],
  }
}

export const recommendAfterResult = (profile: Profile, attempts: Attempt[]): Recommendation => {
  const recommendation = buildRecommendation(profile, attempts)
  const previousSame = attempts.filter((entry) => entry.simId === recommendation.simId)

  if (previousSame.length > 1) {
    const latest = previousSame[0]
    const previous = previousSame[1]
    const delta = latest.score - previous.score

    if (delta > 0) {
      return {
        ...recommendation,
        reason: `${recommendation.reason} You improved by ${delta} points in this skill area—build on that momentum.`,
      }
    }
  }

  return recommendation
}
