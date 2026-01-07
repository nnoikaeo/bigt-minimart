# Development Roadmap
# แผนการพัฒนา

## 📅 Timeline Overview

```
Phase 1: งานรายวัน (Core Features)     [4-6 สัปดาห์]
    └── Week 1-2:  Setup + Authentication
    └── Week 3-4:  Daily Sales + Expenses
    └── Week 5-6:  Audit + Dashboard

Phase 2: รายงานและ Export              [2-3 สัปดาห์]
    └── Week 7-8:  Reports + Cash Flow
    └── Week 9:    Google Sheets Export

Phase 3: งานรายเดือน/ปี                [2-3 สัปดาห์]
    └── Week 10-11: Monthly/Yearly Expenses
    └── Week 12:    Final Testing + Launch

Phase 4: งาน HR (Future)                [TBD]
    └── HR Management Features
```

**Target Launch**: มีนาคม 2026 (ภายใน 2-3 เดือน)

---

## 🚀 Phase 1: งานรายวัน (Core Features)

**Timeline**: 4-6 สัปดาห์  
**Priority**: 🔴 สูงสุด

### Week 1: Project Setup + Authentication

#### Tasks

**1.1 Project Initialization**
- [ ] สร้าง Nuxt 3 Project
- [ ] ติดตั้ง Dependencies (Tailwind CSS, Firebase, etc.)
- [ ] Setup TypeScript Configuration
- [ ] Setup ESLint + Prettier
- [ ] Setup Git Repository
- [ ] Create .env Configuration

**1.2 Firebase Setup**
- [ ] สร้าง Firebase Project
- [ ] Enable Firebase Authentication
- [ ] Enable Firestore Database
- [ ] Enable Firebase Storage
- [ ] Setup Firebase Security Rules (เบื้องต้น)
- [ ] Setup Firebase Admin SDK

**1.3 Authentication System**
- [ ] Create Login Page UI
- [ ] Implement Email/Password Login
- [ ] Implement Logout
- [ ] Setup Authentication Middleware
- [ ] Create User Profile Component
- [ ] Implement Session Management

**1.4 User Management (Owner Only)**
- [ ] Create Users List Page
- [ ] Implement Create User
- [ ] Implement Edit User
- [ ] Implement Delete User (Soft Delete)
- [ ] Setup Role-Based Access Control (RBAC)

**Deliverables**:
- ✅ Working Login/Logout System
- ✅ User Management Interface
- ✅ RBAC Foundation

---

### Week 2: Layout & Navigation

#### Tasks

**2.1 Main Layout**
- [ ] Create Header Component (Logo + User Menu)
- [ ] Create Sidebar Component (Navigation Menu)
- [ ] Create Footer Component
- [ ] Implement Responsive Layout (Mobile/Desktop)
- [ ] Setup Route Guards (Role-based)

**2.2 Dashboard (Skeleton)**
- [ ] Create Dashboard Page Layout
- [ ] Create Summary Card Components
- [ ] Create Quick Actions Section
- [ ] Create Recent Activity List

**2.3 Navigation & Routing**
- [ ] Setup Nuxt Router
- [ ] Define All Routes
- [ ] Implement Role-based Menu Items
- [ ] Add Active State Indicators

**Deliverables**:
- ✅ Complete Layout System
- ✅ Navigation Menu
- ✅ Dashboard Skeleton

---

### Week 3: Daily Sales (แคชเชียร์ + ผู้จัดการ)

#### Tasks

**3.1 Database Schema Implementation**
- [ ] Create `daily_sales` Collection Structure
- [ ] Create `service_transactions` Collection Structure
- [ ] Setup Firestore Indexes
- [ ] Implement Data Validation (Zod)

**3.2 ปิดกะขาย (Cashier)**
- [ ] Create "ปิดกะขาย" Form UI
- [ ] Implement Cash Amount Input
- [ ] Implement Transfer Amount Input (3 channels)
- [ ] Implement POSPOS Total Input
- [ ] Add Auto-calculation Logic
- [ ] Add Validation
- [ ] Add Summary Display
- [ ] Implement Save Draft
- [ ] Test with Sample Data

**3.3 บันทึกยอดรายวัน (Manager)**
- [ ] Create "บันทึกรายรับรายวัน" Form UI
- [ ] Input ยอดขายจาก POSPOS
- [ ] Implement Service Transactions Form
- [ ] Add Multiple Service Entries Support
- [ ] Calculate Total Service Amount
- [ ] Add Daily Expenses Form
- [ ] Implement Submit Action
- [ ] Change Status to "submitted"
- [ ] Test Complete Workflow

**Deliverables**:
- ✅ Cashier: ปิดกะขาย (Working)
- ✅ Manager: บันทึกยอดรายวัน (Working)
- ✅ Data Persisted in Firestore

---

### Week 4: Daily Expenses + Audit

#### Tasks

**4.1 รายจ่ายรายวัน (Manager)**
- [ ] Create "บันทึกรายจ่าย" Form UI
- [ ] Implement Expense Category Dropdown
- [ ] Implement Amount Input
- [ ] Implement Payment Method Selection
- [ ] Add Receipt Upload (Firebase Storage)
- [ ] Implement Save & Submit
- [ ] Display Expenses List

**4.2 Audit System**
- [ ] Create `audit_logs` Collection Structure
- [ ] Create "ตรวจสอบยอด" Page UI
- [ ] Display "รอตรวจสอบ" List (Status: submitted)
- [ ] Create Audit Form
  - [ ] Display System Data
  - [ ] Input Actual Cash (แยกตามพนักงาน)
  - [ ] Input Actual Transfer 3 channels (แยกตามพนักงาน)
  - [ ] Auto-calculate Difference
  - [ ] Display Difference (Red/Green)
- [ ] Add Notes Field
- [ ] Implement Approve Action
- [ ] Change Status to "audited"
- [ ] Test Complete Audit Workflow

**4.3 System Logs**
- [ ] Create `system_logs` Collection
- [ ] Implement Log Middleware
- [ ] Log All Important Actions

**Deliverables**:
- ✅ Manager: บันทึกรายจ่าย (Working)
- ✅ Auditor: ตรวจสอบยอด (Working)
- ✅ Complete Daily Workflow (Cashier → Manager → Auditor)

---

### Week 5-6: Dashboard & Reports

#### Tasks

**5.1 Dashboard (Owner)**
- [ ] Display Total Income (Today)
- [ ] Display Total Expense (Today)
- [ ] Display Cash Flow (Today)
- [ ] Display Closing Balance
- [ ] Create Summary Cards Component
- [ ] Add Charts/Graphs (Chart.js)
  - [ ] Income vs Expense (Bar Chart)
  - [ ] Trend Chart (Line Chart)
- [ ] Display Recent Transactions
- [ ] Add Date Filter

**5.2 Dashboard (Manager/Asst)**
- [ ] Display Today's Tasks
- [ ] Display Pending Sales List
- [ ] Display Pending Expenses
- [ ] Add Quick Action Buttons

**5.3 Dashboard (Auditor)**
- [ ] Display Pending Audit List
- [ ] Display Discrepancy Alerts
- [ ] Add Quick Audit Access

**5.4 รายงานรายวัน**
- [ ] Create Daily Report Page
- [ ] Display Sales Summary
- [ ] Display Expense Summary
- [ ] Display Net Cash Flow
- [ ] Add Export to PDF Button
- [ ] Add Date Range Filter

**Deliverables**:
- ✅ Role-based Dashboards
- ✅ Daily Reports
- ✅ Charts & Visualizations

---

## 📊 Phase 2: รายงานและ Export

**Timeline**: 2-3 สัปดาห์  
**Priority**: 🟡 กลาง

### Week 7-8: Reports & Cash Flow

#### Tasks

**7.1 Cash Flow Calculation**
- [ ] Create `cash_flow` Collection
- [ ] Implement Auto-calculation Logic
  - [ ] Opening Balance (ยอดยกมา)
  - [ ] Total Income (รายรับรวม)
  - [ ] Total Expense (รายจ่ายรวม)
  - [ ] Closing Balance (ยอดยกไป)
- [ ] Create Cash Flow Report Page
- [ ] Display Daily Cash Flow
- [ ] Add Date Range Filter
- [ ] Add Chart (Line Chart)

**7.2 รายงานรายเดือน**
- [ ] Create Monthly Report Page
- [ ] Display Monthly Summary
  - [ ] Total Income
  - [ ] Total Expense
  - [ ] Net Profit/Loss
- [ ] Display Category Breakdown (Pie Chart)
- [ ] Add Month Selector
- [ ] Add Export to PDF

**7.3 รายงาน Audit**
- [ ] Create Audit Report Page
- [ ] Display All Audit Logs
- [ ] Highlight Discrepancies
- [ ] Add Date Filter
- [ ] Show Discrepancy Summary

**Deliverables**:
- ✅ Cash Flow Report
- ✅ Monthly Report
- ✅ Audit Report

---

### Week 9: Google Sheets Export

#### Tasks

**9.1 Google Sheets API Integration**
- [ ] Setup Google Sheets API
- [ ] Create Service Account
- [ ] Implement OAuth Flow (optional)
- [ ] Test API Connection

**9.2 Export Functions**
- [ ] Export Daily Sales to Sheets
- [ ] Export Expenses to Sheets
- [ ] Export Cash Flow to Sheets
- [ ] Export Monthly Summary to Sheets
- [ ] Add Auto-export Schedule (optional)

**9.3 Looker Studio Connection**
- [ ] Create Data Source in Looker Studio
- [ ] Connect to Google Sheets
- [ ] Create Basic Dashboard Templates

**Deliverables**:
- ✅ Export to Google Sheets
- ✅ Looker Studio Integration

---

## 💰 Phase 3: งานรายเดือน/ปี

**Timeline**: 2-3 สัปดาห์  
**Priority**: 🟢 ปานกลาง

### Week 10-11: Monthly/Yearly Expenses

#### Tasks

**10.1 Monthly Expenses (Owner Only)**
- [ ] Create `monthly_expenses` Collection
- [ ] Implement Security Rules (Owner Only)
- [ ] Create "บันทึกค่าใช้จ่ายรายเดือน" Form
- [ ] Implement Expense Categories
  - [ ] Rent, Utilities, Internet
  - [ ] Salary, Overtime (⚠️ ข้อมูลลับ)
  - [ ] VAT, Fuel, Other
- [ ] Add Receipt Upload
- [ ] Implement Save & Submit
- [ ] Display Monthly Expenses List
- [ ] Add Edit/Delete Functions

**10.2 Yearly Expenses (Owner Only)**
- [ ] Create `yearly_expenses` Collection
- [ ] Create "บันทึกค่าใช้จ่ายรายปี" Form
- [ ] Implement Expense Categories
  - [ ] Income Tax, Accounting Service
  - [ ] Car Insurance, Other
- [ ] Add Receipt Upload
- [ ] Implement Save & Submit
- [ ] Display Yearly Expenses List

**10.3 Monthly Report (Updated)**
- [ ] Include Monthly Expenses in Report
- [ ] Calculate Actual Profit/Loss
- [ ] Update Dashboard to show Monthly Expenses

**Deliverables**:
- ✅ Monthly Expenses Management
- ✅ Yearly Expenses Management
- ✅ Complete Monthly Report with All Expenses

---

### Week 12: Final Testing + Launch Preparation

#### Tasks

**12.1 Testing**
- [ ] Unit Tests (Critical Functions)
- [ ] Integration Tests (Workflows)
- [ ] User Acceptance Testing (UAT)
  - [ ] Test with Owner
  - [ ] Test with Manager
  - [ ] Test with Cashier
  - [ ] Test with Auditor
- [ ] Cross-browser Testing
- [ ] Mobile/Tablet Testing
- [ ] Performance Testing (Lighthouse)

**12.2 Bug Fixes & Refinements**
- [ ] Fix Critical Bugs
- [ ] Fix UI/UX Issues
- [ ] Optimize Performance
- [ ] Polish Animations

**12.3 Documentation**
- [ ] User Manual (ภาษาไทย)
- [ ] Admin Guide
- [ ] Troubleshooting Guide
- [ ] Video Tutorials (optional)

**12.4 Deployment**
- [ ] Setup Firebase Hosting
- [ ] Configure Custom Domain (optional)
- [ ] Setup SSL Certificate
- [ ] Deploy to Production
- [ ] Setup Backup Strategy
- [ ] Setup Monitoring (Firebase Analytics)

**12.5 Training & Onboarding**
- [ ] Train Owner
- [ ] Train Manager
- [ ] Train Cashier
- [ ] Train Auditor
- [ ] Provide Support Documentation

**Deliverables**:
- ✅ Tested & Polished System
- ✅ Documentation Complete
- ✅ Production Deployment
- ✅ Team Training Complete
- ✅ **Launch! 🚀**

---

## 🔮 Phase 4: งาน HR (Future)

**Timeline**: TBD  
**Priority**: 🟣 อนาคต

### Features to Develop

**4.1 ตารางเวลาทำงาน/กะ**
- Import ข้อมูลจากเครื่องสแกนลายนิ้วมือ
- บันทึกเวลาเข้า-ออกงาน
- คำนวณชั่วโมงทำงาน
- แสดงตารางกะ (Calendar View)

**4.2 การลาพักร้อน/ลาป่วย**
- บันทึกวันลา
- อนุมัติ/ปฏิเสธการลา
- ติดตามวันลาคงเหลือ
- รายงานการลา

**4.3 คำนวณโอที**
- คำนวณโอทีจากเวลาทำงาน
- รองรับ Rate โอทีแบบต่างๆ
- รายงานโอทีรายเดือน
- Export ข้อมูลไปยัง Payroll System

---

## 📊 Success Metrics (KPIs)

### Phase 1 Success Criteria
- ✅ 100% User Authentication Working
- ✅ 100% Daily Workflow Complete (Cashier → Manager → Auditor)
- ✅ 0 Critical Bugs
- ✅ Dashboard Showing Real-time Data

### Phase 2 Success Criteria
- ✅ Reports Generated Correctly
- ✅ Export to Google Sheets Working
- ✅ Looker Studio Connected

### Phase 3 Success Criteria
- ✅ All Monthly/Yearly Expenses Recorded
- ✅ Complete Profit/Loss Report
- ✅ System Fully Tested & Deployed

### Overall Success Metrics
- ✅ ลดเวลาบันทึกข้อมูล 50%
- ✅ ลดความผิดพลาด 80%
- ✅ ความพึงพอใจผู้ใช้ ≥ 4/5
- ✅ Uptime > 99.5%

---

## 🎯 Project Milestones

| Milestone | Target Date | Status |
|-----------|-------------|--------|
| Phase 1 Complete | สัปดาห์ที่ 6 | 🟡 In Progress |
| Phase 2 Complete | สัปดาห์ที่ 9 | ⚪ Pending |
| Phase 3 Complete | สัปดาห์ที่ 12 | ⚪ Pending |
| Production Launch | มีนาคม 2026 | ⚪ Pending |
| Phase 4 Planning | TBD | ⚪ Pending |

---

## 🛠️ Tools & Resources

### Development
- **Claude Code**: Primary Development
- **VS Code**: Code Editor
- **Git**: Version Control
- **Firebase**: Backend Services

### Project Management
- **Claude.ai**: Planning & Documentation
- **GitHub Issues**: Bug Tracking (optional)
- **Notion/Google Docs**: Documentation

### Communication
- **Line/Email**: Communication with Owner
- **Screenshots/Videos**: Demo & Feedback

---

## 📝 Weekly Sprint Plan (Example)

### Sprint Format
- **Duration**: 1 สัปดาห์
- **Planning**: วันจันทร์
- **Development**: วันอังคาร - ศุกร์
- **Review & Demo**: วันเสาร์
- **Retrospective**: วันอาทิตย์

### Sprint Goals (Week 1 Example)
1. ✅ Setup Project
2. ✅ Implement Authentication
3. ✅ Create User Management
4. ⏸️ Start Main Layout (Move to Week 2)

---

## 🚧 Risks & Mitigation

### Identified Risks

**1. Timeline Risk**
- **Risk**: พัฒนาช้ากว่าที่คาดไว้
- **Mitigation**: แบ่ง Features เป็น MVP (Minimum Viable Product) ก่อน

**2. Technical Complexity**
- **Risk**: Firebase Security Rules ซับซ้อน
- **Mitigation**: เริ่มจาก Basic Rules ก่อน, ค่อยปรับปรุงทีละน้อย

**3. User Adoption**
- **Risk**: พนักงานไม่คุ้นเคย
- **Mitigation**: จัด Training, สร้าง User Manual ที่เข้าใจง่าย

**4. Data Loss**
- **Risk**: ข้อมูลสูญหาย
- **Mitigation**: Backup ข้อมูลทุกวัน, ใช้ Firebase Automatic Backup

**5. Performance Issues**
- **Risk**: ระบบช้าเมื่อข้อมูลเยอะ
- **Mitigation**: Implement Pagination, Optimize Queries, Add Indexes

---

## 📞 Support & Maintenance Plan

### Post-Launch Support (3 เดือนแรก)
- 🐛 Bug Fixes: Priority สูง (ภายใน 24 ชม.)
- 💡 Feature Requests: Evaluate & Prioritize
- 📚 Documentation Updates: ตามความจำเป็น
- 🎓 Additional Training: ตามต้องการ

### Long-term Maintenance
- 🔄 Regular Updates: ทุกเดือน
- 🔒 Security Patches: ทันที
- 📊 Performance Monitoring: อย่างต่อเนื่อง
- 💾 Backup: ทุกวัน

---

**Last Updated**: 2026-01-07  
**Version**: 1.0  
**Status**: 📝 Planning Phase  
**Next Sprint**: Week 1 - Project Setup + Authentication
