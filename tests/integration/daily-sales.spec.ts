import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import DailySalesTable from '~/components/DailySalesTable.vue'
import DailySalesModal from '~/components/DailySalesModal.vue'
import DailySalesPage from '~/pages/sales/daily-sales.vue'
import { useSalesStore } from '~/stores/sales'
import type { DailySalesEntry } from '~/types/repositories'

// Sample test data
const mockSalesEntries: DailySalesEntry[] = [
  {
    id: 'sales-001',
    date: '2026-01-29',
    cashierId: 'cashier-001',
    cashierName: 'สมชาย ใจดี',
    posposData: {
      cash: 5000,
      qr: 3000,
      bank: 2000,
      government: 1000,
    },
    cashReconciliation: {
      expectedAmount: 11000,
      actualAmount: 11000,
      difference: 0,
      notes: 'ตรวจสอบถูกต้อง',
    },
    status: 'submitted',
    submittedBy: 'user-001',
    submittedAt: '2026-01-29T10:00:00Z',
    auditNotes: '',
  },
  {
    id: 'sales-002',
    date: '2026-01-28',
    cashierId: 'cashier-002',
    cashierName: 'สินใจ ขยัน',
    posposData: {
      cash: 8000,
      qr: 2000,
      bank: 1500,
      government: 500,
    },
    cashReconciliation: {
      expectedAmount: 12000,
      actualAmount: 12000,
      difference: 0,
      notes: '',
    },
    status: 'audited',
    submittedBy: 'user-002',
    submittedAt: '2026-01-28T10:00:00Z',
    auditNotes: 'ตรวจสอบเรียบร้อย',
  },
]

describe('DailySalesTable Component', () => {
  it('should render table with entries', () => {
    const wrapper = mount(DailySalesTable, {
      props: {
        entries: mockSalesEntries,
      },
    })

    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(mockSalesEntries.length)
  })

  it('should display formatted currency', () => {
    const wrapper = mount(DailySalesTable, {
      props: {
        entries: [mockSalesEntries[0]],
      },
    })

    expect(wrapper.text()).toContain('฿')
    expect(wrapper.text()).toContain('11,000')
  })

  it('should display formatted date in Thai', () => {
    const wrapper = mount(DailySalesTable, {
      props: {
        entries: [mockSalesEntries[0]],
      },
    })

    // Should show Thai date format (month name, not just number)
    expect(wrapper.text()).toContain('มกราคม')
  })

  it('should display status badge with correct styling', () => {
    const wrapper = mount(DailySalesTable, {
      props: {
        entries: mockSalesEntries,
      },
    })

    const badges = wrapper.findAll('[data-testid="status-badge"]')
    expect(badges.length).toBeGreaterThan(0)
  })

  it('should emit edit event when edit button clicked', async () => {
    const wrapper = mount(DailySalesTable, {
      props: {
        entries: mockSalesEntries,
      },
    })

    await wrapper.find('[data-testid="edit-btn-sales-001"]').trigger('click')
    expect(wrapper.emitted('edit')).toBeTruthy()
    expect(wrapper.emitted('edit')[0]).toEqual([mockSalesEntries[0]])
  })

  it('should emit delete event when delete confirmed', async () => {
    const wrapper = mount(DailySalesTable, {
      props: {
        entries: mockSalesEntries,
      },
    })

    await wrapper.find('[data-testid="delete-btn-sales-001"]').trigger('click')
    await wrapper.find('[data-testid="confirm-delete"]').trigger('click')

    expect(wrapper.emitted('delete')).toBeTruthy()
    expect(wrapper.emitted('delete')[0]).toEqual(['sales-001'])
  })

  it('should filter entries by search query', async () => {
    const wrapper = mount(DailySalesTable, {
      props: {
        entries: mockSalesEntries,
      },
    })

    const searchInput = wrapper.find('input[placeholder*="ค้นหา"]')
    await searchInput.setValue('สมชาย')

    const filteredRows = wrapper.findAll('tbody tr')
    expect(filteredRows).toHaveLength(1)
    expect(filteredRows[0].text()).toContain('สมชาย')
  })

  it('should sort by date when date header clicked', async () => {
    const wrapper = mount(DailySalesTable, {
      props: {
        entries: mockSalesEntries,
      },
    })

    const dateHeader = wrapper.find('[data-sort="date"]')
    await dateHeader.trigger('click')

    // First sort ascending
    let rows = wrapper.findAll('tbody tr')
    let firstDate = rows[0].text()
    expect(firstDate).toContain('2026-01-28')

    // Click again for descending
    await dateHeader.trigger('click')
    rows = wrapper.findAll('tbody tr')
    firstDate = rows[0].text()
    expect(firstDate).toContain('2026-01-29')
  })

  it('should sort by cashier name when cashier header clicked', async () => {
    const wrapper = mount(DailySalesTable, {
      props: {
        entries: mockSalesEntries,
      },
    })

    const cashierHeader = wrapper.find('[data-sort="cashierName"]')
    await cashierHeader.trigger('click')

    const rows = wrapper.findAll('tbody tr')
    expect(rows[0].text()).toContain('สมชาย')
    expect(rows[1].text()).toContain('สินใจ')
  })

  it('should sort by total when total header clicked', async () => {
    const wrapper = mount(DailySalesTable, {
      props: {
        entries: mockSalesEntries,
      },
    })

    const totalHeader = wrapper.find('[data-sort="total"]')
    await totalHeader.trigger('click')

    const rows = wrapper.findAll('tbody tr')
    const firstTotal = parseFloat(rows[0].text().match(/\d+/)?.[0] || '0')
    const secondTotal = parseFloat(rows[1].text().match(/\d+/)?.[0] || '0')
    expect(firstTotal).toBeLessThanOrEqual(secondTotal)
  })

  it('should paginate entries (10 per page)', async () => {
    const manyEntries = Array.from({ length: 25 }, (_, i) => ({
      ...mockSalesEntries[0],
      id: `sales-${i}`,
      cashierName: `Cashier ${i}`,
    }))

    const wrapper = mount(DailySalesTable, {
      props: {
        entries: manyEntries,
      },
    })

    let rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(10) // First page

    await wrapper.find('[data-testid="next-page"]').trigger('click')
    rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(10) // Second page

    await wrapper.find('[data-testid="next-page"]').trigger('click')
    rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(5) // Third page (remaining 5)
  })

  it('should disable next button on last page', async () => {
    const wrapper = mount(DailySalesTable, {
      props: {
        entries: mockSalesEntries, // Only 2 entries
      },
    })

    const nextButton = wrapper.find('[data-testid="next-page"]')
    expect(nextButton.attributes('disabled')).toBeDefined()
  })

  it('should show loading spinner when loading prop is true', () => {
    const wrapper = mount(DailySalesTable, {
      props: {
        entries: [],
        loading: true,
      },
    })

    expect(wrapper.find('[data-testid="loading-spinner"]').exists()).toBe(true)
  })
})

describe('DailySalesModal Component', () => {
  it('should not render when open is false', () => {
    const wrapper = mount(DailySalesModal, {
      props: {
        open: false,
      },
    })

    expect(wrapper.find('[data-testid="modal-content"]').exists()).toBe(false)
  })

  it('should render when open is true', () => {
    const wrapper = mount(DailySalesModal, {
      props: {
        open: true,
      },
    })

    expect(wrapper.find('[data-testid="modal-content"]').exists()).toBe(true)
  })

  it('should populate form when editingEntry is provided', async () => {
    const wrapper = mount(DailySalesModal, {
      props: {
        open: true,
        editingEntry: mockSalesEntries[0],
      },
    })

    await wrapper.vm.$nextTick()

    const dateInput = wrapper.find('input[name="date"]')
    const cashierInput = wrapper.find('select[name="cashierId"]')

    expect(dateInput.element.value).toBe(mockSalesEntries[0].date)
    expect(cashierInput.element.value).toBe(mockSalesEntries[0].cashierId)
  })

  it('should clear form when editingEntry is null', async () => {
    const wrapper = mount(DailySalesModal, {
      props: {
        open: true,
        editingEntry: null,
      },
    })

    await wrapper.vm.$nextTick()

    const dateInput = wrapper.find('input[name="date"]')
    const cashInput = wrapper.find('input[name="cash"]')

    expect(dateInput.element.value).toBe('')
    expect(cashInput.element.value).toBe('0')
  })

  it('should calculate total from payment channels', async () => {
    const wrapper = mount(DailySalesModal, {
      props: {
        open: true,
      },
    })

    await wrapper.find('input[name="cash"]').setValue(5000)
    await wrapper.find('input[name="qr"]').setValue(3000)
    await wrapper.find('input[name="bank"]').setValue(2000)
    await wrapper.find('input[name="government"]').setValue(1000)

    await wrapper.vm.$nextTick()

    const totalDisplay = wrapper.find('[data-testid="total-display"]')
    expect(totalDisplay.text()).toContain('11,000')
  })

  it('should calculate difference from amounts', async () => {
    const wrapper = mount(DailySalesModal, {
      props: {
        open: true,
      },
    })

    await wrapper.find('input[name="expectedAmount"]').setValue(11000)
    await wrapper.find('input[name="cash"]').setValue(10800)
    await wrapper.find('input[name="qr"]').setValue(200)

    await wrapper.vm.$nextTick()

    const differenceDisplay = wrapper.find('[data-testid="difference-display"]')
    expect(differenceDisplay.text()).toContain('-200')
  })

  it('should auto-fill cashier ID when cashier selected', async () => {
    const wrapper = mount(DailySalesModal, {
      props: {
        open: true,
      },
    })

    await wrapper.find('select[name="cashierId"]').setValue('cashier-001')
    await wrapper.vm.$nextTick()

    const cashierNameInput = wrapper.find('input[name="cashierName"]')
    expect(cashierNameInput.element.value).toBe('สมชาย ใจดี')
  })

  it('should validate required fields', async () => {
    const wrapper = mount(DailySalesModal, {
      props: {
        open: true,
      },
    })

    // Try to submit without filling required fields
    await wrapper.find('button[type="submit"]').trigger('click')

    expect(wrapper.find('[data-testid="error-date"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="error-cashier"]').exists()).toBe(true)
  })

  it('should validate at least one payment channel', async () => {
    const wrapper = mount(DailySalesModal, {
      props: {
        open: true,
      },
    })

    await wrapper.find('input[name="date"]').setValue('2026-01-29')
    await wrapper.find('select[name="cashierId"]').setValue('cashier-001')

    await wrapper.find('button[type="submit"]').trigger('click')

    expect(wrapper.find('[data-testid="error-channels"]').exists()).toBe(true)
  })

  it('should emit submit with correct structure', async () => {
    const wrapper = mount(DailySalesModal, {
      props: {
        open: true,
      },
    })

    // Fill form
    await wrapper.find('input[name="date"]').setValue('2026-01-29')
    await wrapper.find('select[name="cashierId"]').setValue('cashier-001')
    await wrapper.find('input[name="cash"]').setValue(5000)
    await wrapper.find('input[name="qr"]').setValue(3000)
    await wrapper.find('input[name="expectedAmount"]').setValue(8000)

    await wrapper.find('button[type="submit"]').trigger('click')

    expect(wrapper.emitted('submit')).toBeTruthy()
    const submitted = wrapper.emitted('submit')[0][0]

    expect(submitted).toHaveProperty('date', '2026-01-29')
    expect(submitted).toHaveProperty('cashierId', 'cashier-001')
    expect(submitted).toHaveProperty('posposData')
    expect(submitted.posposData).toHaveProperty('cash', 5000)
    expect(submitted.posposData).toHaveProperty('qr', 3000)
  })

  it('should emit close when close button clicked', async () => {
    const wrapper = mount(DailySalesModal, {
      props: {
        open: true,
      },
    })

    await wrapper.find('[data-testid="close-btn"]').trigger('click')

    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('should show edit title when editingEntry provided', async () => {
    const wrapper = mount(DailySalesModal, {
      props: {
        open: true,
        editingEntry: mockSalesEntries[0],
      },
    })

    const title = wrapper.find('[data-testid="modal-title"]')
    expect(title.text()).toContain('แก้ไข')
  })

  it('should show create title when editingEntry is null', async () => {
    const wrapper = mount(DailySalesModal, {
      props: {
        open: true,
        editingEntry: null,
      },
    })

    const title = wrapper.find('[data-testid="modal-title"]')
    expect(title.text()).toContain('เพิ่มเติม')
  })

  it('should show update button when editing', async () => {
    const wrapper = mount(DailySalesModal, {
      props: {
        open: true,
        editingEntry: mockSalesEntries[0],
      },
    })

    const submitBtn = wrapper.find('button[type="submit"]')
    expect(submitBtn.text()).toContain('อัปเดต')
  })

  it('should show save button when creating', async () => {
    const wrapper = mount(DailySalesModal, {
      props: {
        open: true,
        editingEntry: null,
      },
    })

    const submitBtn = wrapper.find('button[type="submit"]')
    expect(submitBtn.text()).toContain('บันทึก')
  })

  it('should highlight difference as red when negative', async () => {
    const wrapper = mount(DailySalesModal, {
      props: {
        open: true,
      },
    })

    await wrapper.find('input[name="expectedAmount"]').setValue(11000)
    await wrapper.find('input[name="cash"]').setValue(10800)

    await wrapper.vm.$nextTick()

    const differenceDisplay = wrapper.find('[data-testid="difference-display"]')
    expect(differenceDisplay.classes()).toContain('text-red-600')
  })

  it('should highlight difference as gray when zero', async () => {
    const wrapper = mount(DailySalesModal, {
      props: {
        open: true,
      },
    })

    await wrapper.find('input[name="expectedAmount"]').setValue(11000)
    await wrapper.find('input[name="cash"]').setValue(11000)

    await wrapper.vm.$nextTick()

    const differenceDisplay = wrapper.find('[data-testid="difference-display"]')
    expect(differenceDisplay.classes()).toContain('text-gray-600')
  })
})

describe('DailySales Page Integration', () => {
  it('should fetch sales on mount', async () => {
    const pinia = createPinia()

    // Mock the API response
    vi.mock('~/composables/useLogger', () => ({
      useLogger: () => ({
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      }),
    }))

    const wrapper = mount(DailySalesPage, {
      global: {
        plugins: [pinia],
        stubs: {
          DailySalesTable: true,
          DailySalesModal: true,
        },
      },
    })

    await wrapper.vm.$nextTick()

    const store = useSalesStore()
    expect(store.isLoading).toBe(false)
  })

  it('should show modal when openCreateModal called', async () => {
    const wrapper = mount(DailySalesPage, {
      global: {
        plugins: [createPinia()],
      },
    })

    await wrapper.vm.openCreateModal()
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.showModal).toBe(true)
    expect(wrapper.vm.editingEntry).toBeNull()
  })

  it('should open modal with entry when openEditModal called', async () => {
    const wrapper = mount(DailySalesPage, {
      global: {
        plugins: [createPinia()],
      },
    })

    await wrapper.vm.openEditModal(mockSalesEntries[0])
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.showModal).toBe(true)
    expect(wrapper.vm.editingEntry).toEqual(mockSalesEntries[0])
  })

  it('should close modal and reset form', async () => {
    const wrapper = mount(DailySalesPage, {
      global: {
        plugins: [createPinia()],
      },
    })

    await wrapper.vm.openCreateModal()
    await wrapper.vm.closeModal()
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.showModal).toBe(false)
    expect(wrapper.vm.editingEntry).toBeNull()
  })

  it('should call store.addDailySale on create submit', async () => {
    const pinia = createPinia()
    const wrapper = mount(DailySalesPage, {
      global: {
        plugins: [pinia],
      },
    })

    const store = useSalesStore()
    const addSpy = vi.spyOn(store, 'addDailySale')

    await wrapper.vm.handleModalSubmit(mockSalesEntries[0])

    expect(addSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        date: mockSalesEntries[0].date,
        cashierId: mockSalesEntries[0].cashierId,
      })
    )
  })

  it('should call store.updateDailySale on edit submit', async () => {
    const pinia = createPinia()
    const wrapper = mount(DailySalesPage, {
      global: {
        plugins: [pinia],
      },
    })

    wrapper.vm.editingEntry = mockSalesEntries[0]

    const store = useSalesStore()
    const updateSpy = vi.spyOn(store, 'updateDailySale')

    await wrapper.vm.handleModalSubmit({
      ...mockSalesEntries[0],
      status: 'audited',
    })

    expect(updateSpy).toHaveBeenCalledWith(
      mockSalesEntries[0].id,
      expect.objectContaining({
        status: 'audited',
      })
    )
  })

  it('should call store.deleteDailySale on delete', async () => {
    const pinia = createPinia()
    const wrapper = mount(DailySalesPage, {
      global: {
        plugins: [pinia],
      },
    })

    const store = useSalesStore()
    const deleteSpy = vi.spyOn(store, 'deleteDailySale')

    await wrapper.vm.handleDeleteEntry('sales-001')

    expect(deleteSpy).toHaveBeenCalledWith('sales-001')
  })

  it('should show error message on API failure', async () => {
    const pinia = createPinia()
    const wrapper = mount(DailySalesPage, {
      global: {
        plugins: [pinia],
      },
    })

    // Simulate API error
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'))

    await wrapper.vm.handleModalSubmit(mockSalesEntries[0])
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.errorMessage).toBeTruthy()
    expect(wrapper.vm.errorMessage).toContain('บันทึกข้อมูลไม่สำเร็จ')
  })

  it('should show success message on successful save', async () => {
    const pinia = createPinia()
    const wrapper = mount(DailySalesPage, {
      global: {
        plugins: [pinia],
      },
    })

    await wrapper.vm.handleModalSubmit(mockSalesEntries[0])
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.successMessage).toBeTruthy()
    expect(wrapper.vm.successMessage).toContain('สำเร็จ')
  })

  it('should clear error after 5 seconds', async () => {
    const pinia = createPinia()
    const wrapper = mount(DailySalesPage, {
      global: {
        plugins: [pinia],
      },
    })

    wrapper.vm.errorMessage = 'Test error'

    // Fast-forward time
    vi.useFakeTimers()
    vi.advanceTimersByTime(5000)

    expect(wrapper.vm.errorMessage).toBe('')
  })
})
