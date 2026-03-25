# 📐 Wireframes: FLOW 2 Workflows 2.0 - 2.3
## Daily Money Transfer Service Income (นับและตรวจสอบเงินจากบริการโอนเงิน)

---

# 🔷 WORKFLOW 2.0: History Page (Unified Entry Point)

## Money Transfer History Page
**Route**: `/finance/money-transfer-history`
**Role**: owner, manager, assistant_manager, auditor
**Sidebar**: เมนู "บริการโอนเงิน" ชี้มาที่หน้านี้แทนทุก Role

### Layout: Main History & Inbox Page

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  🏦 ประวัติบริการโอนเงิน          [➕ เพิ่มรายการ] ← EDIT_FIN  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📊 PENDING INBOX (เปลี่ยนตาม Role)                              │
│  ┌──────────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ 🔴 รอดำเนินการ   │  │ 🟠 รอตรวจสอบ │  │ ✅ อนุมัติแล้ว   │  │
│  │                  │  │              │  │                  │  │
│  │  Manager: in_progress+needs_correction                   │  │
│  │  Auditor: step2_completed                                │  │
│  │  Owner:   audited                                        │  │
│  └──────────────────┘  └──────────────┘  └──────────────────┘  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📋 HISTORY LIST                                                 │
│  ┌────────┬──────────────────────┬──────┬────────┬───────────┐  │
│  │ วันที่  │ สถานะ               │ Txn  │ ยอดรวม │ Actions   │  │
│  ├────────┼──────────────────────┼──────┼────────┼───────────┤  │
│  │ 6 มี.ค.│ 🔵 กำลังทำงาน       │  12  │ 28,000 │ [ทำงาน]   │  │
│  │ 5 มี.ค.│ 🟡 รออนุมัติ        │  23  │ 45,000 │ [อนุมัติ] │  │
│  │ 4 มี.ค.│ 🟠 รอตรวจสอบ       │  18  │ 32,000 │ [ตรวจสอบ] │  │
│  │ 3 มี.ค.│ 🔴 รอแก้ไข         │   8  │ 12,000 │ [แก้ไข]   │  │
│  │ 2 มี.ค.│ ✅ อนุมัติแล้ว      │  21  │ 38,000 │[ดูรายละฯ]│  │
│  └────────┴──────────────────────┴──────┴────────┴───────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

* Actions button label + destination เปลี่ยนตาม Role × workflowStatus
* ปุ่ม [เพิ่มรายการ] แสดงเฉพาะ Role ที่มี EDIT_FINANCE permission
```

---

## Modal: เพิ่มรายการ → Date Picker

> กด [➕ เพิ่มรายการ] → เปิด Modal เลือกวันที่

```
┌──────────────────────────────────────────┐
│  ➕ เพิ่มรายการบริการโอนเงิน        [✕]  │
├──────────────────────────────────────────┤
│                                          │
│  เลือกวันที่:  [📅 2026-03-06]           │
│                                          │
│  * สามารถเลือกวันย้อนหลังได้             │
│    กรณีระบบมีปัญหาในวันก่อนหน้า          │
│    (Manager/Owner เท่านั้น)              │
│                                          │
│         [ยกเลิก]  [➡ ไปบันทึกรายการ]    │
└──────────────────────────────────────────┘

→ Navigate to /finance/money-transfer-service?date=YYYY-MM-DD
```

---

## Smart Action Button — Role × workflowStatus

> **หมายเหตุ (Updated)**: WF 2.2 และ WF 2.3 ถูกรวมเข้าหน้าเดียวกับ WF 2.1 แล้ว
> ไม่มีหน้า `auditor-review` หรือ `owner-approval` แยกต่างหาก — ทุก Role ใช้ `/finance/money-transfer-service?date=`
> และแต่ละ Section แสดง/ซ่อนตาม Role × workflowStatus

| Role | workflowStatus | ปุ่ม | Route ปลายทาง |
|------|---------------|------|--------------|
| manager/AM | step1_in_progress | **"ทำงาน"** | `money-transfer-service?date=` |
| manager/AM | needs_correction | **"แก้ไข"** | `money-transfer-service?date=` |
| manager/AM | step2_completed/audited/approved | **"ดูรายละเอียด"** | `money-transfer-service?date=` (read-only) |
| auditor | step2_completed | **"ตรวจสอบ"** | `money-transfer-service?date=` (Section 6B แสดง Auditor form) |
| auditor | audited | **"ดูการตรวจสอบ"** | `money-transfer-service?date=` (Section 6B read-only) |
| auditor | step1_in_progress/step1_completed | **"ดูรายละเอียด"** | `money-transfer-service?date=` (read-only) |
| owner | audited | **"อนุมัติ"** | `money-transfer-service?date=` (Section 6C แสดง Owner Decision) |
| owner | approved | **"ดูรายละเอียด"** | `money-transfer-service?date=` (Section 6C approved banner) |
| owner | step1_*/step2_completed | **"ดูรายละเอียด"** | `money-transfer-service?date=` (read-only) |

---

## Status Badge Colors

| workflowStatus | สี | ป้าย |
|---------------|-----|------|
| step1_in_progress | 🔵 Blue | กำลังทำงาน |
| step1_completed | 🔵 Blue | รอตรวจนับเงิน |
| step2_completed | 🟠 Orange | รอตรวจสอบ Auditor |
| audited | 🟡 Yellow | รออนุมัติ Owner |
| approved | ✅ Green | อนุมัติแล้ว |
| needs_correction | 🔴 Red | รอแก้ไข |

---

# 🔷 WORKFLOW 2.1: Manager - Record Transfer & Verification

## Main Page: บริการโอนเงิน (Role-Based Dashboard)
**Route**: `/finance/money-transfer-service?date=YYYY-MM-DD`
**Role**: manager, assistant_manager, auditor, owner
*(เข้ามาจาก History Page — ปุ่ม "ทำงาน"/"แก้ไข"/"ดูรายละเอียด")*

> **Design Decision (Updated)**:
> - หน้าเดียวกันสำหรับทุก Role — แต่ละ section แสดง/ซ่อนตาม Role × workflowStatus
> - ส่วนกรอกรายการย้ายเข้า **Modal** ทั้งหมด — หน้าหลักเป็น Dashboard สะอาด
> - **⭐ Quick Actions** แสดงเฉพาะ Manager/Asst.Mgr ขณะ `step1_in_progress`
> - **💵 ผลการตรวจนับ** แสดงเมื่อ workflowStatus ≠ `step1_in_progress` (ทุก Role)
> - Transaction List: Pagination 10 รายการ/หน้า

---

### Role × Section Visibility Matrix

| Section | Manager / Asst.Mgr | Auditor | Owner | เงื่อนไขเพิ่มเติม |
|---|:---:|:---:|:---:|---|
| Opening Balance (blue banner) | ✅ | ❌ | ❌ | ซ่อนเมื่อ opening ตั้งค่าแล้ว |
| ยอดเงินปัจจุบัน (8 การ์ด) | ✅ | ✅ | ✅ | — |
| ⚡ Quick Actions (4 ปุ่ม) | ✅ | ❌ | ❌ | + `step1_in_progress` เท่านั้น |
| ⚠️ Draft Alert | ✅ | ❌ | ❌ | + มี draft transactions |
| 📋 Transaction List | ✅ + edit/delete | ✅ view only (ซ่อนเมื่อ step2 done) | ✅ collapsible (ซ่อน default) | pagination 10/หน้า; ซ่อนเมื่อ Auditor step2_completed หรือ Owner audited |
| ปุ่ม "+ รายการใหม่" | ✅ | ❌ | ❌ | + `step1_in_progress` + opening set แล้ว |
| Prerequisite Checklist + ปุ่ม "ยืนยันบันทึก" | ✅ | ❌ | ❌ | + step1 ยังไม่เสร็จ |
| [6A] นับเงินสด — form กรอก (A+B+C) | ✅ editable | ❌ | ❌ | + step2 ยังไม่เสร็จ + ไม่ใช่ Owner |
| [6A] นับเงินสด — read-only (`MoneyTransferCashVerificationTable`) | ✅ (หลัง step2 done) | ✅ (แสดงก่อน 6B form) | ❌ | status ≠ `step1_in_progress` + ไม่ใช่ Owner + ไม่ใช่ (Auditor + step2 done) |
| [6B] Auditor Review — form กรอก | ❌ | ✅ editable | ❌ | Auditor + status = `step2_completed` เท่านั้น |
| [6B] Audit Result — read-only (Balance + Txn + Cash Table) | ✅ | ✅ | ✅ | status ≥ `audited` |
| [6C] Owner Decision + Action Buttons | ❌ | ❌ | ✅ | Owner + status ≥ `audited` |

---

### Layout: Full Page Wireframe

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  🏦 บริการโอนเงิน              [← ประวัติ]  [วันที่: 04/03/26]  │
│  บันทึกรายการและตรวจนับเงินสด                                    │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ── SECTION 1: Opening Balance ─────────────────── (Manager/AM) │
│                                                                 │
│  [กรณียังไม่ตั้งค่า → แสดง]                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 💳 กำหนดยอดเงินในบัญชีเริ่มต้น       [กำหนดยอดเริ่มต้น]  │   │
│  │    กรุณากำหนดยอดเงินก่อนเริ่มบันทึกรายการ               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [กรณีตั้งค่าแล้ว → ซ่อน banner นี้ ยอดเริ่มต้นแสดงเป็นการ์ด] │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ── SECTION 2: ยอดเงินปัจจุบัน ──────────────────── (ทุก Role) │
│  📊 ยอดเงินปัจจุบัน                                              │
│                                                                 │
│  แถวที่ 1 — รายละเอียดรายการ (4 การ์ด)                           │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐     │
│  │เงินในบัญชีเริ่มต้น│  รวมเงินฝาก │  รวมเงินโอน │  รวมเงินถอน │     │
│  │  (opening)  │(owner_dep.) │ (transfer)  │(withdrawal) │     │
│  │  7,710 บ   │     0 บ    │  3,950 บ   │     0 บ    │     │
│  │   gray      │   blue      │    red      │  purple     │     │
│  └─────────────┴─────────────┴─────────────┴─────────────┘     │
│                                                                 │
│  แถวที่ 2 — สรุปยอด (4 การ์ด)                                   │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐     │
│  │รวมค่าบริการ  │รวมค่าบริการ  │เงินในบัญชี  │เงินสดคงเหลือ│     │
│  │ (เงินสด)   │ (เงินโอน)   │  คงเหลือ   │             │     │
│  │   30 บ    │    0 บ    │  3,760 บ   │  3,980 บ   │     │
│  │  green     │  green      │  gray/bold  │  blue/bold  │     │
│  └─────────────┴─────────────┴─────────────┴─────────────┘     │
│                                                                 │
│  สูตร:                                                          │
│  เงินในบัญชีคงเหลือ = เริ่มต้น + ฝาก - โอน + ถอน + บริการ(โอน)  │
│  เงินสดคงเหลือ     = รวมเงินโอน - รวมเงินถอน + รวมค่าบริการ(เงินสด)│
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ── SECTION 3: Quick Actions ─── (Manager/AM + step1_in_progress)│
│  ⚡ รายการด่วน                                                   │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐ │
│  │ ⭐ รายการโปรด │  ↑ โอนเงิน   │  ↓ ถอนเงิน  │  ฝากเงิน   │ │
│  └──────────────┴──────────────┴──────────────┴──────────────┘ │
│  * ซ่อนทั้ง section เมื่อ workflowStatus ≠ step1_in_progress    │
│  * ซ่อนทั้ง section เมื่อ role = auditor หรือ owner             │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ── SECTION 4: Draft Alert ──────────────────── (Manager/AM only)│
│  [แสดงเฉพาะเมื่อมี draft transactions]                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ⚠️ Draft Transactions (2 รายการ)                        │   │
│  │                                                         │   │
│  │ DRAFT │ โอนเงิน │ 8,800 บ │ ขาด 3,800 บ │[ดำเนิน][ลบ] │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ── SECTION 5: Transaction List ──────────────────── (ทุก Role) │
│  📋 รายการธุรกรรมวันนี้           [+ รายการใหม่] ← Manager/AM   │
│                                                                 │
│  [ทั้งหมด 6] [สำเร็จ 5] [รอดำเนินการ 1] [ล้มเหลว 0]            │
│                                                                 │
│  ┌───┬───────┬───────────┬────────────────┬────────┬─────────┐  │
│  │ # │ เวลา  │ ประเภท    │ ชื่อบัญชี       │ จำนวน  │ จัดการ  │  │
│  ├───┼───────┼───────────┼────────────────┼────────┼─────────┤  │
│  │ 1 │ 10:30 │ PromptPay │ สมชาย          │ 2,000 │ 👁 ✏️ 🗑 │  Manager/AM
│  │ 2 │ 13:15 │ ถอนเงิน   │ -              │   500 │ 👁 ✏️ 🗑 │  │
│  │ 3 │ 14:00 │ Bank Trf  │ สมชาย บ.      │ 8,800 │ 👁 ✏️ 🗑 │  │
│  │ 4 │ 14:30 │ ฝากเงิน  │ เจ้าของ        │10,000 │ 👁 ✏️ 🗑 │  │
│  │ 5 │ 14:45 │ Bank Trf  │ นายดำ          │ 8,800 │ 👁 ✏️ 🗑 │  │
│  │ 1 │ 10:30 │ PromptPay │ สมชาย          │ 2,000 │   👁    │  Auditor/Owner
│  └───┴───────┴───────────┴────────────────┴────────┴─────────┘  │
│                   (แสดงสูงสุด 10 รายการ/หน้า)                   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │       [< ก่อนหน้า]   หน้า 1 จาก 3   [ถัดไป >]          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ── SECTION 6: ผลการตรวจนับเงินสด ────────────────────────────  │
│  เงื่อนไขแสดง: workflowStatus ≠ 'step1_in_progress'             │
│                                                                 │
│  ┌─ [6A] ผลนับเงินสด (Manager บันทึก) ──────────────────────┐  │
│  │                                                           │  │
│  │  [CASE A — กรอก] Manager/AM + step2 ยังไม่เสร็จ           │  │
│  │  ────────────────────────────────────────────────         │  │
│  │  💵 ตรวจนับเงินสดจริง                                      │  │
│  │  ┌───────────────────────────────────────────────────┐    │  │
│  │  │ A. เงินสดจากโอน/ถอนเงิน                           │    │  │
│  │  │    คาดหวัง: 3,950 บาท                             │    │  │
│  │  │    นับจริง: [___________] บาท   ผลต่าง: [AUTO]   │    │  │
│  │  │                                                   │    │  │
│  │  │ B. ค่าบริการ (เงินสด)                             │    │  │
│  │  │    คาดหวัง: 30 บาท                                │    │  │
│  │  │    นับจริง: [___________] บาท   ผลต่าง: [AUTO]   │    │  │
│  │  │                                                   │    │  │
│  │  │ ─────────────────────────────────────────         │    │  │
│  │  │ รวมเงินสดทั้งหมด: [_______]  คาดหวัง: 3,980  ∆:[]│    │  │
│  │  └───────────────────────────────────────────────────┘    │  │
│  │  [หมายเหตุ — แสดงเมื่อมีผลต่าง]  [___________________]   │  │
│  │                  [ยืนยัน → ตรวจนับเงินสด]                 │  │
│  │                                                           │  │
│  │  [CASE B — อ่านอย่างเดียว] step2 เสร็จแล้ว / ทุก Role    │  │
│  │  ────────────────────────────────────────────────         │  │
│  │  💵 ผลนับเงินสด (Manager)     [✅ ตรงกัน / ⚠️ มีผลต่าง]  │  │
│  │  ┌─────────────────────┬─────────┬─────────┬──────────┐  │  │
│  │  │ รายการ              │  คาดไว้ │  นับจริง │  ผลต่าง  │  │  │
│  │  ├─────────────────────┼─────────┼─────────┼──────────┤  │  │
│  │  │ A. เงินสดโอน/ถอน   │ 3,950 บ │ 3,950 บ │  ✓ ตรง  │  │  │
│  │  │ B. ค่าบริการ (สด)  │    30 บ │    30 บ │  ✓ ตรง  │  │  │
│  │  ├─────────────────────┼─────────┼─────────┼──────────┤  │  │
│  │  │ รวมเงินสด           │ 3,980 บ │ 3,980 บ │  ✓ ตรง  │  │  │
│  │  └─────────────────────┴─────────┴─────────┴──────────┘  │  │
│  │  หมายเหตุ: "..." (แสดงเมื่อมี verificationNotes)           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─ [6B] Auditor Review Form ─── (Auditor + step2_completed) ─┐  │
│  │  🔍 ตรวจสอบบริการโอนเงิน              [⏳ รอตรวจสอบ]        │  │
│  │                                                           │  │
│  │  ─ ยอดเงินในบัญชี Bank ─────────────────────────────────  │  │
│  │  ┌─ MoneyTransferBalanceSnapshot ───────────────────────┐  │  │
│  │  │ ยอดเปิด: 7,710 บ              ยอดปิด: 3,760 บ       │  │  │
│  │  │ ─────────────────────────────────────────────────── │  │  │
│  │  │ Bank Statement แสดง: [___________] บาท              │  │  │
│  │  │ ผลต่าง (Statement − ยอดปิด): [AUTO ✅/❌]            │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  │                                                           │  │
│  │  ─ รายการธุรกรรม [collapsible ▶/▼] ─ 6 รายการ ─ [badge]─  │  │
│  │  [เมื่อขยาย → MoneyTransferTransactionTable]               │  │
│  │  ┌───┬───────┬───────────┬──────────┬────────┬──────────┐  │  │
│  │  │ # │ เวลา  │ ประเภท    │ บัญชี    │ จำนวน  │ จัดการ   │  │  │
│  │  ├───┼───────┼───────────┼──────────┼────────┼──────────┤  │  │
│  │  │ 1 │ 10:30 │ PromptPay │ สมชาย   │ 2,000  │👁 [มีปัญหา]│  │  │
│  │  │ 2 │ 13:15 │ ถอนเงิน   │ -        │   500  │👁 [มีปัญหา]│  │  │
│  │  └───┴───────┴───────────┴──────────┴────────┴──────────┘  │  │
│  │  * [มีปัญหา] toggle → mark/unmark issue badge บนแถวนั้น    │  │
│  │  * footer: รวม N รายการ · ⚠️ X รายการมีปัญหา / ✅ ไม่พบ   │  │
│  │                                                           │  │
│  │  ─ ตรวจสอบยอดเงินสด ─────────────────────────────────── │  │
│  │  ┌────────────────────┬──────────┬──────────┬────────────┬──────┐│  │
│  │  │ รายการ             │  คาดหวัง │ Manager  │  Auditor   │ผลต่าง││  │
│  │  ├────────────────────┼──────────┼──────────┼────────────┼──────┤│  │
│  │  │ เงินสดโอน/ถอน      │ 3,950 บ │ 3,950 บ  │[__________]│[AUTO]││  │
│  │  │ ค่าบริการเงินสด     │    30 บ │    30 บ  │[__________]│[AUTO]││  │
│  │  ├────────────────────┼──────────┼──────────┼────────────┼──────┤│  │
│  │  │ รวม                │ 3,980 บ │ 3,980 บ  │ [AUTO]     │[AUTO]││  │
│  │  └────────────────────┴──────────┴──────────┴────────────┴──────┘│  │
│  │  * Auditor column = input fields; ผลต่าง = Auditor − คาดหวัง   │  │
│  │  * canSubmitAudit = Auditor กรอก A และ B แล้วทั้งคู่           │  │
│  │                                                           │  │
│  │  ─ รายละเอียดปัญหาที่พบ (ถ้ามี) ───────────────────────── │  │
│  │  [_______________________________________________]         │  │
│  │  [_______________________________________________]         │  │
│  │  (ว่างได้ถ้าไม่พบปัญหา)                                    │  │
│  │                                                           │  │
│  │  [⚠️ พบ X รายการมีปัญหา — แสดงเมื่อ txnsWithIssues > 0]  │  │
│  │                                                           │  │
│  │        [❌ ส่งคืนแก้ไข]    [✅ ยืนยันการตรวจสอบ]          │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─ [6B] Audit Result — Read-only ─── (ทุก Role, status ≥ audited) ┐
│  │  🔍 ผลการตรวจสอบ Auditor        [✅ ตรวจสอบแล้ว]            │  │
│  │                                                           │  │
│  │  ─ ยอดเงินในบัญชี Bank ─────────────────────────────────  │  │
│  │  ┌─ MoneyTransferBalanceSnapshot ───────────────────────┐  │  │
│  │  │ ยอดเปิด: 7,710 บ              ยอดปิด: 3,760 บ       │  │  │
│  │  │ รายการเดินบัญชี: 3,780 บ (Auditor กรอก) ✅/⚠️        │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  │                                                           │  │
│  │  ─ รายการธุรกรรม [collapsible] ─── N รายการ ─── [badge] ─  │  │
│  │  [เมื่อขยาย → MoneyTransferTransactionTable พร้อม issue flags]│  │
│  │  footer: ตรวจสอบ N รายการ · มีปัญหา X · โดย [name] · [datetime]│  │
│  │                                                           │  │
│  │  ─ ตรวจสอบยอดเงินสด ─ MoneyTransferCashVerificationTable ─ │  │
│  │  ┌────────────────────┬──────────┬──────────┬────────────┐  │  │
│  │  │ รายการ             │  คาดหวัง │ Manager  │  Auditor   │  │  │
│  │  ├────────────────────┼──────────┼──────────┼────────────┤  │  │
│  │  │ เงินสดโอน/ถอน      │ 3,950 บ │ 3,950 บ  │  3,950 บ  │  │  │
│  │  │ ค่าบริการเงินสด     │    30 บ │    30 บ  │     30 บ  │  │  │
│  │  └────────────────────┴──────────┴──────────┴────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─ [6C] Owner Approval ─────── (Owner + status ≥ audited) ──┐  │
│  │  ✅ การอนุมัติ Owner        [✅ อนุมัติแล้ว / ⏳ รออนุมัติ]│  │
│  │                                                           │  │
│  │  [ถ้า approved แล้ว → แสดง Banner สีเขียว + ซ่อน form]    │  │
│  │  ┌───────────────────────────────────────────────────────┐ │  │
│  │  │ ✅ อนุมัติแล้ว                                         │ │  │
│  │  │ วันที่ YYYY-MM-DD — ได้รับการอนุมัติจาก Owner          │ │  │
│  │  │ หมายเหตุ: [ownerNotes] (ถ้ามี)                        │ │  │
│  │  └───────────────────────────────────────────────────────┘ │  │
│  │                                                           │  │
│  │  [ถ้ายังไม่ approved → แสดง Decision Card]                 │  │
│  │  ┌─ Owner Decision Card ─────────────────────────────────┐ │  │
│  │  │ ┌─────────────────┬───────────────────┬─────────────┐ │ │  │
│  │  │ │ ◉ อนุมัติ ✅    │ ○ อนุมัติ+หมายเหตุ│ ○ ขอให้แก้  │ │ │  │
│  │  │ │  บันทึกเป็น     │  มีข้อสังเกต      │  ส่งคืน    │ │ │  │
│  │  │ │  ที่สิ้นสุด      │  เพิ่มเติม        │  Auditor/  │ │ │  │
│  │  │ │                │                   │  Manager   │ │ │  │
│  │  │ └─────────────────┴───────────────────┴─────────────┘ │ │  │
│  │  │ [ถ้า approve_with_notes → textarea หมายเหตุ]           │ │  │
│  │  │ [ถ้า request_correction → textarea เหตุผลแก้ไข]        │ │  │
│  │  └───────────────────────────────────────────────────────┘ │  │
│  │                                                           │  │
│  │        [❌ ส่งคืนแก้ไข]    [✅ อนุมัติ / ส่งคืน]          │  │
│  │        * ปุ่มซ้าย = shortcut ส่งคืน (confirm dialog)      │  │
│  │        * ปุ่มขวา label = "อนุมัติ ✅" หรือ "ส่งคืน"       │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### Section 6 — Role Differences

| Sub-section | Manager / Asst.Mgr | Auditor | Owner | เงื่อนไข |
|---|:---:|:---:|:---:|---|
| **[6A] นับเงินสด — form กรอก (A+B+C)** | ✅ editable | ❌ | ❌ | step2 ยังไม่เสร็จ |
| **[6A] นับเงินสด — read-only** | ✅ (หลัง step2 done) | ❌ (ซ่อนเมื่อ step2 done) | ❌ | `MoneyTransferCashVerificationTable` |
| **[6B] Auditor form** (Balance Snapshot + Txn List + 4-col Cash Table + Issue Details) | ❌ | ✅ editable | ❌ | Auditor + step2_completed |
| **[6B] Audit Result read-only** (Balance Snapshot + Txn List + Cash Table 3-col) | ✅ | ✅ | ✅ | status ≥ audited |
| **[6C] Owner Decision Card + Buttons** | ❌ | ❌ | ✅ | Owner + audited |
| **[6C] Approved Banner** | ❌ | ❌ | ✅ | Owner + approved |

---

### Step 1 Complete Button + Prerequisite Checklist (Manager/AM only)

```
[แสดงเมื่อ: Manager/AM + workflowStatus = step1_in_progress]

┌──────────────────────────────────────────────────────────────────┐
│  📋 เงื่อนไขก่อนยืนยันบันทึกรายการ                                │
│  (หรือ ✅ พร้อมยืนยันบันทึกรายการแล้ว — เมื่อครบทุกข้อ)          │
│                                                                  │
│  ✅ / ⬜  กำหนดยอดเงินเริ่มต้นแล้ว                               │
│  ✅ / ⬜  มีรายการอย่างน้อย 1 รายการ (ปัจจุบัน: N รายการ)         │
│  ✅ / ❌  ไม่มีดราฟต์ค้างอยู่ (N รายการ ถ้ามี)                    │
│                                                                  │
│  [⚠️ Warning: มี Draft ค้าง — แสดงเมื่อ hasDrafts]               │
│                                                                  │
│          [ยืนยันบันทึกรายการ → ตรวจนับเงินสด]                    │
│          (disabled เมื่อ: hasDrafts / total=0 / opening ไม่ set) │
│          (ring animation เมื่อ canCompleteStep1 = true)          │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
* กด → store.completeStep1(date)
       → workflowStatus เปลี่ยนเป็น step1_completed
       → Section 6A (Form ตรวจนับ) ปลดล็อก
       → Scroll ลงไปที่ #cash-counting-section อัตโนมัติ (300ms)
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

## Step 2: ตรวจนับเงินสด (Section 6 ในหน้าเดิม)
**Route**: `/finance/money-transfer-service?date=YYYY-MM-DD`
*(Section 6 ในหน้าเดียวกัน — ปลดล็อกหลังกด "ยืนยันบันทึกรายการ")*
**Role**: Manager/Assistant Manager (กรอก), Auditor/Owner (ดูอย่างเดียว)

> ดู Layout ทั้งหมดใน **Section 6** ของ Main Page Wireframe ด้านบน

### หลังยืนยันการตรวจนับ (workflowStatus → step2_completed):

```
┌─────────────────────────────────────┐
│ ✅ ตรวจนับเงินสดเสร็จสมบูรณ์         │
├─────────────────────────────────────┤
│                                     │
│ ตรวจนับโดย: สมชาย                    │
│ เวลา: 2026-03-04 17:00              │
│                                     │
│ A. เงินสดโอน/ถอน:  3,950 บ  ✅ ตรง │
│ B. ค่าบริการเงินสด:   30 บ  ✅ ตรง  │
│ รวมเงินสด:         3,980 บ  ✅ ตรง  │
│                                     │
│ ✅ พร้อมส่ง Auditor ตรวจสอบ         │
│                                     │
│              [← กลับประวัติ]         │
└─────────────────────────────────────┘
* workflowStatus → step2_completed
* Section 6 เปลี่ยนเป็น read-only table (CASE B) ทันที
```

---

# 🔷 WORKFLOW 2.2: Auditor - Verify Money Transfer Service Income

## Auditor Review (Section 6B ในหน้า index.vue)
**Route**: `/finance/money-transfer-service?date=YYYY-MM-DD`
**Role**: Auditor (section 6B แสดงเมื่อ `isAuditor && store.isStep2Complete && !store.isAudited`)
*(เข้ามาจาก History Page โดยคลิก "ตรวจสอบ" — ใช้หน้าเดียวกับ WF 2.1)*

> **Design Decision**: ไม่มีหน้าแยก `auditor-review.vue` แล้ว — Section 6B ในหน้า index.vue
> ทำหน้าที่แทนทั้งหมด Transaction list ของ Auditor ซ่อนเมื่อ step2 complete (ใช้ list ใน 6B แทน)

### Layout: Section 6B — Auditor Review Form

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  🏦 บริการโอนเงิน              [← ประวัติ]  [วันที่: YYYY-MM-DD] │
│  (header เดิม — ทุก Role ใช้หน้าเดียวกัน)                        │
│                                                                 │
│  [Section 1-5 แสดงตามปกติ — Transaction List ซ่อนเมื่อ step2 done]
│                                                                 │
├─ Section 6B: ตรวจสอบบริการโอนเงิน ─── [⏳ รอตรวจสอบ] ─────────┤
│                                                                 │
│  ── ยอดเงินในบัญชี Bank ─────────────────────────────────────  │
│  ┌─ MoneyTransferBalanceSnapshot ─────────────────────────────┐ │
│  │  ยอดเงินเริ่มต้น (Opening):  7,710 บาท                    │ │
│  │  ยอดเงินปิด     (Closing):   3,760 บาท                    │ │
│  │  ─────────────────────────────────────────────────────    │ │
│  │  Bank Statement แสดง: [___________] บาท                   │ │
│  │  ผลต่าง (Statement − ยอดปิด):  [0 บ ✅ ตรงกัน / +X ❌]   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ── รายการธุรกรรม [▶ ขยาย / ▼ ซ่อน] ─── 6 รายการ ── [badge] ─ │
│  [เมื่อขยาย → MoneyTransferTransactionTable]                    │
│  ┌───┬───────┬───────────┬──────────────┬────────┬────────────┐ │
│  │ # │ เวลา  │ ประเภท    │ บัญชีปลายทาง │ จำนวน  │ จัดการ     │ │
│  ├───┼───────┼───────────┼──────────────┼────────┼────────────┤ │
│  │ 1 │ 10:30 │ PromptPay │ สมชาย        │ 2,000  │ 👁 [มีปัญหา]│ │
│  │ 2 │ 13:15 │ ถอนเงิน   │ -            │   500  │ 👁 [มีปัญหา]│ │
│  └───┴───────┴───────────┴──────────────┴────────┴────────────┘ │
│  * [มีปัญหา] = toggle; เมื่อ active → แถวนั้นถูก flag           │
│  * footer: รวม N รายการ · ⚠️ X รายการมีปัญหา / ✅ ไม่พบปัญหา  │
│                                                                 │
│  ── ตรวจสอบยอดเงินสด ──────────────────────────────────────── │
│  ┌──────────────────┬──────────┬──────────┬────────────┬───────┐ │
│  │ รายการ           │  คาดหวัง │ Manager  │  Auditor   │ผลต่าง │ │
│  ├──────────────────┼──────────┼──────────┼────────────┼───────┤ │
│  │ เงินสดโอน/ถอน   │ 3,950 บ │ 3,950 บ  │[__________]│[AUTO] │ │
│  │ ค่าบริการเงินสด  │    30 บ │    30 บ  │[__________]│[AUTO] │ │
│  ├──────────────────┼──────────┼──────────┼────────────┼───────┤ │
│  │ รวม              │ 3,980 บ │ 3,980 บ  │ [AUTO]     │[AUTO] │ │
│  └──────────────────┴──────────┴──────────┴────────────┴───────┘ │
│  * Auditor column = input fields (type=number)                  │
│  * ผลต่าง = Auditor − คาดหวัง (สีเขียว=0, แดง≠0)              │
│  * canSubmitAudit: ต้องกรอก A และ B ทั้งคู่ก่อน                │
│                                                                 │
│  ── รายละเอียดปัญหาที่พบ (ถ้ามี) ─────────────────────────────  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ [_______________________________________________]           │ │
│  │ (ว่างได้ถ้าไม่พบปัญหา)                                      │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  [⚠️ พบ X รายการมีปัญหาในรายการธุรกรรม — แสดงเมื่อ > 0]        │
│                                                                 │
│          [❌ ส่งคืนแก้ไข]      [✅ ยืนยันการตรวจสอบ]            │
│          (ConfirmDialog)        (disabled จนกว่ากรอก A+B)      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

> **หมายเหตุการออกแบบ:**
> - Auditor นับ A+B **ด้วยตนเอง** (independent verification) — ไม่ copy จาก Manager
> - ไม่มี Reconciliation feature — Bank Statement ใส่เป็น input เดียว คำนวณ diff ได้เลย
> - "ส่งคืนแก้ไข" → `store.submitAudit(date, { auditResult: 'rejected' })`
> - "ยืนยันการตรวจสอบ" → `store.submitAudit(date, { auditResult: 'no_issues' | 'minor_issues' })`
>   - `no_issues` เมื่อ issueDetails ว่างและไม่มี txnIssueStatus
>   - `minor_issues` เมื่อมีปัญหาอย่างใดอย่างหนึ่ง

### Popup: Transaction Detail (เมื่อ Auditor คลิก row หรือ 👁)

```
เปิด showVerifyModal → verifyingTransaction = txn → แสดง Transaction Detail Modal

┌──────────────────────────────────────────┐
│ รายละเอียดรายการ #1               [✕]   │
├──────────────────────────────────────────┤
│ Status: ✅ COMPLETED                     │
│                                          │
│ ประเภท:   PromptPay Transfer             │
│ จำนวน:    2,000 บาท                      │
│ ค่าบริการ: 20 บาท (เงินสด)               │
│ เวลา:     10:30                          │
│ บัญชีปลาย: สมชาย · 081-234-5678         │
│                                          │
│       [ปิด]                              │
└──────────────────────────────────────────┘

* การ flag ปัญหาทำจากปุ่ม [มีปัญหา] ในตาราง — ไม่ได้อยู่ใน modal นี้
```

---

# 🔷 WORKFLOW 2.3: Owner - Approve Money Transfer Service Income

## Owner Approval (Section 6C ในหน้า index.vue)
**Route**: `/finance/money-transfer-service?date=YYYY-MM-DD`
**Role**: Owner (section 6C แสดงเมื่อ `isOwner && store.isAudited`)
*(เข้ามาจาก History Page โดยคลิก "อนุมัติ" — ใช้หน้าเดียวกับ WF 2.1)*

> **Design Decision**: ไม่มีหน้าแยก `owner-approval.vue` แล้ว — Section 6C ใน index.vue
> Transaction list ของ Owner ซ่อนเมื่อ audited (collapsible — collapsed by default)

### Layout: Section 6B + 6C สำหรับ Owner (เมื่อ audited)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  🏦 บริการโอนเงิน              [← ประวัติ]  [วันที่: YYYY-MM-DD] │
│  (header เดิม — ทุก Role ใช้หน้าเดียวกัน)                        │
│                                                                 │
│  [Section 1-2: Opening Balance Banner (ซ่อน) + Balance Cards]   │
│  [Section 3-4: Quick Actions + Draft Alert (ซ่อน — Owner ไม่เห็น)]│
│  [Section 5: Transaction List — collapsed by default สำหรับ Owner]│
│  [คลิก header เพื่อขยาย ▶/▼]                                   │
│                                                                 │
├─ Section 6B: ผลการตรวจสอบ Auditor ─── [✅ ตรวจสอบแล้ว] ────────┤
│                                                                 │
│  ── ยอดเงินในบัญชี Bank ─────────────────────────────────────  │
│  ┌─ MoneyTransferBalanceSnapshot ─────────────────────────────┐ │
│  │  ยอดเปิด: 7,710 บาท              ยอดปิด: 3,760 บาท        │ │
│  │  รายการเดินบัญชี: 3,780 บาท (Auditor กรอก) ✅ ตรวจสอบแล้ว  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ── รายการธุรกรรม [▶ ขยาย / ▼ ซ่อน] ─── N รายการ ─── [badge]  │
│  * พร้อม Auditor issue flags (read-only)                        │
│  * footer: ตรวจสอบ N รายการ · มีปัญหา X · โดย [name] · [time] │
│                                                                 │
│  ── MoneyTransferCashVerificationTable ─────────────────────── │
│  ┌───────────────────┬──────────┬──────────┬────────────┐      │
│  │ รายการ            │  คาดหวัง │ Manager  │  Auditor   │      │
│  ├───────────────────┼──────────┼──────────┼────────────┤      │
│  │ เงินสดโอน/ถอน     │ 3,950 บ │ 3,950 บ  │  3,950 บ  │      │
│  │ ค่าบริการเงินสด   │    30 บ │    30 บ  │     30 บ  │      │
│  └───────────────────┴──────────┴──────────┴────────────┘      │
│                                                                 │
├─ Section 6C: การอนุมัติ Owner ─── [✅ อนุมัติแล้ว / ⏳ รอ] ───  │
│                                                                 │
│  [กรณี approved แล้ว → แสดง Banner สีเขียว]                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ✅ อนุมัติแล้ว                                           │  │
│  │ วันที่ YYYY-MM-DD — ได้รับการอนุมัติจาก Owner            │  │
│  │ หมายเหตุ: "..." (ถ้ามี ownerNotes)                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  [กรณียังไม่ approved → แสดง Decision Card]                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ┌─────────────────┬───────────────────┬─────────────┐   │  │
│  │ │ ◉ อนุมัติ ✅    │ ○ อนุมัติ+หมายเหตุ│ ○ ขอให้แก้  │   │  │
│  │ │  บันทึกเป็น     │  มีข้อสังเกต      │  ส่งคืน     │   │  │
│  │ │  ที่สิ้นสุด      │  เพิ่มเติม        │  Auditor/  │   │  │
│  │ │                │                   │  Manager   │   │  │
│  │ └─────────────────┴───────────────────┴─────────────┘   │  │
│  │ [ถ้า approve_with_notes → textarea หมายเหตุ Owner]        │  │
│  │ [ถ้า request_correction → textarea เหตุผลที่ต้องแก้ไข]   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│        [❌ ส่งคืนแก้ไข]        [✅ อนุมัติ / ส่งคืน]           │
│        (ConfirmDialog)          label = "อนุมัติ ✅" หรือ "ส่งคืน"│
│        * disabled จนกว่าเลือก decision                          │
│        * approve_with_notes ต้องกรอก ownerNotes                 │
│        * request_correction ต้องกรอก correctionReason           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

> **Store Actions:**
> - "อนุมัติ" → `store.submitOwnerApproval(date, { decision: 'approve', ownerNotes })`
> - "อนุมัติพร้อมหมายเหตุ" → `decision: 'approve_with_notes'`
> - "ขอให้แก้ไข" → `decision: 'request_correction', correctionReason`

---

# 📋 Complete Workflow 2.0-2.3 Navigation Flow

```
START (ทุก Role เข้าเมนู "บริการโอนเงิน")
  ↓
┌─────────────────────────────────────────────┐
│ WF 2.0: History Page (Entry Point)         │
├─────────────────────────────────────────────┤
│                                             │
│ /finance/money-transfer-history             │
│ └─ แสดง list ทุกวัน เรียงล่าสุดก่อน       │
│ └─ Pending Inbox Cards (role-specific)     │
│ └─ Smart Action Button (role × status)     │
│ └─ [เพิ่มรายการ] → date picker (EDIT_FIN)  │
│                                             │
└─────────────────────────────────────────────┘
  │
  ├─ Manager/AM คลิก [เพิ่มรายการ] หรือ [ทำงาน]/[แก้ไข]
  │     ↓
  │   ┌─────────────────────────────────────────────┐
  │   │ WF 2.1: Work Page (Manager/AM)             │
  │   ├─────────────────────────────────────────────┤
  │   │                                             │
  │   │ /finance/money-transfer-service?date=       │
  │   │                                             │
  │   │ Section 1: Opening Balance (ถ้ายังไม่ตั้ง) │
  │   │ Section 2: Balance Cards (8 การ์ด)          │
  │   │ Section 3: Quick Actions (4 ปุ่ม)           │
  │   │ Section 4: Draft Alert (ถ้ามี)              │
  │   │ Section 5: Transaction Table + Pagination   │
  │   │ Section 5B: Prerequisite Checklist + ปุ่ม   │
  │   │   → store.completeStep1()                  │
  │   │   → Status: step1_completed                │
  │   │ Section 6A: Cash Count Form (A+B+C)        │
  │   │   → store.completeStep2()                  │
  │   │   → Status: step2_completed ✅             │
  │   │   → router.push('/finance/money-transfer-history')│
  │   │                                             │
  │   └─────────────────────────────────────────────┘
  │
  ├─ Auditor คลิก [ตรวจสอบ] (บน row step2_completed)
  │     ↓
  │   ┌─────────────────────────────────────────────┐
  │   │ WF 2.2: Auditor Review (ใน index.vue)      │
  │   ├─────────────────────────────────────────────┤
  │   │                                             │
  │   │ /finance/money-transfer-service?date=       │
  │   │ (หน้าเดียวกัน — Section 6B แสดงสำหรับ Auditor)│
  │   │                                             │
  │   │ Section 5: Transaction Table ซ่อน (hidden)  │
  │   │ Section 6B Active: Balance Snapshot +       │
  │   │   Collapsible Txn List + 4-col Cash Table + │
  │   │   Issue Details + [ส่งคืน] [ยืนยัน]        │
  │   │   → store.submitAudit()                    │
  │   │   → Status: audited / needs_correction      │
  │   │                                             │
  │   └─────────────────────────────────────────────┘
  │
  └─ Owner คลิก [อนุมัติ] (บน row audited)
        ↓
      ┌─────────────────────────────────────────────┐
      │ WF 2.3: Owner Approval (ใน index.vue)      │
      ├─────────────────────────────────────────────┤
      │                                             │
      │ /finance/money-transfer-service?date=       │
      │ (หน้าเดียวกัน — Section 6B+6C สำหรับ Owner) │
      │                                             │
      │ Section 5: Transaction Table collapsible    │
      │   (collapsed by default สำหรับ Owner)       │
      │ Section 6B Read-only: Audit Result          │
      │   (Balance Snapshot + Txn List + Cash Table)│
      │ Section 6C: Owner Decision Card             │
      │   → store.submitOwnerApproval()            │
      │   → Status: approved ✅ / needs_correction  │
      │                                             │
      └─────────────────────────────────────────────┘
        ↓
COMPLETE ✅ → แสดง Approved Banner ในหน้าเดิม
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

