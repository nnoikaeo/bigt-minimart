/* eslint-disable */
// @ts-nocheck
import { mount } from '@vue/test-utils'
import TransactionForm from '~/components/money-transfer/TransactionForm.vue'

// ── Stub Nuxt auto-imports ────────────────────────────────────────────────────
vi.stubGlobal('useCommission', () => ({
  isManual: ref(false),
  manualValue: ref(0),
  effectiveCommission: computed(() => 10),
  reset: vi.fn(),
}))
vi.stubGlobal('useDailyRecordSettingsStore', () => ({
  fetchMoneyTransferFees: vi.fn(),
}))
vi.stubGlobal('useMoneyTransferHelpers', () => ({
  formatCurrency: (v) => `${v} ฿`,
  getStatusLabel: (v) => v,
  getStatusBadgeVariant: () => 'default',
}))

const BALANCE = { bankAccount: 7000, transferCash: 750, serviceFeeCash: 0, serviceFeeTransfer: 0 }

const baseTxn = {
  id: 'txn-001',
  amount: 500,
  commission: 10,
  commissionType: 'cash',
  datetime: '2026-03-11T10:00:00Z',
}

function mountForm(props = {}) {
  return mount(TransactionForm, {
    props: { currentBalance: BALANCE, recordedBy: 'u1', recordedByName: 'Manager', ...props },
    global: { stubs: { BaseBadge: { template: '<span><slot /></span>' } } },
  })
}

function editForm(transactionType, status, amount = 500) {
  return mountForm({
    editingData: { ...baseTxn, transactionType, status, amount },
    statusChange: { currentStatus: status },
  })
}

describe('money-transfer TransactionForm', () => {
  describe('balance banner when editing', () => {
    it('does not count a completed withdrawal twice', () => {
      // Cash was 1,250 before this withdrawal of 500 and is 750 now
      const text = editForm('withdrawal', 'completed').text()
      expect(text).toContain('1250 ฿')
      expect(text).toMatch(/1250 ฿\s*→\s*750 ฿/)
    })

    it('does not count a completed transfer twice', () => {
      expect(editForm('transfer', 'completed').text()).toMatch(/7500 ฿\s*→\s*7000 ฿/)
    })

    it('does not count a completed owner deposit twice', () => {
      expect(editForm('owner_deposit', 'completed').text()).toMatch(/6500 ฿\s*→\s*7000 ฿/)
    })

    it('uses the current balance for an on-hold record, which is not counted yet', () => {
      expect(editForm('withdrawal', 'on_hold').text()).toMatch(/750 ฿\s*→\s*250 ฿/)
    })

    it('uses the current balance for a draft, which is not counted yet', () => {
      const wrapper = mountForm({ editingData: { ...baseTxn, transactionType: 'withdrawal', status: 'draft' } })
      expect(wrapper.text()).toMatch(/750 ฿\s*→\s*250 ฿/)
    })

    it('uses the current balance for a new record', async () => {
      const wrapper = mountForm({ presetType: 'withdrawal' })
      await wrapper.find('input[type="number"]').setValue(500)
      expect(wrapper.text()).toMatch(/750 ฿\s*→\s*250 ฿/)
    })
  })

  describe('insufficient balance warning', () => {
    it('stays quiet when the balance only looks short because the record is already counted', () => {
      // Current cash 750 < 1,000, but the 1,000 is this record's own: cash was 1,750 before it
      expect(editForm('withdrawal', 'completed', 1000).text()).not.toContain('ไม่พอ')
    })

    it('warns when an on-hold record does not fit the current balance', () => {
      expect(editForm('withdrawal', 'on_hold', 1000).text()).toContain('ไม่พอ')
    })
  })

  describe('close button', () => {
    it('is labelled "ปิด" so it cannot be mistaken for the "ยกเลิก" status choice', () => {
      const wrapper = editForm('withdrawal', 'on_hold')
      const buttons = wrapper.findAll('button').map(b => b.text())
      expect(buttons).toContain('ปิด')
      expect(buttons).not.toContain('ยกเลิก')
    })

    it('still offers "ยกเลิก" as a status choice on an on-hold record', () => {
      const wrapper = editForm('withdrawal', 'on_hold')
      expect(wrapper.find('input[type="radio"][value="cancelled"]').exists()).toBe(true)
    })

    it('emits cancel when clicked', async () => {
      const wrapper = editForm('withdrawal', 'on_hold')
      await wrapper.findAll('button').find(b => b.text() === 'ปิด').trigger('click')
      expect(wrapper.emitted('cancel')).toBeTruthy()
    })
  })
})
