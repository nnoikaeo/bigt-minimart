/**
 * Money Transfer balance effects — one place for the rules the server applies
 * (server/api/money-transfer/transactions/*: create, complete, edit, status).
 *
 *   transfer       customer gives cash, shop transfers from the bank
 *                  → bank −amount, transfer cash +amount
 *   withdrawal     shop gives cash, customer transfers to the bank
 *                  → bank +amount, transfer cash −amount
 *   owner_deposit  → bank +amount
 *   commission     cash → service fee (cash) +commission
 *                  transfer → service fee (transfer) +commission;
 *                  for a withdrawal it also lands in the bank (+commission)
 *
 * Only `completed` transactions count. draft / on_hold / cancelled have no effect.
 */

export interface MtBalances {
  bankAccount: number
  transferCash: number
  serviceFeeCash: number
  serviceFeeTransfer: number
}

export interface MtBalanceImpact {
  bankAccountBefore: number
  bankAccountAfter: number
  transferCashBefore: number
  transferCashAfter: number
  serviceFeeBeforeCash: number
  serviceFeeAfterCash: number
  serviceFeeBeforeTransfer: number
  serviceFeeAfterTransfer: number
}

interface MtTransactionLike {
  id: string
  status?: string
  transactionType?: string
  amount?: number | string
  commission?: number | string
  commissionType?: string
  completedAt?: string | Date
  createdAt?: string | Date
  datetime?: string | Date
}

const ZERO: MtBalances = { bankAccount: 0, transferCash: 0, serviceFeeCash: 0, serviceFeeTransfer: 0 }

/** What one completed transaction adds to each balance (negative = takes away). */
export function transactionEffect(txn: MtTransactionLike): MtBalances {
  const amount = Number(txn.amount) || 0
  const commission = txn.transactionType === 'owner_deposit' ? 0 : Number(txn.commission) || 0
  const effect = { ...ZERO }

  if (txn.transactionType === 'owner_deposit') {
    effect.bankAccount += amount
  } else if (txn.transactionType === 'withdrawal') {
    effect.bankAccount += amount
    effect.transferCash -= amount
  } else {
    effect.bankAccount -= amount
    effect.transferCash += amount
  }

  if (commission > 0) {
    if (txn.commissionType === 'cash') {
      effect.serviceFeeCash += commission
    } else if (txn.commissionType === 'transfer') {
      effect.serviceFeeTransfer += commission
      if (txn.transactionType === 'withdrawal') effect.bankAccount += commission
    }
  }
  return effect
}

export function addBalances(a: MtBalances, b: MtBalances, sign: 1 | -1 = 1): MtBalances {
  return {
    bankAccount: a.bankAccount + sign * b.bankAccount,
    transferCash: a.transferCash + sign * b.transferCash,
    serviceFeeCash: a.serviceFeeCash + sign * b.serviceFeeCash,
    serviceFeeTransfer: a.serviceFeeTransfer + sign * b.serviceFeeTransfer,
  }
}

/** When the transaction hit the balance: completion time (bank-statement order), else creation time. */
function effectiveTime(txn: MtTransactionLike): string {
  const value = txn.completedAt ?? txn.createdAt ?? txn.datetime ?? ''
  return value instanceof Date ? value.toISOString() : String(value)
}

/**
 * Before → after of every completed transaction of one day, replayed from the
 * opening bank balance in the order they were completed (BUG-056).
 * Transfer cash and service fees start the day at 0 (the server's initial balance).
 * The last "after" equals the day's current balance.
 */
export function computeBalanceImpacts(
  transactions: MtTransactionLike[],
  openingBankAccount: number
): Map<string, MtBalanceImpact> {
  const completed = transactions
    .filter(t => t.status === 'completed')
    .sort((a, b) => effectiveTime(a).localeCompare(effectiveTime(b)))

  const impacts = new Map<string, MtBalanceImpact>()
  let running: MtBalances = { ...ZERO, bankAccount: Number(openingBankAccount) || 0 }

  for (const txn of completed) {
    const after = addBalances(running, transactionEffect(txn))
    impacts.set(txn.id, {
      bankAccountBefore: running.bankAccount,
      bankAccountAfter: after.bankAccount,
      transferCashBefore: running.transferCash,
      transferCashAfter: after.transferCash,
      serviceFeeBeforeCash: running.serviceFeeCash,
      serviceFeeAfterCash: after.serviceFeeCash,
      serviceFeeBeforeTransfer: running.serviceFeeTransfer,
      serviceFeeAfterTransfer: after.serviceFeeTransfer,
    })
    running = after
  }
  return impacts
}
