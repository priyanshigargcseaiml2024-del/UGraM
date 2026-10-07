import type { DecisionField, Level, SimId, SimulationDefinition, SimulationOutcome } from './types'

export const money = (n: number): string => `₹${Math.round(n).toLocaleString('en-IN')}`

const clamp = (n: number, min: number, max: number): number => Math.min(max, Math.max(min, n))

const byLevel = <T>(level: Level, values: { Beginner: T; Intermediate: T; Advanced: T }): T => values[level]

const withLevelGuidance = (level: Level): string =>
  byLevel(level, {
    Beginner: 'You will get broader safety margins and clear prompts for first attempts.',
    Intermediate: 'This level tightens margins, so each decision needs better balance.',
    Advanced: 'This level adds stricter margins and more uncertainty from local conditions.',
  })

const marketFields = (level: Level): DecisionField[] => {
  const priceRange = byLevel(level, {
    Beginner: { min: 18, max: 34 },
    Intermediate: { min: 17, max: 40 },
    Advanced: { min: 16, max: 44 },
  })

  return [
    {
      key: 'price',
      label: 'Selling price per unit',
      min: priceRange.min,
      max: priceRange.max,
      step: 1,
      suffix: '₹',
      defaultValue: byLevel(level, { Beginner: 24, Intermediate: 27, Advanced: 30 }),
      help: 'A higher price can increase margin but may reduce customer demand in the village market.',
    },
    {
      key: 'stock',
      label: 'Stock to buy',
      min: 20,
      max: byLevel(level, { Beginner: 90, Intermediate: 110, Advanced: 130 }),
      step: 5,
      suffix: ' units',
      defaultValue: byLevel(level, { Beginner: 55, Intermediate: 70, Advanced: 85 }),
      help: 'Buying too much stock can lock working capital if demand slows after peak days.',
    },
    {
      key: 'reserve',
      label: 'Cash reserve to keep aside',
      min: 0,
      max: byLevel(level, { Beginner: 350, Intermediate: 500, Advanced: 600 }),
      step: 25,
      suffix: '₹',
      defaultValue: byLevel(level, { Beginner: 150, Intermediate: 180, Advanced: 220 }),
      help: 'Reserve is the money left untouched for transport, emergency purchase, or a slow sales day.',
    },
  ]
}

const bankFields = (level: Level): DecisionField[] => [
  {
    key: 'loan',
    label: 'Loan amount',
    min: 30000,
    max: byLevel(level, { Beginner: 100000, Intermediate: 130000, Advanced: 160000 }),
    step: 5000,
    suffix: '₹',
    defaultValue: byLevel(level, { Beginner: 60000, Intermediate: 80000, Advanced: 95000 }),
    help: 'Borrow for a specific growth plan, not just because loan approval is available.',
  },
  {
    key: 'months',
    label: 'Repayment period',
    min: 6,
    max: byLevel(level, { Beginner: 24, Intermediate: 30, Advanced: 36 }),
    step: 3,
    suffix: ' months',
    defaultValue: byLevel(level, { Beginner: 18, Intermediate: 18, Advanced: 15 }),
    help: 'Longer tenure eases monthly pressure but can increase total repayment.',
  },
  {
    key: 'investment',
    label: 'Amount invested in business use',
    min: 10000,
    max: byLevel(level, { Beginner: 90000, Intermediate: 120000, Advanced: 150000 }),
    step: 5000,
    suffix: '₹',
    defaultValue: byLevel(level, { Beginner: 35000, Intermediate: 50000, Advanced: 70000 }),
    help: 'Link investment to assets or inventory that can improve weekly sales reliability.',
  },
  {
    key: 'reserve',
    label: 'Working capital reserve after loan',
    min: 0,
    max: byLevel(level, { Beginner: 45000, Intermediate: 50000, Advanced: 60000 }),
    step: 2500,
    suffix: '₹',
    defaultValue: byLevel(level, { Beginner: 18000, Intermediate: 20000, Advanced: 22000 }),
    help: 'Keep reserve for one weak month so repayments do not break operating cash.',
  },
]

const ledgerFields = (level: Level): DecisionField[] => [
  {
    key: 'sales',
    label: 'Sales recorded for the week',
    min: 3000,
    max: byLevel(level, { Beginner: 12000, Intermediate: 14000, Advanced: 16000 }),
    step: 250,
    suffix: '₹',
    defaultValue: byLevel(level, { Beginner: 7000, Intermediate: 8500, Advanced: 9500 }),
    help: 'Record all credit and cash sales to avoid wrong profit assumptions.',
  },
  {
    key: 'stock',
    label: 'Stock purchased',
    min: 1500,
    max: byLevel(level, { Beginner: 6500, Intermediate: 8200, Advanced: 9000 }),
    step: 100,
    suffix: '₹',
    defaultValue: byLevel(level, { Beginner: 3600, Intermediate: 4300, Advanced: 5200 }),
    help: 'Stock purchases should stay aligned to sales speed and shelf movement.',
  },
  {
    key: 'expenses',
    label: 'Other shop expenses',
    min: 200,
    max: byLevel(level, { Beginner: 3000, Intermediate: 3800, Advanced: 4500 }),
    step: 100,
    suffix: '₹',
    defaultValue: byLevel(level, { Beginner: 900, Intermediate: 1200, Advanced: 1500 }),
    help: 'Transport, electricity, and repairs are valid costs—track them separately from household use.',
  },
]

const mapDef = (level: Level): Record<SimId, SimulationDefinition> => ({
  market: {
    id: 'market',
    title: 'Market Day',
    short: 'Practice pricing, demand, inventory, and cash reserve decisions for a village festival market.',
    time: '5 min',
    accent: 'saffron',
    icon: 'market',
    skills: ['Pricing', 'Inventory'],
    scenarioTitle: 'A festival market starts in your village tomorrow.',
    scenarioBody:
      'You have one chance to buy stock before the first crowd arrives. Choose price, quantity, and reserve so you can sell well without freezing your working cash.',
    levelGuidance: withLevelGuidance(level),
    decisionFields: marketFields(level),
  },
  bank: {
    id: 'bank',
    title: 'Bank Visit',
    short: 'Practice loan size, repayment, investment, reserve, and risk trade-offs before accepting credit.',
    time: '6 min',
    accent: 'green',
    icon: 'bank',
    skills: ['Financial Decisions', 'Negotiation'],
    scenarioTitle: 'You are discussing a loan for business growth.',
    scenarioBody:
      'A local lender can approve credit, but your repayment must survive slow months. Balance loan amount, term, usage, and reserve for stable cash flow.',
    levelGuidance: withLevelGuidance(level),
    decisionFields: bankFields(level),
  },
  ledger: {
    id: 'ledger',
    title: 'Virtual Shop Ledger',
    short: 'Practice weekly ledger tracking for sales, purchases, expenses, and true cash-flow health.',
    time: '4 min',
    accent: 'blue',
    icon: 'ledger',
    skills: ['Cash Flow', 'Business Planning'],
    scenarioTitle: 'You are closing this week\'s handwritten ledger.',
    scenarioBody:
      'Your sales seem strong, but credit collection delays and expenses can still reduce available cash. Record carefully to see the real result.',
    levelGuidance: withLevelGuidance(level),
    decisionFields: ledgerFields(level),
  },
})

export const getSimulationDefinitions = (level: Level): Record<SimId, SimulationDefinition> => mapDef(level)

const renderValue = (field: DecisionField, value: number): string =>
  field.suffix === '₹' ? money(value) : `${value.toLocaleString('en-IN')}${field.suffix}`

const marketOutcome = (values: Record<string, number>, level: Level): SimulationOutcome => {
  const price = values.price
  const stock = values.stock
  const reserve = values.reserve

  const baseDemand = byLevel(level, { Beginner: 78, Intermediate: 67, Advanced: 58 })
  const seasonalShift = (((price * 7 + stock * 3 + reserve) % 9) - 4) * byLevel(level, { Beginner: 0.8, Intermediate: 1, Advanced: 1.4 })
  const affordabilityDrop = (price - 24) * byLevel(level, { Beginner: 1.1, Intermediate: 1.35, Advanced: 1.5 })
  const demand = Math.round(clamp(baseDemand - affordabilityDrop + seasonalShift, 15, 110))
  const sold = Math.min(stock, demand)
  const costPerUnit = byLevel(level, { Beginner: 13, Intermediate: 13.5, Advanced: 14 })
  const cost = stock * costPerUnit
  const revenue = sold * price
  const profit = revenue - cost
  const leftover = stock - sold
  const closingCash = 1200 - cost + revenue - reserve

  const score = Math.round(
    clamp(
      58 +
        profit / byLevel(level, { Beginner: 170, Intermediate: 190, Advanced: 230 }) -
        leftover * byLevel(level, { Beginner: 0.45, Intermediate: 0.6, Advanced: 0.8 }) +
        (reserve >= byLevel(level, { Beginner: 120, Intermediate: 160, Advanced: 220 }) ? 6 : -4),
      8,
      98,
    ),
  )

  return {
    score,
    headline: profit >= 0 ? `You earned ${money(profit)} on market day.` : `You faced a ${money(Math.abs(profit))} market-day loss.`,
    summary: 'Outcome reflects how your price affected demand, how much inventory stayed unsold, and how reserve protected your working cash.',
    metrics: [
      { label: 'Estimated demand', value: `${demand} units` },
      { label: 'Units sold', value: `${sold}/${stock}` },
      { label: 'Leftover inventory', value: `${leftover} units` },
      { label: 'Revenue', value: money(revenue) },
      { label: 'Profit / loss', value: money(profit) },
      { label: 'Closing cash after reserve', value: money(closingCash) },
    ],
    wins: [
      price <= 28 ? `Your ${money(price)} price stayed close to village buying comfort.` : 'You explored a higher price to test margin vs demand.',
      reserve >= 120 ? `Keeping ${money(reserve)} aside reduced working-capital stress.` : 'You chose to deploy most cash into stock, useful when demand certainty is high.',
    ],
    misses: [
      leftover > 12 ? `${leftover} units remained unsold, showing over-ordering for current demand.` : 'Inventory was broadly aligned with expected demand.',
      price > 31 ? 'Higher price reduced customer conversion during price-sensitive buying.' : 'Try observing nearby market rates before final pricing next time.',
    ],
    tips: [
      'Start with likely customer footfall, then back-calculate stock and pricing.',
      'Reserve some cash to keep purchasing ability alive after one weak sales day.',
    ],
    decisions: {
      'Selling price': money(price),
      'Stock purchased': `${stock} units`,
      'Cash reserve': money(reserve),
    },
    skills: ['Pricing', 'Inventory'],
  }
}

const bankOutcome = (values: Record<string, number>, level: Level): SimulationOutcome => {
  const loan = values.loan
  const months = values.months
  const investment = values.investment
  const reserve = values.reserve

  const baseRate = byLevel(level, { Beginner: 0.115, Intermediate: 0.13, Advanced: 0.148 })
  const tenureAdj = months >= 24 ? 0.01 : months <= 12 ? -0.007 : 0
  const utilizationPenalty = investment < loan * 0.55 ? 0.012 : 0
  const effectiveRate = baseRate + tenureAdj + utilizationPenalty
  const monthlyRepayment = (loan * (1 + effectiveRate)) / months
  const projectedMonthlyBenefit = investment * byLevel(level, { Beginner: 0.032, Intermediate: 0.03, Advanced: 0.028 }) + 2200
  const reserveCoverageMonths = reserve / monthlyRepayment
  const repaymentRisk = monthlyRepayment / projectedMonthlyBenefit

  const score = Math.round(
    clamp(
      95 - repaymentRisk * 52 + reserveCoverageMonths * 6 - (loan > investment * 1.35 ? 9 : 0) - (months < 12 ? 5 : 0),
      10,
      99,
    ),
  )

  const riskLabel = repaymentRisk < 0.45 ? 'Low' : repaymentRisk < 0.62 ? 'Moderate' : 'High'

  return {
    score,
    headline: repaymentRisk < 0.62 ? 'Your repayment plan looks manageable.' : 'Repayment pressure may stretch your shop cash flow.',
    summary: 'Result is based on loan burden, expected business return from investment, and reserve coverage for weak months.',
    metrics: [
      { label: 'Interest rate used', value: `${(effectiveRate * 100).toFixed(1)}%` },
      { label: 'Monthly repayment', value: money(monthlyRepayment) },
      { label: 'Projected monthly gain', value: money(projectedMonthlyBenefit) },
      { label: 'Reserve coverage', value: `${reserveCoverageMonths.toFixed(1)} months` },
      { label: 'Repayment risk', value: riskLabel },
      { label: 'Loan use ratio', value: `${Math.round((investment / loan) * 100)}%` },
    ],
    wins: [
      reserveCoverageMonths >= 1 ? 'You protected at least one month of repayment buffer.' : 'You assigned funds to productive investment instead of idle borrowing.',
      months >= 15 ? 'The repayment tenure softens monthly repayment spikes.' : 'Short tenure can reduce total interest if sales stay consistent.',
    ],
    misses: [
      repaymentRisk > 0.62 ? `Repayment absorbs about ${Math.round(repaymentRisk * 100)}% of expected monthly benefit.` : 'Validate final processing fees before accepting the loan.',
      investment < loan * 0.65
        ? 'A large share of loan amount is not tied to business return, increasing debt drag.'
        : 'Map investment to expected sales uplift so monthly gains are trackable.',
    ],
    tips: [
      'Borrow against a clear cash-generating plan, not only against loan eligibility.',
      'Track repayment vs weekly profit so warning signs appear early.',
    ],
    decisions: {
      'Loan amount': money(loan),
      'Repayment period': `${months} months`,
      'Business investment': money(investment),
      'Cash reserve': money(reserve),
    },
    skills: ['Financial Decisions', 'Negotiation'],
  }
}

const ledgerOutcome = (values: Record<string, number>, level: Level): SimulationOutcome => {
  const sales = values.sales
  const stock = values.stock
  const expenses = values.expenses

  const openingCash = 12000
  const creditDelay = byLevel(level, { Beginner: 0.06, Intermediate: 0.11, Advanced: 0.16 })
  const delayedCollections = sales * creditDelay
  const cashCollected = sales - delayedCollections
  const profit = sales - stock - expenses
  const closingCash = openingCash + cashCollected - stock - expenses
  const expensePressure = expenses / Math.max(sales, 1)

  const score = Math.round(
    clamp(
      54 +
        profit / byLevel(level, { Beginner: 95, Intermediate: 115, Advanced: 135 }) -
        expensePressure * byLevel(level, { Beginner: 18, Intermediate: 23, Advanced: 28 }) +
        (closingCash >= 11000 ? 6 : -8),
      5,
      98,
    ),
  )

  return {
    score,
    headline: profit >= 0 ? `Ledger shows ${money(profit)} weekly profit.` : `Ledger shows ${money(Math.abs(profit))} weekly loss.`,
    summary: 'Result combines accounting profit, delayed customer payments, and resulting closing cash availability.',
    metrics: [
      { label: 'Opening cash', value: money(openingCash) },
      { label: 'Sales recorded', value: money(sales) },
      { label: 'Delayed credit collections', value: money(delayedCollections) },
      { label: 'Stock purchased', value: money(stock) },
      { label: 'Other expenses', value: money(expenses) },
      { label: 'Closing cash', value: money(closingCash) },
    ],
    wins: [
      sales >= 7000 ? 'Sales volume gave room to absorb routine shop expenses.' : 'You captured baseline sales, which is the first step toward improving decisions.',
      stock <= sales * 0.62 ? 'Stock purchases were broadly proportional to recorded sales.' : 'Your ledger clearly separates stock purchase from other spend.',
    ],
    misses: [
      expensePressure > 0.32 ? 'Expenses consumed a high share of sales; review recurring costs line by line.' : 'Continue separating household withdrawals from business expenses.',
      closingCash < 10000
        ? 'Cash reduced significantly after delayed collections; recovery planning is needed.'
        : 'Even with profit, watch pending collections to avoid next-week cash stress.',
    ],
    tips: [
      'Record credit sales with expected collection dates to avoid overestimating available cash.',
      'Review one high expense weekly and check if it directly supports sales.',
    ],
    decisions: {
      'Sales recorded': money(sales),
      'Stock purchased': money(stock),
      'Other expenses': money(expenses),
    },
    skills: ['Cash Flow', 'Business Planning'],
  }
}

export const runSimulation = (simId: SimId, values: Record<string, number>, level: Level): SimulationOutcome => {
  if (simId === 'market') return marketOutcome(values, level)
  if (simId === 'bank') return bankOutcome(values, level)
  return ledgerOutcome(values, level)
}

export const defaultDecisionValues = (simId: SimId, level: Level): Record<string, number> => {
  const fields = getSimulationDefinitions(level)[simId].decisionFields
  return fields.reduce<Record<string, number>>((acc, field) => {
    acc[field.key] = field.defaultValue
    return acc
  }, {})
}

export const formatDecisionValue = (field: DecisionField, value: number): string => renderValue(field, value)
