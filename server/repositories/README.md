# 🏗️ Repository Pattern Architecture

## 📖 Overview

This project uses the **Repository Pattern** to abstract data sources (JSON & Firestore), enabling seamless switching between them without affecting business logic.

## 🎯 Purpose

- **Decouple**: Separate data access from business logic
- **Flexible**: Swap data sources (JSON ↔ Firestore) with 1 line change
- **Testable**: Easy to mock repositories for testing
- **Scalable**: Support multiple data sources simultaneously

## 📁 Directory Structure

```
project/
├── types/
│   └── repositories.ts                  # Interface definitions
│
├── server/
│   └── repositories/
│       ├── sales-json.repository.ts     # JSON implementation (NOW)
│       └── sales-firestore.repository.ts # Firestore (FUTURE)
│
├── stores/
│   └── sales.ts                         # Uses repository
│
└── public/
    └── data/
        └── daily-sales.json             # Sample data file
```

## 🚀 Current Status: Phase 1 (Development with JSON)

### Active Repository
- **Class**: `SalesJsonRepository`
- **File**: `server/repositories/sales-json.repository.ts`
- **Data Storage**: `public/data/daily-sales.json`
- **Use Case**: Development, testing, rapid iteration

### Why JSON for now?
✅ No Firebase setup needed
✅ Instant development
✅ Easy to modify data
✅ Version control friendly (git)
✅ Perfect for UX/UI iteration

## 📝 Interface: ISalesRepository

All repositories must implement this interface:

```typescript
interface ISalesRepository {
  // Initialization
  init(): Promise<void>
  
  // READ operations
  fetch(startDate: string, endDate: string): Promise<DailySalesEntry[]>
  getById(id: string): Promise<DailySalesEntry>
  getAll(): Promise<DailySalesEntry[]>
  getByStatus(status: 'submitted' | 'audited' | 'approved'): Promise<DailySalesEntry[]>
  count(): Promise<number>
  
  // WRITE operations
  add(sale: Omit<DailySalesEntry, 'id' | 'submittedAt'>): Promise<DailySalesEntry>
  update(id: string, updates: Partial<DailySalesEntry>): Promise<void>
  delete(id: string): Promise<void>
}
```

## 💾 Using JSON Repository

### In Store (`stores/sales.ts`)

```typescript
import { salesJsonRepository } from '~/server/repositories/sales-json.repository'

export const useSalesStore = defineStore('sales', {
  // ... state

  actions: {
    async fetchDailySales(startDate: string, endDate: string) {
      this.dailySales = await salesJsonRepository.fetch(startDate, endDate)
    },

    async addDailySale(sale: DailySalesEntry) {
      const newSale = await salesJsonRepository.add(sale)
      this.dailySales.push(newSale)
    },

    async updateDailySale(id: string, updates: Partial<DailySalesEntry>) {
      await salesJsonRepository.update(id, updates)
      // Update local state...
    },

    async deleteDailySale(id: string) {
      await salesJsonRepository.delete(id)
      // Update local state...
    },
  },
})
```

### In Components

```vue
<script setup lang="ts">
import { useSalesStore } from '~/stores/sales'

const salesStore = useSalesStore()

// Components don't care about repository!
// They just use the store
const sales = computed(() => salesStore.dailySales)

async function loadSales() {
  await salesStore.fetchDailySales(startDate, endDate)
}
</script>
```

## 🔥 Phase 2: Migration to Firestore (Future)

### What changes?
```typescript
// ✅ ONLY change import (1 line!)
import { createSalesFirestoreRepository } from '~/server/repositories/sales-firestore.repository'
const salesRepository = createSalesFirestoreRepository(db)
```

### What stays the same?
- ❌ Store code: **UNCHANGED**
- ❌ Component code: **UNCHANGED**
- ❌ UI code: **UNCHANGED**

## 📊 Data Flow

### JSON Repository
```
Component → Store → JSONRepository → File I/O
                   ↓
              public/data/daily-sales.json
```

### Firestore Repository (Future)
```
Component → Store → FirestoreRepository → Firestore
                   ↓
              Firebase (Cloud)
```

**Same Store & Component code for both! 🎉**

## 🔄 Read/Write Operations

### READ: Fetch Sales

**Current (JSON)**:
```typescript
// In memory, very fast
const sales = await salesJsonRepository.fetch('2026-01-01', '2026-01-31')
// Returns: DailySalesEntry[]
```

**Future (Firestore)**:
```typescript
// From cloud, same interface, same result
const sales = await salesFirestoreRepository.fetch('2026-01-01', '2026-01-31')
// Returns: DailySalesEntry[]
```

### WRITE: Add Sales

**Current (JSON)**:
```typescript
const newSale = await salesJsonRepository.add({
  date: '2026-01-28',
  cashierId: 'cashier-001',
  // ... other fields
})
// Returns: DailySalesEntry (with auto-generated ID)
```

**Future (Firestore)**:
```typescript
// Same code, same result!
const newSale = await salesFirestoreRepository.add({
  date: '2026-01-28',
  cashierId: 'cashier-001',
  // ... other fields
})
// Returns: DailySalesEntry (with Firestore ID)
```

## 📈 Scaling Timeline

| Phase | Period | Tech | Status |
|-------|--------|------|--------|
| 1 | Week 1-4 | JSON | ✅ Active |
| 2 | Week 5 | JSON | Testing |
| 3 | Week 6+ | Firestore | Migration |

## ✨ Benefits of This Approach

### For Development
- ✅ No Firebase setup delays
- ✅ Instant API responses
- ✅ Easy data manipulation
- ✅ Perfect for iteration

### For Testing
- ✅ Easy to mock repositories
- ✅ Deterministic data
- ✅ No network dependencies
- ✅ Fast test execution

### For Production
- ✅ Switch to Firestore when needed
- ✅ Real-time sync capability
- ✅ Infinite scaling
- ✅ Better security (Firestore Rules)

### For Maintenance
- ✅ Clear separation of concerns
- ✅ Single responsibility principle
- ✅ Easy to add new repositories
- ✅ Easy to test implementations

## 🔐 Security Considerations

### JSON (Current)
- ⚠️ No built-in security
- ✅ OK for development
- ❌ NOT for production with user data

### Firestore (Future)
- ✅ Security Rules
- ✅ Authentication required
- ✅ Row-level access control
- ✅ Encryption at rest

## 📚 Related Documentation

- [STATE_MANAGEMENT_ARCHITECTURE.md](./STATE_MANAGEMENT_ARCHITECTURE.md) - Full Pinia + Repository guide
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Data structure details
- [DEVELOPMENT_ROADMAP.md](../REQUIREMENTS/DEVELOPMENT_ROADMAP.md) - Project timeline

## ❓ FAQ

### Q: When should we migrate to Firestore?
A: When you have concurrent users or production deployment needs.

### Q: Will data in JSON file be lost?
A: Only if you delete the file. Best practice: version control JSON files.

### Q: Can we run both repositories simultaneously?
A: Yes! You could have JSONRepository for testing and FirestoreRepository for prod.

### Q: What about data migration?
A: When migrating, export JSON → import to Firestore (tools available).

## 🚀 Next Steps

1. **Week 1-4**: Develop with JSON repository
2. **Week 5**: Complete testing and refinement
3. **Week 6**: Create Firestore repository if needed
4. **Week 7**: Migrate data and switch

---

**Last Updated**: January 28, 2026
**Architecture**: Repository Pattern with JSON/Firestore abstraction
**Status**: Phase 1 (JSON Development)
