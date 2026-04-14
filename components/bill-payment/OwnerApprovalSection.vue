<script setup lang="ts">
import { useBillPaymentStore } from '~/stores/bill-payment'
import { useLogger } from '~/composables/useLogger'
import { useBillPaymentHelpers } from '~/composables/useBillPaymentHelpers'
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/vue/24/outline'

const props = defineProps<{
  date: string
}>()

const emit = defineEmits<{
  'approval-submitted': [decision: 'approved' | 'approved_with_notes' | 'needs_correction']
}>()

const logger = useLogger('BPOwnerApprovalSection')
const store = useBillPaymentStore()
const {
  formatAmount,
  formatTime,
  formatDatetime,
  formatBillType,
  formatTransactionType,
  getStatusLabel,
  getStatusBadgeVariant,
  formatWorkflowStatus,
  formatDiff,
} = useBillPaymentHelpers()

// ─── Alerts ───────────────────────────────────────────────────────────────────
const successMessage = ref('')
const errorMessage = ref('')

// ─── Workflow state ───────────────────────────────────────────────────────────
const workflowStatus = computed(() => store.getCurrentWorkflowStatus)
const isAuditedWithIssues = computed(() => workflowStatus.value === 'audited_with_issues')
const isAlreadyApproved = computed(() => store.isApproved)
const canSubmitApproval = computed(() => store.isAudited && !isAlreadyApproved.value)

// ─── Transactions ─────────────────────────────────────────────────────────────
const dateTransactions = computed(() => store.getTransactionsByDate(props.date))
const billPaymentTransactions = computed(() =>
  dateTransactions.value.filter((t: any) => t.transactionType === 'bill_payment')
)

// ─── Decision form ────────────────────────────────────────────────────────────
type Decision = 'approved' | 'approved_with_notes' | 'needs_correction'
const decisionCard = ref<Decision | null>(null)
const isSubmitting = ref(false)

// ─── Summary diffs ────────────────────────────────────────────────────────────
const step2BillPaymentDiff = computed(() => {
  const expected = store.currentSummary?.step2ExpectedBillPaymentCash ?? 0
  const actual = store.currentSummary?.step2ActualBillPaymentCash ?? 0
  return expected - actual
})

const step2ServiceFeeDiff = computed(() => {
  const expected = store.currentSummary?.step2ExpectedServiceFeeCash ?? 0
  const actual = store.currentSummary?.step2ActualServiceFeeCash ?? 0
  return expected - actual
})

// ─── WorkflowStepSummaryCard data ─────────────────────────────────────────────
const step1SummaryItems = computed(() => [
  {
    label: 'ยอดรับชำระทั้งหมด',
    value: formatAmount(store.currentSummary?.step1TotalAmount ?? 0),
    colorClass: 'bg-blue-50',
  },
  {
    label: 'ค่าธรรมเนียมสะสม',
    value: formatAmount(store.currentSummary?.step1TotalCommission ?? 0),
    colorClass: 'bg-green-50',
  },
  {
    label: 'รายการล้มเหลว',
    value: `${store.currentSummary?.step1FailedTransactions ?? 0} รายการ`,
    colorClass: (store.currentSummary?.step1FailedTransactions ?? 0) > 0 ? 'bg-red-50' : 'bg-gray-50',
  },
])

const step2Badge = computed(() => {
  if (!store.isStep2Complete) return undefined
  return store.currentSummary?.step2HasDiscrepancies
    ? { label: 'มีส่วนต่าง ⚠️', variant: 'warning' as const }
    : { label: 'ตรงกัน ✅', variant: 'success' as const }
})

const step2SummaryItems = computed(() => [
  {
    label: 'คาดหวังเงินสด (บิล)',
    value: formatAmount(store.currentSummary?.step2ExpectedBillPaymentCash ?? 0),
    colorClass: 'bg-gray-50',
  },
  {
    label: 'นับจริง (บิล)',
    value: formatAmount(store.currentSummary?.step2ActualBillPaymentCash ?? 0),
    colorClass: 'bg-gray-50',
  },
  {
    label: 'ส่วนต่าง (บิล)',
    value: formatDiff(step2BillPaymentDiff.value),
    colorClass: step2BillPaymentDiff.value === 0 ? 'bg-green-50' : 'bg-yellow-50',
  },
  {
    label: 'คาดหวังค่าธรรมเนียม',
    value: formatAmount(store.currentSummary?.step2ExpectedServiceFeeCash ?? 0),
    colorClass: 'bg-gray-50',
  },
  {
    label: 'นับจริง (ค่าธรรมเนียม)',
    value: formatAmount(store.currentSummary?.step2ActualServiceFeeCash ?? 0),
    colorClass: 'bg-gray-50',
  },
  {
    label: 'ส่วนต่าง (ค่าธรรมเนียม)',
    value: formatDiff(step2ServiceFeeDiff.value),
    colorClass: step2ServiceFeeDiff.value === 0 ? 'bg-green-50' : 'bg-yellow-50',
  },
])

const auditBadge = computed(() => {
  if (!store.isAudited) return { label: 'ยังไม่ตรวจสอบ', variant: 'info' as const }
  return isAuditedWithIssues.value
    ? { label: 'พบปัญหา ⚠️', variant: 'warning' as const }
    : { label: 'ผ่านการตรวจสอบ ✅', variant: 'success' as const }
})

const auditSummaryItems = computed(() => [
  {
    label: 'ตรวจสอบโดย',
    value: store.currentSummary?.auditedByName ?? '-',
    colorClass: 'bg-indigo-50',
  },
  {
    label: 'Bank Statement',
    value: formatAmount(store.currentSummary?.auditBankStatementAmount ?? 0),
    colorClass: 'bg-blue-50',
  },
  {
    label: 'รายการที่ตรวจ',
    value: `${store.currentSummary?.auditTransactionsVerified ?? 0} รายการ`,
    colorClass: 'bg-gray-50',
  },
  {
    label: 'รายการที่มีปัญหา',
    value: `${store.currentSummary?.auditTransactionsWithIssues ?? 0} รายการ`,
    colorClass: (store.currentSummary?.auditTransactionsWithIssues ?? 0) > 0 ? 'bg-orange-50' : 'bg-gray-50',
  },
])

// ─── Submit ───────────────────────────────────────────────────────────────────
async function handleDecisionSubmit(decisionValue: Decision, notes: string) {
  isSubmitting.value = true
  errorMessage.value = ''
  try {
    await store.submitOwnerApproval(props.date, {
      decision: decisionValue,
      approvalNotes: notes || undefined,
    })
    const labels: Record<Decision, string> = {
      approved: 'อนุมัติเรียบร้อยแล้ว ✅',
      approved_with_notes: 'อนุมัติพร้อมหมายเหตุเรียบร้อยแล้ว ✅',
      needs_correction: 'ส่งกลับให้ Auditor แก้ไขแล้ว',
    }
    successMessage.value = labels[decisionValue]
    decisionCard.value = null
    logger.log(`Owner approval submitted: ${decisionValue} for ${props.date}`)
    emit('approval-submitted', decisionValue)
  } catch (err: any) {
    errorMessage.value = err.message ?? 'เกิดข้อผิดพลาด'
    logger.error('handleDecisionSubmit', err)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div>
    <!-- ── Alerts ──────────────────────────────────────────────────────────── -->
    <BaseAlert
      v-if="successMessage"
      variant="success"
      :message="successMessage"
      :auto-close="true"
      class="mb-4"
      @close="successMessage = ''"
    />
    <BaseAlert
      v-if="errorMessage"
      variant="error"
      :message="errorMessage"
      class="mb-4"
      @close="errorMessage = ''"
    />

    <!-- ── Not Ready Banner ────────────────────────────────────────────────── -->
    <BaseAlert
      v-if="!store.isAudited"
      variant="warning"
      message="รายการยังไม่ผ่านการตรวจสอบจาก Auditor — ยังไม่สามารถอนุมัติได้"
      class="mb-4"
    />

    <!-- ── Already Approved Banner ─────────────────────────────────────────── -->
    <div
      v-if="isAlreadyApproved"
      class="rounded-xl border border-green-200 bg-green-50 p-6 mb-6 flex items-start gap-4"
    >
      <CheckCircleIcon class="w-8 h-8 text-green-600 shrink-0 mt-0.5" />
      <div>
        <p class="font-semibold text-green-800 text-lg">อนุมัติแล้ว ✅</p>
        <p class="text-sm text-green-700 mt-1">
          วันที่ {{ date }} — ได้รับการอนุมัติโดย
          {{ store.currentSummary?.approvedByName ?? 'Owner' }}
          <template v-if="store.currentSummary?.approvedAt">
            · {{ formatDatetime(store.currentSummary.approvedAt) }}
          </template>
        </p>
        <p v-if="store.currentSummary?.approvalNotes" class="text-sm text-green-700 mt-1">
          หมายเหตุ: {{ store.currentSummary.approvalNotes }}
        </p>
        <BaseBadge
          :variant="workflowStatus === 'approved_with_notes' ? 'default' : 'success'"
          size="sm"
          class="mt-2"
        >
          {{ formatWorkflowStatus(workflowStatus as any).label }}
        </BaseBadge>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════════
         STEP 1 Summary
    ════════════════════════════════════════════════════════════════════════════ -->
    <WorkflowStepSummaryCard
      :step-number="1"
      title="Manager บันทึกรายการ"
      :summary-items="step1SummaryItems"
      class="mb-4"
    >
      <template #header-right>
        <span class="text-sm text-gray-500">
          {{ store.currentSummary?.step1TotalTransactions ?? 0 }} รายการ
          · {{ store.currentSummary?.step1SuccessTransactions ?? 0 }} สำเร็จ
        </span>
      </template>
      <EmptyState v-if="billPaymentTransactions.length === 0" title="ไม่มีรายการ" />
      <table v-else class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-200 text-gray-500 text-xs">
            <th class="py-2 text-left font-medium">#</th>
            <th class="py-2 text-left font-medium">เวลา</th>
            <th class="py-2 text-left font-medium">ประเภทบิล</th>
            <th class="py-2 text-right font-medium">ยอด</th>
            <th class="py-2 text-right font-medium">ค่าธรรมเนียม</th>
            <th class="py-2 text-center font-medium">สถานะ</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(txn, idx) in billPaymentTransactions"
            :key="txn.id"
            class="border-b border-gray-100 last:border-0"
          >
            <td class="py-2 text-gray-400">{{ Number(idx) + 1 }}</td>
            <td class="py-2 text-gray-600">{{ formatTime(txn.timestamp) }}</td>
            <td class="py-2 text-gray-800">{{ formatBillType(txn.billType) }}</td>
            <td class="py-2 text-right font-medium text-gray-900">{{ formatAmount(txn.amount) }}</td>
            <td class="py-2 text-right text-green-700">{{ formatAmount(txn.commission) }}</td>
            <td class="py-2 text-center">
              <BaseBadge :variant="getStatusBadgeVariant(txn.status)" size="sm">
                {{ getStatusLabel(txn.status) }}
              </BaseBadge>
            </td>
          </tr>
        </tbody>
      </table>
    </WorkflowStepSummaryCard>

    <!-- ═══════════════════════════════════════════════════════════════════════
         STEP 2 Summary
    ════════════════════════════════════════════════════════════════════════════ -->
    <WorkflowStepSummaryCard
      :step-number="2"
      title="Manager ตรวจนับเงิน"
      :badge="step2Badge"
      :summary-items="step2SummaryItems"
      class="mb-4"
    >
      <div v-if="store.currentSummary?.step2VerificationNotes" class="bg-gray-50 rounded-lg p-3">
        <p class="text-xs text-gray-500 mb-1">หมายเหตุ</p>
        <p class="text-gray-700 whitespace-pre-wrap">{{ store.currentSummary.step2VerificationNotes }}</p>
      </div>
    </WorkflowStepSummaryCard>

    <!-- ═══════════════════════════════════════════════════════════════════════
         Auditor Findings Summary
    ════════════════════════════════════════════════════════════════════════════ -->
    <WorkflowStepSummaryCard
      :step-number="3"
      title="ผลการตรวจสอบ Auditor"
      :badge="auditBadge"
      :summary-items="auditSummaryItems"
      class="mb-4"
    >
      <div class="space-y-3 text-sm">
        <div class="bg-gray-50 rounded-lg p-3 space-y-2">
          <div v-if="store.currentSummary?.auditedAt" class="flex justify-between">
            <span class="text-gray-500">เวลาตรวจสอบ</span>
            <span class="text-gray-700">{{ formatDatetime(store.currentSummary.auditedAt) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">Bank Statement ตรงกัน</span>
            <BaseBadge :variant="store.currentSummary?.auditBankBalanceMatches ? 'success' : 'warning'" size="sm">
              {{ store.currentSummary?.auditBankBalanceMatches ? '✅ ตรงกัน' : '⚠️ ไม่ตรงกัน' }}
            </BaseBadge>
          </div>
        </div>
        <div v-if="store.currentSummary?.auditFindings" class="bg-orange-50 rounded-lg p-3">
          <p class="text-xs text-orange-600 mb-1 font-medium">ปัญหาที่พบ</p>
          <p class="text-gray-700 whitespace-pre-wrap">{{ store.currentSummary.auditFindings }}</p>
        </div>
        <div v-if="store.currentSummary?.correctionNotes" class="bg-red-50 rounded-lg p-3">
          <p class="text-xs text-red-600 mb-1 font-medium">หมายเหตุการส่งกลับแก้ไข</p>
          <p class="text-gray-700 whitespace-pre-wrap">{{ store.currentSummary.correctionNotes }}</p>
        </div>
      </div>
    </WorkflowStepSummaryCard>

    <!-- ═══════════════════════════════════════════════════════════════════════
         Decision Card (only when audited and not yet approved)
    ════════════════════════════════════════════════════════════════════════════ -->
    <section v-if="canSubmitApproval" class="bg-white border border-gray-200 rounded-xl mb-4 overflow-hidden">
      <div class="flex items-center gap-3 px-6 py-4 bg-gray-50 border-b border-gray-200">
        <ExclamationTriangleIcon class="w-5 h-5 text-yellow-600" />
        <h3 class="font-semibold text-gray-900">การตัดสินใจของ Owner</h3>
      </div>
      <div class="p-4">
        <OwnerDecisionCard
          v-model="decisionCard"
          :is-submitting="isSubmitting"
          @submit="handleDecisionSubmit"
        />
      </div>
    </section>
  </div>
</template>
