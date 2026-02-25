# Centre3 Security Operations Platform - Testing Guide

## Overview
This guide covers all implemented features and step-by-step testing procedures for the Security Team Interface, Employee Dashboard, and Admin Controls.

---

## Part 1: Security Team Interface (Checkpoint Module)

### Feature 1: Checkpoint Home Dashboard
**Status:** ✅ Implemented

**What it does:**
- Quick access to checkpoint operations
- Search requests by multiple methods
- Quick action buttons (Unregistered Entry, Report Fake Pass, View Watchlist)

**How to test:**
1. Login to Centre3 as Super Admin
2. Navigate to **Checkpoint** in left sidebar
3. You should see:
   - Search bar with dropdown (Request Number, ID, Plate, QR Code)
   - 3 quick action buttons
   - Recent activity log

**Test scenarios:**
- [ ] Search by Request Number (e.g., "REQ-20260210-EEZ0YY")
- [ ] Search by Visitor ID Number
- [ ] Search by Vehicle Plate
- [ ] Search by QR Code
- [ ] Click "Unregistered Entry" button
- [ ] Click "Report Fake Pass" button
- [ ] Click "View Watchlist" button

---

### Feature 2: Enhanced Check-In Screen (CheckpointSearchEnhanced)
**Status:** ✅ Implemented

**What it does:**
- Display visitor request details (name, company, access zone, risk level)
- Materials verification checklist with status tracking
- Escalation management interface
- Allow/Deny entry workflow

**How to test:**
1. From Checkpoint Home, search for a request (e.g., "REQ-20260210-EEZ0YY")
2. You should see:
   - Request information card (ID, name, company, zone, time window, risk level)
   - Materials Verification Checklist section (expandable)
   - Escalations section
   - Allow Entry and Deny Entry buttons

**Test scenarios:**

#### Materials Verification:
- [ ] Click "Materials Verification Checklist" to expand
- [ ] For each material, click "✓ Present" button (turns green)
- [ ] For each material, click "✗ Missing" button (turns red)
- [ ] For each material, click "⚠ Damaged" button (turns yellow)
- [ ] Add notes in the textarea for each material
- [ ] Verify the "Approve Entry" button changes text based on material status

#### Escalation Management:
- [ ] Click the Escalations section
- [ ] Select an escalation type from dropdown:
  - Behavior Concern
  - Unauthorized Extra Person
  - Expired ID
  - Materials Mismatch
  - Access Zone Violation
  - Watchlist Match
  - Anomaly Detected
  - Other
- [ ] Enter description in textarea
- [ ] Click "Add Escalation" button
- [ ] Verify escalation appears in the list above
- [ ] Add multiple escalations and verify they all appear

#### Allow Entry (with partial materials):
- [ ] Mark some materials as "Present" and some as "Missing"
- [ ] Click "Approve Entry (Partial Materials)" button
- [ ] Should see success message and redirect to Checkpoint Home
- [ ] Check database to verify transaction was logged

#### Deny Entry:
- [ ] Click "Deny Entry" button
- [ ] Select a denial reason from dropdown
- [ ] Enter comments (minimum 20 characters)
- [ ] Click "Submit Denial" button
- [ ] Should see success message and redirect to Checkpoint Home
- [ ] Verify denial was logged in database

---

### Feature 3: Security Dashboard
**Status:** ✅ Implemented (Basic)

**What it does:**
- Real-time overview of visitors (expected, waiting, active)
- Quick stats and status indicators

**How to test:**
1. Navigate to **Checkpoint** → **Security Dashboard**
2. You should see:
   - Dashboard title and description
   - Visitor statistics cards (Expected Today, Waiting Check-In, Active Inside)
   - Real-time data from database

**Test scenarios:**
- [ ] Verify visitor counts are accurate
- [ ] Check that data updates when new requests are created
- [ ] Verify color-coded status indicators

---

## Part 2: AI Integration Features

### Feature 4: AI Services Configuration
**Status:** ✅ Implemented

**What it does:**
- Enable/disable AI features (document validation, face matching, anomaly detection)
- Configure Claude API key
- Toggle camera settings

**How to test:**
1. Navigate to **Administration** → **Integration Hub**
2. Click on "AI Services" card
3. You should see tabs: Camera, AI Services, Notifications, Watchlist
4. Click "AI Services" tab
5. You should see toggles for:
   - Enable AI Services
   - Document Validation
   - Face Matching
   - Anomaly Detection
   - Plate Recognition

**Test scenarios:**
- [ ] Toggle "Enable AI Services" on/off
- [ ] Toggle "Document Validation" on/off
- [ ] Toggle "Face Matching" on/off
- [ ] Toggle "Anomaly Detection" on/off
- [ ] Toggle "Plate Recognition" on/off
- [ ] Enter Claude API key
- [ ] Click "Save Settings"
- [ ] Refresh page and verify settings persist
- [ ] Check localStorage to see saved values

---

## Part 3: Security Alert Configuration

### Feature 5: Security Alert Configuration Modal
**Status:** ✅ Implemented

**What it does:**
- Create custom security alerts with conditions, actions, and notifications
- Configure who gets notified and via which channels
- Define trigger conditions from predefined library

**How to test:**
1. Navigate to **Process Configuration** → **Security Alerts**
2. Click "Create New Alert Configuration" button
3. Modal should open with 5 tabs:
   - Basic
   - Conditions
   - Actions
   - Viewers
   - Notify

#### Tab 1: Basic
- [ ] Select Alert Type from dropdown (should show 8 types: Breach, Impact, Status, View, Action, etc.)
- [ ] Enter Configuration Name
- [ ] Enter Description
- [ ] Select Impact Level (Low, Medium, High, Critical)
- [ ] Toggle "Auto-resolve after (minutes)" checkbox
- [ ] Click "Next" or switch to Conditions tab

#### Tab 2: Conditions
- [ ] Click "Add Condition" button
- [ ] Select a predefined condition from dropdown:
  - Watchlist Match
  - Multiple Denials (3+ in 24h)
  - After-Hours Access
  - High-Risk Visitor
  - Anomaly Score > 80
  - Same Day Visit Count > 5
  - Expired ID
  - Access Zone Violation
- [ ] Verify operator and value fields appear
- [ ] Add multiple conditions
- [ ] Remove conditions with "X" button

#### Tab 3: Actions
- [ ] Click "Add Action" button
- [ ] Select action type:
  - Deny Entry
  - Alert Supervisor
  - Lock Zone
  - Escalate to Manager
  - Create Incident
- [ ] Add multiple actions
- [ ] Remove actions with "X" button

#### Tab 4: Viewers
- [ ] Click "Add Viewer" button
- [ ] Select viewer type (Role, Group, User)
- [ ] Select specific role/group/user
- [ ] Add multiple viewers
- [ ] Remove viewers with "X" button

#### Tab 5: Notify
- [ ] Click "Add Notification Rule" button
- [ ] Select notification channel:
  - Email
  - SMS
  - WhatsApp
  - In-App
  - Webhook
- [ ] Select recipient (Role, Group, User)
- [ ] Set escalation timer (minutes)
- [ ] Add multiple notification rules
- [ ] Remove rules with "X" button

#### Save Configuration
- [ ] Click "Save Configuration" button
- [ ] Should see success message
- [ ] Verify alert appears in the list below

**Test scenarios:**
- [ ] Create alert: "Watchlist Match" → Deny Entry + Alert Supervisor + Email notification
- [ ] Create alert: "Multiple Denials" → Lock Zone + Escalate to Manager
- [ ] Create alert: "After-Hours Access" → Create Incident + WhatsApp notification
- [ ] Edit existing alert
- [ ] Delete alert

---

## Part 4: Alert Types

### Feature 6: Alert Types Database
**Status:** ✅ Implemented

**What it does:**
- 8 predefined alert types seeded to database
- Used in Security Alert Configuration

**Alert types:**
1. **Breach Alert** - Unauthorized access attempts
2. **Impact Alert** - System or facility impact
3. **Status Alert** - Status change notifications
4. **View Alert** - Visibility/access alerts
5. **Action Alert** - Action-based triggers
6. **Anomaly Alert** - Unusual pattern detection
7. **Compliance Alert** - Regulatory compliance
8. **Escalation Alert** - Escalation triggers

**How to test:**
1. Open database viewer in Management UI
2. Query `securityAlertTypes` table
3. Verify 8 records exist with proper categories and descriptions

---

## Part 5: Integration Hub

### Feature 7: Integration Hub with AI Services
**Status:** ✅ Implemented

**What it does:**
- Centralized integration management
- AI Services card with configuration interface

**How to test:**
1. Navigate to **Administration** → **Integration Hub**
2. You should see integration cards:
   - Communications (Active)
   - AI Services (New)
   - Siemens SiPort (Coming Soon)
   - Enterprise Asset Management (Coming Soon)
3. Click "AI Services" card
4. Should navigate to `/integration-hub/ai-services?tab=ai`
5. AI Services tab should be active and showing configuration

**Test scenarios:**
- [ ] Click AI Services card
- [ ] Verify navigation to correct URL
- [ ] Verify AI Services tab is selected
- [ ] Verify configuration interface loads
- [ ] Test all toggles and settings

---

## Part 6: Database Verification

### Feature 8: Security Alert Tables
**Status:** ✅ Implemented

**What it does:**
- 4 database tables for alert management
- Audit trail and logging

**Tables:**
1. `securityAlertTypes` - Alert type definitions
2. `securityAlertConfigs` - Alert configurations
3. `securityAlertNotifications` - Notification rules
4. `securityAlertLogs` - Execution logs

**How to test:**
1. Open Management UI → Database panel
2. Query each table:
   ```sql
   SELECT * FROM securityAlertTypes;
   SELECT * FROM securityAlertConfigs;
   SELECT * FROM securityAlertNotifications;
   SELECT * FROM securityAlertLogs;
   ```
3. Verify:
   - [ ] 8 records in securityAlertTypes
   - [ ] Created alerts appear in securityAlertConfigs
   - [ ] Notification rules appear in securityAlertNotifications
   - [ ] Logs appear in securityAlertLogs when alerts trigger

---

## Part 7: End-to-End Testing Scenarios

### Scenario 1: Complete Check-In with Partial Materials
1. Search for a request on Checkpoint Home
2. On Check-In screen:
   - [ ] Mark some materials as "Present"
   - [ ] Mark some materials as "Missing"
   - [ ] Click "Approve Entry (Partial Materials)"
   - [ ] Verify transaction logged
   - [ ] Check database for transaction record

### Scenario 2: Escalation and Denial
1. Search for a request
2. On Check-In screen:
   - [ ] Add escalation: "Behavior Concern" with description
   - [ ] Click "Deny Entry"
   - [ ] Select reason and enter comments
   - [ ] Click "Submit Denial"
   - [ ] Verify both escalation and denial logged

### Scenario 3: Security Alert Trigger
1. Create security alert: "Watchlist Match" → Deny Entry + Email notification
2. When a watchlist visitor arrives:
   - [ ] Search for their request
   - [ ] System should flag as watchlist match
   - [ ] Alert should trigger automatically
   - [ ] Email notification should be sent
   - [ ] Incident logged in securityAlertLogs

### Scenario 4: Materials Verification Workflow
1. Request has 3 materials: Laptop, Cables, Badge
2. Visitor arrives with Laptop and Badge only
3. On Check-In screen:
   - [ ] Mark Laptop as "Present"
   - [ ] Mark Badge as "Present"
   - [ ] Mark Cables as "Missing"
   - [ ] Add note: "Will bring cables tomorrow"
   - [ ] Click "Approve Entry (Partial Materials)"
   - [ ] Verify entry approved despite missing cables
   - [ ] Check timeline shows partial materials

---

## Part 8: Performance Testing

### Test 1: Large Dataset
- [ ] Create 100+ requests in database
- [ ] Search for specific request - should return in < 2 seconds
- [ ] Load Security Dashboard - should display stats in < 1 second
- [ ] Load Security Alert Configuration - should open modal in < 1 second

### Test 2: Concurrent Operations
- [ ] Open Check-In screen in multiple tabs
- [ ] Approve entry in Tab 1
- [ ] Deny entry in Tab 2
- [ ] Verify both operations logged correctly
- [ ] No data corruption or conflicts

---

## Part 9: Error Handling

### Test 1: Invalid Search
- [ ] Search for non-existent request number
- [ ] Should show "Request not found" error
- [ ] Back button should work

### Test 2: Validation Errors
- [ ] Try to deny entry without comments
- [ ] Should show "minimum 20 characters" error
- [ ] Try to add escalation without type
- [ ] Should show validation error

### Test 3: Network Errors
- [ ] Simulate network failure
- [ ] Try to approve entry
- [ ] Should show error message
- [ ] Retry button should work

---

## Part 10: Browser Compatibility

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

Verify:
- [ ] All buttons clickable
- [ ] All forms submittable
- [ ] All modals display correctly
- [ ] Responsive design on mobile

---

## Quick Test Checklist

```
Security Team Interface:
- [ ] Checkpoint Home loads
- [ ] Search works (all 4 methods)
- [ ] Check-In screen displays correctly
- [ ] Materials verification works
- [ ] Escalation management works
- [ ] Allow/Deny entry works

AI Integration:
- [ ] AI Services card visible in Integration Hub
- [ ] Configuration toggles work
- [ ] Settings persist after refresh

Security Alerts:
- [ ] Create alert configuration works
- [ ] All 5 tabs functional
- [ ] Conditions dropdown populated
- [ ] Alert types visible (8 types)
- [ ] Save configuration works

Database:
- [ ] 4 alert tables exist
- [ ] 8 alert types seeded
- [ ] Transactions logged
- [ ] Escalations logged
- [ ] Denials logged
```

---

## Troubleshooting

### Issue: Search returns "not found"
**Solution:** Verify request exists in database. Check request number format matches exactly.

### Issue: Materials checklist not showing
**Solution:** Verify request has materials defined. Check materials field in database is not NULL.

### Issue: Alert configuration modal won't open
**Solution:** Clear browser cache. Verify JavaScript console for errors. Check network tab for failed requests.

### Issue: Settings not persisting
**Solution:** Check localStorage is enabled. Verify browser privacy settings allow storage.

### Issue: Escalation not appearing
**Solution:** Verify escalation type is selected. Check description is not empty. Verify form validation passes.

---

## Support

For issues or questions:
1. Check browser console for errors (F12)
2. Check network tab for failed requests
3. Verify database connectivity
4. Check server logs for backend errors

