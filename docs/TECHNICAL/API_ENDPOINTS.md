# 🔌 API Endpoints

> Generated from the actual route files in `server/api/` (Nitro file-based routing).
> 🔒 = route calls `requireServerAuth(event)` — caller identity comes from the Firebase ID token
> (sent automatically by the `$apiFetch` plugin), not from the request body.

## Base URL
```
/api/
```

---

## Money Transfer (`/api/money-transfer`) — FLOW 2

### Transactions
```
GET    /api/money-transfer/transactions                 List (query: date, status, type)
POST   /api/money-transfer/transactions                 Create transaction
PUT    /api/money-transfer/transactions/:id             Update transaction
DELETE /api/money-transfer/transactions/:id             Delete (draft) transaction
POST   /api/money-transfer/transactions/:id/complete    Draft → completed
PUT    /api/money-transfer/transactions/:id/status      Change status (+ statusNote)
```

### Balances
```
GET    /api/money-transfer/balances/current             Current balance
GET    /api/money-transfer/balances/previous            Previous day balance (carryover)
GET    /api/money-transfer/balances/:date               Balance for date
POST   /api/money-transfer/balances/opening             Set opening balance (carryover / manual)
```

### Daily Summaries (Workflow)
```
GET    /api/money-transfer/summaries                    List summaries (history page)
GET    /api/money-transfer/summaries/:date              Summary for date
POST   /api/money-transfer/summaries/:date/init         Initialize day
POST   /api/money-transfer/summaries/:date/complete-step1   Manager: finish recording
POST   /api/money-transfer/summaries/:date/complete-step2   Manager: cash count
POST   /api/money-transfer/summaries/:date/audit        Auditor: audited / audited_with_issues / needs_correction
POST   /api/money-transfer/summaries/:date/approve      Owner: approved / approved_with_notes / needs_correction
```

### Favorites
```
GET    /api/money-transfer/favorites
POST   /api/money-transfer/favorites
PUT    /api/money-transfer/favorites/:id
DELETE /api/money-transfer/favorites/:id
```

> ⚠️ Money Transfer routes do **not** call `requireServerAuth` yet (Bill Payment does).

---

## Bill Payment (`/api/bill-payment`) — FLOW 3

### Transactions
```
GET    /api/bill-payment/transactions                   List
POST   /api/bill-payment/transactions               🔒  Create transaction
PUT    /api/bill-payment/transactions/:id           🔒  Update transaction
DELETE /api/bill-payment/transactions/:id           🔒  Delete (draft) transaction
POST   /api/bill-payment/transactions/:id/complete  🔒  Draft → completed
PUT    /api/bill-payment/transactions/:id/status    🔒  Change status (+ statusNote)
```

### Balances
```
GET    /api/bill-payment/balances/current
GET    /api/bill-payment/balances/previous
GET    /api/bill-payment/balances/:date
POST   /api/bill-payment/balances/opening               Set opening balance
```

### Daily Summaries (Workflow)
```
GET    /api/bill-payment/summaries
GET    /api/bill-payment/summaries/:date
POST   /api/bill-payment/summaries/:date/init
POST   /api/bill-payment/summaries/:date/complete-step1   🔒
POST   /api/bill-payment/summaries/:date/complete-step2   🔒
POST   /api/bill-payment/summaries/:date/audit            🔒
POST   /api/bill-payment/summaries/:date/approve          🔒
```

### Favorites
```
GET    /api/bill-payment/favorites
POST   /api/bill-payment/favorites
PUT    /api/bill-payment/favorites/:id
DELETE /api/bill-payment/favorites/:id
```

### Migration
```
POST   /api/bill-payment/migrate-status             🔒  Legacy status → UnifiedTransactionStatus (idempotent)
```

---

## Daily Sales (`/api/daily-sales`) — FLOW 1
```
GET    /api/daily-sales                                 List records
GET    /api/daily-sales/:id                             Get record
POST   /api/daily-sales                                 Create record
PUT    /api/daily-sales/:id                             Update record
DELETE /api/daily-sales/:id                             Delete record
POST   /api/daily-sales/:id/approve                     Owner approve
```

---

## Settings (`/api/settings`)
```
GET    /api/settings/money-transfer-fees                Fee config
PUT    /api/settings/money-transfer-fees
GET    /api/settings/bill-payment-fees
PUT    /api/settings/bill-payment-fees
```

---

## Users (`/api/users`)
```
GET    /api/users
GET    /api/users/:id
POST   /api/users
PUT    /api/users/:id
DELETE /api/users/:id
POST   /api/init-users                                  Seed initial users (setup)
```

## Access Control (`/api/access-control`)
```
GET    /api/access-control/permissions                  All permissions
GET    /api/access-control/roles                        All roles
GET    /api/access-control/roles/:id/permissions
PUT    /api/access-control/roles/:id/permissions
GET    /api/access-control/users
POST   /api/access-control/users
PUT    /api/access-control/users/:id
DELETE /api/access-control/users/:id
```

## Sidebar (`/api/sidebar`)
```
GET    /api/sidebar/menu                                Menu filtered by role
PUT    /api/sidebar/pages/:pageKey                      Update page access
```

## Admin (`/api/admin`) — dev / maintenance
```
POST   /api/admin/migrate-bill-payment-status       🔒  Dry-run + apply status migration
POST   /api/admin/seed-firestore                        Seed Firestore from JSON (development only)
POST   /api/admin/test-endpoint                         Test endpoint
```

---

## Response Format

### Success
```json
{
  "success": true,
  "data": { },
  "count": 10
}
```
(`count` is included on list endpoints.)

### Error
Errors are thrown with Nitro `createError`:
```json
{
  "statusCode": 500,
  "message": "Failed to fetch transactions: <reason>"
}
```

---

## Not Implemented Yet (planned in v1.0 spec)
Expenses (`/api/expenses/*`), Reports (`/api/reports/*`), Export (`/api/export/*`), Audit Logs (`/api/audit-logs`).

---

**Last Updated**: Oct 16, 2026
**Version**: 2.0
