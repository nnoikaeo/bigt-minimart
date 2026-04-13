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
} from '@heroicons/vue/24/outline'

const props = defineProps<{
  date: string
  currentUser: { uid: string; displayName: string }
}>()

const emit = defineEmits<{
  'step1-completed': []
}>()

const logger = useLogger('BPManagerRecordingSection')
const store = useBillPaymentStore()
const { can } = usePermissions()
const {
  formatAmount,
  formatTime,
  formatBillType,
  formatTransactionType,
  getStatusLabel,
  getStatusBadgeVariant,
} = useBillPaymentHelpers()

// ─── Workflow ─────────────────────────────────────────────────────────────────
const workflowStatus = computed(() => store.getCurrentWorkflowStatus)
const isNeedsCorrection = computed(() => workflowStatus.value === 'needs_correction')

// ─── Transactions ─────────────────────────────────────────────────────────────
const dateTransactions = computed(() => store.getTransactionsByDate(props.date))

// ─── Alerts ───────────────────────────────────────────────────────────────────
const successMessage = ref('')
const errorMessage = ref('')

// ─── Step 1 completion ────────────────────────────────────────────────────────
const isCompletingStep1 = ref(false)
const canCompleteStep1 = computed(
  () => dateTransactions.value.length > 0 && !isCompletingStep1.value
)

// ─── Transaction modal ────────────────────────────────────────────────────────
const showTransactionModal = ref(false)
const editingTransaction = ref<BillPaymentTransaction | null>(null)

function openNewTransaction() {
  editingTransaction.value = null
  showTransactionModal.value = true
}

function openEditTransaction(txn: BillPaymentTransaction) {
  editingTransaction.value = txn
  showTransactionModal.value = true
}

function closeModal() {
  showTransactionModal.value = false
  editingTransaction.value = null
}

async function handleFormSubmit(formData: {
  transactionType: 'bill_payment' | 'owner_deposit'
  billType?: 'utility' | 'telecom' | 'insurance' | 'other'
  amount: number
  commission: number
  customerName?: string
  status: 'success' | 'failed'
  notes?: string
}) {
  errorMessage.value = ''
  try {
    const payload = {
      date: props.date,
      ...formData,
      recordedBy: props.currentUser.uid,
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
    logger.log('Transaction saved for', props.date)
  } catch (err: any) {
    errorMessage.value = err.message ?? 'เกิดข้อผิดพลาด'
    logger.error('handleFormSubmit', err)
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
  if (!canCompleteStep1.value || !can(PERMISSIONS.EDIT_FINANCE)) return
  isCompletingStep1.value = true
  errorMessage.value = ''
  try {
    await store.completeStep1(props.date)
    await store.fetchDailySummary(props.date)
    successMessage.value = 'ขั้นตอนที่ 1 เสร็จสมบูรณ์ กรุณาตรวจนับเงินสด'
    logger.log('Step 1 completed for', props.date)
    emit('step1-completed')
  } catch (err: any) {
    errorMessage.value = err.message ?? 'ไม่สามารถดำเนินการได้'
    logger.error('handleCompleteStep1', err)
  } finally {
    isCompletingStep1.value = false
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

    <!-- ── Balance Cards ──────────────────────────────────────────────────── -->
    <section class="mb-6">
      <h2 class="mb-3 text-base font-semibold text-gray-700">📊 ยอดเงินปัจจุบัน</h2>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">

        <div class="rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm">
          <div class="mb-2 flex justify-center">
            <BanknotesIcon class="h-7 w-7 text-blue-500" />
          </div>
          <div class="text-xs text-gray-500">บัญชีธนาคาร</div>
          <div class="mt-1 text-xl font-bold text-blue-700">
            {{ formatAmount(store.currentBalance?.bankAccount ?? 0) }}
          </div>
        </div>

        <div class="rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm">
          <div class="mb-2 flex justify-center">
            <CreditCardIcon class="h-7 w-7 text-green-500" />
          </div>
          <div class="text-xs text-gray-500">เงินสดรับชำระบิล</div>
          <div class="mt-1 text-xl font-bold text-green-700">
            {{ formatAmount(store.currentBalance?.billPaymentCash ?? 0) }}
          </div>
        </div>

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

    <!-- ── Transaction List ───────────────────────────────────────────────── -->
    <section class="mb-6">
      <div class="mb-3 flex items-center justify-between">
        <h2 class="text-base font-semibold text-gray-700">
          📝 รายการวันที่ {{ date }}
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

      <EmptyState
        v-if="dateTransactions.length === 0"
        title="ยังไม่มีรายการ"
        description="กดปุ่ม 'รายการใหม่' เพื่อเริ่มบันทึกรายการรับชำระบิล"
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
              <td class="px-4 py-3">
                <div class="flex items-center justify-center gap-2">
                  <ActionButton
                    :permission="PERMISSIONS.EDIT_FINANCE"
                    variant="ghost"
                    size="sm"
                    title="แก้ไข"
                    @click="openEditTransaction(txn)"
                  >
                    <PencilIcon class="h-4 w-4" />
                  </ActionButton>
                  <ActionButton
                    :permission="PERMISSIONS.EDIT_FINANCE"
                    variant="ghost"
                    size="sm"
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

    <!-- ── Step 1 Complete Button ─────────────────────────────────────────── -->
    <section class="flex flex-col items-end gap-3 border-t border-gray-100 pt-4">
      <div v-if="dateTransactions.length === 0" class="text-sm text-gray-400">
        ต้องมีอย่างน้อย 1 รายการก่อนดำเนินการต่อ
      </div>
      <ActionButton
        :permission="PERMISSIONS.EDIT_FINANCE"
        variant="primary"
        :disabled="!canCompleteStep1"
        :loading="isCompletingStep1"
        @click="handleCompleteStep1"
      >
        ไปขั้นตอนที่ 2 →
      </ActionButton>
    </section>

    <!-- ═══════════════════════════════════════════════════════════════════════
         MODAL: Add / Edit Transaction
    ════════════════════════════════════════════════════════════════════════════ -->
    <BaseModal
      :open="showTransactionModal"
      :title="editingTransaction ? 'แก้ไขรายการ' : 'เพิ่มรายการใหม่'"
      @close="closeModal"
    >
      <BillPaymentTransactionForm
        :editing-data="editingTransaction"
        @submit="handleFormSubmit"
        @cancel="closeModal"
      />
    </BaseModal>

    <!-- ═══════════════════════════════════════════════════════════════════════
         CONFIRM DIALOG: Delete
    ════════════════════════════════════════════════════════════════════════════ -->
    <ConfirmDialog
      :open="showDeleteConfirm"
      title="ลบรายการ"
      message="คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้? การกระทำนี้ไม่สามารถย้อนกลับได้"
      confirm-text="ลบ"
      variant="danger"
      @confirm="handleDeleteExecute"
      @cancel="showDeleteConfirm = false"
    />
  </div>
</template>
