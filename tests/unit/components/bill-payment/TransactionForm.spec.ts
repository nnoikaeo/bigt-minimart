/* eslint-disable */
// @ts-nocheck
import { mount } from '@vue/test-utils'
import TransactionForm from '~/components/bill-payment/TransactionForm.vue'

// ── Stub Nuxt auto-import: useCommission ──────────────────────────────────────
const mockResetCommission = vi.fn()
vi.stubGlobal('useCommission', () => ({
  isManual: ref(false),
  manualValue: ref(0),
  autoCommission: ref(10),
  effectiveCommission: computed(() => 10),
  reset: mockResetCommission,
}))

// ── Stub module imports ───────────────────────────────────────────────────────
const mockValidateForm = vi.fn().mockReturnValue({ valid: true, errors: [] })
vi.mock('~/composables/useBillPaymentHelpers', () => ({
  useBillPaymentHelpers: () => ({ validateTransactionForm: mockValidateForm }),
}))

// ── Component stubs ───────────────────────────────────────────────────────────
const BaseAlertStub = {
  name: 'BaseAlert',
  template: '<div class="base-alert">{{ message }}</div>',
  props: ['variant', 'message'],
}
const FormFieldStub = {
  name: 'FormField',
  template: '<div class="form-field"><slot /></div>',
  props: ['label', 'required', 'hint'],
}
const BaseSelectStub = {
  name: 'BaseSelect',
  template: '<select class="base-select" :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><slot /></select>',
  props: ['modelValue', 'placeholder', 'options'],
  emits: ['update:modelValue'],
}
const BaseInputStub = {
  name: 'BaseInput',
  template: '<input class="base-input" :type="type" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  props: ['modelValue', 'type', 'min', 'step', 'placeholder'],
  emits: ['update:modelValue'],
}
const BaseTextareaStub = {
  name: 'BaseTextarea',
  template: '<textarea class="base-textarea" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  props: ['modelValue', 'placeholder', 'rows'],
  emits: ['update:modelValue'],
}
const BaseButtonStub = {
  name: 'BaseButton',
  template: '<button class="base-btn" :type="type || \'button\'" :disabled="disabled || loading" @click="$emit(\'click\')"><slot /></button>',
  props: ['variant', 'type', 'loading', 'disabled'],
  emits: ['click'],
}

const globalStubs = {
  BaseAlert: BaseAlertStub,
  FormField: FormFieldStub,
  BaseSelect: BaseSelectStub,
  BaseInput: BaseInputStub,
  BaseTextarea: BaseTextareaStub,
  BaseButton: BaseButtonStub,
  CheckCircleIcon: { template: '<span />' },
  ClockIcon: { template: '<span />' },
  PauseCircleIcon: { template: '<span />' },
  XCircleIcon: { template: '<span />' },
}

function mountForm(props = {}) {
  return mount(TransactionForm, {
    props,
    global: { stubs: globalStubs },
  })
}

describe('TransactionForm', () => {
  beforeEach(() => {
    mockValidateForm.mockReturnValue({ valid: true, errors: [] })
    mockResetCommission.mockClear()
  })

  // ─── Transaction type radios ────────────────────────────────────────────────

  describe('transaction type radios', () => {
    it('renders bill_payment radio option', () => {
      const wrapper = mountForm()
      expect(wrapper.findAll('input[type="radio"]').some(r => r.element.value === 'bill_payment')).toBe(true)
    })

    it('renders owner_deposit radio option', () => {
      const wrapper = mountForm()
      expect(wrapper.findAll('input[type="radio"]').some(r => r.element.value === 'owner_deposit')).toBe(true)
    })

    it('renders four transaction status radio options', () => {
      const wrapper = mountForm()
      const statusValues = ['completed', 'draft', 'on_hold', 'cancelled']
      statusValues.forEach(v =>
        expect(wrapper.findAll('input[type="radio"]').some(r => r.element.value === v)).toBe(true),
      )
    })
  })

  // ─── billType dropdown visibility ──────────────────────────────────────────

  describe('billType dropdown visibility', () => {
    it('hides billType dropdown when no transactionType is selected', () => {
      const wrapper = mountForm()
      expect(wrapper.find('.base-select').exists()).toBe(false)
    })

    it('shows billType dropdown when bill_payment radio is selected', async () => {
      const wrapper = mountForm()
      const radio = wrapper.findAll('input[type="radio"]').find(r => r.element.value === 'bill_payment')
      radio.element.checked = true
      await radio.trigger('change')
      expect(wrapper.find('.base-select').exists()).toBe(true)
    })

    it('hides billType dropdown when owner_deposit radio is selected', async () => {
      const wrapper = mountForm()
      const ownerRadio = wrapper.findAll('input[type="radio"]').find(r => r.element.value === 'owner_deposit')
      ownerRadio.element.checked = true
      await ownerRadio.trigger('change')
      expect(wrapper.find('.base-select').exists()).toBe(false)
    })
  })

  // ─── presetType prop ────────────────────────────────────────────────────────

  describe('presetType prop', () => {
    it('shows billType dropdown when presetType is bill_payment', async () => {
      const wrapper = mountForm({ presetType: 'bill_payment' })
      await nextTick()
      expect(wrapper.find('.base-select').exists()).toBe(true)
    })

    it('hides billType dropdown when presetType is owner_deposit', async () => {
      const wrapper = mountForm({ presetType: 'owner_deposit' })
      await nextTick()
      expect(wrapper.find('.base-select').exists()).toBe(false)
    })

    it('renders form without preset selection when presetType is empty string', () => {
      const wrapper = mountForm({ presetType: '' })
      expect(wrapper.find('.base-select').exists()).toBe(false)
    })
  })

  // ─── Submit button state ────────────────────────────────────────────────────

  describe('submit button state', () => {
    it('disables submit when no transactionType and no amount', () => {
      const wrapper = mountForm()
      const submitBtn = wrapper.findAll('.base-btn').find(b => b.element.type === 'submit')
      expect(submitBtn.attributes('disabled')).toBeDefined()
    })

    it('shows เพิ่มรายการ label in add mode (no editingData)', () => {
      const wrapper = mountForm()
      expect(wrapper.text()).toContain('เพิ่มรายการ')
    })
  })

  // ─── Cancel button ──────────────────────────────────────────────────────────

  describe('cancel button', () => {
    it('emits cancel when cancel button is clicked', async () => {
      const wrapper = mountForm()
      const cancelBtn = wrapper.findAll('.base-btn').find(b => b.text().includes('ยกเลิก'))
      await cancelBtn.trigger('click')
      expect(wrapper.emitted('cancel')).toBeTruthy()
    })
  })

  // ─── Edit mode (editingData prop) ───────────────────────────────────────────

  describe('edit mode', () => {
    const editingData = {
      id: 'txn-001',
      date: '2026-04-14',
      timestamp: '2026-04-14T10:00:00Z',
      transactionType: 'bill_payment' as const,
      billType: 'utility' as const,
      amount: 1500,
      commission: 30,
      status: 'completed' as const,
      recordedBy: 'user-001',
      recordedAt: '2026-04-14T10:00:00Z',
    }

    it('shows บันทึกการแก้ไข label when editingData is provided', async () => {
      const wrapper = mountForm({ editingData })
      await nextTick()
      expect(wrapper.text()).toContain('บันทึกการแก้ไข')
    })

    it('shows billType dropdown when editingData has bill_payment type', async () => {
      const wrapper = mountForm({ editingData })
      await nextTick()
      expect(wrapper.find('.base-select').exists()).toBe(true)
    })

    it('hides billType dropdown when editingData has owner_deposit type', async () => {
      const wrapper = mountForm({
        editingData: { ...editingData, transactionType: 'owner_deposit', billType: undefined },
      })
      await nextTick()
      expect(wrapper.find('.base-select').exists()).toBe(false)
    })
  })

  // ─── Validation errors ──────────────────────────────────────────────────────

  describe('validation errors', () => {
    it('shows error alert when validateTransactionForm returns errors', async () => {
      mockValidateForm.mockReturnValue({ valid: false, errors: ['กรุณาระบุประเภทรายการ'] })
      const wrapper = mountForm({ presetType: 'bill_payment' })
      await wrapper.find('form').trigger('submit')
      await nextTick()
      expect(wrapper.find('.base-alert').exists()).toBe(true)
    })

    it('displays the error message text in the alert', async () => {
      mockValidateForm.mockReturnValue({ valid: false, errors: ['กรุณาระบุจำนวนเงิน'] })
      const wrapper = mountForm({ presetType: 'bill_payment' })
      await wrapper.find('form').trigger('submit')
      await nextTick()
      expect(wrapper.find('.base-alert').text()).toContain('กรุณาระบุจำนวนเงิน')
    })

    it('does not show error alert when form is valid', async () => {
      const wrapper = mountForm()
      // No submit attempted yet
      expect(wrapper.find('.base-alert').exists()).toBe(false)
    })
  })

  // ─── statusNote field visibility ────────────────────────────────────────────

  describe('statusNote field', () => {
    it('hides statusNote input when status is completed (default)', () => {
      const wrapper = mountForm()
      // Default: 2 BaseInput (amount + customerName), no statusNote
      const inputs = wrapper.findAll('.base-input')
      expect(inputs).toHaveLength(2)
    })

    it('shows statusNote input when draft status is selected', async () => {
      const wrapper = mountForm()
      const draftRadio = wrapper.findAll('input[type="radio"]').find(r => r.element.value === 'draft')
      draftRadio.element.checked = true
      await draftRadio.trigger('change')
      // Now 3 BaseInputs: amount + customerName + statusNote
      expect(wrapper.findAll('.base-input')).toHaveLength(3)
    })

    it('shows statusNote input when on_hold status is selected', async () => {
      const wrapper = mountForm()
      const holdRadio = wrapper.findAll('input[type="radio"]').find(r => r.element.value === 'on_hold')
      holdRadio.element.checked = true
      await holdRadio.trigger('change')
      expect(wrapper.findAll('.base-input')).toHaveLength(3)
    })
  })

  // ─── Submit event payload ───────────────────────────────────────────────────

  describe('submit event', () => {
    it('emits submit with commission=0 for owner_deposit', async () => {
      const wrapper = mountForm({ presetType: 'owner_deposit' })
      await nextTick()
      // Set amount via the number input
      const amountInput = wrapper.findAll('.base-input').find(i => i.attributes('type') === 'number')
      await amountInput.setValue('500')
      await wrapper.find('form').trigger('submit')
      await nextTick()
      const emitted = wrapper.emitted('submit')
      expect(emitted).toBeTruthy()
      expect(emitted[0][0].commission).toBe(0)
      expect(emitted[0][0].transactionType).toBe('owner_deposit')
    })

    it('emits submit with amount as a number', async () => {
      const wrapper = mountForm({ presetType: 'owner_deposit' })
      await nextTick()
      const amountInput = wrapper.findAll('.base-input').find(i => i.attributes('type') === 'number')
      await amountInput.setValue('750')
      await wrapper.find('form').trigger('submit')
      await nextTick()
      const emitted = wrapper.emitted('submit')
      expect(emitted).toBeTruthy()
      expect(emitted[0][0].amount).toBe(750)
    })
  })
})
