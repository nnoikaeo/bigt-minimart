# 🏗️ Repository Pattern

Data access for the Nitro API is isolated behind repositories so the storage backend
(JSON files ↔ Firestore) can be swapped without changing API routes, stores or components.

## 📊 Data Flow

```
Component → Pinia store → $fetch / $apiFetch → server/api/* route → Repository → storage
                                                                        ├─ JSON:      public/data/*.json   (active)
                                                                        └─ Firestore: Firebase (prepared)
```

Stores never import repositories directly — they call the API. Only `server/api/*` routes use repositories.

## 📁 Repositories

| Domain | Interface | JSON (active) | Firestore | Data files |
|--------|-----------|---------------|-----------|------------|
| Daily Sales | `ISalesRepository` (`types/repositories.ts`) | `sales-json.repository.ts` | `sales-firestore.repository.ts` (not wired) | `daily-sales.json` |
| Money Transfer | `IMoneyTransferRepository` (`types/repositories.ts`) | `money-transfer-json.repository.ts` | `money-transfer-firestore.repository.ts` (not wired) | `money-transfer-{transactions,balances,summaries,favorites,fee-config}.json` |
| Bill Payment | — (class only) | `bill-payment-json.repository.ts` | — | `bill-payment-{transactions,balances,summaries,favorites,fee-config}.json` |
| Access Control | `IAccessControlRepository` (`access-control.repository.ts`) | `access-control-json.repository.ts` | — | `roles.json`, `permissions.json`, `role-permissions.json`, `users.json`, `sidebar-menu.json` |

Each JSON repository exports a singleton (e.g. `moneyTransferJsonRepository`); Firestore
repositories export a factory (e.g. `createMoneyTransferFirestoreRepository(db)`).

## 💾 Usage in an API route

```typescript
// server/api/money-transfer/transactions/index.get.ts
import { moneyTransferJsonRepository } from '~/server/repositories/money-transfer-json.repository'

export default defineEventHandler(async (event) => {
  const { date } = getQuery(event) as { date: string }
  const transactions = await moneyTransferJsonRepository.getTransactionsByDate(date)
  return { success: true, data: transactions, count: transactions.length }
})
```

## 🔥 Migrating to Firestore (future)

1. Implement the missing Firestore repositories (Bill Payment, Access Control) against the same interface
2. Add a Bill Payment interface (`IBillPaymentRepository`) so both implementations share a contract
3. Write role-based `firestore.rules` for each collection
4. Seed data: `POST /api/admin/seed-firestore` (development only)
5. Switch the import in the API routes (or introduce a factory that picks JSON/Firestore by env)

## 🔐 Security

- **JSON**: no built-in security — development only, not for production user data
- **Firestore**: requires security rules + Firebase Auth
- Mutating Bill Payment routes verify the Firebase ID token with `requireServerAuth(event)`
  (`server/utils/serverAuth.ts`)

## 📚 Related Documentation

- [STATE_MANAGEMENT_ARCHITECTURE.md](../../docs/TECHNICAL/STATE_MANAGEMENT_ARCHITECTURE.md)
- [DATABASE_SCHEMA.md](../../docs/TECHNICAL/DATABASE_SCHEMA.md)
- [API_ENDPOINTS.md](../../docs/TECHNICAL/API_ENDPOINTS.md)

---

**Last Updated**: Oct 16, 2026
**Status**: JSON repositories active for all domains; Firestore migration not started
