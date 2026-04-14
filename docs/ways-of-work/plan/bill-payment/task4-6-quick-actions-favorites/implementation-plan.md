---
goal: 'Task 4.6: BP — Quick Actions + Favorites System'
version: '1.0'
date_created: '2026-04-14'
last_updated: '2026-04-14'
owner: 'Dev Team'
status: 'In progress'
tags: ['feature', 'bill-payment', 'quick-actions', 'favorites']
---

# Introduction

![Status: In progress](https://img.shields.io/badge/status-In_progress-yellow)

เพิ่มระบบ Quick Actions Grid และ Favorites System สำหรับ Bill Payment Service
เพื่อให้ Manager สามารถเพิ่มรายการที่ใช้บ่อยได้รวดเร็ว โดยอ้างอิงแนวทางจาก Money Transfer Service

## 1. Requirements & Constraints

- **REQ-001**: Quick Actions grid (3 ปุ่ม): ⭐ รายการโปรด, 📄 รับชำระบิล, 💰 ฝากเงิน
- **REQ-002**: Favorites จัดการด้วย 5 tabs × max 10 items per tab
- **REQ-003**: กด Favorite → auto-fill TransactionForm (customerName, billType, amount, commission)
- **REQ-004**: Disabled เมื่อ Opening Balance ยังไม่ตั้ง หรือ Step 1 เสร็จแล้ว
- **REQ-005**: API CRUD ครบ: GET / POST / PUT / DELETE
- **CON-001**: ต้องไม่กระทบ workflow ที่มีอยู่ (Step 1, 2, Auditor, Owner)
- **CON-002**: Follow money-transfer pattern (store, repository, API routes, UI)
- **PAT-001**: ใช้ JSON Repository เหมือน money-transfer (swap to Firestore ได้ภายหลัง)

## 2. Implementation Steps

### Implementation Phase 1: Types & Data Model

- GOAL-001: กำหนด BillPaymentFavorite type และ Repository interface

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-001 | เพิ่ม `BillPaymentFavorite` interface ใน `types/bill-payment.ts` | ✅ | 2026-04-14 |
| TASK-002 | เพิ่ม `IBillPaymentRepository` favorites methods ใน `types/repositories.ts` | ✅ | 2026-04-14 |

### Implementation Phase 2: Repository Layer

- GOAL-002: เพิ่ม favorites CRUD ใน bill-payment-json.repository.ts

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-003 | เพิ่ม `favorites` array state + JSON file in repository | ✅ | 2026-04-14 |
| TASK-004 | Implement `getFavorites()`, `getFavoritesByTab()`, `addFavorite()`, `updateFavorite()`, `deleteFavorite()` | ✅ | 2026-04-14 |

### Implementation Phase 3: API Routes

- GOAL-003: สร้าง API endpoints สำหรับ favorites

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-005 | `GET /api/bill-payment/favorites` | ✅ | 2026-04-14 |
| TASK-006 | `POST /api/bill-payment/favorites` | ✅ | 2026-04-14 |
| TASK-007 | `PUT /api/bill-payment/favorites/:id` | ✅ | 2026-04-14 |
| TASK-008 | `DELETE /api/bill-payment/favorites/:id` | ✅ | 2026-04-14 |

### Implementation Phase 4: Pinia Store

- GOAL-004: เพิ่ม favorites state + actions ใน bill-payment store

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-009 | เพิ่ม `favorites` state array | ✅ | 2026-04-14 |
| TASK-010 | เพิ่ม `getFavoritesByTab` getter | ✅ | 2026-04-14 |
| TASK-011 | เพิ่ม actions: `loadFavorites`, `addFavorite`, `updateFavorite`, `deleteFavorite` | ✅ | 2026-04-14 |

### Implementation Phase 5: UI Components

- GOAL-005: เพิ่ม Quick Actions + Favorites Modal ใน ManagerRecordingSection.vue

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-012 | เพิ่ม Quick Actions grid (3 ปุ่ม) ใต้ Balance Cards | ✅ | 2026-04-14 |
| TASK-013 | เพิ่ม Favorites Modal (multi-step: Step 1 → เลือก/จัดการ, Step 2 → ยืนยัน) | ✅ | 2026-04-14 |
| TASK-014 | Favorite เลือกแล้ว → auto-fill TransactionForm | ✅ | 2026-04-14 |

## 3. Alternatives

- **ALT-001**: สร้าง FavoritesModal.vue แยก — ไม่เลือก เพราะ MT ทำ inline ใน ManagerRecordingSection (สอดคล้องกัน)
- **ALT-002**: ใช้ localStorage แทน JSON file — ไม่เลือก เพราะต้องการ server-side persistence

## 4. Dependencies

- **DEP-001**: `components/bill-payment/TransactionForm.vue` — ต้อง receive preset data
- **DEP-002**: `stores/bill-payment.ts` — เพิ่ม favorites state
- **DEP-003**: `server/repositories/bill-payment-json.repository.ts` — favorites CRUD

## 5. Files

- **FILE-001**: `types/bill-payment.ts` — เพิ่ม BillPaymentFavorite interface
- **FILE-002**: `types/repositories.ts` — เพิ่ม favorites methods ใน IBillPaymentRepository
- **FILE-003**: `server/repositories/bill-payment-json.repository.ts` — favorites CRUD
- **FILE-004**: `server/api/bill-payment/favorites/index.get.ts`
- **FILE-005**: `server/api/bill-payment/favorites/index.post.ts`
- **FILE-006**: `server/api/bill-payment/favorites/[id].put.ts`
- **FILE-007**: `server/api/bill-payment/favorites/[id].delete.ts`
- **FILE-008**: `stores/bill-payment.ts` — favorites state + actions
- **FILE-009**: `components/bill-payment/ManagerRecordingSection.vue` — Quick Actions + Favorites Modal UI
- **FILE-010**: `public/data/bill-payment-favorites.json` — JSON data file (เริ่มต้น empty)

## 6. Testing

- **TEST-001**: กด Quick Action "รับชำระบิล" → TransactionForm เปิดพร้อม preset bill_payment
- **TEST-002**: กด Quick Action "รายการโปรด" → Favorites Modal เปิด
- **TEST-003**: เลือก Favorite → กรอก amount → Submit → Transaction ถูกสร้าง auto-fill ข้อมูล
- **TEST-004**: เพิ่ม/แก้ไข/ลบ Favorite ใน Manage mode
- **TEST-005**: Quick Actions disabled เมื่อ Opening Balance ไม่ถูกตั้ง

## 7. Risks & Assumptions

- **ASSUMPTION-001**: `TransactionForm.vue` รับ `preset` prop อยู่แล้ว หรือสามารถ extend ได้
- **RISK-001**: billType field ใน BillPaymentFavorite ต้องจับคู่กับ TransactionForm options

## 8. Related Specifications / Further Reading

- [SERVICE_HARMONIZATION_PLAN.md - หัวข้อ 3.6](f:\code\vue.js\bigt-minimart\docs\PROGRESS\SERVICE_HARMONIZATION_PLAN.md)
- [Money Transfer ManagerRecordingSection.vue](f:\code\vue.js\bigt-minimart\components\money-transfer\ManagerRecordingSection.vue) — reference implementation
