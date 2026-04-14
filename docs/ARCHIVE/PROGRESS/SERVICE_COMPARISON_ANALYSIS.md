# การวิเคราะห์และเปรียบเทียบ: บริการโอนเงิน vs บริการรับชำระบิล

> **วันที่วิเคราะห์:** 8 เมษายน 2569  
> **วัตถุประสงค์:** เปรียบเทียบความแตกต่างระหว่างทุกหน้าของบริการโอนเงิน (Money Transfer) และบริการรับชำระบิล (Bill Payment) เพื่อใช้วางแผนปรับปรุงให้สอดคล้องกัน

---

## 1. ภาพรวมโครงสร้างหน้า (Page Architecture)

| หัวข้อ | บริการโอนเงิน (Money Transfer) | บริการรับชำระบิล (Bill Payment) |
|---|---|---|
| **จำนวนหน้า** | **2 หน้า** — History + Service (Single Page) | **4 หน้า** — History + Service + Auditor Review + Owner Approval |
| **การแบ่ง Workflow** | ทุก Role ทำงานใน **หน้าเดียวกัน** (index.vue) แสดง section ตาม role | แยก **หน้าเฉพาะ** สำหรับ Auditor (auditor-review.vue) และ Owner (owner-approval.vue) |
| **Navigation** | ทุก Role ไปหน้า `/finance/money-transfer-service?date=X` | Manager → service, Auditor → auditor-review, Owner → owner-approval |

### ไฟล์ที่เกี่ยวข้อง

**Money Transfer:**
- `pages/finance/money-transfer-history.vue` — หน้ารายการประวัติ
- `pages/finance/money-transfer-service/index.vue` — หน้า Workflow หลัก (ทุก role ใช้ร่วมกัน)
- `components/money-transfer/` — 12 dedicated components
- `stores/money-transfer.ts` — Pinia store
- `composables/useMoneyTransferHelpers.ts` — Utility functions

**Bill Payment:**
- `pages/finance/bill-payment-history.vue` — หน้ารายการประวัติ
- `pages/finance/bill-payment-service/index.vue` — หน้า Manager (Step 1 + Step 2)
- `pages/finance/bill-payment-service/auditor-review.vue` — หน้า Auditor
- `pages/finance/bill-payment-service/owner-approval.vue` — หน้า Owner
- *(ไม่มี dedicated components — ใช้ generic UI components ทั้งหมด)*
- `stores/bill-payment.ts` — Pinia store
- `composables/useBillPaymentHelpers.ts` — Utility functions

---

## 2. หน้า History (รายการประวัติ)

| หัวข้อ | Money Transfer | Bill Payment |
|---|---|---|
| **Pending Inbox** | แสดง 3 card แยกตาม role (Manager: `step1_in_progress`, Auditor: `step2_completed`/`needs_correction`, Owner: `audited`) | แสดง 3 card คล้ายกัน แต่ Auditor รวม `step2_completed` + `step2_completed_with_notes`, Owner รวม `audited` + `audited_with_issues` |
| **ปุ่ม Action ตาม Role** | Manager: "ทำงาน", Auditor: "ตรวจสอบ", Owner: "อนุมัติ" — ทุก Role ไป **URL เดียวกัน** | Manager: "ทำงาน"/"แก้ไข", Auditor: "ตรวจสอบ"/"ดูการตรวจสอบ", Owner: "อนุมัติ"/"ดูรายละเอียด" — แต่ละ Role ไป **URL ต่างกัน** |
| **คอลัมน์ตาราง** | Date, Status, จำนวนรายการ, ยอดรวม, Commission, Action | Date, Status, จำนวนรายการ, ยอดรวม, Commission, Action (เหมือนกัน) |

---

## 3. หน้ารายละเอียดหลัก (Service Page) — มุมมองของ Manager

| หัวข้อ | Money Transfer | Bill Payment |
|---|---|---|
| **Opening Balance** | **มี** — ต้องกำหนดยอดเงินเริ่มต้นก่อน (Carryover/Manual) | **ไม่มี** — ไม่ต้องตั้งยอดเริ่มต้น (มี field `openingBalance` ใน type แต่ไม่มี UI บังคับ) |
| **Balance Cards** | **8 cards** (2 แถว): เงินเริ่มต้น, รวมฝาก, รวมโอน, รวมถอน, เงินบัญชีคงเหลือ, เงินสดคงเหลือ, ค่าบริการ(สด), ค่าบริการ(โอน) | **3 cards** (1 แถว): Bank Account, Bill Payment Cash, Service Fee Cash |
| **Workflow Progress Bar** | **มี** — Visual 4-step bar (บันทึก→ตรวจนับ→Auditor→Owner) | **ไม่มี** — ใช้ heading + badge แทน |
| **Quick Glance Summary** | **มี** — แสดงสรุปด้านบน (วันที่, จำนวน, commission, status) | **ไม่มี** — ข้อมูลสรุปอยู่ในส่วนหัวของตาราง |
| **Quick Actions** | **มี** — ปุ่มลัด 4 ปุ่ม (โปรด, โอน, ถอน, ฝาก) | **ไม่มี** — มีแค่ปุ่ม "รายการใหม่" |
| **Draft Transactions** | **มี** — ระบบ Draft (รอดำเนินการ เมื่อยอดไม่พอ) พร้อมปุ่ม "ดำเนินการ"/"ลบ" | **ไม่มี** — ไม่มีระบบ Draft |
| **Favorites** | **มี** — ระบบรายการโปรด (5 tab, 10 รายการ/tab) | **ไม่มี** |
| **Transaction Types** | 3 ประเภท: Transfer, Withdrawal, Owner Deposit | 2 ประเภท: Bill Payment, Owner Deposit |
| **Transaction Channels** | **มี** — Bank Account / PromptPay / Other (with sub-fields) | **ไม่มี** — ใช้ Bill Type แทน (utility, telecom, insurance, other) |
| **Commission Input** | Auto-calculate หรือ manual override + เลือก Cash/Transfer | ใส่เอง (commission field) ไม่มี type Cash/Transfer |
| **Transaction Status** | 4 สถานะ: completed, draft, on_hold, cancelled | 2 สถานะ: success, failed |
| **Status Change** | **มี** — Manager เปลี่ยนสถานะ (completed↔on_hold, →cancelled) พร้อมเหตุผล | **ไม่มี** — แก้ไขได้แค่ข้อมูล ไม่มีระบบเปลี่ยนสถานะ |
| **Filter Tabs** | **มี** — ทั้งหมด, สำเร็จ, รอดำเนินการ, พักรายการ | **ไม่มี** |
| **Pagination** | **มี** — 10 items/page | **ไม่มี** |
| **Step 1 Completion** | **Checklist 4 ข้อ** (balance set, ≥1 txn, no drafts, no on_hold) → ปุ่ม "ยืนยันบันทึกรายการ → ตรวจนับเงินสด" | **เงื่อนไข 1 ข้อ** (มี transaction) → ปุ่ม "ไปขั้นตอนที่ 2 →" |

---

## 4. การตรวจนับเงินสด (Cash Verification — Step 2) — Manager

| หัวข้อ | Money Transfer | Bill Payment |
|---|---|---|
| **รายการที่ต้องนับ** | 3 แถว: (A) เงินสดโอน/ถอน, (B) ค่าบริการเงินสด + แถว (C) ค่าบริการโอน (อ่านอย่างเดียว) | 2 แถว: (A) เงินสดรับชำระบิล, (B) ค่าธรรมเนียมสะสม |
| **UI Layout** | ใช้ component `MoneyTransferCashVerificationTable` — **แบบ Table** (Expected / Manager นับ / ส่วนต่าง) | ใช้ inline form — **แบบ card rows** (Label + คาดหวัง + Input + Diff) |
| **Diff Display** | แสดงใน table column "ส่วนต่าง" | แสดง inline ข้าง input field |
| **Notes** | แสดง textarea เฉพาะเมื่อมี discrepancy | แสดง textarea เสมอ (แต่ required เฉพาะเมื่อมี discrepancy) |

---

## 5. การตรวจสอบ Auditor (Audit Review)

| หัวข้อ | Money Transfer | Bill Payment |
|---|---|---|
| **หน้าที่ใช้** | **หน้าเดียวกับ Service** (money-transfer-service/index.vue) — section แสดงตาม role | **หน้าแยก** (bill-payment-service/auditor-review.vue) |
| **Balance Snapshot** | **มี** — 3 cards (Opening → Net Change → Closing) + ช่อง Bank Statement | **ไม่มี** — ดู Step 2 results ตรงๆ |
| **Bank Statement** | ใส่ยอด + เปรียบเทียบกับ Closing Balance ที่คาดหวัง | ใส่ยอด + เปรียบเทียบกับ actual cash (Step 2) |
| **การตรวจ Transaction** | กดปุ่ม **"มีปัญหา" toggle** per row + Eye icon ดูรายละเอียด | **Checkbox** per bill_payment transaction + Badge สี (green=checked, red=unchecked) |
| **Auditor นับเงินสดเอง** | **ใช่** — Auditor ใส่จำนวนเงินที่นับจริง (ตาราง 5 คอลัมน์: Expected / Manager / Auditor / Diff) | **ไม่** — ดูผล Manager อย่างเดียว ไม่มี Auditor input เพิ่ม |
| **ปุ่ม Action** | **2 ปุ่ม**: "ส่งคืนแก้ไข" + "ยืนยันการตรวจสอบ" | **3 ปุ่ม**: "ส่งกลับให้ Manager ปรับแก้" + "ยืนยันพร้อมหมายเหตุ" + "ยืนยันการตรวจสอบ" |
| **Outcome States** | 2 outcomes: `audited` หรือ `needs_correction` | **3 outcomes**: `audited`, `audited_with_issues`, `needs_correction` |
| **Correction Reason Banner** | แสดง banner เมื่อ `needs_correction` ระบุเหตุผลจาก Owner | แสดง banner "ตรวจสอบซ้ำ — Manager แก้ไขแล้ว" พร้อม correction notes |

---

## 6. การอนุมัติ Owner (Owner Approval)

| หัวข้อ | Money Transfer | Bill Payment |
|---|---|---|
| **หน้าที่ใช้** | **หน้าเดียวกับ Service** (section ใน index.vue) | **หน้าแยก** (bill-payment-service/owner-approval.vue) |
| **การแสดง Step Summary** | แสดง previous steps แบบ collapsed (read-only) | แสดง **3 Expandable cards**: Step 1 (Summary + Table), Step 2 (Cash Results), Audit Results |
| **Step 1 Summary Detail** | ข้อมูลสรุปสั้นๆ | Card พร้อมยอดรวม 3 ตัว (ยอดรับชำระ, ค่าธรรมเนียม, รายการล้มเหลว) + expandable transaction table |
| **Audit Summary Detail** | แสดง audit result badge + bank statement + issue flags | แสดง Auditor name, datetime, Bank Statement, ตรวจกี่รายการ, ปัญหาที่พบ, หมายเหตุ |
| **Decision Options** | **3 ตัวเลือก**: อนุมัติ, อนุมัติพร้อมหมายเหตุ, ขอให้แก้ไข | **3 ตัวเลือก**: อนุมัติ, อนุมัติพร้อมหมายเหตุ, ขอให้แก้ไข (เหมือนกัน) |
| **"ขอให้แก้ไข" condition** | ใช้ได้เสมอ (ไม่มีเงื่อนไข) | ใช้ได้เฉพาะเมื่อ workflow = `audited_with_issues` |
| **UI Layout** | Form-based layout ใน section | **3-column radio card** selection (green/blue/red borders) |
| **Already Approved Display** | Green banner showing completion | Green banner "อนุมัติแล้ว ✅" |

---

## 7. Workflow Status ที่ต่างกัน

| Money Transfer (6 สถานะ) | Bill Payment (8 สถานะ) | หมายเหตุ |
|---|---|---|
| `step1_in_progress` | `step1_in_progress` | เหมือนกัน |
| `step1_completed` | *(ไม่มี — ข้ามไป step2 เลย)* | MT แยก step1 complete ออกจาก step2 |
| `step2_completed` | `step2_completed` | เหมือนกัน |
| *(ไม่มี)* | `step2_completed_with_notes` | BP มี sub-status เมื่อมี discrepancy |
| `audited` | `audited` | เหมือนกัน |
| *(ไม่มี)* | `audited_with_issues` | BP มี sub-status เมื่อ Auditor พบปัญหา |
| `approved` | `approved` | เหมือนกัน |
| *(ไม่มี)* | `approved_with_notes` | BP มี sub-status เมื่อ Owner มีหมายเหตุ |
| `needs_correction` | `needs_correction` | เหมือนกัน |

**สรุป**: Bill Payment มี **sub-status** เพิ่ม 3 ตัว (`step2_completed_with_notes`, `audited_with_issues`, `approved_with_notes`) เพื่อระบุว่ามี "หมายเหตุ/ปัญหา" ทุกขั้นตอน ขณะที่ Money Transfer ไม่แยก sub-status

---

## 8. Components ที่ใช้

### Money Transfer — 12 Dedicated Components

| Component | หน้าที่ | Bill Payment มี? |
|---|---|---|
| `WorkflowProgressBar.vue` | Visual step indicator (4 steps) | ❌ ไม่มี |
| `CompactBalanceSummary.vue` | 4+4 expandable balance cards | ❌ ไม่มี |
| `MoneyTransferBalanceSnapshot.vue` | 3-card snapshot (Opening→Change→Closing) | ❌ ไม่มี |
| `MoneyTransferCashVerificationTable.vue` | Cash verification in table format | ❌ ใช้ inline form แทน |
| `MoneyTransferTransactionTable.vue` | Reusable transaction table | ❌ เขียน inline ใน page |
| `TransactionForm.vue` | Modal form component | ❌ เขียน inline ใน page |
| `ChannelSelector.vue` | Bank/PromptPay/Other radio | ❌ ไม่มี concept channel |
| `BankAccountFields.vue` | Bank account sub-form | ❌ ไม่มี |
| `PromptPayFields.vue` | PromptPay sub-form | ❌ ไม่มี |
| `TransactionTypeSelector.vue` | Transfer/Withdrawal/Deposit radio | ❌ ใช้ radio inline |
| `BalanceDisplay.vue` | 4-card balance grid | ❌ ใช้ inline cards |
| `QuickGlanceSummary.vue` | Inline summary card with status | ❌ ไม่มี |

### Bill Payment — ไม่มี Dedicated Components

ใช้ generic UI components ทั้งหมด: BaseModal, BaseAlert, BaseInput, FormField, BaseButton, BaseBadge, etc. — ทุกอย่างเขียน inline ในแต่ละ page

---

## 9. Data Model ที่ต่างกัน

### Transaction

| Field | Money Transfer | Bill Payment |
|---|---|---|
| **Transaction Type** | `transfer`, `withdrawal`, `owner_deposit` | `bill_payment`, `owner_deposit` |
| **Channel** | `bank`, `promptpay`, `other` + sub-fields | ไม่มี |
| **Bill Type** | ไม่มี | `utility`, `telecom`, `insurance`, `other` |
| **Commission** | `commission` + `commissionType` (cash/transfer) | `commission` เท่านั้น (เงินสดเสมอ) |
| **Transaction Status** | `completed`, `draft`, `on_hold`, `cancelled` | `success`, `failed` |
| **Balance Impact** | `balanceImpact` object (before/after for 4 balance types) | ไม่มี |
| **Verification Status** | `verificationStatus` (pending/verified/audited/approved) | ไม่มี |
| **Draft Reason** | `draftReason` | ไม่มี |
| **Status Note** | `statusNote` (เหตุผลเปลี่ยนสถานะ) | ไม่มี |
| **Customer Name** | ไม่มี (ใช้ accountName/promptpayAccountName) | `customerName` |

### Balance

| Field | Money Transfer | Bill Payment |
|---|---|---|
| **Balance Fields** | `bankAccount`, `transferCash`, `serviceFeeTransfer`, `serviceFeeCash` (4 ตัว) | `bankAccount`, `billPaymentCash`, `serviceFeeCash` (3 ตัว) |
| **History** | `history[]` (per-txn snapshots) | `history[]` (per-txn snapshots) |

### Daily Summary

| Field | Money Transfer | Bill Payment |
|---|---|---|
| **Step 1** | status, completedAt/By, totalTxns, completedTxns, draftTxns, totalAmount, totalCommission, finalBalances | completedAt/By/ByName, totalTxns, successTxns, failedTxns, totalAmount, totalCommission |
| **Step 2** | status, expectedCash, actualCash, differences, verificationNotes, hasDiscrepancies | completedAt/By/ByName, expected/actual Bill Payment Cash, expected/actual Service Fee Cash, hasDiscrepancies, verificationNotes |
| **Auditor** | status, txnsVerified, txnsWithIssues, bankStatementVerified, bankStatementAmount, **auditorCash**, auditNotes, auditResult, txnIssueStatus | auditedAt/By/ByName, bankStatementAmount, bankBalanceMatches, findings, txnsVerified, txnsWithIssues |
| **Owner** | status, decision, ownerNotes | approvedAt/By/ByName, approvalNotes |
| **Correction** | *(embedded in workflow)* | needsCorrectionFrom, correctionNotes, correctionRequestedAt/By |

---

## 10. ความแตกต่างตาม Role

### Manager/AM

| หัวข้อ | Money Transfer | Bill Payment |
|---|---|---|
| **Balance Setup** | ต้องตั้ง Opening Balance (Carryover/Manual) | ไม่ต้อง |
| **Recording UI** | Quick Actions + Favorites + Channel selection + Commission auto-calc | Simple form (type, billType, amount, commission, status) |
| **Draft System** | มี — insufficient balance creates draft | ไม่มี |
| **On Hold** | มี — พักรายการชั่วคราว | ไม่มี |
| **Step 1 Completion** | Checklist 4 ข้อ (balance, txn, no drafts, no on_hold) | เงื่อนไข 1 ข้อ (มี transaction) |
| **Cash Verification UI** | Table-based component, 3 rows (A+B+C) | Form-based inline, 2 rows (A+B) |
| **Auditor จะมานับซ้ำ** | ใช่ | ไม่ |

### Auditor

| หัวข้อ | Money Transfer | Bill Payment |
|---|---|---|
| **หน้าทำงาน** | หน้า Service เดียวกัน (section ซ่อน/แสดงตาม role) | หน้าแยก (auditor-review.vue) |
| **Balance Snapshot** | มี — 3 cards (Opening→Net Change→Closing) | ไม่มี |
| **นับเงินสดเอง** | **ใช่** — Auditor ใส่จำนวนเงินที่นับจริง (5-col table) | **ไม่** — ดูผล Manager อย่างเดียว |
| **ตรวจ Transaction** | Toggle "มีปัญหา" per row | Checkbox per transaction |
| **Bank Statement** | เทียบกับ Closing Balance ที่คาดหวัง | เทียบกับ actual cash total (Step 2) |
| **Decision Options** | 2 ทางเลือก (ผ่าน / ส่งคืน) | 3 ทางเลือก (ผ่าน / ผ่าน+หมายเหตุ / ส่งคืน) |
| **Correction Flow** | Owner → needs_correction → Manager | Auditor → needs_correction → Manager (clear Step 2) |

### Owner

| หัวข้อ | Money Transfer | Bill Payment |
|---|---|---|
| **หน้าทำงาน** | หน้า Service เดียวกัน (section ใน index.vue) | หน้าแยก (owner-approval.vue) |
| **Summary Display** | Collapsed read-only sections | 3 Expandable cards พร้อม summary stats |
| **Step 1 Summary** | สรุปสั้นๆ | Card พร้อม 3 ตัวเลข + expandable transaction table |
| **Audit Summary** | Audit result badge + bank statement + issue flags | Auditor name, datetime, Bank Statement, จำนวนตรวจ, ปัญหาที่พบ |
| **"ขอให้แก้ไข"** | ใช้ได้เสมอ (ไม่มีเงื่อนไข) | ใช้ได้เฉพาะเมื่อ `audited_with_issues` |
| **UI Design** | Form-based inline section | 3-column radio card selection (green/blue/red borders) |

---

## 11. สรุปความแตกต่างหลัก

| # | ประเด็น | รายละเอียด |
|---|---|---|
| 1 | **Architecture** | Money Transfer ใช้ **Single Page + 12 Dedicated Components**, Bill Payment ใช้ **Multi-Page + Inline Code** |
| 2 | **Complexity** | Money Transfer ซับซ้อนกว่ามาก (Draft, Favorites, Channels, Opening Balance, Status Changes, Filter/Pagination) |
| 3 | **Auditor Cash Count** | Money Transfer ให้ Auditor **นับเงินสดเอง**, Bill Payment ให้ Auditor **แค่ตรวจสอบ** ผลของ Manager |
| 4 | **Workflow States** | Bill Payment มี granular states มากกว่า (8 vs 6) ด้วย sub-status `_with_notes`/`_with_issues` |
| 5 | **Owner "ขอแก้ไข"** | Money Transfer ไม่มีเงื่อนไข, Bill Payment จำกัดเฉพาะเมื่อ Audit พบปัญหา |
| 6 | **Component Reuse** | Money Transfer มี 12 shared components ที่ reusable, Bill Payment เขียน inline ทุกอย่าง |
| 7 | **Balance Model** | Money Transfer track 4 balances, Bill Payment track 3 balances |
| 8 | **Navigation Pattern** | Money Transfer ทุก role ไปหน้าเดียว, Bill Payment แยก URL ตาม role |
| 9 | **Visual Feedback** | Money Transfer มี Workflow Progress Bar + Quick Glance Summary, Bill Payment ไม่มี |
| 10 | **Transaction Features** | Money Transfer มี Draft/On Hold/Favorites/Filters/Pagination, Bill Payment ไม่มี |
| 11 | **Correction Target** | Money Transfer: Owner ส่งกลับ → Auditor, Bill Payment: Auditor ส่งกลับ → Manager (clear Step 2) |

---

## 12. แผนปรับปรุง

> ✅ **ตัดสินใจแล้ว** — เลือกแนวทาง "ปรับทั้งสองฝั่งให้มาเจอกันตรงกลาง" โดยเลือกข้อดีจากแต่ละฝั่ง  
> 📄 **ดูแผนปรับปรุงฉบับเต็ม:** [`docs/PROGRESS/SERVICE_HARMONIZATION_PLAN.md`](SERVICE_HARMONIZATION_PLAN.md)
