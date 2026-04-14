<script setup lang="ts">
import { useBillPaymentStore } from '~/stores/bill-payment'
import { useLogger } from '~/composables/useLogger'
import { useBillPaymentHelpers } from '~/composables/useBillPaymentHelpers'
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  BanknotesIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
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

// ─── Expandable sections ──────────────────────────────────────────────────────
const expandStep1 = ref(false)
const expandStep2 = ref(false)
const expandAudit = ref(false)

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
    <section class="bg-white border border-gray-200 rounded-xl mb-4 overflow-hidden">
      <div class="flex items-center gap-3 px-6 py-4 bg-gray-50 border-b border-gray-200">
        <span class="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">1</span>
        <h3 class="font-semibold text-gray-900">Step 1 — Manager บันทึกรายการ</h3>
        <span class="ml-auto text-sm text-gray-500">
          {{ store.currentSummary?.step1TotalTransactions ?? 0 }} รายการ
          · {{ store.currentSummary?.step1SuccessTransactions ?? 0 }} สำเร็จ
        </span>
      </div>

      <div class="px-6 py-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div class="bg-blue-50 rounded-lg p-3 text-center">
          <p class="text-xs text-blue-600 mb-1">ยอดรับชำระทั้งหมด</p>
          <p class="font-semibold text-blue-900">{{ formatAmount(store.currentSummary?.step1TotalAmount ?? 0) }}</p>
        </div>
        <div class="bg-green-50 rounded-lg p-3 text-center">
          <p class="text-xs text-green-600 mb-1">ค่าธรรมเนียมสะสม</p>
          <p class="font-semibold text-green-900">{{ formatAmount(store.currentSummary?.step1TotalCommission ?? 0) }}</p>
        </div>
        <div class="bg-red-50 rounded-lg p-3 text-center">
          <p class="text-xs text-red-600 mb-1">รายการล้มเหลว</p>
          <p class="font-semibold text-red-900">{{ store.currentSummary?.step1FailedTransactions ?? 0 }} รายการ</p>
        </div>
      </div>

      <!-- Expandable transaction list -->
      <div class="border-t border-gray-100">
        <button
          class="w-full flex items-center justify-between px-6 py-3 text-left hover:bg-gray-50 transition-colors"
          @click="expandStep1 = !expandStep1"
        >
          <div class="flex items-center gap-2">
            <DocumentTextIcon class="w-4 h-4 text-gray-500" />
            <span class="text-sm font-medium text-gray-700">รายการธุรกรรมทั้งหมด</span>
            <BaseBadge variant="default" size="sm">{{ dateTransactions.length }} รายการ</BaseBadge>
          </div>
          <ChevronUpIcon v-if="expandStep1" class="w-4 h-4 text-gray-500" />
          <ChevronDownIcon v-else class="w-4 h-4 text-gray-500" />
        </button>
        <div v-if="expandStep1" class="px-6 pb-4">
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
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════════════════
         STEP 2 Summary
    ════════════════════════════════════════════════════════════════════════════ -->
    <section class="bg-white border border-gray-200 rounded-xl mb-4 overflow-hidden">
      <div class="flex items-center gap-3 px-6 py-4 bg-gray-50 border-b border-gray-200">
        <span class="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-bold">2</span>
        <h3 class="font-semibold text-gray-900">Step 2 — Manager ตรวจนับเงิน</h3>
        <BaseBadge
          v-if="store.isStep2Complete"
          :variant="store.currentSummary?.step2HasDiscrepancies ? 'warning' : 'success'"
          size="sm"
          class="ml-auto"
        >
          {{ store.currentSummary?.step2HasDiscrepancies ? 'มีส่วนต่าง ⚠️' : 'ตรงกัน ✅' }}
        </BaseBadge>
      </div>

      <button
        class="w-full flex items-center justify-between px-6 py-3 text-left hover:bg-gray-50 transition-colors"
        @click="expandStep2 = !expandStep2"
      >
        <div class="flex items-center gap-2">
          <BanknotesIcon class="w-4 h-4 text-gray-500" />
          <span class="text-sm font-medium text-gray-700">รายละเอียดการตรวจนับ</span>
        </div>
        <ChevronUpIcon v-if="expandStep2" class="w-4 h-4 text-gray-500" />
        <ChevronDownIcon v-else class="w-4 h-4 text-gray-500" />
      </button>

      <div v-if="expandStep2" class="px-6 pb-4 space-y-2 text-sm">
        <div class="grid grid-cols-3 gap-2">
          <div class="bg-gray-50 rounded-lg p-3">
            <p class="text-xs text-gray-500 mb-1">ยอดที่ควรมี (บิล)</p>
            <p class="font-medium text-gray-900">{{ formatAmount(store.currentSummary?.step2ExpectedBillPaymentCash ?? 0) }}</p>
          </div>
          <div class="bg-gray-50 rounded-lg p-3">
            <p class="text-xs text-gray-500 mb-1">นับจริง (บิล)</p>
            <p class="font-medium text-gray-900">{{ formatAmount(store.currentSummary?.step2ActualBillPaymentCash ?? 0) }}</p>
          </div>
          <div
            class="rounded-lg p-3"
            :class="step2BillPaymentDiff === 0 ? 'bg-green-50' : 'bg-yellow-50'"
          >
            <p class="text-xs text-gray-500 mb-1">ส่วนต่าง (บิล)</p>
            <p class="font-medium" :class="step2BillPaymentDiff === 0 ? 'text-green-700' : 'text-yellow-700'">
              {{ formatDiff(step2BillPaymentDiff) }}
            </p>
          </div>
        </div>
        <div class="grid grid-cols-3 gap-2">
          <div class="bg-gray-50 rounded-lg p-3">
            <p class="text-xs text-gray-500 mb-1">ยอดที่ควรมี (ค่าธรรมเนียม)</p>
            <p class="font-medium text-gray-900">{{ formatAmount(store.currentSummary?.step2ExpectedServiceFeeCash ?? 0) }}</p>
          </div>
          <div class="bg-gray-50 rounded-lg p-3">
            <p class="text-xs text-gray-500 mb-1">นับจริง (ค่าธรรมเนียม)</p>
            <p class="font-medium text-gray-900">{{ formatAmount(store.currentSummary?.step2ActualServiceFeeCash ?? 0) }}</p>
          </div>
          <div
            class="rounded-lg p-3"
            :class="step2ServiceFeeDiff === 0 ? 'bg-green-50' : 'bg-yellow-50'"
          >
            <p class="text-xs text-gray-500 mb-1">ส่วนต่าง (ค่าธรรมเนียม)</p>
            <p class="font-medium" :class="step2ServiceFeeDiff === 0 ? 'text-green-700' : 'text-yellow-700'">
              {{ formatDiff(step2ServiceFeeDiff) }}
            </p>
          </div>
        </div>
        <div v-if="store.currentSummary?.step2VerificationNotes" class="bg-gray-50 rounded-lg p-3">
          <p class="text-xs text-gray-500 mb-1">หมายเหตุ</p>
          <p class="text-gray-700 whitespace-pre-wrap">{{ store.currentSummary.step2VerificationNotes }}</p>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════════════════
         Auditor Findings Summary
    ════════════════════════════════════════════════════════════════════════════ -->
    <section class="bg-white border border-gray-200 rounded-xl mb-4 overflow-hidden">
      <div class="flex items-center gap-3 px-6 py-4 bg-gray-50 border-b border-gray-200">
        <ShieldCheckIcon class="w-5 h-5 text-indigo-600" />
        <h3 class="font-semibold text-gray-900">ผลการตรวจสอบ Auditor</h3>
        <BaseBadge
          v-if="store.isAudited"
          :variant="isAuditedWithIssues ? 'warning' : 'success'"
          size="sm"
          class="ml-auto"
        >
          {{ isAuditedWithIssues ? 'พบปัญหา ⚠️' : 'ผ่านการตรวจสอบ ✅' }}
        </BaseBadge>
        <BaseBadge v-else variant="default" size="sm" class="ml-auto">ยังไม่ตรวจสอบ</BaseBadge>
      </div>

      <button
        class="w-full flex items-center justify-between px-6 py-3 text-left hover:bg-gray-50 transition-colors"
        @click="expandAudit = !expandAudit"
      >
        <div class="flex items-center gap-2">
          <ShieldCheckIcon class="w-4 h-4 text-gray-500" />
          <span class="text-sm font-medium text-gray-700">รายละเอียดการตรวจสอบ</span>
        </div>
        <ChevronUpIcon v-if="expandAudit" class="w-4 h-4 text-gray-500" />
        <ChevronDownIcon v-else class="w-4 h-4 text-gray-500" />
      </button>

      <div v-if="expandAudit" class="px-6 pb-4 space-y-3 text-sm">
        <div class="bg-gray-50 rounded-lg p-3 space-y-2">
          <div class="flex justify-between">
            <span class="text-gray-500">ตรวจสอบโดย</span>
            <span class="font-medium text-gray-900">{{ store.currentSummary?.auditedByName ?? '-' }}</span>
          </div>
          <div v-if="store.currentSummary?.auditedAt" class="flex justify-between">
            <span class="text-gray-500">เวลาตรวจสอบ</span>
            <span class="text-gray-700">{{ formatDatetime(store.currentSummary.auditedAt) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">ยอด Bank Statement</span>
            <span class="font-medium text-blue-800">{{ formatAmount(store.currentSummary?.auditBankStatementAmount ?? 0) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">ตรวจสอบ Bank Statement</span>
            <BaseBadge :variant="store.currentSummary?.auditBankBalanceMatches ? 'success' : 'warning'" size="sm">
              {{ store.currentSummary?.auditBankBalanceMatches ? '✅ ตรงกัน' : '⚠️ ไม่ตรงกัน' }}
            </BaseBadge>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">รายการที่ตรวจ</span>
            <span>{{ store.currentSummary?.auditTransactionsVerified ?? 0 }} รายการ</span>
          </div>
          <div v-if="(store.currentSummary?.auditTransactionsWithIssues ?? 0) > 0" class="flex justify-between">
            <span class="text-gray-500">รายการที่มีปัญหา</span>
            <span class="text-orange-600 font-medium">{{ store.currentSummary?.auditTransactionsWithIssues }} รายการ</span>
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
    </section>

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
