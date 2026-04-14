<script setup lang="ts">
import { useBillPaymentHelpers } from '~/composables/useBillPaymentHelpers'
import type { BillPaymentTransaction, BillPaymentTransactionStatus } from '~/types/bill-payment'
import { CheckCircleIcon, ClockIcon, PauseCircleIcon, XCircleIcon } from '@heroicons/vue/24/outline'

const props = defineProps<{
  editingData?: BillPaymentTransaction | null
  presetType?: 'bill_payment' | 'owner_deposit' | ''
}>()

const emit = defineEmits<{
  submit: [formData: {
    transactionType: 'bill_payment' | 'owner_deposit'
    billType?: 'utility' | 'telecom' | 'insurance' | 'other'
    amount: number
    commission: number
    customerName?: string
    status: BillPaymentTransactionStatus
    statusNote?: string
    notes?: string
  }]
  cancel: []
}>()

const { validateTransactionForm } = useBillPaymentHelpers()

// ─── Form state ───────────────────────────────────────────────────────────────
const form = reactive({
  transactionType: '' as 'bill_payment' | 'owner_deposit' | '',
  billType: '' as 'utility' | 'telecom' | 'insurance' | 'other' | '',
  amount: '' as number | '',
  commission: '' as number | '',
  customerName: '',
  status: 'completed' as BillPaymentTransactionStatus,
  statusNote: '',
  notes: '',
})

const formErrors = ref<string[]>([])
const isSubmitting = ref(false)

// ─── Initialize from props ────────────────────────────────────────────────────
function init() {
  if (props.editingData) {
    form.transactionType = props.editingData.transactionType
    form.billType = props.editingData.billType ?? ''
    form.amount = props.editingData.amount
    form.commission = props.editingData.commission
    form.customerName = props.editingData.customerName ?? ''
    form.status = props.editingData.status
    form.statusNote = props.editingData.statusNote ?? ''
    form.notes = props.editingData.notes ?? ''
  } else {
    form.transactionType = props.presetType ?? ''
    form.billType = ''
    form.amount = ''
    form.commission = ''
    form.customerName = ''
    form.status = 'completed'
    form.statusNote = ''
    form.notes = ''
  }
  formErrors.value = []
}

onMounted(init)
watch(() => props.editingData, init)
watch(() => props.presetType, init)

// ─── Submit ───────────────────────────────────────────────────────────────────
async function handleSubmit() {
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

  isSubmitting.value = true
  try {
    emit('submit', {
      transactionType: form.transactionType as 'bill_payment' | 'owner_deposit',
      billType: form.transactionType === 'bill_payment' ? (form.billType as any) || undefined : undefined,
      amount: Number(form.amount),
      commission: form.transactionType === 'bill_payment' ? Number(form.commission) : 0,
      customerName: form.customerName || undefined,
      status: form.status,
      statusNote: form.statusNote || undefined,
      notes: form.notes || undefined,
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="handleSubmit">

    <!-- Validation errors -->
    <BaseAlert
      v-if="formErrors.length > 0"
      variant="error"
      :message="formErrors.join(', ')"
    />

    <!-- ── ประเภทรายการ ──────────────────────────────────────────────────── -->
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

    <!-- ── ประเภทบิล (เฉพาะ bill_payment) ─────────────────────────────── -->
    <FormField
      v-if="form.transactionType === 'bill_payment'"
      label="ประเภทบิล"
      required
    >
      <BaseSelect
        v-model="form.billType"
        placeholder="เลือกประเภทบิล"
        :options="[
          { value: 'utility', label: 'สาธารณูปโภค' },
          { value: 'telecom', label: 'โทรคมนาคม' },
          { value: 'insurance', label: 'ประกันภัย' },
          { value: 'other', label: 'อื่นๆ' },
        ]"
      />
    </FormField>

    <!-- ── จำนวนเงิน ─────────────────────────────────────────────────────── -->
    <FormField label="จำนวนเงิน (฿)" required>
      <BaseInput
        v-model="form.amount"
        type="number"
        min="0"
        step="1"
        placeholder="0"
      />
    </FormField>

    <!-- ── ค่าธรรมเนียม (เฉพาะ bill_payment) ──────────────────────────── -->
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

    <!-- ── ชื่อลูกค้า ──────────────────────────────────────────────────── -->
    <FormField label="ชื่อลูกค้า (ไม่บังคับ)">
      <BaseInput
        v-model="form.customerName"
        type="text"
        placeholder="ระบุชื่อลูกค้า (ถ้ามี)"
      />
    </FormField>

    <!-- ── สถานะรายการ ─────────────────────────────────────────────────── -->
    <FormField label="สถานะรายการ" required>
      <div class="flex flex-wrap gap-4">
        <label class="flex cursor-pointer items-center gap-2">
          <input
            v-model="form.status"
            type="radio"
            value="completed"
            class="accent-green-600"
          />
          <CheckCircleIcon class="h-4 w-4 text-green-600" />
          <span class="text-sm">สำเร็จ</span>
        </label>
        <label class="flex cursor-pointer items-center gap-2">
          <input
            v-model="form.status"
            type="radio"
            value="draft"
            class="accent-yellow-500"
          />
          <ClockIcon class="h-4 w-4 text-yellow-500" />
          <span class="text-sm">รอดำเนินการ</span>
        </label>
        <label class="flex cursor-pointer items-center gap-2">
          <input
            v-model="form.status"
            type="radio"
            value="on_hold"
            class="accent-orange-500"
          />
          <PauseCircleIcon class="h-4 w-4 text-orange-500" />
          <span class="text-sm">พักรายการ</span>
        </label>
        <label class="flex cursor-pointer items-center gap-2">
          <input
            v-model="form.status"
            type="radio"
            value="cancelled"
            class="accent-gray-500"
          />
          <XCircleIcon class="h-4 w-4 text-gray-500" />
          <span class="text-sm">ยกเลิก</span>
        </label>
      </div>
    </FormField>

    <!-- ── หมายเหตุสถานะ (เฉพาะ draft / on_hold / cancelled) ──────────── -->
    <FormField
      v-if="form.status !== 'completed'"
      label="เหตุผล / หมายเหตุสถานะ"
    >
      <BaseInput
        v-model="form.statusNote"
        type="text"
        :placeholder="form.status === 'draft' ? 'เช่น ยอดในระบบไม่พอ รอตรวจสอบ' : form.status === 'on_hold' ? 'เช่น รอเอกสารเพิ่มเติม' : 'เช่น ลูกค้ายกเลิก'"
      />
    </FormField>

    <!-- ── หมายเหตุ ────────────────────────────────────────────────────── -->
    <FormField label="หมายเหตุ (ไม่บังคับ)">
      <BaseTextarea
        v-model="form.notes"
        placeholder="หมายเหตุเพิ่มเติม..."
        :rows="2"
      />
    </FormField>

    <!-- ── Actions ────────────────────────────────────────────────────────── -->
    <div class="flex justify-end gap-3 pt-2">
      <BaseButton variant="secondary" type="button" @click="emit('cancel')">
        ยกเลิก
      </BaseButton>
      <BaseButton
        variant="primary"
        type="submit"
        :loading="isSubmitting"
        :disabled="!form.transactionType || !form.amount"
      >
        {{ editingData ? 'บันทึกการแก้ไข' : 'เพิ่มรายการ' }}
      </BaseButton>
    </div>

  </form>
</template>
