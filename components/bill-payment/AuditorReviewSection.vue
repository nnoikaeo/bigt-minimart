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
  ClipboardDocumentCheckIcon,
  XCircleIcon,
  ArrowUturnLeftIcon,
  EyeIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/vue/24/outline'

const props = defineProps<{
  date: string
}>()

const emit = defineEmits<{
  'audit-submitted': [outcome: 'audited' | 'audited_with_issues' | 'needs_correction']
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

// Step 2 readonly rows (manager input only)
const step2ReadonlyRows = computed<CashVerificationRow[]>(() => [
  {
    label: 'A. เงินสดรับชำระบิล',
    expected: store.currentSummary?.step2ExpectedBillPaymentCash ?? 0,
    managerActual: store.currentSummary?.step2ActualBillPaymentCash ?? null,
  },
  {
    label: 'B. ค่าธรรมเนียม',
    expected: store.currentSummary?.step2ExpectedServiceFeeCash ?? 0,
    managerActual: store.currentSummary?.step2ActualServiceFeeCash ?? null,
  },
])

// ─── Bank Statement ───────────────────────────────────────────────────────────
const bankStatementAmount = ref<number>(0)
const bankBalanceDiff = computed(() => bankStatementAmount.value - expectedClosingBalance.value)
const bankBalanceMatches = computed(() => bankBalanceDiff.value === 0)

// ─── CashVerificationTable event handlers ─────────────────────────────────────
function onAuditorActualUpdate(rowIndex: number, value: number) {
  if (rowIndex === 0) auditorCashBillPayment.value = value
  else if (rowIndex === 1) auditorCashServiceFee.value = value
}

// ─── Audit narrative fields ───────────────────────────────────────────────────
const auditFindings = ref('')
const correctionNotes = ref('')
const isSubmitting = ref(false)

const hasDiscrepancy = computed(
  () =>
    !bankBalanceMatches.value ||
    txnsWithIssues.value > 0 ||
    (auditorCashBillPayment.value !== null &&
      auditorCashBillPayment.value !== (store.currentSummary?.step2ActualBillPaymentCash ?? 0)) ||
    (auditorCashServiceFee.value !== null &&
      auditorCashServiceFee.value !== (store.currentSummary?.step2ActualServiceFeeCash ?? 0)),
)

const canSubmitAudit = computed(
  () =>
    store.isStep2Complete &&
    auditorCashBillPayment.value !== null &&
    auditorCashServiceFee.value !== null &&
    (!store.isAudited || isNeedsCorrection.value),
)

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
function buildAuditData(outcome: 'audited' | 'audited_with_issues' | 'needs_correction') {
  return {
    outcome,
    auditBankStatementAmount: bankStatementAmount.value,
    auditBankBalanceMatches: bankBalanceMatches.value,
    auditorActualBillPaymentCash: auditorCashBillPayment.value,
    auditorActualServiceFeeCash: auditorCashServiceFee.value,
    auditExpectedClosingBalance: expectedClosingBalance.value,
    auditBankStatementVsClosingDiff: bankBalanceDiff.value,
    auditBankStatementVsClosingMatches: bankBalanceMatches.value,
    auditTxnIssueStatus: Object.keys(txnIssueStatus.value).length > 0
      ? { ...txnIssueStatus.value }
      : undefined,
    auditFindings: auditFindings.value.trim() || undefined,
    auditTransactionsVerified: auditTransactionList.value.length,
    auditTransactionsWithIssues: txnsWithIssues.value,
    correctionNotes: outcome === 'needs_correction' ? correctionNotes.value.trim() : undefined,
  }
}

async function handleAuditSubmit(outcome: 'audited' | 'audited_with_issues' | 'needs_correction') {
  if (outcome === 'needs_correction' && !correctionNotes.value.trim()) {
    errorMessage.value = 'กรุณาระบุหมายเหตุสำหรับการส่งกลับ'
    return
  }
  if (outcome === 'audited_with_issues' && !auditFindings.value.trim()) {
    errorMessage.value = 'กรุณาระบุรายละเอียดปัญหาที่พบ'
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''
  try {
    await store.submitAudit(props.date, buildAuditData(outcome))
    const labels: Record<string, string> = {
      audited: 'ยืนยันการตรวจสอบเรียบร้อย',
      audited_with_issues: 'ยืนยันพร้อมหมายเหตุเรียบร้อย',
      needs_correction: 'ส่งกลับให้ Manager แก้ไขแล้ว',
    }
    successMessage.value = labels[outcome] ?? ''
    logger.log(`Audit submitted: ${outcome} for ${props.date}`)
    emit('audit-submitted', outcome)
  } catch (err: any) {
    errorMessage.value = err.message ?? 'เกิดข้อผิดพลาด'
    logger.error('handleAuditSubmit', err)
  } finally {
    isSubmitting.value = false
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
      if (summary.auditFindings) auditFindings.value = summary.auditFindings
      if (summary.correctionNotes) correctionNotes.value = summary.correctionNotes
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

    <!-- ── Needs Correction Context Banner ────────────────────────────────── -->
    <div
      v-if="isNeedsCorrection && store.currentSummary?.correctionNotes"
      class="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-5 py-4"
    >
      <div class="flex items-start gap-3">
        <ExclamationTriangleIcon class="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
        <div>
          <p class="font-semibold text-amber-800">ตรวจสอบซ้ำ — Manager แก้ไขแล้ว</p>
          <p class="mt-1 text-sm text-amber-700">หมายเหตุเดิม: {{ store.currentSummary.correctionNotes }}</p>
        </div>
      </div>
    </div>

    <!-- ── Not ready yet ─────────────────────────────────────────────────── -->
    <BaseAlert
      v-if="!store.isStep2Complete"
      variant="warning"
      message="Manager ยังไม่ได้ตรวจนับเงินสด (ขั้นตอนที่ 2) — ยังไม่สามารถตรวจสอบได้"
      class="mb-4"
    />

    <!-- ── Already audited banner ─────────────────────────────────────────── -->
    <div
      v-if="isAlreadyAudited"
      class="mb-4 rounded-xl border border-green-300 bg-green-50 px-5 py-4"
    >
      <div class="flex items-center gap-3">
        <CheckCircleIcon class="h-5 w-5 flex-shrink-0 text-green-600" />
        <div>
          <p class="font-semibold text-green-800">
            ตรวจสอบแล้ว
            <span v-if="workflowStatus === 'audited_with_issues'" class="text-amber-700"> (มีหมายเหตุ)</span>
          </p>
          <p v-if="store.currentSummary?.auditedByName" class="mt-0.5 text-sm text-green-700">
            โดย {{ store.currentSummary.auditedByName }}
            <template v-if="store.currentSummary?.auditedAt">
              · {{ new Date(store.currentSummary.auditedAt).toLocaleString('th-TH') }}
            </template>
          </p>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════════
         STEP 1 — Read-only Transaction List
    ════════════════════════════════════════════════════════════════════════════ -->
    <section class="mb-6">
      <div class="mb-3 flex items-center gap-2">
        <CheckCircleIcon class="h-5 w-5 text-green-600" />
        <h2 class="text-base font-semibold text-gray-700">ขั้นตอนที่ 1 — รายการที่บันทึก</h2>
        <BaseBadge variant="success" size="sm">เสร็จสมบูรณ์</BaseBadge>
      </div>

      <EmptyState
        v-if="dateTransactions.length === 0"
        title="ไม่มีรายการ"
        description="ไม่พบรายการสำหรับวันที่นี้"
        class="py-10"
      />

      <div v-else class="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table class="w-full text-sm">
          <thead class="border-b border-gray-100 bg-gray-50 text-xs text-gray-500">
            <tr>
              <th class="px-4 py-3 text-left">#</th>
              <th class="px-4 py-3 text-left">ประเภท</th>
              <th class="px-4 py-3 text-left">ลูกค้า</th>
              <th class="px-4 py-3 text-right">จำนวนเงิน</th>
              <th class="px-4 py-3 text-right">ค่าธรรมเนียม</th>
              <th class="px-4 py-3 text-center">สถานะ</th>
              <th class="px-4 py-3 text-left">เวลา</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr
              v-for="(txn, idx) in dateTransactions"
              :key="txn.id"
              class="hover:bg-gray-50"
            >
              <td class="px-4 py-3 text-gray-400">{{ Number(idx) + 1 }}</td>
              <td class="px-4 py-3">
                <div class="font-medium text-gray-800">{{ formatTransactionType(txn.transactionType) }}</div>
                <div v-if="txn.billType" class="text-xs text-gray-400">{{ formatBillType(txn.billType) }}</div>
              </td>
              <td class="px-4 py-3 text-gray-600">{{ txn.customerName || '-' }}</td>
              <td class="px-4 py-3 text-right font-medium text-gray-800">{{ formatAmount(txn.amount) }}</td>
              <td class="px-4 py-3 text-right text-gray-600">
                {{ txn.transactionType === 'bill_payment' ? formatAmount(txn.commission) : '-' }}
              </td>
              <td class="px-4 py-3 text-center">
                <BaseBadge :variant="getStatusBadgeVariant(txn.status)">
                  {{ getStatusLabel(txn.status) }}
                </BaseBadge>
              </td>
              <td class="px-4 py-3 text-gray-500">{{ formatTime(txn.timestamp) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════════════════
         STEP 2 — Read-only Cash Count Summary
    ════════════════════════════════════════════════════════════════════════════ -->
    <section v-if="store.isStep2Complete" class="mb-6">
      <div class="mb-3 flex items-center gap-2">
        <CheckCircleIcon class="h-5 w-5 text-green-600" />
        <h2 class="text-base font-semibold text-gray-700">ขั้นตอนที่ 2 — ผลการตรวจนับเงินสด</h2>
        <BaseBadge
          :variant="store.currentSummary?.step2HasDiscrepancies ? 'warning' : 'success'"
          size="sm"
        >
          {{ store.currentSummary?.step2HasDiscrepancies ? 'มีส่วนต่าง' : 'ตรงกัน' }}
        </BaseBadge>
      </div>

      <CashVerificationTable :rows="step2ReadonlyRows" mode="manager-readonly" />

      <div v-if="store.currentSummary?.step2VerificationNotes" class="mt-2 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-700">
        <div class="text-xs text-gray-500">หมายเหตุ Manager</div>
        <div class="mt-1">{{ store.currentSummary.step2VerificationNotes }}</div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════════════════
         AUDITOR FORM — Active
    ════════════════════════════════════════════════════════════════════════════ -->
    <section v-if="canSubmitAudit" class="mt-2">
      <div class="mb-4 flex items-center gap-3">
        <ClipboardDocumentCheckIcon class="h-5 w-5 text-red-600" />
        <h2 class="text-base font-semibold text-gray-700">ตรวจสอบโดย Auditor</h2>
        <BaseBadge v-if="isNeedsCorrection" variant="error" size="sm">🔄 ตรวจสอบซ้ำ</BaseBadge>
        <BaseBadge v-else variant="warning" size="sm">⏳ รอการตรวจสอบ</BaseBadge>
      </div>

      <!-- Balance Snapshot + Bank Statement -->
      <div class="mb-5">
        <h3 class="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">ยอดเงินในบัญชี Bank</h3>
        <BalanceSnapshot
          :opening-balance="openingBalance"
          :closing-balance="expectedClosingBalance"
          net-change-label="สุทธิรับชำระ (ระหว่างวัน)"
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
                <div :class="['text-base font-bold', bankBalanceDiff === 0 ? 'text-green-700' : 'text-red-700']">
                  {{ bankBalanceDiff === 0 ? '✅ ตรงกัน' : (bankBalanceDiff > 0 ? '+' : '') + formatDiff(bankBalanceDiff) }}
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
        <h3 class="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">ตรวจสอบยอดเงินสด (Auditor นับ)</h3>
        <CashVerificationTable
          :rows="auditorCashRows"
          mode="auditor-input"
          @update:auditor-actual="onAuditorActualUpdate"
        />
        <p v-if="auditorCashBillPayment === null || auditorCashServiceFee === null" class="mt-2 text-sm text-gray-400">
          * กรอกยอดเงินสด Auditor นับ ครบทั้ง 2 รายการก่อนดำเนินการต่อ
        </p>
      </div>

      <!-- Audit Findings -->
      <div class="mb-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <FormField
          label="ผลการตรวจสอบ / หมายเหตุ"
          :hint="hasDiscrepancy ? 'จำเป็นต้องระบุเมื่อพบส่วนต่าง' : 'บันทึกข้อสังเกตเพิ่มเติม (ไม่บังคับ)'"
        >
          <BaseTextarea
            v-model="auditFindings"
            :placeholder="hasDiscrepancy
              ? 'ระบุรายละเอียดปัญหาที่พบ เช่น ยอดเงินขาด X บาท รายการที่ X ไม่ตรงกับ statement...'
              : 'บันทึกข้อสังเกตหรือหมายเหตุจากการตรวจสอบ (ไม่บังคับ)'"
            :rows="3"
          />
        </FormField>
      </div>

      <!-- Correction Notes -->
      <div
        v-if="correctionNotes || hasDiscrepancy"
        class="mb-4 rounded-xl border border-red-100 bg-red-50 p-4"
      >
        <FormField
          label="หมายเหตุสำหรับการส่งกลับ Manager"
          hint="จำเป็นเมื่อเลือก 'ส่งกลับให้ Manager ปรับแก้'"
        >
          <BaseTextarea
            v-model="correctionNotes"
            placeholder="ระบุสิ่งที่ต้องการให้ Manager แก้ไข..."
            :rows="3"
          />
        </FormField>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
        <ActionButton
          :permission="PERMISSIONS.VIEW_FINANCE"
          variant="secondary"
          size="lg"
          :disabled="isSubmitting"
          :loading="isSubmitting"
          class="border-red-200 text-red-700 hover:bg-red-50"
          @click="handleAuditSubmit('needs_correction')"
        >
          <template #icon><ArrowUturnLeftIcon class="h-5 w-5" /></template>
          ส่งกลับให้ Manager ปรับแก้
        </ActionButton>

        <ActionButton
          :permission="PERMISSIONS.VIEW_FINANCE"
          variant="secondary"
          size="lg"
          :disabled="isSubmitting || !canSubmitAudit"
          :loading="isSubmitting"
          class="border-amber-300 text-amber-800 hover:bg-amber-50"
          @click="handleAuditSubmit('audited_with_issues')"
        >
          <template #icon><ExclamationTriangleIcon class="h-5 w-5" /></template>
          ยืนยันพร้อมหมายเหตุ
        </ActionButton>

        <ActionButton
          :permission="PERMISSIONS.VIEW_FINANCE"
          variant="primary"
          size="lg"
          :disabled="isSubmitting || !canSubmitAudit"
          :loading="isSubmitting"
          @click="handleAuditSubmit('audited')"
        >
          <template #icon><CheckCircleIcon class="h-5 w-5" /></template>
          {{ isNeedsCorrection ? 'ส่งตรวจสอบใหม่' : 'ยืนยันการตรวจสอบ' }}
        </ActionButton>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════════════════
         AUDIT RESULT — Read-only
    ════════════════════════════════════════════════════════════════════════════ -->
    <section v-if="isAlreadyAudited" class="mt-2">
      <div class="mb-3 flex items-center gap-2">
        <ClipboardDocumentCheckIcon class="h-5 w-5 text-green-600" />
        <h2 class="text-base font-semibold text-gray-700">ผลการตรวจสอบ</h2>
        <BaseBadge :variant="workflowStatus === 'audited' ? 'success' : 'warning'" size="sm">
          {{ workflowStatus === 'audited' ? '✅ ผ่านการตรวจสอบ' : '⚠️ ผ่าน (มีหมายเหตุ)' }}
        </BaseBadge>
      </div>

      <!-- Balance Snapshot read-only -->
      <div class="mb-4">
        <h3 class="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">ยอดเงินในบัญชี Bank</h3>
        <BalanceSnapshot
          :opening-balance="openingBalance"
          :closing-balance="expectedClosingBalance"
          net-change-label="สุทธิรับชำระ (ระหว่างวัน)"
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
    </section>

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
        <div v-if="canSubmitAudit" class="border-t border-gray-100 pt-3">
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
  </div>
</template>
