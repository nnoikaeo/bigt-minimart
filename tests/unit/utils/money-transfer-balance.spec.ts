import { describe, it, expect } from 'vitest'
import { computeBalanceImpacts, transactionEffect } from '~/utils/money-transfer-balance'

// Real day from the manual test (MT 17/10/2569, opening 7,500): the transfer was recorded first
// but completed after the deposit, then put on hold and cancelled
const DAY = [
  { id: 'transfer', transactionType: 'transfer', status: 'cancelled', amount: 800, commission: 10, commissionType: 'cash',
    createdAt: '2026-11-02T13:26:49.892Z', completedAt: '2026-11-02T13:33:12.529Z' },
  { id: 'withdrawal', transactionType: 'withdrawal', status: 'completed', amount: 300, commission: 10, commissionType: 'cash',
    createdAt: '2026-11-02T13:28:04.940Z', completedAt: '2026-11-02T13:34:05.716Z' },
  { id: 'deposit', transactionType: 'owner_deposit', status: 'completed', amount: 1000, commission: 0,
    createdAt: '2026-11-02T13:28:37.935Z' },
]

describe('transactionEffect', () => {
  it('transfer: bank down, transfer cash up, cash fee', () => {
    expect(transactionEffect({ id: 'a', transactionType: 'transfer', amount: 800, commission: 10, commissionType: 'cash' }))
      .toEqual({ bankAccount: -800, transferCash: 800, serviceFeeCash: 10, serviceFeeTransfer: 0 })
  })

  it('transfer with a transfer fee: the fee does not touch the bank (same as the server)', () => {
    expect(transactionEffect({ id: 'a', transactionType: 'transfer', amount: 800, commission: 10, commissionType: 'transfer' }))
      .toEqual({ bankAccount: -800, transferCash: 800, serviceFeeCash: 0, serviceFeeTransfer: 10 })
  })

  it('withdrawal with a transfer fee: amount and fee land in the bank', () => {
    expect(transactionEffect({ id: 'a', transactionType: 'withdrawal', amount: 300, commission: 10, commissionType: 'transfer' }))
      .toEqual({ bankAccount: 310, transferCash: -300, serviceFeeCash: 0, serviceFeeTransfer: 10 })
  })

  it('owner deposit: bank up only, ignores any commission', () => {
    expect(transactionEffect({ id: 'a', transactionType: 'owner_deposit', amount: 1000, commission: 10, commissionType: 'cash' }))
      .toEqual({ bankAccount: 1000, transferCash: 0, serviceFeeCash: 0, serviceFeeTransfer: 0 })
  })
})

describe('computeBalanceImpacts (BUG-056)', () => {
  it('replays only completed transactions, in completion order, from the opening balance', () => {
    const impacts = computeBalanceImpacts(DAY, 7500)
    expect(impacts.has('transfer')).toBe(false)
    expect(impacts.get('deposit')).toMatchObject({ bankAccountBefore: 7500, bankAccountAfter: 8500 })
    expect(impacts.get('withdrawal')).toMatchObject({
      bankAccountBefore: 8500, bankAccountAfter: 8800,
      transferCashBefore: 0, transferCashAfter: -300,
      serviceFeeBeforeCash: 0, serviceFeeAfterCash: 10,
    })
  })

  it('ends at the current balance of the day (8,800 / -300 / fee 10)', () => {
    const last = computeBalanceImpacts(DAY, 7500).get('withdrawal')
    expect([last?.bankAccountAfter, last?.transferCashAfter, last?.serviceFeeAfterCash]).toEqual([8800, -300, 10])
  })

  it('counts the transfer again once it is completed, ordered by when it was completed', () => {
    const day = DAY.map(t => (t.id === 'transfer' ? { ...t, status: 'completed' } : t))
    const impacts = computeBalanceImpacts(day, 7500)
    expect(impacts.get('deposit')).toMatchObject({ bankAccountBefore: 7500, bankAccountAfter: 8500 })
    expect(impacts.get('transfer')).toMatchObject({ bankAccountBefore: 8500, bankAccountAfter: 7700, transferCashAfter: 800 })
    expect(impacts.get('withdrawal')).toMatchObject({ bankAccountBefore: 7700, bankAccountAfter: 8000, transferCashAfter: 500 })
  })
})
