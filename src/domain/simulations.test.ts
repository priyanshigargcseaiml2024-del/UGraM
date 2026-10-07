import { describe, expect, it } from 'vitest'
import { defaultDecisionValues, runSimulation } from './simulations'

describe('simulation engines', () => {
  it('market outcome changes with level difficulty', () => {
    const values = { price: 30, stock: 90, reserve: 100 }
    const beginner = runSimulation('market', values, 'Beginner')
    const advanced = runSimulation('market', values, 'Advanced')

    expect(beginner.score).toBeGreaterThan(advanced.score)
    expect(beginner.metrics.length).toBeGreaterThan(4)
  })

  it('bank simulation reports repayment risk metric', () => {
    const values = { loan: 110000, months: 12, investment: 45000, reserve: 8000 }
    const result = runSimulation('bank', values, 'Intermediate')

    expect(result.metrics.find((item) => item.label === 'Repayment risk')).toBeTruthy()
    expect(result.decisions['Loan amount']).toContain('₹')
  })

  it('ledger defaults exist for each level', () => {
    const beginner = defaultDecisionValues('ledger', 'Beginner')
    const advanced = defaultDecisionValues('ledger', 'Advanced')

    expect(beginner.sales).toBeLessThanOrEqual(advanced.sales)
    expect(advanced.expenses).toBeGreaterThanOrEqual(beginner.expenses)
  })
})
