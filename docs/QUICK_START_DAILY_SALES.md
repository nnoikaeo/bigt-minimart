# 🎯 Quick Start: Daily Sales Testing

## For Users/Testers

### Quick Links
- **Main Page**: http://localhost:3000/sales/daily-sales
- **Sample Data**: `public/data/daily-sales.json` (5 entries)
- **Documentation**: See docs/ folder

### Getting Started (5 minutes)

```bash
# 1. Start the dev server
npm run dev

# 2. Navigate to Sales module
# http://localhost:3000/sales/daily-sales

# 3. You should see 5 sample entries loaded
```

### What You Can Do

1. **View Sales** - Table shows all entries
   - Sort by: Date, Cashier Name, Total
   - Filter by: Search box (cashier, date, ID)
   - Paginate: 10 entries per page

2. **Create New** - Click "บันทึกใหม่" button
   - Fill date, cashier, payment channels
   - Total auto-calculates
   - Submit creates entry

3. **Edit** - Click ✏️ button
   - Modify any field
   - Auto-calculations update
   - Save updates entry

4. **Delete** - Click 🗑️ button
   - Confirm deletion
   - Entry removed from table

### Quick Testing (10 minutes)

```
Task 1: Load data
- Page loads, table shows 5 entries
- Status badges visible

Task 2: Create entry
- Click "บันทึกใหม่"
- Fill: date, cashier, cash=1000, qr=500
- Total should show ฿1,500
- Click "บันทึก"
- Entry appears in table

Task 3: Edit entry
- Click edit on your new entry
- Change status
- Click "อัปเดต"
- Verify change in table

Task 4: Delete entry
- Click delete on any entry
- Confirm deletion
- Verify entry gone

Task 5: Filter
- Type cashier name in search
- Verify only those entries show
- Clear search
```

---

## For Developers

### File Locations
```
Components:
- pages/sales/daily-sales.vue         (190 lines, container)
- components/DailySalesTable.vue      (323 lines, display)
- components/DailySalesModal.vue      (422 lines, form)

Store:
- stores/sales.ts                     (447 lines, Pinia store)

Types:
- types/repositories.ts               (Full type definitions)

API:
- server/api/daily-sales/index.get.ts (Fetch)
- server/api/daily-sales/index.post.ts (Create)
- server/api/daily-sales/[id].put.ts  (Update)
- server/api/daily-sales/[id].delete.ts (Delete)

Data:
- public/data/daily-sales.json        (Sample data)

Tests:
- tests/integration/daily-sales.spec.ts (50+ tests)

Docs:
- docs/TECHNICAL/COMPONENT_INTEGRATION_GUIDE.md
- docs/PROGRESS/WEEK_03_COMPLETION_SUMMARY.md
- docs/TECHNICAL/DAILY_SALES_API.md
```

### Key Code Patterns

**Using the Store**
```typescript
import { useSalesStore } from '~/stores/sales'

const store = useSalesStore()
await store.fetchDailySales()
const entries = computed(() => store.getAllSales)
```

**API Call**
```bash
curl http://localhost:3000/api/daily-sales
```

**Component Props**
```typescript
// DailySalesTable props
entries: DailySalesEntry[]
loading?: boolean

// DailySalesModal props
open: boolean
editingEntry?: DailySalesEntry | null
```

### Running Tests

```bash
# Run all tests
npm run test

# Run specific test
npm run test daily-sales.spec.ts

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

---

## Architecture Diagram

```
┌─ User Interface ─────────────────────────────┐
│                                               │
│  DailySalesPage                              │
│  ├─ DailySalesTable (display, edit, delete) │
│  └─ DailySalesModal (create, update form)   │
│                                               │
└──────────────────┬──────────────────────────┘
                   │
                   ↓ useSalesStore()
                   │
┌─ State Management ───────────────────────────┐
│                                               │
│  Pinia Store (stores/sales.ts)               │
│  ├─ State: dailySales[], filters, stats     │
│  ├─ Getters: getAllSales, getPendingSales   │
│  └─ Actions: fetch, add, update, delete     │
│                                               │
└──────────────────┬──────────────────────────┘
                   │
                   ↓ API calls
                   │
┌─ API Layer ──────────────────────────────────┐
│                                               │
│  /api/daily-sales                            │
│  ├─ GET    (fetch entries with filters)     │
│  ├─ POST   (create new entry)               │
│  ├─ PUT    (update existing entry)          │
│  └─ DELETE (delete entry)                   │
│                                               │
└──────────────────┬──────────────────────────┘
                   │
                   ↓ uses Repository
                   │
┌─ Data Layer ─────────────────────────────────┐
│                                               │
│  Repository Pattern                          │
│  ├─ SalesJsonRepository (dev)               │
│  ├─ SalesFirestoreRepository (prod)         │
│  └─ ISalesRepository (interface)            │
│                                               │
└──────────────────┬──────────────────────────┘
                   │
                   ↓ persists to
                   │
┌─ Database ───────────────────────────────────┐
│                                               │
│  public/data/daily-sales.json (Week 3-5)    │
│  Firestore (Week 6+)                        │
│                                               │
└──────────────────────────────────────────────┘
```

---

## File Structure

```
Daily Sales Module
├─ UI Layer (Vue Components)
│  ├─ pages/sales/daily-sales.vue
│  ├─ components/DailySalesTable.vue
│  └─ components/DailySalesModal.vue
│
├─ State Layer (Pinia)
│  └─ stores/sales.ts
│
├─ API Layer
│  └─ server/api/daily-sales/
│     ├─ index.get.ts
│     ├─ index.post.ts
│     ├─ [id].put.ts
│     └─ [id].delete.ts
│
├─ Data Layer (Repository)
│  ├─ repositories/sales-json.repository.ts
│  ├─ repositories/sales-firestore.repository.ts
│  └─ repositories/sales-memory.repository.ts
│
├─ Type Layer
│  └─ types/repositories.ts
│
├─ Data Storage
│  └─ public/data/daily-sales.json
│
├─ Documentation
│  ├─ docs/TECHNICAL/COMPONENT_INTEGRATION_GUIDE.md
│  ├─ docs/TECHNICAL/DAILY_SALES_API.md
│  ├─ docs/PROGRESS/WEEK_03_COMPLETION_SUMMARY.md
│  └─ docs/PROGRESS/WEEK_03_IMPLEMENTATION_SUMMARY.md
│
└─ Tests
   └─ tests/integration/daily-sales.spec.ts
```

---

## Data Model

### DailySalesEntry

```typescript
{
  id: string                    // Auto-generated UUID
  date: string                  // ISO format: "2026-01-29"
  cashierId: string             // Reference to cashier
  cashierName: string           // Cashier's name in Thai
  posposData: {
    cash: number                // Cash sales
    qr: number                  // QR code payments
    bank: number                // Bank transfers
    government: number          // Government payments
  }
  cashReconciliation: {
    expectedAmount: number      // Expected total
    actualAmount: number        // Sum of posposData (auto-calc)
    difference: number          // actual - expected (auto-calc)
    notes: string               // Reconciliation notes
  }
  status: 'submitted' | 'audited' | 'approved'
  submittedBy: string           // User ID
  submittedAt: string           // ISO timestamp
  auditedAt?: string            // ISO timestamp when audited
  auditedBy?: string            // Auditor user ID
  auditNotes: string            // Audit comments
}
```

### Sample Entry

```json
{
  "id": "sales-001",
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
  "status": "submitted",
  "submittedBy": "user-123",
  "submittedAt": "2026-01-29T10:00:00Z",
  "auditNotes": ""
}
```

---

## Common Tasks

### Add New Field to Daily Sales

1. Update type in `types/repositories.ts`
2. Update API validation schema (server/api/)
3. Update component form in `DailySalesModal.vue`
4. Update table display in `DailySalesTable.vue`
5. Update store if needed (stores/sales.ts)
6. Add test case in tests/integration/daily-sales.spec.ts

### Switch to Firestore (Week 6)

```typescript
// In stores/sales.ts, just change the import:
// OLD:
import { SalesRepository } from '~/repositories/sales-json.repository'

// NEW:
import { SalesRepository } from '~/repositories/sales-firestore.repository'

// Everything else stays the same!
// No component changes needed
```

### Add Filtering Options

1. Add filter parameter to DailySalesTable.vue
2. Update computed property with filter logic
3. Update API endpoint to accept filter param
4. Update test cases

### Add New Column to Table

1. Add `<th>` header in DailySalesTable.vue
2. Add sort handler in component
3. Add display `<td>` with data
4. Update test to verify new column

---

## Debugging Tips

### Check Data Flow
```javascript
// In browser console
const store = pinia.getState().sales
console.log(store.dailySales)  // See all entries
console.log(store.errors)      // See any errors
console.log(store.isLoading)   // Check loading state
```

### Check API Response
```bash
# In terminal
curl -X GET http://localhost:3000/api/daily-sales | jq
curl -X POST http://localhost:3000/api/daily-sales \
  -H "Content-Type: application/json" \
  -d '{"date":"2026-01-29",...}'
```

### Check Store State
```typescript
// In Vue component
const store = useSalesStore()
console.log({
  all: store.getAllSales,
  pending: store.getPendingSales,
  loading: store.isLoading,
  error: store.error
})
```

---

## Frequently Asked Questions

**Q: Where's the data stored?**  
A: In `public/data/daily-sales.json`. Week 6 switches to Firestore.

**Q: Can I use different cashiers?**  
A: Currently using mock data. Week 4 will connect to User Management.

**Q: How do calculations work?**  
A: `actualAmount` = cash + qr + bank + government (automatic)  
`difference` = actualAmount - expectedAmount (automatic)

**Q: What if data doesn't load?**  
A: Check browser console for errors, ensure dev server is running, check network tab.

**Q: How do I add a new field?**  
A: See "Common Tasks" section above.

**Q: Is the data persistent?**  
A: Yes, saved to JSON file. Lost on file deletion (use Firestore for cloud backup).

**Q: Can multiple users edit simultaneously?**  
A: No, JSON is single-user. Firestore (Week 6) will support multi-user.

---

## Performance Notes

- **Sorting/Filtering**: Done in browser (10-100ms)
- **API Response**: ~100-500ms
- **Page Load**: ~1-2 seconds
- **Pagination**: 10 items per page (smooth scrolling)
- **Database**: JSON file (fast for dev), Firestore (scalable for prod)

---

## Next Steps

1. **Manual Testing** (30 minutes)
   - Follow the "Quick Testing" section above
   - Report any issues

2. **Automated Testing** (optional)
   - Run `npm run test` to execute test suite
   - Review test coverage

3. **Code Review** (recommended)
   - Review commits on develop branch
   - Provide feedback

4. **Deployment** (when ready)
   - Merge develop → main
   - Deploy to Firebase

5. **Week 4 Preparation**
   - Similar architecture for Expenses
   - Same patterns and structure

---

## Support

For issues or questions:
1. Check the troubleshooting guide
2. Review documentation files
3. Check browser console for errors
4. Check API response in Network tab
5. Review test cases for examples

---

**Last Updated**: January 29, 2026  
**Status**: ✅ COMPLETE  
**Ready for Testing**: YES  
**Ready for Deployment**: YES
