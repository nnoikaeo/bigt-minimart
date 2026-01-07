# Technical Specification
# รายละเอียดทางเทคนิค

## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Desktop    │  │    Tablet    │  │    Mobile    │      │
│  │   Browser    │  │   Browser    │  │   Browser    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                   HTTPS (TLS 1.3)
                            │
┌─────────────────────────────────────────────────────────────┐
│                     Nuxt.js Application                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Frontend (Vue 3 + TS)                   │   │
│  │  • Components (UI)                                   │   │
│  │  • Pages (Routing)                                   │   │
│  │  • Stores (Pinia)                                    │   │
│  │  • Composables                                       │   │
│  └──────────────────────────────────────────────────────┘   │
│                            │                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            Server API (Nuxt Server)                  │   │
│  │  • Authentication Middleware                         │   │
│  │  • Authorization (RBAC)                              │   │
│  │  • Business Logic                                    │   │
│  │  • Data Validation                                   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                    Firebase Admin SDK
                            │
┌─────────────────────────────────────────────────────────────┐
│                     Firebase Services                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Firebase     │  │  Firestore   │  │   Storage    │      │
│  │ Auth         │  │  (Database)  │  │  (Files)     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                   External Services
                            │
┌─────────────────────────────────────────────────────────────┐
│  ┌──────────────┐  ┌──────────────┐                         │
│  │ Google       │  │   Looker     │                         │
│  │ Sheets API   │  │   Studio     │                         │
│  └──────────────┘  └──────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 💻 Technology Stack

### Frontend
- **Framework**: Nuxt 3 (Vue 3)
- **Language**: TypeScript
- **UI Framework**: Tailwind CSS
- **State Management**: Pinia
- **HTTP Client**: $fetch (Nuxt built-in)
- **Form Validation**: Vee-Validate + Zod
- **Date/Time**: Day.js
- **Charts**: Chart.js / ApexCharts
- **Icons**: Heroicons

### Backend
- **Runtime**: Nuxt Server (Nitro)
- **Language**: TypeScript
- **Authentication**: Firebase Authentication
- **API Style**: RESTful
- **Validation**: Zod

### Database
- **Database**: Firebase Firestore (NoSQL)
- **Storage**: Firebase Storage (สำหรับรูปใบเสร็จ)

### Hosting & Deployment
- **Hosting**: Firebase Hosting
- **CI/CD**: GitHub Actions (optional)
- **Domain**: TBD

### Development Tools
- **Package Manager**: npm / pnpm
- **Code Editor**: VS Code (recommended)
- **Version Control**: Git
- **Linting**: ESLint + Prettier
- **Testing**: Vitest (optional)

---

## 🗄️ Database Schema (Firestore)

### Collection: `users`
ข้อมูลผู้ใช้ในระบบ

```typescript
interface User {
  uid: string;                    // Firebase Auth UID
  email: string;                  // อีเมล
  displayName: string;            // ชื่อแสดง
  role: UserRole;                 // บทบาท
  posNumber: 1 | 2 | null;       // POS ที่รับผิดชอบ
  isActive: boolean;              // สถานะเปิดใช้งาน
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy?: string;             // uid ของคนสร้าง
}

type UserRole = 
  | "owner"              // เจ้าของร้าน
  | "manager"            // ผู้จัดการ
  | "assistant_manager"  // ผู้ช่วยผู้จัดการ
  | "cashier"            // แคชเชียร์
  | "auditor";           // ผู้ตรวจสอบ
```

**Indexes**:
- `email` (Unique)
- `role` (Composite: role + isActive)

---

### Collection: `daily_sales`
ข้อมูลยอดขายรายวัน (แยกตามพนักงาน/กะ)

```typescript
interface DailySales {
  id: string;                     // Auto-generated
  date: Timestamp;                // วันที่
  userId: string;                 // UID ของพนักงานที่ขาย
  userName: string;               // ชื่อพนักงาน
  posNumber: 1 | 2;              // POS ที่ใช้
  shift: "morning" | "afternoon"; // กะ
  
  // รายรับ
  sales: {
    posposTotal: number;          // ยอดจาก POSPOS
    cashAmount: number;           // เงินสด (รวม)
    
    // รายละเอียดเงินสด (optional - สำหรับนับละเอียด)
    cashBreakdown?: {
      note1000: number;           // แบงค์ 1000
      note500: number;            // แบงค์ 500
      note100: number;            // แบงค์ 100
      note50: number;             // แบงค์ 50
      note20: number;             // แบงค์ 20
      coin10: number;             // เหรียญ 10
      coin5: number;              // เหรียญ 5
      coin2: number;              // เหรียญ 2
      coin1: number;              // เหรียญ 1
    };
    
    // เงินโอน (แยกตามช่องทาง)
    transferAmount: {
      qrCode: number;             // QR Code (PromptPay)
      bankAccount: number;        // บัญชีธนาคาร
      govProgram: number;         // โครงการรัฐ
      total: number;              // รวมเงินโอน
    };
    
    total: number;                // รวมรายรับทั้งหมด
  };
  
  // สถานะ
  status: SalesStatus;
  
  // ผู้บันทึกและตรวจสอบ
  submittedBy?: string;           // UID ผู้จัดการที่ Submit
  submittedAt?: Timestamp;
  auditedBy?: string;             // UID Auditor
  auditedAt?: Timestamp;
  auditNotes?: string;            // หมายเหตุจาก Auditor
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

type SalesStatus = 
  | "draft"       // แคชเชียร์บันทึกแล้ว รอผู้จัดการ Submit
  | "submitted"   // ผู้จัดการ Submit แล้ว รอ Auditor ตรวจสอบ
  | "audited"     // Auditor ตรวจสอบเรียบร้อยแล้ว
  | "approved";   // เจ้าของร้านอนุมัติแล้ว (optional)
```

**Indexes**:
- `date` (Composite: date + status)
- `userId` (Composite: userId + date)
- `status`

---

### Collection: `service_transactions`
บันทึกรายรับค่าบริการ (แยกรายการ)

```typescript
interface ServiceTransaction {
  id: string;
  date: Timestamp;                // วันที่
  dailySalesId?: string;          // อ้างอิงถึง daily_sales (optional)
  
  type: ServiceType;
  description: string;            // รายละเอียด
  amount: number;                 // จำนวนเงิน
  
  recordedBy: string;             // UID ผู้บันทึก
  recordedAt: Timestamp;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

type ServiceType = 
  | "money_transfer"   // โอนเงิน
  | "withdrawal"       // ถอนเงิน
  | "bill_payment"     // จ่ายบิล
  | "other";           // อื่นๆ
```

**Indexes**:
- `date` (Composite: date + type)
- `recordedBy`

---

### Collection: `daily_expenses`
รายจ่ายรายวัน

```typescript
interface DailyExpense {
  id: string;
  date: Timestamp;
  
  category: DailyExpenseCategory;
  description: string;            // รายละเอียด
  paymentMethod: "cash" | "transfer";
  amount: number;
  receipt?: string;               // URL รูปใบเสร็จ (Firebase Storage)
  
  recordedBy: string;             // UID ผู้บันทึก
  recordedAt: Timestamp;
  
  status: "draft" | "submitted" | "audited";
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

type DailyExpenseCategory = 
  | "stock_purchase"    // ซื้อสินค้าเติมสต็อก
  | "other";            // อื่นๆ
```

**Indexes**:
- `date` (Composite: date + category)
- `recordedBy`

---

### Collection: `monthly_expenses`
ค่าใช้จ่ายรายเดือน (บันทึกโดยเจ้าของร้านเท่านั้น)

```typescript
interface MonthlyExpense {
  id: string;
  month: string;                  // Format: "2026-01"
  year: number;
  
  category: MonthlyExpenseCategory;
  description: string;
  amount: number;
  paymentDate: Timestamp;
  receipt?: string;               // URL รูปใบเสร็จ
  
  recordedBy: string;             // UID (ต้องเป็น owner)
  recordedAt: Timestamp;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

type MonthlyExpenseCategory = 
  | "rent"              // ค่าเช่า
  | "utilities_electric" // ค่าไฟฟ้า
  | "utilities_water"   // ค่าน้ำประปา
  | "internet"          // ค่าอินเทอร์เน็ต
  | "salary"            // เงินเดือน (⚠️ ข้อมูลลับ)
  | "overtime"          // ค่าโอที (⚠️ ข้อมูลลับ)
  | "vat"               // ภาษีมูลค่าเพิ่ม
  | "fuel"              // ค่าน้ำมันรถ
  | "other";            // อื่นๆ
```

**Indexes**:
- `month` (Composite: year + month)
- `category`

**Security Rules**: เฉพาะ `owner` อ่าน/เขียนได้

---

### Collection: `yearly_expenses`
ค่าใช้จ่ายรายปี

```typescript
interface YearlyExpense {
  id: string;
  year: number;
  
  category: YearlyExpenseCategory;
  description: string;
  amount: number;
  paymentDate: Timestamp;
  receipt?: string;
  
  recordedBy: string;             // UID (ต้องเป็น owner)
  recordedAt: Timestamp;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

type YearlyExpenseCategory = 
  | "income_tax"        // ภาษีรายได้
  | "accounting_service" // ค่าบริการสำนักงานบัญชี
  | "car_insurance"     // ค่าประกันรถ
  | "other";            // อื่นๆ
```

**Indexes**:
- `year` (Composite: year + category)

**Security Rules**: เฉพาะ `owner` อ่าน/เขียนได้

---

### Collection: `audit_logs`
บันทึกการตรวจสอบ Audit

```typescript
interface AuditLog {
  id: string;
  date: Timestamp;
  auditorId: string;              // UID ของ Auditor
  auditorName: string;
  
  dailySalesId: string;           // อ้างอิงถึง daily_sales
  
  // เงินจริงที่นับได้
  actualCash: number;
  actualTransfer: {
    qrCode: number;
    bankAccount: number;
    govProgram: number;
    total: number;
  };
  
  // เงินในระบบ
  systemCash: number;
  systemTransfer: {
    qrCode: number;
    bankAccount: number;
    govProgram: number;
    total: number;
  };
  
  // ผลต่าง
  difference: {
    cash: number;                 // + = เงินเกิน, - = เงินขาด
    qrCode: number;
    bankAccount: number;
    govProgram: number;
    total: number;
  };
  
  notes?: string;                 // หมายเหตุ
  status: "matched" | "discrepancy"; // ตรงกัน หรือ มีผลต่าง
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Indexes**:
- `date` (Composite: date + status)
- `dailySalesId` (Unique)
- `auditorId`

---

### Collection: `cash_flow`
กระแสเงินสด (คำนวณอัตโนมัติ)

```typescript
interface CashFlow {
  id: string;
  date: Timestamp;                // วันที่
  
  openingBalance: number;         // ยอดยกมา
  
  totalIncome: number;            // รายรับรวม
  totalExpense: number;           // รายจ่ายรวม
  
  closingBalance: number;         // ยอดยกไป (openingBalance + totalIncome - totalExpense)
  
  calculatedBy: string;           // UID (system หรือ owner)
  calculatedAt: Timestamp;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Indexes**:
- `date` (Unique)

---

### Collection: `system_logs`
บันทึก Action ในระบบ (Audit Trail)

```typescript
interface SystemLog {
  id: string;
  timestamp: Timestamp;
  
  userId: string;                 // UID ผู้ทำ Action
  userName: string;
  userRole: UserRole;
  
  action: SystemAction;
  resource: string;               // เช่น "daily_sales", "monthly_expenses"
  resourceId?: string;            // ID ของ Resource
  
  metadata?: Record<string, any>; // ข้อมูลเพิ่มเติม
  ipAddress?: string;
  userAgent?: string;
  
  createdAt: Timestamp;
}

type SystemAction = 
  | "create"
  | "read"
  | "update"
  | "delete"
  | "login"
  | "logout"
  | "export"
  | "approve"
  | "reject";
```

**Indexes**:
- `timestamp` (Composite: timestamp DESC)
- `userId` (Composite: userId + timestamp)
- `action`

---

## 🔐 Authentication & Authorization

### Firebase Authentication

**Login Methods**:
- ✅ Email/Password (Primary)
- ❌ Google Sign-In (Future)
- ❌ Phone Number (Future)

**Session Management**:
- Token Expiry: 1 hour
- Refresh Token: 30 days
- Auto Logout: 30 minutes of inactivity

### Role-Based Access Control (RBAC)

**Permission Matrix**:

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

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper Functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function getUser() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid));
    }
    
    function getUserRole() {
      return getUser().data.role;
    }
    
    function isOwner() {
      return getUserRole() == "owner";
    }
    
    function isManager() {
      return getUserRole() in ["owner", "manager", "assistant_manager"];
    }
    
    function isAuditor() {
      return getUserRole() in ["owner", "auditor"];
    }
    
    // Users Collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create, update, delete: if isOwner();
    }
    
    // Daily Sales
    match /daily_sales/{salesId} {
      allow read: if isAuthenticated() && (
        isManager() || 
        isAuditor() || 
        resource.data.userId == request.auth.uid
      );
      allow create: if isAuthenticated();
      allow update: if isManager() || isAuditor();
      allow delete: if isOwner();
    }
    
    // Service Transactions
    match /service_transactions/{transId} {
      allow read: if isManager() || isAuditor();
      allow write: if isManager();
    }
    
    // Daily Expenses
    match /daily_expenses/{expenseId} {
      allow read: if isManager() || isAuditor();
      allow write: if isManager();
    }
    
    // Monthly Expenses (⚠️ Owner Only)
    match /monthly_expenses/{expenseId} {
      allow read, write: if isOwner();
    }
    
    // Yearly Expenses (⚠️ Owner Only)
    match /yearly_expenses/{expenseId} {
      allow read, write: if isOwner();
    }
    
    // Audit Logs
    match /audit_logs/{logId} {
      allow read: if isAuditor();
      allow write: if isAuditor();
    }
    
    // Cash Flow
    match /cash_flow/{flowId} {
      allow read: if isAuthenticated();
      allow write: if isOwner() || isManager();
    }
    
    // System Logs (Read-Only)
    match /system_logs/{logId} {
      allow read: if isOwner();
      allow write: if false; // Only via Admin SDK
    }
  }
}
```

---

## 🔌 API Endpoints

### Authentication

```
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
GET    /api/auth/me
```

### Users

```
GET    /api/users
GET    /api/users/:id
POST   /api/users
PUT    /api/users/:id
DELETE /api/users/:id
```

### Daily Sales

```
GET    /api/daily-sales
GET    /api/daily-sales/:id
POST   /api/daily-sales
PUT    /api/daily-sales/:id
DELETE /api/daily-sales/:id
POST   /api/daily-sales/:id/submit
POST   /api/daily-sales/:id/audit
```

### Service Transactions

```
GET    /api/service-transactions
GET    /api/service-transactions/:id
POST   /api/service-transactions
PUT    /api/service-transactions/:id
DELETE /api/service-transactions/:id
```

### Expenses

```
GET    /api/expenses/daily
POST   /api/expenses/daily
GET    /api/expenses/monthly
POST   /api/expenses/monthly
GET    /api/expenses/yearly
POST   /api/expenses/yearly
```

### Reports

```
GET    /api/reports/daily?date=2026-01-07
GET    /api/reports/monthly?month=2026-01
GET    /api/reports/cash-flow?startDate=2026-01-01&endDate=2026-01-31
GET    /api/reports/audit?date=2026-01-07
```

### Export

```
POST   /api/export/google-sheets
POST   /api/export/pdf
```

---

## 📦 Data Validation (Zod Schemas)

```typescript
// User Schema
const userSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(2).max(100),
  role: z.enum(["owner", "manager", "assistant_manager", "cashier", "auditor"]),
  posNumber: z.union([z.literal(1), z.literal(2), z.null()]),
  isActive: z.boolean(),
});

// Daily Sales Schema
const dailySalesSchema = z.object({
  date: z.date(),
  userId: z.string(),
  userName: z.string(),
  posNumber: z.union([z.literal(1), z.literal(2)]),
  shift: z.enum(["morning", "afternoon"]),
  sales: z.object({
    posposTotal: z.number().min(0),
    cashAmount: z.number().min(0),
    transferAmount: z.object({
      qrCode: z.number().min(0),
      bankAccount: z.number().min(0),
      govProgram: z.number().min(0),
    }),
  }),
  status: z.enum(["draft", "submitted", "audited", "approved"]),
});

// Expense Schema
const expenseSchema = z.object({
  date: z.date(),
  category: z.string(),
  description: z.string().min(1),
  paymentMethod: z.enum(["cash", "transfer"]),
  amount: z.number().positive(),
  receipt: z.string().url().optional(),
});
```

---

## 🎨 API Response Format

### Success Response

```typescript
{
  success: true,
  data: any,
  message?: string,
  meta?: {
    page?: number,
    limit?: number,
    total?: number
  }
}
```

### Error Response

```typescript
{
  success: false,
  error: {
    code: string,      // เช่น "INVALID_INPUT", "UNAUTHORIZED"
    message: string,   // ข้อความแสดง Error
    details?: any      // รายละเอียดเพิ่มเติม
  }
}
```

---

## 🔒 Security Best Practices

1. ✅ Input Validation - ตรวจสอบทุก Input ด้วย Zod
2. ✅ SQL Injection Prevention - ใช้ Firestore (NoSQL) + Parameterized Queries
3. ✅ XSS Prevention - Sanitize Output, CSP Headers
4. ✅ CSRF Protection - CSRF Tokens
5. ✅ Rate Limiting - จำกัดจำนวน Request
6. ✅ HTTPS Only - บังคับใช้ HTTPS
7. ✅ Secure Headers - HSTS, X-Frame-Options, etc.
8. ✅ Audit Logging - บันทึกทุก Action ใน system_logs

---

## 📊 Performance Optimization

1. ✅ **Database Indexes** - สร้าง Composite Indexes ที่จำเป็น
2. ✅ **Pagination** - จำกัดจำนวน Documents ที่ Query ต่อครั้ง
3. ✅ **Caching** - Cache ข้อมูลที่ไม่เปลี่ยนแปลงบ่อย
4. ✅ **Lazy Loading** - โหลด Components เมื่อจำเป็น
5. ✅ **Image Optimization** - Compress รูปภาพก่อน Upload
6. ✅ **Code Splitting** - แยก Bundle ตาม Route

---

**Last Updated**: 2026-01-07  
**Version**: 1.0  
**Status**: 📝 Documentation Phase
