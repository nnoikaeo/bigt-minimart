# 🔄 Business Workflows

## Overview
Complete business workflows for daily operations

## Workflow 1: ปิดกะขาย (Cashier - Close Shift)

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
     Hand cash bag + notes to Manager
        ↓
     [Complete]
```

### Details
- **Time Required**: ~5-10 minutes
- **Success Criteria**:
  - ✅ Easy data entry, no confusion
  - ✅ Automatic data verification
  - ✅ Clear total display
- **Data Recorded**:
  - Cash amount (by denomination)
  - Transfer amounts (by channel)
  - POSPOS total
  - Date, time, employee info

---

## Workflow 2: บันทึกข้อมูลรายวัน (Manager - Daily Record)

### Process Flow
```
[Start] → Login to system
        ↓
     Add income data:
     - Daily sales (from POSPOS)
     - Money transfer service fees
     - Withdrawal service fees
     - Bill payment service fees
     - Other service fees
        ↓
     Add expense data:
     - Stock purchases (cash)
     - Stock purchases (transfer)
        ↓
     Verify total summary
        ↓
     [Submit] → Status: "submitted"
        ↓
     Hand cash bag + documents to Auditor
        ↓
     [Complete]
```

### Details
- **Time Required**: ~10-15 minutes
- **Success Criteria**:
  - ✅ Quick sales & service entry
  - ✅ Quick service addition
  - ✅ Automatic total calculation
  - ✅ Alerts for unusual data
- **Data Recorded**:
  - All daily income (from Cashier records + new services)
  - All daily expenses
  - Category information
  - Manager notes

---

## Workflow 3: ตรวจสอบยอด (Auditor - Audit Check)

### Process Flow
```
[Start] → Login to system
        ↓
     See "Pending Audit" items
        ↓
     Open item to audit
        ↓
     Count actual cash (by employee):
     - Cash from each employee's bag
     - Verify transfer amounts with bank (by employee)
        ↓
     Record actual cash/transfer amounts (by employee):
     - Cash (by employee)
     - Transfers 3 channels (QR, Bank, Gov)
        ↓
     [System calculates discrepancy automatically]
     - Shows cash difference
     - Shows transfer difference (by channel)
        ↓
     Add audit notes (if discrepancy)
        ↓
     [Approve] → Status: "audited"
        ↓
     Send report to Owner
        ↓
     [Complete]
```

### Details
- **Time Required**: ~10-15 minutes
- **Success Criteria**:
  - ✅ Clear system data display
  - ✅ Accurate automatic discrepancy calculation
  - ✅ Shows audit history
- **Data Recorded**:
  - Actual cash/transfer amounts
  - Discrepancy details
  - Audit notes
  - Auditor info
  - Audit timestamp

---

## Workflow 4: ดูรายงาน (Owner - View Reports)

### Process Flow
```
[Start] → Login to system
        ↓
     Dashboard shows:
     - Daily income
     - Daily expenses
     - Cash flow
     - Comparison graphs
        ↓
     [Choose additional reports]
     - Daily reports
     - Monthly reports
     - Audit reports
        ↓
     [Export data] (if needed)
     - Export to Google Sheets
     - Export to PDF
        ↓
     [Record monthly expenses] (if needed)
        ↓
     [Complete]
```

### Details
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

---

**Source**: Extracted from 02_BUSINESS_REQUIREMENTS.md  
**Last Updated**: Jan 7, 2026  
**Version**: 1.0  
