---
goal: Task 5.1 — BP Auditor: Balance Snapshot + Cash Count Table + Bank Statement + Transaction Toggle
version: 1.0
date_created: 2026-04-14
last_updated: 2026-04-14
owner: Dev Team
status: 'In progress'
tags: [feature, bill-payment, auditor, harmonization]
---

# Introduction

![Status: In progress](https://img.shields.io/badge/status-In%20progress-yellow)

ปรับปรุง `components/bill-payment/AuditorReviewSection.vue` ให้สอดคล้องกับ Money Transfer สี่ด้านหลัก:
1. **Balance Snapshot** — เพิ่ม `<BalanceSnapshot>` ด้านบน Auditor form  
2. **Bank Statement vs Closing Balance** — เปลี่ยนการเปรียบเทียบจาก actual cash → Expected Closing Balance  
3. **Auditor Cash Count** — เปลี่ยนจาก per-transaction checkbox → `<CashVerificationTable mode="auditor-input">`  
4. **Transaction Toggle** — เปลี่ยนจาก checkbox → toggle "มีปัญหา" + eye icon (pattern เหมือน MT)

---

## 1. Requirements & Constraints

- **REQ-001**: Balance Snapshot ใช้ `<BalanceSnapshot>` shared component ที่มีอยู่แล้ว  
- **REQ-002**: Opening Balance = `store.currentBalance.openingBalance`  
- **REQ-003**: Expected Closing Balance = Opening - totalAmountPaidOut + ownerDeposits (from completed transactions)  
- **REQ-004**: Bank Statement diff = bankStatementAmount − expectedClosingBalance  
- **REQ-005**: Auditor Cash Count ใช้ `<CashVerificationTable mode="auditor-input">` shared component  
- **REQ-006**: Cash Count rows: A. เงินสดรับชำระบิล | B. ค่าธรรมเนียม  
- **REQ-007**: Transaction toggle = `txnIssueStatus` (Record<string, true>) เหมือน MT pattern  
- **REQ-008**: submitAudit payload ต้องส่ง auditorCash + bankStatementVsClosing data  
- **CON-001**: ไม่เปลี่ยน API endpoint — ส่ง extra fields ใน body  
- **CON-002**: Types ต้อง add optional fields (backward-compatible)  
- **PAT-001**: Mirror `components/money-transfer/AuditorReviewSection.vue` structure  

---

## 2. Implementation Steps

### Phase 1 — Types Update

- GOAL-001: เพิ่ม optional fields ใน `BillPaymentDailySummary` (backward-compatible)

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-001 | `types/bill-payment.ts` — เพิ่ม `auditorActualBillPaymentCash?: number` และ `auditorActualServiceFeeCash?: number` ใน `BillPaymentDailySummary` | | |
| TASK-002 | `types/bill-payment.ts` — เพิ่ม `auditBankStatementVsClosingDiff?: number` และ `auditBankStatementVsClosingBalance?: number` ใน `BillPaymentDailySummary` | | |

### Phase 2 — AuditorReviewSection.vue Rewrite

- GOAL-002: แทนที่ checkbox-per-transaction ด้วย 4 sections ใหม่

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-003 | Script: เพิ่ม import `BalanceSnapshot`, `CashVerificationTable`, `EyeIcon`, `CashVerificationRow` type | | |
| TASK-004 | Script: เพิ่ม computed `openingBalance`, `expectedClosingBalance`, `netChange` สำหรับ Balance Snapshot | | |
| TASK-005 | Script: เปลี่ยน `txnChecked` → `txnIssueStatus: ref<Record<string, true>>({})` เหมือน MT | | |
| TASK-006 | Script: เพิ่ม `auditorCashBillPayment: ref<number \| null>(null)` และ `auditorCashServiceFee: ref<number \| null>(null)` | | |
| TASK-007 | Script: เพิ่ม `bankBalanceDiff` computed = `bankStatementAmount - expectedClosingBalance` | | |
| TASK-008 | Script: เพิ่ม `auditorCashRows` computed สำหรับ CashVerificationTable | | |
| TASK-009 | Script: ปรับ `canSubmitAudit` = step2 complete AND auditorCash inputs ไม่ null | | |
| TASK-010 | Script: อัปเดต `buildAuditData()` ส่ง `auditorCash` + `bankStatementVsClosing` fields | | |
| TASK-011 | Script: เพิ่ม `showTransactions: ref(false)` + `txnsWithIssues` computed + `toggleTxnIssue()` + `openVerifyModal()` | | |
| TASK-012 | Template: แทนที่ด้วย Balance Snapshot block (เหมือน MT) ใน Auditor Active Form | | |
| TASK-013 | Template: แทนที่ transaction checkbox list ด้วย collapsible `<TransactionTable>` + issue toggle buttons | | |
| TASK-014 | Template: เพิ่ม `<CashVerificationTable>` section สำหรับ Auditor Cash Count | | |
| TASK-015 | Template: ปรับ Step 2 read-only summary ใช้ `<CashVerificationTable mode="auditor-readonly">` | | |
| TASK-016 | Script: เพิ่ม pre-fill logic เมื่อ needs_correction (ใช้ `watch` เหมือน MT) | | |

### Phase 3 — Verify Store (No Changes Expected)

- GOAL-003: ตรวจสอบ submitAudit action รับ payload ใหม่ได้โดยไม่ต้องเปลี่ยน

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-017 | ตรวจสอบว่า `store.submitAudit()` ส่ง body ตรงไป API โดยไม่ filter — ยืนยัน `auditData: any` pattern | | |

---

## 3. Alternatives

- **ALT-001**: ออกแบบ Balance Snapshot แบบใหม่สำหรับ BP โดยเฉพาะ — ไม่เลือก เพราะ shared component รองรับได้อยู่แล้ว  
- **ALT-002**: ใช้ per-transaction checkbox เดิม — ไม่เลือก เพราะ Task 5.1 กำหนดให้เปลี่ยนเป็น toggle pattern  

---

## 4. Dependencies

- **DEP-001**: `components/shared/BalanceSnapshot.vue` — มีอยู่แล้ว  
- **DEP-002**: `components/shared/CashVerificationTable.vue` — มีอยู่แล้ว  
- **DEP-003**: `components/shared/TransactionTable.vue` — มีอยู่แล้ว (ใช้ใน MT)  
- **DEP-004**: `types/shared-workflow.ts` — `formatDiff()` utility  

---

## 5. Files

- **FILE-001**: `types/bill-payment.ts` — เพิ่ม optional fields ใน `BillPaymentDailySummary`  
- **FILE-002**: `components/bill-payment/AuditorReviewSection.vue` — rewrite auditor form sections  

---

## 6. Testing

- **TEST-001**: Auditor ไม่สามารถ submit ก่อนกรอก Cash Count ครบ  
- **TEST-002**: Balance Snapshot แสดง Opening / Net Change / Expected Closing ถูกต้อง  
- **TEST-003**: Bank Statement diff = bankStatementAmount − expectedClosingBalance  
- **TEST-004**: Toggle issue button บน transaction → txnIssueStatus อัปเดตถูกต้อง  
- **TEST-005**: Pre-fill ค่าเดิมเมื่อ needs_correction  

---

## 7. Risks & Assumptions

- **ASSUMPTION-001**: `expectedClosingBalance` = Opening balance − รวมยอดชำระบิล (completed) + owner_deposit  
- **ASSUMPTION-002**: `store.currentBalance.openingBalance` มีค่าเสมอเมื่อถึง Auditor step  
- **RISK-001**: ถ้า `openingBalance` เป็น 0 หรือ null, Balance Snapshot จะแสดงค่า 0 — acceptable  

---

## 8. Related Specifications / Further Reading

- [SERVICE_HARMONIZATION_PLAN.md — Task 5.1](../../PROGRESS/SERVICE_HARMONIZATION_PLAN.md)  
- [Money Transfer AuditorReviewSection.vue](../../../../components/money-transfer/AuditorReviewSection.vue)
