import { z } from 'zod'
import { moneyTransferJsonRepository } from '~/server/repositories/money-transfer-json.repository'

/**
 * POST /api/money-transfer/summaries/[date]/approve
 *
 * Workflow 2.3: Owner final approval
 * - Owner reviews manager and auditor findings
 * - Makes final decision: approve, approve with notes, or request correction
 * - Records owner decision and notes
 * - Marks workflow as complete or returns for correction
 * - Final step in daily reconciliation workflow
 *
 * Request body:
 * {
 *   decision: 'approve' | 'approve_with_notes' | 'request_correction',
 *   ownerNotes?: string
 * }
 *
 * Response: { success: boolean, data: MoneyTransferDailySummary }
 */

const approvalSchema = z.object({
  decision: z.enum(['approve', 'approve_with_notes', 'request_correction']),
  ownerNotes: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  try {
    // Initialize repository
    await moneyTransferJsonRepository.init()

    // Get date from route params
    const date = event.context.params?.date

    if (!date) {
      throw createError({
        statusCode: 400,
        message: 'Date is required in format YYYY-MM-DD',
      })
    }

    console.log('[POST /api/money-transfer/summaries/[date]/approve] Date:', date)

    // Parse and validate request body
    const body = await readBody(event)
    const validated = approvalSchema.parse(body)

    console.log('[POST /api/money-transfer/summaries/[date]/approve] Validated data:', validated)

    // Validate owner notes requirement for non-approve decisions
    if (
      (validated.decision === 'approve_with_notes' || validated.decision === 'request_correction') &&
      (!validated.ownerNotes || validated.ownerNotes.trim().length === 0)
    ) {
      throw createError({
        statusCode: 400,
        message: 'Owner notes are required for this decision type',
      })
    }

    // Get summary
    const summary = await moneyTransferJsonRepository.getDailySummary(date)

    if (!summary) {
      throw createError({
        statusCode: 404,
        message: `No summary found for ${date}. Please complete Step 1 first.`,
      })
    }

    if (summary.step1?.status !== 'completed') {
      throw createError({
        statusCode: 400,
        message: 'Step 1 must be completed before owner approval',
      })
    }

    if (summary.step2?.status !== 'completed') {
      throw createError({
        statusCode: 400,
        message: 'Step 2 must be completed before owner approval',
      })
    }

    if (summary.auditorVerification?.status !== 'completed') {
      throw createError({
        statusCode: 400,
        message: 'Audit must be completed before owner approval',
      })
    }

    // Determine workflow status based on decision
    let workflowStatus = 'approved'
    if (validated.decision === 'request_correction') {
      workflowStatus = 'needs_correction'
    }

    console.log(
      `[POST /api/money-transfer/summaries/[date]/approve] Owner decision: ${validated.decision}`
    )

    // Update summary with owner approval data
    const updatedSummary = await moneyTransferJsonRepository.updateDailySummary(date, {
      ownerApproval: {
        status:
          validated.decision === 'approve'
            ? 'approved'
            : validated.decision === 'approve_with_notes'
              ? 'approved_with_notes'
              : 'correction_requested',
        completedAt: new Date().toISOString(),
        completedBy: 'owner', // TODO: Get from auth context
        completedByName: 'Owner', // TODO: Get from auth context
        decision: validated.decision,
        ownerNotes: validated.ownerNotes,
      },
      workflowStatus,
    })

    console.log(
      `[POST /api/money-transfer/summaries/[date]/approve] Completed owner approval for ${date}`
    )

    setResponseStatus(event, 200)
    return {
      success: true,
      data: updatedSummary,
      message:
        validated.decision === 'request_correction'
          ? 'Workflow marked for correction. Team will address the requested changes.'
          : 'Workflow approved successfully. Daily reconciliation is complete.',
      approval: {
        decision: validated.decision,
        decisionLabel:
          validated.decision === 'approve'
            ? '✅ Approved'
            : validated.decision === 'approve_with_notes'
              ? '✅ Approved with Notes'
              : '🔄 Correction Requested',
        ownerNotes: validated.ownerNotes,
        completedAt: new Date().toISOString(),
      },
    }
  } catch (error: any) {
    console.error('[POST /api/money-transfer/summaries/[date]/approve] Error:', error)

    if (error instanceof z.ZodError) {
      console.error('[POST /api/money-transfer/summaries/[date]/approve] Validation error:', error.issues)
      throw createError({
        statusCode: 400,
        message: 'Invalid input',
        data: error.issues,
      })
    }

    if (error.statusCode) {
      throw error
    }

    console.error(
      '[POST /api/money-transfer/summaries/[date]/approve] Unexpected error:',
      error.message
    )
    throw createError({
      statusCode: 500,
      message: `Failed to process owner approval: ${error.message}`,
    })
  }
})
