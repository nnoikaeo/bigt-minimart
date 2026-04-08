<script setup lang="ts">
import { useBillPaymentStore } from '~/stores/bill-payment'
import { useLogger } from '~/composables/useLogger'
import { usePermissions } from '~/composables/usePermissions'
import { useBillPaymentHelpers } from '~/composables/useBillPaymentHelpers'
import { PERMISSIONS } from '~/types/permissions'
import type { BillPaymentTransaction } from '~/types/bill-payment'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  BanknotesIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/vue/24/outline'

definePageMeta({
  middleware: 'auth',
})

const logger = useLogger('BillPaymentStep1')
const store = useBillPaymentStore()
const router = useRouter()
const route = useRoute()
const { can } = usePermissions()
const {
  formatAmount,
  formatTime,
  formatBillType,
  formatTransactionType,
  getStatusLabel,
  getStatusBadgeVariant,
  validateTransactionForm,
} = useBillPaymentHelpers()

const { currentUser } = useCurrentUser()

// ─── Date ────────────────────────────────────────────────────────────────────
const today = new Date().toISOString().split('T')[0] ?? ''
const selectedDate = ref<string>((route.query.date as string) || today)
const isBackdated = computed(() => selectedDate.value < today)

// ─── Alerts ──────────────────────────────────────────────────────────────────
const successMessage = ref('')
const errorMessage = ref('')

// ─── Workflow ─────────────────────────────────────────────────────────────────
const workflowStatus = computed(() => store.getCurrentWorkflowStatus)
const isStep1Active = computed(
  () =>
    workflowStatus.value === 'step1_in_progress' ||
    workflowStatus.value === 'needs_correction'
)
const isNeedsCorrection = computed(() => workflowStatus.value === 'needs_correction')

// ─── Transactions ─────────────────────────────────────────────────────────────
const dateTransactions = computed(() => store.getTransactionsByDate(selectedDate.value))

// ─── Step 1 completion ────────────────────────────────────────────────────────
const isCompletingStep1 = ref(false)
const canCompleteStep1 = computed(
  () => dateTransactions.value.length > 0 && !isCompletingStep1.value
)

// ─── Modal: Transaction Form ──────────────────────────────────────────────────
const showTransactionModal = ref(false)
const editingTransaction = ref<BillPaymentTransaction | null>(null)
const isSubmittingForm = ref(false)
const formErrors = ref<string[]>([])

const form = reactive({
  transactionType: '' as 'bill_payment' | 'owner_deposit' | '',
  billType: '' as 'utility' | 'telecom' | 'insurance' | 'other' | '',
  amount: '' as number | '',
  commission: '' as number | '',
  customerName: '',
  status: 'success' as 'success' | 'failed',
  notes: '',
})

function resetForm() {
  form.transactionType = ''
  form.billType = ''
  form.amount = ''
  form.commission = ''
  form.customerName = ''
  form.status = 'success'
  form.notes = ''
  formErrors.value = []
}

function openNewTransaction() {
  editingTransaction.value = null
  resetForm()
  showTransactionModal.value = true
}

function openEditTransaction(txn: BillPaymentTransaction) {
  editingTransaction.value = txn
  form.transactionType = txn.transactionType
  form.billType = txn.billType ?? ''
  form.amount = txn.amount
  form.commission = txn.commission
  form.customerName = txn.customerName ?? ''
  form.status = txn.status
  form.notes = txn.notes ?? ''
  formErrors.value = []
  showTransactionModal.value = true
}

function closeModal() {
  showTransactionModal.value = false
  editingTransaction.value = null
  resetForm()
}

async function handleFormSubmit() {
  const { valid, errors } = validateTransactionForm({
    transactionType: form.transactionType,
    billType: form.billType || undefined,
    amount: form.amount,
    commission: form.commission,
    status: form.status,
    customerName: form.customerName || undefined,
    notes: form.notes || undefined,
  })
  if (!valid) {
    formErrors.value = errors
    return
  }

  isSubmittingForm.value = true
  errorMessage.value = ''
  try {
    const payload = {
      date: selectedDate.value,
      transactionType: form.transactionType,
      billType: form.transactionType === 'bill_payment' ? form.billType || undefined : undefined,
      amount: Number(form.amount),
      commission: form.transactionType === 'bill_payment' ? Number(form.commission) : 0,
      customerName: form.customerName || undefined,
      status: form.status,
      notes: form.notes || undefined,
      recordedBy: currentUser.value?.uid || 'manager',
      recordedAt: new Date().toISOString(),
    }

    if (editingTransaction.value) {
      await store.updateTransaction(editingTransaction.value.id, payload)
      successMessage.value = 'แก้ไขรายการสำเร็จ'
    } else {
      await store.createTransaction(payload)
      successMessage.value = 'เพิ่มรายการสำเร็จ'
    }

    closeModal()
    logger.log('Transaction saved for', selectedDate.value)
  } catch (err: any) {
    errorMessage.value = err.message ?? 'เกิดข้อผิดพลาด'
    logger.error('handleFormSubmit', err)
  } finally {
    isSubmittingForm.value = false
  }
}

// ─── Delete transaction ───────────────────────────────────────────────────────
const showDeleteConfirm = ref(false)
const deletingTransactionId = ref('')

function promptDelete(id: string) {
  deletingTransactionId.value = id
  showDeleteConfirm.value = true
}

async function handleDeleteExecute() {
  errorMessage.value = ''
  try {
    await store.deleteDraftTransaction(deletingTransactionId.value)
    successMessage.value = 'ลบรายการสำเร็จ'
    logger.log('Deleted transaction', deletingTransactionId.value)
  } catch (err: any) {
    errorMessage.value = err.message ?? 'ลบรายการไม่สำเร็จ'
    logger.error('handleDeleteExecute', err)
  } finally {
    showDeleteConfirm.value = false
    deletingTransactionId.value = ''
  }
}

// ─── Complete Step 1 ──────────────────────────────────────────────────────────
async function handleCompleteStep1() {
  if (!canCompleteStep1.value) return
  isCompletingStep1.value = true
  errorMessage.value = ''
  try {
    await store.completeStep1(selectedDate.value)
    successMessage.value = 'ขั้นตอนที่ 1 เสร็จสมบูรณ์ กำลังไปขั้นตอนที่ 2...'
    logger.log('Step 1 completed for', selectedDate.value)
    setTimeout(() => router.push('/finance/bill-payment-history'), 1200)
  } catch (err: any) {
    errorMessage.value = err.message ?? 'ไม่สามารถดำเนินการได้'
    logger.error('handleCompleteStep1', err)
  } finally {
    isCompletingStep1.value = false
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
  } catch (err: any) {
    errorMessage.value = err.message ?? 'โหลดข้อมูลไม่สำเร็จ'
    logger.error('loadData', err)
  }
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(async () => {
  await loadData()
})
</script>

<template>
  <PageWrapper
    title="บริการรับชำระบิล"
    description="บันทึกรายการและตรวจสอบยอดเงิน"
    icon="📋"
    :loading="store.isLoading"
    :error="store.error ?? undefined"
  >
    <template #actions>
      <!-- Back to history -->
      <BaseButton
        variant="secondary"
        size="sm"
        @click="router.push('/finance/bill-payment-history')"
      >
        ← ประวัติ
      </BaseButton>
      <!-- Date Picker -->
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

    <!-- ── Alerts ─────────────────────────────────────────────────────────── -->
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

    <!-- ── Backdated Warning ───────────────────────────────────────────────── -->
    <BaseAlert
      v-if="isBackdated"
      variant="warning"
      message="คุณกำลังบันทึกรายการย้อนหลัง กรุณาตรวจสอบวันที่ให้ถูกต้อง"
      class="mb-4"
    />

    <!-- ── Needs Correction Banner ─────────────────────────────────────────── -->
    <div
      v-if="isNeedsCorrection && store.currentSummary?.correctionNotes"
      class="mb-4 rounded-xl border border-red-300 bg-red-50 px-5 py-4"
    >
      <div class="flex items-start gap-3">
        <ExclamationTriangleIcon class="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
        <div>
          <p class="font-semibold text-red-800">ส่งกลับให้แก้ไข</p>
          <p class="mt-1 text-sm text-red-700">{{ store.currentSummary.correctionNotes }}</p>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════════
         STEP 1 — Active (step1_in_progress | needs_correction)
    ════════════════════════════════════════════════════════════════════════════ -->
    <template v-if="isStep1Active">

      <!-- ── Balance Cards ───────────────────────────────────────────────── -->
      <section class="mb-6">
        <h2 class="mb-3 text-base font-semibold text-gray-700">📊 ยอดเงินปัจจุบัน</h2>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">

          <!-- Bank Account -->
          <div class="rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm">
            <div class="mb-2 flex justify-center">
              <BanknotesIcon class="h-7 w-7 text-blue-500" />
            </div>
            <div class="text-xs text-gray-500">บัญชีธนาคาร</div>
            <div class="mt-1 text-xl font-bold text-blue-700">
              {{ formatAmount(store.currentBalance?.bankAccount ?? 0) }}
            </div>
          </div>

          <!-- Bill Payment Cash -->
          <div class="rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm">
            <div class="mb-2 flex justify-center">
              <CreditCardIcon class="h-7 w-7 text-green-500" />
            </div>
            <div class="text-xs text-gray-500">เงินสดรับชำระบิล</div>
            <div class="mt-1 text-xl font-bold text-green-700">
              {{ formatAmount(store.currentBalance?.billPaymentCash ?? 0) }}
            </div>
          </div>

          <!-- Service Fee Cash -->
          <div class="rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm">
            <div class="mb-2 flex justify-center">
              <CurrencyDollarIcon class="h-7 w-7 text-yellow-500" />
            </div>
            <div class="text-xs text-gray-500">ค่าธรรมเนียมสะสม</div>
            <div class="mt-1 text-xl font-bold text-yellow-700">
              {{ formatAmount(store.currentBalance?.serviceFeeCash ?? 0) }}
            </div>
          </div>

        </div>
      </section>

      <!-- ── Transaction List ────────────────────────────────────────────── -->
      <section class="mb-6">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-base font-semibold text-gray-700">
            📝 รายการวันที่ {{ selectedDate }}
            <span class="ml-1 text-sm font-normal text-gray-400">
              ({{ dateTransactions.length }} รายการ)
            </span>
          </h2>
          <ActionButton
            :permission="PERMISSIONS.EDIT_FINANCE"
            variant="primary"
            size="sm"
            @click="openNewTransaction"
          >
            <template #icon><PlusIcon class="h-4 w-4" /></template>
            รายการใหม่
          </ActionButton>
        </div>

        <!-- Empty state -->
        <EmptyState
          v-if="dateTransactions.length === 0"
          title="ยังไม่มีรายการ"
          description="กดปุ่ม 'รายการใหม่' เพื่อเริ่มบันทึกรายการรับชำระบิล"
          class="py-10"
        />

        <!-- Table -->
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
                <th class="px-4 py-3 text-center">จัดการ</th>
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
                  <div class="font-medium text-gray-800">
                    {{ formatTransactionType(txn.transactionType) }}
                  </div>
                  <div v-if="txn.billType" class="text-xs text-gray-400">
                    {{ formatBillType(txn.billType) }}
                  </div>
                </td>
                <td class="px-4 py-3 text-gray-600">
                  {{ txn.customerName || '-' }}
                </td>
                <td class="px-4 py-3 text-right font-medium text-gray-800">
                  {{ formatAmount(txn.amount) }}
                </td>
                <td class="px-4 py-3 text-right text-gray-600">
                  {{ txn.transactionType === 'bill_payment' ? formatAmount(txn.commission) : '-' }}
                </td>
                <td class="px-4 py-3 text-center">
                  <BaseBadge :variant="getStatusBadgeVariant(txn.status)">
                    {{ getStatusLabel(txn.status) }}
                  </BaseBadge>
                </td>
                <td class="px-4 py-3 text-gray-500">
                  {{ formatTime(txn.timestamp) }}
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center justify-center gap-2">
                    <ActionButton
                      :permission="PERMISSIONS.EDIT_FINANCE"
                      variant="ghost"
                      size="xs"
                      title="แก้ไข"
                      @click="openEditTransaction(txn)"
                    >
                      <PencilIcon class="h-4 w-4" />
                    </ActionButton>
                    <ActionButton
                      :permission="PERMISSIONS.EDIT_FINANCE"
                      variant="ghost"
                      size="xs"
                      title="ลบ"
                      class="text-red-500 hover:text-red-700"
                      @click="promptDelete(txn.id)"
                    >
                      <TrashIcon class="h-4 w-4" />
                    </ActionButton>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- ── Step 1 Summary + Complete Button ────────────────────────────── -->
      <section class="flex flex-col items-end gap-3 border-t border-gray-100 pt-4">
        <div
          v-if="dateTransactions.length === 0"
          class="text-sm text-gray-400"
        >
          ต้องมีอย่างน้อย 1 รายการก่อนดำเนินการต่อ
        </div>
        <BaseButton
          variant="primary"
          :disabled="!canCompleteStep1"
          :loading="isCompletingStep1"
          @click="handleCompleteStep1"
        >
          ไปขั้นตอนที่ 2 →
        </BaseButton>
      </section>
    </template>

    <!-- ═══════════════════════════════════════════════════════════════════════
         READ-ONLY VIEW — Step 1 already completed
    ════════════════════════════════════════════════════════════════════════════ -->
    <template v-else>
      <section>
        <div class="mb-3 flex items-center gap-2">
          <CheckCircleIcon class="h-5 w-5 text-green-600" />
          <h2 class="text-base font-semibold text-gray-700">
            ขั้นตอนที่ 1 — รายการที่บันทึกไว้
          </h2>
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
                  <div class="font-medium text-gray-800">
                    {{ formatTransactionType(txn.transactionType) }}
                  </div>
                  <div v-if="txn.billType" class="text-xs text-gray-400">
                    {{ formatBillType(txn.billType) }}
                  </div>
                </td>
                <td class="px-4 py-3 text-gray-600">{{ txn.customerName || '-' }}</td>
                <td class="px-4 py-3 text-right font-medium text-gray-800">
                  {{ formatAmount(txn.amount) }}
                </td>
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
    </template>

    <!-- ═══════════════════════════════════════════════════════════════════════
         MODAL: Add / Edit Transaction
    ════════════════════════════════════════════════════════════════════════════ -->
    <BaseModal
      :show="showTransactionModal"
      :title="editingTransaction ? 'แก้ไขรายการ' : 'เพิ่มรายการใหม่'"
      @close="closeModal"
    >
      <form class="space-y-4" @submit.prevent="handleFormSubmit">

        <!-- Validation errors -->
        <BaseAlert
          v-if="formErrors.length > 0"
          variant="error"
          :message="formErrors.join(', ')"
        />

        <!-- Transaction Type -->
        <FormField label="ประเภทรายการ" required>
          <div class="flex gap-4">
            <label class="flex cursor-pointer items-center gap-2">
              <input
                v-model="form.transactionType"
                type="radio"
                value="bill_payment"
                class="accent-red-600"
              />
              <span class="text-sm">รับชำระบิล</span>
            </label>
            <label class="flex cursor-pointer items-center gap-2">
              <input
                v-model="form.transactionType"
                type="radio"
                value="owner_deposit"
                class="accent-red-600"
              />
              <span class="text-sm">ฝากเงิน (เจ้าของ)</span>
            </label>
          </div>
        </FormField>

        <!-- Bill Type (only for bill_payment) -->
        <FormField
          v-if="form.transactionType === 'bill_payment'"
          label="ประเภทบิล"
          required
        >
          <BaseSelect v-model="form.billType" placeholder="เลือกประเภทบิล">
            <option value="utility">สาธารณูปโภค</option>
            <option value="telecom">โทรคมนาคม</option>
            <option value="insurance">ประกันภัย</option>
            <option value="other">อื่นๆ</option>
          </BaseSelect>
        </FormField>

        <!-- Amount -->
        <FormField label="จำนวนเงิน (฿)" required>
          <BaseInput
            v-model="form.amount"
            type="number"
            min="0"
            step="1"
            placeholder="0"
          />
        </FormField>

        <!-- Commission (only for bill_payment) -->
        <FormField
          v-if="form.transactionType === 'bill_payment'"
          label="ค่าธรรมเนียม (฿)"
          required
        >
          <BaseInput
            v-model="form.commission"
            type="number"
            min="0"
            step="0.01"
            placeholder="0"
          />
        </FormField>

        <!-- Customer Name (optional) -->
        <FormField label="ชื่อลูกค้า (ไม่บังคับ)">
          <BaseInput
            v-model="form.customerName"
            type="text"
            placeholder="ระบุชื่อลูกค้า (ถ้ามี)"
          />
        </FormField>

        <!-- Status -->
        <FormField label="สถานะรายการ" required>
          <div class="flex gap-4">
            <label class="flex cursor-pointer items-center gap-2">
              <input
                v-model="form.status"
                type="radio"
                value="success"
                class="accent-green-600"
              />
              <CheckCircleIcon class="h-4 w-4 text-green-600" />
              <span class="text-sm">สำเร็จ</span>
            </label>
            <label class="flex cursor-pointer items-center gap-2">
              <input
                v-model="form.status"
                type="radio"
                value="failed"
                class="accent-red-600"
              />
              <XCircleIcon class="h-4 w-4 text-red-500" />
              <span class="text-sm">ล้มเหลว</span>
            </label>
          </div>
        </FormField>

        <!-- Notes (optional) -->
        <FormField label="หมายเหตุ (ไม่บังคับ)">
          <BaseTextarea
            v-model="form.notes"
            placeholder="หมายเหตุเพิ่มเติม..."
            rows="2"
          />
        </FormField>

        <!-- Actions -->
        <div class="flex justify-end gap-3 pt-2">
          <BaseButton variant="secondary" type="button" @click="closeModal">
            ยกเลิก
          </BaseButton>
          <BaseButton
            variant="primary"
            type="submit"
            :loading="isSubmittingForm"
            :disabled="!form.transactionType || !form.amount"
          >
            {{ editingTransaction ? 'บันทึกการแก้ไข' : 'เพิ่มรายการ' }}
          </BaseButton>
        </div>
      </form>
    </BaseModal>

    <!-- ═══════════════════════════════════════════════════════════════════════
         CONFIRM DIALOG: Delete Transaction
    ════════════════════════════════════════════════════════════════════════════ -->
    <ConfirmDialog
      :show="showDeleteConfirm"
      title="ลบรายการ"
      message="คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้? การกระทำนี้ไม่สามารถย้อนกลับได้"
      confirm-label="ลบ"
      confirm-variant="danger"
      @confirm="handleDeleteExecute"
      @cancel="showDeleteConfirm = false"
    />
  </PageWrapper>
</template>
