<script setup lang="ts">
import { useBillPaymentStore } from '~/stores/bill-payment'
import { useLogger } from '~/composables/useLogger'
import { usePermissions } from '~/composables/usePermissions'
import { useBillPaymentHelpers } from '~/composables/useBillPaymentHelpers'
import { PERMISSIONS } from '~/types/permissions'
import type { CashVerificationRow } from '~/components/shared/CashVerificationTable.vue'
import { CheckCircleIcon, ClipboardDocumentCheckIcon } from '@heroicons/vue/24/outline'

const props = defineProps<{
  date: string
  currentUser: { uid: string; displayName: string }
}>()

const emit = defineEmits<{
  'step2-completed': []
}>()

const logger = useLogger('BPCashVerificationSection')
const store = useBillPaymentStore()
const {
  formatAmount,
  calculateExpectedCash,
  diffExpectedVsActual,
} = useBillPaymentHelpers()

// ─── Alerts ───────────────────────────────────────────────────────────────────
const errorMessage = ref('')

// ─── Workflow ─────────────────────────────────────────────────────────────────
/** Step 2 editable: step1 done but step2 not yet submitted */
const isStep2Active = computed(
  () =>
    store.getCurrentWorkflowStatus === 'step1_in_progress' &&
    !!store.currentSummary?.step1CompletedAt
)
/** Step 2 read-only: step2 has been submitted */
const isStep2ReadOnly = computed(() => !!store.currentSummary?.step2CompletedAt)

// ─── Transactions ─────────────────────────────────────────────────────────────
const dateTransactions = computed(() => store.getTransactionsByDate(props.date))

// ─── Step 2 form state ────────────────────────────────────────────────────────
const actualBillPaymentCash = ref<number>(0)
const actualServiceFeeCash = ref<number>(0)
const verificationNotes = ref('')
const isSubmittingStep2 = ref(false)

const expectedCash = computed(() => calculateExpectedCash(dateTransactions.value))
const expectedBillPaymentCash = computed(() => expectedCash.value.billPaymentCash)
const expectedServiceFeeCash = computed(() => expectedCash.value.serviceFeeCash)

const diffBillPayment = computed(() =>
  diffExpectedVsActual(expectedBillPaymentCash.value, actualBillPaymentCash.value)
)
const diffServiceFee = computed(() =>
  diffExpectedVsActual(expectedServiceFeeCash.value, actualServiceFeeCash.value)
)
const hasAnyDiscrepancy = computed(
  () => diffBillPayment.value.hasDiscrepancy || diffServiceFee.value.hasDiscrepancy
)
const isStep2FormValid = computed(
  () =>
    actualBillPaymentCash.value >= 0 &&
    actualServiceFeeCash.value >= 0 &&
    (!hasAnyDiscrepancy.value || verificationNotes.value.trim().length > 0)
)

// ─── CashVerificationTable rows ───────────────────────────────────────────────
const cashVerificationRows = computed<CashVerificationRow[]>(() => [
  {
    label: 'A. เงินสดรับชำระบิล',
    expected: expectedBillPaymentCash.value,
    managerActual: actualBillPaymentCash.value,
  },
  {
    label: 'B. ค่าธรรมเนียมสะสม',
    expected: expectedServiceFeeCash.value,
    managerActual: actualServiceFeeCash.value,
  },
])

const readOnlyCashVerificationRows = computed<CashVerificationRow[]>(() => [
  {
    label: 'A. เงินสดรับชำระบิล',
    expected: store.currentSummary?.step2ExpectedBillPaymentCash ?? 0,
    managerActual: store.currentSummary?.step2ActualBillPaymentCash ?? 0,
  },
  {
    label: 'B. ค่าธรรมเนียมสะสม',
    expected: store.currentSummary?.step2ExpectedServiceFeeCash ?? 0,
    managerActual: store.currentSummary?.step2ActualServiceFeeCash ?? 0,
  },
])

function onUpdateManagerActual(rowIndex: number, value: number) {
  if (rowIndex === 0) actualBillPaymentCash.value = value
  else if (rowIndex === 1) actualServiceFeeCash.value = value
}

// ─── Load existing Step 2 data ─────────────────────────────────────────────────
function loadExistingStep2Data() {
  if (store.currentSummary?.step2CompletedAt) {
    actualBillPaymentCash.value = store.currentSummary.step2ActualBillPaymentCash ?? 0
    actualServiceFeeCash.value = store.currentSummary.step2ActualServiceFeeCash ?? 0
    verificationNotes.value = store.currentSummary.step2VerificationNotes ?? ''
  }
}

onMounted(loadExistingStep2Data)
watch(() => store.currentSummary?.step2CompletedAt, loadExistingStep2Data)

// ─── Submit Step 2 ────────────────────────────────────────────────────────────
async function handleCompleteStep2() {
  if (!isStep2FormValid.value) return
  isSubmittingStep2.value = true
  errorMessage.value = ''
  try {
    await store.completeStep2(props.date, {
      step2ActualBillPaymentCash: actualBillPaymentCash.value,
      step2ActualServiceFeeCash: actualServiceFeeCash.value,
      step2VerificationNotes: verificationNotes.value || undefined,
      step2CompletedBy: props.currentUser.uid,
      step2CompletedByName: props.currentUser.displayName,
    })
    logger.log('Step 2 completed for', props.date)
    emit('step2-completed')
  } catch (err: any) {
    errorMessage.value = err.message ?? 'ไม่สามารถดำเนินการได้'
    logger.error('handleCompleteStep2', err)
  } finally {
    isSubmittingStep2.value = false
  }
}
</script>

<template>
  <div>
    <BaseAlert
      v-if="errorMessage"
      variant="error"
      :message="errorMessage"
      class="mb-4"
      @close="errorMessage = ''"
    />

    <!-- ═══════════════════════════════════════════════════════════════════════
         STEP 2 — Editable: ตรวจนับเงินสด
    ════════════════════════════════════════════════════════════════════════════ -->
    <section v-if="isStep2Active" class="mt-2">
      <div class="mb-4 flex items-center gap-3">
        <ClipboardDocumentCheckIcon class="h-5 w-5 text-blue-600" />
        <h2 class="text-base font-semibold text-gray-700">ขั้นตอนที่ 2 — ตรวจนับเงินสด</h2>
        <BaseBadge variant="warning" size="sm">⏳ รอตรวจนับ</BaseBadge>
      </div>

      <!-- Bank Account (read-only, not counted) -->
      <div class="mb-4 rounded-xl border border-gray-200 bg-white p-4">
        <div class="flex items-center justify-between">
          <div>
            <div class="font-medium text-gray-900">บัญชีธนาคาร</div>
            <div class="text-sm text-gray-500">ยอดจากระบบ (ไม่ต้องนับ)</div>
          </div>
          <div class="font-semibold text-blue-700">
            {{ formatAmount(store.currentBalance?.bankAccount ?? 0) }}
          </div>
        </div>
      </div>

      <!-- Cash Verification Table (manager-input) -->
      <div class="mb-4">
        <CashVerificationTable
          :rows="cashVerificationRows"
          mode="manager-input"
          @update:manager-actual="onUpdateManagerActual"
        />
      </div>

      <!-- หมายเหตุ (always visible) -->
      <div class="mb-4 rounded-xl border border-gray-200 bg-white p-4">
        <FormField
          label="หมายเหตุ/สาเหตุ"
          :hint="hasAnyDiscrepancy ? 'จำเป็นต้องระบุเมื่อมีส่วนต่าง' : 'หมายเหตุเพิ่มเติม (ไม่บังคับ)'"
        >
          <BaseTextarea
            v-model="verificationNotes"
            placeholder="ระบุสาเหตุของส่วนต่าง เช่น เงินสดขาด X บาท เนื่องจาก..."
            :rows="3"
          />
        </FormField>
      </div>

      <!-- Submit -->
      <div class="flex justify-end pb-4">
        <ActionButton
          :permission="PERMISSIONS.EDIT_FINANCE"
          variant="primary"
          size="lg"
          :disabled="!isStep2FormValid"
          :loading="isSubmittingStep2"
          @click="handleCompleteStep2"
        >
          <CheckCircleIcon class="h-5 w-5" />
          ยืนยันข้อมูล
        </ActionButton>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════════════════
         STEP 2 — Read-only summary (step2 submitted)
    ════════════════════════════════════════════════════════════════════════════ -->
    <section v-else-if="isStep2ReadOnly" class="mt-2">
      <div class="mb-3 flex items-center gap-2">
        <CheckCircleIcon class="h-5 w-5 text-green-600" />
        <h2 class="text-base font-semibold text-gray-700">ขั้นตอนที่ 2 — ผลการตรวจนับเงินสด</h2>
        <BaseBadge :variant="store.currentSummary?.step2HasDiscrepancies ? 'warning' : 'success'" size="sm">
          {{ store.currentSummary?.step2HasDiscrepancies ? 'มีส่วนต่าง' : 'ตรงกัน' }}
        </BaseBadge>
      </div>

      <!-- Bank Account (read-only) -->
      <div class="mb-4 rounded-xl border border-gray-200 bg-white p-4">
        <div class="flex items-center justify-between">
          <span class="text-gray-700">บัญชีธนาคาร</span>
          <span class="font-semibold text-blue-700">
            {{ formatAmount(store.currentBalance?.bankAccount ?? 0) }}
          </span>
        </div>
      </div>

      <!-- Cash Verification Table (manager-readonly) with notes inside -->
      <CashVerificationTable
        :rows="readOnlyCashVerificationRows"
        mode="manager-readonly"
        :verification-notes="store.currentSummary?.step2VerificationNotes"
      />
    </section>
  </div>
</template>
