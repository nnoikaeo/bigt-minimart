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

  describe('balance banner when changing status (BUG-050)', () => {
    async function pick(wrapper, value) {
      await wrapper.find(`input[type="radio"][value="${value}"]`).setValue(true)
    }

    it('shows the amount coming back when a completed transfer is put on hold', async () => {
      const wrapper = editForm('transfer', 'completed')
      await pick(wrapper, 'on_hold')
      // 7,000 now → 7,500 after the 500 transfer is returned
      expect(wrapper.find('[data-testid="balance-banner"]').text()).toMatch(/7000 ฿\s*→\s*7500 ฿/)
    })

    it('shows the cash coming back when a completed withdrawal is put on hold', async () => {
      const wrapper = editForm('withdrawal', 'completed')
      await pick(wrapper, 'on_hold')
      expect(wrapper.find('[data-testid="balance-banner"]').text()).toMatch(/750 ฿\s*→\s*1250 ฿/)
    })

    it('shows the deposit coming out when a completed owner deposit is put on hold', async () => {
      const wrapper = editForm('owner_deposit', 'completed')
      await pick(wrapper, 'on_hold')
      expect(wrapper.find('[data-testid="balance-banner"]').text()).toMatch(/7000 ฿\s*→\s*6500 ฿/)
    })

    it('hides the banner and says the balance does not change when an on-hold record is cancelled', async () => {
      const wrapper = editForm('transfer', 'on_hold')
      await pick(wrapper, 'cancelled')
      expect(wrapper.find('[data-testid="balance-banner"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="balance-no-effect"]').text()).toContain('ไม่กระทบยอด')
    })

    it('keeps the normal banner when an on-hold record is completed', async () => {
      const wrapper = editForm('transfer', 'on_hold')
      await pick(wrapper, 'completed')
      expect(wrapper.find('[data-testid="balance-banner"]').text()).toMatch(/7000 ฿\s*→\s*6500 ฿/)
    })
  })

  describe('negative balance warning when putting on hold (BUG-057)', () => {
    async function holdForm(transactionType, amount, balance = BALANCE) {
      const wrapper = mountForm({
        currentBalance: balance,
        editingData: { ...baseTxn, transactionType, status: 'completed', amount },
        statusChange: { currentStatus: 'completed' },
      })
      await wrapper.find('input[type="radio"][value="on_hold"]').setValue(true)
      return wrapper
    }

    it('warns that transfer cash goes negative but still lets the user save', async () => {
      // Cash 500 now; holding an 800 transfer takes 800 back out → -300
      const wrapper = await holdForm('transfer', 800, { ...BALANCE, transferCash: 500 })
      const warnings = wrapper.findAll('[data-testid="negative-after-hold"]').map(w => w.text())
      expect(warnings).toEqual([expect.stringContaining('ยอดเงินสด (โอน)จะติดลบ (-300 ฿)')])
      expect(warnings[0]).toContain('ยังบันทึกได้')
      const save = wrapper.findAll('button').find(b => b.text() === 'บันทึกและเปลี่ยนสถานะ')
      expect(save.attributes('disabled')).toBeUndefined()
    })

    it('warns that the bank goes negative when holding a deposit', async () => {
      const wrapper = await holdForm('owner_deposit', 8000)
      expect(wrapper.find('[data-testid="negative-after-hold"]').text()).toContain('ยอดเงินในบัญชีจะติดลบ (-1000 ฿)')
    })

    it('stays quiet when nothing goes negative', async () => {
      const wrapper = await holdForm('transfer', 500)
      expect(wrapper.find('[data-testid="negative-after-hold"]').exists()).toBe(false)
      expect(wrapper.text()).not.toContain('ไม่พอ')
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
