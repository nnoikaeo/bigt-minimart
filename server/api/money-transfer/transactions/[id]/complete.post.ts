import { moneyTransferJsonRepository } from '~/server/repositories/money-transfer-json.repository'

/**
 * POST /api/money-transfer/transactions/[id]/complete
 *
 * Complete a draft transaction after owner deposits funds
 * - Verifies transaction is currently draft status
 * - Checks if balance is now sufficient
 * - Updates transaction to completed status
 * - Updates balance impacts and snapshots
 * - Updates daily summary transaction counts
 *
 * Response: { success: boolean, data: MoneyTransferTransaction }
 */

export default defineEventHandler(async (event) => {
  try {
    // Initialize repository
    await moneyTransferJsonRepository.init()

    // Get transaction ID from route params
    const id = event.context.params?.id

    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Transaction ID is required',
      })
    }

    console.log('[POST /api/money-transfer/transactions/[id]/complete] ID:', id)

    // Get the transaction
    const transaction = await moneyTransferJsonRepository.getTransaction(id)

    console.log('[POST /api/money-transfer/transactions/[id]/complete] Transaction status:', transaction.status)

    // Verify it's a draft
    if (transaction.status !== 'draft') {
      throw createError({
        statusCode: 400,
        message: `Only draft transactions can be completed. Current status: ${transaction.status}`,
      })
    }

    // Get current balance for the transaction date
    const currentBalance = await moneyTransferJsonRepository.getCurrentBalance(transaction.date)

    console.log(
      `[POST /api/money-transfer/transactions/[id]/complete] Balance check:`,
      `Required: ${transaction.amount}, Available: ${currentBalance.bankAccount}`
    )

    // Check balance sufficiency
    if (currentBalance.bankAccount < transaction.amount) {
      throw createError({
        statusCode: 400,
        message: `Insufficient balance. Current: ${currentBalance.bankAccount}, Required: ${transaction.amount}`,
      })
    }

    // Calculate new balance impacts
    let balanceAfterBankAccount = currentBalance.bankAccount
    let balanceAfterTransferCash = currentBalance.transferCash
    let balanceAfterServiceFeeCash = currentBalance.serviceFeeCash
    let balanceAfterServiceFeeTransfer = currentBalance.serviceFeeTransfer

    if (transaction.transactionType === 'owner_deposit') {
      // Owner deposits — owner adds money to bank account
      balanceAfterBankAccount = currentBalance.bankAccount + transaction.amount
    } else if (transaction.transactionType === 'withdrawal') {
      // Withdrawal — customer sends to owner's bank, owner pays out cash
      balanceAfterBankAccount = currentBalance.bankAccount + transaction.amount
      balanceAfterTransferCash = currentBalance.transferCash - transaction.amount

      // Commission handling
      // transfer commission = customer also transfers commission via bank → add to bankAccount
      if (transaction.commission && transaction.commission > 0) {
        if (transaction.commissionType === 'cash') {
          balanceAfterServiceFeeCash = currentBalance.serviceFeeCash + transaction.commission
        } else if (transaction.commissionType === 'transfer') {
          balanceAfterBankAccount += transaction.commission
          balanceAfterServiceFeeTransfer = currentBalance.serviceFeeTransfer + transaction.commission
        }
      }
    } else {
      // Transfer — customer gives cash, owner transfers from bank
      balanceAfterBankAccount = currentBalance.bankAccount - transaction.amount
      balanceAfterTransferCash = currentBalance.transferCash + transaction.amount

      // Commission handling
      if (transaction.commission && transaction.commission > 0) {
        if (transaction.commissionType === 'cash') {
          balanceAfterServiceFeeCash = currentBalance.serviceFeeCash + transaction.commission
        } else if (transaction.commissionType === 'transfer') {
          balanceAfterServiceFeeTransfer = currentBalance.serviceFeeTransfer + transaction.commission
        }
      }
    }

    // Update transaction with new balance impacts and completed status
    const completedTransaction = await moneyTransferJsonRepository.updateTransaction(id, {
      status: 'completed',
      completedAt: new Date().toISOString(),
      balanceImpact: {
        bankAccountBefore: Number(currentBalance.bankAccount),
        bankAccountAfter: Number(balanceAfterBankAccount),
        transferCashBefore: Number(currentBalance.transferCash),
        transferCashAfter: Number(balanceAfterTransferCash),
        serviceFeeBeforeCash: Number(currentBalance.serviceFeeCash),
        serviceFeeAfterCash: Number(balanceAfterServiceFeeCash),
        serviceFeeBeforeTransfer: Number(currentBalance.serviceFeeTransfer),
        serviceFeeAfterTransfer: Number(balanceAfterServiceFeeTransfer),
      },
    })

    console.log(
      `[POST /api/money-transfer/transactions/[id]/complete] Updated transaction ${id} to completed`
    )

    // Update balance
    await moneyTransferJsonRepository.updateBalance(transaction.date, {
      bankAccount: balanceAfterBankAccount,
      transferCash: balanceAfterTransferCash,
      serviceFeeCash: balanceAfterServiceFeeCash,
      serviceFeeTransfer: balanceAfterServiceFeeTransfer,
    })

    console.log(
      `[POST /api/money-transfer/transactions/[id]/complete] Updated balance for ${transaction.date}`
    )

    // Update daily summary with new transaction counts
    const summary = await moneyTransferJsonRepository.getDailySummary(transaction.date)

    if (summary) {
      const transactions = await moneyTransferJsonRepository.getTransactionsByDate(transaction.date)
      const completed = transactions.filter(t => t.status === 'completed')

      await moneyTransferJsonRepository.updateDailySummary(transaction.date, {
        step1: {
          ...summary.step1,
          totalTransactions: transactions.length,
          completedTransactions: completed.length,
          draftTransactions: transactions.filter(t => t.status === 'draft').length,
          totalAmount: completed.reduce((sum, t) => sum + t.amount, 0),
          totalCommission: completed.reduce((sum, t) => sum + (t.commission || 0), 0),
        },
      })

      console.log(
        `[POST /api/money-transfer/transactions/[id]/complete] Updated daily summary for ${transaction.date}`
      )
    }

    setResponseStatus(event, 200)
    return {
      success: true,
      data: completedTransaction,
      message: 'Draft transaction completed successfully',
    }
  } catch (error: any) {
    console.error('[POST /api/money-transfer/transactions/[id]/complete] Error:', error)

    if (error.statusCode) {
      throw error
    }

    console.error(
      '[POST /api/money-transfer/transactions/[id]/complete] Unexpected error:',
      error.message
    )
    throw createError({
      statusCode: 500,
      message: `Failed to complete draft transaction: ${error.message}`,
    })
  }
})
