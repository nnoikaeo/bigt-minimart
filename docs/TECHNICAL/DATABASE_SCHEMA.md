# 🗄️ Database Schema (Firestore)

## Collections Overview

### Collection: users
User accounts and roles

```typescript
interface User {
  uid: string;                    // Firebase Auth UID
  email: string;                  // Email address
  displayName: string;            // Display name
  role: UserRole;                 // Role/permission level
  posNumber: 1 | 2 | null;       // POS assignment
  isActive: boolean;              // Active status
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy?: string;             // Creator UID
}

type UserRole = 
  | "owner"              // Owner
  | "manager"            // Manager
  | "assistant_manager"  // Assistant Manager
  | "cashier"            // Cashier
  | "auditor";           // Auditor
```

**Indexes**:
- email (Unique)
- role + isActive (Composite)

---

### Collection: daily_sales
Daily shift closing records

```typescript
interface DailySales {
  id: string;
  date: Timestamp;
  userId: string;                 // Employee UID
  userName: string;               // Employee name
  posNumber: 1 | 2;              // POS used
  shift: "morning" | "afternoon"; // Shift
  
  sales: {
    posposTotal: number;
    cashAmount: number;
    transferAmount: {
      qrCode: number;
      bankAccount: number;
      govProgram: number;
      total: number;
    };
    total: number;
  };
  
  status: SalesStatus;
  submittedBy?: string;
  submittedAt?: Timestamp;
  auditedBy?: string;
  auditedAt?: Timestamp;
  auditNotes?: string;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

type SalesStatus = "draft" | "submitted" | "audited" | "approved";
```

**Indexes**:
- date (Composite with status)
- userId (Composite with date)
- status

---

### Collection: service_transactions
Service income records

```typescript
interface ServiceTransaction {
  id: string;
  date: Timestamp;
  dailySalesId?: string;
  type: ServiceType;
  description: string;
  amount: number;
  recordedBy: string;
  recordedAt: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

type ServiceType = 
  | "money_transfer"
  | "withdrawal"
  | "bill_payment"
  | "other";
```

---

### Collection: daily_expenses
Daily expense records

```typescript
interface DailyExpense {
  id: string;
  date: Timestamp;
  category: DailyExpenseCategory;
  description: string;
  paymentMethod: "cash" | "transfer";
  amount: number;
  receipt?: string;               // URL to receipt image
  recordedBy: string;
  recordedAt: Timestamp;
  status: "draft" | "submitted" | "audited";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

type DailyExpenseCategory = "stock_purchase" | "other";
```

---

### Collection: monthly_expenses
Monthly expense records (Owner only)

```typescript
interface MonthlyExpense {
  id: string;
  month: string;                  // Format: "2026-01"
  year: number;
  category: MonthlyExpenseCategory;
  description: string;
  amount: number;
  paymentDate: Timestamp;
  receipt?: string;
  recordedBy: string;             // Must be owner
  recordedAt: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

type MonthlyExpenseCategory = 
  | "rent" | "utilities_electric" | "utilities_water"
  | "internet" | "salary" | "overtime" | "vat" | "fuel" | "other";
```

---

### Collection: yearly_expenses
Yearly expense records (Owner only)

```typescript
interface YearlyExpense {
  id: string;
  year: number;
  category: YearlyExpenseCategory;
  description: string;
  amount: number;
  paymentDate: Timestamp;
  receipt?: string;
  recordedBy: string;             // Must be owner
  recordedAt: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

type YearlyExpenseCategory = 
  | "income_tax" | "accounting_service" | "car_insurance" | "other";
```

---

### Collection: audit_logs
Audit verification records

```typescript
interface AuditLog {
  id: string;
  date: Timestamp;
  auditorId: string;
  auditorName: string;
  dailySalesId: string;
  
  actualCash: number;
  actualTransfer: {
    qrCode: number;
    bankAccount: number;
    govProgram: number;
    total: number;
  };
  
  systemCash: number;
  systemTransfer: {
    qrCode: number;
    bankAccount: number;
    govProgram: number;
    total: number;
  };
  
  difference: {
    cash: number;
    qrCode: number;
    bankAccount: number;
    govProgram: number;
    total: number;
  };
  
  notes?: string;
  status: "matched" | "discrepancy";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

### Collection: cash_flow
Cash flow summary (auto-calculated)

```typescript
interface CashFlow {
  id: string;
  date: Timestamp;
  openingBalance: number;
  totalIncome: number;
  totalExpense: number;
  closingBalance: number;
  calculatedBy: string;
  calculatedAt: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

### Collection: system_logs
Audit trail for all actions

```typescript
interface SystemLog {
  id: string;
  timestamp: Timestamp;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: SystemAction;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Timestamp;
}

type SystemAction = 
  | "create" | "read" | "update" | "delete"
  | "login" | "logout" | "export" | "approve" | "reject";
```

---

**Source**: Extracted from Technical Specification  
**Last Updated**: Jan 7, 2026  
**Version**: 1.0  
