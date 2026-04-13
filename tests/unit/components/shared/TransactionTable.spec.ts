/* eslint-disable */
// @ts-nocheck
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TransactionTable from '~/components/shared/TransactionTable.vue'
import type { TableColumn, FilterTab } from '~/components/shared/TransactionTable.vue'

// Stub auto-imported EmptyState
const EmptyStateStub = {
  name: 'EmptyState',
  template: '<div class="empty-state"><slot /></div>',
  props: ['icon', 'title', 'description'],
}

const COLUMNS: TableColumn[] = [
  { key: 'ref', label: 'อ้างอิง', formatter: (v) => `REF-${v}` },
  { key: 'amount', label: 'จำนวน', align: 'right' },
]

const TRANSACTIONS = [
  { id: 'txn-1', ref: '001', amount: 500 },
  { id: 'txn-2', ref: '002', amount: 1000 },
]

function mountTable(overrides = {}, slots = {}) {
  return mount(TransactionTable, {
    props: {
      transactions: TRANSACTIONS,
      columns: COLUMNS,
      ...overrides,
    },
    slots,
    global: {
      stubs: { EmptyState: EmptyStateStub },
    },
  })
}

describe('TransactionTable', () => {
  describe('basic rendering', () => {
    it('renders column headers', () => {
      const wrapper = mountTable()
      expect(wrapper.text()).toContain('อ้างอิง')
      expect(wrapper.text()).toContain('จำนวน')
    })

    it('renders formatted cell values via formatter', () => {
      const wrapper = mountTable()
      expect(wrapper.text()).toContain('REF-001')
      expect(wrapper.text()).toContain('REF-002')
    })

    it('renders sequential row numbers starting from 1', () => {
      const wrapper = mountTable()
      const rows = wrapper.findAll('tbody tr')
      // first td of each row is the row number
      expect(rows[0].find('td').text()).toBe('1')
      expect(rows[1].find('td').text()).toBe('2')
    })

    it('renders default action header "จัดการ"', () => {
      const wrapper = mountTable()
      expect(wrapper.text()).toContain('จัดการ')
    })
  })

  describe('empty state', () => {
    it('renders EmptyState stub when transactions is empty', () => {
      const wrapper = mountTable({ transactions: [] })
      expect(wrapper.find('.empty-state').exists()).toBe(true)
    })

    it('does not render table when transactions is empty', () => {
      const wrapper = mountTable({ transactions: [] })
      expect(wrapper.find('table').exists()).toBe(false)
    })

    it('renders custom empty slot when provided', () => {
      const wrapper = mountTable({ transactions: [] }, { empty: '<p id="custom-empty">ไม่มีรายการ</p>' })
      expect(wrapper.find('#custom-empty').exists()).toBe(true)
    })
  })

  describe('row interactions', () => {
    it('emits row-click with transaction data when row is clicked', async () => {
      const wrapper = mountTable()
      await wrapper.findAll('tbody tr')[0].trigger('click')
      expect(wrapper.emitted('row-click')).toBeTruthy()
      expect(wrapper.emitted('row-click')[0][0]).toEqual(TRANSACTIONS[0])
    })

    it('emits row-click for second row with correct data', async () => {
      const wrapper = mountTable()
      await wrapper.findAll('tbody tr')[1].trigger('click')
      expect(wrapper.emitted('row-click')[0][0]).toEqual(TRANSACTIONS[1])
    })
  })

  describe('issuedIds highlighting', () => {
    it('applies red background class to rows whose id is in issuedIds', () => {
      const wrapper = mountTable({ issuedIds: { 'txn-1': true } })
      const rows = wrapper.findAll('tbody tr')
      expect(rows[0].classes()).toContain('bg-red-50')
      expect(rows[1].classes()).not.toContain('bg-red-50')
    })
  })

  describe('filter tabs', () => {
    const TABS: FilterTab[] = [
      { key: 'all', label: 'ทั้งหมด', count: 2 },
      { key: 'completed', label: 'สำเร็จ', count: 1 },
    ]

    it('renders filter tabs when showFilterTabs is true', () => {
      const wrapper = mountTable({ showFilterTabs: true, filterTabs: TABS, activeFilter: 'all' })
      expect(wrapper.text()).toContain('ทั้งหมด')
      expect(wrapper.text()).toContain('สำเร็จ')
    })

    it('emits update:activeFilter when a tab is clicked', async () => {
      const wrapper = mountTable({ showFilterTabs: true, filterTabs: TABS, activeFilter: 'all' })
      const buttons = wrapper.findAll('button').filter(b => b.text().includes('สำเร็จ'))
      await buttons[0].trigger('click')
      expect(wrapper.emitted('update:activeFilter')).toBeTruthy()
      expect(wrapper.emitted('update:activeFilter')[0][0]).toBe('completed')
    })

    it('renders tab count badge', () => {
      const wrapper = mountTable({ showFilterTabs: true, filterTabs: TABS, activeFilter: 'all' })
      expect(wrapper.text()).toContain('2')
    })
  })

  describe('pagination', () => {
    const MANY_TXNS = Array.from({ length: 15 }, (_, i) => ({
      id: `txn-${i + 1}`,
      ref: `${i + 1}`.padStart(3, '0'),
      amount: (i + 1) * 100,
    }))

    it('shows only pageSize rows when showPagination is true', () => {
      const wrapper = mountTable({ transactions: MANY_TXNS, showPagination: true, pageSize: 10 })
      expect(wrapper.findAll('tbody tr')).toHaveLength(10)
    })

    it('renders pagination controls when there are multiple pages', () => {
      const wrapper = mountTable({ transactions: MANY_TXNS, showPagination: true, pageSize: 10 })
      expect(wrapper.text()).toContain('หน้า 1 จาก 2')
    })

    it('navigates to next page when "ถัดไป" is clicked', async () => {
      const wrapper = mountTable({ transactions: MANY_TXNS, showPagination: true, pageSize: 10 })
      const nextBtn = wrapper.findAll('button').find(b => b.text().includes('ถัดไป'))
      await nextBtn.trigger('click')
      expect(wrapper.text()).toContain('หน้า 2 จาก 2')
      expect(wrapper.findAll('tbody tr')).toHaveLength(5)
    })

    it('emits page-change when navigating', async () => {
      const wrapper = mountTable({ transactions: MANY_TXNS, showPagination: true, pageSize: 10 })
      const nextBtn = wrapper.findAll('button').find(b => b.text().includes('ถัดไป'))
      await nextBtn.trigger('click')
      expect(wrapper.emitted('page-change')).toBeTruthy()
      expect(wrapper.emitted('page-change')[0][0]).toBe(2)
    })

    it('does not show pagination when all rows fit on one page', () => {
      const wrapper = mountTable({ transactions: TRANSACTIONS, showPagination: true, pageSize: 10 })
      expect(wrapper.text()).not.toContain('หน้า')
    })
  })

  describe('custom slots', () => {
    it('renders action-header slot content instead of default "จัดการ"', () => {
      const wrapper = mountTable({}, { 'action-header': '<span id="ah">ดำเนินการ</span>' })
      expect(wrapper.find('#ah').exists()).toBe(true)
    })

    it('renders actions slot per row', () => {
      const wrapper = mountTable(
        {},
        { actions: '<button class="custom-action">แก้ไข</button>' },
      )
      const actionBtns = wrapper.findAll('.custom-action')
      expect(actionBtns).toHaveLength(TRANSACTIONS.length)
    })
  })
})
