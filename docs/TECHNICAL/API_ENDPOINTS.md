# 🔌 API Endpoints

## Base URL
```
/api/
```

## Authentication Endpoints

```
POST   /api/auth/login              Login with email/password
POST   /api/auth/logout             Logout and clear session
POST   /api/auth/refresh            Refresh auth token
GET    /api/auth/me                 Get current user info
```

## Users Management Endpoints

```
GET    /api/users                   List all users
GET    /api/users/:id               Get user by ID
POST   /api/users                   Create new user
PUT    /api/users/:id               Update user info
DELETE /api/users/:id               Delete/deactivate user
```

## Daily Sales Endpoints

```
GET    /api/daily-sales             List daily sales records
GET    /api/daily-sales/:id         Get daily sales detail
POST   /api/daily-sales             Create daily sales record
PUT    /api/daily-sales/:id         Update daily sales
DELETE /api/daily-sales/:id         Delete daily sales
POST   /api/daily-sales/:id/submit  Submit for audit
POST   /api/daily-sales/:id/audit   Perform audit
```

## Service Transactions Endpoints

```
GET    /api/service-transactions    List service transactions
GET    /api/service-transactions/:id Get detail
POST   /api/service-transactions    Create transaction
PUT    /api/service-transactions/:id Update transaction
DELETE /api/service-transactions/:id Delete transaction
```

## Expenses Endpoints

```
GET    /api/expenses/daily          List daily expenses
POST   /api/expenses/daily          Create daily expense
GET    /api/expenses/monthly        List monthly expenses
POST   /api/expenses/monthly        Create monthly expense
GET    /api/expenses/yearly         List yearly expenses
POST   /api/expenses/yearly         Create yearly expense
```

## Reports Endpoints

```
GET    /api/reports/daily?date=...       Daily report
GET    /api/reports/monthly?month=...    Monthly report
GET    /api/reports/cash-flow?start=...  Cash flow report
GET    /api/reports/audit?date=...       Audit report
GET    /api/reports/summary              Summary dashboard
```

## Export Endpoints

```
POST   /api/export/google-sheets   Export to Google Sheets
POST   /api/export/pdf             Export as PDF
```

## Audit Log Endpoints

```
GET    /api/audit-logs             List all audit logs
GET    /api/audit-logs/:id         Get audit log detail
```

---

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { /* data */ },
  "message": "Optional message",
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 100
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": { /* additional details */ }
  }
}
```

---

**Source**: Extracted from Technical Specification  
**Last Updated**: Jan 7, 2026  
**Version**: 1.0  
