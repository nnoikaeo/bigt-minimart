# 🔄 Business Workflows

## Overview
Complete business workflows for daily operations

**Four Main Flows:**
1. **Daily Cash Reconciliation Flow** - นับและตรวจสอบเงินรายวัน (Cashier → Manager → Auditor → Owner)
2. **Daily Income/Expense Recording Flow** - บันทึกรายรับ-รายจ่ายรายวัน (Manager → Auditor → Owner)
3. **Daily Money Transfer Service Income Flow** - นับและตรวจสอบเงินโอนจากบริการโอนเงิน (Manager → Auditor → Owner)
4. **Daily Bill Payment Service Income Flow** - นับและตรวจสอบเงินจากบริการรับชำระบิล (Manager → Auditor → Owner)

---

# 💰 FLOW 1: Daily Cash Reconciliation (นับและตรวจสอบเงินรายวัน)

## Workflow 1.1: ปิดกะขาย (Cashier - Close Shift)

### Process Flow
```
[Start] → Login to system
        ↓
     Go to "Close Shift" page
        ↓
     Count cash (bills/coins)
        ↓
     Count transfers:
     - QR Code (PromptPay)
     - Bank account
     - Government programs
        ↓
     Enter POSPOS total
        ↓
     Verify data
        ↓
     [Save] → Status: "draft"
        ↓
     Print POS Summary (ใบสรุปการขาย)
        ↓
     Put cash + receipt in bag
        ↓
     Hand cash bag + receipt to Manager/Assistant Manager
        ↓
     [Complete]
```

### Details
- **Role**: เจ้าหน้าที่แคชเชียร์ (Cashier)
- **Page**: Close Shift page (TBD)
- **Time Required**: ~5-10 minutes
- **Success Criteria**:
  - ✅ Easy data entry, no confusion
  - ✅ Automatic data verification
  - ✅ Clear total display
  - ✅ POS receipt printed
- **Data Recorded**:
  - Cash amount (by denomination)
  - Transfer amounts (by channel)
  - POSPOS total
  - Date, time, employee info
  - Receipt attached
- **Next Step**: Hand to Manager for verification

---

## Workflow 1.2: รับมอบและส่งต่อจาก Manager (Manager/Assistant - Receive & Handover)

### Process Flow
```
[Start] → Receive items from Cashier
        ↓
     Collect:
     - Cash bag (ถุงเงินสด)
     - POS receipt (ใบสรุปการขาย)
     - Cashier notes (หมายเหตุ ถ้ามี)
        ↓
     [Gather all items together]
        ↓
     Hand over to Auditor
     - All items together
     - For detailed audit
        ↓
     [Complete]
```

### Details
- **Role**: ผู้จัดการหรือผู้ช่วยผู้จัดการ (Manager/Assistant Manager)
- **Time Required**: ~1-2 minutes
- **Success Criteria**:
  - ✅ All items received from Cashier
  - ✅ All items gathered together
  - ✅ All items handed to Auditor
- **Items Collected**:
  - Cash bag (ถุงเงินสด)
  - POS receipt/printout (ใบสรุปการขายจาก POS)
  - Cashier notes/records (หมายเหตุจาก Cashier ถ้ามี)
- **Next Step**: Hand to Auditor for detailed audit (Workflow 1.3)

---

## Workflow 1.3: ตรวจสอบยอดขายรายวัน (Auditor - Audit & Record Daily Sales)

### Real-World Example

**Scenario**: Cashier closes shift with POS total of 20,000 บาท (cash 10,000 + QR 5,000 + Bank 3,000 + Government 2,000)

**Step 1: Count Actual Cash**
```
Auditor counts cash in bag by denomination:
- 1000 บาท bills: 8 pcs = 8,000 บาท
- 500 บาท bills: 2 pcs = 1,000 บาท
- 100 บาท bills: 0 pcs = 0 บาท
- Coins (10, 5, 2, 1 บาท): 800 บาท
Total actual cash: 9,800 บาท
(vs POS expected: 10,000 บาท)
⚠️ Difference: -200 บาท (short)
```

**Step 2: Verify Transfer Amounts**
```
1. QR Code (PromptPay):
   - Check Bank app → Shows 4,500 บาท
   - vs POS expected: 5,000 บาท
   ⚠️ QR short: -500 บาท

2. Bank Transfer:
   - Check Bank app → Shows 3,100 บาท
   - vs POS expected: 3,000 บาท
   ✓ Bank over: +100 บาท

3. Government Programs:
   - Check Government app → Shows 1,950 บาท
   - vs POS expected: 2,000 บาท
   ⚠️ Government short: -50 บาท
```

**Step 3: System Auto-calculates Discrepancy**
```
Actual Total: 9,800 + 4,500 + 3,100 + 1,950 = 19,350 บาท
Expected Total (POS): 20,000 บาท
Difference: 19,350 - 20,000 = -650 บาท (SHORT 650 บาท)

Status: ❌ DISCREPANCY FOUND
```

**Step 4: Auditor Analyzes Root Cause**
```
auditNotes: "Root cause analysis:
1. Cash short 200 บาท → Cashier confirmed loss (possible cashier error)
2. QR short 500 บาท → Likely customer didn't complete transfer, need follow-up
3. Bank over 100 บาท → May have separate transaction mixed in
4. Government short 50 บาท → Possible app sync delay

Total discrepancy: -650 บาท
Recommendation: Follow up on QR and Government transfers in next round"
```

**Step 5: Record in System**
```
/sales/daily-sales → New Record:
- date: 2026-01-29
- cashierId: cashier-001
- cashierName: สมชาย
- posposData:
  * cash: 9,800
  * qr: 4,500
  * bank: 3,100
  * government: 1,950
- cashReconciliation:
  * expectedAmount: 20,000
  * actualAmount: 19,350
  * difference: -650
  * notes: "Short 650 บาท"
- status: "submitted" (auto-set)
- submittedAt: 2026-01-29 16:45:00
- submittedBy: auditor-001
- auditNotes: "Root cause analysis..." (detailed)
```

---

### Process Flow
```
[Start] → Receive cash bag + receipt from Manager
        ↓
     COUNT ACTUAL CASH (เงินสดจริง):
     Count by denomination:
     - Bills: 1000, 500, 100, 50, 20 บาท
     - Coins: 10, 5, 2, 1 บาท
        ↓
     Compare with POS receipt:
     - POS total: 10,000 บาท
     - Actual count: 9,800 or 10,000 or 10,200 บาท
        ↓
     VERIFY TRANSFER AMOUNTS (เงินโอน 3 ช่องทาง):
     1. QR Code (PromptPay):
        - Check from: Bank app/statement
        - POS says: 5,000 บาท
        - Actual: 5,000 or 4,500 or ... บาท
        ↓
     2. Bank Transfer:
        - Check from: Bank statement
        - POS says: 3,000 บาท
        - Actual: 3,000 or 3,100 or ... บาท
        ↓
     3. Government Programs:
        - Check from: POS system / App
        - (e.g., Rabbit Card, etc.)
        - POS says: 2,000 บาท
        - Actual: 2,000 or 1,950 or ... บาท
        ↓
     [System calculates discrepancy automatically]:
     - Cash difference: actual vs expected
     - Transfer differences: by channel
     - Total difference: รวมทั้งหมด
        ↓
     If discrepancy found (เงินไม่ตรง):
     - Analyze root cause (สาเหตุ):
       * Cash short? → Where did it go?
       * Transfer difference? → Check with customer?
       * Why Bank more than expected?
     - Add detailed audit notes
        ↓
     RECORD DATA IN SYSTEM:
     - Go to /sales/daily-sales
     - Click "บันทึกใหม่"
     - Fill all amounts (actual amounts counted)
     - System auto-calculates differences
     - Add audit notes with root cause
     - Status = "submitted" (auto)
        ↓
     [Submit] → Data recorded in system
        ↓
     Send summary report to Owner:
     - Summary data
     - Discrepancies
     - Root cause analysis
        ↓
     [Complete]
```

### Details
- **Role**: ผู้ตรวจสอบ (Auditor)
- **Page**: /sales/daily-sales (Daily Sales Recording)
- **Time Required**: ~10-15 minutes
- **Success Criteria**:
  - ✅ Physical cash verified
  - ✅ Transfer amounts verified
  - ✅ Discrepancy calculated
  - ✅ Data recorded in system
  - ✅ Clear audit notes (if needed)
- **Data Recorded**:
  - Date: วันที่ปิดกะขาย (e.g., 2026-01-29)
  - Cashier: ชื่อแคชเชียร์ (e.g., สมชาย)
  - **posposData** (ยอดจริงที่นับได้):
    - cash: เงินสดจริง (e.g., 9,800 or 10,000 บาท)
    - qr: ยอด QR จริง (e.g., 4,500 or 5,000 บาท)
    - bank: ยอด Bank จริง (e.g., 3,100 or 3,000 บาท)
    - government: ยอด Government จริง (e.g., 1,950 or 2,000 บาท)
  - **cashReconciliation** (ระบบคำนวณอัตโนมัติ):
    - expectedAmount: POS total (e.g., 20,000 บาท)
    - actualAmount: รวมจริงที่นับได้ (e.g., 19,350 บาท)
    - difference: ผลต่าง (e.g., -650 บาท ขาด)
    - notes: สรุปสั้นๆ (e.g., "ขาดเงิน 650 บาท")
  - **status**: "submitted" (ระบบตั้งอัตโนมัติ)
  - **submittedAt**: timestamp ปัจจุบัน
  - **submittedBy**: Auditor ID (ผู้ที่บันทึก)
  - **auditNotes**: สาเหตุของปัญหาโดยละเอียด
    - Example: "เงินสดขาด 200 บาท (Cashier ยืนยัน) + QR ขาด 500 บาท (อาจลูกค้าส่งไม่ถึง) + Bank เกิน 100 บาท (มีรายการแยก) = รวมขาด 650 บาท ต้องตรวจสอบเพิ่มเติมในรอบถัดไป"
- **Next Step**: Owner review and approve

---

## Workflow 1.4: อนุมัติรายงานการตรวจสอบเงิน (Owner - Approve Daily Sales)

### Process Flow
```
[Start] → Review Auditor's report
        ↓
     Check /sales/daily-sales → "submitted" entries
        ↓
     Read audit details:
     - Cash amounts
     - Discrepancies
     - Audit notes (if any)
        ↓
     Verify everything is correct?
        ↓
     Click [✏️ Edit]
        ↓
     Change status: submitted → "approved"
        ↓
     Click [อัปเดต]
        ↓
     [Complete] → Status = "approved"
        ↓
     Daily sales recorded in system ✓
```

### Details
- **Role**: เจ้าของร้าน (Owner)
- **Page**: /sales/daily-sales (Daily Sales Review)
- **Time Required**: ~5 minutes per entry
- **Success Criteria**:
  - ✅ All data reviewed
  - ✅ Approved or rejected with notes
  - ✅ Clear decision documented
- **Data Updated**:
  - status: "approved"
  - approvedAt: timestamp
  - approvedBy: Owner ID
- **Result**: ✅ Daily cash reconciliation complete

---

# � FLOW 2: Daily Money Transfer Service Income (นับและตรวจสอบเงินจากบริการโอนเงิน)

## 🗂️ Workflow Structure Overview

```
┌─────────────────────────────────────────────────────────────────┐
│ WORKFLOW 2.0: Money Transfer History Page (Entry Point)        │
│   ├─ ทุก Role เข้ามาที่หน้านี้ก่อนเสมอ                          │
│   ├─ Pending Inbox: แต่ละ Role เห็น pending count ของตน        │
│   └─ Smart Navigation: ปุ่ม Action นำไปยัง WF step ที่ถูกต้อง │
├─────────────────────────────────────────────────────────────────┤
│ WORKFLOW 2.1: Manager/Assistant Manager บันทึก & ตรวจสอบ      │
│                                                                 │
│ Step 1: Record Transfer & Withdrawal Transactions              │
│   ├─ Manager/AM บันทึกรายการโอน/ถอนเงิน throughout the day     │
│   ├─ System auto-calculates all 4 balance accounts             │
│   └─ ไม่ต้องมีการบันทึกเพิ่มเติมแล้ว                             │
│                                                                 │
│ Step 2: Verify Recorded Transactions & Count Actual Cash       │
│   ├─ Manager/AM นับเงินสดจริง ณ วันท้ายวัน                      │
│   ├─ System แสดง expected amounts จาก Step 1                   │
│   ├─ Manager/AM verify match or note discrepancies             │
│   └─ ยืนยันข้อมูล (ไม่ใช่บันทึกใหม่)                           │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ WORKFLOW 2.2: Auditor ตรวจสอบเงินจากบริการโอนเงิน              │
│   └─ มาจาก History Page (คลิก "ตรวจสอบ" บนแถว step2_completed) │
│   └─ Cross-check กับ bank statement                            │
│   └─ Verify all transactions & amounts                         │
│                                                                 │
│ WORKFLOW 2.3: Owner อนุมัติการตรวจสอบ                          │
│   └─ มาจาก History Page (คลิก "อนุมัติ" บนแถว audited)         │
│   └─ Final approval ของ Manager & Auditor records              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Workflow 2.0: หน้าประวัติบริการโอนเงิน (History Page — Entry Point)

**บริบท**: ทุก Role เข้าสู่ระบบผ่านหน้านี้ก่อนเสมอ ทำหน้าที่เป็น "Pending Inbox" ที่แสดงรายการทุกวันพร้อม Smart Navigation พาแต่ละ Role ไปยัง WF step ที่ถูกต้องโดยอัตโนมัติ

### Process Flow
```
[User เข้าเมนู "บริการโอนเงิน"]
        ↓
[Landing: /finance/money-transfer-history]
        ↓
เห็น list รายการทุกวัน (เรียงล่าสุดก่อน)
+ Summary Cards: pending count แต่ละ Role
        ↓
┌─ Manager/Assistant Manager ─────────────────────────────┐
│ คลิก [เพิ่มรายการ] → date picker                        │
│   ↓ เลือกวันที่ (วันนี้หรือย้อนหลัง)                     │
│   ↓ navigate to /finance/money-transfer-service?date=    │
│                                                          │
│ คลิก [ทำงาน] (step1_in_progress) → WF 2.1              │
│ คลิก [แก้ไข] (needs_correction)  → WF 2.1              │
│ คลิก [ดูรายละเอียด] (อื่นๆ)      → index.vue read-only  │
└──────────────────────────────────────────────────────────┘
        ↓
┌─ Auditor ───────────────────────────────────────────────┐
│ คลิก [ตรวจสอบ] (step2_completed) → WF 2.2              │
│ คลิก [ดูรายละเอียด] (step1_*)    → index.vue read-only  │
└──────────────────────────────────────────────────────────┘
        ↓
┌─ Owner ─────────────────────────────────────────────────┐
│ คลิก [อนุมัติ] (audited)         → WF 2.3              │
│ คลิก [ดูรายละเอียด] (step1_*/step2_*) → index.vue read-only│
└──────────────────────────────────────────────────────────┘
```

### Details
- **Role**: ทุก Role — owner, manager, assistant_manager, auditor
- **Page**: `/finance/money-transfer-history`
- **Sidebar route**: เมนู "บริการโอนเงิน" ชี้มาที่หน้านี้แทน
- **Pending Inbox (Summary Cards)**:
  - Manager/AM: นับ `step1_in_progress` + `needs_correction`
  - Auditor: นับ `step2_completed`
  - Owner: นับ `audited`
- **Smart Action Button** — label + destination เปลี่ยนตาม Role × workflowStatus:

  | Role | workflowStatus | ปุ่ม | ปลายทาง |
  |------|----------------|------|---------|
  | manager/AM | step1_in_progress | "ทำงาน" | `money-transfer-service?date=` |
  | manager/AM | needs_correction | "แก้ไข" | `money-transfer-service?date=` |
  | manager/AM | step2_completed/audited/approved | "ดูรายละเอียด" | `money-transfer-service?date=` |
  | auditor | step2_completed | "ตรวจสอบ" | `auditor-review?date=` |
  | auditor | audited | "ดูการตรวจสอบ" | `auditor-review?date=` |
  | auditor | step1_* | "ดูรายละเอียด" | `money-transfer-service?date=` |
  | owner | audited | "อนุมัติ" | `owner-approval?date=` |
  | owner | approved | "ดูรายละเอียด" | `owner-approval?date=` |
  | owner | step1_*/step2_* | "ดูรายละเอียด" | `money-transfer-service?date=` |

- **ปุ่ม "เพิ่มรายการ"**: กั้นด้วย `EDIT_FINANCE` permission → manager, assistant_manager, owner เห็นเท่านั้น
- **Backdated Entry**: ปุ่ม "เพิ่มรายการ" ให้เลือกวันที่ได้อิสระ รวมถึงวันในอดีต (กรณีระบบมีปัญหา ให้บันทึกลงกระดาษแล้วนำมาบันทึกระบบภายหลัง)
- **Back Navigation**: ทุก WF page (2.1, 2.2, 2.3) มีปุ่ม "← ประวัติ" กลับมาที่หน้านี้

---

## Workflow 2.1: บันทึก & ตรวจสอบเงินจากบริการโอนเงิน (Manager - Record Transfer & Verification)

### Real-World Example

**Scenario**: Manager/Assistant Manager records daily money transfer service transactions in app (replacing paper-based records)

**Step 1: Record Transfer & Withdrawal Transactions (Manager/Assistant Manager บันทึกรายการโอน/ถอนเงิน)**

**บริบท**: ก่อนหน้านี้บันทึกลงกระดาษ ตอนนี้จะบันทึกผ่านแอพเพื่อให้ระบบคำนวณ balance อัตโนมัติ

```
Manager/Assistant Manager บันทึกใน /finance/money-transfer-service:

DATE: 2026-01-29

INITIAL BALANCES (วันเริ่มต้น):
1) เงินในบัญชี (Bank Account Balance): 10,000 บาท
2) เงินสดจากการโอนเงิน/ถอนเงิน (Cash from Transfer/Withdrawal): 0 บาท
3) เงินสดค่าบริการโอนเงิน/ถอนเงิน (Service Fee Cash): 0 บาท
4) เงินโอนค่าบริการถอนเงิน (Service Fee Transfer): 0 บาท

═════════════════════════════════════════════════════════════
Manager/Assistant Manager บันทึกลงแอพ (ระบบคำนวณ Balance อัตโนมัติ)
═════════════════════════════════════════════════════════════

MANAGER RECORDED TRANSACTION RECORDS (รายการที่ Manager บันทึก):

Transaction 1: PromptPay Transfer from Customer A
   📝 Manager บันทึก:
   - Date: 2026-01-29 10:30 AM
   - Type: PromptPay Transfer (เงินเข้าจากโอนผ่าน PromptPay)
   - Amount: 2,000 บาท
   - Commission: 20 บาท (paid in cash)

   🤖 System auto-calculates Balance Changes:
     1) Bank Account: 10,000 - 2,000 = 8,000 บาท (transfer out)
     2) Cash from Transfers: 0 + 2,000 = 2,000 บาท (cash in)
     3) Service Fee Cash: 0 + 20 = 20 บาท (service fee cash)
     4) Service Fee Transfer: 0 บาท (no change)

Transaction 2: Cash Withdrawal from Customer B
   📝 Manager บันทึก:
   - Date: 2026-01-29 01:15 PM
   - Type: Cash Withdrawal (ลูกค้าถอนเงิน)
   - Amount: 500 บาท (customer withdraws)
   - Commission: 10 บาท (paid in cash)

   🤖 System auto-calculates Balance Changes:
     1) Bank Account: 8,000 + 500 = 8,500 บาท (withdrawal = deposit)
     2) Cash from Transfers: 2,000 - 500 = 1,500 บาท (cash out)
     3) Service Fee Cash: 20 + 10 = 30 บาท (service fee cash)
     4) Service Fee Transfer: 0 บาท (no change)

Transaction 3: Bank Transfer from Customer C (FAILED)
   📝 Manager บันทึก:
   - Date: 2026-01-29 02:00 PM
   - Type: Bank Transfer (โอนผ่านธนาคาร)
   - Amount: 8,800 บาท (requested)
   - Status: ❌ FAILED - Insufficient funds in account (8,500 < 8,800)
   - Notes: Transaction was rejected

   🤖 System auto-calculates Balance Changes:
     ✗ No balance changes (transaction rejected)
     1) Bank Account: 8,500 บาท (no change)
     2) Cash from Transfers: 1,500 บาท (no change)
     3) Service Fee Cash: 30 บาท (no change)
     4) Service Fee Transfer: 0 บาท (no change)

Transaction 4: Owner Deposit (เจ้าของร้านฝากเงิน)
   📝 Manager บันทึก:
   - Date: 2026-01-29 02:30 PM
   - Type: Owner Deposit (เจ้าของฝากเงิน)
   - Amount: 10,000 บาท (Owner deposits to business account)
   - Commission: 0 บาท (no fee for owner deposit)

   🤖 System auto-calculates Balance Changes:
     1) Bank Account: 8,500 + 10,000 = 18,500 บาท (deposit in)
     2) Cash from Transfers: 1,500 บาท (no change)
     3) Service Fee Cash: 30 บาท (no change)
     4) Service Fee Transfer: 0 บาท (no change)

Transaction 5: Bank Transfer from Customer C (RETRY - SUCCESS)
   📝 Manager บันทึก:
   - Date: 2026-01-29 02:45 PM
   - Type: Bank Transfer (โอนผ่านธนาคาร)
   - Amount: 8,800 บาท (retry succeeds)
   - Commission: 40 บาท (paid in cash)
   - Status: ✅ SUCCESS

   🤖 System auto-calculates Balance Changes:
     1) Bank Account: 18,500 - 8,800 = 9,700 บาท (transfer out)
     2) Cash from Transfers: 1,500 + 8,800 = 10,300 บาท (cash in)
     3) Service Fee Cash: 30 + 40 = 70 บาท (service fee cash)
     4) Service Fee Transfer: 0 บาท (no change)

Transaction 6: Cash Withdrawal from Customer D
   📝 Manager บันทึก:
   - Date: 2026-01-29 03:30 PM
   - Type: Cash Withdrawal (ลูกค้าถอนเงิน)
   - Amount: 500 บาท (customer withdraws)
   - Commission: 10 บาท (paid via transfer)

   🤖 System auto-calculates Balance Changes:
     1) Bank Account: 9,700 + 500 + 10 = 10,210 บาท (withdrawal + commission transfer)
     2) Cash from Transfers: 10,300 - 500 = 9,800 บาท (cash out)
     3) Service Fee Cash: 70 บาท (no change)
     4) Service Fee Transfer: 0 + 10 = 10 บาท (service fee transfer)

═════════════════════════════════════════════════════════════
🤖 SYSTEM AUTO-CALCULATED FINAL BALANCES (after all transactions)
═════════════════════════════════════════════════════════════

FINAL BALANCES SUMMARY:
1) เงินในบัญชี (Bank Account): 10,210 บาท
   - In: 500 + 10,000 + 510 = 11,010 บาท (withdrawals + owner deposit + commission transfer)
   - Out: 2,000 + 8,800 = 10,800 บาท (transfers)
   - Calc: 10,000 + 11,010 - 10,800 = 10,210 บาท ✓

2) เงินสดจากการโอนเงิน/ถอนเงิน (Cash from Transfers/Withdrawals): 9,800 บาท
   - In: 2,000 + 8,800 = 10,800 บาท (transfers in)
   - Out: 500 + 500 = 1,000 บาท (withdrawals out)
   - Calc: 0 + 10,800 - 1,000 = 9,800 บาท ✓

3) เงินสดค่าบริการ (Service Fee Cash): 70 บาท
   - In: 20 + 10 + 40 = 70 บาท (all cash commission transactions)
   - Calc: 0 + 70 = 70 บาท ✓

4) เงินโอนค่าบริการ (Service Fee Transfer): 10 บาท
   - In: 10 บาท (transaction 6 commission)
   - Calc: 0 + 10 = 10 บาท ✓

TOTAL TRANSACTIONS: 6 (5 successful, 1 failed)
TOTAL CASH COUNTED: 9,800 + 70 = 9,870 บาท (cash summary)
TOTAL SERVICE FEES: 70 + 10 = 80 บาท (all commissions)
TOTAL BANK BALANCE: 10,210 บาท
```

---

### Process Flow - Step 1: Record Transfer & Withdrawal Transactions
```
[มาจาก History Page (WF 2.0)]
        ↓
[คลิก "เพิ่มรายการ" → เลือกวันที่ หรือ คลิก "ทำงาน"/"แก้ไข" บน existing row]
        ↓
navigate to /finance/money-transfer-service?date=YYYY-MM-DD
        ↓
[ถ้า date เป็นวันในอดีต: แสดง warning banner "⚠️ กำลังบันทึกย้อนหลัง: วันที่ DD/MM/YYYY"]
        ↓
[Throughout the day - each transfer/withdrawal happens]
        ↓
Manager/Assistant Manager บันทึกลงแอพ:
     คลิก "รายการใหม่" หรือ Quick Action บนหน้า
        ↓
     Fill in transaction details:
     - Date & Time of transaction
     - Type: โอนเงิน (Transfer) / ถอนเงิน (Withdrawal)
     - Channel: PromptPay / Bank / Government Program
     - Amount: เงินที่โอนหรือถอน
     - Commission: ค่าบริการ (if any)
     - Commission method: Cash / Transfer
     - Customer name (optional, for reference)
        ↓
     [Save] → System auto-calculates all balance changes
        ↓
     ✅ Transaction recorded
     ✅ All 4 balances updated automatically:
        1) Bank Account Balance
        2) Cash from Transfers/Withdrawals
        3) Service Fee Cash
        4) Service Fee Transfer
        ↓
[End of day - proceed to Step 2]
```

### Details - Step 1
- **Role**: ผู้จัดการหรือผู้ช่วยผู้จัดการ (Manager/Assistant Manager)
- **Entry**: มาจาก History Page (WF 2.0) → คลิก "เพิ่มรายการ" หรือ "ทำงาน"
- **Page**: `/finance/money-transfer-service?date=YYYY-MM-DD`
- **Note**: ถ้า date เป็นวันในอดีต → แสดง warning banner (Backdated Entry)
- **Timing**: Throughout the day, as each transaction occurs
- **Time Required**: ~2-3 minutes per transaction
- **Success Criteria**:
  - ✅ Each transaction recorded immediately
  - ✅ All details filled correctly
  - ✅ System calculates balances automatically
  - ✅ No manual balance calculations needed
- **Data Recorded Per Transaction**:
  - transactionType: "transfer" or "withdrawal"
  - channel: "promptpay" / "bank" / "government"
  - amount: เงินที่โอนหรือถอน
  - commission: ค่าบริการ
  - commissionMethod: "cash" or "transfer"
  - timestamp: เวลาที่บันทึก
  - recordedBy: Manager/Assistant Manager ID
- **Auto-calculated by System**:
  - bankAccountBalance: updated
  - transferWithdrawalCash: updated
  - serviceFeeCash: updated
  - serviceFeeTransfer: updated
- **Next Step**: Step 2 (Count actual cash at end of day)

---

**Step 2: Verify Recorded Transactions & Count Actual Cash (ตรวจสอบรายการบันทึก และนับเงินสดจริง)**

**บริบท**: Manager ตรวจสอบว่าการบันทึก Step 1 ตรงกับเงินสดจริงหรือไม่

```
═════════════════════════════════════════════════════════════
SYSTEM DATA FROM STEP 1 (ระบบสะสมจากการบันทึก)
═════════════════════════════════════════════════════════════

EXPECTED BALANCES (from Step 1 recorded transactions):
1) Bank Account Balance: 10,210 บาท
2) Cash from Transfers/Withdrawals: 9,800 บาท
3) Service Fee Cash: 70 บาท
4) Service Fee Transfer: 10 บาท

TOTAL TRANSACTIONS RECORDED: 6 (5 successful, 1 failed)
EXPECTED TOTAL CASH ON HAND: 9,800 + 70 = 9,870 บาท

═════════════════════════════════════════════════════════════
MANAGER VERIFICATION (ผู้จัดการตรวจสอบเงินสดจริง)
═════════════════════════════════════════════════════════════

A. PHYSICAL CASH COUNT (นับเงินสดจริง):

   Cash from Transfers/Withdrawals Section:
   📝 Manager counts: 9,800 บาท
   📊 System expected: 9,800 บาท
   ✅ MATCH: 0 บาท discrepancy

   Service Fee Cash Section:
   📝 Manager counts: 70 บาท
   📊 System expected: 70 บาท
   ✅ MATCH: 0 บาท discrepancy

   TOTAL CASH COUNTED: 9,800 + 70 = 9,870 บาท
   TOTAL EXPECTED: 9,870 บาท
   ✅ MATCH: Cash count accurate

B. VERIFICATION NOTES:
   ✅ All 6 transactions from Step 1 verified
   ✅ Cash count matches system records
   ✅ No discrepancies found

   managerVerificationNotes: "All transactions recorded in Step 1 verified. Cash count matches system expected amounts. Ready for Auditor review."

═════════════════════════════════════════════════════════════
STEP 2 CONFIRMATION (ยืนยันข้อมูล)
═════════════════════════════════════════════════════════════

Status: "verified" (auto-set after manager confirms)
verifiedAt: 2026-01-29 17:00:00
verifiedBy: manager-001

✅ Step 1 records confirmed
✅ Physical cash verified
✅ All balances accurate
✅ Ready for Auditor approval (Workflow 2.2)
```

---

### Process Flow - Step 2: Verify & Count Actual Cash
```
[End of Day - Manager performs Step 2]
        ↓
[Go to /finance/money-transfer-service → View "pending verification"]
        ↓
Review System Data from Step 1:
     - System shows all recorded transactions
     - System shows expected balances
     - System shows expected cash amounts
        ↓
     PHYSICAL CASH VERIFICATION:
     Manager counts actual cash:
        ↓
     1. Count Cash from Transfers/Withdrawals:
        - Count all cash received from customers' transfers
        - Count all cash paid out for withdrawals
        - Compare with system expected amount
        - Note any discrepancies
        ↓
     2. Count Service Fee Cash:
        - Count all commission received in cash
        - Compare with system expected amount
        - Note any discrepancies
        ↓
     RECONCILIATION CHECK:
     Actual Cash Count vs System Expected:
        - Transfer/Withdrawal Cash: Actual ↔ System Expected
        - Service Fee Cash: Actual ↔ System Expected
        - Total Cash: Actual ↔ System Expected
        ↓
     [Status]
        ├─ If MATCH ✅: [Confirm Verification]
        │   ↓
        │   Click [ยืนยันข้อมูล]
        │   → Status = "verified"
        │   → verifiedBy: Manager
        │   → verifiedAt: timestamp
        │
        └─ If DISCREPANCY ⚠️: [Add Verification Notes]
            ↓
            Fill in discrepancy details:
            - Amount difference
            - Possible cause
            - Follow-up action
            ↓
            Click [ยืนยันพร้อมหมายเหตุ]
            → Status = "verified_with_notes"
            → verificationNotes: detailed notes
        ↓
     [Complete] → Ready for Auditor (Workflow 2.2)
     → กลับ History Page (/finance/money-transfer-history) อัตโนมัติ
```

### Details - Step 2
- **Role**: ผู้จัดการหรือผู้ช่วยผู้จัดการ (Manager/Assistant Manager)
- **Page**: `/finance/money-transfer-service?date=YYYY-MM-DD` (same page, Step 2 section)
- **Timing**: End of day, after all transactions in Step 1 are recorded
- **Time Required**: ~5-10 minutes
- **Success Criteria**:
  - ✅ All Step 1 transactions reviewed
  - ✅ Physical cash counted
  - ✅ Cash amount compared with system expected
  - ✅ Verification completed (match or discrepancies noted)
  - ✅ Data marked as "verified"
- **Data Verified (NOT Recorded - Already in Step 1)**:
  - Compare System Expected vs Actual Count:
    - transferWithdrawalCash: expected vs actual
    - serviceFeeCash: expected vs actual
    - bankAccountBalance: expected vs actual
    - serviceFeeTransfer: expected vs actual
- **Verification Outcome**:
  - **If Match**: ✅ Status = "verified"
  - **If Discrepancy**: ⚠️ Status = "verified_with_notes"
    - discrepancyAmount: difference found
    - discrepancyReason: possible cause
    - verificationNotes: detailed explanation
- **Data Fields Updated**:
  - status: "verified" or "verified_with_notes"
  - verifiedAt: timestamp
  - verifiedBy: Manager ID
  - verificationNotes: (if needed)
- **Next Step**: Auditor final review & approval (Workflow 2.2) — Auditor เห็น row ที่ `step2_completed` ใน History Page แล้วคลิก "ตรวจสอบ"

---

## Workflow 2.2: ตรวจสอบเงินจากบริการโอนเงิน (Auditor - Verify Money Transfer Service Income)

**บริบท**: Auditor ตรวจสอบข้อมูลจาก Step 1 & Step 2 ของ Manager โดยเทียบกับ bank statement และสูตรคำนวณ

### Real-World Example

**Scenario**: Auditor reviews Manager's Step 1 records & Step 2 verification against bank statement

```
═════════════════════════════════════════════════════════════
INPUT FROM MANAGER (Step 1 & Step 2)
═════════════════════════════════════════════════════════════

STATUS: "verified" (from Manager's Step 2)

MANAGER'S RECORDED TRANSACTIONS (Step 1):
✓ 6 total transactions recorded
  - 5 successful transactions
  - 1 failed transaction

MANAGER'S VERIFICATION (Step 2):
✓ Physical cash count matches system expected
  - Transfer/Withdrawal Cash: 9,800 บาท ✓
  - Service Fee Cash: 70 บาท ✓
  - Total: 9,870 บาท ✓

═════════════════════════════════════════════════════════════
AUDITOR VERIFICATION (Cross-check with Bank Statement)
═════════════════════════════════════════════════════════════

STEP 1: Verify All Transaction Records
  ✓ Transaction 1: PromptPay Transfer 2,000 บาท + commission 20 บาท
    - Bank statement: -2,000 บาท ✓ Match

  ✓ Transaction 2: Cash Withdrawal 500 บาท + commission 10 บาท
    - Bank statement: +500 บาท ✓ Match

  ✓ Transaction 3: Bank Transfer 8,800 บาท (FAILED)
    - Bank statement: No change ✓ Match

  ✓ Transaction 4: Owner Deposit 10,000 บาท
    - Bank statement: +10,000 บาท ✓ Match

  ✓ Transaction 5: Bank Transfer 8,800 บาท (SUCCESS) + commission 40 บาท
    - Bank statement: -8,800 บาท ✓ Match

  ✓ Transaction 6: Cash Withdrawal 500 บาท + commission 10 บาท (transfer)
    - Bank statement: +500, +10 (commission) ✓ Match

STEP 2: Verify Cash Count Results
  ✓ Manager's Step 2 verification: All amounts match system expected
  ✓ No discrepancies noted
  ✓ Ready for approval

STEP 3: Cross-check Bank Statement Summary
  Expected (from Step 1): Bank Account = 10,210 บาท
  Bank Statement shows: Bank Account = 10,210 บาท
  ✅ MATCH - All transactions verified

═════════════════════════════════════════════════════════════
AUDITOR VERIFICATION RESULT
═════════════════════════════════════════════════════════════

✅ All Step 1 transactions verified against bank statement
✅ All Step 2 cash count verified
✅ No discrepancies or missing transactions
✅ Balance matches expected amount

auditNotes: "All 6 transactions from Manager's Step 1 verified against bank statement. Manager's Step 2 cash verification confirmed. Bank balance 10,210 บาท matches expected. No issues found. Ready for Owner approval."

status: "audited" (updated by Auditor)
auditedAt: 2026-01-29 17:30:00
auditedBy: auditor-001
```

### Process Flow - Step 2 Verification
```
[Auditor เข้า History Page → เห็น row ที่ workflowStatus = "step2_completed"]
        ↓
คลิก [ตรวจสอบ] → navigate to /finance/money-transfer-service/auditor-review?date=YYYY-MM-DD
        ↓
     VERIFY MANAGER'S STEP 1 RECORDS:
     - Review all recorded transactions (6 total)
     - Check transaction types, amounts, dates
     - Verify commission amounts & methods
        ↓
     VERIFY AGAINST BANK STATEMENT:
     1. Cross-check each transaction:
        - PromptPay Transfer: -2,000 บาท ✓
        - Cash Withdrawal: +500 บาท ✓
        - Bank Transfer FAILED: No change ✓
        - Owner Deposit: +10,000 บาท ✓
        - Bank Transfer SUCCESS: -8,800 บาท ✓
        - Cash Withdrawal: +500 บาท ✓
        ↓
     2. Verify final balance:
        - System expected: 10,210 บาท
        - Bank statement: 10,210 บาท
        - Match? ✅ YES
        ↓
     VERIFY MANAGER'S STEP 2 RESULTS:
     - Physical cash verification: All amounts match ✓
     - No discrepancies noted ✓
     - Cash count accurate ✓
        ↓
     [Status]
        ├─ If ALL CORRECT ✅: [Confirm Audit]
        │   ↓
        │   Add verification notes
        │   Click [ยืนยันการตรวจสอบ]
        │   → Status = "audited"
        │   → auditedBy: Auditor
        │   → auditedAt: timestamp
        │
        └─ If DISCREPANCY ⚠️: [Add Audit Notes]
            ↓
            Fill in discrepancy details:
            - Which transaction is wrong?
            - What's the actual amount?
            - What should be corrected?
            ↓
            Click [ยืนยันพร้อมหมายเหตุ]
            → Status = "audited_with_issues"
            → auditNotes: detailed issues
            → Flag for Manager to fix Step 1/2
        ↓
     [Complete] → Ready for Owner approval (Workflow 2.3)
```

### Details - Step 2 Auditor Verification
- **Role**: ผู้ตรวจสอบ (Auditor)
- **Entry**: มาจาก History Page (WF 2.0) → คลิก "ตรวจสอบ" บน row ที่ `step2_completed`
- **Page**: `/finance/money-transfer-service/auditor-review?date=YYYY-MM-DD`
- **Back Navigation**: ปุ่ม "← ประวัติ" กลับ History Page
- **Timing**: After Manager completes Step 1 & 2 (Status: "step2_completed")
- **Time Required**: ~10-15 minutes
- **Success Criteria**:
  - ✅ All Step 1 transactions verified with bank statement
  - ✅ All Step 2 cash verification confirmed
  - ✅ Bank balance matches expected amount
  - ✅ No missing or duplicate transactions
  - ✅ Clear audit notes (if needed)
- **Data Verified**:
  - **Step 1 Records**:
    - Each transaction type, amount, commission
    - Transaction status (success/failed)
    - Balance changes correctness
  - **Step 2 Results**:
    - Cash count accuracy
    - Discrepancies (if any)
    - Verification status
  - **Bank Statement Match**:
    - Each transaction against bank records
    - Final balance accuracy
    - No missing transactions
- **Audit Outcome**:
  - **If OK**: ✅ Status = "audited"
  - **If Issues**: ⚠️ Status = "audited_with_issues"
    - auditNotes: detailed explanation
    - Identify which Step 1 or Step 2 needs fixing
- **Data Fields Updated**:
  - status: "audited" or "audited_with_issues"
  - auditedAt: timestamp
  - auditedBy: Auditor ID
  - auditNotes: verification details
- **Next Step**: Owner final approval (Workflow 2.3) — Owner เห็น row ที่ `audited` ใน History Page แล้วคลิก "อนุมัติ"

---

## Workflow 2.3: อนุมัติการตรวจสอบเงินจากบริการโอนเงิน (Owner - Approve Money Transfer Service Income)

**บริบท**: Owner อนุมัติข้อมูลที่ Auditor ได้ตรวจสอบแล้ว (Step 1, Step 2, และ Audit)

### Process Flow
```
[Owner เข้า History Page → เห็น row ที่ workflowStatus = "audited"]
        ↓
คลิก [อนุมัติ] → navigate to /finance/money-transfer-service/owner-approval?date=YYYY-MM-DD
        ↓
     REVIEW ALL RECORDS:

     Step 1: Manager's Recorded Transactions
     - All 6 transactions (types, amounts, commissions)
     - Balance changes calculation

     Step 2: Manager's Verification
     - Physical cash count results
     - Any discrepancies noted

     Step 3 (Workflow 2.2): Auditor's Verification
     - Bank statement cross-check
     - Transaction verification
     - Audit notes
        ↓
     [Status Check]
        ├─ If "audited" (No Issues) ✅:
        │   ↓
        │   Everything OK - Ready to approve
        │   ↓
        │   Click [อนุมัติ]
        │   → Status = "approved"
        │   → approvedAt: timestamp
        │   → approvedBy: Owner ID
        │   ↓
        │   [Complete] ✅
        │
        └─ If "audited_with_issues" ⚠️:
            ↓
            Review Auditor's notes about issues
            ↓
            [Decision]
            ├─ Approve anyway:
            │   → Click [อนุมัติแม้มีปัญหา]
            │   → Status = "approved_with_notes"
            │   → approvalNotes: "Approved despite issues: ..."
            │
            └─ Request correction:
                → Click [ส่งกลับให้ Manager ปรับแก้]
                → Status = "needs_correction"
                → Notes: specific issues to fix
                → Manager revises Step 1/2
        ↓
     [Complete]
        ↓
     Money transfer service income recorded ✓
```

### Details - Owner Final Approval
- **Role**: เจ้าของร้าน (Owner)
- **Entry**: มาจาก History Page (WF 2.0) → คลิก "อนุมัติ" บน row ที่ `audited`
- **Page**: `/finance/money-transfer-service/owner-approval?date=YYYY-MM-DD`
- **Back Navigation**: ปุ่ม "← ประวัติ" กลับ History Page
- **Timing**: After Auditor completes verification (Status: "audited")
- **Time Required**: ~5-10 minutes
- **Success Criteria**:
  - ✅ All records reviewed (Step 1, Step 2, Audit)
  - ✅ Final approval decision made
  - ✅ Clear documentation of approval status
- **Data Reviewed**:
  - **Step 1 Records**: All 6 transactions with amounts and commissions
  - **Step 2 Results**: Manager's cash verification (match or discrepancies)
  - **Audit Notes**: Auditor's verification against bank statement
  - **Status**: "audited" ✅ or "audited_with_issues" ⚠️
- **Approval Decision**:
  - **If "audited"** (No issues): ✅ Approve directly
    - status: "approved"
  - **If "audited_with_issues"**: Owner decides:
    - **Approve anyway**: status = "approved_with_notes"
    - **Request correction**: status = "needs_correction"
- **Data Fields Updated**:
  - status: "approved" / "approved_with_notes" / "needs_correction"
  - approvedAt: timestamp
  - approvedBy: Owner ID
  - approvalNotes: (if needed)
- **Result**: ✅ Money transfer service income finalized
  - Ready for accounting/financial reporting

---

# 💰 FLOW 3: Daily Bill Payment Service Income (นับและตรวจสอบเงินจากบริการรับชำระบิล)

## 🗂️ Workflow Structure Overview

```
┌─────────────────────────────────────────────────────────────────┐
│ WORKFLOW 3.0: Bill Payment History Page (Entry Point)          │
│   ├─ ทุก Role เข้ามาที่หน้านี้ก่อนเสมอ                          │
│   ├─ Pending Inbox: แต่ละ Role เห็น pending count ของตน        │
│   └─ Smart Navigation: ปุ่ม Action นำไปยัง WF step ที่ถูกต้อง │
├─────────────────────────────────────────────────────────────────┤
│ WORKFLOW 3.1: Manager/Assistant Manager บันทึก & ตรวจสอบ      │
│                                                                 │
│ Step 1: Record Bill Payment Transactions                       │
│   ├─ Manager/AM บันทึกรายการรับชำระบิล throughout the day      │
│   ├─ System auto-calculates all 3 balance accounts             │
│   └─ ไม่ต้องมีการบันทึกเพิ่มเติมแล้ว                             │
│                                                                 │
│ Step 2: Verify Recorded Transactions & Count Actual Cash       │
│   ├─ Manager/AM นับเงินสดจริง ณ วันท้ายวัน                      │
│   ├─ System แสดง expected amounts จาก Step 1                   │
│   ├─ Manager/AM verify match or note discrepancies             │
│   └─ ยืนยันข้อมูล (ไม่ใช่บันทึกใหม่)                           │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ WORKFLOW 3.2: Auditor ตรวจสอบเงินจากบริการรับชำระบิล           │
│   └─ มาจาก History Page (คลิก "ตรวจสอบ" บนแถว step2_completed) │
│   └─ Cross-check กับ bank statement                            │
│   └─ Verify all transactions & amounts                         │
│   └─ ส่งกลับ Manager (needs_correction) ได้ ถ้าเจอปัญหา        │
│                                                                 │
│ WORKFLOW 3.3: Owner อนุมัติการตรวจสอบ                          │
│   └─ มาจาก History Page (คลิก "อนุมัติ" บนแถว audited)         │
│   └─ Final approval ของ Manager & Auditor records              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Workflow 3.0: หน้าประวัติบริการรับชำระบิล (History Page — Entry Point)

**บริบท**: ทุก Role เข้าสู่ระบบผ่านหน้านี้ก่อนเสมอ ทำหน้าที่เป็น "Pending Inbox" ที่แสดงรายการทุกวันพร้อม Smart Navigation พาแต่ละ Role ไปยัง WF step ที่ถูกต้องโดยอัตโนมัติ

### Process Flow
```
[User เข้าเมนู "บริการรับชำระบิล"]
        ↓
[Landing: /finance/bill-payment-history]
        ↓
เห็น list รายการทุกวัน (เรียงล่าสุดก่อน)
+ Summary Cards: pending count แต่ละ Role
        ↓
┌─ Manager/Assistant Manager ─────────────────────────────┐
│ คลิก [เพิ่มรายการ] → date picker                        │
│   ↓ เลือกวันที่ (วันนี้หรือย้อนหลัง)                     │
│   ↓ navigate to /finance/bill-payment-service?date=      │
│                                                          │
│ คลิก [ทำงาน] (step1_in_progress) → WF 3.1              │
│ คลิก [แก้ไข] (needs_correction)  → WF 3.1              │
│ คลิก [ดูรายละเอียด] (อื่นๆ)      → index.vue read-only  │
└──────────────────────────────────────────────────────────┘
        ↓
┌─ Auditor ───────────────────────────────────────────────┐
│ คลิก [ตรวจสอบ] (step2_completed) → WF 3.2              │
│ คลิก [ดูรายละเอียด] (step1_*)    → index.vue read-only  │
└──────────────────────────────────────────────────────────┘
        ↓
┌─ Owner ─────────────────────────────────────────────────┐
│ คลิก [อนุมัติ] (audited)         → WF 3.3              │
│ คลิก [ดูรายละเอียด] (step1_*/step2_*) → index.vue read-only│
└──────────────────────────────────────────────────────────┘
```

### Details
- **Role**: ทุก Role — owner, manager, assistant_manager, auditor
- **Page**: `/finance/bill-payment-history`
- **Sidebar route**: เมนู "บริการรับชำระบิล" ชี้มาที่หน้านี้
- **Pending Inbox (Summary Cards)**:
  - Manager/AM: นับ `step1_in_progress` + `needs_correction`
  - Auditor: นับ `step2_completed`
  - Owner: นับ `audited`
- **Smart Action Button** — label + destination เปลี่ยนตาม Role × workflowStatus:

  | Role | workflowStatus | ปุ่ม | ปลายทาง |
  |------|----------------|------|---------|
  | manager/AM | step1_in_progress | "ทำงาน" | `bill-payment-service?date=` |
  | manager/AM | needs_correction | "แก้ไข" | `bill-payment-service?date=` |
  | manager/AM | step2_completed/audited/approved | "ดูรายละเอียด" | `bill-payment-service?date=` |
  | auditor | step2_completed | "ตรวจสอบ" | `auditor-review?date=` |
  | auditor | audited | "ดูการตรวจสอบ" | `auditor-review?date=` |
  | auditor | step1_* | "ดูรายละเอียด" | `bill-payment-service?date=` |
  | owner | audited | "อนุมัติ" | `owner-approval?date=` |
  | owner | approved | "ดูรายละเอียด" | `owner-approval?date=` |
  | owner | step1_*/step2_* | "ดูรายละเอียด" | `bill-payment-service?date=` |

- **ปุ่ม "เพิ่มรายการ"**: กั้นด้วย `EDIT_FINANCE` permission → manager, assistant_manager, owner เห็นเท่านั้น
- **Backdated Entry**: ปุ่ม "เพิ่มรายการ" ให้เลือกวันที่ได้อิสระ รวมถึงวันในอดีต (กรณีระบบมีปัญหา ให้บันทึกลงกระดาษแล้วนำมาบันทึกระบบภายหลัง)
- **Back Navigation**: ทุก WF page (3.1, 3.2, 3.3) มีปุ่ม "← ประวัติ" กลับมาที่หน้านี้

---

## Workflow 3.1: บันทึก & ตรวจสอบเงินจากบริการรับชำระบิล (Manager - Record Bill Payment & Verification)

### Real-World Example

**Scenario**: Manager/Assistant Manager records daily bill payment service transactions in app (replacing paper-based records)

**Step 1: Record Bill Payment Transactions (Manager/Assistant Manager บันทึกรายการรับชำระบิล)**

**บริบท**: ก่อนหน้านี้บันทึกลงกระดาษ ตอนนี้จะบันทึกผ่านแอพเพื่อให้ระบบคำนวณ balance อัตโนมัติ

```
Manager/Assistant Manager บันทึกใน /finance/bill-payment-service:

DATE: 2026-01-29

INITIAL BALANCES (วันเริ่มต้น):
1) เงินในบัญชี (Bank Account Balance): 3,000 บาท
2) เงินสดจากบริการรับชำระบิล (Bill Payment Cash): 0 บาท
3) เงินสดค่าบริการรับชำระบิล (Service Fee Cash): 0 บาท

═════════════════════════════════════════════════════════════
Manager/Assistant Manager บันทึกลงแอพ (ระบบคำนวณ Balance อัตโนมัติ)
═════════════════════════════════════════════════════════════

MANAGER RECORDED TRANSACTION RECORDS (รายการที่ Manager บันทึก):

Transaction 1: Utility Bill Payment (ค่าน้ำ/ค่าไฟ)
   📝 Manager บันทึก:
   - Date: 2026-01-29 11:30 AM
   - Type: Bill Payment
   - Bill Type: Utility (สาธารณูปโภค)
   - Amount: 2,000 บาท (customer pays cash)
   - Commission: 20 บาท (paid in cash)

   🤖 System auto-calculates Balance Changes:
     1) Bank Account: 3,000 - 2,000 = 1,000 บาท (transfer to biller)
     2) Bill Payment Cash: 0 + 2,000 = 2,000 บาท (cash in)
     3) Service Fee Cash: 0 + 20 = 20 บาท

Transaction 2: Telecom Bill Payment (FAILED)
   📝 Manager บันทึก:
   - Date: 2026-01-29 01:45 PM
   - Type: Bill Payment
   - Bill Type: Telecom (ค่าโทรศัพท์)
   - Amount: 1,200 บาท (requested)
   - Status: ❌ FAILED - Insufficient funds in account (1,000 < 1,200)
   - Notes: Transaction was rejected

   🤖 System auto-calculates Balance Changes:
     ✗ No balance changes (transaction rejected)
     1) Bank Account: 1,000 บาท (no change)
     2) Bill Payment Cash: 2,000 บาท (no change)
     3) Service Fee Cash: 20 บาท (no change)

Transaction 3: Owner Deposit (เจ้าของร้านฝากเงิน)
   📝 Manager บันทึก:
   - Date: 2026-01-29 02:15 PM
   - Type: Owner Deposit
   - Amount: 5,000 บาท (Owner deposits to business account)
   - Commission: 0 บาท (no fee for owner deposit)

   🤖 System auto-calculates Balance Changes:
     1) Bank Account: 1,000 + 5,000 = 6,000 บาท (deposit in)
     2) Bill Payment Cash: 2,000 บาท (no change)
     3) Service Fee Cash: 20 บาท (no change)

Transaction 4: Telecom Bill Payment (RETRY - SUCCESS)
   📝 Manager บันทึก:
   - Date: 2026-01-29 02:30 PM
   - Type: Bill Payment
   - Bill Type: Telecom (ค่าโทรศัพท์)
   - Amount: 1,200 บาท (retry succeeds)
   - Commission: 20 บาท (paid in cash)
   - Status: ✅ SUCCESS

   🤖 System auto-calculates Balance Changes:
     1) Bank Account: 6,000 - 1,200 = 4,800 บาท (transfer to biller)
     2) Bill Payment Cash: 2,000 + 1,200 = 3,200 บาท (cash in)
     3) Service Fee Cash: 20 + 20 = 40 บาท

═════════════════════════════════════════════════════════════
🤖 SYSTEM AUTO-CALCULATED FINAL BALANCES (after all transactions)
═════════════════════════════════════════════════════════════

FINAL BALANCES SUMMARY:
1) เงินในบัญชี (Bank Account): 4,800 บาท
   - In: 5,000 บาท (owner deposit)
   - Out: 2,000 + 1,200 = 3,200 บาท (bill payments)
   - Calc: 3,000 + 5,000 - 3,200 = 4,800 บาท ✓

2) เงินสดจากบริการรับชำระบิล (Bill Payment Cash): 3,200 บาท
   - In: 2,000 + 1,200 = 3,200 บาท (bill payments received)
   - Calc: 0 + 3,200 = 3,200 บาท ✓

3) เงินสดค่าบริการรับชำระบิล (Service Fee Cash): 40 บาท
   - In: 20 + 20 = 40 บาท (all cash commission transactions)
   - Calc: 0 + 40 = 40 บาท ✓

TOTAL TRANSACTIONS: 4 (3 successful, 1 failed)
TOTAL CASH COUNTED: 3,200 + 40 = 3,240 บาท (cash summary)
TOTAL SERVICE FEES: 40 บาท (all commissions in cash)
TOTAL BANK BALANCE: 4,800 บาท
```

---

### Process Flow - Step 1: Record Bill Payment Transactions
```
[มาจาก History Page (WF 3.0)]
        ↓
[คลิก "เพิ่มรายการ" → เลือกวันที่ หรือ คลิก "ทำงาน"/"แก้ไข" บน existing row]
        ↓
navigate to /finance/bill-payment-service?date=YYYY-MM-DD
        ↓
[ถ้า date เป็นวันในอดีต: แสดง warning banner "⚠️ กำลังบันทึกย้อนหลัง: วันที่ DD/MM/YYYY"]
        ↓
[Throughout the day - each bill payment happens]
        ↓
Manager/Assistant Manager บันทึกลงแอพ:
     คลิก "รายการใหม่" หรือ Quick Action บนหน้า
        ↓
     Fill in transaction details:
     - Date & Time of transaction
     - Type: Bill Payment / Owner Deposit
     - Bill type: Utility / Telecom / Insurance / Other (เฉพาะ bill_payment)
     - Amount: เงินที่ลูกค้าจ่าย หรือ owner ฝาก
     - Commission: ค่าบริการ (เป็นเงินสด)
     - Customer name (optional, for reference)
        ↓
     [Save] → System auto-calculates all balance changes
        ↓
     ✅ Transaction recorded
     ✅ All 3 balances updated automatically:
        1) Bank Account Balance
        2) Bill Payment Cash
        3) Service Fee Cash
        ↓
[End of day - proceed to Step 2]
```

### Details - Step 1
- **Role**: ผู้จัดการหรือผู้ช่วยผู้จัดการ (Manager/Assistant Manager)
- **Entry**: มาจาก History Page (WF 3.0) → คลิก "เพิ่มรายการ" หรือ "ทำงาน"
- **Page**: `/finance/bill-payment-service?date=YYYY-MM-DD`
- **Note**: ถ้า date เป็นวันในอดีต → แสดง warning banner (Backdated Entry)
- **Timing**: Throughout the day, as each transaction occurs
- **Time Required**: ~2-3 minutes per transaction
- **Success Criteria**:
  - ✅ Each transaction recorded immediately
  - ✅ All details filled correctly
  - ✅ System calculates balances automatically
  - ✅ No manual balance calculations needed
- **Data Recorded Per Transaction**:
  - transactionType: "bill_payment" or "owner_deposit"
  - billType: "utility" / "telecom" / "insurance" / "other" (เฉพาะ bill_payment)
  - amount: เงินที่ลูกค้าจ่ายหรือ owner ฝาก
  - commission: ค่าบริการ (เงินสดเท่านั้น)
  - timestamp: เวลาที่บันทึก
  - recordedBy: Manager/Assistant Manager ID
- **Auto-calculated by System**:
  - bankAccountBalance: updated
  - billPaymentCash: updated
  - serviceFeeCash: updated
- **Next Step**: Step 2 (Count actual cash at end of day)

---

**Step 2: Verify Recorded Transactions & Count Actual Cash (ตรวจสอบรายการบันทึก และนับเงินสดจริง)**

**บริบท**: Manager ตรวจสอบว่าการบันทึก Step 1 ตรงกับเงินสดจริงหรือไม่

```
═════════════════════════════════════════════════════════════
SYSTEM DATA FROM STEP 1 (ระบบสะสมจากการบันทึก)
═════════════════════════════════════════════════════════════

EXPECTED BALANCES (from Step 1 recorded transactions):
1) Bank Account Balance: 4,800 บาท
2) Bill Payment Cash: 3,200 บาท
3) Service Fee Cash: 40 บาท

TOTAL TRANSACTIONS RECORDED: 4 (3 successful, 1 failed)
EXPECTED TOTAL CASH ON HAND: 3,200 + 40 = 3,240 บาท

═════════════════════════════════════════════════════════════
MANAGER VERIFICATION (ผู้จัดการตรวจสอบเงินสดจริง)
═════════════════════════════════════════════════════════════

A. PHYSICAL CASH COUNT (นับเงินสดจริง):

   Bill Payment Cash Section:
   📝 Manager counts: 3,200 บาท
   📊 System expected: 3,200 บาท
   ✅ MATCH: 0 บาท discrepancy

   Service Fee Cash Section:
   📝 Manager counts: 40 บาท
   📊 System expected: 40 บาท
   ✅ MATCH: 0 บาท discrepancy

   TOTAL CASH COUNTED: 3,200 + 40 = 3,240 บาท
   TOTAL EXPECTED: 3,240 บาท
   ✅ MATCH: Cash count accurate

B. VERIFICATION NOTES:
   ✅ All 4 transactions from Step 1 verified
   ✅ Cash count matches system records
   ✅ No discrepancies found

   managerVerificationNotes: "All transactions recorded in Step 1 verified. Cash count matches system expected amounts. Ready for Auditor review."

═════════════════════════════════════════════════════════════
STEP 2 CONFIRMATION (ยืนยันข้อมูล)
═════════════════════════════════════════════════════════════

Status: "step2_completed" (auto-set after manager confirms)
verifiedAt: 2026-01-29 17:00:00
verifiedBy: manager-001

✅ Step 1 records confirmed
✅ Physical cash verified
```

### Process Flow - Step 2: Verify & Count Actual Cash
```
[End of Day - Manager performs Step 2]
        ↓
[Go to /finance/bill-payment-service → View "pending verification"]
        ↓
Review System Data from Step 1:
     - System shows all recorded transactions
     - System shows expected balances
     - System shows expected cash amounts
        ↓
     PHYSICAL CASH VERIFICATION:
     Manager counts actual cash:
        ↓
     1. Count Bill Payment Cash:
        - Count all cash received from bill payments
        - Compare with system expected amount
        - Note any discrepancies
        ↓
     2. Count Service Fee Cash:
        - Count all commission received in cash
        - Compare with system expected amount
        - Note any discrepancies
        ↓
     RECONCILIATION CHECK:
     Actual Cash Count vs System Expected:
        - Bill Payment Cash: Actual ↔ System Expected
        - Service Fee Cash: Actual ↔ System Expected
        - Total Cash: Actual ↔ System Expected
        ↓
     [Status]
        ├─ If MATCH ✅: [Confirm Verification]
        │   ↓
        │   Click [ยืนยันข้อมูล]
        │   → Status = "step2_completed"
        │   → verifiedBy: Manager
        │   → verifiedAt: timestamp
        │
        └─ If DISCREPANCY ⚠️: [Add Verification Notes]
            ↓
            Fill in discrepancy details:
            - Amount difference
            - Possible cause
            - Follow-up action
            ↓
            Click [ยืนยันพร้อมหมายเหตุ]
            → Status = "step2_completed_with_notes"
            → verificationNotes: detailed notes
        ↓
     [Complete] → Ready for Auditor (Workflow 3.2)
     → กลับ History Page (/finance/bill-payment-history) อัตโนมัติ
```

### Details - Step 2
- **Role**: ผู้จัดการหรือผู้ช่วยผู้จัดการ (Manager/Assistant Manager)
- **Page**: `/finance/bill-payment-service?date=YYYY-MM-DD` (same page, Step 2 section)
- **Timing**: End of day, after all transactions in Step 1 are recorded
- **Time Required**: ~5-10 minutes
- **Success Criteria**:
  - ✅ All Step 1 transactions reviewed
  - ✅ Physical cash counted
  - ✅ Cash amount compared with system expected
  - ✅ Verification completed (match or discrepancies noted)
  - ✅ Data marked as "step2_completed"
- **Data Verified (NOT Recorded - Already in Step 1)**:
  - Compare System Expected vs Actual Count:
    - billPaymentCash: expected vs actual
    - serviceFeeCash: expected vs actual
    - bankAccountBalance: expected vs actual
- **Verification Outcome**:
  - **If Match**: ✅ Status = "step2_completed"
  - **If Discrepancy**: ⚠️ Status = "step2_completed_with_notes"
    - discrepancyAmount: difference found
    - discrepancyReason: possible cause
    - verificationNotes: detailed explanation
- **Data Fields Updated**:
  - workflowStatus: "step2_completed" or "step2_completed_with_notes"
  - verifiedAt: timestamp
  - verifiedBy: Manager ID
  - verificationNotes: (if needed)
- **Next Step**: Auditor final review & approval (Workflow 3.2) — Auditor เห็น row ที่ `step2_completed` ใน History Page แล้วคลิก "ตรวจสอบ"

---

## Workflow 3.2: ตรวจสอบเงินจากบริการรับชำระบิล (Auditor - Verify Bill Payment Service Income)

**บริบท**: Auditor ตรวจสอบข้อมูลจาก Step 1 & Step 2 ของ Manager โดยเทียบกับ bank statement และสูตรคำนวณ

### Process Flow
```
[Auditor เข้า History Page → เห็น row ที่ workflowStatus = "step2_completed"]
        ↓
คลิก [ตรวจสอบ] → navigate to /finance/bill-payment-service/auditor-review?date=YYYY-MM-DD
        ↓
     VERIFY MANAGER'S STEP 1 RECORDS:
     - Review all recorded transactions
     - Check transaction types, amounts, dates
     - Verify commission amounts
     - Check bill type breakdown (utility/telecom/insurance/other)
        ↓
     VERIFY AGAINST BANK STATEMENT:
     1. Cross-check each bill payment transaction:
        - Each successful bill payment: -amount in bank account
        - Owner deposit: +amount in bank account
        - Failed transactions: no change
        ↓
     2. Verify final bank balance:
        - System expected vs Bank statement
        - Match? ✅ YES / NO
        ↓
     VERIFY MANAGER'S STEP 2 RESULTS:
     - Physical cash verification: All amounts match? ✓
     - No discrepancies noted? ✓
     - Cash count accurate? ✓
        ↓
     [Status]
        ├─ If ALL CORRECT ✅: [Confirm Audit]
        │   ↓
        │   Add verification notes
        │   Click [ยืนยันการตรวจสอบ]
        │   → Status = "audited"
        │   → auditedBy: Auditor
        │   → auditedAt: timestamp
        │
        ├─ If MINOR ISSUE ⚠️: [Add Audit Notes]
        │   ↓
        │   Fill in discrepancy details
        │   → Status = "audited_with_issues"
        │   → auditNotes: detailed issues
        │
        └─ If NEEDS CORRECTION ⚠️: [ส่งกลับให้ Manager ปรับแก้]
            ↓
            Specify which Step 1/2 records need fixing
            → Status = "needs_correction"
            → auditNotes: specific corrections required
            → Manager เห็น row ใน History Page → คลิก "แก้ไข" → กลับไป Step 1
            → After Manager fixes → re-submit → Auditor re-audits (approach C)
        ↓
     [Complete] → Ready for Owner approval (Workflow 3.3)
```

### Details - Auditor Verification
- **Role**: ผู้ตรวจสอบ (Auditor)
- **Entry**: มาจาก History Page (WF 3.0) → คลิก "ตรวจสอบ" บน row ที่ `step2_completed`
- **Page**: `/finance/bill-payment-service/auditor-review?date=YYYY-MM-DD`
- **Back Navigation**: ปุ่ม "← ประวัติ" กลับ History Page
- **Timing**: After Manager completes Step 1 & 2 (Status: "step2_completed")
- **Time Required**: ~10-15 minutes
- **Success Criteria**:
  - ✅ All Step 1 transactions verified with bank statement
  - ✅ All Step 2 cash verification confirmed
  - ✅ Bank balance matches expected amount
  - ✅ No missing or duplicate transactions
  - ✅ Clear audit notes (if needed)
- **Data Verified**:
  - **Step 1 Records**:
    - Each transaction type, bill type, amount, commission
    - Transaction status (success/failed)
    - Balance changes correctness
  - **Step 2 Results**:
    - Cash count accuracy
    - Discrepancies (if any)
    - Verification status
  - **Bank Statement Match**:
    - Each transaction against bank records
    - Final balance accuracy
    - No missing transactions
- **Audit Outcome**:
  - **If OK**: ✅ Status = "audited"
  - **If Minor Issues**: ⚠️ Status = "audited_with_issues"
  - **If Needs Correction**: ⚠️ Status = "needs_correction" → ส่งกลับ Manager
    - auditNotes: detailed explanation of what needs fixing
    - Manager fixes Step 1/2 records → re-submits → Auditor re-audits (approach C)
- **Data Fields Updated**:
  - workflowStatus: "audited" / "audited_with_issues" / "needs_correction"
  - auditedAt: timestamp
  - auditedBy: Auditor ID
  - auditNotes: verification details
- **Next Step**: Owner final approval (Workflow 3.3) — Owner เห็น row ที่ `audited` ใน History Page แล้วคลิก "อนุมัติ"

---

## Workflow 3.3: อนุมัติการตรวจสอบเงินจากบริการรับชำระบิล (Owner - Approve Bill Payment Service Income)

**บริบท**: Owner อนุมัติข้อมูลที่ Auditor ได้ตรวจสอบแล้ว (Step 1, Step 2, และ Audit)

### Process Flow
```
[Owner เข้า History Page → เห็น row ที่ workflowStatus = "audited"]
        ↓
คลิก [อนุมัติ] → navigate to /finance/bill-payment-service/owner-approval?date=YYYY-MM-DD
        ↓
     REVIEW ALL RECORDS:

     Step 1: Manager's Recorded Transactions
     - All transactions (types, bill types, amounts, commissions)
     - Balance changes calculation

     Step 2: Manager's Verification
     - Physical cash count results
     - Any discrepancies noted

     Step 3 (Workflow 3.2): Auditor's Verification
     - Bank statement cross-check
     - Transaction verification
     - Audit notes
        ↓
     [Status Check]
        ├─ If "audited" (No Issues) ✅:
        │   ↓
        │   Everything OK - Ready to approve
        │   ↓
        │   Click [อนุมัติ]
        │   → Status = "approved"
        │   → approvedAt: timestamp
        │   → approvedBy: Owner ID
        │   ↓
        │   [Complete] ✅
        │
        └─ If "audited_with_issues" ⚠️:
            ↓
            Review Auditor's notes about issues
            ↓
            [Decision]
            ├─ Approve anyway:
            │   → Click [อนุมัติแม้มีปัญหา]
            │   → Status = "approved_with_notes"
            │   → approvalNotes: "Approved despite issues: ..."
            │
            └─ Request correction:
                → Click [ส่งกลับให้ Manager ปรับแก้]
                → Status = "needs_correction"
                → Notes: specific issues to fix
                → Manager revises Step 1/2
        ↓
     [Complete]
        ↓
     Bill payment service income recorded ✓
```

### Details - Owner Final Approval
- **Role**: เจ้าของร้าน (Owner)
- **Entry**: มาจาก History Page (WF 3.0) → คลิก "อนุมัติ" บน row ที่ `audited`
- **Page**: `/finance/bill-payment-service/owner-approval?date=YYYY-MM-DD`
- **Back Navigation**: ปุ่ม "← ประวัติ" กลับ History Page
- **Timing**: After Auditor completes verification (Status: "audited")
- **Time Required**: ~5-10 minutes
- **Success Criteria**:
  - ✅ All records reviewed (Step 1, Step 2, Audit)
  - ✅ Final approval decision made
  - ✅ Clear documentation of approval status
- **Data Reviewed**:
  - **Step 1 Records**: All transactions with bill types, amounts, and commissions
  - **Step 2 Results**: Manager's cash verification (match or discrepancies)
  - **Audit Notes**: Auditor's verification against bank statement
  - **Status**: "audited" ✅ or "audited_with_issues" ⚠️
- **Approval Decision**:
  - **If "audited"** (No issues): ✅ Approve directly
    - workflowStatus: "approved"
  - **If "audited_with_issues"**: Owner decides:
    - **Approve anyway**: workflowStatus = "approved_with_notes"
    - **Request correction**: workflowStatus = "needs_correction"
- **Data Fields Updated**:
  - workflowStatus: "approved" / "approved_with_notes" / "needs_correction"
  - approvedAt: timestamp
  - approvedBy: Owner ID
  - approvalNotes: (if needed)
- **Result**: ✅ Bill payment service income finalized
  - Ready for accounting/financial reporting

---

# 📊 FLOW 4: Daily Income/Expense Recording (บันทึกรายรับ-รายจ่ายรายวัน)

## Workflow 4.1: บันทึกข้อมูลรายรับ-รายจ่ยรายวัน (Manager - Daily Record)

### Real-World Example

**Scenario**: Manager records daily income & expenses from multiple sources (Cash Sales, Money Transfer Service, Bill Payment Service, and Government Programs)

**Step 1: Manager Gets Data From All Sources**
```
From various sources (already approved):
- Cash Sales (from POS): 5,000 บาท
- /finance/money-transfer-service → Service Fee Cash: 150 บาท
- /finance/money-transfer-service → Service Fee Transfer: 50 บาท
- /finance/bill-payment-service → Bill Payment Fees: 30 บาท
- Government Programs (from POS): 1,500 บาท
- Other Cash Income: (as needed)
```

**Step 2: Manager Records Income Data**
```
/finance/daily-expenses → New Record:

INCOME SECTION (รายรับ):
1. เงินสดขาย (จาก POS):
   - Cash sales from products: 9,800 บาท
   - (Includes: document copying, phone top-up service, etc.)

2. เงินโอนขาย (จาก POS - Customer Transfer/QR):
   - Transfer sales (PromptPay, Bank Transfer, etc.): 4,500 บาท
   - (Customer paid via QR Code or bank transfer)

3. เงินจากโครงการของรัฐ (Government Programs):
   - From POS government programs total
   - Example: 1,950 บาท

4. ค่าบริการจาก Money Transfer:
   - Service fees: 150 บาท

5. ค่าบริการจาก Bill Payment:
   - Service fees: 50 บาท

6. เงินสดรับอื่นๆ:
   - Other cash received: 200 บาท
   - (Any cash not from categories 1-5)

TOTAL INCOME (รวมรายรับ): 9,800 + 4,500 + 1,950 + 150 + 50 + 200 = 16,650 บาท
```

**Step 3: Manager Records Expense Data (เงินสดจ่าย)**
```
EXPENSE GROUP 1: เงินสดจ่ายหน้าร้าน (Cash Payment at Store)
1.1 เงินซื้อสินค้าหน้าร้าน (Vendor sales at store): 3,000 บาท
1.2 ค่าจ้างพนักงานรายวัน (Daily wages - paid every day): 1,200 บาท
1.3 โอทีพนักงานรายวัน (Daily OT - paid on 1st & 16th of month): 300 บาท
1.4 ค่าน้ำ (Water - paid monthly): 300 บาท
Subtotal Cash at Store: 4,800 บาท

EXPENSE GROUP 2: เงินโอนจ่าย (Bank Transfer Payment)
2.1 เงินโอนจ่ายหน้าร้าน (Transfer for store needs): 1,200 บาท
2.2 แม็คโคร (Makro - Credit card payment): 2,500 บาท
2.3 ของสด (Fresh goods - Transfer only): 1,800 บาท
2.4 ออนไลน์ (Online purchase - Transfer only): 800 บาท
2.5 วีเพย์ (V-Pay mobile top-up system): 500 บาท
Subtotal Bank Transfer: 6,800 บาท

EXPENSE GROUP 3: แบ่งตามพื้นที่ซื้อสินค้า (By Purchase Location)
3.1 อำเภอสองพี่น้อง (Song Phi Nong district): 2,000 บาท
3.2 อำเภอเมือง (Muang district): 3,500 บาท
Subtotal by Location: 5,500 บาท

EXPENSE GROUP 4: สินค้าเฉพาะกลุ่ม (Specific Product Categories)
4.1 ข้าวสาร (Rice - จาก หจก.โรงสีรังสรรค์พืชผล): 2,000 บาท
4.2 อุปกรณ์ตกปลา (Fishing equipment): 1,200 บาท
Subtotal by Product: 3,200 บาท

EXPENSE GROUP 5: รายจ่ายอื่นๆ (Other Expenses - Manager can record all)
5.1 เงินเดือน (Salary): 2,000 บาท
5.2 โอที (Overtime): 500 บาท
5.3 ภาษี (Tax): 300 บาท
5.4 อื่นๆ (Others): 400 บาท
Subtotal Other: 3,200 บาท

TOTAL EXPENSES (รวมรายจ่าย): 4,800 + 6,800 + 5,500 + 3,200 + 3,200 = 23,500 บาท
(Note: Groups can overlap - it's for tracking purposes, not adding all)
```

**Step 4: System Calculates Summary**
```
Income Summary (รวมรายรับ):
├─ Cash Sales: 9,800 บาท
├─ Money Transfer Fees: 150 บาท
├─ Bill Payment Fees: 50 บาท
├─ Other Cash Received: 200 บาท
├─ Government Programs: 1,950 บาท
└─ Total Income: 12,150 บาท

Expense Summary (รวมรายจ่าย):
├─ Cash at Store: 4,800 บาท
├─ Bank Transfer: 6,800 บาท
├─ By Location: 5,500 บาท (reference)
├─ By Product: 3,200 บาท (reference)
├─ Other Expenses: 3,200 บาท
└─ Total Expenses: 23,500 บาท

Net Result: 12,150 - 23,500 = -11,350 บาท (loss/investment day)

Status: ⚠️ PENDING AUDITOR REVIEW
```

**Step 5: Manager Submits & Send to Auditor**
```
/finance/daily-expenses → Record Data:
- date: 2026-01-29
- managerId: manager-001
- managerName: วีระ

INCOME DATA (รายรับ):
- cashSalesFromPos: 9,800
- moneyTransferServiceFees: 150
- billPaymentServiceFees: 50
- otherCashReceived: 200
- governmentProgramsIncome: 1,950
- totalIncome: 12,150

EXPENSE DATA - CASH PAYMENTS (เงินสดจ่าย):
- vendorCashAtStore: 3,000
- dailyWagesAndOT: 1,500
- waterExpense: 300
- totalCashAtStore: 4,800

EXPENSE DATA - BANK TRANSFERS (เงินโอนจ่าย):
- transferForStore: 1,200
- makroCredit: 2,500
- freshGoodsTransfer: 1,800
- onlineShoppingTransfer: 800
- vPayTransfer: 500
- totalBankTransfer: 6,800

EXPENSE DATA - BY LOCATION (แบ่งตามพื้นที่):
- songPhiNongDistrict: 2,000
- muangDistrict: 3,500
- totalByLocation: 5,500

EXPENSE DATA - BY PRODUCT (สินค้าเฉพาะกลุ่ม):
- riceFromSupplier: 2,000
- fishingEquipment: 1,200
- totalByProduct: 3,200

EXPENSE DATA - OTHER (รายจ่ายอื่นๆ):
- salary: 2,000
- overtime: 500
- tax: 300
- others: 400
- totalOtherExpenses: 3,200

EXPENSE SUMMARY:
- totalExpenses: 23,500
  (Primary: Cash at Store + Bank Transfer = 4,800 + 6,800 = 11,600)
  (Reference breakdowns: By Location, By Product for tracking)

SUMMARY:
- totalIncome: 16,650
- totalExpenses: 23,500
- netResult: -6,850
- managerNotes: "Daily records entered. Investment day with major stock purchases."

STATUS: "submitted" (auto-set)
submittedAt: 2026-01-29 17:30:00
submittedBy: manager-001

[Send notification to Auditor]
Auditor → Verify & Check (Workflow 4.2)
```

---

### Process Flow
```
[Start] → Go to /finance/daily-expenses page
        ↓
     Click "บันทึกใหม่" (New Record)
        ↓
     RECORD INCOME DATA (รายรับ):
     ════════════════════════════════════════
     1. เงินสดขาย (Cash Sales from POS):
        - Enter amount from /sales/daily-sales
        - Example: 9,800 บาท
        ↓
     2. เงินโอนขาย (Transfer Sales from POS):
        - Enter transfer amount (QR/Bank)
        - Example: 4,500 บาท
        ↓
     3. เงินจากโครงการของรัฐ (Government Programs):
        - From POS government programs total
        - Example: 1,950 บาท
        ↓
     4. ค่าบริการ Money Transfer:
        - Enter from /finance/money-transfer-service
        - Example: 150 บาท
        ↓
     5. ค่าบริการ Bill Payment:
        - Enter from /finance/bill-payment-service
        - Example: 50 บาท
        ↓
     6. เงินสดรับอื่นๆ (Other Cash Received):
        - Miscellaneous cash income
        - Example: 200 บาท (if any)
        ↓
     [System calculates]: Total Income = sum of 1-6
        ↓
     RECORD EXPENSE DATA (รายจ่าย):
     ════════════════════════════════════════
     GROUP 1: เงินสดจ่ายหน้าร้าน (Cash at Store):
     ─────────────────────────────────────────
     1.1 เงินซื้อสินค้าหน้าร้าน:
         - Vendor purchases at store
         - Example: 3,000 บาท
         ↓
     1.2 ค่าจ้างพนักงานรายวัน:
         - Daily wages (paid every day)
         - Example: 1,200 บาท
         ↓
     1.3 โอทีพนักงานรายวัน:
         - Daily OT (paid on 1st & 16th)
         - Example: 300 บาท
         ↓
     1.4 ค่าน้ำ:
         - Water expense (paid monthly)
         - Example: 300 บาท
         ↓
     [Subtotal Cash at Store]: 4,800 บาท
        ↓
     GROUP 2: เงินโอนจ่าย (Bank Transfer):
     ────────────────────────────────────────
     2.1 เงินโอนจ่ายหน้าร้าน:
         - Transfer for store operations
         - Example: 1,200 บาท
         ↓
     2.2 แม็คโคร:
         - Makro wholesale purchases
         - Example: 2,500 บาท
         ↓
     2.3 ของสด (Fresh Goods):
         - Fresh produce suppliers
         - Example: 1,800 บาท
         ↓
     2.4 ออนไลน์ (Online):
         - Online shopping/delivery
         - Example: 800 บาท
         ↓
     2.5 วีเพย์ (V-Pay):
         - Mobile prepaid system transfers
         - Example: 500 บาท
         ↓
     [Subtotal Bank Transfer]: 6,800 บาท
        ↓
     GROUP 3: แบ่งตามพื้นที่ (By Location):
     ──────────────────────────────────────
     3.1 อำเภอสองพี่น้อง:
         - Song Phi Nong district purchases
         - Example: 2,000 บาท
         ↓
     3.2 อำเภอเมือง:
         - Muang district purchases
         - Example: 3,500 บาท
         ↓
     [Subtotal by Location]: 5,500 บาท (reference for tracking)
        ↓
     GROUP 4: สินค้าเฉพาะกลุ่ม (By Product Category):
     ───────────────────────────────────────────────
     4.1 ข้าวสาร:
         - Rice from หจก.โรงสีรังสรรค์พืชผล
         - Example: 2,000 บาท
         ↓
     4.2 อุปกรณ์ตกปลา:
         - All fishing equipment purchases
         - Example: 1,200 บาท
         ↓
     [Subtotal by Product]: 3,200 บาท (reference for tracking)
        ↓
     GROUP 5: รายจ่ายอื่นๆ (Other Expenses):
     ──────────────────────────────────────
     5.1 เงินเดือน (Salary):
         - Employee salary
         - Example: 2,000 บาท
         ↓
     5.2 โอที (Overtime):
         - Overtime payment
         - Example: 500 บาท
         ↓
     5.3 ภาษี (Tax):
         - Tax payment
         - Example: 300 บาท
         ↓
     5.4 อื่นๆ (Others):
         - Miscellaneous expenses
         - Example: 400 บาท
         ↓
     [Subtotal Other Expenses]: 3,200 บาท
        ↓
     [System calculates total expenses]:
     Note: Primary calculation = Cash at Store + Bank Transfer
           (Groups 3-5 are for tracking/reporting reference)
        ↓
     Add manager notes (if needed):
     - Summary of major purchases
     - Any special circumstances
        ↓
     [Submit] → Status: "submitted" (auto)
        ↓
     Send summary to Auditor:
     - Income breakdown
     - Expense breakdown
     - Manager notes
        ↓
     [Complete]
```

### Details
- **Role**: ผู้จัดการหรือผู้ช่วยผู้จัดการ (Manager/Assistant Manager)
- **Page**: /finance/daily-expenses (Daily Income/Expense Recording)
- **Time Required**: ~15-20 minutes
- **Success Criteria**:
  - ✅ All income sources recorded with correct amounts
  - ✅ All expense groups filled with accurate amounts
  - ✅ Manager notes added (if needed)
  - ✅ Summary totals calculated correctly
- **Data Recorded**:
  - **incomeData** (รายรับ):
    - cashSalesFromPos: เงินสดขาย (e.g., 9,800 บาท)
    - transferSalesFromPos: เงินโอนขาย (e.g., 4,500 บาท)
    - governmentProgramsIncome: เงินจากโครงการรัฐ (e.g., 1,950 บาท)
    - moneyTransferServiceFees: ค่าบริการ Money Transfer (e.g., 150 บาท)
    - billPaymentServiceFees: ค่าบริการ Bill Payment (e.g., 50 บาท)
    - otherCashReceived: เงินสดรับอื่นๆ (e.g., 200 บาท)
    - totalIncome: รวมรายรับ (e.g., 16,650 บาท)
  
  - **expenseCashAtStore** (เงินสดจ่ายหน้าร้าน):
    - vendorCashAtStore: เงินซื้อสินค้าหน้าร้าน (e.g., 3,000 บาท)
    - dailyWages: ค่าจ้างพนักงานรายวัน (e.g., 1,200 บาท)
    - dailyOT: โอทีพนักงานรายวัน (e.g., 300 บาท)
    - waterExpense: ค่าน้ำ (e.g., 300 บาท)
    - totalCashAtStore: รวม (e.g., 4,800 บาท)
  
  - **expenseBankTransfer** (เงินโอนจ่าย):
    - transferForStore: เงินโอนจ่ายหน้าร้าน (e.g., 1,200 บาท)
    - makroCredit: แม็คโคร (e.g., 2,500 บาท)
    - freshGoodsTransfer: ของสด (e.g., 1,800 บาท)
    - onlineShoppingTransfer: ออนไลน์ (e.g., 800 บาท)
    - vPayTransfer: วีเพย์ (e.g., 500 บาท)
    - totalBankTransfer: รวม (e.g., 6,800 บาท)
  
  - **expenseByLocation** (แบ่งตามพื้นที่):
    - songPhiNongDistrict: อำเภอสองพี่น้อง (e.g., 2,000 บาท)
    - muangDistrict: อำเภอเมือง (e.g., 3,500 บาท)
    - totalByLocation: รวม (e.g., 5,500 บาท)
  
  - **expenseByProduct** (สินค้าเฉพาะกลุ่ม):
    - riceFromSupplier: ข้าวสาร (e.g., 2,000 บาท)
    - fishingEquipment: อุปกรณ์ตกปลา (e.g., 1,200 บาท)
    - totalByProduct: รวม (e.g., 3,200 บาท)
  
  - **expenseOther** (รายจ่ายอื่นๆ):
    - salary: เงินเดือน (e.g., 2,000 บาท)
    - overtime: โอที (e.g., 500 บาท)
    - tax: ภาษี (e.g., 300 บาท)
    - others: อื่นๆ (e.g., 400 บาท)
    - totalOtherExpenses: รวม (e.g., 3,200 บาท)
  
  - **expenseSummary**:
    - totalCashAndTransfer: Cash at Store + Bank Transfer (Primary: e.g., 11,600 บาท)
    - totalExpenses: รวมรายจ่ายทั้งหมด (e.g., 23,500 บาท)
  
  - **summary**:
    - totalIncome: 12,150 บาท
    - totalExpenses: 23,500 บาท
    - netResult: Income - Expenses (e.g., -11,350 บาท)
    - managerNotes: (if any special notes)
  
  - **status**: "submitted" (ระบบตั้งอัตโนมัติ)
  - **submittedAt**: timestamp ปัจจุบัน
  - **submittedBy**: Manager ID (ผู้ที่บันทึก)
- **Next Step**: Auditor verify and approve (Workflow 4.2)

---

## Workflow 4.2: ตรวจสอบรายรับ-รายจ่าย (Auditor - Verify Income/Expense)

### Real-World Example

**Scenario**: Auditor reviews Manager's income/expense record (12,150 บาท income, 11,600 บาท primary expense from Workflow 4.1)

**Step 1: Auditor Gets Manager's Submitted Record**
```
From /finance/daily-expenses → Submitted entry:
- Date: 2026-01-29
- Manager: วีระ
- Income Total: 12,150 บาท
- Primary Expenses (Cash + Transfer): 11,600 บาท
- Net Result: 550 บาท
- Status: submitted (by Manager in Workflow 4.1)
```

**Step 2: Auditor Verifies Income Data**
```
INCOME VERIFICATION:

1. เงินสดขาย (Cash Sales) - 9,800 บาท:
   ✅ Cross-check with /sales/daily-sales → Approved
   - Record date: 2026-01-29
   - Amount matches: ✓ 9,800 บาท

2. ค่าบริการ Money Transfer - 150 บาท:
   ✅ Cross-check with /finance/money-transfer-service → Audited
   - Amount matches: ✓ 150 บาท

3. ค่าบริการ Bill Payment - 50 บาท:
   ✅ Cross-check with /finance/bill-payment-service → Audited
   - Amount matches: ✓ 50 บาท

4. เงินสดรับอื่นๆ - 200 บาท:
   ✅ Check with supporting documents/notes
   - Amount verified: ✓ 200 บาท

5. เงินจากโครงการของรัฐ - 1,950 บาท:
   ✅ Cross-check with /sales/daily-sales government program data
   - Amount matches: ✓ 1,950 บาท

INCOME VERIFICATION RESULT: ✅ ALL CORRECT
Total Income: 12,150 บาท
```

**Step 3: Auditor Verifies Expense Data**
```
EXPENSE VERIFICATION (PRIMARY):

GROUP 1: เงินสดจ่ายหน้าร้าน - 4,800 บาท:
   1.1 เงินซื้อสินค้าหน้าร้าน - 3,000 บาท:
       ✅ Check receipts/invoices from vendors
       - Verified: ✓ 3,000 บาท
   
   1.2 ค่าจ้างและโอที - 1,500 บาท:
       ✅ Check payroll/OT records
       - Verified: ✓ 1,500 บาท
   
   1.3 ค่าน้ำ - 300 บาท:
       ✅ Check utility bill
       - Verified: ✓ 300 บาท
   
   GROUP 1 TOTAL: ✓ 4,800 บาท

GROUP 2: เงินโอนจ่าย - 6,800 บาท:
   2.1 เงินโอนจ่ายหน้าร้าน - 1,200 บาท:
       ✅ Check bank statement/transfer record
       - Verified: ✓ 1,200 บาท
   
   2.2 แม็คโคร - 2,500 บาท:
       ✅ Check credit card statement/receipt
       - Verified: ✓ 2,500 บาท
   
   2.3 ของสด - 1,800 บาท:
       ✅ Check delivery receipts/invoices
       - Verified: ✓ 1,800 บาท
   
   2.4 ออนไลน์ - 800 บาท:
       ✅ Check order confirmations/bank statement
       - Verified: ✓ 800 บาท
   
   2.5 วีเพย์ - 500 บาท:
       ✅ Check V-Pay transaction history
       - Verified: ✓ 500 บาท
   
   GROUP 2 TOTAL: ✓ 6,800 บาท

PRIMARY EXPENSES (Cash + Transfer): ✓ 11,600 บาท

EXPENSE VERIFICATION RESULT (PRIMARY): ✅ ALL CORRECT
```

**Step 4: Auditor Verifies Tracking Data (For Reference)**
```
VERIFICATION OF TRACKING CATEGORIES (For reporting purposes):

GROUP 3: แบ่งตามพื้นที่ - 5,500 บาท (reference):
   ✅ Cross-check: Items should fit in Group 1 or 2
   - Song Phi Nong: 2,000 บาท ✓
   - Muang: 3,500 บาท ✓
   TOTAL: ✓ 5,500 บาท

GROUP 4: สินค้าเฉพาะกลุ่ม - 3,200 บาท (reference):
   ✅ Cross-check: Items should fit in Group 1 or 2
   - Rice from supplier: 2,000 บาท ✓
   - Fishing equipment: 1,200 บาท ✓
   TOTAL: ✓ 3,200 บาท

GROUP 5: รายจ่ายอื่นๆ - 3,200 บาท:
   5.1 เงินเดือน - 2,000 บาท ✓
   5.2 โอที - 500 บาท ✓
   5.3 ภาษี - 300 บาท ✓
   5.4 อื่นๆ - 400 บาท ✓
   TOTAL: ✓ 3,200 บาท

TRACKING DATA VERIFICATION: ✅ ALL CORRECT
(Note: Groups 3-5 are for categorization/tracking, verified for consistency)
```

**Step 5: Auditor Adds Verification Notes**
```
auditNotes: "Income/Expense verification completed:

INCOME VERIFICATION: ✅ ALL 6 SOURCES VERIFIED
- Cash Sales: 9,800 บาท (matches /sales/daily-sales)
- Transfer Sales: 4,500 บาท (matches /sales/daily-sales)
- Government Programs: 1,950 บาท (matches /sales/daily-sales)
- Money Transfer Fees: 150 บาท (matches /finance/money-transfer-service)
- Bill Payment Fees: 50 บาท (matches /finance/bill-payment-service)
- Other Cash: 200 บาท (verified with documents)
- Total Income: 16,650 บาท ✓

PRIMARY EXPENSES VERIFICATION: ✅ ALL VERIFIED
- Cash at Store: 4,800 บาท (4 items verified)
  * Vendor purchases: 3,000 บาท ✓
  * Daily wages: 1,200 บาท ✓
  * Daily OT: 300 บาท ✓
  * Water: 300 บาท ✓
- Bank Transfers: 6,800 บาท (5 items verified)
  * Store operation: 1,200 บาท ✓
  * Makro: 2,500 บาท ✓
  * Fresh goods: 1,800 บาท ✓
  * Online: 800 บาท ✓
  * V-Pay: 500 บาท ✓
- Total Primary Expenses: 11,600 บาท ✓

TRACKING CATEGORIES VERIFIED: ✅
- By Location: 5,500 บาท (consistent with Groups 1-2)
- By Product: 3,200 บาท (consistent with Groups 1-2)
- Other Expenses: 3,200 บาท (Salary, OT, Tax, Others)

NET RESULT: 16,650 - 11,600 = 5,050 บาท ✓

All documents verified and correct. Ready for Owner approval."
```

**Step 6: Auditor Updates Status**
```
/finance/daily-expenses → Update Record:
- status: "audited" (changed from "submitted")
- auditedAt: 2026-01-29 18:00:00
- auditedBy: auditor-001
- auditNotes: "Income/Expense verification completed..." (detailed)

[Send notification to Owner]
Owner → Final Approval (Workflow 4.3)
```

---

### Process Flow
```
[Start] → Receive Manager's submitted record
        ↓
     Go to /finance/daily-expenses page
        ↓
     Find "submitted" entries for review
        ↓
     VERIFY INCOME DATA (6 categories):
     ════════════════════════════════════
     1. เงินสดขาย:
        - Cross-check /sales/daily-sales ✓
        ↓
     2. เงินโอนขาย:
        - Cross-check /sales/daily-sales ✓
        ↓
     3. เงินจากโครงการของรัฐ:
        - Cross-check /sales/daily-sales ✓
        ↓
     4. ค่าบริการ Money Transfer:
        - Cross-check /finance/money-transfer-service ✓
        ↓
     5. ค่าบริการ Bill Payment:
        - Cross-check /finance/bill-payment-service ✓
        ↓
     6. เงินสดรับอื่นๆ:
        - Verify with supporting documents ✓
        ↓
     VERIFY PRIMARY EXPENSES (2 main groups):
     ════════════════════════════════════════
     GROUP 1: เงินสดจ่ายหน้าร้าน (4,800 บาท):
        1.1 Check vendor receipts ✓
        1.2 Check payroll records (daily wages) ✓
        1.3 Check OT records (1st & 16th) ✓
        1.4 Check utility bill (water) ✓
        ↓
     GROUP 2: เงินโอนจ่าย (6,800 บาท):
        2.1 Check bank statement ✓
        2.2 Check credit card statement ✓
        2.3 Check delivery receipts ✓
        2.4 Check online order receipts ✓
        2.5 Check V-Pay history ✓
        ↓
     VERIFY TRACKING CATEGORIES (For consistency):
     ═════════════════════════════════════════════
     GROUP 3: แบ่งตามพื้นที่:
        - Verify items fit within Groups 1-2 ✓
        ↓
     GROUP 4: สินค้าเฉพาะกลุ่ม:
        - Verify items fit within Groups 1-2 ✓
        ↓
     GROUP 5: รายจ่ายอื่นๆ:
        - Verify all items with documents ✓
        ↓
     If everything correct:
     - All income sources verified ✓
     - All primary expenses verified ✓
     - All tracking data consistent ✓
     - Add detailed verification notes
     - Click [✏️ Edit]
     - Change status: submitted → "audited"
        ↓
     If discrepancy found:
     - Document discrepancies
     - Add notes explaining issues
     - Return record to Manager for correction
     - Do NOT update status
        ↓
     [Update] → Status = "audited"
        ↓
     Send report to Owner:
     - Income verification summary
     - Expense verification summary
     - Tracking data verification
     - Audit notes
        ↓
     [Complete]
```

### Details
- **Role**: ผู้ตรวจสอบ (Auditor)
- **Page**: /finance/daily-expenses (Daily Income/Expense Review)
- **Time Required**: ~15-20 minutes
- **Success Criteria**:
  - ✅ All 6 income sources verified with source documents
  - ✅ All primary expenses (Groups 1-2) verified with receipts/statements
  - ✅ Tracking categories (Groups 3-5) verified for consistency
  - ✅ Data completeness verified
  - ✅ Clear verification notes with all checks documented
- **Data Checked**:
  - **incomeVerification** (6 sources):
    - cashSalesMatch: Cross-checked with /sales/daily-sales
    - transferSalesMatch: Cross-checked with /sales/daily-sales
    - governmentProgramMatch: Cross-checked with /sales/daily-sales
    - moneyTransferMatch: Cross-checked with /finance/money-transfer-service
    - billPaymentMatch: Cross-checked with /finance/bill-payment-service
    - otherCashVerified: Documents checked
    - governmentProgramMatch: Cross-checked with /sales/daily-sales
    - totalIncomeCorrect: 12,150 บาท confirmed
  
  - **expenseVerification** (Primary Groups 1-2):
    - vendorCashVerified: All receipts checked
    - wagesAndOTVerified: Payroll records checked
    - waterVerified: Utility bill checked
    - storeTransferVerified: Bank statement checked
    - makroVerified: Credit card statement checked
    - freshGoodsVerified: Delivery receipts checked
    - onlineVerified: Order confirmations checked
    - vPayVerified: Transaction history checked
    - totalPrimaryExpensesCorrect: 11,600 บาท confirmed
  
  - **trackingVerification** (Reference Groups 3-5):
    - locationCategoryConsistent: Items fit within Groups 1-2
    - productCategoryConsistent: Items fit within Groups 1-2
    - otherExpensesVerified: All items checked
    - totalTrackingCorrect: All amounts verified

- **Data Updated**:
  - status: "audited" (changed from "submitted")
  - auditedAt: timestamp ปัจจุบัน
  - auditedBy: Auditor ID (ผู้ตรวจสอบ)
  - auditNotes: Detailed verification results with all sources and categories verified
    - Example: "Income/Expense verification completed: All 5 income sources verified (12,150 บาท), Primary expenses verified (Cash 4,800 + Transfer 6,800 = 11,600 บาท), Tracking categories consistent. Net result 550 บาท - APPROVED."

- **Next Step**: Owner final approval (Workflow 4.3)

---

## Workflow 4.3: อนุมัติรายรับ-รายจ่าย (Owner - Approve Income/Expense)

### Real-World Example

**Scenario**: Owner reviews and approves audited income/expense record (12,150 บาท income, 11,600 บาท primary expense from Workflow 4.2)

**Step 1: Owner Receives Auditor's Report**
```
From /finance/daily-expenses → Audited entry:
- Date: 2026-01-29
- Manager: วีระ
- Income Total: 12,150 บาท
- Primary Expenses (Cash + Transfer): 11,600 บาท
- Net Result: 550 บาท
- Status: audited (by Auditor in Workflow 4.2)
- Auditor Notes: "All income sources and expenses verified and correct"
```

**Step 2: Owner Reviews Income Section**
```
INCOME DETAILS (รายรับ):
├─ เงินสดขาย (Cash Sales): 9,800 บาท
│  └─ Verified by: Auditor (matched with /sales/daily-sales)
│
├─ เงินโอนขาย (Transfer Sales): 4,500 บาท
│  └─ Verified by: Auditor (matched with /sales/daily-sales)
│
├─ เงินจากโครงการของรัฐ (Government Programs): 1,950 บาท
│  └─ Verified by: Auditor (matched with /sales/daily-sales)
│
├─ ค่าบริการ Money Transfer: 150 บาท
│  └─ Verified by: Auditor (matched with /finance/money-transfer-service)
│
├─ ค่าบริการ Bill Payment: 50 บาท
│  └─ Verified by: Auditor (matched with /finance/bill-payment-service)
│
├─ เงินสดรับอื่นๆ: 200 บาท
│  └─ Verified by: Auditor (documents checked)
│
└─ Total Income: 16,650 บาท ✓

OWNER CHECK: ✅ All 6 income sources verified by Auditor
```

**Step 3: Owner Reviews Expense Section (Primary)**
```
EXPENSE DETAILS - PRIMARY (เงินสดจ่ายและเงินโอนจ่าย):
├─ GROUP 1: เงินสดจ่ายหน้าร้าน: 4,800 บาท
│  ├─ เงินซื้อสินค้าหน้าร้าน: 3,000 บาท ✓
│  ├─ ค่าจ้างพนักงานรายวัน: 1,200 บาท ✓
│  ├─ โอทีพนักงานรายวัน: 300 บาท ✓
│  └─ ค่าน้ำ: 300 บาท ✓
│
├─ GROUP 2: เงินโอนจ่าย: 6,800 บาท
│  ├─ เงินโอนจ่ายหน้าร้าน: 1,200 บาท ✓
│  ├─ แม็คโคร: 2,500 บาท ✓
│  ├─ ของสด: 1,800 บาท ✓
│  ├─ ออนไลน์: 800 บาท ✓
│  └─ วีเพย์: 500 บาท ✓
│
└─ Total Primary Expenses: 11,600 บาท ✓

OWNER CHECK: ✅ All primary expenses verified by Auditor with receipts/statements
```

**Step 4: Owner Reviews Tracking Data**
```
TRACKING CATEGORIES (แบ่งตามพื้นที่ และ สินค้าเฉพาะกลุ่ม - For Reference):
├─ GROUP 3: แบ่งตามพื้นที่ (By Location):
│  ├─ อำเภอสองพี่น้อง: 2,000 บาท ✓
│  └─ อำเภอเมือง: 3,500 บาท ✓
│
├─ GROUP 4: สินค้าเฉพาะกลุ่ม (By Product):
│  ├─ ข้าวสาร: 2,000 บาท ✓
│  └─ อุปกรณ์ตกปลา: 1,200 บาท ✓
│
└─ GROUP 5: รายจ่ายอื่นๆ (Other Expenses):
   ├─ เงินเดือน: 2,000 บาท ✓
   ├─ โอที: 500 บาท ✓
   ├─ ภาษี: 300 บาท ✓
   └─ อื่นๆ: 400 บาท ✓

NOTE: Groups 3-5 are for categorization/tracking (verified for consistency)
Owner can see all categories for detailed tracking
```

**Step 5: Owner Reviews Auditor's Verification Notes**
```
auditNotes from Auditor: "Income/Expense verification completed:

INCOME: ✅ ALL 6 SOURCES VERIFIED
- Cash Sales: 9,800 (matches /sales/daily-sales)
- Transfer Sales: 4,500 (matches /sales/daily-sales)
- Government Programs: 1,950 (matches /sales/daily-sales)
- Money Transfer Fees: 150 (matches /finance/money-transfer-service)
- Bill Payment Fees: 50 (matches /finance/bill-payment-service)
- Other Cash: 200 (documents verified)
Total: 16,650 บาท ✓

EXPENSES: ✅ ALL PRIMARY ITEMS VERIFIED
- Cash at Store: 4,800 (vendor/wages/OT/water - all receipts checked)
- Bank Transfers: 6,800 (all 5 categories - statements verified)
Total Primary: 11,600 บาท ✓

TRACKING: ✅ CONSISTENT
- By Location: 5,500 บาท (fits within Groups 1-2)
- By Product: 3,200 บาท (fits within Groups 1-2)
- Other Expenses: 3,200 บาท (all items documented)

NET RESULT: 5,050 บาท ✓
All documents verified and correct."

OWNER DECISION: ✅ Everything looks good - Approve
```

**Step 6: Owner Approves & Updates Status**
```
/finance/daily-expenses → Update Record:
- Click [✏️ Edit]
- Change status: audited → "approved"
- Optional: Add approval notes
- Click [อัปเดต]

System auto-updates:
- status: "approved"
- approvedAt: 2026-01-29 18:30:00
- approvedBy: owner-001
- approvalNotes: (optional) "Reviewed and approved. All income and expenses verified."

STATUS: ✅ APPROVED - Daily income/expense recording complete
```

**Step 7: Data Now Available for Reports**
```
Dashboard & Reports Update:
├─ Income Breakdown:
│  ├─ Cash Sales: 9,800 บาท
│  ├─ Transfer Sales: 4,500 บาท
│  ├─ Government Programs: 1,950 บาท
│  ├─ Service Fees: 200 บาท (150 + 50)
│  ├─ Other Cash: 200 บาท
│  └─ Total Income: 16,650 บาท
│
├─ Expense Breakdown:
│  ├─ Cash at Store: 4,800 บาท
│  ├─ Bank Transfers: 6,800 บาท
│  └─ Total Primary: 11,600 บาท
│
├─ Tracking Data:
│  ├─ By Location: 5,500 บาท
│  ├─ By Product: 3,200 บาท
│  └─ Other Expenses: 3,200 บาท
│
└─ Net Result: 550 บาท

Available in:
- /finance/daily-expenses (approved record)
- /finance/cash-flow (updated with today's data)
- /finance/monthly-report (aggregated)
- Dashboard (summary view with all categories)
```

---

### Process Flow
```
[Start] → Review Auditor's report
        ↓
     Check /finance/daily-expenses → "audited" entries
        ↓
     REVIEW INCOME (6 sources):
     ════════════════════════════
     1. เงินสดขาย: 9,800 บาท
        - Auditor verified ✓
     2. เงินโอนขาย: 4,500 บาท
        - Auditor verified ✓
     3. เงินจากโครงการรัฐ: 1,950 บาท
        - Auditor verified ✓
     4. ค่าบริการ Money Transfer: 150 บาท
        - Auditor verified ✓
     5. ค่าบริการ Bill Payment: 50 บาท
        - Auditor verified ✓
     6. เงินสดรับอื่นๆ: 200 บาท
        - Auditor verified ✓
     
     TOTAL INCOME: 16,650 บาท ✓
        ↓
     REVIEW PRIMARY EXPENSES (2 groups):
     ═════════════════════════════════════
     GROUP 1: เงินสดจ่ายหน้าร้าน: 4,800 บาท
        1.1 Vendor purchases: 3,000 บาท (verified) ✓
        1.2 Daily wages: 1,200 บาท (verified) ✓
        1.3 Daily OT: 300 บาท (verified) ✓
        1.4 Water: 300 บาท (verified) ✓
        ↓
     GROUP 2: เงินโอนจ่าย: 6,800 บาท
        2.1 Store operation: 1,200 บาท (verified) ✓
        2.2 Makro: 2,500 บาท (verified) ✓
        2.3 Fresh goods: 1,800 บาท (verified) ✓
        2.4 Online: 800 บาท (verified) ✓
        2.5 V-Pay: 500 บาท (verified) ✓
     
     TOTAL PRIMARY EXPENSES: 11,600 บาท ✓
        ↓
     REVIEW TRACKING CATEGORIES (Reference):
     ══════════════════════════════════════
     GROUP 3: By Location
        - Song Phi Nong: 2,000 บาท ✓
        - Muang: 3,500 บาท ✓
        ↓
     GROUP 4: By Product
        - Rice: 2,000 บาท ✓
        - Fishing equipment: 1,200 บาท ✓
        ↓
     GROUP 5: Other Expenses
        - Salary: 2,000 บาท ✓
        - OT: 500 บาท ✓
        - Tax: 300 บาท ✓
        - Others: 400 บาท ✓
        ↓
     REVIEW AUDITOR'S NOTES:
     ═══════════════════════
     - All 6 income sources verified? → Yes ✓
     - All primary expenses verified? → Yes ✓
     - All tracking data consistent? → Yes ✓
     - Any issues or discrepancies? → No ✓
        ↓
     Make Decision:
     - Everything correct? → APPROVE
     - Need to reject? → Add rejection notes
        ↓
     Click [✏️ Edit]
        ↓
     Change status: audited → "approved"
        ↓
     Add approval notes (optional):
     - "Reviewed and approved. All verified."
        ↓
     Click [อัปเดต]
        ↓
     [Complete] → Status = "approved"
        ↓
     Data now available for:
     - Dashboard
     - /finance/cash-flow
     - /finance/monthly-report
     - Analysis & planning
     - Categorized reports
        ↓
     Daily income/expense recording ✓
```

### Details
- **Role**: เจ้าของร้าน (Owner)
- **Page**: /finance/daily-expenses (Daily Income/Expense Review)
- **Time Required**: ~10-15 minutes
- **Success Criteria**:
  - ✅ All 5 income sources reviewed and verified by Auditor
  - ✅ All primary expenses reviewed and verified by Auditor
  - ✅ All tracking categories reviewed
  - ✅ Auditor notes reviewed
  - ✅ Final decision documented
  - ✅ Status updated to "approved"
- **Data Reviewed**:
  - **incomeReview** (5 sources):
    - Cash Sales: 9,800 บาท (verified by Auditor)
    - Money Transfer Fees: 150 บาท (verified by Auditor)
    - Bill Payment Fees: 50 บาท (verified by Auditor)
    - Other Cash: 200 บาท (verified by Auditor)
    - Government Programs: 1,950 บาท (verified by Auditor)
    - Total Income: 12,150 บาท
  
  - **expenseReview** (Primary):
    - Cash at Store: 4,800 บาท (verified)
      * Vendor purchases: 3,000 บาท
      * Daily wages/OT: 1,500 บาท
      * Water: 300 บาท
    - Bank Transfers: 6,800 บาท (verified)
      * Store operation: 1,200 บาท
      * Makro: 2,500 บาท
      * Fresh goods: 1,800 บาท
      * Online: 800 บาท
      * V-Pay: 500 บาท
    - Total Primary: 11,600 บาท
  
  - **trackingReview** (Reference categories):
    - By Location: 5,500 บาท (verified for consistency)
    - By Product: 3,200 บาท (verified for consistency)
    - Other Expenses: 3,200 บาท (verified)
  
  - **auditReview**:
    - Read Auditor's verification notes
    - Check all income sources verified
    - Check all expenses verified
    - Confirm tracking data consistent
    - Confirm no discrepancies

- **Data Updated**:
  - status: "approved" (changed from "audited")
  - approvedAt: timestamp ปัจจุบัน
  - approvedBy: Owner ID (ผู้อนุมัติ)
  - approvalNotes: (optional) Final comments from Owner

- **Result**: ✅ Daily income/expense recording complete & ready for reports/analysis with full categorization data

---

# 💳 CASH FLOW MANAGEMENT: Income & Expense Flow (การจัดการกระแสเงินสด)

## Overview: Daily Cash Flow Structure

### 🔄 Income Sources & Allocation (แหล่งเงินและการจัดสรร)

```
INCOME DAILY:
├─ เงินสด (Cash):
│  ├─ Cash Sales (รวมทุก Cashier)
│  ├─ Service Fee Cash (Money Transfer)
│  ├─ Bill Payment Fees
│  └─ Other Cash Income
│  └─ → สะสมเป็น "Cash Reserve" สำหรับจ่าย Expense Group 1, 3, 4, 5
│
└─ เงินโอน (Transfer):
   ├─ Service Fee Transfer (Money Transfer)
   ├─ Government Programs
   └─ → สะสมเป็น "Transfer Reserve" สำหรับจ่าย Expense Group 2
```

### 💰 Daily Cash Allocation (การจัดสรรเงินสดรายวัน)

```
OPENING BALANCE (วันนี้):
├─ "เงินสดซื้อสินค้าวันถัดไป" จากเมื่อวาน (Previous NextDay Reserve)
│  └─ ตัวอย่าง: 5,400 บาท
├─ + Cash Income (วันนี้)
│  └─ ตัวอย่าง: 17,592 บาท
└─ = Total Cash Available
   └─ ตัวอย่าง: 22,992 บาท

CASH OUTFLOW (วันนี้):
├─ Expense Group 1: vendor/wages/OT/water
│  └─ ตัวอย่าง: 6,765 บาท
├─ Expense Group 3: allocation by location (~2,500 บาท/day)
├─ Expense Group 4: specific product (~1,500 บาท/day)
├─ Expense Group 5: other expenses (~2,300 บาท/day)
└─ ± Borrowed Advance (if needed)
   └─ ตัวอย่าง: 4,000 บาท ⚠️

NEXTDAY RESERVE (สำหรับวันถัดไป):
├─ Formula: = Total Cash Available - Total Cash Outflow
│  └─ ตัวอย่าง: 22,992 - 13,065 = 9,927 บาท
├─ Round down < 100: = 9,900 บาท
└─ จะใช้เป็น Opening Balance ของวันถัดไป
```

---

## ⚠️ Borrowed Advance: Cash Flow Issue Indicator (ตัวชี้วัดปัญหา)

### What is Borrowed Advance?

```
เมื่อเงินสด (Cash Reserve) ไม่พอจ่าย Expense Group 1
→ ต้องยืมจาก Cash Sales
→ เรียกว่า "Borrowed Advance"
```

### ตัวอย่าง: Borrowed Advance เกิดขึ้น

```
วันที่ 31/1/2026:
├─ Opening Balance: 5,400 บาท
├─ + Cash Income: 17,592 บาท
├─ = Cash Available: 22,992 บาท
│
├─ Expense Group 1 needed: 6,765 บาท
├─ BUT: Opening Balance (5,400) + Today's Cash (17,592) - Group 3/4/5 (6,300)
│        = 16,692 บาท available ONLY
├─ Since Expense Group 1 = 6,765 บาท
└─ ❌ SHORT: 6,765 - 16,692 = ไม่ขาด (ตัวอย่างนี้ไม่ขาด)

วันเปิด (เช่น มี Opening Balance 1,000 บาท ต่ำ):
├─ Opening Balance: 1,000 บาท
├─ + Cash Income: 10,000 บาท
├─ = Cash Available: 11,000 บาท
│
├─ Expense Group 1 needed: 6,765 บาท ✓ พอ
├─ Expense Group 3: 2,500 บาท ✓ พอ
├─ Expense Group 4: 1,500 บาท ✓ พอ
├─ Expense Group 5: 2,300 บาท ✓ พอ
├─ = Total needed: 13,065 บาท
├─ ❌ SHORT: 11,000 - 13,065 = -2,065 บาท
│
└─ SOLUTION: Borrow 2,065 บาท from NextDay Reserve
   → Borrowed Advance = 2,065 บาท
```

### ⚠️ Borrowed Advance Analysis (วิเคราะห์ปัญหา)

```
ตัวอย่าง: เดือนมกราคม (31 วัน)
├─ Total Borrowed Advance (ทั้งเดือน): 31,000 บาท
├─ Average per day: 31,000 / 31 = 1,000 บาท/วัน
│
└─ 🚨 ISSUE: "ต้อง Borrowed Advance วันละ 1,000 บาท"
   ├─ Root Cause: รายรับไม่เพียงพอสำหรับค่าใช้จ่ายที่เกิดขึ้น
   ├─ Impact: "เงินสดซื้อสินค้าวันถัดไป" ลดลงตลอดเดือน
   └─ Action: ต้องหาวิธีจัดการลด Borrowed Advance ให้เป็น 0 บาท
```

### 💡 How to Reduce Borrowed Advance

```
วิธีแก้ไข:
├─ ❶ เพิ่ม Cash Income:
│  ├─ เพิ่มยอดขาย (Cash Sales)
│  ├─ เพิ่ม Service Fee Income
│  └─ เพิ่ม Other Income
│
├─ ❷ ลด Expense Groups:
│  ├─ ลด Group 3 (location allocation)
│  ├─ ลด Group 4 (product category)
│  ├─ ลด Group 5 (other expenses)
│  └─ จัดการ Group 1 ให้เหมาะสม
│
└─ ❸ ปรับแต่ง NextDay Reserve:
   ├─ รักษา Opening Balance ให้สูงพอ
   └─ เงินสดขายสินค้าต้องเพียงพอ > ค่าใช้จ่ายรวม
```

### 📊 Month-End Closing: Borrowed Advance Reporting

```
สิ้นเดือน (31/1/2026):

OPENING BALANCE (เดือนถัดไป):
├─ "เงินสดซื้อสินค้าวันถัดไป" (คงเหลือ): 9,900 บาท
└─ → บันทึกเป็น Opening Balance (1/2/2026)

CASH FLOW ISSUE REPORT (สำหรับบทวิเคราะห์):
├─ Total Borrowed Advance: 31,000 บาท
├─ Days in month: 31 วัน
├─ Average per day: 1,000 บาท/วัน
│
└─ ⚠️ ALERT:
   ├─ Status: "มีปัญหาจัดการกระแสเงิน"
   ├─ Cause: "รายรับไม่เพียงพอค่าใช้จ่าย"
   ├─ Impact: "ต้อง Borrowed Advance แต่ละวัน"
   └─ Action Required: "ปรับปรุงกระแสเงินสดในเดือนถัดไป"

NOTE: Borrowed Advance ไม่นำมารวมกับ Opening Balance
      → ใช้สำหรับตรวจสอบและปรับปรุงเท่านั้น
```

---

## Workflow 3: ดูรายงาน (Owner - View Reports)

### Process Flow
```
[Start] → Login to system
        ↓
     Dashboard shows:
     - Daily sales (from /sales/daily-sales)
     - Daily income & expenses (from /finance/daily-expenses)
     - Cash flow analysis
     - Comparison graphs
        ↓
     [Choose additional reports]
     - Daily sales report (/sales/sales-report)
     - Daily expense report (/finance/daily-expenses)
     - Cash flow report (/finance/cash-flow)
     - Monthly report (/finance/monthly-report)
     - Audit reports (history)
        ↓
     [Export data] (if needed)
     - Export to Google Sheets
     - Export to PDF
        ↓
     [Review & Analyze]
     - Identify trends
     - Check for anomalies
     - Plan next actions
        ↓
     [Complete]
```

### Details
- **Role**: เจ้าของร้าน (Owner)
- **Pages**: 
  - Dashboard (/)
  - /sales/sales-report
  - /finance/daily-expenses
  - /finance/cash-flow
  - /finance/monthly-report
- **Time Required**: ~5-10 minutes (viewing)
- **Success Criteria**:
  - ✅ Clear summary view
  - ✅ Easy-to-read graphs and numbers
  - ✅ Drill-down capability
  - ✅ Convenient export
- **Data Displayed**:
  - Income summary
  - Expense summary
  - Cash flow data
  - Comparison metrics
  - Trends and patterns
  - Historical audit records

---

# 📋 Summary: Data Flow Between Four Flows

```
FLOW 1: Daily Cash Reconciliation        FLOW 2: Money Transfer Service Income
════════════════════════════════════════════════════════════════════════════════
Cashier                                  Manager
  ↓ (puts cash in bag)                     ↓ (counts transfer income)
Manager/Assistant                        Auditor (verifies in /finance/money-transfer-service)
  ↓ (verifies & hands to auditor)          ↓
Auditor (records in /sales/daily-sales)  Owner (approves)
  ↓                                        ↓
Owner (approves in /sales/daily-sales)   Money Transfer Service Income ✓
  ↓
Daily Sales Data ✓

FLOW 3: Bill Payment Service Income      FLOW 4: Daily Income/Expense Recording
════════════════════════════════════════════════════════════════════════════════
Manager                                  Manager
  ↓ (counts bill payment income)           ↓ (records from Flows 1,2,3 + expenses)
Auditor (verifies in /finance/bill-payment-service)  Auditor (verifies)
  ↓                                        ↓
Owner (approves)                         Owner (approves)
  ↓                                        ↓
Bill Payment Service Income ✓            Daily Income/Expense Data ✓

         All flows merge at Owner level
              ↓
        Owner Views Reports & Analyzes
        Dashboard shows combined data from all flows
```

---

# 🎯 Key Differences

| Aspect | FLOW 1 | FLOW 2 | FLOW 3 | FLOW 4 |
|--------|--------|--------|--------|---------|
| **Purpose** | นับและตรวจสอบเงินจริง | นับและตรวจสอบโอนเงิน | นับและตรวจสอบชำระบิล | บันทึกรายรับ-รายจ่าย |
| **Data Source** | Physical cash + POS | Bank statement | Transaction log | Manager entry + all flows |
| **Primary Actor** | Cashier → Manager → Auditor | Manager → Auditor | Manager → Auditor | Manager → Auditor |
| **Page** | /sales/daily-sales | /finance/money-transfer-service | /finance/bill-payment-service | /finance/daily-expenses |
| **Status Type** | draft → submitted → approved | submitted → audited → approved | submitted → audited → approved | submitted → audited → approved |
| **Main Check** | Physical cash vs POS | Bank transfers correctness | Bill payment correctness | All income & expense correctness |
| **Approval Chain** | Auditor records → Owner approves | Manager records → Auditor checks → Owner | Manager records → Auditor checks → Owner | Manager records → Auditor checks → Owner |
| **Output** | Daily Sales Report | Money Transfer Income Report | Bill Payment Income Report | Daily Expense Report |

---

**Source**: Updated based on business requirements clarification (Jan 30, 2026)  
**Last Updated**: Jan 30, 2026  
**Version**: 3.0  
**Status**: ✅ Clarified with four distinct flows (Cash Reconciliation, Money Transfer Service, Bill Payment Service, Daily Income/Expense)

