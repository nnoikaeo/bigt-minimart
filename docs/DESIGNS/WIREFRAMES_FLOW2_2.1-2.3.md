# 📐 Wireframes: FLOW 2 Workflows 2.1 - 2.3
## Daily Money Transfer Service Income (นับและตรวจสอบเงินจากบริการโอนเงิน)

---

# 🔷 WORKFLOW 2.1: Manager - Record Transfer & Verification

## Step 1: Record Transfer & Withdrawal Transactions Page
**Route**: `/finance/money-transfer-service/step-1`
**Role**: Manager/Assistant Manager

### Layout: Main Transaction Recording Page (Updated)

> **Design Decision**:
> - ส่วนกรอกรายการย้ายเข้า **Modal** ทั้งหมด — หน้าหลักเป็น Dashboard สะอาด
> - เพิ่ม **Quick Actions Bar** สำหรับรายการที่ทำบ่อย — ลด click ให้น้อยที่สุด
> - **⭐ Favorite Transfer**: 3 clicks + กรอกจำนวนเงิน = เสร็จทันที
> - Modal เปิดเมื่อ: กด Quick Action / [➕ New] / [✏️ Edit] เท่านั้น

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  🏦 Money Transfer Service - Step 1: Record Transactions       │
│                                                                 │
│  📅 Date: 2026-01-29  👤 Manager: สมชาย              [Status]  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📊 CURRENT BALANCES (Real-time)                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Bank Account: 10,210 บาท  │  Cash from Transfers: 9,800 บาท│
│  │ Service Fee Cash: 70 บาท  │  Service Fee Transfer: 10 บาท  │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ⚡ QUICK ACTIONS                                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │  [⭐ Favorite Transfer]  [💰 Owner Deposit]             │   │
│  │  [📤 New Transfer]       [💵 New Withdrawal]            │   │
│  │                                                         │   │
│  │  ⭐ Favorite Transfer → เปิด Modal แบบ Tabs (เร็วสุด)   │   │
│  │  💰 Owner Deposit     → เปิด Modal pre-filled           │   │
│  │  📤 New Transfer      → เปิด Modal ฟอร์มเปล่า           │   │
│  │  💵 New Withdrawal    → เปิด Modal ฟอร์มเปล่า           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📋 TODAY'S TRANSACTIONS                    [➕ New Transaction] │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Filter: [All ▼]  [Completed]  [Draft]  [Failed]        │   │
│  │                                                         │   │
│  │ #  │ Time   │ Type        │ Amount  │ Commission │ Status│   │
│  ├────┼────────┼─────────────┼─────────┼────────────┼───────┤   │
│  │ 1  │ 10:30  │ PromptPay   │ 2,000 ฿ │  20 ฿     │ ✅    │   │
│  │ 2  │ 13:15  │ Withdrawal  │   500 ฿ │  10 ฿     │ ✅    │   │
│  │ 3  │ 14:00  │ Bank Trf    │ 8,800 ฿ │   -       │ ⏸️    │   │
│  │    │        │ (Insufficient)        │           │ DRAFT  │   │
│  │ 4  │ 14:30  │ Owner Dep   │10,000 ฿ │   -       │ ✅    │   │
│  │ 5  │ 14:45  │ Bank Trf    │ 8,800 ฿ │  40 ฿     │ ✅    │   │
│  │ 6  │ 15:30  │ Withdrawal  │   500 ฿ │  10 ฿ T   │ ✅    │   │
│  └────┴────────┴─────────────┴─────────┴───────────┴───────┘   │
│                                                                 │
│  SUMMARY: 6 Transactions │ Commission: 70 บาท                  │
│                                                                 │
│  ⏸️ DRAFT PENDING: Transaction #3 — Bank Transfer 8,800 บาท    │
│  └─ Bank Balance was 5,000 บาท (ขาด 3,800 บาท)               │
│  └─ [✅ Complete Transaction]  [❌ Cancel]                     │
│                                                                 │
│                           [Next: Step 2 ➜]                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Modal A: ⭐ Favorite Transfer (Quick — ลด Clicks สูงสุด)

> **User Flow (3 clicks + กรอกตัวเลข)**
> 1. กด [⭐ Favorite Transfer] บนหน้าหลัก → Modal เปิด
> 2. คลิก Tab หรือ คลิกชื่อบัญชีที่ต้องการ → Amount input ปรากฏทันที
> 3. กรอกจำนวนเงิน → ค่าบริการคำนวณอัตโนมัติ
> 4. กด [💾 โอนเงิน] → เสร็จ ✅ Modal ปิด กลับทำงานได้ทันที

### Step 1 — เลือกบัญชี (เปิด Modal)

```
┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
│                                                                  │
│  ⭐ Favorite Transfer                                      [✕]  │
│  Bank Balance: 10,210 บาท ✅                                     │
│                                                                  │
├─[★1 สมชาย]──[★2 ABC]──[★3 นายแดง]──[★4 ...]──[★5 ...]──[ทั้งหมด]┤
│                                                                  │
│  ★1  สมชาย          PromptPay  │  081-234-5678                  │
│  ★2  บ. ABC จำกัด   Bank KBank │  Acc: 123-4-56789-0 (Savings) │
│  ★3  นายแดง         PromptPay  │  1-2345-67890-12-3 (ID Card)  │
│  ★4  ห้างสรรพสินค้า  Bank SCB  │  Acc: 456-7-89012-3 (Current) │
│  ★5  นายดำ          PromptPay  │  089-876-5432                  │
│                                                                  │
│  [จัดการ Favorites ⚙️]                                           │
│                                                                  │
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
  * คลิกชื่อใดก็ได้ → ไปขั้นตอน 2 ทันที (ไม่ต้องกด "เลือก")
```

### Step 2 — กรอกจำนวนเงิน (หลังคลิกบัญชี)

```
┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
│                                                                  │
│  ⭐ Favorite Transfer                                      [✕]  │
│  Bank Balance: 10,210 บาท ✅                                     │
│                                                                  │
├─[★1 สมชาย ✓]─[★2 ABC]──[★3 นายแดง]──[★4 ...]──[★5 ...]──[ทั้งหมด]┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  ★ สมชาย  │  PromptPay  │  081-234-5678               │     │
│  │  ─────────────────────────────────────────────────     │     │
│  │                                                        │     │
│  │  จำนวนเงิน:  [___________] บาท  ← focus อัตโนมัติ      │     │
│  │                                                        │     │
│  │  ค่าบริการ:  20 บาท  (อัตโนมัติ: 1% min 10 ฿)  [Cash] │     │
│  │  เวลา:       14:30  (ปัจจุบัน — แก้ไขได้ [✏️])         │     │
│  │                                                        │     │
│  │  Balance หลังโอน: 10,210 - [Amount] = [___] บาท        │     │
│  │                                                        │     │
│  │            [← เลือกบัญชีอื่น]   [💾 โอนเงิน]           │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                  │
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
  * กด [💾 โอนเงิน] → บันทึกทันที → Modal ปิด → กลับหน้าหลัก ✅
  * กด [← เลือกบัญชีอื่น] → กลับ Step 1 (บัญชีไม่ถูกเลือก)
  * หากเงินไม่พอ: Balance แดง + ปุ่มเปลี่ยนเป็น [⏸️ บันทึกเป็น Draft]
```

### Inline Validation — เงินไม่พอ

```
┌────────────────────────────────────────────────────────┐
│  ★ สมชาย  │  PromptPay  │  081-234-5678               │
│  ─────────────────────────────────────────────────     │
│                                                        │
│  จำนวนเงิน:  [15,000] บาท                              │
│                                                        │
│  ค่าบริการ:  150 บาท  (อัตโนมัติ)  [Cash]              │
│  เวลา:       14:30                                      │
│                                                        │
│  ❌ Balance: 10,210 บาท — ไม่เพียงพอ (ขาด 4,790 บาท)  │
│                                                        │
│  [← เลือกบัญชีอื่น]  [⏸️ บันทึกเป็น Draft]            │
└────────────────────────────────────────────────────────┘
```

---

## Modal B: 💰 Owner Deposit (Quick — Pre-filled)

> **User Flow (2 clicks + กรอกจำนวนเงิน)**
> 1. กด [💰 Owner Deposit] บนหน้าหลัก → Modal เปิดพร้อม Type = Owner Deposit
> 2. กรอกจำนวนเงิน (focus อัตโนมัติ)
> 3. กด [💾 บันทึก] → เสร็จ ✅

```
┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
│                                                                  │
│  💰 Owner Deposit                                          [✕]  │
│                                                                  │
│  Type:     Owner Deposit  (fixed — ไม่เปลี่ยน)                  │
│  เวลา:     [14:30]  (ปัจจุบัน — แก้ไขได้)                       │
│                                                                  │
│  จำนวนเงิน:  [___________] บาท  ← focus อัตโนมัติ               │
│                                                                  │
│  Bank Balance หลังฝาก: 10,210 + [Amount] = [___] บาท           │
│                                                                  │
│  หมายเหตุ: [___________________________________] (optional)      │
│                                                                  │
│                          [❌ Cancel]  [💾 บันทึก]               │
│                                                                  │
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
```

---

## Modal C: 📋 New / Edit Transaction (Full Form)

> ใช้สำหรับ: กด [➕ New Transaction], [📤 New Transfer], [💵 New Withdrawal],
>            หรือ [✏️ Edit] บนรายการในตาราง
> Edit mode: ไม่แสดง Quick Actions — แสดงข้อมูลเดิมพร้อมแก้ไข

```
┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
│                                                                  │
│  📝 New Transaction                 [หรือ: ✏️ Edit #3]    [✕]  │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│  TRANSACTION TYPE                                                │
│  [◉ Transfer]  [○ Withdrawal]  [○ Owner Deposit]                │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│  DESTINATION ACCOUNT  (แสดงเมื่อ Transfer หรือ Withdrawal)      │
│                                                                  │
│  ⭐ Favorites:                                                    │
│  ┌──────────────────────────────────────────────────────┐       │
│  │ [★ สมชาย | PromptPay 081-234-5678]                   │       │
│  │ [★ บ.ABC  | KBank 123-4-56789-0  ]                   │       │
│  │ [★ นายแดง | PromptPay ID Card    ]                   │       │
│  │ [ดูทั้งหมด ▾]                                        │       │
│  └──────────────────────────────────────────────────────┘       │
│  * คลิก Favorite → กรอกข้อมูลบัญชีอัตโนมัติ                    │
│                                                                  │
│  Channel: [○ PromptPay ✓]  [○ Bank]  [○ Other]                 │
│                                                                  │
│  PromptPay Type: [◉ Phone]  [○ ID Card]                         │
│  Phone / ID:     [081-234-5678__________]                        │
│  Account Name:   [สมชาย________________]  [☆ Save as Fav]       │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│  DETAILS                                                         │
│                                                                  │
│  Date & Time:  [2026-01-29]  [14:30]                            │
│  Amount:       [___________] บาท                                 │
│  Balance now:  10,210 บาท  ✅ Sufficient                         │
│                                                                  │
│  Commission:   [___] บาท  (คำนวณอัตโนมัติ — แก้ไขได้)           │
│  Comm. Type:   [◉ Cash]  [○ Transfer]                           │
│                                                                  │
│  Customer:     [___________________] (optional)                  │
│  Notes:        [___________________________]                     │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│  SAVE AS                                                         │
│  [◉ Save & Complete]  [○ Save as Draft]                         │
│  (Draft: เงินไม่พอ หรือต้องรอยืนยัน)                            │
│                                                                  │
│                      [❌ Cancel]  [💾 Save]                      │
│                                                                  │
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
```

---

## Favorite Accounts: Management

### เพิ่ม Favorite ระหว่างกรอกใน Modal C

```
กรอกข้อมูลบัญชีครบแล้ว → กด [☆ Save as Fav]
  ↓
┌────────────────────────────────────┐
│  บันทึก Favorite                   │
│  ชื่อที่แสดง: [สมชาย PromptPay____] │
│  (ปรับชื่อก่อนบันทึกได้)             │
│  [ยกเลิก]  [✅ บันทึก]              │
└────────────────────────────────────┘
  ↓ บันทึกแล้ว
[★ สมชาย | PromptPay | 081-234-5678] ← ปรากฏใน Favorites list
```

### จัดการ Favorites (กด [จัดการ Favorites ⚙️] ใน Modal A)

```
┌────────────────────────────────────────────────────────────┐
│  ⭐ จัดการ Favorites                                  [✕]  │
├────────────────────────────────────────────────────────────┤
│  [≡] ★1 สมชาย    PromptPay  081-234-5678      [✏️] [🗑️]  │
│  [≡] ★2 บ.ABC    KBank      123-4-56789-0     [✏️] [🗑️]  │
│  [≡] ★3 นายแดง   PromptPay  ID Card           [✏️] [🗑️]  │
│  [≡] ★4 ห้างฯ    SCB        456-7-89012-3     [✏️] [🗑️]  │
│  [≡] ★5 นายดำ    PromptPay  089-876-5432      [✏️] [🗑️]  │
│  [≡] ← ลากเพื่อเรียงลำดับ (Tab ★1-★5)                     │
│                                                            │
│  [➕ เพิ่ม Favorite ใหม่]  (สูงสุด 10 รายการ)              │
│                                          [✅ เสร็จสิ้น]    │
└────────────────────────────────────────────────────────────┘
```

### Draft Transaction Management Flow

```
Scenario: Customer wants to transfer 8,000 บาท but Bank Account only has 5,000 บาท

Step 1: Manager records transfer as DRAFT
┌──────────────────────────────────────┐
│ Transaction Type: Transfer           │
│ Channel: Bank                        │
│ Amount: 8,800 บาท                    │
│ ⚠️ Bank Balance: 5,000 บาท          │
│ ❌ INSUFFICIENT FUNDS                │
│                                      │
│ Save As: ○ Save & Complete           │
│          ◉ Save as Draft ✓           │
│                                      │
│ Status: ⏸️ DRAFT - Waiting for funds │
└──────────────────────────────────────┘

Step 2: Manager contacts Owner
   "Bank account doesn't have enough to transfer 8,800 บาท"
   "Current balance: 5,000 บาท, need: 8,000 บาท more"

Step 3: Owner deposits 10,000 บาท to bank account
   (Owner transfers from personal account)
   New Bank Balance: 15,000 บาท

Step 4: Manager records Owner Deposit
┌──────────────────────────────────────┐
│ Transaction Type: Owner Deposit      │
│ Amount: 10,000 บาท                   │
│ Channel: Bank (internal transfer)    │
│ Status: ✅ COMPLETED                 │
│                                      │
│ [Verify from bank app] ✓             │
│ Bank Balance now: 15,000 บาท         │
└──────────────────────────────────────┘

Step 5: Manager completes the DRAFT transaction #3
┌──────────────────────────────────────┐
│ DRAFT Transaction #3:                │
│ Bank Transfer 8,800 บาท              │
│ Previous Status: ⏸️ DRAFT            │
│ Current Bank Balance: 15,000 บาท    │
│ ✅ SUFFICIENT FUNDS NOW              │
│                                      │
│ [✅ Complete Transaction] [❌ Cancel]│
└──────────────────────────────────────┘

System Updates:
┌──────────────────────────────────────┐
│ Transaction #3 Status Changes:       │
│                                      │
│ FROM: ⏸️ DRAFT (Insufficient Funds)  │
│ TO: ✅ COMPLETED                     │
│                                      │
│ New Bank Balance Calculation:        │
│ 15,000 (after owner deposit)         │
│ - 8,800 (transferred to customer)    │
│ = 6,200 บาท (new balance)            │
│                                      │
│ All related transactions updated:    │
│ #3 Bank Transfer: ✅                 │
│ Commission impact: +40 บาท           │
│ Service Fee Cash: +40 บาท            │
└──────────────────────────────────────┘
```

---

### PromptPay Identifier Types Reference

```
PromptPay supports 2 identifier types:

1️⃣ PHONE NUMBER
   └─ Format: xxx-xxx-xxxx (10 digits)
   └─ Example: 081-234-5678
   └─ Used when: Customer has linked phone number to PromptPay
   └─ Validation: Check phone number format

2️⃣ ID CARD NUMBER (Thai National ID)
   └─ Format: x-xxxx-xxxxx-xx-x (13 digits)
   └─ Example: 1-2345-67890-12-3
   └─ Used when: Customer prefers to use ID card instead
   └─ Validation: Check ID card format (1-4-5-2-1 pattern)

Manager/Assistant Manager MUST select the correct type based on customer's preference.
System will validate format on entry.
```

---

### Data Table Details (Clickable Row):

```
When clicking row 1 (Completed Transaction):
┌─────────────────────────────────────┐
│ Transaction #1 Details              │
├─────────────────────────────────────┤
│ Status: ✅ COMPLETED                │
│                                     │
│ Type:        PromptPay Transfer     │
│ Channel:     PromptPay              │
│ Identifier:  Phone Number           │
│ Amount:      2,000 บาท              │
│ Commission:  20 บาท (Cash)          │
│ Date/Time:   2026-01-29 10:30 AM    │
│ Customer:    Customer A             │
│ Destination: 081-234-5678 (Phone)   │
│              Somchai Account         │
│                                     │
│ Balance Impact:                     │
│ Before:                             │
│  - Bank Account: 10,000 บาท         │
│  - Transfer Cash: 0 บาท             │
│  - Service Fee Cash: 0 บาท          │
│                                     │
│ After:                              │
│  - Bank Account: 8,000 บาท          │
│  - Transfer Cash: 2,000 บาท         │
│  - Service Fee Cash: 20 บาท         │
│                                     │
│        [✏️ Edit]  [🗑️ Delete]     │
└─────────────────────────────────────┘

When clicking row 3 (Draft Transaction):
┌─────────────────────────────────────┐
│ Transaction #3 Details (DRAFT)      │
├─────────────────────────────────────┤
│ Status: ⏸️ DRAFT - Insufficient Funds│
│ ⚠️ This transaction is waiting for  │
│    funds to be deposited before it  │
│    can be completed                 │
├─────────────────────────────────────┤
│ Type:        Bank Transfer          │
│ Channel:     Bank                   │
│ Amount:      8,800 บาท              │
│ Commission:  40 บาท (Cash)          │
│ Date/Time:   2026-01-29 14:00 AM    │
│ Customer:    Customer C             │
│ Destination:                        │
│   Account Type: Savings             │
│   Account No: 123-456-789           │
│   Account Name: Somchai Company     │
│                                     │
│ Reason for Draft:                   │
│ Bank Balance: 5,000 บาท             │
│ Transfer Amount: 8,800 บาท          │
│ ❌ Insufficient (need 3,800 more)   │
│                                     │
│ Waiting for Owner Deposit:          │
│ Owner deposited: 10,000 บาท ✓       │
│ New Balance: 15,000 บาท             │
│ ✅ NOW SUFFICIENT                   │
│                                     │
│ Expected Balance After Completion:  │
│  - Bank Account: 6,200 บาท          │
│  - Transfer Cash: 8,800 บาท         │
│  - Service Fee Cash: 40 บาท         │
│                                     │
│  [✅ Complete Transaction]          │
│  [❌ Cancel]  [✏️ Edit]            │
└─────────────────────────────────────┘
```

---

## Step 2: Verify & Count Actual Cash Page
**Route**: `/finance/money-transfer-service/step-2`
**Role**: Manager/Assistant Manager

### Layout: Verification & Cash Count Page

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  🏦 Money Transfer Service - Step 2: Verify & Count Cash       │
│                                                                 │
│  📅 Date: 2026-01-29  👤 Manager: สมชาย              [Status]  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📊 SYSTEM DATA FROM STEP 1 (Expected Amounts)                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Expected Balances:                                      │   │
│  │ • Bank Account:           10,210 บาท                    │   │
│  │ • Transfer/Withdrawal:     9,800 บาท                    │   │
│  │ • Service Fee Cash:           70 บาท                    │   │
│  │ • Service Fee Transfer:       10 บาท                    │   │
│  │                                                         │   │
│  │ Expected Total Cash:       9,870 บาท                    │   │
│  │ Expected Transactions:     6 (5 success, 1 failed)      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  💰 ACTUAL CASH COUNT (ผู้จัดการนับจริง)                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ A. Transfer/Withdrawal Cash Count:                      │   │
│  │    Expected:  9,800 บาท                                 │   │
│  │    Actual:    [_____________] บาท                       │   │
│  │    Difference: [AUTO-CALC] บาท   ✅/⚠️/❌              │   │
│  │                                                         │   │
│  │ B. Service Fee Cash Count:                              │   │
│  │    Expected:  70 บาท                                    │   │
│  │    Actual:    [_____________] บาท                       │   │
│  │    Difference: [AUTO-CALC] บาท   ✅/⚠️/❌              │   │
│  │                                                         │   │
│  │ C. Service Fee Transfer:                                │   │
│  │    Expected:  10 บาท                                    │   │
│  │    Note:      (Not counted in cash, verify in Bank)    │   │
│  │                                                         │   │
│  │ ─────────────────────────────────────────────          │   │
│  │ TOTAL CASH COUNTED: [_____________] บาท                │   │
│  │ EXPECTED TOTAL:     9,870 บาท                          │   │
│  │ TOTAL DIFFERENCE:   [AUTO-CALC] บาท   ✅/⚠️/❌        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📝 VERIFICATION NOTES (ถ้ามีปัญหา)                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ If all amounts match:                                   │   │
│  │ ○ All amounts match perfectly ✅                       │   │
│  │                                                         │   │
│  │ If discrepancies found:                                 │   │
│  │ ○ Some amounts don't match ⚠️                          │   │
│  │                                                         │   │
│  │ Reason/Notes:                                           │   │
│  │ [_________________________________________________]      │   │
│  │ [_________________________________________________]      │   │
│  │                                                         │   │
│  │ Follow-up Action:                                       │   │
│  │ [_________________________________________________]      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📋 STEP 1 TRANSACTIONS SUMMARY (for reference)                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ #│ Time  │ Type      │ Amount │ Comm. │ Status │ View   │   │
│  ├─┼───────┼───────────┼────────┼───────┼────────┼────────┤   │
│  │1│10:30  │PromptPay  │2,000 ฿ │20 ฿  │   ✅   │[👁️]    │   │
│  │2│13:15  │Withdrawal │ 500 ฿  │10 ฿  │   ✅   │[👁️]    │   │
│  │3│14:00  │Bank Trf   │8,800 ฿ │ -    │   ❌   │[👁️]    │   │
│  │4│14:30  │Owner Dep  │10,000 ฿│ -    │   ✅   │[👁️]    │   │
│  │5│14:45  │Bank Trf   │8,800 ฿ │40 ฿  │   ✅   │[👁️]    │   │
│  │6│15:30  │Withdrawal │ 500 ฿  │10 ฿T │   ✅   │[👁️]    │   │
│  └─┴───────┴───────────┴────────┴───────┴────────┴────────┘   │
│                                                                 │
│              [⬅️ Back to Step 1]  [✅ Confirm Verification]    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Verification Result (After Confirming):

```
When clicking "Confirm Verification":

┌─────────────────────────────────────┐
│ ✅ Verification Complete            │
├─────────────────────────────────────┤
│                                     │
│ Status: VERIFIED ✅                │
│ Verified By: สมชาย                  │
│ Verified At: 2026-01-29 17:00:00   │
│                                     │
│ Summary:                            │
│ • Transfer/Withdrawal Cash: 9,800 บาท
│ • Service Fee Cash:        70 บาท  │
│ • Total Cash:            9,870 บาท │
│                                     │
│ ✅ All amounts match                │
│ ✅ Ready for Auditor review         │
│                                     │
│        [Next: Send to Auditor ➜]    │
│                                     │
└─────────────────────────────────────┘
```

---

# 🔷 WORKFLOW 2.2: Auditor - Verify Money Transfer Service Income

## Auditor Verification Page
**Route**: `/finance/money-transfer-service/auditor-review`
**Role**: Auditor

### Layout: Comprehensive Audit Review Page

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  🔍 Money Transfer Service - Auditor Verification              │
│                                                                 │
│  📅 Date: 2026-01-29  👤 Auditor: สวนัย              [Status]  │
│  Status: VERIFIED (from Manager) → Awaiting Audit             │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📊 MANAGER'S DATA (Step 1 & 2)                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Manager: สมชาย                                           │  │
│  │ Status: VERIFIED (Step 2 completed)                     │  │
│  │                                                          │  │
│  │ STEP 1 RECORDS:                                          │  │
│  │ ├─ 6 Total Transactions Recorded                        │  │
│  │ ├─ 5 Successful / 1 Failed                              │  │
│  │ └─ Final Expected Balance: 10,210 บาท                   │  │
│  │                                                          │  │
│  │ STEP 2 VERIFICATION:                                     │  │
│  │ ├─ Transfer/Withdrawal Cash: 9,800 บาท ✅              │  │
│  │ ├─ Service Fee Cash: 70 บาท ✅                          │  │
│  │ └─ All amounts match system expected                    │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🔐 AUDITOR VERIFICATION CHECKLIST                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                                                          │  │
│  │ ☐ VERIFY STEP 1 TRANSACTIONS                            │  │
│  │                                                          │  │
│  │   Transaction 1: PromptPay Transfer 2,000 บาท          │  │
│  │   └─ Bank Impact: -2,000 บาท                           │  │
│  │   └─ Bank Statement Check: [Click to verify]           │  │
│  │   └─ Status: ✅ Verified                               │  │
│  │                                                          │  │
│  │   Transaction 2: Cash Withdrawal 500 บาท               │  │
│  │   └─ Bank Impact: +500 บาท                             │  │
│  │   └─ Bank Statement Check: [Click to verify]           │  │
│  │   └─ Status: ✅ Verified                               │  │
│  │                                                          │  │
│  │   Transaction 3: Bank Transfer 8,800 บาท (FAILED)     │  │
│  │   └─ Bank Impact: No change (rejected)                │  │
│  │   └─ Bank Statement Check: [Click to verify]           │  │
│  │   └─ Status: ✅ Verified                               │  │
│  │                                                          │  │
│  │   Transaction 4: Owner Deposit 10,000 บาท              │  │
│  │   └─ Bank Impact: +10,000 บาท                          │  │
│  │   └─ Bank Statement Check: [Click to verify]           │  │
│  │   └─ Status: ✅ Verified                               │  │
│  │                                                          │  │
│  │   Transaction 5: Bank Transfer 8,800 บาท (SUCCESS)    │  │
│  │   └─ Bank Impact: -8,800 บาท                           │  │
│  │   └─ Bank Statement Check: [Click to verify]           │  │
│  │   └─ Status: ✅ Verified                               │  │
│  │                                                          │  │
│  │   Transaction 6: Cash Withdrawal 500 บาท               │  │
│  │   └─ Bank Impact: +500 + 10 (commission transfer)      │  │
│  │   └─ Bank Statement Check: [Click to verify]           │  │
│  │   └─ Status: ✅ Verified                               │  │
│  │                                                          │  │
│  │ ☐ VERIFY BANK ACCOUNT BALANCE                           │  │
│  │                                                          │  │
│  │   Expected (from Step 1):  10,210 บาท                  │  │
│  │   Bank Statement shows:    10,210 บาท                  │  │
│  │   Match: ✅ YES                                         │  │
│  │                                                          │  │
│  │ ☐ VERIFY STEP 2 CASH COUNT                              │  │
│  │                                                          │  │
│  │   Transfer/Withdrawal Cash:                             │  │
│  │   └─ Expected: 9,800 บาท  ✅                            │  │
│  │   └─ Counted: 9,800 บาท   ✅                            │  │
│  │   └─ Match: ✅ YES                                      │  │
│  │                                                          │  │
│  │   Service Fee Cash:                                     │  │
│  │   └─ Expected: 70 บาท     ✅                            │  │
│  │   └─ Counted: 70 บาท      ✅                            │  │
│  │   └─ Match: ✅ YES                                      │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📝 AUDIT NOTES & FINDINGS                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Audit Result: ✅ NO ISSUES FOUND                        │  │
│  │                                                          │  │
│  │ Summary:                                                 │  │
│  │ All 6 transactions verified against bank statement.    │  │
│  │ Manager's Step 1 records are accurate. Manager's Step  │  │
│  │ 2 cash verification confirmed. Bank balance matches    │  │
│  │ expected amount. No discrepancies or missing txns.     │  │
│  │                                                          │  │
│  │ Detailed Notes:                                          │  │
│  │ [_________________________________________________]      │  │
│  │ [_________________________________________________]      │  │
│  │                                                          │  │
│  │ Issues Found: ○ None  ○ Minor  ○ Major                 │  │
│  │                                                          │  │
│  │ If issues: [____________________________________]       │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│              [❌ Reject]  [✅ Approve Audit]  [⬅️ Back]       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Popup: Transaction Verification Detail

```
When clicking "Click to verify" for any transaction:

┌──────────────────────────────────────────┐
│ Transaction #1 Bank Statement Verification
├──────────────────────────────────────────┤
│                                          │
│ Manager's Record:                        │
│ • PromptPay Transfer: 2,000 บาท          │
│ • Commission: 20 บาท (Cash)              │
│ • Expected Bank Impact: -2,000 บาท       │
│                                          │
│ Bank Statement (2026-01-29):             │
│ ✅ PromptPay OUT: 2,000 บาท              │
│    Time: 10:30 AM                        │
│    Reference: Customer A                 │
│    Confirmed: Matches Manager's record   │
│                                          │
│ Verification Status:                     │
│ ✅ Amount matches                        │
│ ✅ Date/Time matches                     │
│ ✅ All details confirmed                 │
│                                          │
│       [Close]  [Mark as Issue?]          │
│                                          │
└──────────────────────────────────────────┘
```

---

# 🔷 WORKFLOW 2.3: Owner - Approve Money Transfer Service Income

## Owner Approval Page
**Route**: `/finance/money-transfer-service/owner-approval`
**Role**: Owner

### Layout: Final Approval Page

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ✅ Money Transfer Service - Owner Final Approval              │
│                                                                 │
│  📅 Date: 2026-01-29                                           │
│  Status: AUDITED (from Auditor) → Awaiting Owner Approval     │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📊 TRANSACTION SUMMARY                                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Manager: สมชาย                                           │  │
│  │ Total Transactions: 6 (5 Success, 1 Failed)              │  │
│  │                                                          │  │
│  │ STEP 1: Manager Recorded Transactions                    │  │
│  │ ├─ PromptPay Transfer:    2,000 บาท (+ 20 ฿ commission)│  │
│  │ ├─ Cash Withdrawal:         500 บาท (+ 10 ฿ commission)│  │
│  │ ├─ Bank Transfer (Failed): 8,800 บาท (rejected)         │  │
│  │ ├─ Owner Deposit:         10,000 บาท                    │  │
│  │ ├─ Bank Transfer (Success): 8,800 บาท (+ 40 ฿ comm.)  │  │
│  │ └─ Cash Withdrawal:         500 บาท (+ 10 ฿ Transfer)  │  │
│  │                                                          │  │
│  │ Total Commission Collected:  80 บาท                     │  │
│  │                                                          │  │
│  │ STEP 2: Manager Cash Verification                        │  │
│  │ ├─ Transfer/Withdrawal Cash:  9,800 บาท ✅ Match       │  │
│  │ ├─ Service Fee Cash:             70 บาท ✅ Match       │  │
│  │ └─ Total Cash Counted:         9,870 บาท ✅            │  │
│  │                                                          │  │
│  │ STEP 3 (WF 2.2): Auditor Verification                    │  │
│  │ ├─ All transactions verified with bank statement ✅     │  │
│  │ ├─ Bank balance matches expected (10,210 บาท) ✅       │  │
│  │ ├─ No discrepancies found ✅                            │  │
│  │ └─ Status: AUDITED - No Issues ✅                       │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  👁️ DETAIL REVIEW (Expand to see)                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ [▼] Manager Step 1 - Full Transaction List              │  │
│  │ [▼] Manager Step 2 - Verification Details               │  │
│  │ [▼] Auditor 2.2 - Verification Notes                   │  │
│  │ [▼] Auditor 2.2 - Bank Statement Cross-check           │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ⚠️ AUDIT RESULT CHECK                                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Status: AUDITED                                          │  │
│  │ Auditor: สวนัย                                           │  │
│  │ Audit Date: 2026-01-29 17:30:00                         │  │
│  │                                                          │  │
│  │ ✅ NO ISSUES FOUND                                       │  │
│  │                                                          │  │
│  │ Audit Notes:                                             │  │
│  │ "All 6 transactions from Manager's Step 1 verified      │  │
│  │ against bank statement. Manager's Step 2 cash           │  │
│  │ verification confirmed. Bank balance 10,210 บาท         │  │
│  │ matches expected. No issues found. Ready for Owner      │  │
│  │ approval."                                               │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📋 OWNER'S DECISION                                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Audit Status: AUDITED (No Issues) ✅                     │  │
│  │                                                          │  │
│  │ ○ APPROVE                                               │  │
│  │   → Data will be finalized and recorded                │  │
│  │   → Status = APPROVED ✅                               │  │
│  │                                                          │  │
│  │ ○ APPROVE WITH NOTES                                   │  │
│  │   (If Owner wants to add additional notes/conditions)   │  │
│  │   [_____________________________________]              │  │
│  │                                                          │  │
│  │ ○ REQUEST CORRECTION                                    │  │
│  │   (If Owner finds issues despite audit)                │  │
│  │   [_____________________________________]              │  │
│  │                                                          │  │
│  │ Owner's Notes/Comments (optional):                      │  │
│  │ [_____________________________________]                │  │
│  │ [_____________________________________]                │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│    [❌ Reject]  [📝 Preview]  [✅ Approve]  [⬅️ Back]        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Approval Confirmation (After Click "Approve"):

```
When Owner clicks "Approve":

┌───────────────────────────────────────────┐
│ ✅ Approval Complete                      │
├───────────────────────────────────────────┤
│                                           │
│ Transaction Date: 2026-01-29              │
│ Status: APPROVED ✅                       │
│ Approved By: Owner (เจ้าของร้าน)           │
│ Approved At: 2026-01-29 18:00:00          │
│                                           │
│ Summary:                                  │
│ • Total Transactions: 6                   │
│ • Total Commission: 80 บาท                │
│ • Bank Balance: 10,210 บาท                │
│ • Cash Verified: 9,870 บาท                │
│                                           │
│ ✅ Money transfer service income          │
│    has been recorded and finalized        │
│                                           │
│ Next: Data ready for financial reporting  │
│                                           │
│     [View Report]  [Print]  [Close]       │
│                                           │
└───────────────────────────────────────────┘
```

---

# 📋 Complete Workflow 2.1-2.3 Navigation Flow

```
START
  ↓
┌─────────────────────────────────────────────┐
│ Manager - Workflow 2.1                      │
├─────────────────────────────────────────────┤
│                                             │
│ Step 1: Record Transactions                │
│ /finance/money-transfer-service/step-1     │
│ └─ Record 6 transactions throughout day   │
│ └─ System auto-calculates balances        │
│ └─ Status: "submitted"                    │
│ ↓                                           │
│ Step 2: Verify & Count Cash                │
│ /finance/money-transfer-service/step-2     │
│ └─ Count actual cash                      │
│ └─ Compare with system expected            │
│ └─ Verify match or note discrepancies     │
│ └─ Status: "verified" ✅                   │
│ ↓                                           │
└─────────────────────────────────────────────┘
│
├─────────────────────────────────────────────┐
│ Auditor - Workflow 2.2                      │
├─────────────────────────────────────────────┤
│                                             │
│ Auditor Verification                       │
│ /finance/money-transfer-service/auditor    │
│ └─ Review Manager's Step 1 records        │
│ └─ Verify Step 2 cash count results       │
│ └─ Cross-check with bank statement        │
│ └─ Status: "audited" or "audited_issues" │
│ ↓                                           │
└─────────────────────────────────────────────┘
│
├─────────────────────────────────────────────┐
│ Owner - Workflow 2.3                        │
├─────────────────────────────────────────────┤
│                                             │
│ Owner Approval                              │
│ /finance/money-transfer-service/approval   │
│ └─ Review complete workflow summary       │
│ └─ Approve / Reject / Request correction  │
│ └─ Status: "approved" or "needs_correction"
│ ↓                                           │
└─────────────────────────────────────────────┘
│
COMPLETE ✅
Recorded in financial system
```

---

---

# 🔄 Complete Workflow: Draft Transaction Scenario

## Scenario: Insufficient Bank Balance → Owner Deposit → Transaction Completion

```
TIME: 14:00 (2:00 PM)
Customer C wants to transfer 8,800 บาท
┌─────────────────────────────────────────────────┐
│ Manager checks Bank Account: 5,000 บาท          │
│ ❌ NOT ENOUGH (need 8,800)                      │
│                                                 │
│ Manager records as DRAFT:                       │
│ • Type: Transfer                                │
│ • Channel: Bank                                 │
│ • Amount: 8,800 บาท                             │
│ • Status: ⏸️ DRAFT (Insufficient Funds)        │
│                                                 │
│ Manager informs Owner: "Need to deposit 3,800+"│
└─────────────────────────────────────────────────┘
           ↓
TIME: 14:30 (2:30 PM)
Owner verifies via bank app
┌─────────────────────────────────────────────────┐
│ Owner deposits 10,000 บาท to bank account       │
│ Bank balance: 5,000 + 10,000 = 15,000 บาท     │
│                                                 │
│ Owner informs Manager: "Money deposited"       │
└─────────────────────────────────────────────────┘
           ↓
TIME: 14:35 (2:35 PM)
Manager verifies and processes
┌─────────────────────────────────────────────────┐
│ Manager records Owner Deposit:                  │
│ • Type: Owner Deposit                           │
│ • Amount: 10,000 บาท                            │
│ • Status: ✅ COMPLETED                          │
│ • Verified from bank app                        │
│                                                 │
│ Now updates DRAFT Transaction #3:               │
│ • Previous status: ⏸️ DRAFT                     │
│ • Bank balance: 15,000 บาท ✅                   │
│ • [Click: Complete Transaction]                 │
│                                                 │
│ System calculates new balance:                  │
│ 15,000 - 8,800 = 6,200 บาท                     │
│ Status: ✅ COMPLETED                            │
└─────────────────────────────────────────────────┘
           ↓
RESULT:
✅ Transaction #3 successfully completed
✅ Customer C gets 8,800 บาท transfer
✅ Manager gets 40 บาท commission
✅ All balances updated correctly
```

---

## UI Status Indicators:

```
✅ COMPLETED   - Transaction processed successfully
❌ FAILED      - Transaction could not be processed
⏸️ DRAFT       - Waiting for funds (not yet processed)
⏳ PENDING     - Awaiting confirmation
🔄 PROCESSING  - In progress

For Draft Transactions:
⏸️ DRAFT (Insufficient Funds)  - Waiting for owner deposit
⏸️ DRAFT (Awaiting Verification)- Waiting for bank confirmation
⏸️ DRAFT (Cancelled)            - User cancelled the transaction
```

---

## 🎯 Key UI Components Needed

### Forms & Inputs:
- [ ] Transaction Type Selector (Radio/Buttons):
  - [ ] Transfer (โอนเงิน)
  - [ ] Withdrawal (ถอนเงิน)
  - [ ] Owner Deposit (ฝากเงิน)
- [ ] Channel Selector (PromptPay, Bank, Other)
  - [ ] PromptPay (shows identifier type selector + account name)
    - [ ] Phone Number (xxx-xxx-xxxx)
    - [ ] ID Card Number (x-xxxx-xxxxx-xx-x)
  - [ ] Bank (shows account type + account number + name)
  - [ ] Other (shows custom fields)
- [ ] Destination Account Info:
  - [ ] Account Type selector (Savings/Current/Other)
  - [ ] Account Number input
  - [ ] Account Name input
  - [ ] Phone Number (for PromptPay)
- [ ] Date & Time Picker
- [ ] Numeric Input with auto-formatting (currency)
  - [ ] Automatic balance sufficiency check
  - [ ] Warning indicator when insufficient
- [ ] Notes/Textarea
- [ ] Save Status Selector:
  - [ ] ◉ Save & Complete
  - [ ] ○ Save as Draft (greyed out if sufficient funds)
- [ ] Checkbox for completion status

### Display Components:
- [ ] Real-time Balance Display with warnings
  - [ ] ⚠️ Show when insufficient for pending transfer
  - [ ] ✅ Show when sufficient
- [ ] Transaction Table with:
  - [ ] Row Actions (View, Edit, Delete)
  - [ ] Filter tabs (All, Completed, Draft, Failed)
  - [ ] Status badges (✅/❌/⏸️)
  - [ ] Color coding for draft rows
- [ ] Draft Transaction Indicator Panel:
  - [ ] List of all draft transactions
  - [ ] Reason for draft status
  - [ ] Action buttons (Complete, Cancel)
- [ ] Transaction Detail Popup:
  - [ ] Full transaction information
  - [ ] Balance impact calculation
  - [ ] For draft: reason and required funds
  - [ ] For completed: confirmation status
- [ ] Insufficient Funds Alert:
  - [ ] Current balance
  - [ ] Required amount
  - [ ] Shortfall amount
  - [ ] Suggestion to contact owner
- [ ] Verification Checklist with Progress
- [ ] Comparison Table (Expected vs Actual)
- [ ] Status Badge (Verified, Audited, Approved, etc.)
- [ ] Collapsible Detail Sections
- [ ] Summary Cards

### Action Components:
- [ ] Confirmation Modal:
  - [ ] Transaction confirmation
  - [ ] Draft vs Completed choice
- [ ] Success/Error Notifications:
  - [ ] "Transaction saved as draft"
  - [ ] "Insufficient funds - saved as draft"
  - [ ] "Owner deposit recorded"
  - [ ] "Draft transaction completed"
- [ ] Draft Transaction Actions:
  - [ ] [✅ Complete Transaction] button
  - [ ] [❌ Cancel Draft] button
  - [ ] [✏️ Edit Draft] button
- [ ] Approval Decision Buttons
- [ ] Navigation (Previous/Next Steps)
- [ ] Balance Sufficiency Check:
  - [ ] Auto-check on amount entry
  - [ ] Enable/disable "Save & Complete" based on balance
  - [ ] Show "Save as Draft" option only when insufficient

### Reports:
- [ ] Transaction Summary Report
- [ ] Verification Report
- [ ] Audit Report
- [ ] Approval Report

