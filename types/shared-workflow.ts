/**
 * Shared Workflow Types
 *
 * Unified types for the multi-step workflow used by both
 * Money Transfer and Bill Payment services.
 *
 * Workflow steps:
 *   Step 1: Manager recording transactions
 *   Step 2: Manager cash verification
 *   Audit:  Auditor review
 *   Approval: Owner approval
 *
 * @see docs/PROGRESS/SERVICE_HARMONIZATION_PLAN.md (sections 7, 9)
 */

// ---------------------------------------------------------------------------
// Workflow Status
// ---------------------------------------------------------------------------

/** Unified workflow status shared across Money Transfer & Bill Payment */
export type UnifiedWorkflowStatus =
  | 'step1_in_progress'
  | 'step1_completed'
  | 'step2_completed'
  | 'step2_completed_with_notes'
  | 'audited'
  | 'audited_with_issues'
  | 'approved'
  | 'approved_with_notes'
  | 'needs_correction'

// ---------------------------------------------------------------------------
// Transaction Status
// ---------------------------------------------------------------------------

/** Unified transaction status shared across Money Transfer & Bill Payment */
export type UnifiedTransactionStatus = 'completed' | 'draft' | 'on_hold' | 'cancelled'

// ---------------------------------------------------------------------------
// Status Config Types
// ---------------------------------------------------------------------------

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'default'

export interface WorkflowStatusConfig {
  label: string
  colorClass: string
  badgeVariant: BadgeVariant
}

export interface TransactionStatusConfig {
  label: string
  badgeVariant: BadgeVariant
}

// ---------------------------------------------------------------------------
// Workflow Status Map
// ---------------------------------------------------------------------------

export const WORKFLOW_STATUS_MAP: Record<UnifiedWorkflowStatus, WorkflowStatusConfig> = {
  step1_in_progress: {
    label: 'กำลังบันทึก',
    colorClass: 'text-yellow-600',
    badgeVariant: 'warning',
  },
  step1_completed: {
    label: 'รอตรวจนับ',
    colorClass: 'text-blue-600',
    badgeVariant: 'info',
  },
  step2_completed: {
    label: 'รอตรวจสอบ',
    colorClass: 'text-blue-600',
    badgeVariant: 'info',
  },
  step2_completed_with_notes: {
    label: 'รอตรวจสอบ (มีหมายเหตุ)',
    colorClass: 'text-blue-600',
    badgeVariant: 'info',
  },
  audited: {
    label: 'ตรวจสอบแล้ว',
    colorClass: 'text-indigo-600',
    badgeVariant: 'info',
  },
  audited_with_issues: {
    label: 'ตรวจสอบแล้ว (มีปัญหา)',
    colorClass: 'text-orange-600',
    badgeVariant: 'warning',
  },
  approved: {
    label: 'อนุมัติแล้ว',
    colorClass: 'text-green-600',
    badgeVariant: 'success',
  },
  approved_with_notes: {
    label: 'อนุมัติแล้ว (มีหมายเหตุ)',
    colorClass: 'text-green-600',
    badgeVariant: 'success',
  },
  needs_correction: {
    label: 'ส่งกลับแก้ไข',
    colorClass: 'text-red-600',
    badgeVariant: 'error',
  },
}

// ---------------------------------------------------------------------------
// Workflow Status Badge CSS Classes (for History pages)
// ---------------------------------------------------------------------------

/** Tailwind CSS classes for workflow status badges */
export const WORKFLOW_STATUS_BADGE_CLASSES: Record<UnifiedWorkflowStatus, string> = {
  step1_in_progress: 'bg-yellow-100 text-yellow-800',
  step1_completed: 'bg-blue-100 text-blue-800',
  step2_completed: 'bg-blue-100 text-blue-800',
  step2_completed_with_notes: 'bg-blue-100 text-blue-800',
  audited: 'bg-indigo-100 text-indigo-800',
  audited_with_issues: 'bg-orange-100 text-orange-800',
  approved: 'bg-green-100 text-green-800',
  approved_with_notes: 'bg-green-100 text-green-800',
  needs_correction: 'bg-red-100 text-red-800',
}

/** Get label + badge CSS class for a workflow status */
export function getWorkflowStatusBadge(status: string): { label: string; cssClass: string } {
  const s = status as UnifiedWorkflowStatus
  const config = WORKFLOW_STATUS_MAP[s]
  const cssClass = WORKFLOW_STATUS_BADGE_CLASSES[s]
  if (config && cssClass) {
    return { label: config.label, cssClass }
  }
  return { label: status, cssClass: 'bg-gray-100 text-gray-700' }
}

// ---------------------------------------------------------------------------
// Transaction Status Map
// ---------------------------------------------------------------------------

export const TRANSACTION_STATUS_MAP: Record<UnifiedTransactionStatus, TransactionStatusConfig> = {
  completed: {
    label: 'สำเร็จ',
    badgeVariant: 'success',
  },
  draft: {
    label: 'รอดำเนินการ',
    badgeVariant: 'warning',
  },
  on_hold: {
    label: 'พักรายการ',
    badgeVariant: 'error',
  },
  cancelled: {
    label: 'ยกเลิก',
    badgeVariant: 'default',
  },
}

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

/** Get workflow status display config (returns default config for unknown status) */
export function getWorkflowStatusConfig(status: UnifiedWorkflowStatus): WorkflowStatusConfig {
  return WORKFLOW_STATUS_MAP[status] ?? {
    label: status,
    colorClass: 'text-gray-600',
    badgeVariant: 'default' as BadgeVariant,
  }
}

/** Get transaction status display config (returns default config for unknown status) */
export function getTransactionStatusConfig(status: UnifiedTransactionStatus): TransactionStatusConfig {
  return TRANSACTION_STATUS_MAP[status] ?? {
    label: status,
    badgeVariant: 'default' as BadgeVariant,
  }
}

/**
 * Format a numeric difference for display.
 * - null  → '-'
 * - 0     → '✅ ตรงกัน'
 * - other → signed number with formatCurrency (e.g. '+1,234.00' / '-500.00')
 */
export function formatDiff(diff: number | null, formatCurrency: (n: number) => string): string {
  if (diff === null) return '-'
  if (diff === 0) return '✅ ตรงกัน'
  return (diff > 0 ? '+' : '') + formatCurrency(diff)
}
