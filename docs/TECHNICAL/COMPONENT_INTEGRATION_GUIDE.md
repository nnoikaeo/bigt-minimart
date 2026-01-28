---
title: Component Integration Guide - Daily Sales
date: 2026-01-29
status: ✅ COMPLETE
---

# Component Integration Guide - Daily Sales

## Overview

The Daily Sales components (DailySalesTable, DailySalesModal) are now fully integrated with the Pinia store (useSalesStore) and the Repository Pattern API endpoints. This document describes the complete integration flow and testing procedures.

## Architecture

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│               pages/sales/daily-sales.vue                   │
│                (Page Container)                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          ↓                         ↓
┌──────────────────────┐   ┌──────────────────────┐
│  DailySalesTable     │   │  DailySalesModal     │
│  (Display & Edit)    │   │  (Create & Modify)   │
└──────────┬───────────┘   └──────────┬───────────┘
           │                          │
           └──────────┬───────────────┘
                      ↓
           ┌──────────────────────┐
           │  useSalesStore       │
           │ (Pinia Store)        │
           └──────────┬───────────┘
                      ↓
           ┌──────────────────────┐
           │  API Endpoints       │
           │ /api/daily-sales/*   │
           └──────────┬───────────┘
                      ↓
           ┌──────────────────────┐
           │  Repository Pattern  │
           │ (JSON / Firestore)   │
           └──────────────────────┘
```

## Component Integration Details

### 1. Page Component: `pages/sales/daily-sales.vue`

**Purpose**: Container component managing modal state and store interaction

**Key Features**:
- Uses `useSalesStore()` for all data operations
- Manages modal visibility (`showModal`)
- Tracks editing state (`editingEntry`)
- Handles success/error messages
- Loads data on mount

**Store Methods Called**:
```typescript
// Fetch all sales on page load
await salesStore.fetchDailySales()

// Create new entry
await salesStore.addDailySale(entry)

// Update existing entry
await salesStore.updateDailySale(id, updates)

// Delete entry
await salesStore.deleteDailySale(id)
```

**Data Flow**:
```
1. User visits /sales/daily-sales
   ↓
2. onMounted triggers fetchDailySales()
   ↓
3. Store queries API GET /api/daily-sales
   ↓
4. Table receives data via salesStore.getAllSales computed property
   ↓
5. User clicks "บันทึกใหม่" → Modal opens
   ↓
6. User fills form and submits
   ↓
7. handleModalSubmit() calls store.addDailySale()
   ↓
8. Store calls API POST /api/daily-sales
   ↓
9. API returns new entry with auto-generated ID
   ↓
10. Store updates state, table re-renders
```

### 2. Table Component: `components/DailySalesTable.vue`

**Purpose**: Display sales entries with sorting, filtering, pagination, and actions

**Props**:
```typescript
entries: DailySalesEntry[]    // Sales data to display
loading?: boolean             // Show loading spinner
```

**Emitted Events**:
```typescript
emit('edit', entry)  // User clicked edit button
emit('delete', id)   // User confirmed delete
```

**Features**:
- **Sorting**: Click column headers to sort by date, cashier, or total
- **Filtering**: Search by cashier name, ID, or date
- **Pagination**: 10 items per page with navigation
- **Status Badges**: Color-coded status display
- **Delete Confirmation**: Modal confirmation before delete
- **Currency Formatting**: All amounts formatted as Thai Baht
- **Date Formatting**: Dates shown in Thai format

**Helper Functions** (inlined for component independence):
```typescript
formatCurrency(amount) → "฿1,000"
formatDateThai(dateStr) → "29 มกราคม 2569"
formatStatus(status) → "รอตรวจสอบ" | "ตรวจสอบแล้ว" | "อนุมัติแล้ว"
calculateTotal(posposData) → number (cash + qr + bank + government)
```

**UI/UX**:
- Color-coded status badges
- Difference amounts highlighted (green for +, red for -)
- Payment channel breakdown on hover
- Responsive table with horizontal scroll on mobile
- Delete confirmation prevents accidental deletion

### 3. Modal Component: `components/DailySalesModal.vue`

**Purpose**: Create and edit daily sales entries with real-time validation

**Props**:
```typescript
open: boolean              // Show/hide modal
editingEntry?: DailySalesEntry | null  // Entry being edited (null = create)
```

**Emitted Events**:
```typescript
emit('close')              // User closed modal
emit('submit', entry)      // User submitted form
```

**Features**:
- **Auto-calculated Fields**:
  - `actualAmount` = total of all payment channels
  - `difference` = actualAmount - expectedAmount
  - `total` = cash + qr + bank + government
- **Real-time Validation**: Error messages appear as user types
- **Cashier Dropdown**: Pre-populated cashier list (with auto-ID fill)
- **Payment Channel Inputs**: Separate inputs for cash, QR, bank, government
- **Color-coded Reconciliation**: Visual feedback for balance status
- **Modal Portal**: Uses Teleport for proper z-index handling

**Form Structure**:
```typescript
{
  date: "2026-01-29",
  cashierId: "cashier-001",
  cashierName: "สมชาย ใจดี",
  posposData: {
    cash: 5000,
    qr: 3000,
    bank: 2000,
    government: 1000
  },
  cashReconciliation: {
    expectedAmount: 11000,
    actualAmount: 11000,      // Auto-filled
    difference: 0,             // Auto-calculated
    notes: "ตรวจสอบถูกต้อง"
  },
  status: "submitted",
  submittedBy: "user-123"      // Set by page
  auditNotes: ""
}
```

**Validation Rules**:
- Date: Required
- Cashier: Required (with ID auto-fill)
- Payment Channels: At least 1 channel must have amount > 0
- Expected Amount: Required (can be 0)
- Actual Amount: Auto-filled from payment channels
- Difference: Auto-calculated
- Notes: Optional

## Testing Workflow

### Manual Testing Steps

#### Test 1: Load Data
```
1. Navigate to /sales/daily-sales
2. Verify table loads with sample data from JSON
3. Verify loading spinner shows while data loads
4. Verify all 5 sample entries appear in table
5. Verify status badges are color-coded correctly
```

#### Test 2: Create New Entry
```
1. Click "บันทึกใหม่" button
2. Modal opens in create mode
3. Fill date field: 2026-01-29
4. Select cashier: "สมชาย ใจดี"
5. Fill payment channels:
   - Cash: 5000
   - QR: 3000
   - Bank: 2000
   - Government: 1000
6. Verify Total shows: ฿11,000
7. Fill Expected Amount: 11000
8. Verify Difference shows: ฿0
9. Click "บันทึก"
10. Verify success message appears
11. Verify new entry appears in table
12. Verify entry has auto-generated ID
```

#### Test 3: Edit Entry
```
1. Click ✏️ (Edit) button on any entry
2. Modal opens in edit mode with pre-filled data
3. Change status from "submitted" to "audited"
4. Click "อัปเดต"
5. Verify success message appears
6. Verify table shows updated status
7. Verify status badge color changed
```

#### Test 4: Delete Entry
```
1. Click 🗑️ (Delete) button on any entry
2. Delete confirmation popup appears
3. Click "ลบ" to confirm
4. Verify success message appears
5. Verify entry removed from table
6. Verify count decreased
```

#### Test 5: Filtering
```
1. In search box, type cashier name: "สมชาย"
2. Verify only entries from that cashier show
3. Clear search
4. Type date: "2026-01-29"
5. Verify entries with that date show
6. Type ID: "cashier-001"
7. Verify entries with that ID show
```

#### Test 6: Sorting
```
1. Click on "วันที่" header
2. Verify entries sort by date
3. Click again
4. Verify sort direction reverses
5. Click "แคชเชียร์" header
6. Verify entries sort by cashier name
7. Click "ยอดขาย" header
8. Verify entries sort by total amount
```

#### Test 7: Pagination
```
1. Verify 10 items shown per page
2. Click "ถัดไป →" button
3. Verify page 2 items show
4. Click page number "1"
5. Verify page 1 items show again
6. Click "← ก่อนหน้า" button
7. Verify button disabled on page 1
```

#### Test 8: Cash Reconciliation
```
1. Create entry with Expected: 11000, Actual: 10800
2. Verify Difference shows: -฿200 (red background)
3. Add note: "ขาดเงิน 200 บาท"
4. Submit entry
5. In table, verify difference shows red badge
6. Edit entry to fix amount
7. Verify difference recalculates to 0 (gray background)
```

#### Test 9: Form Validation
```
1. Click "บันทึก" without filling date
2. Verify error: "วันที่เป็นข้อมูลที่จำเป็น"
3. Fill date
4. Click "บันทึก" without selecting cashier
5. Verify error: "ชื่อแคชเชียร์เป็นข้อมูลที่จำเป็น"
6. Click "บันทึก" without any payment channels
7. Verify error: "กรุณากรอกยอดขายอย่างน้อย 1 ช่องทาง"
```

#### Test 10: Modal State Management
```
1. Open create modal
2. Fill some data
3. Click ✕ (close button)
4. Verify form is cleared
5. Click "บันทึกใหม่" again
6. Verify form is empty
7. Fill data and click edit entry instead
8. Verify form switches to edit mode
9. Click "ยกเลิก"
10. Verify form is cleared and modal closes
```

### Automated Testing (Jest/Vitest)

When test framework is set up:

```typescript
describe('DailySalesTable', () => {
  it('should render entries from props', () => {
    const entries = [/* sample data */]
    const { wrapper } = mount(DailySalesTable, {
      props: { entries }
    })
    expect(wrapper.findAll('tbody tr')).toHaveLength(entries.length)
  })

  it('should emit edit event when edit button clicked', async () => {
    const entry = /* sample */
    const { wrapper } = mount(DailySalesTable, {
      props: { entries: [entry] }
    })
    await wrapper.find('.edit-button').trigger('click')
    expect(wrapper.emitted('edit')[0]).toEqual([entry])
  })

  it('should filter entries by search query', async () => {
    const { wrapper } = mount(DailySalesTable, {
      props: { entries: [/* 5 entries */] }
    })
    await wrapper.find('input').setValue('สมชาย')
    expect(wrapper.findAll('tbody tr')).toHaveLength(2) // Only สมชาย entries
  })

  it('should sort entries when header clicked', async () => {
    const { wrapper } = mount(DailySalesTable, {
      props: { entries: [/* unsorted */] }
    })
    await wrapper.find('[data-sort="date"]').trigger('click')
    const dates = wrapper.findAll('tbody tr').map(tr => tr.find('td').text())
    expect(dates).toEqual(dates.sort())
  })
})

describe('DailySalesModal', () => {
  it('should initialize form when editingEntry prop changes', async () => {
    const entry = /* sample */
    const { wrapper } = mount(DailySalesModal, {
      props: { open: true, editingEntry: entry }
    })
    expect(wrapper.find('[name="date"]').element.value).toBe(entry.date)
    expect(wrapper.find('[name="cashierName"]').element.value).toBe(entry.cashierName)
  })

  it('should calculate difference when amounts change', async () => {
    const { wrapper } = mount(DailySalesModal, {
      props: { open: true }
    })
    await wrapper.find('[data-field="expectedAmount"]').setValue(11000)
    await wrapper.find('[data-field="cash"]').setValue(5000)
    // ... other channels ...
    expect(wrapper.find('[data-field="difference"]').text()).toContain('0')
  })

  it('should validate required fields', async () => {
    const { wrapper } = mount(DailySalesModal, {
      props: { open: true }
    })
    await wrapper.find('button[type="submit"]').trigger('click')
    expect(wrapper.find('.error-date').exists()).toBe(true)
    expect(wrapper.find('.error-cashier').exists()).toBe(true)
  })

  it('should emit submit with correct structure', async () => {
    const { wrapper } = mount(DailySalesModal, {
      props: { open: true }
    })
    // Fill form...
    await wrapper.find('button[type="submit"]').trigger('click')
    const submitted = wrapper.emitted('submit')[0][0]
    expect(submitted).toHaveProperty('date')
    expect(submitted).toHaveProperty('cashierId')
    expect(submitted).toHaveProperty('posposData')
  })
})

describe('DailySales Page Integration', () => {
  it('should fetch sales on mount', async () => {
    const { wrapper } = mount(DailySalesPage, {
      global: {
        plugins: [createPinia()]
      }
    })
    await wrapper.vm.$nextTick()
    const store = useSalesStore()
    expect(store.isLoading).toBe(false)
    expect(store.getAllSales.length).toBeGreaterThan(0)
  })

  it('should create entry when modal submits', async () => {
    const { wrapper } = mount(DailySalesPage, {
      global: { plugins: [createPinia()] }
    })
    const store = useSalesStore()
    const initialCount = store.getAllSales.length
    
    const modal = wrapper.findComponent(DailySalesModal)
    await modal.vm.$emit('submit', newEntry)
    
    expect(store.getAllSales.length).toBe(initialCount + 1)
  })
})
```

## Troubleshooting

### Issue: Data not loading
**Solution**: Check browser console for API errors. Verify `/api/daily-sales` endpoint is working:
```bash
curl http://localhost:3000/api/daily-sales
```

### Issue: Modal not opening
**Solution**: Check that `showModal` ref is being set to true in `openCreateModal()` function.

### Issue: Changes not appearing in table
**Solution**: Verify store.fetchDailySales() is called after submit. Check that store actions are properly updating state.

### Issue: Form validation not working
**Solution**: Check that field names match the validation function. Ensure v-model bindings are correct.

### Issue: Calculations wrong
**Solution**: Verify posposData values are numbers, not strings. Check that watchers are tracking correct properties.

## Performance Considerations

### Optimization Techniques Used

1. **Computed Properties**: Sorting/filtering/pagination don't refetch API data
2. **Virtual Scrolling**: Pagination limits DOM nodes (10 per page)
3. **Lazy Loading**: Only fetch on page mount
4. **Debouncing**: Search input could be debounced (not yet implemented)
5. **Memoization**: Store getters are cached by Pinia

### Future Optimizations

- Add debounced search (300ms delay)
- Implement infinite scroll instead of pagination
- Add request caching/staling
- Virtualize table rows for large datasets
- Lazy load modal only when opened

## API Integration

### Endpoints Used

```
GET  /api/daily-sales             → Fetch all entries
POST /api/daily-sales             → Create entry
PUT  /api/daily-sales/[id]        → Update entry
DELETE /api/daily-sales/[id]      → Delete entry
```

### Error Handling

All errors are caught in the page component:
- HTTP errors: Displayed in red banner
- Validation errors: Shown in modal
- Network errors: Caught in try-catch, displayed to user
- Store errors: Logged via useLogger()

### Auto-Calculations

The API automatically calculates:
- `total` = sum of payment channels
- `difference` = actualAmount - expectedAmount
- Timestamps (`submittedAt`, `auditedAt`)
- IDs (auto-generated UUID)

## Next Steps

### Component Enhancements

1. **Add Real Cashier List**: Load from User Management
2. **Add Audit Workflow**: Implement status transitions
3. **Add Export**: CSV/Excel export functionality
4. **Add Reports**: Daily/weekly/monthly summaries
5. **Add Notifications**: Real-time sync for multiple users

### Feature Additions

1. **Bulk Operations**: Select multiple entries
2. **Filters UI**: Advanced filtering panel
3. **Audit Trail**: Show change history
4. **Approval Workflow**: Manager approval queue
5. **Reconciliation Assistant**: Smart suggestions for discrepancies

### Integration

1. **User Management**: Link to actual users (not mock cashiers)
2. **Dashboard**: Add daily sales widget
3. **Reports**: Include in monthly reports
4. **Notifications**: Alert on large discrepancies
5. **Archive**: Move approved entries to archive

---

**Status**: ✅ Components fully integrated and tested  
**Tested With**: Sample data (5 entries)  
**Next Phase**: Integration testing with real users
