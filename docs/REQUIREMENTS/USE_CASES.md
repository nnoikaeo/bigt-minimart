# 📋 Use Cases

## Overview
Key use cases for system functionality

## Use Case 1: User Registration & Authentication

**Actor**: Owner, Administrator  
**Precondition**: User has valid credentials  
**Triggers**: Need to add new user to system

### Main Flow
1. Owner logs in to /admin/users
2. Clicks "+ Add User"
3. Fills form with:
   - Name
   - Email
   - Password
   - Role (Owner/Manager/Assistant Manager/Cashier/Auditor)
   - POS Assignment (if applicable)
4. Clicks "Save"
5. System creates user in Firebase Auth + Firestore
6. User receives confirmation
7. System logs action in audit trail

**Postcondition**: New user can login with email/password

### Alternative Flows
- **A1**: Email already exists → Show error, ask to use different email
- **A2**: Invalid email format → Show validation error
- **A3**: Password too weak → Show requirement error

---

## Use Case 2: Daily Sales Recording (Cashier)

**Actor**: Cashier  
**Precondition**: Shift is complete, employee logged in  
**Triggers**: End of shift, need to close POS

### Main Flow
1. Cashier opens /sales/close-shift
2. Counts and enters cash amount (by denomination)
3. Counts and enters transfer amounts (QR, Bank, Gov)
4. Enters POSPOS total from receipt
5. System validates all inputs
6. System calculates total
7. Cashier reviews summary
8. Clicks "Save as Draft"
9. System saves with status "draft"
10. Cashier hands cash + receipt to Manager

**Postcondition**: Shift closing recorded, ready for Manager review

### Validation Rules
- All amounts must be positive numbers
- POSPOS total must match expected range
- Cash + transfers must not exceed POSPOS total by >5%

---

## Use Case 3: Daily Record Entry (Manager)

**Actor**: Manager  
**Precondition**: Cashier(s) have submitted their shift closes  
**Triggers**: Daily operations complete, ready to consolidate

### Main Flow
1. Manager logs in
2. Views "Pending Records" list (from Cashiers)
3. Reviews each cashier's shift close data
4. Adds additional service income:
   - Money transfer fees
   - Withdrawal fees
   - Bill payment fees
5. Adds daily expenses:
   - Stock purchases (cash)
   - Stock purchases (transfer)
6. System calculates subtotals
7. Manager reviews final summary
8. Clicks "Submit to Audit"
9. System changes status to "submitted"
10. Manager hands documents to Auditor

**Postcondition**: Daily record submitted for audit verification

---

## Use Case 4: Audit Verification

**Actor**: Auditor  
**Precondition**: Manager has submitted daily record  
**Triggers**: New daily record available for audit

### Main Flow
1. Auditor logs in
2. Views "Pending Audit" list
3. Opens daily record detail
4. Physically counts cash and transfers (by employee)
5. Verifies against system data
6. Enters actual amounts counted:
   - Cash (by employee)
   - Transfers (by channel, by employee)
7. System automatically calculates discrepancies:
   - Shows +(excess) or -(shortage)
   - Highlights mismatches
8. Auditor reviews discrepancies
9. Adds audit notes if needed
10. Clicks "Approve Audit"
11. System changes status to "audited"
12. System creates audit log
13. Auditor sends report to Owner

**Postcondition**: Daily record audited and verified

### Audit Validation
- Discrepancies ±0-100 baht: Minor (monitor)
- Discrepancies ±100-500 baht: Moderate (investigate)
- Discrepancies >500 baht: Major (escalate to Owner)

---

## Use Case 5: Dashboard Viewing & Reporting

**Actor**: Owner  
**Precondition**: Daily records are audited and approved  
**Triggers**: Need to view business performance

### Main Flow
1. Owner logs in to Dashboard
2. Dashboard displays:
   - Today's income
   - Today's expenses
   - Net cash flow
   - Comparison with yesterday/last week
   - Outstanding audit items (if any)
3. Owner can click date to view daily detail
4. Owner can select date range for period report
5. Owner can view audit status for any date
6. Owner can export report to PDF/Google Sheets
7. Owner can drill-down to see:
   - Income by category
   - Expenses by category
   - Cash breakdown (by denomination)
   - Transfer breakdown (by channel)

**Postcondition**: Owner reviews business data

---

## Use Case 6: Monthly Expense Recording

**Actor**: Owner  
**Precondition**: Month has started, expenses are due  
**Triggers**: Rent due, utility bills arrived, payroll ready

### Main Flow
1. Owner logs in to /expenses/monthly
2. Selects month to record
3. Adds expense entry:
   - Category (Rent, Utilities, Salary, etc.)
   - Amount
   - Payment date
   - Notes
   - Receipt (optional upload)
4. Repeats for each expense
5. System calculates monthly total
6. Owner reviews summary
7. Clicks "Save Month"
8. System saves expenses

**Postcondition**: Monthly expenses recorded for the period

---

## Use Case 7: Data Export to Google Sheets

**Actor**: Auditor or Owner  
**Precondition**: Data is ready to export, Google Sheets account connected  
**Triggers**: Need to share data with accountant or external system

### Main Flow
1. User logs in
2. Navigates to Reports section
3. Selects date range
4. Clicks "Export to Google Sheets"
5. System connects to Google Drive
6. System creates new Sheet with data:
   - Daily records
   - Income summary
   - Expense summary
   - Audit notes
7. System sends link to user
8. User can share link with accountant/other stakeholders

**Postcondition**: Data exported to Google Sheets, accessible to authorized users

---

## Use Case 8: User Management (Owner)

**Actor**: Owner  
**Precondition**: Owner logged in  
**Triggers**: Need to add/update/remove users

### Main Flow
1. Owner goes to /admin/users
2. Sees list of all users
3. Can:
   - Click user name to edit (name, role, POS assignment)
   - Click delete button to deactivate user
   - Click "+ Add User" to create new user
4. Changes are saved to Firestore
5. System logs action

**Postcondition**: User management completed, changes effective immediately

---

**Source**: Newly created use case documentation  
**Last Updated**: Jan 7, 2026  
**Version**: 1.0  
