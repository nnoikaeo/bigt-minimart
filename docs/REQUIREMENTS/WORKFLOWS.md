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
   - Check Bank statement → Shows 3,100 บาท
   - vs POS expected: 3,000 บาท
   ✓ Bank over: +100 บาท

3. Government Programs:
   - Check POS system → Shows 1,950 บาท
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

## Workflow 2.1: นับเงินจากบริการโอนเงิน (Manager - Count Money Transfer Service Income)

### Real-World Example

**Scenario**: Manager counts daily money transfer service income and records in app

**Step 1: Record Transfer Records (บันทึก transaction)**
```
Recorded in /finance/money-transfer-service:

DATE: 2026-01-29

INITIAL BALANCES:
1) เงินในบัญชี (Bank Account Balance): 10,000 บาท
2) เงินสดจากการโอนเงิน/ถอนเงิน (Cash from Transfer/Withdrawal): 0 บาท
3) เงินสดค่าบริการโอนเงิน/ถอนเงิน (Service Fee Cash): 0 บาท
4) เงินโอนค่าบริการถอนเงิน (Service Fee Transfer): 0 บาท

TRANSACTION RECORDS (รายการตรวจสอบการโอนเงิน):

Transaction 1: PromptPay Transfer from Customer A
   - Date: 2026-01-29 10:30 AM
   - Amount: 2,000 บาท
   - Commission: 20 บาท (paid in cash)
   - Result:
     1) 10,000 - 2,000 = 8,000 บาท (transfer out)
     2) 0 + 2,000 = 2,000 บาท (cash in)
     3) 0 + 20 = 20 บาท (service fee cash)
     4) 0 บาท (no change)

Transaction 2: Cash Withdrawal from Customer B
   - Date: 2026-01-29 01:15 PM
   - Amount: 500 บาท (customer withdraws)
   - Commission: 10 บาท (paid in cash)
   - Result:
     1) 8,000 + 500 = 8,500 บาท (withdrawal = deposit)
     2) 2,000 - 500 = 1,500 บาท (cash out)
     3) 20 + 10 = 30 บาท (service fee cash)
     4) 0 บาท (no change)

Transaction 3: Bank Transfer from Customer C (FAILED)
   - Date: 2026-01-29 02:00 PM
   - Amount: 8,800 บาท (requested)
   - Status: ❌ FAILED - Insufficient funds in account (8,500 < 8,800)
   - Result: No change to any balance (transaction rejected)
     1) 8,500 บาท (no change)
     2) 1,500 บาท (no change)
     3) 30 บาท (no change)
     4) 0 บาท (no change)

Transaction 4: Owner Deposit (ฝากเงิน)
   - Date: 2026-01-29 02:30 PM
   - Amount: 10,000 บาท (Owner deposits to business account)
   - Commission: 0 บาท (no fee for owner deposit)
   - Result:
     1) 8,500 + 10,000 = 18,500 บาท (deposit in)
     2) 1,500 บาท (no change)
     3) 30 บาท (no change)
     4) 0 บาท (no change)

Transaction 5: Bank Transfer from Customer C (RETRY - SUCCESS)
   - Date: 2026-01-29 02:45 PM
   - Amount: 8,800 บาท (now succeeds)
   - Commission: 40 บาท (paid in cash)
   - Result:
     1) 18,500 - 8,800 = 9,700 บาท (transfer out)
     2) 1,500 + 8,800 = 10,300 บาท (cash in)
     3) 30 + 40 = 70 บาท (service fee cash)
     4) 0 บาท (no change)

Transaction 6: Cash Withdrawal from Customer D
   - Date: 2026-01-29 03:30 PM
   - Amount: 500 บาท (customer withdraws)
   - Commission: 10 บาท (paid via transfer)
   - Result:
     1) 9,700 + 500 + 10 = 10,210 บาท (withdrawal + commission transfer)
     2) 10,300 - 500 = 9,800 บาท (cash out)
     3) 70 บาท (no change)
     4) 0 + 10 = 10 บาท (service fee transfer)

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

**Step 2: Count All Cash & Record in App (นับเงินสด)**
```
Manager counts cash from money transfer service:

A. CASH TRANSFER SECTION (เงินสดจากการโอนเงิน):
   Cash from PromptPay transfers: 2,500 บาท
   - Record in app: ✓ Deposit amount 2,500 บาท
   
   Cash from Bank Account transfers: 1,800 บาท
   - Record in app: ✓ Deposit amount 1,800 บาท

B. SERVICE FEE SECTION (เงินสดจากค่าบริการโอนเงิน):
   Service fees from PromptPay: 250 บาท
   - Record in app: ✓ Service fee 250 บาท
   
   Service fees from Bank Account: 180 บาท
   - Record in app: ✓ Service fee 180 บาท

TOTAL CASH COUNTED: 2,500 + 1,800 + 250 + 180 = 4,730 บาท
```

**Step 3: Record in System**
```
/finance/money-transfer-service → New Record:
- date: 2026-01-29
- managerId: manager-001
- managerName: วีระ

ACCOUNT BALANCE TRACKING:
- initialBankBalance: 10,000 บาท
- finalBankBalance: 8,210 บาท
- bankBalanceChange: -1,790 บาท (net outflow)

TRANSFER/WITHDRAWAL DATA:
- totalTransfersOut: 2,000 + 800 = 2,800 บาท
- totalWithdrawalsIn: 500 + 500 = 1,000 บาท
- netBankChange: 1,000 - 2,800 + 10 (commission transfer) = -1,790 บาท

CASH ACCOUNTS:
- transferWithdrawalCash: 1,800 บาท
  * Transfers received: 2,000 + 800 = 2,800 บาท
  * Withdrawals paid: 500 + 500 = 1,000 บาท
  
- serviceFeesCash: 40 บาท
  * Commission from all cash transactions: 20 + 10 + 10 = 40 บาท
  
- serviceFeesTransfer: 10 บาท
  * Commission from transfer transactions: 10 บาท

TRANSACTION RECORDS:
- numberOfTransactions: 4
  * Transfers (incoming): 2
  * Withdrawals (outgoing): 2
- totalCommissionCollected: 50 บาท (40 cash + 10 transfer)

SUMMARY:
- totalCashOnHand: 1,800 + 40 = 1,840 บาท
- accountBalance: 8,210 บาท
- totalMoneyManaged: 1,840 + 8,210 = 10,050 บาท
  (includes all cash and bank balance)

managerNotes: "4 transfer/withdrawal transactions processed. Bank balance 8,210 บาท. Cash on hand 1,840 บาท."
status: "submitted" (auto-set)
submittedAt: 2026-01-29 16:00:00
submittedBy: manager-001

[Send notification to Auditor]
Auditor → Verify & Check (Workflow 2.2)
```

---

### Process Flow
```
[Start] → Count all cash from money transfer service
        ↓
     COUNT CASH & RECORD IN APP:
     1. Count cash from transfer section (เงินสดจากการโอนเงิน):
        - PromptPay cash in: 2,500 บาท
          * Record in app: Transfer amount
        - Bank account cash in: 1,800 บาท
          * Record in app: Transfer amount
        ↓
     2. Count cash from service fee section (เงินสดจากค่าบริการ):
        - PromptPay service fees: 250 บาท
          * Record in app: Service fee amount
        - Bank service fees: 180 บาท
          * Record in app: Service fee amount
        ↓
     TOTAL CASH COUNTED: 4,730 บาท
        ↓
     RECORD DEPOSIT/WITHDRAWAL/SERVICE RECORDS:
     1. List all transfer records (ฝากเงิน/ถอนเงิน):
        - PromptPay Transfer 1: 2,000 บาท (commission 40)
        - PromptPay Transfer 2: 500 บาท (commission 10)
        - Bank Transfer 1: 1,800 บาท (commission 180)
        - Total: 3 transactions
        ↓
     2. Record all data in system:
        - Go to /finance/money-transfer-service
        - Click "บันทึกใหม่"
        - Enter transfer cash: 4,300 บาท
        - Enter service fees: 430 บาท
        - Enter transfer records: 3 transactions
        - Add manager notes
        - Status = "submitted"
        ↓
     [Submit] → Data recorded in system
        ↓
     Send summary to Auditor:
     - Total transfer cash: 4,300 บาท
     - Total service fees: 430 บาท
     - Transfer records: 3
     - Manager notes
        ↓
     [Complete]
```

### Details
- **Role**: ผู้จัดการหรือผู้ช่วยผู้จัดการ (Manager/Assistant Manager)
- **Page**: /finance/money-transfer-service (Money Transfer Service Income Recording)
- **Time Required**: ~10-15 minutes
- **Success Criteria**:
  - ✅ All transfer transactions reviewed and counted
  - ✅ Cash from transfers recorded (separated by type)
  - ✅ Service fees recorded
  - ✅ All deposit/withdrawal records documented
  - ✅ Data recorded with clear breakdown
  - ✅ Manager notes added
- **Data Recorded**:
  - Date: วันที่นับ (e.g., 2026-01-29)
  - Manager: ชื่อผู้จัดการ
  - **transferCashData** (เงินสดจากการโอนเงิน):
    - promptPayCashIn: เงินสดจากโอน PromptPay (e.g., 2,500 บาท)
    - bankTransferCashIn: เงินสดจากโอนธนาคาร (e.g., 1,800 บาท)
    - totalTransferCashIn: รวมเงินสดจากโอน (e.g., 4,300 บาท)
  - **serviceFeeData** (ค่าบริการโอนเงิน):
    - promptPayCommission: ค่าบริการ PromptPay (e.g., 250 บาท)
    - bankTransferCommission: ค่าบริการธนาคาร (e.g., 180 บาท)
    - totalServiceCommission: รวมค่าบริการ (e.g., 430 บาท)
  - **transferRecords** (รายการฝากเงิน/ถอนเงิน/ค่าบริการ):
    - numberOfPromptPayTransfers: จำนวนโอน PromptPay (e.g., 2)
    - numberOfBankTransfers: จำนวนโอนธนาคาร (e.g., 1)
    - totalTransactionsProcessed: รวมรายการทั้งหมด (e.g., 3)
    - transferDetails: รายละเอียดแต่ละรายการ (date, amount, commission)
  - **summary**:
    - transferCashTotal: 4,300 บาท
    - serviceFeeTotal: 430 บาท
    - grandTotal: รวมทั้งสิ้น (e.g., 4,730 บาท)
  - managerNotes: (หมายเหตุ เช่น "All transfer records counted and recorded")
  - status: "submitted" (ระบบตั้งอัตโนมัติ)
  - submittedAt: timestamp ปัจจุบัน
  - submittedBy: Manager ID
- **Next Step**: Auditor verify and approve

---

## Workflow 2.2: ตรวจสอบเงินจากบริการโอนเงิน (Auditor - Verify Money Transfer Service Income)

### Process Flow
```
[Start] → Receive Manager's submitted record
        ↓
     Go to /finance/money-transfer-service
        ↓
     Verify transfer amounts:
     - Cross-check with bank statement
     - Verify each type of transfer
     - Check for missing transactions
        ↓
     Verify actual amount:
     - Amount should match bank balance
     - No discrepancies? ✓
        ↓
     If everything correct:
     - Add verification notes
     - Change status: submitted → "audited"
        ↓
     If discrepancy found:
     - Add notes explaining issues
     - Return to Manager for correction
        ↓
     [Update] → Status = "audited"
        ↓
     Send report to Owner
        ↓
     [Complete]
```

### Details
- **Role**: ผู้ตรวจสอบ (Auditor)
- **Page**: /finance/money-transfer-service (Money Transfer Service Review)
- **Time Required**: ~10 minutes
- **Success Criteria**:
  - ✅ All transfers verified with bank statement
  - ✅ Total amount matches
  - ✅ No missing transactions
  - ✅ Clear verification notes
- **Data Updated**:
  - status: "audited"
  - auditedAt: timestamp
  - auditedBy: Auditor ID
  - auditNotes: verification details
- **Next Step**: Owner final approval

---

## Workflow 2.3: อนุมัติการตรวจสอบเงินจากบริการโอนเงิน (Owner - Approve Money Transfer Service Income)

### Process Flow
```
[Start] → Review Auditor's report
        ↓
     Check /finance/money-transfer-service → "audited" entries
        ↓
     Review:
     - Transfer amounts breakdown
     - Total transfer service income
     - Audit verification notes
        ↓
     Verify everything correct?
        ↓
     Click [✏️ Edit]
        ↓
     Change status: audited → "approved"
        ↓
     Click [อัปเดต]
        ↓
     [Complete] → Status = "approved"
        ↓
     Money transfer service income recorded ✓
```

### Details
- **Role**: เจ้าของร้าน (Owner)
- **Page**: /finance/money-transfer-service (Money Transfer Service Review)
- **Time Required**: ~5 minutes
- **Success Criteria**:
  - ✅ All data reviewed and verified by Auditor
  - ✅ Final decision documented
- **Data Updated**:
  - status: "approved"
  - approvedAt: timestamp
  - approvedBy: Owner ID
- **Result**: ✅ Money transfer service income recorded

---

# 💰 FLOW 3: Daily Bill Payment Service Income (นับและตรวจสอบเงินจากบริการรับชำระบิล)

## Workflow 3.1: นับเงินจากบริการรับชำระบิล (Manager - Count Bill Payment Service Income)

### Real-World Example

**Scenario**: Manager counts daily bill payment service income and records in app

**Step 1: Record Transaction Records (บันทึก transaction)**
```
Recorded in /finance/bill-payment-service:

DATE: 2026-01-29

INITIAL BALANCES:
1) เงินในบัญชี (Bank Account Balance): 3,000 บาท
2) เงินสดจากบริการรับชำระบิล (Cash from Bill Payment Service): 0 บาท
3) เงินสดค่าบริการรับชำระบิล (Service Fee Cash): 0 บาท

TRANSACTION RECORDS (รายการชำระบิล):

Transaction 1: Bill Payment - Utility Bill
   - Date: 2026-01-29 11:30 AM
   - Amount: 2,000 บาท (customer pays)
   - Commission: 20 บาท (paid in cash)
   - Result:
     1) 3,000 - 2,000 = 1,000 บาท (bill out)
     2) 0 + 2,000 = 2,000 บาท (cash in)
     3) 0 + 20 = 20 บาท (service fee cash)

Transaction 2: Bill Payment - Telecom Bill (FAILED)
   - Date: 2026-01-29 01:45 PM
   - Amount: 1,200 บาท (requested)
   - Status: ❌ FAILED - Insufficient funds in account (1,000 < 1,200)
   - Result: No change to any balance (transaction rejected)
     1) 1,000 บาท (no change)
     2) 2,000 บาท (no change)
     3) 20 บาท (no change)

Transaction 3: Owner Deposit (ฝากเงิน)
   - Date: 2026-01-29 02:15 PM
   - Amount: 5,000 บาท (Owner deposits to business account)
   - Commission: 0 บาท (no fee for owner deposit)
   - Result:
     1) 1,000 + 5,000 = 6,000 บาท (deposit in)
     2) 2,000 บาท (no change)
     3) 20 บาท (no change)

Transaction 4: Bill Payment - Telecom Bill (RETRY - SUCCESS)
   - Date: 2026-01-29 02:30 PM
   - Amount: 1,200 บาท (now succeeds)
   - Commission: 20 บาท (paid in cash)
   - Result:
     1) 6,000 - 1,200 = 4,800 บาท (bill out)
     2) 2,000 + 1,200 = 3,200 บาท (cash in)
     3) 20 + 20 = 40 บาท (service fee cash)

FINAL BALANCES SUMMARY:
1) เงินในบัญชี (Bank Account): 4,800 บาท
   - In: 5,000 บาท (owner deposit)
   - Out: 2,000 + 1,200 = 3,200 บาท (bill payments)
   - Calc: 3,000 + 5,000 - 3,200 = 4,800 บาท ✓

2) เงินสดจากบริการรับชำระบิล (Cash from Bill Payment): 3,200 บาท
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

**Step 2: Count All Cash & Record in App (นับเงินสด)**
```
Manager counts cash from bill payment service:

A. CASH FROM BILL PAYMENT SECTION (เงินสดจากการชำระบิล):
   Cash from utility bills: 2,000 บาท
   - Record in app: ✓ Bill payment amount 2,000 บาท
   
   Cash from telecom bills: 800 บาท
   - Record in app: ✓ Bill payment amount 800 บาท

B. SERVICE FEE SECTION (เงินสดจากค่าบริการรับชำระบิล):
   Service fees from bill payments: 30 บาท
   - Record in app: ✓ Service fee 30 บาท

TOTAL CASH COUNTED: 2,000 + 800 + 30 = 2,830 บาท
```

**Step 3: Record in System**
```
/finance/bill-payment-service → New Record:
- date: 2026-01-29
- managerId: manager-001
- managerName: วีระ

ACCOUNT BALANCE TRACKING:
- initialBankBalance: 5,000 บาท
- finalBankBalance: 2,200 บาท
- bankBalanceChange: -2,800 บาท (net outflow for bills)

BILL PAYMENT DATA:
- totalBillPaymentsOut: 2,000 + 800 = 2,800 บาท
- billPaymentTypes:
  * Utility bills: 2,000 บาท
  * Telecom bills: 800 บาท
  * Insurance/Other: 0 บาท

CASH ACCOUNTS:
- billPaymentCash: 2,800 บาท
  * Bill payments received in cash: 2,000 + 800 = 2,800 บาท
  
- serviceFeeCash: 30 บาท
  * Commission from all cash transactions: 20 + 10 = 30 บาท

TRANSACTION RECORDS:
- numberOfTransactions: 2
  * Utility bills: 1
  * Telecom bills: 1
- totalCommissionCollected: 30 บาท (all in cash)

SUMMARY:
- totalCashOnHand: 2,800 + 30 = 2,830 บาท
- accountBalance: 2,200 บาท
- totalMoneyManaged: 2,830 + 2,200 = 5,030 บาท
  (includes all cash and bank balance)

managerNotes: "2 bill payment transactions processed. Bank balance 2,200 บาท. Cash on hand 2,830 บาท."
status: "submitted" (auto-set)
submittedAt: 2026-01-29 16:00:00
submittedBy: manager-001

[Send notification to Auditor]
Auditor → Verify & Check (Workflow 3.2)
```

---

### Process Flow
```
[Start] → Go to bill payment transaction log
        ↓
     Check bill payment service transactions:
     - Review all bill payments received
     - Sum up total from bill payment services
        ↓
     Count actual amount:
     - Amount collected from bill payments: XXX บาท
     - Cross-check with transaction log
        ↓
     Count by transaction type:
     - Utility bill payments (water, electricity): X บาท
     - Telecom bill payments: Y บาท
     - Insurance payments: Z บาท
     - Other bill types: W บาท
        ↓
     [Calculate total]:
     - Total bill payment service income: (X + Y + Z + W) บาท
        ↓
     Add manager notes (if needed):
     - Any discrepancies?
     - Any failed transactions?
        ↓
     Record in system:
     - Go to /finance/bill-payment-service
     - Click "บันทึกใหม่"
     - Enter date, amounts, notes
     - Status = "submitted"
        ↓
     [Submit] → Data recorded in system
        ↓
     Send summary to Auditor
        ↓
     [Complete]
```

### Details
- **Role**: ผู้จัดการหรือผู้ช่วยผู้จัดการ (Manager/Assistant Manager)
- **Page**: /finance/bill-payment-service (Bill Payment Service Income Recording)
- **Time Required**: ~5-10 minutes
- **Success Criteria**:
  - ✅ All bill payment transactions reviewed
  - ✅ Actual amounts verified with transaction log
  - ✅ Data recorded with clear breakdown
  - ✅ Notes added (if any discrepancies)
- **Data Recorded**:
  - Date: วันที่นับ (e.g., 2026-01-29)
  - Manager: ชื่อผู้จัดการ
  - **billPaymentServiceIncome**:
    - utilityBillPayments: ชำระบิลสาธารณูปโภค (e.g., 1,500 บาท)
    - telecomBillPayments: ชำระบิลโทรศัพท์ (e.g., 800 บาท)
    - insurancePayments: ชำระบิลประกันภัย (e.g., 600 บาท)
    - otherBillTypes: ชำระบิลอื่น (if any)
    - totalBillPaymentIncome: รวมเงินบริการรับชำระบิล (e.g., 2,900 บาท)
  - managerNotes: (if any discrepancies or failed transactions)
  - status: "submitted" (ระบบตั้งอัตโนมัติ)
  - submittedAt: timestamp
  - submittedBy: Manager ID
- **Next Step**: Auditor verify and approve

---

## Workflow 3.2: ตรวจสอบเงินจากบริการรับชำระบิล (Auditor - Verify Bill Payment Service Income)

### Process Flow
```
[Start] → Receive Manager's submitted record
        ↓
     Go to /finance/bill-payment-service
        ↓
     Verify bill payment amounts:
     - Cross-check with transaction log
     - Verify each type of bill payment
     - Check for failed or pending transactions
        ↓
     Verify actual amount:
     - Total should match transaction log
     - No discrepancies? ✓
        ↓
     If everything correct:
     - Add verification notes
     - Change status: submitted → "audited"
        ↓
     If discrepancy found:
     - Add notes explaining issues
     - Return to Manager for correction
        ↓
     [Update] → Status = "audited"
        ↓
     Send report to Owner
        ↓
     [Complete]
```

### Details
- **Role**: ผู้ตรวจสอบ (Auditor)
- **Page**: /finance/bill-payment-service (Bill Payment Service Review)
- **Time Required**: ~10 minutes
- **Success Criteria**:
  - ✅ All bill payments verified with transaction log
  - ✅ Total amount matches
  - ✅ No missing or failed transactions
  - ✅ Clear verification notes
- **Data Updated**:
  - status: "audited"
  - auditedAt: timestamp
  - auditedBy: Auditor ID
  - auditNotes: verification details
- **Next Step**: Owner final approval

---

## Workflow 3.3: อนุมัติการตรวจสอบเงินจากบริการรับชำระบิล (Owner - Approve Bill Payment Service Income)

### Process Flow
```
[Start] → Review Auditor's report
        ↓
     Check /finance/bill-payment-service → "audited" entries
        ↓
     Review:
     - Bill payment amounts breakdown
     - Total bill payment service income
     - Audit verification notes
        ↓
     Verify everything correct?
        ↓
     Click [✏️ Edit]
        ↓
     Change status: audited → "approved"
        ↓
     Click [อัปเดต]
        ↓
     [Complete] → Status = "approved"
        ↓
     Bill payment service income recorded ✓
```

### Details
- **Role**: เจ้าของร้าน (Owner)
- **Page**: /finance/bill-payment-service (Bill Payment Service Review)
- **Time Required**: ~5 minutes
- **Success Criteria**:
  - ✅ All data reviewed and verified by Auditor
  - ✅ Final decision documented
- **Data Updated**:
  - status: "approved"
  - approvedAt: timestamp
  - approvedBy: Owner ID
- **Result**: ✅ Bill payment service income recorded

---

# 📊 FLOW 4: Daily Income/Expense Recording (บันทึกรายรับ-รายจ่ายรายวัน)

## Workflow 4.1: บันทึกข้อมูลรายรับ-รายจ่ยรายวัน (Manager - Daily Record)

### Real-World Example

**Scenario**: Manager records daily income & expenses based on approved Daily Sales (19,350 บาท from Workflow 1.3-1.4)

**Step 1: Manager Gets Daily Sales Data (Already Approved)**
```
From /sales/daily-sales → Approved entry:
- Date: 2026-01-29
- Daily Sales Total: 19,350 บาท
  * Cash: 9,800 บาท
  * QR: 4,500 บาท
  * Bank: 3,100 บาท
  * Government: 1,950 บาท
- Status: approved (by Owner in Workflow 1.4)
```

**Step 2: Manager Adds Income Data**
```
/finance/daily-expenses → New Record:

INCOME SECTION:
1. Daily Sales (from /sales/daily-sales approved): 19,350 บาท

2. Service Income (additional):
   - Money transfer service fees: 150 บาท
   - Withdrawal service fees: 100 บาท
   - Bill payment service fees: 50 บาท
   - Other service fees: 50 บาท
   Total service income: 350 บาท

TOTAL INCOME: 19,350 + 350 = 19,700 บาท
```

**Step 3: Manager Adds Expense Data**
```
EXPENSE SECTION:
1. Stock Purchases (cash payment): 5,000 บาท
   - Examples: Rice, oil, snacks, beverages, etc.

2. Stock Purchases (transfer payment): 2,000 บาท
   - Via bank transfer to suppliers

3. Other Daily Expenses: 500 บาท
   - Utilities (water, electricity): 300 บาท
   - Supplies (bags, cleaning): 200 บาท

TOTAL EXPENSES: 5,000 + 2,000 + 500 = 7,500 บาท
```

**Step 4: System Calculates Summary**
```
Income Summary:
├─ Daily Sales: 19,350 บาท
├─ Service Income: 350 บาท
└─ Total Income: 19,700 บาท

Expense Summary:
├─ Stock Purchases (cash): 5,000 บาท
├─ Stock Purchases (transfer): 2,000 บาท
├─ Other Expenses: 500 บาท
└─ Total Expenses: 7,500 บาท

Net Profit (Income - Expense): 19,700 - 7,500 = 12,200 บาท

Status: ⚠️ PENDING AUDITOR REVIEW
```

**Step 5: Manager Submits & Send to Auditor**
```
/finance/daily-expenses → Record Data:
- date: 2026-01-29
- managerId: manager-001
- managerName: วีระ

INCOME DATA:
- dailySalesApprovedAmount: 19,350 (from /sales/daily-sales id)
- serviceIncome:
  * moneyTransferFees: 150
  * withdrawalFees: 100
  * billPaymentFees: 50
  * otherServiceFees: 50
  * totalServiceIncome: 350
- totalIncome: 19,700

EXPENSE DATA:
- stockPurchasesCash: 5,000
- stockPurchasesTransfer: 2,000
- utilities: 300
- supplies: 200
- otherExpenses: 500
- totalExpenses: 7,500

SUMMARY:
- netProfit: 12,200
- managerNotes: "All stock purchases verified with receipts"

STATUS: "submitted" (auto-set)
submittedAt: 2026-01-29 17:30:00
submittedBy: manager-001

[Send notification to Auditor]
Auditor → Verify & Check (Workflow 2.2)
```

---

### Process Flow
```
[Start] → Get approved Daily Sales data
        ↓
     Go to /finance/daily-expenses page
        ↓
     Click "บันทึกใหม่" (New Record)
        ↓
     ADD INCOME DATA:
     1. Copy Daily Sales amount from /sales/daily-sales
        - Pull "approved" entries
        - Daily sales: 19,350 บาท
        ↓
     2. Add service income (additional):
        - Money transfer service fees: 150 บาท
        - Withdrawal service fees: 100 บาท
        - Bill payment service fees: 50 บาท
        - Other service fees: 50 บาท
        - Total service income: 350 บาท
        ↓
     TOTAL INCOME: 19,700 บาท
        ↓
     ADD EXPENSE DATA:
     1. Stock purchases (cash payment): 5,000 บาท
     2. Stock purchases (transfer payment): 2,000 บาท
     3. Other daily expenses: 500 บาท
        - Utilities, supplies, etc.
        ↓
     TOTAL EXPENSES: 7,500 บาท
        ↓
     [System calculates]:
     - Total Income: 19,700 บาท
     - Total Expenses: 7,500 บาท
     - Net Profit: 12,200 บาท
        ↓
     Add manager notes (if needed):
     - "All stock purchases verified with receipts"
        ↓
     [Submit] → Status: "submitted" (auto)
        ↓
     Send summary to Auditor:
     - Income summary
     - Expense breakdown
     - Manager notes
        ↓
     [Complete]
```

### Details
- **Role**: ผู้จัดการ (Manager)
- **Page**: /finance/daily-expenses (Daily Income/Expense Recording)
- **Time Required**: ~10-15 minutes
- **Success Criteria**:
  - ✅ Income data matches approved Daily Sales
  - ✅ Service income details complete
  - ✅ All expenses recorded with amounts
  - ✅ Manager notes added (if needed)
  - ✅ Summary totals correct
- **Data Recorded**:
  - **incomeData**:
    - dailySalesApprovedAmount: จาก /sales/daily-sales (e.g., 19,350 บาท)
    - serviceIncome:
      - moneyTransferFees: (e.g., 150 บาท)
      - withdrawalFees: (e.g., 100 บาท)
      - billPaymentFees: (e.g., 50 บาท)
      - otherServiceFees: (e.g., 50 บาท)
      - totalServiceIncome: รวมเสิร์วิส (e.g., 350 บาท)
    - totalIncome: รวมรายรับ (e.g., 19,700 บาท)
  - **expenseData**:
    - stockPurchasesCash: (e.g., 5,000 บาท)
    - stockPurchasesTransfer: (e.g., 2,000 บาท)
    - utilities: (e.g., 300 บาท)
    - supplies: (e.g., 200 บาท)
    - otherExpenses: (if any)
    - totalExpenses: รวมรายจ่าย (e.g., 7,500 บาท)
  - **summary**:
    - netProfit: incomeTotal - expenseTotal (e.g., 12,200 บาท)
    - managerNotes: (if any)
  - **status**: "submitted" (ระบบตั้งอัตโนมัติ)
  - **submittedAt**: timestamp ปัจจุบัน
  - **submittedBy**: Manager ID (ผู้ที่บันทึก)
  - **linkedDailySalesId**: ID ของ approved Daily Sales record
- **Next Step**: Auditor verify and approve (Workflow 2.2)

---

## Workflow 4.2: ตรวจสอบรายรับ-รายจ่าย (Auditor - Verify Income/Expense)

### Real-World Example

**Scenario**: Auditor reviews Manager's income/expense record (19,700 บาท income, 7,500 บาท expense from Workflow 2.1)

**Step 1: Auditor Gets Manager's Submitted Record**
```
From /finance/daily-expenses → Submitted entry:
- Date: 2026-01-29
- Manager: วีระ
- Income Total: 19,700 บาท
- Expense Total: 7,500 บาท
- Net Profit: 12,200 บาท
- Status: submitted (by Manager in Workflow 2.1)
```

**Step 2: Auditor Verifies Income Data**
```
INCOME VERIFICATION:

1. Daily Sales Amount (19,350 บาท):
   ✅ Cross-check with /sales/daily-sales → Approved
   - Record date: 2026-01-29
   - Approved by: Owner
   - Amount matches: ✓ 19,350 บาท

2. Service Income (350 บาท):
   ✅ Money transfer fees: 150 บาท (matches bank statement)
   ✅ Withdrawal fees: 100 บาท (matches bank statement)
   ✅ Bill payment fees: 50 บาท (matches bank statement)
   ✅ Other fees: 50 บาท (matches bank statement)
   Total service income: ✓ 350 บาท

INCOME VERIFICATION RESULT: ✅ ALL CORRECT
Total Income: 19,700 บาท
```

**Step 3: Auditor Verifies Expense Data**
```
EXPENSE VERIFICATION:

1. Stock Purchases (Cash) - 5,000 บาท:
   ✅ Receipt 1: Rice supplier - 2,000 บาท (verified)
   ✅ Receipt 2: Beverage supplier - 1,500 บาท (verified)
   ✅ Receipt 3: Snack supplier - 1,500 บาท (verified)
   Total: ✓ 5,000 บาท

2. Stock Purchases (Transfer) - 2,000 บาท:
   ✅ Bank transfer to Supplier A: 1,200 บาท (verified)
   ✅ Bank transfer to Supplier B: 800 บาท (verified)
   Total: ✓ 2,000 บาท

3. Other Daily Expenses - 500 บาท:
   ✅ Utilities (water/electricity): 300 บาท (verified)
   ✅ Supplies (bags/cleaning): 200 บาท (verified)
   Total: ✓ 500 บาท

EXPENSE VERIFICATION RESULT: ✅ ALL CORRECT
Total Expenses: 7,500 บาท
```

**Step 4: Auditor Adds Verification Notes**
```
auditNotes: "Income/Expense verification completed:

INCOME VERIFICATION:
✅ Daily Sales (19,350 บาท) - Matches approved record in /sales/daily-sales
✅ Service Income (350 บาท) - All 4 fee types verified against bank statements
✅ Total Income: 19,700 บาท - CORRECT

EXPENSE VERIFICATION:
✅ Stock Purchases (Cash): 5,000 บาท - 3 receipts verified
✅ Stock Purchases (Transfer): 2,000 บาท - 2 bank transfers verified
✅ Other Expenses: 500 บาท - Utilities and supplies verified
✅ Total Expenses: 7,500 บาท - CORRECT

NET PROFIT: 12,200 บาท - APPROVED

All documents verified and correct. Ready for Owner approval."
```

**Step 5: Auditor Updates Status**
```
/finance/daily-expenses → Update Record:
- status: "audited" (changed from "submitted")
- auditedAt: 2026-01-29 18:00:00
- auditedBy: auditor-001
- auditNotes: "Income/Expense verification completed..." (detailed)

[Send notification to Owner]
Owner → Final Approval (Workflow 2.3)
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
     VERIFY INCOME DATA:
     1. Cross-check Daily Sales:
        - Pull /sales/daily-sales "approved" record
        - Compare amount: Manager says 19,350 ← Matches? ✓
        ↓
     2. Verify Service Income (350 บาท):
        - Check Bank statement
        - Money transfer fees: 150 บาท ✓
        - Withdrawal fees: 100 บาท ✓
        - Bill payment fees: 50 บาท ✓
        - Other fees: 50 บาท ✓
        ↓
     VERIFY EXPENSE DATA:
     1. Stock Purchases (Cash) - 5,000 บาท:
        - Check receipts/documents
        - All 3 suppliers verified ✓
        ↓
     2. Stock Purchases (Transfer) - 2,000 บาท:
        - Check Bank statement
        - Both transfers verified ✓
        ↓
     3. Other Daily Expenses - 500 บาท:
        - Utilities verified ✓
        - Supplies verified ✓
        ↓
     If everything correct:
     - Add detailed verification notes
     - Click [✏️ Edit]
     - Change status: submitted → "audited"
        ↓
     If discrepancy found:
     - Add notes explaining issues
     - Return record to Manager for correction
     - Do NOT update status
        ↓
     [Update] → Status = "audited"
        ↓
     Send report to Owner:
     - Verification summary
     - All amounts verified
     - Audit notes
        ↓
     [Complete]
```

### Details
- **Role**: ผู้ตรวจสอบ (Auditor)
- **Page**: /finance/daily-expenses (Daily Income/Expense Review)
- **Time Required**: ~10-15 minutes
- **Success Criteria**:
  - ✅ Income matches approved Daily Sales record
  - ✅ Service income verified against bank statements
  - ✅ All expenses verified with receipts/documents
  - ✅ Data completeness verified
  - ✅ Clear verification notes
- **Data Checked**:
  - **incomeVerification**:
    - dailySalesMatch: Cross-checked with /sales/daily-sales approved entry
    - serviceIncomeVerified: All 4 fee types matched with bank statement
    - totalIncomeCorrect: 19,700 บาท confirmed
  - **expenseVerification**:
    - stockPurchasesCash: All receipts verified (3 suppliers)
    - stockPurchasesTransfer: All bank transfers verified
    - otherExpenses: All items verified with documents
    - totalExpensesCorrect: 7,500 บาท confirmed
- **Data Updated**:
  - status: "audited" (changed from "submitted")
  - auditedAt: timestamp ปัจจุบัน
  - auditedBy: Auditor ID (ผู้ตรวจสอบ)
  - auditNotes: Detailed verification results
    - Example: "Income/Expense verification completed: Daily Sales matches approved record (19,350 บาท), Service income verified (350 บาท), All expenses verified with receipts (7,500 บาท). Net profit 12,200 บาท - APPROVED."
- **Next Step**: Owner final approval (Workflow 2.3)

---

## Workflow 4.3: อนุมัติรายรับ-รายจ่าย (Owner - Approve Income/Expense)

### Real-World Example

**Scenario**: Owner reviews and approves audited income/expense record (19,700 บาท income, 7,500 บาท expense from Workflow 2.2)

**Step 1: Owner Receives Auditor's Report**
```
From /finance/daily-expenses → Audited entry:
- Date: 2026-01-29
- Manager: วีระ
- Income Total: 19,700 บาท
- Expense Total: 7,500 บาท
- Net Profit: 12,200 บาท
- Status: audited (by Auditor in Workflow 2.2)
- Auditor Notes: "All amounts verified and correct"
```

**Step 2: Owner Reviews Income Section**
```
INCOME DETAILS:
├─ Daily Sales (from approved /sales/daily-sales): 19,350 บาท
│  └─ Verified by: Auditor (matched with approved Daily Sales record)
│
├─ Service Income Breakdown: 350 บาท
│  ├─ Money transfer fees: 150 บาท ✓
│  ├─ Withdrawal fees: 100 บาท ✓
│  ├─ Bill payment fees: 50 บาท ✓
│  └─ Other fees: 50 บาท ✓
│
└─ Total Income: 19,700 บาท ✓

OWNER CHECK: ✅ All income verified by Auditor
```

**Step 3: Owner Reviews Expense Section**
```
EXPENSE DETAILS:
├─ Stock Purchases (Cash): 5,000 บาท
│  ├─ Rice supplier: 2,000 บาท ✓
│  ├─ Beverage supplier: 1,500 บาท ✓
│  └─ Snack supplier: 1,500 บาท ✓
│
├─ Stock Purchases (Transfer): 2,000 บาท
│  ├─ Supplier A: 1,200 บาท ✓
│  └─ Supplier B: 800 บาท ✓
│
├─ Other Daily Expenses: 500 บาท
│  ├─ Utilities: 300 บาท ✓
│  └─ Supplies: 200 บาท ✓
│
└─ Total Expenses: 7,500 บาท ✓

OWNER CHECK: ✅ All expenses verified by Auditor
```

**Step 4: Owner Reviews Auditor's Verification Notes**
```
auditNotes from Auditor: "Income/Expense verification completed:

INCOME VERIFICATION:
✅ Daily Sales (19,350 บาท) - Matches approved record in /sales/daily-sales
✅ Service Income (350 บาท) - All 4 fee types verified against bank statements
✅ Total Income: 19,700 บาท - CORRECT

EXPENSE VERIFICATION:
✅ Stock Purchases (Cash): 5,000 บาท - 3 receipts verified
✅ Stock Purchases (Transfer): 2,000 บาท - 2 bank transfers verified
✅ Other Expenses: 500 บาท - Utilities and supplies verified
✅ Total Expenses: 7,500 บาท - CORRECT

NET PROFIT: 12,200 บาท - APPROVED

All documents verified and correct. Ready for Owner approval."

OWNER DECISION: ✅ Everything looks good - Approve
```

**Step 5: Owner Approves & Updates Status**
```
/finance/daily-expenses → Update Record:
- Click [✏️ Edit]
- Change status: audited → "approved"
- Click [อัปเดต]

System auto-updates:
- status: "approved"
- approvedAt: 2026-01-29 18:30:00
- approvedBy: owner-001
- approvalNotes: (optional) "Reviewed and approved. All data correct."

STATUS: ✅ APPROVED - Daily income/expense recording complete
```

**Step 6: Data Now Available for Reports**
```
Dashboard & Reports Update:
├─ Daily Sales: 19,350 บาท (from /sales/daily-sales)
├─ Service Income: 350 บาท
├─ Total Income: 19,700 บาท
├─ Total Expenses: 7,500 บาท
└─ Net Profit: 12,200 บาท

Available in:
- /finance/daily-expenses (approved record)
- /finance/cash-flow (updated with today's data)
- /finance/monthly-report (aggregated)
- Dashboard (summary view)
```

---

### Process Flow
```
[Start] → Review Auditor's report
        ↓
     Check /finance/daily-expenses → "audited" entries
        ↓
     REVIEW INCOME:
     1. Check Daily Sales amount: 19,350 บาท
        - Auditor verified against /sales/daily-sales ✓
     2. Check Service Income: 350 บาท
        - Money transfer: 150 บาท
        - Withdrawal: 100 บาท
        - Bill payment: 50 บาท
        - Other: 50 บาท
        - Auditor verified all ✓
        ↓
     REVIEW EXPENSES:
     1. Stock Purchases (Cash): 5,000 บาท
        - Auditor verified with receipts ✓
     2. Stock Purchases (Transfer): 2,000 บาท
        - Auditor verified with bank statement ✓
     3. Other Expenses: 500 บาท
        - Auditor verified with documents ✓
        ↓
     REVIEW AUDITOR'S NOTES:
     - All amounts verified? → Yes ✓
     - All receipts/documents checked? → Yes ✓
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
     - "Reviewed and approved. All correct."
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
        ↓
     Daily income/expense recording ✓
```

### Details
- **Role**: เจ้าของร้าน (Owner)
- **Page**: /finance/daily-expenses (Daily Income/Expense Review)
- **Time Required**: ~5-10 minutes
- **Success Criteria**:
  - ✅ All income reviewed and verified by Auditor
  - ✅ All expenses reviewed and verified by Auditor
  - ✅ Auditor notes reviewed
  - ✅ Final decision documented
  - ✅ Status updated to "approved"
- **Data Reviewed**:
  - **incomeReview**:
    - Daily Sales: 19,350 บาท (verified by Auditor)
    - Service Income: 350 บาท (verified by Auditor)
    - Total Income: 19,700 บาท
  - **expenseReview**:
    - Stock Purchases (Cash): 5,000 บาท (verified)
    - Stock Purchases (Transfer): 2,000 บาท (verified)
    - Other Expenses: 500 บาท (verified)
    - Total Expenses: 7,500 บาท
  - **auditReview**:
    - Read Auditor's verification notes
    - Check for any discrepancies
    - Confirm all documents verified
- **Data Updated**:
  - status: "approved" (changed from "audited")
  - approvedAt: timestamp ปัจจุบัน
  - approvedBy: Owner ID (ผู้อนุมัติ)
  - approvalNotes: (optional) Final comments from Owner
- **Result**: ✅ Daily income/expense recording complete & ready for reports/analysis

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

