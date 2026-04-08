import type { BillPaymentWorkflowStatus } from '~/types/bill-payment'

/**
 * Shared formatting, validation, and navigation helpers for the bill payment service.
 * All helpers are pure functions — safe to unit-test without mounting a component.
 */
export function useBillPaymentHelpers() {
  // ─── Formatters ──────────────────────────────────────────────────────────

  function formatAmount(amount: number): string {
    return (
      new Intl.NumberFormat('th-TH', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount) + ' ฿'
    )
  }

  function formatTime(datetime: string | Date): string {
    return new Date(datetime).toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function formatDatetime(datetime: string | Date): string {
    const d = new Date(datetime)
    const date = d.toLocaleDateString('th-TH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
    const time = d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    return `${date} ${time}`
  }

  function formatBillType(type?: string): string {
    const map: Record<string, string> = {
      utility: 'สาธารณูปโภค',
      telecom: 'โทรคมนาคม',
      insurance: 'ประกันภัย',
      other: 'อื่นๆ',
    }
    return type ? (map[type] ?? type) : '-'
  }

  function formatTransactionType(type: string): string {
    const map: Record<string, string> = {
      bill_payment: 'รับชำระบิล',
      owner_deposit: 'ฝากเงิน',
    }
    return map[type] ?? type
  }

  /**
   * Returns the workflow status Thai label and a Tailwind color class.
   */
  function formatWorkflowStatus(status: BillPaymentWorkflowStatus): {
    label: string
    colorClass: string
  } {
    const map: Record<BillPaymentWorkflowStatus, { label: string; colorClass: string }> = {
      step1_in_progress: { label: 'กำลังบันทึก', colorClass: 'text-yellow-600' },
      step2_completed: { label: 'รอตรวจสอบ', colorClass: 'text-blue-600' },
      step2_completed_with_notes: { label: 'รอตรวจสอบ (มีหมายเหตุ)', colorClass: 'text-blue-500' },
      audited: { label: 'ตรวจสอบแล้ว', colorClass: 'text-indigo-600' },
      audited_with_issues: { label: 'ตรวจสอบแล้ว (มีปัญหา)', colorClass: 'text-orange-600' },
      approved: { label: 'อนุมัติแล้ว', colorClass: 'text-green-600' },
      approved_with_notes: { label: 'อนุมัติแล้ว (มีหมายเหตุ)', colorClass: 'text-green-500' },
      needs_correction: { label: 'ส่งกลับแก้ไข', colorClass: 'text-red-600' },
    }
    return map[status] ?? { label: status, colorClass: 'text-gray-600' }
  }

  function getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      success: 'สำเร็จ',
      failed: 'ล้มเหลว',
    }
    return map[status] ?? status
  }

  function getStatusBadgeVariant(status: string): 'success' | 'error' | 'default' {
    if (status === 'success') return 'success'
    if (status === 'failed') return 'error'
    return 'default'
  }

  /**
   * Format a numeric diff for display in cash verification tables.
   * Returns '✅ ตรงกัน' for zero, '+X ฿' / '-X ฿' for non-zero, '-' for null.
   */
  function formatDiff(diff: number | null): string {
    if (diff === null) return '-'
    if (diff === 0) return '✅ ตรงกัน'
    return (diff > 0 ? '+' : '') + formatAmount(diff)
  }

  // ─── Validators ──────────────────────────────────────────────────────────

  interface TransactionForm {
    transactionType: 'bill_payment' | 'owner_deposit' | ''
    billType?: string
    amount: number | ''
    commission: number | ''
    status: 'success' | 'failed' | ''
    customerName?: string
    notes?: string
  }

  function validateTransactionForm(form: TransactionForm): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!form.transactionType) {
      errors.push('กรุณาเลือกประเภทรายการ')
    }

    if (form.transactionType === 'bill_payment' && !form.billType) {
      errors.push('กรุณาเลือกประเภทบิล')
    }

    if (form.amount === '' || form.amount === undefined) {
      errors.push('กรุณากรอกจำนวนเงิน')
    } else if (Number(form.amount) <= 0) {
      errors.push('จำนวนเงินต้องมากกว่า 0')
    }

    if (form.transactionType === 'bill_payment') {
      if (form.commission === '' || form.commission === undefined) {
        errors.push('กรุณากรอกค่าธรรมเนียม')
      } else if (Number(form.commission) < 0) {
        errors.push('ค่าธรรมเนียมต้องไม่ติดลบ')
      }
    }

    if (!form.status) {
      errors.push('กรุณาเลือกสถานะรายการ')
    }

    return { valid: errors.length === 0, errors }
  }

  // ─── Computed helpers ────────────────────────────────────────────────────

  interface TxnForCash {
    transactionType: 'bill_payment' | 'owner_deposit'
    amount: number
    commission: number
    status: 'success' | 'failed'
  }

  /**
   * Calculate expected cash balances from a list of transactions.
   * bill_payment (success): billPaymentCash += amount, serviceFeeCash += commission
   * owner_deposit (success): no effect on cash balances tracked here
   * failed: no balance change
   */
  function calculateExpectedCash(transactions: TxnForCash[]): {
    billPaymentCash: number
    serviceFeeCash: number
  } {
    let billPaymentCash = 0
    let serviceFeeCash = 0
    for (const txn of transactions) {
      if (txn.status !== 'success') continue
      if (txn.transactionType === 'bill_payment') {
        billPaymentCash += txn.amount
        serviceFeeCash += txn.commission
      }
    }
    return { billPaymentCash, serviceFeeCash }
  }

  /**
   * Returns diff = expected - actual (positive means system has more than counted).
   */
  function diffExpectedVsActual(
    expected: number,
    actual: number,
  ): { diff: number; hasDiscrepancy: boolean } {
    const diff = expected - actual
    return { diff, hasDiscrepancy: diff !== 0 }
  }

  // ─── Smart Navigation helper ─────────────────────────────────────────────

  type Role = 'manager' | 'assistant_manager' | 'auditor' | 'owner'
  type SmartActionVariant = 'primary' | 'secondary' | 'outline'

  interface SmartActionButton {
    label: string
    route: string
    variant: SmartActionVariant
  }

  /**
   * Returns the correct action button (label, route, variant) for the History Page
   * based on the current user's role and the daily record's workflowStatus.
   * Mirrors the WF 3.0 table in WORKFLOWS.md.
   *
   * @param date - 'YYYY-MM-DD' — appended as query param to the route
   */
  function getSmartActionButton(
    role: Role,
    workflowStatus: BillPaymentWorkflowStatus,
    date: string,
  ): SmartActionButton {
    const serviceRoute = `/finance/bill-payment-service?date=${date}`
    const auditorRoute = `/finance/bill-payment-service/auditor-review?date=${date}`
    const ownerRoute = `/finance/bill-payment-service/owner-approval?date=${date}`

    if (role === 'manager' || role === 'assistant_manager') {
      if (workflowStatus === 'step1_in_progress') {
        return { label: 'ทำงาน', route: serviceRoute, variant: 'primary' }
      }
      if (workflowStatus === 'needs_correction') {
        return { label: 'แก้ไข', route: serviceRoute, variant: 'secondary' }
      }
      // step2_completed / step2_completed_with_notes / audited / audited_with_issues / approved / approved_with_notes
      return { label: 'ดูรายละเอียด', route: serviceRoute, variant: 'outline' }
    }

    if (role === 'auditor') {
      if (workflowStatus === 'step2_completed' || workflowStatus === 'step2_completed_with_notes') {
        return { label: 'ตรวจสอบ', route: auditorRoute, variant: 'primary' }
      }
      if (workflowStatus === 'audited' || workflowStatus === 'audited_with_issues') {
        return { label: 'ดูการตรวจสอบ', route: auditorRoute, variant: 'outline' }
      }
      // step1_* / needs_correction / approved*
      return { label: 'ดูรายละเอียด', route: serviceRoute, variant: 'outline' }
    }

    // role === 'owner'
    if (workflowStatus === 'audited' || workflowStatus === 'audited_with_issues') {
      return { label: 'อนุมัติ', route: ownerRoute, variant: 'primary' }
    }
    if (workflowStatus === 'approved' || workflowStatus === 'approved_with_notes') {
      return { label: 'ดูรายละเอียด', route: ownerRoute, variant: 'outline' }
    }
    // step1_* / step2_* / needs_correction
    return { label: 'ดูรายละเอียด', route: serviceRoute, variant: 'outline' }
  }

  return {
    // formatters
    formatAmount,
    formatTime,
    formatDatetime,
    formatBillType,
    formatTransactionType,
    formatWorkflowStatus,
    getStatusLabel,
    getStatusBadgeVariant,
    formatDiff,
    // validators
    validateTransactionForm,
    // computed helpers
    calculateExpectedCash,
    diffExpectedVsActual,
    // navigation
    getSmartActionButton,
  }
}
