export type SimId = 'market' | 'bank' | 'ledger'
export type Level = 'Beginner' | 'Intermediate' | 'Advanced'
export type UserType = 'Student' | 'Aspiring Entrepreneur' | 'Rural Entrepreneur' | 'Mentor / Educator'

export type Profile = {
  name: string
  email: string
  userType: UserType
  level: Level
  interests: string[]
  skills: string[]
  language: string
}

export type Metric = { label: string; value: string }

export type SimulationOutcome = {
  score: number
  headline: string
  summary: string
  metrics: Metric[]
  wins: string[]
  misses: string[]
  tips: string[]
  decisions: Record<string, string>
  skills: string[]
}

export type Attempt = {
  id: number
  simId: SimId
  simTitle: string
  level: Level
  dateISO: string
  dateLabel: string
  score: number
  improvementFromPrevious: number | null
  outcome: SimulationOutcome
}

export type Milestone = {
  id: string
  label: string
  achievedOn: string
}

export type AppStore = {
  version: number
  profile: Profile | null
  attempts: Attempt[]
  milestones: Milestone[]
  lastSimulation: SimId | null
}

export type Recommendation = {
  simId: SimId
  title: string
  reason: string
  nextSkillFocus: string[]
}

export type DecisionField = {
  key: string
  label: string
  min: number
  max: number
  step: number
  suffix: string
  defaultValue: number
  help: string
}

export type SimulationDefinition = {
  id: SimId
  title: string
  short: string
  time: string
  accent: 'green' | 'saffron' | 'blue'
  icon: 'market' | 'bank' | 'ledger'
  skills: string[]
  scenarioTitle: string
  scenarioBody: string
  levelGuidance: string
  decisionFields: DecisionField[]
}
