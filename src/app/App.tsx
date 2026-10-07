import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  Banknote,
  BarChart3,
  BookOpen,
  Check,
  ChevronLeft,
  CircleAlert,
  CircleHelp,
  Clock3,
  Menu,
  RotateCcw,
  ShoppingBag,
  Sparkles,
  Target,
  UserRound,
  Volume2,
  X,
} from 'lucide-react'
import {
  defaultDecisionValues,
  formatDecisionValue,
  getSimulationDefinitions,
  money,
  runSimulation,
} from '../domain/simulations'
import type { AppStore, Attempt, DecisionField, Level, Profile, Recommendation, SimId, SimulationOutcome } from '../domain/types'
import { buildRecommendation, recommendAfterResult } from '../domain/recommendations'
import { EMPTY_STORE, loadStore, saveStore } from '../persistence/store'
import { DEFAULT_PROFILE, INTEREST_OPTIONS, LANGUAGE_OPTIONS, LEVELS, SKILL_OPTIONS, USER_TYPES } from './constants'

type Page = 'landing' | 'dashboard' | 'simulations' | 'progress' | 'profile' | 'about'
type SimStep = 'scenario' | 'decision' | 'result'

const dateLabel = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

const createMilestones = (attempts: Attempt[], currentMilestones: AppStore['milestones']) => {
  const map = new Map(currentMilestones.map((item) => [item.id, item]))
  if (attempts.length > 0 && !map.has('first-attempt')) {
    map.set('first-attempt', {
      id: 'first-attempt',
      label: 'Completed your first simulation attempt',
      achievedOn: attempts[0].dateLabel,
    })
  }
  if (new Set(attempts.map((attempt) => attempt.simId)).size === 3 && !map.has('all-core-simulations')) {
    map.set('all-core-simulations', {
      id: 'all-core-simulations',
      label: 'Practiced all three core simulations',
      achievedOn: attempts[0]?.dateLabel ?? dateLabel(new Date().toISOString()),
    })
  }
  if (attempts.some((attempt) => attempt.score >= 80) && !map.has('score-80')) {
    const firstHigh = attempts.find((attempt) => attempt.score >= 80)
    map.set('score-80', {
      id: 'score-80',
      label: 'Scored 80 or above in a simulation',
      achievedOn: firstHigh?.dateLabel ?? dateLabel(new Date().toISOString()),
    })
  }
  return [...map.values()]
}

const iconFor = (icon: 'market' | 'bank' | 'ledger') => {
  if (icon === 'market') return ShoppingBag
  if (icon === 'bank') return Banknote
  return BookOpen
}

export function App() {
  const [store, setStore] = useState<AppStore>(EMPTY_STORE)
  const [loading, setLoading] = useState(true)
  const [warning, setWarning] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [page, setPage] = useState<Page>('landing')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [activeSimulation, setActiveSimulation] = useState<SimId | null>(null)
  const [step, setStep] = useState<SimStep>('scenario')
  const [decisionValues, setDecisionValues] = useState<Record<string, number>>({})
  const [result, setResult] = useState<SimulationOutcome | null>(null)
  const [reviewAttempt, setReviewAttempt] = useState<Attempt | null>(null)

  useEffect(() => {
    const { store: loadedStore, warning: loadWarning } = loadStore()
    setStore(loadedStore)
    setWarning(loadWarning)
    setPage(loadedStore.profile ? 'dashboard' : 'landing')
    setLoading(false)
  }, [])

  useEffect(() => {
    if (loading) return
    const response = saveStore(store)
    if (!response.ok) {
      setSaveError(response.error ?? 'Unable to persist local progress in this session.')
      return
    }
    setSaveError(null)
  }, [store, loading])

  const profile = store.profile
  const level: Level = profile?.level ?? 'Beginner'
  const definitions = useMemo(() => getSimulationDefinitions(level), [level])

  const recommendation: Recommendation | null = profile ? buildRecommendation(profile, store.attempts) : null

  const latestAttempt = store.attempts[0] ?? null

  const progressBySkill = useMemo(() => {
    const scores = new Map<string, number[]>()
    store.attempts.forEach((attempt) => {
      attempt.outcome.skills.forEach((skill) => {
        const existing = scores.get(skill) ?? []
        existing.push(attempt.score)
        scores.set(skill, existing)
      })
    })

    return [...scores.entries()]
      .map(([skill, values]) => ({
        skill,
        average: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
      }))
      .sort((a, b) => a.average - b.average)
  }, [store.attempts])

  const navigate = (next: Page) => {
    setPage(next)
    setActiveSimulation(null)
    setStep('scenario')
    setResult(null)
    setMobileMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openSimulation = (simId: SimId) => {
    if (!profile) {
      setShowOnboarding(true)
      setPage('landing')
      setActiveSimulation(simId)
      return
    }

    setActiveSimulation(simId)
    setDecisionValues(defaultDecisionValues(simId, profile.level))
    setStep('scenario')
    setResult(null)
    setPage('simulations')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const finishSimulation = () => {
    if (!activeSimulation || !profile) return

    const outcome = runSimulation(activeSimulation, decisionValues, profile.level)
    const previousSame = store.attempts.find((attempt) => attempt.simId === activeSimulation)

    const nowIso = new Date().toISOString()
    const newAttempt: Attempt = {
      id: Date.now(),
      simId: activeSimulation,
      simTitle: definitions[activeSimulation].title,
      level: profile.level,
      dateISO: nowIso,
      dateLabel: dateLabel(nowIso),
      score: outcome.score,
      improvementFromPrevious: previousSame ? outcome.score - previousSame.score : null,
      outcome,
    }

    const nextAttempts = [newAttempt, ...store.attempts].slice(0, 60)

    setStore((prev) => ({
      ...prev,
      attempts: nextAttempts,
      milestones: createMilestones(nextAttempts, prev.milestones),
      lastSimulation: activeSimulation,
    }))
    setResult(outcome)
    setStep('result')
  }

  const saveProfile = (nextProfile: Profile) => {
    setStore((prev) => ({ ...prev, profile: nextProfile }))
    setShowOnboarding(false)
    setPage('dashboard')

    if (activeSimulation) {
      setDecisionValues(defaultDecisionValues(activeSimulation, nextProfile.level))
      setPage('simulations')
      setStep('scenario')
    }
  }

  if (loading) {
    return (
      <main className="loading-shell" aria-live="polite">
        <p>Loading your learning path…</p>
      </main>
    )
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <button className="brand" onClick={() => navigate(profile ? 'dashboard' : 'landing')}>
            <span className="brand-mark">U</span>
            UGraM
          </button>

          <button className="mobile-toggle" aria-label="Open navigation" onClick={() => setMobileMenuOpen((v) => !v)}>
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          <nav className={`nav ${mobileMenuOpen ? 'open' : ''}`}>
            {profile ? (
              <>
                <button onClick={() => navigate('dashboard')}>Dashboard</button>
                <button onClick={() => navigate('simulations')}>Simulations</button>
                <button onClick={() => navigate('progress')}>My Progress</button>
                <button onClick={() => navigate('about')}>About</button>
              </>
            ) : (
              <>
                <button onClick={() => navigate('landing')}>Home</button>
                <button onClick={() => navigate('simulations')}>Explore Simulations</button>
                <button onClick={() => navigate('about')}>About</button>
              </>
            )}
          </nav>

          {profile ? (
            <button className="profile-chip" onClick={() => navigate('profile')}>
              <UserRound size={14} />
              {profile.name.split(' ')[0]}
            </button>
          ) : (
            <button className="button primary" onClick={() => setShowOnboarding(true)}>
              Start learning
            </button>
          )}
        </div>
      </header>

      {warning && (
        <div className="notice warning" role="status">
          <CircleAlert size={16} />
          <span>{warning}</span>
        </div>
      )}
      {saveError && (
        <div className="notice warning" role="alert">
          <CircleAlert size={16} />
          <span>{saveError}</span>
        </div>
      )}

      {activeSimulation ? (
        <SimulationScreen
          simId={activeSimulation}
          level={level}
          step={step}
          values={decisionValues}
          result={result}
          attempts={store.attempts}
          profile={profile}
          onBack={() => {
            setActiveSimulation(null)
            navigate(profile ? 'dashboard' : 'simulations')
          }}
          onValueChange={(field, value) => setDecisionValues((prev) => ({ ...prev, [field]: value }))}
          onNextStep={setStep}
          onFinish={finishSimulation}
          onReplay={() => {
            setDecisionValues(defaultDecisionValues(activeSimulation, level))
            setStep('decision')
            setResult(null)
          }}
          onTryRecommended={(next) => openSimulation(next)}
        />
      ) : page === 'landing' ? (
        <Landing onStart={() => setShowOnboarding(true)} onExplore={() => navigate('simulations')} />
      ) : page === 'dashboard' && profile && recommendation ? (
        <Dashboard
          profile={profile}
          recommendation={recommendation}
          attempts={store.attempts}
          milestones={store.milestones}
          progressBySkill={progressBySkill}
          latestAttempt={latestAttempt}
          onOpenSimulation={openSimulation}
          onGoProgress={() => navigate('progress')}
        />
      ) : page === 'simulations' ? (
        <SimulationCatalogue definitions={definitions} onOpenSimulation={openSimulation} hasProfile={Boolean(profile)} />
      ) : page === 'progress' && profile ? (
        <ProgressPage
          attempts={store.attempts}
          milestones={store.milestones}
          onOpenSimulation={openSimulation}
          onReviewAttempt={setReviewAttempt}
        />
      ) : page === 'profile' && profile ? (
        <ProfilePage profile={profile} onSave={saveProfile} />
      ) : (
        <AboutPage onExplore={() => navigate(profile ? 'simulations' : 'landing')} />
      )}

      {showOnboarding && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
          <section className="modal-card">
            <button className="modal-close" onClick={() => setShowOnboarding(false)} aria-label="Close onboarding">
              <X size={18} />
            </button>
            <h2 id="onboarding-title">Create your learning profile</h2>
            <p className="muted-text">
              This authentication is prototype-only and data is stored only in this browser through localStorage.
            </p>
            <ProfileForm initial={profile ?? DEFAULT_PROFILE} submitLabel="Save and continue" onSubmit={saveProfile} />
          </section>
        </div>
      )}

      {reviewAttempt && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="review-title">
          <section className="modal-card">
            <button className="modal-close" onClick={() => setReviewAttempt(null)} aria-label="Close review">
              <X size={18} />
            </button>
            <h2 id="review-title">Review attempt</h2>
            <p className="muted-text">
              {reviewAttempt.simTitle} · {reviewAttempt.dateLabel} · Score {reviewAttempt.score}/100
            </p>
            <AttemptReview attempt={reviewAttempt} />
            <button
              className="button primary"
              onClick={() => {
                setReviewAttempt(null)
                openSimulation(reviewAttempt.simId)
              }}
            >
              Try again <RotateCcw size={15} />
            </button>
          </section>
        </div>
      )}
    </div>
  )
}

function Landing({ onStart, onExplore }: { onStart: () => void; onExplore: () => void }) {
  return (
    <main className="container hero-layout">
      <section className="hero">
        <p className="eyebrow">
          <Sparkles size={14} />
          SAFE PRACTICE FOR REAL-WORLD DECISIONS
        </p>
        <h1>Learn business decisions through simulation, not costly mistakes.</h1>
        <p>
          UGraM helps grassroots and rural entrepreneurs practice scenario → decision → consequence → feedback → try
          again loops before applying choices in real life.
        </p>
        <div className="hero-actions">
          <button className="button primary" onClick={onStart}>
            Create profile <ArrowRight size={15} />
          </button>
          <button className="button ghost" onClick={onExplore}>
            Explore public simulations
          </button>
        </div>
      </section>

      <section className="grid three">
        {[
          {
            title: 'Practice village-market trade-offs',
            body: 'Use ₹-based scenarios with seasonal demand, working capital, and inventory pressure.',
          },
          {
            title: 'See decision-linked outcomes',
            body: 'Every score and feedback item directly references what you entered.',
          },
          {
            title: 'Keep improving',
            body: 'Track attempts, review choices, and continue from personalized next recommendations.',
          },
        ].map((item) => (
          <article key={item.title} className="card">
            <h3>{item.title}</h3>
            <p>{item.body}</p>
          </article>
        ))}
      </section>
    </main>
  )
}

function Dashboard({
  profile,
  recommendation,
  attempts,
  milestones,
  progressBySkill,
  latestAttempt,
  onOpenSimulation,
  onGoProgress,
}: {
  profile: Profile
  recommendation: Recommendation
  attempts: Attempt[]
  milestones: AppStore['milestones']
  progressBySkill: { skill: string; average: number }[]
  latestAttempt: Attempt | null
  onOpenSimulation: (simId: SimId) => void
  onGoProgress: () => void
}) {
  const bestScore = attempts.length ? Math.max(...attempts.map((attempt) => attempt.score)) : null
  const uniqueSkills = new Set(attempts.flatMap((attempt) => attempt.outcome.skills)).size

  return (
    <main className="container stack-lg">
      <section>
        <p className="eyebrow">YOUR LEARNING DASHBOARD</p>
        <h1>Welcome back, {profile.name.split(' ')[0]}.</h1>
        <p className="muted-text">Next best action: complete one focused simulation and compare your score with your last attempt.</p>
      </section>

      <section className="card recommendation-card">
        <div>
          <p className="eyebrow">RECOMMENDED NEXT SIMULATION</p>
          <h2>{recommendation.title}</h2>
          <p>{recommendation.reason}</p>
          <p className="muted-text">Skill focus: {recommendation.nextSkillFocus.join(', ')}</p>
          <button className="button primary" onClick={() => onOpenSimulation(recommendation.simId)}>
            Start recommended simulation <ArrowRight size={15} />
          </button>
        </div>
        <Target size={28} />
      </section>

      <section className="grid three">
        <article className="card stat-card">
          <span>Total attempts</span>
          <strong>{attempts.length}</strong>
        </article>
        <article className="card stat-card">
          <span>Best score</span>
          <strong>{bestScore !== null ? `${bestScore}/100` : '—'}</strong>
        </article>
        <article className="card stat-card">
          <span>Skills practiced</span>
          <strong>{uniqueSkills}</strong>
        </article>
      </section>

      <section className="card stack-md">
        <h2>Progress by skill</h2>
        {progressBySkill.length === 0 ? (
          <p className="muted-text">No attempts yet. Start one simulation to see skill progress.</p>
        ) : (
          progressBySkill.map((item) => (
            <div key={item.skill} className="skill-row">
              <span>{item.skill}</span>
              <div className="skill-bar" aria-label={`${item.skill} average score ${item.average}`}>
                <i style={{ width: `${item.average}%` }} />
              </div>
              <b>{item.average}</b>
            </div>
          ))
        )}
      </section>

      <section className="card stack-md">
        <h2>Recent attempts</h2>
        {latestAttempt ? (
          <>
            <p>
              Latest: {latestAttempt.simTitle} ({latestAttempt.score}/100) on {latestAttempt.dateLabel}
            </p>
            <button className="button ghost" onClick={onGoProgress}>
              Review attempt history
            </button>
          </>
        ) : (
          <p className="muted-text">No attempt history yet. Start your first recommended simulation.</p>
        )}
      </section>

      <section className="card stack-md">
        <h2>Milestones</h2>
        {milestones.length === 0 ? (
          <p className="muted-text">Complete simulations to unlock milestones based on real progress.</p>
        ) : (
          <ul className="list">
            {milestones.map((milestone) => (
              <li key={milestone.id}>
                <Check size={16} />
                <span>
                  {milestone.label} <small>({milestone.achievedOn})</small>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

function SimulationCatalogue({
  definitions,
  onOpenSimulation,
  hasProfile,
}: {
  definitions: ReturnType<typeof getSimulationDefinitions>
  onOpenSimulation: (simId: SimId) => void
  hasProfile: boolean
}) {
  return (
    <main className="container stack-lg">
      <section>
        <p className="eyebrow">SIMULATION CATALOGUE</p>
        <h1>Explore and practice business scenarios</h1>
        <p className="muted-text">
          {hasProfile
            ? 'Choose any simulation and compare outcomes by trying different decisions.'
            : 'You can explore simulations now. Create a profile to save attempts and progress.'}
        </p>
      </section>

      <section className="grid three">
        {(Object.keys(definitions) as SimId[]).map((id) => (
          <SimulationCard key={id} sim={definitions[id]} onOpen={() => onOpenSimulation(id)} />
        ))}
      </section>
    </main>
  )
}

function SimulationCard({ sim, onOpen }: { sim: ReturnType<typeof getSimulationDefinitions>[SimId]; onOpen: () => void }) {
  const Icon = iconFor(sim.icon)

  return (
    <article className={`card sim-card ${sim.accent}`}>
      <div className="sim-top">
        <span className="pill">
          <Clock3 size={13} /> {sim.time}
        </span>
        <Icon size={20} />
      </div>
      <h3>{sim.title}</h3>
      <p>{sim.short}</p>
      <p className="muted-text">Skills: {sim.skills.join(', ')}</p>
      <button className="button ghost" onClick={onOpen}>
        Open simulation <ArrowRight size={15} />
      </button>
    </article>
  )
}

function SimulationScreen({
  simId,
  level,
  step,
  values,
  result,
  attempts,
  profile,
  onBack,
  onValueChange,
  onNextStep,
  onFinish,
  onReplay,
  onTryRecommended,
}: {
  simId: SimId
  level: Level
  step: SimStep
  values: Record<string, number>
  result: SimulationOutcome | null
  attempts: Attempt[]
  profile: Profile | null
  onBack: () => void
  onValueChange: (field: string, value: number) => void
  onNextStep: (step: SimStep) => void
  onFinish: () => void
  onReplay: () => void
  onTryRecommended: (simId: SimId) => void
}) {
  const sim = getSimulationDefinitions(level)[simId]
  const recommendation = profile ? recommendAfterResult(profile, attempts) : null

  const tryListen = () => {
    if (!result) return
    if (!('speechSynthesis' in window)) {
      alert('Listen to Tip is not available in this browser.')
      return
    }
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(result.tips[0]))
  }

  return (
    <main className="container stack-lg">
      <button className="button ghost" onClick={onBack}>
        <ChevronLeft size={14} /> Back to dashboard
      </button>

      <section>
        <p className="eyebrow">{sim.title.toUpperCase()}</p>
        <h1>{sim.scenarioTitle}</h1>
        <p className="muted-text">
          Difficulty: {level}. {sim.levelGuidance}
        </p>
      </section>

      <section className="stepper" aria-label="Simulation progress">
        {['scenario', 'decision', 'result'].map((item) => (
          <div key={item} className={step === item ? 'active' : ''}>
            {item}
          </div>
        ))}
      </section>

      {step === 'scenario' && (
        <section className="card stack-md">
          <h2>Scenario</h2>
          <p>{sim.scenarioBody}</p>
          <p className="muted-text">No real money is used. This is a simulation-only learning environment.</p>
          <button className="button primary" onClick={() => onNextStep('decision')}>
            Continue to decisions <ArrowRight size={15} />
          </button>
        </section>
      )}

      {step === 'decision' && (
        <section className="card stack-md">
          <h2>Decision inputs</h2>
          <p className="muted-text">Adjust values and submit to see consequences linked to your choices.</p>
          {sim.decisionFields.map((field) => (
            <RangeField
              key={field.key}
              field={field}
              value={values[field.key] ?? field.defaultValue}
              onChange={(value) => onValueChange(field.key, value)}
            />
          ))}
          <button className="button primary" onClick={onFinish}>
            See consequences and feedback <ArrowRight size={15} />
          </button>
        </section>
      )}

      {step === 'result' && result && (
        <section className="stack-md">
          <article className="card stack-md">
            <div className="result-head">
              <div>
                <p className="eyebrow">RESULT</p>
                <h2>{result.headline}</h2>
                <p>{result.summary}</p>
              </div>
              <strong className="score-chip">{result.score}/100</strong>
            </div>
            <button className="button ghost" onClick={tryListen}>
              <Volume2 size={14} /> Listen to tip
            </button>
          </article>

          <article className="card">
            <h3>Consequence snapshot</h3>
            <div className="grid two">
              {result.metrics.map((metric) => (
                <div key={metric.label} className="metric">
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="grid two">
            <div className="card stack-sm">
              <h3>What worked</h3>
              <ul className="list plain">
                {result.wins.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="card stack-sm">
              <h3>What to improve</h3>
              <ul className="list plain">
                {result.misses.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </article>

          <article className="card stack-sm">
            <h3>Feedback tips for your next try</h3>
            <ul className="list plain">
              {result.tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </article>

          {recommendation && (
            <article className="card stack-sm">
              <h3>Recommended next simulation</h3>
              <p>{recommendation.title}</p>
              <p className="muted-text">{recommendation.reason}</p>
              <button className="button ghost" onClick={() => onTryRecommended(recommendation.simId)}>
                Go to recommendation
              </button>
            </article>
          )}

          <div className="button-row">
            <button className="button primary" onClick={onReplay}>
              Try again <RotateCcw size={14} />
            </button>
            <button className="button ghost" onClick={() => onNextStep('decision')}>
              Review decisions
            </button>
          </div>
        </section>
      )}
    </main>
  )
}

function RangeField({ field, value, onChange }: { field: DecisionField; value: number; onChange: (next: number) => void }) {
  return (
    <label className="stack-xs">
      <div className="between">
        <span>{field.label}</span>
        <strong>{formatDecisionValue(field, value)}</strong>
      </div>
      <input
        type="range"
        min={field.min}
        max={field.max}
        step={field.step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label={field.label}
      />
      <small className="muted-text">{field.help}</small>
    </label>
  )
}

function ProgressPage({
  attempts,
  milestones,
  onOpenSimulation,
  onReviewAttempt,
}: {
  attempts: Attempt[]
  milestones: AppStore['milestones']
  onOpenSimulation: (simId: SimId) => void
  onReviewAttempt: (attempt: Attempt) => void
}) {
  const best = attempts.length ? Math.max(...attempts.map((item) => item.score)) : null
  const latest = attempts[0]

  return (
    <main className="container stack-lg">
      <section>
        <p className="eyebrow">RETURNING LEARNER VIEW</p>
        <h1>Track, review, and continue learning</h1>
        <p className="muted-text">Progress reflects only your real stored attempts—no fabricated numbers.</p>
      </section>

      <section className="grid three">
        <article className="card stat-card">
          <span>Attempts saved</span>
          <strong>{attempts.length}</strong>
        </article>
        <article className="card stat-card">
          <span>Latest score</span>
          <strong>{latest ? `${latest.score}/100` : '—'}</strong>
        </article>
        <article className="card stat-card">
          <span>Best score</span>
          <strong>{best !== null ? `${best}/100` : '—'}</strong>
        </article>
      </section>

      <section className="card stack-md">
        <h2>Attempt history</h2>
        {attempts.length === 0 ? (
          <div className="empty-state">
            <CircleHelp size={20} />
            <p>No attempt history yet. Complete one simulation to unlock review and progression.</p>
            <button className="button primary" onClick={() => onOpenSimulation('market')}>
              Start with Market Day
            </button>
          </div>
        ) : (
          <ul className="list attempts">
            {attempts.map((attempt) => (
              <li key={attempt.id}>
                <div>
                  <strong>{attempt.simTitle}</strong>
                  <small>
                    {attempt.dateLabel} · {attempt.level} · score {attempt.score}/100 ·
                    {' improvement: '}
                    {attempt.improvementFromPrevious === null
                      ? 'first attempt'
                      : `${attempt.improvementFromPrevious >= 0 ? '+' : ''}${attempt.improvementFromPrevious}`}
                  </small>
                </div>
                <div className="button-row">
                  <button className="button ghost" onClick={() => onReviewAttempt(attempt)}>
                    Review attempt
                  </button>
                  <button className="button ghost" onClick={() => onOpenSimulation(attempt.simId)}>
                    Try again
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card stack-sm">
        <h2>Milestones</h2>
        {milestones.length === 0 ? (
          <p className="muted-text">Milestones appear when actual attempt data reaches each condition.</p>
        ) : (
          <ul className="list">
            {milestones.map((milestone) => (
              <li key={milestone.id}>
                <Check size={15} /> {milestone.label} ({milestone.achievedOn})
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

function ProfilePage({ profile, onSave }: { profile: Profile; onSave: (profile: Profile) => void }) {
  return (
    <main className="container stack-lg">
      <section>
        <p className="eyebrow">PROFILE SETTINGS</p>
        <h1>Update your learning profile</h1>
      </section>
      <section className="card">
        <ProfileForm initial={profile} submitLabel="Save profile" onSubmit={onSave} />
      </section>
    </main>
  )
}

function ProfileForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial: Profile
  submitLabel: string
  onSubmit: (profile: Profile) => void
}) {
  const [form, setForm] = useState<Profile>(initial)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    setForm(initial)
  }, [initial])

  const toggle = (key: 'interests' | 'skills', value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(value) ? prev[key].filter((entry) => entry !== value) : [...prev[key], value],
    }))
  }

  const validName = form.name.trim().length >= 2
  const validEmail = /.+@.+\..+/.test(form.email.trim())
  const valid = validName && validEmail && form.interests.length > 0 && form.skills.length > 0

  return (
    <form
      className="stack-md"
      onSubmit={(event) => {
        event.preventDefault()
        setSubmitted(true)
        if (!valid) return
        onSubmit({ ...form, name: form.name.trim(), email: form.email.trim() })
      }}
    >
      <div className="grid two">
        <label className="stack-xs">
          <span>Full name</span>
          <input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} required />
        </label>
        <label className="stack-xs">
          <span>Email</span>
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            required
          />
        </label>
        <label className="stack-xs">
          <span>User type</span>
          <select
            value={form.userType}
            onChange={(event) => setForm((prev) => ({ ...prev, userType: event.target.value as Profile['userType'] }))}
          >
            {USER_TYPES.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <label className="stack-xs">
          <span>Experience level</span>
          <select
            value={form.level}
            onChange={(event) => setForm((prev) => ({ ...prev, level: event.target.value as Profile['level'] }))}
          >
            {LEVELS.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <label className="stack-xs">
          <span>Preferred language</span>
          <select
            value={form.language}
            onChange={(event) => setForm((prev) => ({ ...prev, language: event.target.value }))}
          >
            {LANGUAGE_OPTIONS.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
      </div>

      <fieldset className="stack-sm">
        <legend>Interests</legend>
        <div className="chip-wrap">
          {INTEREST_OPTIONS.map((option) => (
            <button
              type="button"
              key={option}
              className={`chip ${form.interests.includes(option) ? 'active' : ''}`}
              onClick={() => toggle('interests', option)}
              aria-pressed={form.interests.includes(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="stack-sm">
        <legend>Skills to strengthen</legend>
        <div className="chip-wrap">
          {SKILL_OPTIONS.map((option) => (
            <button
              type="button"
              key={option}
              className={`chip ${form.skills.includes(option) ? 'active' : ''}`}
              onClick={() => toggle('skills', option)}
              aria-pressed={form.skills.includes(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </fieldset>

      {!valid && submitted && (
        <p className="validation" role="alert">
          <CircleAlert size={14} />
          Please enter a valid name and email, and select at least one interest and one skill.
        </p>
      )}

      <button className="button primary" disabled={!valid}>
        {submitLabel} <ArrowRight size={15} />
      </button>
    </form>
  )
}

function AttemptReview({ attempt }: { attempt: Attempt }) {
  return (
    <div className="stack-md">
      <article className="card stack-sm">
        <h3>Decisions made</h3>
        <ul className="list plain">
          {Object.entries(attempt.outcome.decisions).map(([label, value]) => (
            <li key={label}>
              <strong>{label}:</strong> {value}
            </li>
          ))}
        </ul>
      </article>

      <article className="card stack-sm">
        <h3>Result summary</h3>
        <p>{attempt.outcome.headline}</p>
        <p className="muted-text">{attempt.outcome.summary}</p>
      </article>
    </div>
  )
}

function AboutPage({ onExplore }: { onExplore: () => void }) {
  return (
    <main className="container stack-lg">
      <section>
        <p className="eyebrow">ABOUT UGRAM</p>
        <h1>Simulation-based learning for grassroots entrepreneurship.</h1>
        <p className="muted-text">
          UGraM is a prototype that helps learners practice village-market pricing, borrowing decisions, and shop ledger
          tracking in a safe loop. It does not replace professional advice, mentors, or real lending assessment.
        </p>
        <button className="button primary" onClick={onExplore}>
          Explore simulations
        </button>
      </section>
    </main>
  )
}
