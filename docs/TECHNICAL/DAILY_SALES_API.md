---
title: Daily Sales API - Week 3 Implementation
description: Complete Daily Sales CRUD API using Repository Pattern
---

# Daily Sales API - Complete Implementation

## Overview

The Daily Sales API implements the complete CRUD operations (Create, Read, Update, Delete) using the Repository Pattern for data abstraction. This allows seamless switching between JSON (development) and Firestore (production) without changing store code.

**Phase 1 (Week 3-5)**: Uses `salesJsonRepository` (JSON files)
**Phase 2 (Week 6+)**: Switch to `salesFirestoreRepository` (Firestore) - just change one import!

## Architecture Flow

```
Component (DailySalesTable, DailySalesForm, etc.)
    ↓ (dispatch actions)
Pinia Store (stores/sales.ts)
    ↓ (call methods)
Repository Interface (ISalesRepository)
    ↓ (polymorphic implementation)
JSON Repository (development) / Firestore Repository (production)
    ↓ (CRUD operations)
Data Source (public/data/daily-sales.json / Firestore collection)
```

## API Endpoints

All endpoints are located in `server/api/daily-sales/`:

### 1. GET /api/daily-sales
**Fetch all daily sales entries with optional filtering**

```typescript
// Query Parameters (all optional)
?dateFrom=2026-01-28      // ISO date format (YYYY-MM-DD)
&dateTo=2026-01-30        // ISO date format (YYYY-MM-DD)
&status=submitted         // 'submitted' | 'audited' | 'approved'
&cashierName=สมชาย        // Partial match, case-insensitive
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "sales-1674882645000-abc123def",
      "date": "2026-01-28",
      "cashierId": "cashier-001",
      "cashierName": "สมชาย",
      "posposData": {
        "cash": 10000,
        "qr": 5000,
        "bank": 3000,
        "government": 2000
      },
      "cashReconciliation": {
        "expectedAmount": 20000,
        "actualAmount": 20000,
        "difference": 0,
        "notes": ""
      },
      "total": 20000,
      "status": "submitted",
      "submittedAt": "2026-01-28T14:30:45.000Z",
      "submittedBy": "auditor-001"
    }
  ],
  "count": 5
}
```

**Implementation:**
- File: [server/api/daily-sales/index.get.ts](server/api/daily-sales/index.get.ts)
- Uses: `salesJsonRepository.getAll()`
- Filtering: Client-side (applied after repository retrieval)
- Sorting: By date descending (newest first)

---

### 2. POST /api/daily-sales
**Create a new daily sales entry**

**Request Body:**
```json
{
  "date": "2026-01-29",
  "cashierId": "cashier-001",
  "cashierName": "สมชาย ใจดี",
  "posposData": {
    "cash": 5000,
    "qr": 3000,
    "bank": 2000,
    "government": 1000
  },
  "cashReconciliation": {
    "expectedAmount": 11000,
    "actualAmount": 11000,
    "difference": 0,
    "notes": "ตรวจสอบถูกต้อง"
  },
  "status": "submitted"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "sales-1675227645000-new",
    "date": "2026-01-29",
    "cashierId": "cashier-001",
    "cashierName": "สมชาย ใจดี",
    "posposData": { ... },
    "cashReconciliation": { ... },
    "total": 11000,
    "status": "submitted",
    "submittedAt": "2026-01-29T10:30:00.000Z",
    "submittedBy": "user-123"
  },
  "message": "Daily sales entry created successfully"
}
```

**Implementation:**
- File: [server/api/daily-sales/index.post.ts](server/api/daily-sales/index.post.ts)
- Validation: Using Zod schema
- Auto-calculated fields:
  - `total` = cash + qr + bank + government
  - `difference` = actualAmount - expectedAmount
  - `id` = auto-generated UUID
  - `submittedAt` = current timestamp
  - `submittedBy` = authenticated user ID

**Error Responses:**
- 400: Invalid input (validation error)
- 401: Unauthorized (not logged in)
- 500: Server error

---

### 3. PUT /api/daily-sales/[id]
**Update an existing daily sales entry**

**Request Parameters:**
- `id` (URL path parameter) - Sales entry ID

**Request Body (all fields optional):**
```json
{
  "status": "audited",
  "auditNotes": "ตรวจสอบแล้ว",
  "cashReconciliation": {
    "expectedAmount": 11000,
    "actualAmount": 10800,
    "difference": -200,
    "notes": "ขาดเงิน 200 บาท"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "sales-1674882645000-abc123def",
    "date": "2026-01-28",
    ...
    "status": "audited",
    "auditNotes": "ตรวจสอบแล้ว",
    ...
  },
  "message": "Sales entry updated successfully"
}
```

**Implementation:**
- File: [server/api/daily-sales/[id].put.ts](server/api/daily-sales/%5Bid%5D.put.ts)
- Uses: `salesJsonRepository.update(id, updates)`
- Auto-recalculation:
  - If `cashReconciliation` changes: recalculate `difference`
  - If `posposData` changes: recalculate `total`
- Ownership check: Only entry creator can update

**Error Responses:**
- 400: Invalid input
- 401: Unauthorized
- 403: Permission denied (not owner)
- 404: Entry not found
- 500: Server error

---

### 4. DELETE /api/daily-sales/[id]
**Delete a daily sales entry**

**Request Parameters:**
- `id` (URL path parameter) - Sales entry ID

**Response:**
```json
{
  "success": true,
  "message": "Sales entry deleted successfully"
}
```

**Implementation:**
- File: [server/api/daily-sales/[id].delete.ts](server/api/daily-sales/%5Bid%5D.delete.ts)
- Uses: `salesJsonRepository.delete(id)`
- Ownership check: Only entry creator can delete
- Soft delete: Can be implemented by setting status='deleted'

**Error Responses:**
- 401: Unauthorized
- 403: Permission denied (not owner)
- 404: Entry not found
- 500: Server error

---

## Data Structure: DailySalesEntry

```typescript
interface DailySalesEntry {
  // Identifiers & Metadata
  id: string                                    // Auto-generated ID
  date: string                                  // ISO format: YYYY-MM-DD
  cashierId: string                             // Reference to cashier
  cashierName: string                           // Cashier's name (denormalized)
  
  // Sales Data from POS System
  posposData: {
    cash: number          // เงินสด
    qr: number           // QR Code
    bank: number         // ธนาคาร
    government: number   // โครงการรัฐ
  }
  
  // Cash Reconciliation
  cashReconciliation: {
    expectedAmount: number    // Amount expected from POS
    actualAmount: number      // Actual cash in drawer
    difference: number        // AUTO: actualAmount - expectedAmount
    notes?: string           // Notes about discrepancies
  }
  
  // Calculated Fields
  total?: number                // AUTO: sum of posposData
  
  // Workflow & Status
  status: 'submitted' | 'audited' | 'approved'
  auditNotes?: string
  
  // User & Timestamps
  submittedAt: string | Date    // ISO string or Date
  submittedBy?: string          // User ID
  auditedAt?: string | Date
  auditedBy?: string
  
  // System Fields
  createdAt?: string | Date
  updatedAt?: string | Date
}
```

## Store Integration: useSalesStore

The Pinia store (`stores/sales.ts`) provides a clean interface to use the API:

```typescript
import { useSalesStore } from '~/stores/sales'

// In a component:
const salesStore = useSalesStore()

// Fetch all sales
await salesStore.fetchDailySales()

// Add new entry
const newEntry = await salesStore.addDailySale({
  date: '2026-01-29',
  cashierId: 'cashier-001',
  // ... other fields
})

// Update entry
await salesStore.updateDailySale('sales-1674882645000-abc123def', {
  status: 'audited',
  auditNotes: 'Checked'
})

// Delete entry
await salesStore.deleteDailySale('sales-1674882645000-abc123def')

// Get filtered results
const pending = salesStore.getPendingSales  // status === 'submitted'
const filtered = salesStore.getFilteredSales
const stats = salesStore.getSalesStats
```

## Component Integration Examples

### Example 1: Daily Sales Form (Create)

```vue
<template>
  <form @submit.prevent="handleSubmit">
    <input v-model="form.date" type="date" required />
    <input v-model="form.cashierId" placeholder="Cashier ID" required />
    <input v-model="form.cashierName" placeholder="Cashier Name" required />
    
    <!-- Payment method inputs -->
    <input v-model.number="form.posposData.cash" type="number" placeholder="Cash" />
    <input v-model.number="form.posposData.qr" type="number" placeholder="QR" />
    <input v-model.number="form.posposData.bank" type="number" placeholder="Bank" />
    <input v-model.number="form.posposData.government" type="number" placeholder="Government" />
    
    <!-- Reconciliation -->
    <input v-model.number="form.cashReconciliation.expectedAmount" type="number" />
    <input v-model.number="form.cashReconciliation.actualAmount" type="number" />
    
    <button type="submit" :disabled="isLoading">
      {{ isLoading ? 'Saving...' : 'Save Entry' }}
    </button>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useSalesStore } from '~/stores/sales'
import type { DailySalesEntry } from '~/types/repositories'

const salesStore = useSalesStore()

const form = ref({
  date: new Date().toISOString().split('T')[0],
  cashierId: '',
  cashierName: '',
  posposData: { cash: 0, qr: 0, bank: 0, government: 0 },
  cashReconciliation: {
    expectedAmount: 0,
    actualAmount: 0,
    notes: '',
  },
  status: 'submitted' as const,
})

const isLoading = ref(false)

const handleSubmit = async () => {
  isLoading.value = true
  try {
    await salesStore.addDailySale(form.value as Omit<DailySalesEntry, 'id' | 'submittedAt'>)
    // Show success message
    form.value = { /* reset form */ }
  } catch (error) {
    console.error('Error saving:', error)
  } finally {
    isLoading.value = false
  }
}
</script>
```

### Example 2: Daily Sales Table (Read & Update)

```vue
<template>
  <table>
    <thead>
      <tr>
        <th @click="sortBy('date')">Date</th>
        <th @click="sortBy('cashierName')">Cashier</th>
        <th>Total</th>
        <th>Status</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="sale in sortedSales" :key="sale.id">
        <td>{{ sale.date }}</td>
        <td>{{ sale.cashierName }}</td>
        <td>{{ sale.total }}</td>
        <td>
          <select v-model="sale.status" @change="updateStatus(sale)">
            <option>submitted</option>
            <option>audited</option>
            <option>approved</option>
          </select>
        </td>
        <td>
          <button @click="deleteSale(sale.id)">Delete</button>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script setup lang="ts">
import { useSalesStore } from '~/stores/sales'

const salesStore = useSalesStore()

// Computed sorted sales
const sortedSales = computed(() => 
  salesStore.getSortedFilteredSales
)

const updateStatus = async (sale) => {
  await salesStore.updateDailySale(sale.id, {
    status: sale.status,
  })
}

const deleteSale = async (id: string) => {
  if (confirm('Delete this entry?')) {
    await salesStore.deleteDailySale(id)
  }
}
</script>
```

## Testing

Integration tests are provided in:
- [server/api/daily-sales/__tests__/integration.test.ts](server/api/daily-sales/__tests__/integration.test.ts)

Run tests:
```bash
npm run test
```

Test coverage includes:
- ✅ CRUD operations
- ✅ Data validation
- ✅ Filtering and sorting
- ✅ Error handling
- ✅ Authorization checks
- ✅ Auto-calculation of fields

## Sample Data

Sample daily sales data is provided in:
- [public/data/daily-sales.json](public/data/daily-sales.json)

Contains 5 sample entries with various statuses and scenarios:
- Balanced entries (difference = 0)
- Short entries (negative difference)
- Different payment methods
- Various approval statuses

## Repository Pattern Details

### Why Repository Pattern?

1. **Data Source Independence**: Easily switch JSON ↔ Firestore
2. **Testability**: Mock repository for unit tests
3. **Maintainability**: Centralized data logic
4. **Scalability**: Add new repositories (API, GraphQL, etc.)

### Current Implementation

- **JSON Repository** (development): [server/repositories/sales-json.repository.ts](server/repositories/sales-json.repository.ts)
- **Interface Contract**: [types/repositories.ts](types/repositories.ts)

### Future: Firestore Repository

When ready for production:
```typescript
// Just change this import in stores/sales.ts:
import { salesFirestoreRepository } from '~/server/repositories/sales-firestore.repository'

// Everything else stays the same! 🎉
```

## Migration to Firestore

When transitioning from JSON to Firestore (Week 6+):

1. Data is automatically migrated via import scripts
2. No store or component changes required
3. Only repository import changes
4. All API endpoints work identically

## Error Handling

All endpoints follow consistent error handling:

```typescript
throw createError({
  statusCode: 400,   // HTTP status
  message: 'User-friendly message',
  data: error.issues,  // Optional: validation details
})
```

Common status codes:
- **200**: Success
- **201**: Created (POST)
- **400**: Bad request (validation error)
- **401**: Unauthorized (not authenticated)
- **403**: Forbidden (permission denied)
- **404**: Not found
- **500**: Server error

## Performance Considerations

### Current (JSON)
- ✅ Instant reads from memory
- ✅ File I/O for writes (minimal)
- ✅ Perfect for development

### Future (Firestore)
- ✅ Real-time syncing
- ✅ Built-in authentication
- ✅ Scalable to millions of entries
- ✅ Automatic backups

## Debugging Tips

### Enable Logs

Set environment variable:
```bash
DEBUG=*
npm run dev
```

### Check Sample Data

Load sample data in browser:
```javascript
fetch('/api/daily-sales').then(r => r.json()).then(console.log)
```

### Test Endpoints

```bash
# Get all sales
curl http://localhost:3000/api/daily-sales

# Get sales by status
curl "http://localhost:3000/api/daily-sales?status=submitted"

# Create new entry
curl -X POST http://localhost:3000/api/daily-sales \
  -H "Content-Type: application/json" \
  -d '{"date":"2026-01-29",...}'
```

## Next Steps

- ✅ Week 3: Complete API implementation (DONE)
- ⏳ Week 4: Create Finance store (expenses)
- ⏳ Week 5: Create Dashboard & Reports
- ⏳ Week 6: Migration to Firestore
- ⏳ Week 7+: Advanced features (real-time sync, analytics)

## Files Modified/Created

- ✅ [server/api/daily-sales/index.get.ts](server/api/daily-sales/index.get.ts) - Updated
- ✅ [server/api/daily-sales/index.post.ts](server/api/daily-sales/index.post.ts) - Updated
- ✅ [server/api/daily-sales/[id].put.ts](server/api/daily-sales/%5Bid%5D.put.ts) - Updated
- ✅ [server/api/daily-sales/[id].delete.ts](server/api/daily-sales/%5Bid%5D.delete.ts) - Updated
- ✅ [stores/sales.ts](stores/sales.ts) - Created (Week 3)
- ✅ [types/repositories.ts](types/repositories.ts) - Updated (new DailySalesEntry fields)
- ✅ [public/data/daily-sales.json](public/data/daily-sales.json) - Updated (sample data)
- ✅ [server/api/daily-sales/__tests__/integration.test.ts](server/api/daily-sales/__tests__/integration.test.ts) - Created

## Support

For questions or issues:
1. Check [docs/TECHNICAL/STATE_MANAGEMENT_ARCHITECTURE.md](docs/TECHNICAL/STATE_MANAGEMENT_ARCHITECTURE.md)
2. Review repository pattern documentation
3. Check integration tests for usage examples
4. Debug with curl or Postman

---

**Status**: ✅ Week 3 API Implementation Complete
**Last Updated**: 2026-01-29
**Ready for**: Component integration and testing
