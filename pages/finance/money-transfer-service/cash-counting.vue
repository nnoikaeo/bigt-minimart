<script setup lang="ts">
import { useMoneyTransferStore } from '~/stores/money-transfer'
import { useLogger } from '~/composables/useLogger'
import { usePermissions } from '~/composables/usePermissions'
import { PERMISSIONS } from '~/types/permissions'
import { ArrowLeftIcon, CheckCircleIcon, EyeIcon } from '@heroicons/vue/24/outline'

definePageMeta({
  middleware: ['auth', 'step1-required'],
})

const logger = useLogger('MoneyTransferStep2')
const store = useMoneyTransferStore()
const router = useRouter()
usePermissions()

// ─── State ───────────────────────────────────────────────────────────────────
const selectedDate = ref<string>(new Date().toISOString().split('T')[0] ?? '')
const isSubmitting = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

// Actual cash counts
const actualTransferWithdrawal = ref<number>(0)
const actualServiceFee = ref<number>(0)

// Verification notes
const verificationStatus = ref<'match' | 'discrepancy' | ''>('')
const verificationNotes = ref('')
const followUpAction = ref('')

// Transaction detail modal
const showDetailModal = ref(false)
const viewingTransaction = ref<any>(null)

// ─── Computed ─────────────────────────────────────────────────────────────────
const completedTransactions = computed(() => {
  return store.getTransactionsByDate(selectedDate.value)
    .filter((t: any) => t.status === 'completed')
})

// Expected from Step 1 system calculations
const expectedTransferWithdrawal = computed(() => {
  return completedTransactions.value
    .filter((t: any) => t.transactionType !== 'owner_deposit')
    .reduce((sum: number, t: any) => {
      if (t.transactionType === 'transfer') return sum + t.amount
      if (t.transactionType === 'withdrawal') return sum - t.amount
      return sum
    }, 0)
})

const expectedServiceFee = computed(() => {
  return completedTransactions.value
    .filter((t: any) => t.commission && t.commissionType === 'cash')
    .reduce((sum: number, t: any) => sum + (t.commission || 0), 0)
})

const expectedServiceFeeTransfer = computed(() => {
  return completedTransactions.value
    .filter((t: any) => t.commission && t.commissionType === 'transfer')
    .reduce((sum: number, t: any) => sum + (t.commission || 0), 0)
})

const expectedTotal = computed(() => expectedTransferWithdrawal.value + expectedServiceFee.value)

const actualTotal = computed(() => actualTransferWithdrawal.value + actualServiceFee.value)

const diffTransferWithdrawal = computed(() => actualTransferWithdrawal.value - expectedTransferWithdrawal.value)
const diffServiceFee = computed(() => actualServiceFee.value - expectedServiceFee.value)
const diffTotal = computed(() => actualTotal.value - expectedTotal.value)

const hasDiscrepancy = computed(() => diffTotal.value !== 0)

const isFormValid = computed(() =>
  actualTransferWithdrawal.value >= 0 &&
  actualServiceFee.value >= 0 &&
  verificationStatus.value !== ''
)

// ─── Helpers ─────────────────────────────────────────────────────────────────
const { formatCurrency, formatTime, getTransactionTypeLabel, getChannelLabel } =
  useMoneyTransferHelpers()

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

// ─── Actions ──────────────────────────────────────────────────────────────────
async function handleDateChange() {
  try {
    await store.fetchTransactionsByDate(selectedDate.value)
    await store.fetchDailySummary(selectedDate.value)
    loadExistingStep2Data()
  } catch (err: any) {
    errorMessage.value = err.message || 'เกิดข้อผิดพลาด'
  }
}

function loadExistingStep2Data() {
  if (store.currentSummary?.step2) {
    const step2 = store.currentSummary.step2
    actualTransferWithdrawal.value = step2.actualCash?.transferWithdrawal ?? 0
    actualServiceFee.value = step2.actualCash?.serviceFee ?? 0
    verificationNotes.value = step2.verificationNotes ?? ''
    verificationStatus.value = step2.hasDiscrepancies ? 'discrepancy' : 'match'
  }
}

async function handleConfirmVerification() {
  if (!isFormValid.value) return
  isSubmitting.value = true
  try {
    await store.completeStep2(selectedDate.value, {
      actualCash: {
        transferWithdrawal: actualTransferWithdrawal.value,
        serviceFee: actualServiceFee.value,
      },
      verificationNotes: verificationNotes.value
        ? `${verificationNotes.value}${followUpAction.value ? '\n\nการดำเนินการต่อ: ' + followUpAction.value : ''}`
        : followUpAction.value
          ? `การดำเนินการต่อ: ${followUpAction.value}`
          : '',
    })
    successMessage.value = 'ยืนยัน Step 2 สำเร็จ — ส่งให้ Auditor ตรวจสอบได้เลย'
    logger.log('Step 2 completed')
  } catch (err: any) {
    errorMessage.value = err.message || 'เกิดข้อผิดพลาด'
    logger.error('Failed to complete Step 2', err)
  } finally {
    isSubmitting.value = false
  }
}

function openDetailModal(txn: any) {
  viewingTransaction.value = txn
  showDetailModal.value = true
}

function goToAuditReview() {
  router.push('/finance/money-transfer-service/auditor-review')
}

// ─── Init ─────────────────────────────────────────────────────────────────────
onMounted(async () => {
  try {
    await store.initializeStore()
    if (selectedDate.value) {
      await store.fetchTransactionsByDate(selectedDate.value)
      await store.fetchDailySummary(selectedDate.value)
      loadExistingStep2Data()
    }
  } catch (err: any) {
    errorMessage.value = err.message || 'เกิดข้อผิดพลาด'
  }
})
</script>

<template>
  <PageWrapper
    title="ตรวจนับเงินสดจริง"
    description="Step 2: เปรียบเทียบยอดเงินสดจริงกับที่ระบบคำนวณ"
    icon="💰"
    :loading="store.isLoading"
    :error="store.error"
  >
    <template #actions>
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

    <BaseAlert v-if="successMessage" variant="success" :message="successMessage" :auto-close="true" class="mb-4" @close="successMessage = ''" />
    <BaseAlert v-if="errorMessage" variant="error" :message="errorMessage" class="mb-4" @close="errorMessage = ''" />

    <!-- Step 1 Prerequisite Check -->
    <BaseAlert
      v-if="!store.isStep1Complete"
      variant="warning"
      title="Step 1 ยังไม่เสร็จสมบูรณ์"
      message="กรุณาดำเนินการ Step 1 ให้เสร็จก่อนมาที่ Step 2"
      :dismissible="false"
      class="mb-6"
    />

    <template v-if="store.isStep1Complete">
      <!-- ── Step 1 Expected Balances ──────────────────────────────────── -->
      <section class="mb-6">
        <h2 class="text-base font-semibold text-gray-700 mb-3">📊 ยอดที่ระบบคำนวณจาก Step 1 (Expected)</h2>
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="text-center">
              <div class="text-sm text-blue-700 mb-1">เงินสดโอน/ถอน (Expected)</div>
              <div class="text-xl font-bold text-blue-900">{{ formatCurrency(expectedTransferWithdrawal) }}</div>
            </div>
            <div class="text-center">
              <div class="text-sm text-blue-700 mb-1">ค่าบริการ เงินสด (Expected)</div>
              <div class="text-xl font-bold text-blue-900">{{ formatCurrency(expectedServiceFee) }}</div>
            </div>
            <div class="text-center">
              <div class="text-sm text-blue-700 mb-1">ค่าบริการ โอน (ไม่นับเงินสด)</div>
              <div class="text-xl font-bold text-blue-900">{{ formatCurrency(expectedServiceFeeTransfer) }}</div>
            </div>
            <div class="text-center border-t sm:border-t-0 sm:border-l border-blue-200 pt-3 sm:pt-0 sm:pl-4">
              <div class="text-sm text-blue-700 mb-1">รวมเงินสดทั้งหมด (Expected)</div>
              <div class="text-2xl font-bold text-blue-900">{{ formatCurrency(expectedTotal) }}</div>
            </div>
          </div>
          <div class="mt-3 text-sm text-blue-600 text-center">
            จำนวนธุรกรรม: {{ completedTransactions.length }} รายการ
          </div>
        </div>
      </section>

      <!-- ── Step 2 Already Completed ──────────────────────────────────── -->
      <template v-if="store.isStep2Complete">
        <BaseAlert
          variant="success"
          title="Step 2 เสร็จสมบูรณ์"
          message="ยืนยันการตรวจนับเงินสดแล้ว — รอ Auditor ตรวจสอบ"
          :dismissible="false"
          class="mb-6"
        />

        <!-- Summary display -->
        <div class="bg-white border border-gray-200 rounded-xl p-5 mb-6 space-y-3 text-sm">
          <h3 class="font-semibold text-gray-800 text-base">ผลการตรวจนับ</h3>
          <div v-if="store.currentSummary?.step2" class="space-y-2">
            <div class="flex justify-between py-2 border-b border-gray-100">
              <span class="text-gray-600">เงินสดโอน/ถอน (นับจริง)</span>
              <span class="font-semibold">{{ formatCurrency(store.currentSummary.step2.actualCash?.transferWithdrawal ?? 0) }}</span>
            </div>
            <div class="flex justify-between py-2 border-b border-gray-100">
              <span class="text-gray-600">ค่าบริการ เงินสด (นับจริง)</span>
              <span class="font-semibold">{{ formatCurrency(store.currentSummary.step2.actualCash?.serviceFee ?? 0) }}</span>
            </div>
            <div class="flex justify-between py-2">
              <span class="text-gray-700 font-medium">ผลต่างรวม</span>
              <BaseBadge :variant="store.currentSummary.step2.hasDiscrepancies ? 'warning' : 'success'" size="md">
                {{ store.currentSummary.step2.hasDiscrepancies ? '⚠️ มีผลต่าง' : '✅ ตรงกัน' }}
              </BaseBadge>
            </div>
            <div v-if="store.currentSummary.step2.verificationNotes" class="bg-gray-50 rounded-lg p-3 text-gray-600 text-sm">
              <strong>หมายเหตุ:</strong> {{ store.currentSummary.step2.verificationNotes }}
            </div>
          </div>
        </div>

        <div class="flex justify-center">
          <BaseButton variant="success" size="lg" @click="goToAuditReview">
            ส่งให้ Auditor ตรวจสอบ →
          </BaseButton>
        </div>
      </template>

      <!-- ── Step 2 Form ─────────────────────────────────────────────────── -->
      <template v-else>
        <!-- A. Actual Cash Count -->
        <section class="mb-6">
          <h2 class="text-base font-semibold text-gray-700 mb-3">💵 นับเงินสดจริง (Actual)</h2>
          <div class="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
            <!-- A: Transfer/Withdrawal -->
            <div class="p-4">
              <div class="flex flex-col sm:flex-row sm:items-center gap-4">
                <div class="flex-1">
                  <div class="font-medium text-gray-900 mb-0.5">A. เงินสดจากโอน/ถอนเงิน</div>
                  <div class="text-sm text-gray-500">Expected: {{ formatCurrency(expectedTransferWithdrawal) }}</div>
                </div>
                <div class="flex items-center gap-3">
                  <FormField>
                    <div class="relative w-40">
                      <BaseInput
                        v-model="actualTransferWithdrawal"
                        type="number"
                        placeholder="0"
                      />
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
                  <div class="text-sm text-gray-500">Expected: {{ formatCurrency(expectedServiceFee) }}</div>
                </div>
                <div class="flex items-center gap-3">
                  <FormField>
                    <div class="relative w-40">
                      <BaseInput
                        v-model="actualServiceFee"
                        type="number"
                        placeholder="0"
                      />
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
                  <div class="text-sm text-gray-500">ตรวจสอบผ่าน Bank Statement</div>
                </div>
                <div class="text-sm font-semibold text-gray-700">
                  Expected: {{ formatCurrency(expectedServiceFeeTransfer) }}
                </div>
              </div>
            </div>

            <!-- Total Row -->
            <div class="p-4 bg-gray-50">
              <div class="flex flex-col sm:flex-row sm:items-center gap-4">
                <div class="flex-1">
                  <div class="font-semibold text-gray-900">รวมเงินสดทั้งหมด</div>
                </div>
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
        </section>

        <!-- Discrepancy Alert -->
        <section class="mb-6">
          <BaseAlert
            v-if="hasDiscrepancy && (actualTransferWithdrawal > 0 || actualServiceFee > 0)"
            variant="warning"
            title="พบผลต่าง"
            :message="`ผลต่างรวม ${diffTotal > 0 ? '+' : ''}${formatCurrency(diffTotal)} — กรุณาระบุหมายเหตุ`"
            :dismissible="false"
          />
          <BaseAlert
            v-else-if="!hasDiscrepancy && actualTotal > 0"
            variant="success"
            message="✅ ยอดเงินสดตรงกับที่คำนวณทั้งหมด"
            :dismissible="false"
          />
        </section>

        <!-- Verification Notes -->
        <section class="mb-6">
          <h2 class="text-base font-semibold text-gray-700 mb-3">📝 บันทึกผลการตรวจ</h2>
          <div class="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
            <FormField label="ผลการตรวจนับ" required>
              <div class="space-y-2">
                <label class="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-green-50 transition-colors"
                  :class="verificationStatus === 'match' ? 'border-green-500 bg-green-50' : ''">
                  <input v-model="verificationStatus" type="radio" value="match" class="accent-green-600" />
                  <span class="text-green-700 font-medium">✅ ยอดตรงกันทั้งหมด</span>
                </label>
                <label class="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-amber-50 transition-colors"
                  :class="verificationStatus === 'discrepancy' ? 'border-amber-500 bg-amber-50' : ''">
                  <input v-model="verificationStatus" type="radio" value="discrepancy" class="accent-amber-600" />
                  <span class="text-amber-700 font-medium">⚠️ พบผลต่าง</span>
                </label>
              </div>
            </FormField>

            <FormField
              v-if="verificationStatus"
              label="หมายเหตุ/สาเหตุ"
              :hint="verificationStatus === 'discrepancy' ? 'กรุณาระบุสาเหตุของผลต่างที่พบ' : ''"
            >
              <BaseTextarea
                v-model="verificationNotes"
                :placeholder="verificationStatus === 'discrepancy' ? 'ระบุสาเหตุของผลต่าง เช่น เงินสดขาด X บาท เนื่องจาก...' : 'หมายเหตุเพิ่มเติม (ไม่บังคับ)'"
                :rows="3"
              />
            </FormField>

            <FormField
              v-if="verificationStatus === 'discrepancy'"
              label="การดำเนินการต่อ"
            >
              <BaseTextarea
                v-model="followUpAction"
                placeholder="แผนการดำเนินการต่อ เช่น ตรวจสอบเพิ่มเติมในรอบถัดไป..."
                :rows="2"
              />
            </FormField>
          </div>
        </section>

        <!-- Reference Transactions Table -->
        <section class="mb-6">
          <div class="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div class="px-4 py-3 border-b border-gray-100">
              <h2 class="text-base font-semibold text-gray-700">📖 รายการอ้างอิงจาก Step 1 (อ่านอย่างเดียว)</h2>
            </div>
            <div class="overflow-x-auto">
              <table v-if="completedTransactions.length > 0" class="w-full text-sm">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="text-left px-4 py-3 font-medium text-gray-600">เวลา</th>
                    <th class="text-left px-4 py-3 font-medium text-gray-600">ประเภท</th>
                    <th class="text-left px-4 py-3 font-medium text-gray-600">ช่องทาง</th>
                    <th class="text-right px-4 py-3 font-medium text-gray-600">จำนวนเงิน</th>
                    <th class="text-right px-4 py-3 font-medium text-gray-600">ค่าบริการ</th>
                    <th class="text-center px-4 py-3 font-medium text-gray-600">ดู</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  <tr v-for="txn in completedTransactions" :key="txn.id" class="hover:bg-gray-50">
                    <td class="px-4 py-3 text-gray-700">{{ formatTime(txn.datetime) }}</td>
                    <td class="px-4 py-3 text-gray-900">{{ getTransactionTypeLabel(txn.transactionType) }}</td>
                    <td class="px-4 py-3 text-gray-600">{{ getChannelLabel(txn.channel) }}</td>
                    <td class="px-4 py-3 text-right font-semibold text-gray-900">{{ formatCurrency(txn.amount) }}</td>
                    <td class="px-4 py-3 text-right text-gray-600">
                      {{ txn.commission ? formatCurrency(txn.commission) : '-' }}
                      <span v-if="txn.commissionType" class="text-xs text-gray-400">
                        {{ txn.commissionType === 'cash' ? 'C' : 'T' }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-center">
                      <button
                        aria-label="ดูรายละเอียด"
                        class="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg transition-colors"
                        @click="openDetailModal(txn)"
                      >
                        <EyeIcon class="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
              <EmptyState v-else icon="📋" title="ไม่มีรายการ" description="ยังไม่มีรายการสำเร็จจาก Step 1" />
            </div>
          </div>
        </section>

        <!-- Actions -->
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
          <BaseButton variant="secondary" @click="router.push('/finance/money-transfer-service/transaction-recording')">
            <ArrowLeftIcon class="w-4 h-4" />
            ย้อนกลับ Step 1
          </BaseButton>
          <ActionButton
            :permission="PERMISSIONS.EDIT_FINANCE"
            variant="primary"
            size="lg"
            :disabled="!isFormValid"
            :loading="isSubmitting"
            @click="handleConfirmVerification"
          >
            <CheckCircleIcon class="w-5 h-5" />
            ยืนยันการตรวจนับ
          </ActionButton>
        </div>
      </template>
    </template>

    <!-- Transaction Detail Modal -->
    <BaseModal
      :open="showDetailModal"
      title="รายละเอียดรายการ"
      size="md"
      @close="showDetailModal = false"
    >
      <div v-if="viewingTransaction" class="space-y-3 text-sm">
        <div class="grid grid-cols-2 gap-x-4 gap-y-3">
          <div>
            <div class="text-gray-500">ประเภท</div>
            <div class="font-medium">{{ getTransactionTypeLabel(viewingTransaction.transactionType) }}</div>
          </div>
          <div>
            <div class="text-gray-500">ช่องทาง</div>
            <div class="font-medium">{{ getChannelLabel(viewingTransaction.channel) }}</div>
          </div>
          <div>
            <div class="text-gray-500">จำนวนเงิน</div>
            <div class="font-bold text-base">{{ formatCurrency(viewingTransaction.amount) }}</div>
          </div>
          <div v-if="viewingTransaction.commission">
            <div class="text-gray-500">ค่าบริการ</div>
            <div class="font-medium text-green-700">
              {{ formatCurrency(viewingTransaction.commission) }}
              ({{ viewingTransaction.commissionType === 'cash' ? 'เงินสด' : 'โอน' }})
            </div>
          </div>
          <div v-if="viewingTransaction.destinationName">
            <div class="text-gray-500">ปลายทาง</div>
            <div class="font-medium">{{ viewingTransaction.destinationName }}</div>
          </div>
          <div v-if="viewingTransaction.destinationIdentifier">
            <div class="text-gray-500">หมายเลข</div>
            <div class="font-medium">{{ viewingTransaction.destinationIdentifier }}</div>
          </div>
        </div>
        <div v-if="viewingTransaction.notes" class="bg-gray-50 rounded-lg p-3">
          <div class="text-gray-500 mb-1">หมายเหตุ</div>
          <div class="text-gray-900">{{ viewingTransaction.notes }}</div>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end">
          <BaseButton variant="secondary" @click="showDetailModal = false">ปิด</BaseButton>
        </div>
      </template>
    </BaseModal>
  </PageWrapper>
</template>
