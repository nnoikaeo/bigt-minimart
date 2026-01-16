# 👥 User Roles & Responsibilities

## Overview
5 user roles with different responsibilities and permissions

## Role 1: เจ้าของร้าน (Owner)
- **Permissions**: Full access to all features
- **Primary Responsibilities**:
  - View comprehensive reports and dashboards
  - Record monthly expenses (rent, utilities, salaries, etc.)
  - Record yearly expenses (taxes, insurance, etc.)
  - Approve important transactions
  - Export data to Google Sheets/Looker Studio

- **Data Visibility**:
  - ✅ Employee salaries
  - ✅ Overtime costs
  - ✅ All expenses
  - ✅ Profit/Loss analysis

## Role 2: ผู้จัดการร้าน (Manager)
- **Permissions**: Daily operations management
- **Primary Responsibilities**:
  - Record daily sales (from POSPOS)
  - Record service income (transfers, withdrawals, bill payments)
  - Record stock purchase expenses
  - Submit data to Auditor for verification
  - View daily reports

- **Data Hidden**:
  - ❌ Employee salaries
  - ❌ Overtime costs
  - ❌ Some monthly/yearly expenses

## Role 3: ผู้ช่วยผู้จัดการ (Assistant Manager)
- **Permissions**: Same as Manager (backup for Manager's days off)
- **Primary Responsibilities**:
  - Cover for Manager when absent
  - Record daily data (same as Manager)
  - View daily reports

- **Data Hidden**:
  - ❌ Employee salaries
  - ❌ Overtime costs
  - ❌ Some monthly/yearly expenses

## Role 4: แคชเชียร์ (Cashier)
- **Permissions**: Own shift closing only
- **Primary Responsibilities**:
  - Sell products (in POSPOS)
  - Count cash/transfers for shift closing
  - Record shift closing data in system
  - Provide cash bag + notes to Manager

- **Data Visibility**:
  - ✅ Own shift closing data only

- **Data Hidden**:
  - ❌ Other employees' data
  - ❌ Expenses
  - ❌ Summary reports

## Role 5: Auditor
- **Permissions**: Daily audit and verification
- **Primary Responsibilities**:
  - Verify cash counts (cash + transfers)
  - Record actual cash/transfer amounts (by employee)
  - Compare actual vs system data
  - Record discrepancies (if any)
  - Add audit notes
  - Approve daily data
  - Send reports to Owner

- **Data Visibility**:
  - ✅ Daily income data
  - ✅ Daily expense data
  - ✅ Daily/monthly reports

- **Data Hidden**:
  - ❌ Employee salaries
  - ❌ Overtime costs

---

## Permission Matrix

### Data Access (Legacy)

| Resource | Owner | Manager | Asst Mgr | Cashier | Auditor |
|----------|-------|---------|----------|---------|---------|
| Dashboard | ✅ | ✅ | ✅ | ❌ | ✅ |
| Daily Sales (Own) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Daily Sales (All) | ✅ | ✅ | ✅ | ❌ | ✅ |
| Service Transactions | ✅ | ✅ | ✅ | ❌ | ✅ |
| Daily Expenses | ✅ | ✅ | ✅ | ❌ | ✅ |
| Monthly Expenses | ✅ | ❌ | ❌ | ❌ | ❌ |
| Yearly Expenses | ✅ | ❌ | ❌ | ❌ | ❌ |
| Audit Logs | ✅ | ❌ | ❌ | ❌ | ✅ |
| Reports (Daily) | ✅ | ✅ | ✅ | ❌ | ✅ |
| Reports (Monthly) | ✅ | ❌ | ❌ | ❌ | ✅ |
| Export Data | ✅ | ❌ | ❌ | ❌ | ✅ |
| User Management | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## Page Access Matrix (Strict Role Hierarchy)

ระบบใช้ **Strict Role Hierarchy** ในการกำหนดสิทธิ์การเข้าถึง pages แต่ละหน้า

### Design Approach
- **Owner**: Auto-access all pages (non-configurable)
- **Other roles**: ต้องกำหนด page access ใน `/admin/roles.vue`
- **Source**: Firestore `role_permissions` collection

### Default Page Access Matrix

| Page | Path | Owner | Manager | Auditor | Cashier | Staff |
|------|------|-------|---------|---------|---------|-------|
| **Sales Group** | | | | | | |
| Daily Sales | sales/daily-sales | ✅ Auto | ❌ | ✅ | ❌ | ❌ |
| Sales Report | sales/sales-report | ✅ Auto | ✅ | ✅ | ❌ | ❌ |
| **Finance Group** | | | | | | |
| Daily Expenses | finance/daily-expenses | ✅ Auto | ✅ | ❌ | ❌ | ❌ |
| Cash Flow | finance/cash-flow | ✅ Auto | ✅ | ❌ | ❌ | ❌ |
| Monthly Report | finance/monthly-report | ✅ Auto | ✅ | ❌ | ❌ | ❌ |
| **HR Group** | | | | | | |
| Attendance | hr/attendance | ✅ Auto | ✅ | ❌ | ❌ | ❌ |
| Overtime | hr/overtime | ✅ Auto | ✅ | ❌ | ❌ | ❌ |
| **Settings Group** | | | | | | |
| System Settings | settings/system-settings | ✅ Auto | ❌ | ❌ | ❌ | ❌ |
| Others | settings/others | ✅ Auto | ❌ | ❌ | ❌ | ❌ |
| **Admin Group** | | | | | | |
| Users | admin/users | ✅ Auto | ❌ | ❌ | ❌ | ❌ |
| Roles | admin/roles | ✅ Auto | ❌ | ❌ | ❌ | ❌ |

### Key Rules
1. **Owner**: ✅ Auto - All pages always accessible
2. **Manager**: Has access to operational pages (sales, finance, hr)
3. **Auditor**: Limited to audit-related pages (daily-sales, sales-report)
4. **Cashier**: Minimal access (own sales data only)
5. **Staff**: No direct page access

### Implementation
- Pages list managed in `role_permissions` collection
- Admin can toggle page access via `/admin/roles.vue` UI
- Sidebar automatically filters based on role permissions
- Frontend & backend validate access on every page load

### Example: Auditor Role
```json
{
  "role": "auditor",
  "name": "ผู้ตรวจสอบ",
  "pages": {
    "sales/daily-sales": true,      // Can access
    "sales/sales-report": true,     // Can access
    "finance/daily-expenses": false,
    "finance/cash-flow": false,
    "finance/monthly-report": false,
    "hr/attendance": false,
    "hr/overtime": false,
    "settings/system-settings": false,
    "settings/others": false,
    "admin/users": false,
    "admin/roles": false
  }
}
```

---

**Source**: Extracted from 02_BUSINESS_REQUIREMENTS.md  
**Last Updated**: Jan 7, 2026  
**Version**: 1.0
