# 📊 Development Roadmap

**Last Updated**: Jan 14, 2026  
**Phase**: Phase 1 - Core Features  
**Timeline**: Weeks 1-6 (January - February 2026)  
**Target Launch**: March 2026

---

## 🎯 Phase 1: Core Features (6 Weeks)

### ✅ Week 1: Setup + Authentication (Complete)

**Objective**: Project initialization and user authentication system

**Completed**:
- [x] Nuxt 3 + TypeScript + Tailwind setup
- [x] Firebase integration (Auth, Firestore, Storage)
- [x] User authentication (Login/Logout)
- [x] User Management CRUD (Create, Read, Update, Delete)
- [x] Dashboard page (Protected route)
- [x] Route middleware (Auth protection)
- [x] Test users (3 users created: Owner, Manager, Auditor)

---

### ✅ Week 2: Layout + Navigation (Complete)

**Objective**: Professional dashboard layout with role-based navigation

**Completed**:
- [x] Header component (Top bar + user profile)
- [x] Sidebar navigation (Dark theme, icon-based)
- [x] Mobile menu toggle (Hamburger menu)
- [x] Breadcrumb navigation (Auto-generated from routes)
- [x] Role-based menu items (Owner, Manager, Auditor)
- [x] Logger composable (Structured debugging)
- [x] Thai language labels (24+ translations)
- [x] Responsive layout (375px, 768px, 1920px)

---

### 🟡 Week 3: Daily Sales (Design Complete - Ready for Dev)

**Objective**: Auditor บันทึกข้อมูลยอดขายรายวัน

#### Task 3.1: Daily Sales Form ✅ DESIGN COMPLETE

**Workflow**:
```
STEP 1: Cashier ปิดกะ (ใน POSPOS)
  ↓ (Receipt generated)
STEP 2: Manager รวบรวมถุงเงิน + Receipt
  ↓ (Physical cash collected)
STEP 3: Auditor บันทึกข้อมูล (Task 3.1) ← Current Sprint
  ├─ อ่าน Receipt from POSPOS
  ├─ INPUT: วันที่, Cashier, ยอดขาย 4 ช่องทาง, ผลต่าง, หมายเหตุ
  ├─ AUTO CALC: รวมยอด, ผลต่างเงินสด
  ├─ Validation: ครบถ้วน
  └─ บันทึก → Status = "submitted"
  ↓
STEP 4: แสดงรายการ (Table)
  ├─ Filter by วันที่, Status, Cashier
  ├─ Search by Cashier
  ├─ Actions: View/Edit/Delete
  └─ Pagination
  ↓
STEP 5: Auditor ตรวจสอบต่อไป (Week 4)
```

**Features**:
- ✅ Table with Pagination (Display all sales)
- ✅ Modal Form (Creating new entry)
- ✅ Auto-Calculate Fields (Total sales, cash difference)
- ✅ Validation (Required fields, positive amounts)
- ✅ Error Handling (Clear error messages in Thai)
- ✅ Success Message (Summary of saved data)
- ✅ Edit/Delete (Modify or remove entries)

**Components to Create**:
1. `pages/auditor/daily-sales.vue` - Main page
2. `components/DailySalesTable.vue` - Table display
3. `components/DailySalesModal.vue` - Form modal

**Repository Pattern** (Data Abstraction Layer):
- Phase 1 (Development): Uses `SalesJsonRepository` ([Code](../../server/repositories/sales-json.repository.ts))
- Phase 2+ (Production): Switch to `SalesFirestoreRepository` ([Code](../../server/repositories/sales-firestore.repository.ts))
- Interface: `ISalesRepository` ([Types](../../types/repositories.ts))
- Data Source: `public/data/daily-sales.json` (Phase 1) → Firestore `daily_sales` collection (Phase 2+)
- **Benefit**: Change data source with single import update (no UI/store changes needed)

**Store to Create** (using Pinia + Repository):
- `stores/sales.ts` - Daily Sales Store ([Architecture Guide](../TECHNICAL/STATE_MANAGEMENT_ARCHITECTURE.md#repository-pattern))
  - Uses: `salesJsonRepository` in Phase 1 (imports from `server/repositories/sales-json.repository.ts`)
  - State: dailySales, filters, stats, syncStatus
  - Getters: getAllSales, getPendingSales, getSalesStats, getFilteredSales
  - Actions: fetchDailySales, addDailySale, updateDailySale, approveSale, calculateStats

**Composable to Update**:
- `composables/useDailySales.ts` - API interactions (refactor to work with sales store)

**API Endpoints to Create**:
```
POST   /api/daily-sales           - Create new entry
GET    /api/daily-sales           - List all entries (with filters)
GET    /api/daily-sales/[id]      - Get single entry
PUT    /api/daily-sales/[id]      - Update entry
DELETE /api/daily-sales/[id]      - Delete entry
```

**Data Interface** (Repository-Agnostic):

```typescript
// Defined in types/repositories.ts
interface DailySalesEntry {
  // Identification
  id: string;                              // Auto-generated (UUID v4)
  date: string;                            // ISO format: YYYY-MM-DD
  
  // Cashier Info
  cashierId: string;                       // Firebase UID
  cashierName: string;                     // Cashier name
  
  // Sales Data (from POSPOS Receipt)
  posposData: {
    cashAmount: number;                    // เงินสด
    qrCode: number;                        // QR Code
    bankTransfer: number;                  // ธนาคาร
    govProgram: number;                    // โครงการรัฐ
    totalSales: number;                    // รวมทั้งหมด (AUTO)
  };
  
  // Cash Reconciliation
  cashReconciliation: {
    expectedAmount: number;                // เงินคาดไว้
    initialBalance: number;                // 2,000
    actualCashInDrawer: number;            // เงินจริง
    difference: number;                    // ผลต่าง (AUTO)
    notes?: string;                        // หมายเหตุ (ถ้า ≠ 0)
  };
  
  // Status & Workflow
  status: "submitted" | "audited" | "approved";
  submittedAt: string;                     // ISO format timestamp
  submittedBy: string;                     // Auditor UID
  auditedAt?: string;                      // ISO format timestamp
  auditedBy?: string;                      // Auditor UID
  auditNotes?: string;
  
  // System
  createdAt: string;                       // ISO format timestamp
  updatedAt: string;                       // ISO format timestamp
}
```

**Storage Format**:
- **Phase 1 (JSON)**: Stored in `public/data/daily-sales.json` as array of `DailySalesEntry`
- **Phase 2+ (Firestore)**: Stored in `daily_sales` collection (dates converted to Timestamps during migration)
- **API Contract**: All endpoints return/accept `DailySalesEntry` regardless of storage backend

**UI/Table Columns**:
- 📅 วันที่ (Date)
- 👤 Cashier (Name)
- 💰 ยอดขาย (Total Sales)
- ⚖️ ผลต่างเงินสด (Cash Difference)
- 🔖 Status (Submitted/Audited/Approved)
- 🎯 Actions (View/Edit/Delete)

**Next Steps**: Development (Task 3.2-3.6)

---

### ❌ Week 4: Expenses + Audit (Pending)

**Objective**: Daily expenses tracking and audit system

**Repository Pattern**:
- Phase 1 (Development): Uses `ExpenseJsonRepository` (in `server/repositories/expense-json.repository.ts`)
- Phase 2+ (Production): Switch to `ExpenseFirestoreRepository` (in `server/repositories/expense-firestore.repository.ts`)
- Interface: `IExpenseRepository` (in `types/repositories.ts`)
- Data Source: `public/data/daily-expenses.json` (Phase 1) → Firestore `daily_expenses` collection (Phase 2+)

**Store to Create** (using Pinia + Repository):
- `stores/finance.ts` - Finance Store ([Architecture Guide](../TECHNICAL/STATE_MANAGEMENT_ARCHITECTURE.md))
  - Uses: `expenseJsonRepository` in Phase 1
  - State: expenses, filters, categories, totals
  - Getters: getAllExpenses, getExpensesByCategory, getExpenseTotals, getExpensesByDate
  - Actions: fetchExpenses, addExpense, updateExpense, deleteExpense, calculateCategoryTotals

**Task 4.1**: Daily Expenses Form
- Manager บันทึกรายจ่ายรายวัน
- Categories: Stock purchase, Supplies, Utilities, Other
- Validation: Receipt upload, amount > 0, category selection
- Uses: `stores/finance.ts` with `expenseJsonRepository`

**Task 4.2**: Audit Check Page
- Auditor ตรวจสอบข้อมูล Daily Sales + Expenses (cross-store operation)
- Uses data from: `stores/sales.ts` + `stores/finance.ts`
- Reconciliation: Negate discrepancies
- Approval workflow: Submitted → Audited → Approved

**Task 4.3**: Audit Summary Report
- Daily audit log display
- Filter by date, status, auditor
- Aggregate data from sales + expenses stores
- Export functionality

---

### ❌ Week 5-6: Dashboard + Reports (Pending)

**Objective**: Analytics and reporting for Owner/Manager

**Cross-Store Architecture**:
- Aggregates data from multiple stores (sales + finance)
- Uses Repository Pattern for consistent data access
- Charts and filters work with JSON data in Phase 1
- Automatic migration to Firestore queries in Phase 2+

**Store to Create** (using Pinia + Repository):
- `stores/reports.ts` - Reports Store ([Architecture Guide](../TECHNICAL/STATE_MANAGEMENT_ARCHITECTURE.md))
  - Uses: Data from `stores/sales.ts` + `stores/finance.ts` (getters)
  - State: selectedDateRange, reportFilters, cachedResults
  - Getters: getDailySalesReport, getExpenseReport, getReconciliationReport, getDashboardMetrics
  - Actions: generateSalesReport, generateExpenseReport, generateReconciliationReport, calculateMetrics

**Task 5.1**: Analytics Dashboard
- Daily sales trend (Chart) - Data from `stores/sales.ts`
- Expense breakdown (Pie chart) - Data from `stores/finance.ts`
- Cash vs. Digital payments ratio - Calculated from sales store
- Audit status overview - Cross-store aggregation
- All data access via Repository Pattern

**Task 5.2**: Reports Page
- Sales report (Daily/Weekly/Monthly) - Aggregated from `stores/sales.ts`
- Expense report - Aggregated from `stores/finance.ts`
- Reconciliation summary - Cross-store calculation
- Export to CSV/Excel

**Task 5.3**: Advanced Features
- Filters (Date range, Cashier, Category) - Applied at store level
- Charts (Line, Bar, Pie) - Data from repositories
- Pagination & sorting - In-memory using arrays
- Print functionality - Works with cached data

---

## � Data Persistence Strategy

### Phase 1: Development with JSON (Week 1-5)

**Approach**: Repository Pattern with JSON implementation

**Benefits**:
- ✅ Fast iteration on data structures (no schema migration)
- ✅ Easy to reset test data (delete/recreate `public/data/*.json`)
- ✅ No database credentials needed locally
- ✅ Perfect for UX/UI refinement with rapid changes
- ✅ Version control friendly (git diff shows data changes)

**Storage**:
- `public/data/daily-sales.json` - Managed by `SalesJsonRepository`
- `public/data/daily-expenses.json` - Managed by `ExpenseJsonRepository`
- Both are arrays of typed interfaces (`DailySalesEntry`, `ExpenseEntry`)

**Data Access**:
```
Component → Store (Pinia) → Repository Interface → JSON File
```

**Implementation Files**:
- `types/repositories.ts` - Interface definitions
- `server/repositories/sales-json.repository.ts` - JSON implementation
- `server/repositories/expense-json.repository.ts` - JSON implementation (to be created)
- `stores/sales.ts` - Uses `salesJsonRepository`
- `stores/finance.ts` - Uses `expenseJsonRepository`

### Phase 2: Migration to Firestore (Week 6+)

**Transition Plan**:

1. **Create Firestore Repositories**:
   - `server/repositories/sales-firestore.repository.ts` (already created)
   - `server/repositories/expense-firestore.repository.ts` (to be created)
   - Implement same interfaces as JSON versions

2. **Migrate Data**:
   ```
   public/data/daily-sales.json → Firestore collection 'daily_sales'
   public/data/daily-expenses.json → Firestore collection 'daily_expenses'
   ```

3. **Update Imports** (single location per store):
   ```typescript
   // Before (Phase 1):
   import { salesJsonRepository } from '@/server/repositories/sales-json.repository';
   
   // After (Phase 2):
   import { salesFirestoreRepository } from '@/server/repositories/sales-firestore.repository';
   ```

4. **No Changes Required**:
   - ✅ Component code (same store interface)
   - ✅ Store structure (same getters/actions)
   - ✅ API endpoints (same contract)
   - ✅ Type definitions (same interfaces)
   - ✅ UI/UX (no changes)

**Firestore Setup** (Week 6):
- Create collections: `daily_sales`, `daily_expenses`
- Set up security rules
- Create Firestore repositories
- Run migration script (convert JSON to Firestore)
- Update imports
- Test with Phase 1 data

### Why This Approach?

**Problem**: During development, UX/UI changes frequently → Firestore schema adjustments cause problems

**Solution**: 
- Develop with flexible JSON structure (no schema constraints)
- Use Repository Pattern to abstract storage implementation
- Switch to Firestore when development stabilizes
- **Zero rework**: Components don't know or care about backend

**Timing**:
- **Weeks 1-5**: Rapid iteration with JSON (low friction)
- **Week 5**: Finalize data structures
- **Week 6**: Create Firestore collections
- **Week 6+**: Switch imports (single change per store)

---

## �🔄 Phase 2: Reports & Export (Future)

**Objective**: Google Sheets integration and automated reporting

**Features**:
- [ ] Google Sheets API integration
- [ ] Auto-sync daily data to Sheets
- [ ] Looker Studio dashboards
- [ ] Automated email reports
- [ ] Data backup to Cloud Storage

**Timeline**: March - April 2026

---

## 🎯 Phase 3: Monthly/Yearly (Future)

**Objective**: Long-term financial tracking

**Features**:
- [ ] Monthly expense categories (Rent, Utilities, etc.)
- [ ] Yearly tax reports
- [ ] Profit/Loss statement
- [ ] Financial forecasting
- [ ] Multi-year comparisons

**Timeline**: May - June 2026

---

## 👥 Phase 4: HR Management (Future)

**Objective**: Employee management and payroll

**Features**:
- [ ] Employee profiles
- [ ] Attendance tracking
- [ ] Salary management
- [ ] Leave management
- [ ] Performance reviews

**Timeline**: Q3 2026+

---

## 📋 Development Standards

### Code Quality
- ✅ TypeScript strict mode
- ✅ ESLint/Prettier for formatting
- ✅ Type-safe API calls
- ✅ Component composition
- ✅ Error handling & logging

### Testing
- ✅ Component unit tests (Vue Test Utils)
- ✅ API integration tests
- ✅ End-to-end tests (Cypress)
- ✅ Manual testing (3 viewports)

### Documentation
- ✅ Component documentation
- ✅ API documentation
- ✅ Database schema documentation
- ✅ Deployment guides
- ✅ User guides (Thai)

### Performance
- ✅ Lazy loading components
- ✅ Optimize images
- ✅ Minify bundles
- ✅ Cache strategies
- ✅ SEO optimization

### Security
- ✅ Firebase security rules
- ✅ Input validation (Zod)
- ✅ CSRF protection
- ✅ Rate limiting
- ✅ Data encryption

---

## 🚀 Deployment Strategy

### Development
- Local environment with Firebase emulator
- Hot reload with Nuxt dev server
- Git feature branches

### Staging
- Firebase staging project
- Pre-production testing
- Performance monitoring

### Production
- Firebase Hosting (Static)
- Cloud Functions (Serverless)
- Firestore (NoSQL database)
- Cloud Storage (File uploads)
- CI/CD with GitHub Actions

---

## 📊 Success Metrics

### Week 1 ✅
- [x] 3 test users created
- [x] All auth flows working
- [x] Route protection functional

### Week 2 ✅
- [x] Responsive layout (3 viewports)
- [x] Menu navigation complete
- [x] Thai language support

### Week 3 🟡
- [ ] Daily Sales form deployed
- [ ] API endpoints functional
- [ ] Firestore data persisted
- [ ] All flows tested (3 viewports)

### Week 4
- [ ] Expenses tracking live
- [ ] Audit approval workflow
- [ ] All features integrated

### Week 5-6
- [ ] Dashboard deployed
- [ ] Reports functional
- [ ] Performance optimized

---

**Current Status**: Week 3 Design Complete  
**Next Phase**: Development Sprint (Task 3.2 onwards)  
**Estimated Completion**: End of February 2026
