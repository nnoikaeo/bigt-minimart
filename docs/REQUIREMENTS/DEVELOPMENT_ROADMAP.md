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

**Composable to Create**:
- `composables/useDailySales.ts` - API interactions & state management

**API Endpoints to Create**:
```
POST   /api/daily-sales           - Create new entry
GET    /api/daily-sales           - List all entries (with filters)
GET    /api/daily-sales/[id]      - Get single entry
PUT    /api/daily-sales/[id]      - Update entry
DELETE /api/daily-sales/[id]      - Delete entry
```

**Database Schema**:
```typescript
Collection: daily_sales

interface DailySales {
  // Identification
  id: string;                              // Auto-generated
  date: Timestamp;                         // Entry date
  
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
  submittedAt: Timestamp;
  submittedBy: string;                     // Auditor UID
  auditedAt?: Timestamp;
  auditedBy?: string;
  auditNotes?: string;
  
  // System
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

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

**Task 4.1**: Daily Expenses Form
- Manager บันทึกรายจ่ายรายวัน
- Categories: Stock purchase, Other
- Validation: Receipt upload, amount > 0

**Task 4.2**: Audit Check Page
- Auditor ตรวจสอบข้อมูล Daily Sales + Expenses
- Reconciliation: Negate discrepancies
- Approval workflow: Submitted → Audited → Approved

**Task 4.3**: Audit Summary Report
- Daily audit log display
- Filter by date, status, auditor
- Export functionality

---

### ❌ Week 5-6: Dashboard + Reports (Pending)

**Objective**: Analytics and reporting for Owner/Manager

**Task 5.1**: Analytics Dashboard
- Daily sales trend (Chart)
- Expense breakdown (Pie chart)
- Cash vs. Digital payments ratio
- Audit status overview

**Task 5.2**: Reports Page
- Sales report (Daily/Weekly/Monthly)
- Expense report
- Reconciliation summary
- Export to CSV/Excel

**Task 5.3**: Advanced Features
- Filters (Date range, Cashier, Category)
- Charts (Line, Bar, Pie)
- Pagination & sorting
- Print functionality

---

## 🔄 Phase 2: Reports & Export (Future)

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
