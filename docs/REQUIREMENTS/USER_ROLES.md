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

**Source**: Extracted from 02_BUSINESS_REQUIREMENTS.md  
**Last Updated**: Jan 7, 2026  
**Version**: 1.0
