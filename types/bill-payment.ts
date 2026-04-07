export type BillPaymentWorkflowStatus =
  | 'step1_in_progress'
  | 'step2_completed'
  | 'step2_completed_with_notes'
  | 'audited'
  | 'audited_with_issues'
  | 'approved'
  | 'approved_with_notes'
  | 'needs_correction'

export interface BillPaymentTransaction {
  id: string
  date: string
  timestamp: string
  transactionType: 'bill_payment' | 'owner_deposit'
  billType?: 'utility' | 'telecom' | 'insurance' | 'other'
  amount: number
  commission: number
  customerName?: string
  status: 'success' | 'failed'
  notes?: string
  recordedBy: string
  recordedAt: string
}

export interface BillPaymentBalanceHistory {
  transactionId: string
  transactionType: string
  amount: number
  commission: number
  bankAccountBefore: number
  bankAccountAfter: number
  billPaymentCashBefore: number
  billPaymentCashAfter: number
  serviceFeeCashBefore: number
  serviceFeeCashAfter: number
  recordedAt: string
}

export interface BillPaymentBalance {
  id: string
  date: string
  bankAccount: number
  billPaymentCash: number
  serviceFeeCash: number
  openingBalance?: number
  openingBalanceSetAt?: string
  openingBalanceSource?: 'manual' | 'carryover'
  openingBalanceSetBy?: string
  history: BillPaymentBalanceHistory[]
  updatedAt: string
}

export interface BillPaymentDailySummary {
  id: string
  date: string
  workflowStatus: BillPaymentWorkflowStatus

  step1CompletedAt?: string
  step1CompletedBy?: string
  step1CompletedByName?: string
  step1TotalTransactions?: number
  step1SuccessTransactions?: number
  step1FailedTransactions?: number
  step1TotalAmount?: number
  step1TotalCommission?: number

  step2CompletedAt?: string
  step2CompletedBy?: string
  step2CompletedByName?: string
  step2ExpectedBillPaymentCash?: number
  step2ActualBillPaymentCash?: number
  step2ExpectedServiceFeeCash?: number
  step2ActualServiceFeeCash?: number
  step2HasDiscrepancies?: boolean
  step2VerificationNotes?: string

  auditedAt?: string
  auditedBy?: string
  auditedByName?: string
  auditBankStatementAmount?: number
  auditBankBalanceMatches?: boolean
  auditFindings?: string
  auditTransactionsVerified?: number
  auditTransactionsWithIssues?: number

  approvedAt?: string
  approvedBy?: string
  approvedByName?: string
  approvalNotes?: string

  needsCorrectionFrom?: BillPaymentWorkflowStatus
  correctionNotes?: string
  correctionRequestedAt?: string
  correctionRequestedBy?: string

  createdAt: string
  updatedAt: string
}
