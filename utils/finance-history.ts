/**
 * History page rules shared by Money Transfer and Bill Payment:
 * which statuses each Pending Inbox card counts, and the action button per role.
 * Owner decision (5 Nov 2026): the BP rules are the standard for both services.
 */
import type { UnifiedWorkflowStatus } from '~/types/shared-workflow'

export type HistoryInbox = 'manager' | 'auditor' | 'owner'

/** Statuses waiting on each role. needs_correction is Manager work (Step 2 is cleared on send-back). */
export const HISTORY_INBOX_STATUSES: Record<HistoryInbox, UnifiedWorkflowStatus[]> = {
  manager: ['step1_in_progress', 'step1_completed', 'needs_correction'],
  auditor: ['step2_completed', 'step2_completed_with_notes'],
  owner: ['audited', 'audited_with_issues'],
}

export function countInbox(summaries: { workflowStatus: string }[], inbox: HistoryInbox): number {
  const allowed: string[] = HISTORY_INBOX_STATUSES[inbox]
  return summaries.filter(s => allowed.includes(s.workflowStatus)).length
}

export type HistoryRole = 'manager' | 'assistant_manager' | 'auditor' | 'owner'
export type HistoryActionVariant = 'primary' | 'secondary' | 'outline'

export interface HistoryActionButton {
  label: string
  route: string
  variant: HistoryActionVariant
}

/**
 * The action button on a History Page row, by role and workflowStatus.
 * Mirrors the WF 3.0 table in WORKFLOWS.md.
 *
 * @param serviceRoute - the service page for that date, e.g. `/finance/bill-payment-service?date=2026-11-05`
 */
export function getHistoryActionButton(
  role: HistoryRole,
  workflowStatus: UnifiedWorkflowStatus,
  serviceRoute: string,
): HistoryActionButton {
  if (role === 'manager' || role === 'assistant_manager') {
    if (workflowStatus === 'step1_in_progress') {
      return { label: 'ทำงาน', route: serviceRoute, variant: 'primary' }
    }
    if (workflowStatus === 'step1_completed') {
      return { label: 'ตรวจนับเงิน', route: serviceRoute, variant: 'primary' }
    }
    if (workflowStatus === 'needs_correction') {
      return { label: 'แก้ไข', route: serviceRoute, variant: 'secondary' }
    }
    return { label: 'ดูรายละเอียด', route: serviceRoute, variant: 'outline' }
  }

  if (role === 'auditor') {
    if (workflowStatus === 'step2_completed' || workflowStatus === 'step2_completed_with_notes') {
      return { label: 'ตรวจสอบ', route: serviceRoute, variant: 'primary' }
    }
    if (workflowStatus === 'audited' || workflowStatus === 'audited_with_issues') {
      return { label: 'ดูการตรวจสอบ', route: serviceRoute, variant: 'outline' }
    }
    // needs_correction is back with Manager — nothing for Auditor to do yet
    return { label: 'ดูรายละเอียด', route: serviceRoute, variant: 'outline' }
  }

  // role === 'owner'
  if (workflowStatus === 'audited' || workflowStatus === 'audited_with_issues') {
    return { label: 'อนุมัติ', route: serviceRoute, variant: 'primary' }
  }
  return { label: 'ดูรายละเอียด', route: serviceRoute, variant: 'outline' }
}
