<script setup lang="ts">
import { useBillPaymentStore } from '~/stores/bill-payment'
import { useLogger } from '~/composables/useLogger'
import { usePermissions } from '~/composables/usePermissions'
import { useBillPaymentHelpers } from '~/composables/useBillPaymentHelpers'
import { PERMISSIONS } from '~/types/permissions'
import type { CashVerificationRow } from '~/components/shared/CashVerificationTable.vue'
import type { TableColumn } from '~/components/shared/TransactionTable.vue'
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  EyeIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/vue/24/outline'

const props = defineProps<{
  date: string
}>()

type AuditOutcome = 'audited' | 'audited_with_issues' | 'needs_correction'

const emit = defineEmits<{
  'audit-submitted': [outcome: AuditOutcome]
}>()

const logger = useLogger('BPAuditorReviewSection')
const store = useBillPaymentStore()
const {
  formatAmount,
  formatTime,
  formatBillType,
  formatTransactionType,
  getStatusLabel,
  getStatusBadgeVariant,
  formatDiff,
} = useBillPaymentHelpers()

// ─── Alerts ───────────────────────────────────────────────────────────────────
const successMessage = ref('')
const errorMessage = ref('')

// ─── Workflow state ───────────────────────────────────────────────────────────
const workflowStatus = computed(() => store.getCurrentWorkflowStatus)
const isNeedsCorrection = computed(() => workflowStatus.value === 'needs_correction')
const isAlreadyAudited = computed(() => store.isAudited && !isNeedsCorrection.value)

// ─── Transactions ─────────────────────────────────────────────────────────────
const dateTransactions = computed(() => store.getTransactionsByDate(props.date))
const auditTransactionList = computed(() =>
  dateTransactions.value.filter(
    (t: any) => t.status === 'completed' || t.status === 'on_hold' || t.status === 'cancelled',
  ),
)

// ─── Transaction issue toggle (mirrors MT pattern) ────────────────────────────
const txnIssueStatus = ref<Record<string, true>>({})
const txnsWithIssues = computed(() => Object.keys(txnIssueStatus.value).length)
const showTransactions = ref(false)
const showReadonlyTransactions = ref(false)

function toggleTxnIssue(txnId: string) {
  if (txnIssueStatus.value[txnId]) {
    const copy = { ...txnIssueStatus.value }
    delete copy[txnId]
    txnIssueStatus.value = copy
  } else {
    txnIssueStatus.value = { ...txnIssueStatus.value, [txnId]: true }
  }
}

// ─── Transaction detail modal ─────────────────────────────────────────────────
const showVerifyModal = ref(false)
const verifyingTransaction = ref<any>(null)

function openVerifyModal(txn: any) {
  verifyingTransaction.value = txn
  showVerifyModal.value = true
}

// ─── Balance Snapshot ─────────────────────────────────────────────────────────
const openingBalance = computed(() => store.currentBalance?.openingBalance ?? 0)
const completedTransactions = computed(() =>
  dateTransactions.value.filter((t: any) => t.status === 'completed'),
)

// BP bank account: bill_payment → bankAccount -= amount; owner_deposit → bankAccount += amount
const expectedClosingBalance = computed(() => {
  let closing = openingBalance.value
  for (const t of completedTransactions.value) {
    if (t.transactionType === 'bill_payment') closing -= t.amount
    else if (t.transactionType === 'owner_deposit') closing += t.amount
  }
  return closing
})

// ─── Auditor Cash Inputs ──────────────────────────────────────────────────────
const auditorCashBillPayment = ref<number | null>(null)
const auditorCashServiceFee = ref<number | null>(null)

const auditorCashRows = computed<CashVerificationRow[]>(() => [
  {
    label: 'A. เงินสดรับชำระบิล',
    expected: store.currentSummary?.step2ExpectedBillPaymentCash ?? 0,
    managerActual: store.currentSummary?.step2ActualBillPaymentCash ?? null,
    auditorActual: auditorCashBillPayment.value,
  },
  {
    label: 'B. ค่าธรรมเนียม',
    expected: store.currentSummary?.step2ExpectedServiceFeeCash ?? 0,
    managerActual: store.currentSummary?.step2ActualServiceFeeCash ?? null,
    auditorActual: auditorCashServiceFee.value,
  },
])

// Read-only rows for the already-audited view
const auditReadonlyRows = computed<CashVerificationRow[]>(() => [
  {
    label: 'A. เงินสดรับชำระบิล',
    expected: store.currentSummary?.step2ExpectedBillPaymentCash ?? 0,
    managerActual: store.currentSummary?.step2ActualBillPaymentCash ?? null,
    auditorActual: store.currentSummary?.auditorActualBillPaymentCash ?? null,
  },
  {
    label: 'B. ค่าธรรมเนียม',
    expected: store.currentSummary?.step2ExpectedServiceFeeCash ?? 0,
    managerActual: store.currentSummary?.step2ActualServiceFeeCash ?? null,
    auditorActual: store.currentSummary?.auditorActualServiceFeeCash ?? null,
  },
])

// ─── Bank Statement ───────────────────────────────────────────────────────────
const bankStatementAmount = ref<number | ''>('')
const bankBalanceDiff = computed(() =>
  bankStatementAmount.value === '' ? null : bankStatementAmount.value - expectedClosingBalance.value,
)
const bankBalanceMatches = computed(() => bankBalanceDiff.value === 0)

// ─── CashVerificationTable event handlers ─────────────────────────────────────
function onAuditorActualUpdate(rowIndex: number, value: number | null) {
  if (rowIndex === 0) auditorCashBillPayment.value = value
  else if (rowIndex === 1) auditorCashServiceFee.value = value
}

// ─── Audit narrative fields ───────────────────────────────────────────────────
const auditFindings = ref('')
const isSubmitting = ref(false)
const hasFindings = computed(() => auditFindings.value.trim() !== '')

const canShowAuditForm = computed(
  () => store.isStep2Complete && (!store.isAudited || isNeedsCorrection.value),
)
// Back with the Auditor after a send-back: Manager has re-counted (Step 2 is complete again)
const isReaudit = computed(() => canShowAuditForm.value && !!store.currentSummary?.correctionNotes)

const canSubmitAudit = computed(
  () =>
    bankStatementAmount.value !== '' &&
    auditorCashBillPayment.value !== null &&
    auditorCashServiceFee.value !== null,
)
const hasDiscrepancy = computed(() => {
  const summary = store.currentSummary
  return (
    (bankBalanceDiff.value !== null && bankBalanceDiff.value !== 0) ||
    txnsWithIssues.value > 0 ||
    !!summary?.step2HasDiscrepancies ||
    (auditorCashBillPayment.value !== null && auditorCashBillPayment.value !== summary?.step2ExpectedBillPaymentCash) ||
    (auditorCashServiceFee.value !== null && auditorCashServiceFee.value !== summary?.step2ExpectedServiceFeeCash)
  )
})
// "ยืนยันการตรวจสอบ" means nothing to report; anything found goes through "ยืนยันพร้อมหมายเหตุ"
const needsNotedConfirm = computed(() => hasDiscrepancy.value || hasFindings.value)
const canConfirmClean = computed(() => canSubmitAudit.value && !needsNotedConfirm.value)
const canSubmitAuditWithIssues = computed(() => canSubmitAudit.value && hasFindings.value)

const auditResultSummary = computed(() => {
  const summary = store.currentSummary
  const issues = summary?.auditTransactionsWithIssues ?? 0
  const cashMatches =
    summary?.auditorActualBillPaymentCash === summary?.step2ExpectedBillPaymentCash &&
    summary?.auditorActualServiceFeeCash === summary?.step2ExpectedServiceFeeCash
  return [
    issues > 0 ? `${issues} รายการมีปัญหา` : 'ไม่พบปัญหา',
    cashMatches ? 'ยอดตรงกัน' : 'ยอดไม่ตรงกัน',
  ].join(' · ')
})

// ─── TransactionTable columns ─────────────────────────────────────────────────
const bpColumns: TableColumn[] = [
  { key: 'timestamp', label: 'เวลา', formatter: (_v, row) => formatTime(row.timestamp) },
  { key: 'transactionType', label: 'ประเภท', tdClass: 'font-medium text-gray-900', formatter: (v) => formatTransactionType(v) },
  { key: 'customerName', label: 'ลูกค้า', formatter: (v) => v || '-' },
  { key: 'amount', label: 'จำนวนเงิน', align: 'right' as const, tdClass: 'font-semibold text-gray-900', formatter: (v) => formatAmount(v) },
  { key: 'commission', label: 'ค่าธรรมเนียม', align: 'right' as const, component: 'commission' },
  { key: 'status', label: 'สถานะ', align: 'center' as const, component: 'status' },
]

// ─── Submit ───────────────────────────────────────────────────────────────────
const AUDIT_CONFIRM: Record<AuditOutcome, { title: string; message: string; confirmText: string; variant: 'success' | 'warning' }> = {
  audited: {
    title: 'ยืนยันการตรวจสอบ',
    message: 'ยืนยันผลการ Audit และส่งให้ Owner อนุมัติหรือไม่?',
    confirmText: 'ยืนยันการตรวจสอบ',
    variant: 'success',
  },
  audited_with_issues: {
    title: 'ยืนยันพร้อมหมายเหตุ',
    message: 'ยืนยันผลการ Audit (มีปัญหา/หมายเหตุ) และส่งให้ Owner อนุมัติหรือไม่? Owner จะเห็นหมายเหตุที่ระบุไว้',
    confirmText: 'ยืนยัน',
    variant: 'warning',
  },
  needs_correction: {
    title: 'ส่งคืนให้ Manager แก้ไข',
    message: 'ต้องการส่งคืนรายการนี้ให้ Manager แก้ไขหรือไม่? Manager จะต้องยืนยันและตรวจนับเงินสดใหม่',
    confirmText: 'ส่งคืนแก้ไข',
    variant: 'warning',
  },
}

const pendingOutcome = ref<AuditOutcome | null>(null)
const pendingConfirm = computed(() => (pendingOutcome.value ? AUDIT_CONFIRM[pendingOutcome.value] : null))

function buildAuditData(outcome: AuditOutcome) {
  return {
    outcome,
    auditBankStatementAmount: bankStatementAmount.value === '' ? undefined : bankStatementAmount.value,
    auditBankBalanceMatches: bankBalanceMatches.value,
    // Sending back does not require a cash count; the API accepts undefined, not null
    auditorActualBillPaymentCash: auditorCashBillPayment.value ?? undefined,
    auditorActualServiceFeeCash: auditorCashServiceFee.value ?? undefined,
    auditExpectedClosingBalance: expectedClosingBalance.value,
    auditBankStatementVsClosingDiff: bankBalanceDiff.value ?? undefined,
    auditBankStatementVsClosingMatches: bankBalanceMatches.value,
    auditTxnIssueStatus: Object.keys(txnIssueStatus.value).length > 0
      ? { ...txnIssueStatus.value }
      : undefined,
    auditFindings: auditFindings.value.trim() || undefined,
    auditTransactionsVerified: auditTransactionList.value.length,
    auditTransactionsWithIssues: txnsWithIssues.value,
    correctionNotes: outcome === 'needs_correction' ? auditFindings.value.trim() : undefined,
  }
}

async function handleAuditSubmit() {
  const outcome = pendingOutcome.value
  if (!outcome) return

  isSubmitting.value = true
  errorMessage.value = ''
  try {
    await store.submitAudit(props.date, buildAuditData(outcome))
    const labels: Record<AuditOutcome, string> = {
      audited: 'ยืนยันการตรวจสอบเรียบร้อย',
      audited_with_issues: 'ยืนยันพร้อมหมายเหตุเรียบร้อย',
      needs_correction: 'ส่งคืนให้ Manager แก้ไขแล้ว',
    }
    successMessage.value = labels[outcome]
    logger.log(`Audit submitted: ${outcome} for ${props.date}`)
    emit('audit-submitted', outcome)
  } catch (err: any) {
    errorMessage.value = err.message ?? 'เกิดข้อผิดพลาด'
    logger.error('handleAuditSubmit', err)
  } finally {
    isSubmitting.value = false
    pendingOutcome.value = null
  }
}

// ─── Pre-fill when returning after needs_correction ───────────────────────────
watch(
  () => store.currentSummary,
  (summary) => {
    if (summary?.workflowStatus === 'needs_correction') {
      if (summary.auditorActualBillPaymentCash != null)
        auditorCashBillPayment.value = summary.auditorActualBillPaymentCash
      if (summary.auditorActualServiceFeeCash != null)
        auditorCashServiceFee.value = summary.auditorActualServiceFeeCash
      if (summary.auditBankStatementAmount)
        bankStatementAmount.value = summary.auditBankStatementAmount
      if (summary.auditFindings || summary.correctionNotes)
        auditFindings.value = summary.auditFindings || summary.correctionNotes || ''
      if (summary.auditTxnIssueStatus)
        txnIssueStatus.value = { ...summary.auditTxnIssueStatus }
    }
  },
  { immediate: true },
)
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

    <!-- ── Sent back: waiting for Manager ─────────────────────────────────── -->
    <div
      v-if="isNeedsCorrection && !store.isStep2Complete"
      class="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-5 py-4"
    >
      <div class="flex items-start gap-3">
        <ExclamationTriangleIcon class="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
        <div>
          <p class="font-semibold text-amber-800">ส่งคืนให้ Manager แก้ไขแล้ว — รอ Manager ตรวจนับเงินสดใหม่</p>
          <p v-if="store.currentSummary?.correctionNotes" class="mt-1 text-sm text-amber-700">หมายเหตุ: {{ store.currentSummary.correctionNotes }}</p>
        </div>
      </div>
    </div>

    <!-- ── Re-audit after Manager's correction ────────────────────────────── -->
    <div
      v-if="isReaudit"
      class="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-5 py-4"
    >
      <div class="flex items-start gap-3">
        <ExclamationTriangleIcon class="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
        <div>
          <p class="font-semibold text-amber-800">ตรวจสอบซ้ำ — Manager แก้ไขแล้ว</p>
          <p class="mt-1 text-sm text-amber-700">หมายเหตุเดิม: {{ store.currentSummary?.correctionNotes }}</p>
        </div>
      </div>
    </div>

    <!-- ── Not ready yet ─────────────────────────────────────────────────── -->
    <BaseAlert
      v-if="!store.isStep2Complete && !isNeedsCorrection"
      variant="warning"
      message="Manager ยังไม่ได้ตรวจนับเงินสด (ขั้นตอนที่ 2) — ยังไม่สามารถตรวจสอบได้"
      class="mb-4"
    />

    <!-- ═══════════════════════════════════════════════════════════════════════
         AUDITOR FORM — Active
    ════════════════════════════════════════════════════════════════════════════ -->
    <section v-if="canShowAuditForm" class="mt-6">
      <div class="mb-4 flex items-center gap-3">
        <h2 class="text-base font-semibold text-gray-700">🔍 ตรวจสอบบริการรับชำระบิล</h2>
        <BaseBadge v-if="isReaudit" variant="error" size="sm">🔄 ตรวจสอบใหม่</BaseBadge>
        <BaseBadge v-else variant="warning" size="sm">⏳ รอตรวจสอบ</BaseBadge>
      </div>

      <!-- Balance Snapshot + Bank Statement -->
      <div class="mb-5">
        <h3 class="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">ยอดเงินในบัญชี Bank</h3>
        <BalanceSnapshot
          :opening-balance="openingBalance"
          :closing-balance="expectedClosingBalance"
        >
          <div class="grid grid-cols-2 gap-4 text-sm">
            <FormField label="Bank Statement แสดง">
              <div class="relative">
                <BaseInput v-model="bankStatementAmount" type="number" placeholder="0" />
                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">บาท</span>
              </div>
            </FormField>
            <div class="mb-1 flex items-center self-end rounded-lg bg-gray-50 p-3">
              <div>
                <div class="mb-1 text-xs text-gray-500">ผลต่าง (Bank Statement − ยอดปิด)</div>
                <div :class="['text-base font-bold', bankBalanceDiff === null ? 'text-gray-400' : bankBalanceDiff === 0 ? 'text-green-700' : 'text-red-700']">
                  {{ bankBalanceDiff === null ? '—' : bankBalanceDiff === 0 ? '✅ ตรงกัน' : (bankBalanceDiff > 0 ? '+' : '') + formatDiff(bankBalanceDiff) }}
                </div>
              </div>
            </div>
          </div>
        </BalanceSnapshot>
      </div>

      <!-- Transaction List (Collapsible with issue toggle) -->
      <div class="mb-5">
        <button
          class="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 transition-colors hover:bg-gray-50"
          :class="showTransactions ? 'rounded-b-none border-b-0' : ''"
          @click="showTransactions = !showTransactions"
        >
          <div class="flex items-center gap-3">
            <component :is="showTransactions ? ChevronDownIcon : ChevronRightIcon" class="h-4 w-4 text-gray-500" />
            <span class="text-sm font-semibold text-gray-700">รายการธุรกรรม</span>
            <span class="text-sm text-gray-400">{{ auditTransactionList.length }} รายการ</span>
          </div>
          <BaseBadge :variant="txnsWithIssues > 0 ? 'warning' : 'success'" size="sm">
            {{ txnsWithIssues > 0 ? `⚠️ ${txnsWithIssues} รายการมีปัญหา` : '✅ ไม่พบปัญหา' }}
          </BaseBadge>
        </button>
        <div v-if="showTransactions" class="overflow-hidden rounded-b-xl border border-t-0 border-gray-200 bg-white">
          <TransactionTable
            :transactions="auditTransactionList"
            :columns="bpColumns"
            :issued-ids="txnIssueStatus"
            empty-message="ยังไม่มีรายการสำหรับวันนี้"
            @row-click="openVerifyModal"
          >
            <template #action-header>จัดการ</template>
            <template #col-commission="{ row }">
              {{ row.commission ? formatAmount(row.commission) : '-' }}
            </template>
            <template #col-status="{ row }">
              <div class="flex flex-col items-center gap-1">
                <BaseBadge :variant="getStatusBadgeVariant(row.status)" size="sm" dot>
                  {{ getStatusLabel(row.status) }}
                </BaseBadge>
                <BaseBadge v-if="txnIssueStatus[row.id]" variant="warning" size="sm">พบปัญหา</BaseBadge>
              </div>
            </template>
            <template #actions="{ txn }">
              <button
                class="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-blue-50 hover:text-blue-600"
                aria-label="ดูรายละเอียด"
                @click.stop="openVerifyModal(txn)"
              >
                <EyeIcon class="h-4 w-4" />
              </button>
              <button
                :class="[
                  'rounded-lg border px-2 py-1 text-xs font-medium transition-colors',
                  txnIssueStatus[txn.id]
                    ? 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                    : 'border-amber-300 bg-white text-amber-700 hover:bg-amber-50',
                ]"
                @click.stop="toggleTxnIssue(txn.id)"
              >
                <template v-if="txnIssueStatus[txn.id]">ยกเลิก</template>
                <template v-else>
                  <ExclamationTriangleIcon class="mr-0.5 inline h-3.5 w-3.5" />
                  มีปัญหา
                </template>
              </button>
            </template>
          </TransactionTable>
          <div v-if="auditTransactionList.length > 0" class="flex flex-wrap gap-4 border-t border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-600">
            <span>รวม {{ auditTransactionList.length }} รายการ</span>
            <span v-if="txnsWithIssues > 0" class="font-medium text-amber-700">⚠️ พบปัญหา {{ txnsWithIssues }} รายการ</span>
            <span v-else class="text-green-700">✅ ไม่พบปัญหา</span>
          </div>
        </div>
      </div>

      <!-- Auditor Cash Count -->
      <div class="mb-5">
        <h3 class="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">ตรวจสอบยอดเงินสด</h3>
        <CashVerificationTable
          :rows="auditorCashRows"
          mode="auditor-input"
          @update:auditor-actual="onAuditorActualUpdate"
        />
        <div v-if="store.currentSummary?.step2VerificationNotes" class="mt-2 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-700">
          <div class="text-xs text-gray-500">หมายเหตุ Manager</div>
          <div class="mt-1">{{ store.currentSummary.step2VerificationNotes }}</div>
        </div>
      </div>

      <!-- Issue Details -->
      <div class="mb-6">
        <h3 class="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">รายละเอียดปัญหาที่พบ (ถ้ามี)</h3>
        <div class="rounded-xl border border-gray-200 bg-white p-4">
          <BaseTextarea
            v-model="auditFindings"
            placeholder="ระบุปัญหาที่พบ เช่น รายการที่ X ยอดเงินไม่ตรงกับ Bank Statement... (ว่างได้ถ้าไม่พบปัญหา)"
            :rows="3"
          />
        </div>
      </div>

      <div v-if="txnsWithIssues > 0" class="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-700">
        ⚠️ พบ {{ txnsWithIssues }} รายการมีปัญหาในรายการธุรกรรม
      </div>

      <p v-if="canSubmitAudit && needsNotedConfirm" class="text-right text-sm text-amber-700">
        พบผลต่างหรือมีรายละเอียดปัญหา — ใช้ปุ่ม "ยืนยันพร้อมหมายเหตุ"
      </p>

      <!-- Action Buttons -->
      <div class="flex flex-col items-center justify-between gap-4 py-4 sm:flex-row">
        <ActionButton
          :permission="PERMISSIONS.VIEW_FINANCE"
          variant="danger"
          :disabled="isSubmitting || !hasFindings"
          :title="!hasFindings ? 'กรอกรายละเอียดปัญหาก่อน' : ''"
          @click="pendingOutcome = 'needs_correction'"
        >
          <template #icon><XCircleIcon class="h-4 w-4" /></template>
          ส่งคืนแก้ไข
        </ActionButton>
        <div class="flex flex-col gap-3 sm:flex-row">
          <ActionButton
            :permission="PERMISSIONS.VIEW_FINANCE"
            variant="secondary"
            class="border border-amber-400 !bg-amber-50 !text-amber-800 hover:!bg-amber-100 disabled:opacity-50"
            :disabled="isSubmitting || !canSubmitAuditWithIssues"
            :title="!canSubmitAuditWithIssues ? 'กรอก Bank Statement, ยอดนับ และรายละเอียดปัญหาก่อน' : ''"
            @click="pendingOutcome = 'audited_with_issues'"
          >
            <template #icon><ExclamationTriangleIcon class="h-4 w-4" /></template>
            ยืนยันพร้อมหมายเหตุ
          </ActionButton>
          <ActionButton
            :permission="PERMISSIONS.VIEW_FINANCE"
            variant="success"
            :disabled="isSubmitting || !canConfirmClean"
            :title="!canSubmitAudit ? 'กรอก Bank Statement และยอดนับให้ครบก่อน' : needsNotedConfirm ? 'พบผลต่างหรือมีรายละเอียดปัญหา — ใช้ ยืนยันพร้อมหมายเหตุ' : ''"
            @click="pendingOutcome = 'audited'"
          >
            <template #icon><CheckCircleIcon class="h-4 w-4" /></template>
            ยืนยันการตรวจสอบ
          </ActionButton>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════════════════
         AUDIT RESULT — Read-only
    ════════════════════════════════════════════════════════════════════════════ -->
    <CollapsibleSection
      v-if="isAlreadyAudited"
      icon="🔍"
      title="ผลตรวจสอบ Auditor"
      :badge="workflowStatus === 'audited'
        ? { label: '✅ ตรวจสอบแล้ว', variant: 'success' }
        : { label: '⚠️ ตรวจสอบแล้ว (มีหมายเหตุ)', variant: 'warning' }"
      :summary="auditResultSummary"
      :expanded="true"
      class="mt-4"
    >
      <!-- Balance Snapshot read-only -->
      <div class="mb-4">
        <h3 class="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">ยอดเงินในบัญชี Bank</h3>
        <BalanceSnapshot
          :opening-balance="openingBalance"
          :closing-balance="expectedClosingBalance"
        >
          <div v-if="store.currentSummary?.auditBankStatementAmount" class="flex flex-wrap items-center gap-3 rounded-lg bg-gray-50 p-3 text-sm">
            <span class="text-gray-600">Bank Statement:</span>
            <span class="font-semibold text-blue-800">{{ formatAmount(store.currentSummary.auditBankStatementAmount) }}</span>
            <BaseBadge :variant="store.currentSummary?.auditBankStatementVsClosingMatches ? 'success' : 'warning'" size="sm">
              {{ store.currentSummary?.auditBankStatementVsClosingMatches ? '✅ ตรงกัน' : '⚠️ ไม่ตรง' }}
            </BaseBadge>
          </div>
        </BalanceSnapshot>
      </div>

      <!-- Transaction list read-only -->
      <div class="mb-4">
        <button
          class="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 transition-colors hover:bg-gray-50"
          :class="showReadonlyTransactions ? 'rounded-b-none border-b-0' : ''"
          @click="showReadonlyTransactions = !showReadonlyTransactions"
        >
          <div class="flex items-center gap-3">
            <component :is="showReadonlyTransactions ? ChevronDownIcon : ChevronRightIcon" class="h-4 w-4 text-gray-500" />
            <span class="text-sm font-semibold text-gray-700">รายการธุรกรรม</span>
            <span class="text-sm text-gray-400">{{ auditTransactionList.length }} รายการ</span>
          </div>
          <BaseBadge :variant="(store.currentSummary?.auditTransactionsWithIssues ?? 0) > 0 ? 'warning' : 'success'" size="sm">
            {{ (store.currentSummary?.auditTransactionsWithIssues ?? 0) > 0
              ? `⚠️ ${store.currentSummary?.auditTransactionsWithIssues} รายการมีปัญหา`
              : '✅ ไม่พบปัญหา' }}
          </BaseBadge>
        </button>
        <div v-if="showReadonlyTransactions" class="overflow-hidden rounded-b-xl border border-t-0 border-gray-200 bg-white">
          <TransactionTable
            :transactions="auditTransactionList"
            :columns="bpColumns"
            :issued-ids="store.currentSummary?.auditTxnIssueStatus"
            empty-message="ยังไม่มีรายการสำหรับวันนี้"
          >
            <template #col-commission="{ row }">
              {{ row.commission ? formatAmount(row.commission) : '-' }}
            </template>
            <template #col-status="{ row }">
              <div class="flex flex-col items-center gap-1">
                <BaseBadge :variant="getStatusBadgeVariant(row.status)" size="sm" dot>
                  {{ getStatusLabel(row.status) }}
                </BaseBadge>
                <BaseBadge v-if="store.currentSummary?.auditTxnIssueStatus?.[row.id]" variant="warning" size="sm">พบปัญหา</BaseBadge>
              </div>
            </template>
          </TransactionTable>
        </div>
      </div>

      <!-- Audit Cash Verification read-only -->
      <div class="mb-4">
        <h3 class="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">ยอดเงินสด (Manager vs Auditor)</h3>
        <CashVerificationTable :rows="auditReadonlyRows" mode="full-readonly" />
      </div>

      <!-- Summary footer -->
      <div class="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
        <div class="p-4 text-sm">
          <div class="flex items-center justify-between">
            <span class="text-gray-600">รายการที่ตรวจสอบ</span>
            <span class="font-medium">
              {{ store.currentSummary?.auditTransactionsVerified ?? 0 }} รายการ
              <template v-if="(store.currentSummary?.auditTransactionsWithIssues ?? 0) > 0">
                <span class="ml-1 text-red-600">(พบปัญหา {{ store.currentSummary?.auditTransactionsWithIssues }} รายการ)</span>
              </template>
            </span>
          </div>
        </div>
        <div v-if="store.currentSummary?.auditFindings" class="p-4 text-sm">
          <div class="text-xs text-gray-500">ผลการตรวจสอบ / หมายเหตุ</div>
          <div class="mt-1 whitespace-pre-wrap text-gray-700">{{ store.currentSummary.auditFindings }}</div>
        </div>
        <div class="bg-gray-50 p-4 text-xs text-gray-500">
          ตรวจสอบโดย {{ store.currentSummary?.auditedByName ?? '-' }}
          <template v-if="store.currentSummary?.auditedAt">
            · {{ new Date(store.currentSummary.auditedAt).toLocaleString('th-TH') }}
          </template>
        </div>
      </div>
    </CollapsibleSection>

    <!-- ═══════════════════════════════════════════════════════════════════════
         Transaction Detail Modal
    ════════════════════════════════════════════════════════════════════════════ -->
    <BaseModal :open="showVerifyModal" size="md" @close="showVerifyModal = false">
      <template #header>
        <div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 class="text-lg font-bold text-gray-900">รายละเอียดรายการ</h2>
          <BaseBadge v-if="verifyingTransaction" :variant="getStatusBadgeVariant(verifyingTransaction.status)" size="md" dot>
            {{ getStatusLabel(verifyingTransaction.status) }}
          </BaseBadge>
        </div>
      </template>
      <div v-if="verifyingTransaction" class="space-y-3 text-sm">
        <div class="grid grid-cols-2 gap-x-4 gap-y-3">
          <div>
            <div class="text-gray-500">ประเภท</div>
            <div class="font-medium text-gray-900">{{ formatTransactionType(verifyingTransaction.transactionType) }}</div>
          </div>
          <div>
            <div class="text-gray-500">เวลา</div>
            <div class="font-medium text-gray-900">{{ formatTime(verifyingTransaction.timestamp) }}</div>
          </div>
          <div v-if="verifyingTransaction.customerName">
            <div class="text-gray-500">ชื่อลูกค้า</div>
            <div class="font-medium text-gray-900">{{ verifyingTransaction.customerName }}</div>
          </div>
          <div v-if="verifyingTransaction.billType">
            <div class="text-gray-500">ประเภทบิล</div>
            <div class="font-medium text-gray-900">{{ formatBillType(verifyingTransaction.billType) }}</div>
          </div>
          <div>
            <div class="text-gray-500">จำนวนเงิน</div>
            <div class="text-base font-bold text-gray-900">{{ formatAmount(verifyingTransaction.amount) }}</div>
          </div>
          <div v-if="verifyingTransaction.commission">
            <div class="text-gray-500">ค่าธรรมเนียม</div>
            <div class="font-medium text-green-700">{{ formatAmount(verifyingTransaction.commission) }}</div>
          </div>
        </div>
        <div v-if="verifyingTransaction.notes" class="rounded-lg bg-gray-50 p-3">
          <div class="mb-1 text-gray-500">หมายเหตุ</div>
          <div class="text-gray-900">{{ verifyingTransaction.notes }}</div>
        </div>
        <!-- Issue toggle (only when Auditor form is active) -->
        <div v-if="canShowAuditForm" class="border-t border-gray-100 pt-3">
          <div class="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">ผลการตรวจสอบ</div>
          <div class="flex gap-2">
            <button
              :class="[
                'flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                !txnIssueStatus[verifyingTransaction.id] ? 'border-green-600 bg-green-600 text-white' : 'border-green-300 bg-white text-green-700 hover:bg-green-50',
              ]"
              @click="() => { if (txnIssueStatus[verifyingTransaction.id]) toggleTxnIssue(verifyingTransaction.id) }"
            >✅ ถูกต้อง</button>
            <button
              :class="[
                'flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                txnIssueStatus[verifyingTransaction.id] ? 'border-red-600 bg-red-600 text-white' : 'border-red-300 bg-white text-red-700 hover:bg-red-50',
              ]"
              @click="() => { if (!txnIssueStatus[verifyingTransaction.id]) toggleTxnIssue(verifyingTransaction.id) }"
            >⚠️ มีปัญหา</button>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end">
          <BaseButton variant="secondary" @click="showVerifyModal = false">ปิด</BaseButton>
        </div>
      </template>
    </BaseModal>

    <!-- Audit Confirm -->
    <ConfirmDialog
      :open="pendingOutcome !== null"
      :title="pendingConfirm?.title ?? ''"
      :message="pendingConfirm?.message ?? ''"
      :confirm-text="pendingConfirm?.confirmText"
      :variant="pendingConfirm?.variant"
      @confirm="handleAuditSubmit"
      @cancel="pendingOutcome = null"
    />
  </div>
</template>
