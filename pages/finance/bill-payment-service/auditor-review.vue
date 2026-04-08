<script setup lang="ts">
import { useBillPaymentStore } from '~/stores/bill-payment'
import { useLogger } from '~/composables/useLogger'
import { usePermissions } from '~/composables/usePermissions'
import { useBillPaymentHelpers } from '~/composables/useBillPaymentHelpers'
import { PERMISSIONS, ROLES } from '~/types/permissions'
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentCheckIcon,
  BanknotesIcon,
  XCircleIcon,
  ArrowUturnLeftIcon,
} from '@heroicons/vue/24/outline'

definePageMeta({
  middleware: 'auth',
})

const logger = useLogger('BillPaymentAuditorReview')
const store = useBillPaymentStore()
const router = useRouter()
const route = useRoute()
const { can, hasAnyRole } = usePermissions()

const {
  formatAmount,
  formatTime,
  formatBillType,
  formatTransactionType,
  getStatusLabel,
  getStatusBadgeVariant,
  formatDiff,
} = useBillPaymentHelpers()

// ─── Access control ───────────────────────────────────────────────────────────
const isAuditor = computed(() => hasAnyRole([ROLES.AUDITOR]))
const isOwner = computed(() => hasAnyRole([ROLES.OWNER]))
const canAudit = computed(() => can(PERMISSIONS.VIEW_FINANCE) && (isAuditor.value || isOwner.value))

// ─── Date ─────────────────────────────────────────────────────────────────────
const today = new Date().toISOString().split('T')[0] ?? ''
const selectedDate = ref<string>((route.query.date as string) || today)

// ─── Alerts ───────────────────────────────────────────────────────────────────
const successMessage = ref('')
const errorMessage = ref('')

// ─── Workflow state ───────────────────────────────────────────────────────────
const workflowStatus = computed(() => store.getCurrentWorkflowStatus)
const isNeedsCorrection = computed(() => workflowStatus.value === 'needs_correction')

/** Auditor can act when step2 is done and audit not yet submitted (or needs_correction re-audit) */
const canSubmitAudit = computed(() =>
  store.isStep2Complete &&
  (!store.isAudited || isNeedsCorrection.value)
)

const isAlreadyAudited = computed(() => store.isAudited && !isNeedsCorrection.value)

// ─── Transactions ─────────────────────────────────────────────────────────────
const dateTransactions = computed(() => store.getTransactionsByDate(selectedDate.value))
const billPaymentTransactions = computed(() =>
  dateTransactions.value.filter((t: any) => t.transactionType === 'bill_payment')
)

// ─── Per-transaction checklist ────────────────────────────────────────────────
const txnChecked = ref<Record<string, boolean>>({})

function initChecklist() {
  const checked: Record<string, boolean> = {}
  billPaymentTransactions.value.forEach((txn: any) => {
    checked[txn.id] = txnChecked.value[txn.id] ?? false
  })
  txnChecked.value = checked
}

const checkedCount = computed(() => Object.values(txnChecked.value).filter(Boolean).length)
const txnsWithIssues = computed(() =>
  billPaymentTransactions.value.filter((txn: any) => txnChecked.value[txn.id] === false && txnChecked.value[txn.id] !== undefined).length
)
const allChecked = computed(() => {
  const ids = billPaymentTransactions.value.map((t: any) => t.id)
  return ids.length > 0 && ids.every((id: string) => txnChecked.value[id] === true)
})

// ─── Audit form fields ────────────────────────────────────────────────────────
const bankStatementAmount = ref<number>(0)
const auditFindings = ref('')
const correctionNotes = ref('')
const isSubmitting = ref(false)

// ─── Validation ───────────────────────────────────────────────────────────────
const bankBalanceMatches = computed(() => {
  const expected =
    (store.currentSummary?.step2ActualBillPaymentCash ?? 0) +
    (store.currentSummary?.step2ActualServiceFeeCash ?? 0)
  return bankStatementAmount.value === expected
})

const diffBankStatement = computed(() => {
  const expected =
    (store.currentSummary?.step2ActualBillPaymentCash ?? 0) +
    (store.currentSummary?.step2ActualServiceFeeCash ?? 0)
  return bankStatementAmount.value - expected
})

const hasDiscrepancy = computed(() => !bankBalanceMatches.value || !allChecked.value)

// ─── Submit helpers ───────────────────────────────────────────────────────────
function buildAuditData(outcome: 'audited' | 'audited_with_issues' | 'needs_correction') {
  return {
    outcome,
    auditBankStatementAmount: bankStatementAmount.value,
    auditBankBalanceMatches: bankBalanceMatches.value,
    auditFindings: auditFindings.value.trim() || undefined,
    auditTransactionsVerified: billPaymentTransactions.value.length,
    auditTransactionsWithIssues: billPaymentTransactions.value.filter((t: any) => !txnChecked.value[t.id]).length,
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
    await store.submitAudit(selectedDate.value, buildAuditData(outcome))
    const labels: Record<string, string> = {
      audited: 'ยืนยันการตรวจสอบเรียบร้อย',
      audited_with_issues: 'ยืนยันพร้อมหมายเหตุเรียบร้อย',
      needs_correction: 'ส่งกลับให้ Manager แก้ไขแล้ว',
    }
    successMessage.value = labels[outcome]
    logger.log('Audit submitted', outcome, selectedDate.value)

    if (outcome === 'needs_correction') {
      setTimeout(() => router.push('/finance/bill-payment-history'), 1500)
    }
  } catch (err: any) {
    errorMessage.value = err.message ?? 'เกิดข้อผิดพลาด'
    logger.error('handleAuditSubmit', err)
  } finally {
    isSubmitting.value = false
  }
}

// ─── Date change ──────────────────────────────────────────────────────────────
async function handleDateChange() {
  await router.replace({ query: { date: selectedDate.value } })
  await loadData()
}

async function loadData() {
  errorMessage.value = ''
  try {
    await Promise.all([
      store.fetchTransactionsByDate(selectedDate.value),
      store.fetchDailySummary(selectedDate.value),
      store.fetchBalanceByDate(selectedDate.value),
    ])
    initChecklist()

    // Pre-fill if re-auditing after needs_correction
    if (store.currentSummary?.auditBankStatementAmount) {
      bankStatementAmount.value = store.currentSummary.auditBankStatementAmount
    }
    if (store.currentSummary?.auditFindings) {
      auditFindings.value = store.currentSummary.auditFindings
    }
    if (store.currentSummary?.correctionNotes) {
      correctionNotes.value = store.currentSummary.correctionNotes
    }
  } catch (err: any) {
    errorMessage.value = err.message ?? 'โหลดข้อมูลไม่สำเร็จ'
    logger.error('loadData', err)
  }
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(async () => {
  await loadData()
})

watch(billPaymentTransactions, () => {
  initChecklist()
}, { deep: true })
</script>

<template>
  <PageWrapper
    title="ตรวจสอบรายการ — บริการรับชำระบิล"
    description="ตรวจสอบรายการและยืนยันยอดเงินสด (WF 3.2)"
    icon="🔍"
    :loading="store.isLoading"
    :error="store.error ?? undefined"
  >
    <template #actions>
      <BaseButton
        variant="secondary"
        size="sm"
        @click="router.push('/finance/bill-payment-history')"
      >
        ← ประวัติ
      </BaseButton>
      <div class="flex items-center gap-2">
        <label class="text-sm font-medium text-gray-700">วันที่:</label>
        <input
          v-model="selectedDate"
          type="date"
          class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500"
          @change="handleDateChange"
        />
      </div>
    </template>

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

    <!-- ── Access Denied ───────────────────────────────────────────────────── -->
    <BaseAlert
      v-if="!canAudit"
      variant="warning"
      message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้ — จำเป็นต้องเป็น Auditor หรือ Owner"
      class="mb-4"
    />

    <template v-else>

      <!-- ── Needs Correction Context Banner ──────────────────────────────── -->
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

      <!-- ── Not ready yet ────────────────────────────────────────────────── -->
      <BaseAlert
        v-if="!store.isStep2Complete"
        variant="warning"
        message="Manager ยังไม่ได้ตรวจนับเงินสด (ขั้นตอนที่ 2) — ยังไม่สามารถตรวจสอบได้"
        class="mb-4"
      />

      <!-- ── Already audited banner ───────────────────────────────────────── -->
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

      <!-- ═══════════════════════════════════════════════════════════════════
           STEP 1 — Read-only Transaction List
      ════════════════════════════════════════════════════════════════════════ -->
      <section class="mb-6">
        <div class="mb-3 flex items-center gap-2">
          <CheckCircleIcon class="h-5 w-5 text-green-600" />
          <h2 class="text-base font-semibold text-gray-700">
            ขั้นตอนที่ 1 — รายการที่บันทึก
          </h2>
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

      <!-- ═══════════════════════════════════════════════════════════════════
           STEP 2 — Read-only Cash Count Summary
      ════════════════════════════════════════════════════════════════════════ -->
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

        <div class="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
          <div class="grid grid-cols-3 gap-2 p-4 text-sm">
            <div>
              <div class="text-xs text-gray-500">เงินสดรับชำระบิล (คาดหวัง)</div>
              <div class="font-medium">{{ formatAmount(store.currentSummary?.step2ExpectedBillPaymentCash ?? 0) }}</div>
            </div>
            <div>
              <div class="text-xs text-gray-500">นับจริง</div>
              <div class="font-medium">{{ formatAmount(store.currentSummary?.step2ActualBillPaymentCash ?? 0) }}</div>
            </div>
            <div>
              <div class="text-xs text-gray-500">ส่วนต่าง</div>
              <div
                :class="[
                  'font-semibold',
                  (store.currentSummary?.step2ExpectedBillPaymentCash ?? 0) !== (store.currentSummary?.step2ActualBillPaymentCash ?? 0)
                    ? 'text-red-600' : 'text-green-600',
                ]"
              >
                {{ formatDiff((store.currentSummary?.step2ExpectedBillPaymentCash ?? 0) - (store.currentSummary?.step2ActualBillPaymentCash ?? 0)) }}
              </div>
            </div>
          </div>
          <div class="grid grid-cols-3 gap-2 p-4 text-sm">
            <div>
              <div class="text-xs text-gray-500">ค่าธรรมเนียม (คาดหวัง)</div>
              <div class="font-medium">{{ formatAmount(store.currentSummary?.step2ExpectedServiceFeeCash ?? 0) }}</div>
            </div>
            <div>
              <div class="text-xs text-gray-500">นับจริง</div>
              <div class="font-medium">{{ formatAmount(store.currentSummary?.step2ActualServiceFeeCash ?? 0) }}</div>
            </div>
            <div>
              <div class="text-xs text-gray-500">ส่วนต่าง</div>
              <div
                :class="[
                  'font-semibold',
                  (store.currentSummary?.step2ExpectedServiceFeeCash ?? 0) !== (store.currentSummary?.step2ActualServiceFeeCash ?? 0)
                    ? 'text-red-600' : 'text-green-600',
                ]"
              >
                {{ formatDiff((store.currentSummary?.step2ExpectedServiceFeeCash ?? 0) - (store.currentSummary?.step2ActualServiceFeeCash ?? 0)) }}
              </div>
            </div>
          </div>
          <div v-if="store.currentSummary?.step2VerificationNotes" class="p-4 text-sm">
            <div class="text-xs text-gray-500">หมายเหตุ Manager</div>
            <div class="mt-1 text-gray-700">{{ store.currentSummary.step2VerificationNotes }}</div>
          </div>
        </div>
      </section>

      <!-- ═══════════════════════════════════════════════════════════════════
           AUDITOR FORM — Active (step2 complete, not yet audited)
      ════════════════════════════════════════════════════════════════════════ -->
      <section v-if="canSubmitAudit" class="mt-2">
        <div class="mb-4 flex items-center gap-3">
          <ClipboardDocumentCheckIcon class="h-5 w-5 text-red-600" />
          <h2 class="text-base font-semibold text-gray-700">ตรวจสอบโดย Auditor</h2>
          <BaseBadge variant="warning" size="sm">⏳ รอการตรวจสอบ</BaseBadge>
        </div>

        <!-- ── Per-transaction checklist ──────────────────────────────── -->
        <div class="mb-4 rounded-xl border border-gray-200 bg-white shadow-sm">
          <div class="border-b border-gray-100 px-4 py-3">
            <div class="flex items-center justify-between">
              <h3 class="font-medium text-gray-800">รายการรับชำระบิล</h3>
              <span class="text-sm text-gray-500">
                ตรวจแล้ว {{ checkedCount }} / {{ billPaymentTransactions.length }} รายการ
              </span>
            </div>
            <p class="mt-1 text-xs text-gray-400">
              ทำเครื่องหมาย ✓ เมื่อรายการนั้นตรงกับ bank statement
            </p>
          </div>

          <EmptyState
            v-if="billPaymentTransactions.length === 0"
            title="ไม่มีรายการรับชำระบิล"
            description="วันนี้ไม่มีรายการรับชำระบิล"
            class="py-8"
          />

          <div v-else class="divide-y divide-gray-50">
            <div
              v-for="(txn, idx) in billPaymentTransactions"
              :key="txn.id"
              :class="[
                'flex items-center gap-4 px-4 py-3 transition-colors',
                txnChecked[txn.id] === true ? 'bg-green-50' : txnChecked[txn.id] === false ? 'bg-red-50' : '',
              ]"
            >
              <!-- Checkbox -->
              <input
                :id="`txn-${txn.id}`"
                v-model="txnChecked[txn.id]"
                type="checkbox"
                class="h-4 w-4 rounded accent-green-600 cursor-pointer"
              />

              <!-- Transaction info -->
              <label :for="`txn-${txn.id}`" class="flex flex-1 cursor-pointer items-center gap-3">
                <div class="flex-1">
                  <div class="text-sm font-medium text-gray-800">
                    {{ Number(idx) + 1 }}. {{ txn.customerName || formatBillType(txn.billType) || 'รับชำระบิล' }}
                  </div>
                  <div class="text-xs text-gray-500">{{ formatTime(txn.timestamp) }}</div>
                </div>
                <div class="text-right">
                  <div class="text-sm font-semibold text-gray-800">{{ formatAmount(txn.amount) }}</div>
                  <div class="text-xs text-gray-400">ค่าธรรมเนียม {{ formatAmount(txn.commission) }}</div>
                </div>
                <BaseBadge :variant="getStatusBadgeVariant(txn.status)" size="sm">
                  {{ getStatusLabel(txn.status) }}
                </BaseBadge>
                <!-- Check indicator -->
                <CheckCircleIcon
                  v-if="txnChecked[txn.id]"
                  class="h-5 w-5 flex-shrink-0 text-green-500"
                />
                <XCircleIcon
                  v-else-if="txnChecked[txn.id] === false"
                  class="h-5 w-5 flex-shrink-0 text-red-400"
                />
              </label>
            </div>
          </div>

          <!-- Summary row -->
          <div class="border-t border-gray-100 bg-gray-50 px-4 py-3">
            <div class="flex items-center justify-between text-sm">
              <span class="font-medium text-gray-700">ผลการตรวจรายการ</span>
              <BaseBadge :variant="allChecked ? 'success' : 'warning'">
                {{ allChecked ? '✅ ตรวจครบทุกรายการ' : `⏳ ยังตรวจไม่ครบ (${checkedCount}/${billPaymentTransactions.length})` }}
              </BaseBadge>
            </div>
          </div>
        </div>

        <!-- ── Bank Statement Balance Input ───────────────────────────── -->
        <div class="mb-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h3 class="mb-3 font-medium text-gray-800">
            <BanknotesIcon class="mr-1 inline h-4 w-4 text-blue-500" />
            ยอดเงินจาก Bank Statement
          </h3>

          <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div class="flex-1">
              <div class="text-sm text-gray-600">
                ระบุยอดเงินตาม statement ที่ตรวจสอบ
              </div>
              <div class="mt-1 text-xs text-gray-400">
                ยอดรวมเงินสด (Step 2):
                {{ formatAmount((store.currentSummary?.step2ActualBillPaymentCash ?? 0) + (store.currentSummary?.step2ActualServiceFeeCash ?? 0)) }}
              </div>
            </div>
            <div class="flex items-center gap-3">
              <div class="relative w-44">
                <BaseInput
                  v-model="bankStatementAmount"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                />
                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">บาท</span>
              </div>
              <div
                :class="[
                  'min-w-24 text-right text-sm font-semibold',
                  bankBalanceMatches ? 'text-green-600' : 'text-red-600',
                ]"
              >
                {{ formatDiff(diffBankStatement) }}
              </div>
            </div>
          </div>

          <div class="mt-3 flex items-center gap-2">
            <BaseBadge :variant="bankBalanceMatches ? 'success' : 'error'" size="sm">
              {{ bankBalanceMatches ? '✅ ยอดตรงกัน' : '⚠️ ยอดไม่ตรง' }}
            </BaseBadge>
          </div>
        </div>

        <!-- ── Audit Findings ─────────────────────────────────────────── -->
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

        <!-- ── Correction Notes (needs_correction flow) ───────────────── -->
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

        <!-- ── Action Buttons ─────────────────────────────────────────── -->
        <div class="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">

          <!-- Send back for correction (requires correctionNotes) -->
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

          <!-- Confirm with issues (requires auditFindings) -->
          <ActionButton
            :permission="PERMISSIONS.VIEW_FINANCE"
            variant="secondary"
            size="lg"
            :disabled="isSubmitting"
            :loading="isSubmitting"
            class="border-amber-300 text-amber-800 hover:bg-amber-50"
            @click="handleAuditSubmit('audited_with_issues')"
          >
            <template #icon><ExclamationTriangleIcon class="h-5 w-5" /></template>
            ยืนยันพร้อมหมายเหตุ
          </ActionButton>

          <!-- Clean confirm -->
          <ActionButton
            :permission="PERMISSIONS.VIEW_FINANCE"
            variant="primary"
            size="lg"
            :disabled="isSubmitting"
            :loading="isSubmitting"
            @click="handleAuditSubmit('audited')"
          >
            <template #icon><CheckCircleIcon class="h-5 w-5" /></template>
            ยืนยันการตรวจสอบ
          </ActionButton>

        </div>
      </section>

      <!-- ═══════════════════════════════════════════════════════════════════
           AUDIT RESULT — Read-only (already audited)
      ════════════════════════════════════════════════════════════════════════ -->
      <section v-if="isAlreadyAudited" class="mt-2">
        <div class="mb-3 flex items-center gap-2">
          <ClipboardDocumentCheckIcon class="h-5 w-5 text-green-600" />
          <h2 class="text-base font-semibold text-gray-700">ผลการตรวจสอบ</h2>
        </div>

        <div class="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">

          <!-- Status -->
          <div class="p-4">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-gray-700">ผลการตรวจสอบ</span>
              <BaseBadge
                :variant="workflowStatus === 'audited' ? 'success' : 'warning'"
              >
                {{
                  workflowStatus === 'audited'
                    ? '✅ ผ่านการตรวจสอบ'
                    : '⚠️ ผ่าน (มีหมายเหตุ)'
                }}
              </BaseBadge>
            </div>
          </div>

          <!-- Bank statement -->
          <div v-if="store.currentSummary?.auditBankStatementAmount" class="p-4 text-sm">
            <div class="flex items-center justify-between">
              <span class="text-gray-600">ยอด Bank Statement</span>
              <span class="font-semibold text-blue-700">
                {{ formatAmount(store.currentSummary.auditBankStatementAmount) }}
              </span>
            </div>
            <div class="mt-1 flex items-center justify-between">
              <span class="text-gray-600">ยอดตรงกัน</span>
              <BaseBadge
                :variant="store.currentSummary?.auditBankBalanceMatches ? 'success' : 'warning'"
                size="sm"
              >
                {{ store.currentSummary?.auditBankBalanceMatches ? '✅ ใช่' : '⚠️ ไม่ตรง' }}
              </BaseBadge>
            </div>
          </div>

          <!-- Transactions verified -->
          <div class="p-4 text-sm">
            <div class="flex items-center justify-between">
              <span class="text-gray-600">รายการที่ตรวจสอบ</span>
              <span class="font-medium">
                {{ store.currentSummary?.auditTransactionsVerified ?? 0 }} รายการ
                <template v-if="(store.currentSummary?.auditTransactionsWithIssues ?? 0) > 0">
                  <span class="text-red-600">
                    (พบปัญหา {{ store.currentSummary?.auditTransactionsWithIssues }} รายการ)
                  </span>
                </template>
              </span>
            </div>
          </div>

          <!-- Findings -->
          <div v-if="store.currentSummary?.auditFindings" class="p-4 text-sm">
            <div class="text-xs text-gray-500">ผลการตรวจสอบ / หมายเหตุ</div>
            <div class="mt-1 whitespace-pre-wrap text-gray-700">{{ store.currentSummary.auditFindings }}</div>
          </div>

          <!-- Audited by -->
          <div class="bg-gray-50 p-4 text-xs text-gray-500">
            ตรวจสอบโดย {{ store.currentSummary?.auditedByName ?? '-' }}
            <template v-if="store.currentSummary?.auditedAt">
              · {{ new Date(store.currentSummary.auditedAt).toLocaleString('th-TH') }}
            </template>
          </div>
        </div>

        <!-- Owner approval CTA -->
        <div v-if="isOwner && !store.isApproved" class="mt-4 flex justify-end">
          <BaseButton
            variant="primary"
            @click="router.push({ path: '/finance/bill-payment-service/owner-approval', query: { date: selectedDate } })"
          >
            ไปหน้าอนุมัติ →
          </BaseButton>
        </div>
      </section>

    </template>
  </PageWrapper>
</template>
