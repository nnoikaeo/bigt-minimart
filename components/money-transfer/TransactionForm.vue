<template>
  <div class="space-y-4 px-1">

    <!-- ── ประเภทรายการ ─────────────────────────────────────── -->
    <div class="flex rounded-lg border border-gray-200 overflow-hidden">
      <button
        v-for="t in transactionTypes"
        :key="t.value"
        type="button"
        class="flex-1 py-2.5 text-sm font-medium transition-colors"
        :class="formData.transactionType === t.value
          ? 'bg-blue-600 text-white'
          : 'bg-white text-gray-600 hover:bg-gray-50'"
        @click="formData.transactionType = t.value"
      >
        {{ t.label }}
      </button>
    </div>

    <!-- ── ช่องทาง (ซ่อนถ้าฝากเงิน) ──────────────────────────── -->
    <div v-if="formData.transactionType !== 'owner_deposit'" class="flex rounded-lg border border-gray-200 overflow-hidden">
      <button
        v-for="c in channels"
        :key="c.value"
        type="button"
        class="flex-1 py-2 text-sm font-medium transition-colors"
        :class="formData.channel === c.value
          ? 'bg-indigo-500 text-white'
          : 'bg-white text-gray-600 hover:bg-gray-50'"
        @click="formData.channel = c.value"
      >
        {{ c.label }}
      </button>
    </div>

    <!-- ── ปลายทาง ────────────────────────────────────────────── -->
    <div v-if="formData.transactionType !== 'owner_deposit'" class="space-y-3">
      <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">ปลายทาง</p>

      <!-- ธนาคาร -->
      <template v-if="formData.channel === 'bank'">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">ธนาคาร <span class="text-red-500">*</span></label>
          <select
            v-model="formData.bankName"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- เลือกธนาคาร --</option>
            <option v-for="bank in bankList" :key="bank" :value="bank">{{ bank }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">เลขบัญชี <span class="text-red-500">*</span></label>
          <input
            v-model="formData.accountNumber"
            type="text"
            inputmode="numeric"
            placeholder="xxx-x-xxxxx-x"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">ชื่อบัญชี</label>
          <input
            v-model="formData.accountName"
            type="text"
            placeholder="ชื่อเจ้าของบัญชี"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </template>

      <!-- พร้อมเพย์ -->
      <template v-if="formData.channel === 'promptpay'">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">ประเภท</label>
          <div class="flex gap-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input v-model="formData.promptpayIdentifierType" type="radio" value="phone" class="accent-blue-600" />
              <span class="text-sm text-gray-700">หมายเลขโทรศัพท์</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input v-model="formData.promptpayIdentifierType" type="radio" value="id_card" class="accent-blue-600" />
              <span class="text-sm text-gray-700">หมายเลขบัตรประชาชน</span>
            </label>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            {{ formData.promptpayIdentifierType === 'phone' ? 'หมายเลขโทรศัพท์' : 'หมายเลขบัตรประชาชน' }}
            <span class="text-red-500">*</span>
          </label>
          <input
            v-model="formData.promptpayIdentifier"
            type="text"
            inputmode="numeric"
            :placeholder="formData.promptpayIdentifierType === 'phone' ? '0812345678' : '1234567890123'"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">ชื่อบัญชี</label>
          <input
            v-model="formData.accountName"
            type="text"
            placeholder="ชื่อเจ้าของบัญชี"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </template>
    </div>

    <!-- ── จำนวนเงิน + ค่าบริการ ─────────────────────────────── -->
    <div class="grid grid-cols-2 gap-3">
      <!-- จำนวนเงิน -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">จำนวนเงิน <span class="text-red-500">*</span></label>
        <div class="flex rounded-lg border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
          <input
            v-model.number="formData.amount"
            type="number"
            inputmode="numeric"
            placeholder="0"
            min="0"
            step="1"
            class="flex-1 px-3 py-2 text-sm outline-none min-w-0"
          />
          <span class="bg-gray-100 px-3 py-2 text-sm text-gray-600 border-l border-gray-300 font-medium">฿</span>
        </div>
      </div>

      <!-- ค่าบริการ (ซ่อนถ้าฝากเงิน) -->
      <div v-if="formData.transactionType !== 'owner_deposit'">
        <label class="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
          ค่าบริการ
          <button
            type="button"
            :title="isCommissionManual ? 'รีเซ็ตเป็นอัตโนมัติ' : 'คำนวณอัตโนมัติ'"
            class="transition-colors leading-none"
            :class="isCommissionManual ? 'text-gray-400 hover:text-blue-500' : 'text-blue-500'"
            @click="resetCommission"
          >
            🔄
          </button>
        </label>
        <div
          class="flex rounded-lg border overflow-hidden focus-within:ring-2 focus-within:ring-blue-500"
          :class="isCommissionManual ? 'border-amber-400' : 'border-gray-300'"
        >
          <input
            v-model.number="commissionInput"
            type="number"
            inputmode="numeric"
            placeholder="0"
            min="0"
            step="1"
            class="flex-1 px-3 py-2 text-sm outline-none min-w-0"
            @input="isCommissionManual = true"
          />
          <span
            class="bg-gray-100 px-3 py-2 text-sm text-gray-600 border-l font-medium"
            :class="isCommissionManual ? 'border-amber-400' : 'border-gray-300'"
          >฿</span>
        </div>
        <!-- Commission type radios -->
        <div v-if="effectiveCommission > 0" class="flex gap-4 mt-1.5">
          <label class="flex items-center gap-1.5 cursor-pointer">
            <input v-model="formData.commissionType" type="radio" value="cash" class="accent-blue-600" />
            <span class="text-xs text-gray-600">สด</span>
          </label>
          <label class="flex items-center gap-1.5 cursor-pointer">
            <input v-model="formData.commissionType" type="radio" value="transfer" class="accent-blue-600" />
            <span class="text-xs text-gray-600">โอน</span>
          </label>
        </div>
      </div>
    </div>

    <!-- ── หมายเหตุ ────────────────────────────────────────────── -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
      <textarea
        v-model="formData.notes"
        rows="2"
        placeholder="บันทึกเพิ่มเติม..."
        class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
      />
    </div>

    <!-- ── สถานะยอดเงิน ─────────────────────────────────────────── -->
    <div
      v-if="formData.amount > 0"
      class="rounded-lg px-4 py-2.5 text-sm font-medium flex items-center gap-2"
      :class="hasSufficientBalance
        ? 'bg-green-50 border border-green-200 text-green-800'
        : 'bg-amber-50 border border-amber-200 text-amber-800'"
    >
      <span>{{ hasSufficientBalance ? '✅' : '⚠️' }}</span>
      <span>ยอดเงินสด {{ formatCurrency(props.currentBalance.transferCash) }}</span>
      <span class="text-gray-400">·</span>
      <span>{{ hasSufficientBalance ? 'บันทึกเป็น Completed' : 'ไม่เพียงพอ → บันทึกเป็น Draft' }}</span>
    </div>

    <!-- ── Error ──────────────────────────────────────────────── -->
    <div v-if="errorMessage" class="rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700">
      {{ errorMessage }}
    </div>

    <!-- ── Buttons ────────────────────────────────────────────── -->
    <div class="flex gap-3 pt-1">
      <button
        type="button"
        class="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        @click="emit('cancel')"
      >
        ยกเลิก
      </button>
      <button
        type="button"
        class="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        :class="isSubmitting ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'"
        :disabled="isSubmitting || formData.amount <= 0"
        @click="handleSubmit"
      >
        <svg v-if="isSubmitting" class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <span>💾 บันทึก</span>
      </button>
    </div>

  </div>
</template>

<script setup lang="ts">
import type { MoneyTransferBalance } from '~/types/repositories'

// ── Props & Emits ─────────────────────────────────────────────
interface Props {
  currentBalance: MoneyTransferBalance
  recordedBy: string
  recordedByName: string
  editingData?: any
  presetType?: 'transfer' | 'withdrawal' | 'owner_deposit'
}

interface Emits {
  (e: 'submit', transaction: any): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// ── Static data ───────────────────────────────────────────────
const transactionTypes = [
  { value: 'transfer', label: 'โอนเงิน' },
  { value: 'withdrawal', label: 'ถอนเงิน' },
  { value: 'owner_deposit', label: 'ฝากเงิน' },
]

const channels = [
  { value: 'bank', label: 'ธนาคาร' },
  { value: 'promptpay', label: 'พร้อมเพย์' },
]

const bankList = [
  'ธนาคารกสิกรไทย (KBank)',
  'ธนาคารกรุงไทย (KTB)',
  'ธนาคารกรุงเทพ (BBL)',
  'ธนาคารไทยพาณิชย์ (SCB)',
  'ธนาคารกรุงศรีอยุธยา (BAY)',
  'ธนาคารออมสิน (GSB)',
  'ธนาคารอาคารสงเคราะห์ (GHB)',
  'ธนาคารทหารไทยธนชาต (TTB)',
  'ธนาคาร UOB',
  'ธนาคาร CIMB',
  'ธนาคาร LH Bank',
  'ธนาคารทิสโก้ (TISCO)',
  'ธนาคารเกียรตินาคินภัทร (KKP)',
]

// ── Form state ────────────────────────────────────────────────
const formData = ref({
  transactionType: (props.presetType ?? props.editingData?.transactionType ?? 'transfer') as 'transfer' | 'withdrawal' | 'owner_deposit',
  channel: (props.editingData?.channel ?? 'bank') as 'bank' | 'promptpay',
  bankName: props.editingData?.bankName ?? '',
  accountNumber: props.editingData?.accountNumber ?? '',
  accountName: props.editingData?.accountName ?? '',
  promptpayIdentifierType: (props.editingData?.promptpayIdentifierType ?? 'phone') as 'phone' | 'id_card',
  promptpayIdentifier: props.editingData?.promptpayIdentifier ?? '',
  amount: props.editingData?.amount ?? 0,
  commissionType: (props.editingData?.commissionType ?? 'cash') as 'cash' | 'transfer',
  notes: props.editingData?.notes ?? '',
})

// ── Commission auto-calc ──────────────────────────────────────
const isCommissionManual = ref(false)
const manualCommission = ref<number>(props.editingData?.commission ?? 0)

/**
 * Calculate fee automatically based on amount.
 * ปรับ tier ตามราคาจริงของธุรกิจ
 */
function calcAutoCommission(amount: number): number {
  if (amount <= 0) return 0
  if (amount <= 2500) return 25
  if (amount <= 10000) return 30
  if (amount <= 50000) return 50
  return 100
}

const autoCommission = computed(() => calcAutoCommission(formData.value.amount))

const effectiveCommission = computed(() =>
  isCommissionManual.value ? manualCommission.value : autoCommission.value
)

const commissionInput = computed({
  get: () => effectiveCommission.value,
  set: (val: number) => {
    manualCommission.value = val
    isCommissionManual.value = true
  },
})

function resetCommission() {
  isCommissionManual.value = false
}

// ── Balance check ─────────────────────────────────────────────
const hasSufficientBalance = computed(() =>
  props.currentBalance.transferCash >= formData.value.amount
)

// ── Helpers ───────────────────────────────────────────────────
function formatCurrency(val: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
  }).format(val)
}

// ── Validation & Submit ───────────────────────────────────────
const isSubmitting = ref(false)
const errorMessage = ref('')

function handleSubmit() {
  errorMessage.value = ''

  if (formData.value.amount <= 0) {
    errorMessage.value = 'กรุณากรอกจำนวนเงิน'
    return
  }

  if (formData.value.transactionType !== 'owner_deposit') {
    if (formData.value.channel === 'bank') {
      if (!formData.value.bankName) {
        errorMessage.value = 'กรุณาเลือกธนาคาร'
        return
      }
      if (!formData.value.accountNumber) {
        errorMessage.value = 'กรุณากรอกเลขบัญชี'
        return
      }
    }
    if (formData.value.channel === 'promptpay') {
      if (!formData.value.promptpayIdentifier) {
        errorMessage.value = 'กรุณากรอกหมายเลขพร้อมเพย์'
        return
      }
    }
  }

  // Capture datetime at submit time; keep original if editing a draft
  const datetime = props.editingData?.datetime ?? new Date().toISOString()

  const transactionData: Record<string, any> = {
    datetime,
    transactionType: formData.value.transactionType,
    channel: formData.value.transactionType !== 'owner_deposit' ? formData.value.channel : null,
    amount: formData.value.amount,
    commission: effectiveCommission.value,
    commissionType: formData.value.commissionType,
    notes: formData.value.notes,
    recordedBy: props.recordedBy,
    recordedByName: props.recordedByName,
    status: hasSufficientBalance.value ? 'completed' : 'draft',
  }

  if (formData.value.transactionType !== 'owner_deposit') {
    if (formData.value.channel === 'bank') {
      transactionData.bankName = formData.value.bankName
      transactionData.accountNumber = formData.value.accountNumber
      transactionData.accountName = formData.value.accountName
      transactionData.destinationName = formData.value.accountName
      transactionData.destinationIdentifier = formData.value.accountNumber
    } else if (formData.value.channel === 'promptpay') {
      transactionData.promptpayIdentifierType = formData.value.promptpayIdentifierType
      transactionData.promptpayIdentifier = formData.value.promptpayIdentifier
      transactionData.accountName = formData.value.accountName
      transactionData.destinationName = formData.value.accountName
      transactionData.destinationIdentifier = formData.value.promptpayIdentifier
    }
  }

  isSubmitting.value = true
  try {
    emit('submit', transactionData)
  } finally {
    isSubmitting.value = false
  }
}

// ── Sync editing data when prop changes ───────────────────────
watch(
  () => props.editingData,
  (val) => {
    if (!val) return
    formData.value.transactionType = val.transactionType ?? 'transfer'
    formData.value.channel = val.channel ?? 'bank'
    formData.value.bankName = val.bankName ?? ''
    formData.value.accountNumber = val.accountNumber ?? ''
    formData.value.accountName = val.accountName ?? ''
    formData.value.promptpayIdentifierType = val.promptpayIdentifierType ?? 'phone'
    formData.value.promptpayIdentifier = val.promptpayIdentifier ?? ''
    formData.value.amount = val.amount ?? 0
    formData.value.commissionType = val.commissionType ?? 'cash'
    formData.value.notes = val.notes ?? ''
    if (val.commission != null) {
      manualCommission.value = val.commission
      isCommissionManual.value = true
    }
  },
  { immediate: false }
)
</script>
