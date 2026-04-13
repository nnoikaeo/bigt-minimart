<script setup lang="ts">
import { useMoneyTransferStore } from '~/stores/money-transfer'
import { useLogger } from '~/composables/useLogger'
import { usePermissions } from '~/composables/usePermissions'
import { PERMISSIONS, ROLES } from '~/types/permissions'
import type { CashVerificationRow } from '~/components/shared/CashVerificationTable.vue'
import { CheckCircleIcon } from '@heroicons/vue/24/outline'

const props = defineProps<{ date: string }>()

const logger = useLogger('CashVerificationSection')
const store = useMoneyTransferStore()
const router = useRouter()
const { hasAnyRole } = usePermissions()

const isManagerOrAsst = computed(() => hasAnyRole([ROLES.MANAGER, ROLES.ASSISTANT_MANAGER]))
const isAuditor = computed(() => hasAnyRole([ROLES.AUDITOR]))
const isOwner = computed(() => hasAnyRole([ROLES.OWNER]))
const canEditCashCount = computed(() => isManagerOrAsst.value && !store.isStep2Complete)

// ─── Alert ────────────────────────────────────────────────────────────────────
const errorMessage = ref('')

// ─── Step 2 form state ────────────────────────────────────────────────────────
const actualTransferWithdrawal = ref<number>(0)
const actualServiceFee = ref<number>(0)
const verificationStatus = ref<'match' | 'discrepancy' | ''>('')
const verificationNotes = ref('')
const followUpAction = ref('')
const isSubmittingStep2 = ref(false)

const { formatCurrency } = useMoneyTransferHelpers()

// ─── Derived from transactions ────────────────────────────────────────────────
const dateTransactions = computed(() => store.getTransactionsByDate(props.date))
const completedTransactions = computed(() =>
  dateTransactions.value.filter((t: any) => t.status === 'completed')
)

const expectedTransferWithdrawal = computed(() =>
  completedTransactions.value
    .filter((t: any) => t.transactionType !== 'owner_deposit')
    .reduce((sum: number, t: any) => {
      if (t.transactionType === 'transfer') return sum + t.amount
      if (t.transactionType === 'withdrawal') return sum - t.amount
      return sum
    }, 0)
)
const expectedServiceFee = computed(() =>
  completedTransactions.value
    .filter((t: any) => t.commission && t.commissionType === 'cash')
    .reduce((sum: number, t: any) => sum + (t.commission || 0), 0)
)
const expectedServiceFeeTransfer = computed(() =>
  completedTransactions.value
    .filter((t: any) => t.commission && t.commissionType === 'transfer')
    .reduce((sum: number, t: any) => sum + (t.commission || 0), 0)
)

const expectedTotal = computed(() => expectedTransferWithdrawal.value + expectedServiceFee.value)
const actualTotal = computed(() => Number(actualTransferWithdrawal.value) + Number(actualServiceFee.value))
const diffTransferWithdrawal = computed(() => Number(actualTransferWithdrawal.value) - expectedTransferWithdrawal.value)
const diffServiceFee = computed(() => Number(actualServiceFee.value) - expectedServiceFee.value)
const diffTotal = computed(() => actualTotal.value - expectedTotal.value)
const hasDiscrepancy = computed(() => diffTotal.value !== 0)

const isStep2FormValid = computed(() =>
  Number(actualTransferWithdrawal.value) >= 0 &&
  Number(actualServiceFee.value) >= 0 &&
  verificationStatus.value !== ''
)

const cashVerificationSummary = computed(() => {
  const hasDiscrep = store.currentSummary?.step2?.hasDiscrepancies
  return `คาดไว้ ${formatCurrency(expectedTotal.value)} · ${hasDiscrep ? 'มีผลต่าง' : 'ตรงกัน'}`
})

const mtCashVerificationRows = computed<CashVerificationRow[]>(() => {
  const actualCash = store.currentSummary?.step2?.actualCash
  return [
    { label: 'A. เงินสดจากโอน/ถอนเงิน', expected: expectedTransferWithdrawal.value, managerActual: actualCash?.transferWithdrawal ?? null },
    { label: 'B. ค่าบริการ (เงินสด)', expected: expectedServiceFee.value, managerActual: actualCash?.serviceFee ?? null },
  ]
})

// Auto-set verificationStatus when actual values change
watch(hasDiscrepancy, (val) => {
  if (actualTotal.value > 0) {
    verificationStatus.value = val ? 'discrepancy' : 'match'
  }
})

// ─── Helpers ──────────────────────────────────────────────────────────────────
function diffClass(diff: number): string {
  if (diff === 0) return 'text-green-700'
  if (diff > 0) return 'text-blue-700'
  return 'text-red-700'
}
function diffSign(diff: number): string {
  if (diff > 0) return '+' + formatCurrency(diff)
  if (diff < 0) return formatCurrency(diff)
  return '✓ ตรง'
}

// ─── Load existing step 2 data ────────────────────────────────────────────────
function loadExistingStep2Data() {
  if (store.currentSummary?.step2) {
    const step2 = store.currentSummary.step2
    actualTransferWithdrawal.value = step2.actualCash?.transferWithdrawal ?? 0
    actualServiceFee.value = step2.actualCash?.serviceFee ?? 0
    verificationNotes.value = step2.verificationNotes ?? ''
    verificationStatus.value = step2.hasDiscrepancies ? 'discrepancy' : 'match'
  }
}

watch(() => store.currentSummary?.step2, () => {
  if (store.isStep2Complete) loadExistingStep2Data()
}, { immediate: true })

// ─── Submit ───────────────────────────────────────────────────────────────────
async function handleConfirmVerification() {
  if (!isStep2FormValid.value) return
  isSubmittingStep2.value = true
  try {
    await store.completeStep2(props.date, {
      actualCash: {
        transferWithdrawal: Number(actualTransferWithdrawal.value),
        serviceFee: Number(actualServiceFee.value),
      },
      verificationNotes: verificationNotes.value
        ? `${verificationNotes.value}${followUpAction.value ? '\n\nการดำเนินการต่อ: ' + followUpAction.value : ''}`
        : followUpAction.value ? `การดำเนินการต่อ: ${followUpAction.value}` : '',
    })
    logger.log('Step 2 completed')
    router.push('/finance/money-transfer-history')
  } catch (err: any) {
    errorMessage.value = err.message || 'เกิดข้อผิดพลาด'
    logger.error('Failed to complete Step 2', err)
  } finally {
    isSubmittingStep2.value = false
  }
}
</script>

<template>
  <div>
    <BaseAlert v-if="errorMessage" variant="error" :message="errorMessage" class="mb-4" @close="errorMessage = ''" />

    <!-- CASE A: Editable form (Manager/AM when step 2 not done) -->
    <section
      v-if="canEditCashCount && !isOwner && !(isAuditor && store.isStep2Complete)"
      id="cash-counting-section"
      class="mt-2"
    >
      <div class="flex items-center gap-3 mb-4">
        <h2 class="text-base font-semibold text-gray-700">💵 ผลการตรวจนับเงินสด</h2>
        <BaseBadge variant="warning" size="sm">⏳ รอตรวจนับ</BaseBadge>
      </div>

      <div class="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 mb-4">
        <!-- A: Transfer/Withdrawal -->
        <div class="p-4">
          <div class="flex flex-col sm:flex-row sm:items-center gap-4">
            <div class="flex-1">
              <div class="font-medium text-gray-900 mb-0.5">A. เงินสดจากโอน/ถอนเงิน</div>
              <div class="text-sm text-gray-500">คาดหวัง: {{ formatCurrency(expectedTransferWithdrawal) }}</div>
            </div>
            <div class="flex items-center gap-3">
              <FormField>
                <div class="relative w-40">
                  <BaseInput v-model="actualTransferWithdrawal" type="number" placeholder="0" />
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">บาท</span>
                </div>
              </FormField>
              <div :class="['text-sm font-semibold min-w-20 text-right', diffClass(diffTransferWithdrawal)]">
                {{ diffSign(diffTransferWithdrawal) }}
              </div>
            </div>
          </div>
        </div>

        <!-- B: Service Fee -->
        <div class="p-4">
          <div class="flex flex-col sm:flex-row sm:items-center gap-4">
            <div class="flex-1">
              <div class="font-medium text-gray-900 mb-0.5">B. ค่าบริการ (เงินสด)</div>
              <div class="text-sm text-gray-500">คาดหวัง: {{ formatCurrency(expectedServiceFee) }}</div>
            </div>
            <div class="flex items-center gap-3">
              <FormField>
                <div class="relative w-40">
                  <BaseInput v-model="actualServiceFee" type="number" placeholder="0" />
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">บาท</span>
                </div>
              </FormField>
              <div :class="['text-sm font-semibold min-w-20 text-right', diffClass(diffServiceFee)]">
                {{ diffSign(diffServiceFee) }}
              </div>
            </div>
          </div>
        </div>

        <!-- C: Service Fee Transfer (info only) -->
        <div class="p-4 bg-gray-50">
          <div class="flex flex-col sm:flex-row sm:items-center gap-4">
            <div class="flex-1">
              <div class="font-medium text-gray-600 mb-0.5">C. ค่าบริการ (โอน)</div>
              <div class="text-sm text-gray-500">ตรวจสอบเงินในบัญชี</div>
            </div>
            <div class="text-sm font-semibold text-gray-700">คาดหวัง: {{ formatCurrency(expectedServiceFeeTransfer) }}</div>
          </div>
        </div>

        <!-- Total Row -->
        <div class="p-4 bg-gray-50">
          <div class="flex flex-col sm:flex-row sm:items-center gap-4">
            <div class="flex-1 font-semibold text-gray-900">รวมเงินสดทั้งหมด</div>
            <div class="flex items-center gap-3">
              <div class="w-40 px-3 py-2 bg-gray-100 rounded-lg text-right font-bold text-gray-900">
                {{ formatCurrency(actualTotal) }}
              </div>
              <div :class="['text-sm font-bold min-w-20 text-right', diffClass(diffTotal)]">
                {{ diffSign(diffTotal) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Notes (only when discrepancy or already typed) -->
      <div v-if="verificationStatus === 'discrepancy' || verificationNotes" class="bg-white border border-gray-200 rounded-xl p-4 space-y-3 mb-4">
        <FormField
          label="หมายเหตุ/สาเหตุ"
          :hint="verificationStatus === 'discrepancy' ? 'กรุณาระบุสาเหตุของผลต่างที่พบ' : ''"
        >
          <BaseTextarea
            v-model="verificationNotes"
            :placeholder="verificationStatus === 'discrepancy' ? 'ระบุสาเหตุของผลต่าง เช่น เงินสดขาด X บาท เนื่องจาก...' : 'หมายเหตุเพิ่มเติม (ไม่บังคับ)'"
            :rows="3"
          />
        </FormField>
        <FormField v-if="verificationStatus === 'discrepancy'" label="การดำเนินการต่อ">
          <BaseTextarea v-model="followUpAction" placeholder="แผนการดำเนินการต่อ เช่น ตรวจสอบเพิ่มเติมในรอบถัดไป..." :rows="2" />
        </FormField>
      </div>

      <!-- Confirm Button -->
      <div class="flex justify-center pb-6">
        <ActionButton
          :permission="PERMISSIONS.EDIT_FINANCE"
          variant="primary"
          size="lg"
          :disabled="!isStep2FormValid"
          :loading="isSubmittingStep2"
          @click="handleConfirmVerification"
        >
          <CheckCircleIcon class="w-5 h-5" />
          ยืนยัน
        </ActionButton>
      </div>
    </section>

    <!-- CASE B: Read-only CollapsibleSection (collapsed) -->
    <CollapsibleSection
      v-if="store.isStep2Complete && !canEditCashCount && !isAuditor && !store.isApproved && !(isOwner && store.isAudited)"
      icon="💵"
      title="ผลการตรวจนับเงินสด"
      :badge="{ label: '✅ เสร็จสมบูรณ์', variant: 'success' }"
      :summary="cashVerificationSummary"
      class="mt-2"
    >
      <div class="-mx-6 -my-4">
        <CashVerificationTable
          :rows="mtCashVerificationRows"
          mode="manager-readonly"
          :verification-notes="store.currentSummary?.step2?.verificationNotes"
        />
      </div>
    </CollapsibleSection>
  </div>
</template>
