# Centre3 Security Operations Platform - Comprehensive QA Test Suite

**Document Version:** 1.0  
**Last Updated:** February 20, 2026  
**Prepared for:** QA Team  
**Purpose:** Complete manual testing guide with detailed technical and business test cases

---

## Table of Contents

1. [Authentication & Authorization](#1-authentication--authorization)
2. [Dashboard & Navigation](#2-dashboard--navigation)
3. [Request Management](#3-request-management)
4. [Checkpoint Operations](#4-checkpoint-operations)
5. [Approval Workflow](#5-approval-workflow)
6. [Facilities Management](#6-facilities-management)
7. [User & Group Management](#7-user--group-management)
8. [Workflow Builder](#8-workflow-builder)
9. [Security Operations](#9-security-operations)
10. [Reports & Analytics](#10-reports--analytics)
11. [Integration & Settings](#11-integration--settings)
12. [MCM (Material Card Management)](#12-mcm-material-card-management)
13. [AI Integration](#13-ai-integration)
14. [Security Alerts](#14-security-alerts)
15. [Data Validation & Error Handling](#15-data-validation--error-handling)
16. [Performance & Load Testing](#16-performance--load-testing)
17. [Security & Compliance](#17-security--compliance)

---

## 1. Authentication & Authorization

### Test Case 1.1: User Login - Valid Credentials
**Type:** Technical & Business  
**Priority:** Critical  
**Preconditions:** User account exists in system with valid credentials

**Steps:**
1. Navigate to Centre3 login page
2. Enter valid email address
3. Enter valid password
4. Click "Sign In" button
5. Verify redirect to dashboard

**Expected Results:**
- Login form displays correctly
- Email and password fields accept input
- "Sign In" button is clickable
- User is authenticated and redirected to dashboard
- Session cookie is created
- User profile appears in top-right corner

**Business Validation:**
- User can access all permitted modules based on role
- User information displays correctly (name, email, role)
- Login timestamp is recorded in audit logs

**Test Data:**
- Email: admin@centre3.com
- Password: [valid_password]

**Failure Scenarios:**
- [ ] Invalid email format
- [ ] Invalid password
- [ ] Non-existent user account
- [ ] Account locked/disabled
- [ ] SQL injection attempt in email field
- [ ] XSS attempt in password field

---

### Test Case 1.2: User Login - Invalid Credentials
**Type:** Technical  
**Priority:** High  
**Preconditions:** None

**Steps:**
1. Navigate to login page
2. Enter invalid email (e.g., "invalid@test.com")
3. Enter any password
4. Click "Sign In"
5. Observe error message

**Expected Results:**
- Error message displays: "Invalid email or password"
- User remains on login page
- No session is created
- No redirect occurs
- Error message is generic (doesn't reveal if email exists)

**Security Validation:**
- No user information leaked
- Failed login attempt logged
- No session token generated
- Password field clears after failed attempt

---

### Test Case 1.3: Session Management - Timeout
**Type:** Technical  
**Priority:** High  
**Preconditions:** User is logged in

**Steps:**
1. Login successfully
2. Wait for session timeout (typically 30 minutes)
3. Try to perform an action (e.g., create request)
4. Observe system response

**Expected Results:**
- User is redirected to login page
- Message displays: "Your session has expired"
- All unsaved data is lost
- Session cookie is cleared
- User must re-login

**Business Validation:**
- Session timeout prevents unauthorized access
- User is informed of timeout
- No data corruption occurs

---

### Test Case 1.4: Role-Based Access Control (RBAC)
**Type:** Technical & Business  
**Priority:** Critical  
**Preconditions:** Multiple users with different roles exist

**Roles to Test:**
- Super Admin
- Admin
- Approver
- Security Team
- Manager

**Steps for Each Role:**
1. Login as user with specific role
2. Navigate to each menu item
3. Verify visibility based on role
4. Try to access restricted pages via URL
5. Verify access denied

**Expected Results:**

| Role | Dashboard | Requests | Approvals | Checkpoint | Reports | Admin Settings |
|------|-----------|----------|-----------|-----------|---------|-----------------|
| Super Admin | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Admin | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Approver | ✓ | ✓ | ✓ | ✗ | ✓ | ✗ |
| Security Team | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ |
| Manager | ✓ | ✓ | ✓ | ✗ | ✓ | ✗ |

**Security Validation:**
- Users cannot access unauthorized modules
- Direct URL access to restricted pages shows "Access Denied"
- API calls from unauthorized roles are rejected
- Audit log records unauthorized access attempts

---

### Test Case 1.5: Logout Functionality
**Type:** Technical  
**Priority:** High  
**Preconditions:** User is logged in

**Steps:**
1. Click user profile menu (top-right)
2. Click "Logout" option
3. Observe system response

**Expected Results:**
- User is redirected to login page
- Session cookie is deleted
- All local storage related to session is cleared
- Message displays: "You have been logged out successfully"
- Browser back button does not restore session

**Security Validation:**
- Session is completely terminated
- No sensitive data remains in browser
- User cannot access protected pages after logout

---

## 2. Dashboard & Navigation

### Test Case 2.1: Main Dashboard Load
**Type:** Technical & Business  
**Priority:** High  
**Preconditions:** User is logged in as Admin

**Steps:**
1. Login successfully
2. Dashboard should load automatically
3. Verify all dashboard components load
4. Check data accuracy

**Expected Results:**
- Dashboard loads within 2 seconds
- All widgets display correctly:
  - Pending Requests count
  - Pending Approvals count
  - Active Visitors count
  - Recent Activity list
- Data is current (not stale)
- No console errors
- Responsive layout on all screen sizes

**Business Validation:**
- Dashboard provides quick overview of operations
- All metrics are accurate and real-time
- Navigation to detailed pages works from dashboard

**Performance Metrics:**
- Page load time: < 2 seconds
- API response time: < 500ms
- No memory leaks on page refresh

---

### Test Case 2.2: Navigation Menu - All Items Accessible
**Type:** Technical  
**Priority:** High  
**Preconditions:** User is logged in as Super Admin

**Steps:**
1. Verify left sidebar displays all menu items
2. Click each menu item
3. Verify page loads correctly
4. Verify breadcrumb updates

**Menu Items to Test:**
- Dashboard
- Requests
- Approvals
- Checkpoint
- Security Operations
- Facilities (Sites, Zones, Areas)
- Users & Roles
- Groups
- Workflow Builder
- Reports
- Settings
- Integration Hub

**Expected Results:**
- All menu items are visible
- Each menu item is clickable
- Page loads after clicking menu item
- Breadcrumb shows correct path
- Active menu item is highlighted
- No broken links

---

### Test Case 2.3: Sidebar Collapse/Expand
**Type:** Technical  
**Priority:** Medium  
**Preconditions:** User is logged in

**Steps:**
1. Click sidebar toggle button (hamburger menu)
2. Verify sidebar collapses
3. Click toggle again
4. Verify sidebar expands
5. Test on mobile device

**Expected Results:**
- Sidebar collapses smoothly
- Main content expands to fill space
- Icons remain visible when collapsed
- Sidebar expands smoothly
- Responsive on mobile (sidebar becomes overlay)
- No content is cut off

---

### Test Case 2.4: Breadcrumb Navigation
**Type:** Technical  
**Priority:** Medium  
**Preconditions:** User is logged in

**Steps:**
1. Navigate to nested page (e.g., Requests → View Request → Edit)
2. Verify breadcrumb displays correct path
3. Click each breadcrumb item
4. Verify navigation works

**Expected Results:**
- Breadcrumb shows: Home > Requests > Request #123 > Edit
- Each breadcrumb item is clickable
- Clicking breadcrumb navigates to that page
- Breadcrumb updates when page changes
- No broken navigation

---

## 3. Request Management

### Test Case 3.1: Create New Request - Basic Information
**Type:** Business  
**Priority:** Critical  
**Preconditions:** User is logged in, at least one site/zone exists

**Steps:**
1. Navigate to Requests module
2. Click "New Request" button
3. Fill in basic information:
   - Visitor Name: "John Doe"
   - Company: "ABC Corp"
   - Email: "john@abc.com"
   - Phone: "+966501234567"
   - ID Number: "1234567890"
   - Nationality: "Saudi Arabia"
4. Click "Next" or "Continue"

**Expected Results:**
- Form displays correctly
- All fields are present and editable
- Email field validates format
- Phone field validates format
- ID number field accepts numeric input
- Required fields are marked with asterisk (*)
- Form can be submitted

**Business Validation:**
- Visitor information is captured correctly
- Data is saved to database
- Request number is generated
- Request status is set to "Pending"
- Request appears in request list

**Validation Rules:**
- [ ] Visitor Name: Required, max 100 characters
- [ ] Company: Required, max 100 characters
- [ ] Email: Required, valid email format
- [ ] Phone: Required, valid phone format
- [ ] ID Number: Required, numeric only
- [ ] Nationality: Required, dropdown selection

---

### Test Case 3.2: Create New Request - Access Details
**Type:** Business  
**Priority:** Critical  
**Preconditions:** Basic information filled in

**Steps:**
1. Fill in access details:
   - Visit Date: Select future date
   - Start Time: 09:00 AM
   - End Time: 05:00 PM
   - Access Zone: Select from dropdown (MMR, White, Grey)
   - Purpose: "Maintenance"
   - Department: Select from dropdown
2. Click "Next"

**Expected Results:**
- Date picker displays correctly
- Time fields accept valid times
- End time must be after start time
- Access zone dropdown shows all available zones
- Purpose field accepts text input
- Department dropdown shows all departments

**Business Validation:**
- Visit window is captured correctly
- Access zone determines security level
- Request can be routed to correct approver based on zone
- Time validation prevents invalid windows

**Validation Rules:**
- [ ] Visit Date: Required, must be future date
- [ ] Start Time: Required, valid time format
- [ ] End Time: Required, must be after start time
- [ ] Access Zone: Required, dropdown selection
- [ ] Purpose: Required, max 500 characters
- [ ] Department: Required, dropdown selection

---

### Test Case 3.3: Create New Request - Materials List
**Type:** Business  
**Priority:** High  
**Preconditions:** Access details filled in

**Steps:**
1. Click "Add Material" button
2. Fill in material details:
   - Material Name: "Laptop"
   - Quantity: 1
   - Description: "Dell XPS 13"
3. Click "Add Material" again
4. Add second material:
   - Material Name: "USB Cable"
   - Quantity: 2
5. Click "Submit Request"

**Expected Results:**
- "Add Material" button is visible and clickable
- Material form displays with fields
- Multiple materials can be added
- Each material shows in list
- Materials can be removed
- Request is submitted with all materials

**Business Validation:**
- Materials are captured for security verification
- Materials list is visible to checkpoint staff
- Materials verification happens at checkpoint
- Materials can be partially delivered

**Validation Rules:**
- [ ] Material Name: Required, max 100 characters
- [ ] Quantity: Required, numeric, minimum 1
- [ ] Description: Optional, max 500 characters

---

### Test Case 3.4: Request List - Filtering & Sorting
**Type:** Technical & Business  
**Priority:** High  
**Preconditions:** Multiple requests exist in system

**Steps:**
1. Navigate to Requests list
2. Test filters:
   - Filter by Status (Pending, Approved, Denied, Completed)
   - Filter by Date Range
   - Filter by Visitor Name
   - Filter by Company
   - Filter by Access Zone
3. Test sorting:
   - Sort by Date (ascending/descending)
   - Sort by Visitor Name (A-Z/Z-A)
   - Sort by Status
4. Combine multiple filters

**Expected Results:**
- Filters display correctly
- Each filter works independently
- Multiple filters can be combined
- Results update immediately
- Sorting works in both directions
- Filter values persist when navigating away and back
- No duplicate results

**Business Validation:**
- Users can quickly find specific requests
- Filtering improves operational efficiency
- Sorting helps prioritize work

**Performance:**
- Filter results display within 1 second
- No lag when changing filters
- Handles 1000+ requests without slowdown

---

### Test Case 3.5: Request Details - View & Edit
**Type:** Business  
**Priority:** High  
**Preconditions:** Request exists in system

**Steps:**
1. Click on a request in the list
2. Request details page opens
3. Verify all information displays correctly
4. Click "Edit" button
5. Modify a field (e.g., Purpose)
6. Click "Save"

**Expected Results:**
- All request information displays correctly
- Read-only fields cannot be edited
- Editable fields can be modified
- Save button works
- Changes are persisted
- Confirmation message displays
- Audit log records the change

**Business Validation:**
- Users can view complete request information
- Users can modify requests before approval
- Changes are tracked for compliance
- Request history is maintained

---

### Test Case 3.6: Request Submission - Validation Errors
**Type:** Technical  
**Priority:** High  
**Preconditions:** Request form is open

**Steps:**
1. Leave required fields empty
2. Click "Submit"
3. Observe validation errors
4. Fill in one required field incorrectly
5. Click "Submit"
6. Observe specific error message

**Expected Results:**
- Validation errors display for each empty required field
- Error messages are clear and specific
- Fields with errors are highlighted in red
- Form is not submitted
- User can correct errors and resubmit
- Validation happens on both client and server

**Validation Error Messages:**
- "Visitor Name is required"
- "Valid email address is required"
- "End time must be after start time"
- "Please select an access zone"

---

## 4. Checkpoint Operations

### Test Case 4.1: Checkpoint Home - Search Functionality
**Type:** Technical & Business  
**Priority:** Critical  
**Preconditions:** User is logged in as Security Team, requests exist

**Steps:**
1. Navigate to Checkpoint module
2. Verify search bar displays with dropdown
3. Select "Request Number" from dropdown
4. Enter request number (e.g., "REQ-20260210-EEZ0YY")
5. Click "Search Request" button
6. Verify request details display

**Expected Results:**
- Search bar displays correctly
- Dropdown shows all search methods
- Search executes successfully
- Request details load on results page
- Request information is accurate
- No console errors

**Search Methods to Test:**
- [ ] Request Number
- [ ] Visitor ID Number
- [ ] Vehicle Plate
- [ ] QR Code

**Business Validation:**
- Security team can quickly find visitor requests
- Search is fast and accurate
- All search methods work correctly

---

### Test Case 4.2: Check-In Screen - Request Information Display
**Type:** Business  
**Priority:** Critical  
**Preconditions:** Request found via search

**Steps:**
1. From search results, request details display
2. Verify all information is present:
   - Request ID
   - Visitor Name
   - Company
   - Access Zone
   - Valid Time Window
   - Risk Level
   - Materials Expected

**Expected Results:**
- All information displays clearly
- Information is color-coded by risk level:
  - Green: Low risk
  - Yellow: Medium risk
  - Red: High risk
- Layout is organized and easy to read
- No information is missing
- Information is accurate

**Business Validation:**
- Security team has all information needed to make decision
- Risk level is immediately visible
- Time window is clear
- Materials are visible for verification

---

### Test Case 4.3: Materials Verification Checklist
**Type:** Business  
**Priority:** Critical  
**Preconditions:** Request has materials defined

**Steps:**
1. On Check-In screen, expand "Materials Verification Checklist"
2. For each material, verify three status buttons:
   - "✓ Present" (green)
   - "✗ Missing" (red)
   - "⚠ Damaged" (yellow)
3. Click "✓ Present" for first material
4. Click "✗ Missing" for second material
5. Click "⚠ Damaged" for third material
6. Add notes in textarea for each material
7. Verify button text changes based on material status

**Expected Results:**
- All materials display in checklist
- Status buttons are visible and clickable
- Clicking button changes its color
- Notes textarea accepts input
- Button text reflects current status
- Multiple materials can have different statuses

**Business Validation:**
- Security team can verify materials
- Partial materials can be approved
- Notes capture additional context
- Material status is recorded for audit

**Test Scenarios:**
- [ ] All materials present
- [ ] All materials missing
- [ ] Some materials present, some missing
- [ ] Some materials damaged
- [ ] Add detailed notes for each material

---

### Test Case 4.4: Escalation Management
**Type:** Business  
**Priority:** High  
**Preconditions:** Check-In screen is open

**Steps:**
1. Expand "Escalations" section
2. Click "Add Escalation" button
3. Select escalation type from dropdown:
   - Behavior Concern
   - Unauthorized Extra Person
   - Expired ID
   - Materials Mismatch
   - Access Zone Violation
   - Watchlist Match
   - Anomaly Detected
   - Other
4. Enter description: "Visitor showing aggressive behavior"
5. Click "Add Escalation"
6. Verify escalation appears in list
7. Add second escalation
8. Verify both escalations display

**Expected Results:**
- Escalation dropdown shows all types
- Description field accepts text input
- Escalation is added to list
- Escalation displays with type and description
- Timestamp is recorded
- Multiple escalations can be added
- Escalations are visible in summary

**Business Validation:**
- Security team can flag incidents
- Escalations are recorded for investigation
- Multiple escalations per request are supported
- Escalation history is maintained

**Test Scenarios:**
- [ ] Add single escalation
- [ ] Add multiple escalations
- [ ] Escalation with detailed notes
- [ ] Escalation without notes
- [ ] Different escalation types

---

### Test Case 4.5: Allow Entry - Complete Materials
**Type:** Business  
**Priority:** Critical  
**Preconditions:** All materials marked as "Present"

**Steps:**
1. On Check-In screen, mark all materials as "✓ Present"
2. Verify "Approve Entry" button is active
3. Click "Approve Entry" button
4. Verify success message displays
5. Verify redirect to Checkpoint Home
6. Check database for transaction record

**Expected Results:**
- "Approve Entry" button is active (not grayed out)
- Clicking button shows confirmation
- Success message: "Entry logged successfully"
- User redirected to Checkpoint Home
- Transaction is logged in database
- Transaction includes:
  - Checkpoint ID
  - Request ID
  - Visitor Name
  - Decision (Approved)
  - Timestamp
  - Guard ID

**Business Validation:**
- Entry is approved and recorded
- Audit trail is maintained
- Visitor can proceed to facility
- Transaction is immutable

---

### Test Case 4.6: Allow Entry - Partial Materials
**Type:** Business  
**Priority:** High  
**Preconditions:** Some materials marked as "Missing"

**Steps:**
1. Mark some materials as "✓ Present"
2. Mark some materials as "✗ Missing"
3. Add note: "Will bring cables tomorrow"
4. Verify button text changes to "Approve Entry (Partial Materials)"
5. Click button
6. Verify success message
7. Check database for partial materials note

**Expected Results:**
- Button text reflects partial materials status
- Entry is still approved despite missing materials
- Note is recorded with transaction
- Success message displays
- User is redirected
- Transaction shows partial materials status

**Business Validation:**
- Visitors can be approved with partial materials
- Missing materials are documented
- Requester can deliver materials later
- Flexibility in approval process

---

### Test Case 4.7: Deny Entry - Complete Workflow
**Type:** Business  
**Priority:** Critical  
**Preconditions:** Check-In screen is open

**Steps:**
1. Click "Deny Entry" button
2. Denial form expands
3. Select reason from dropdown:
   - Invalid ID
   - Expired Pass
   - Unauthorized Access
   - Watchlist Match
   - Required Materials Missing
   - Security Concern
   - Other
4. Enter comments: "Visitor ID is expired. Valid until 2025-01-15. Current date is 2026-02-20."
5. Verify character count shows minimum 20 characters required
6. Click "Submit Denial" button
7. Verify success message
8. Check database for denial record

**Expected Results:**
- Denial form displays with dropdown
- Reason dropdown shows all options
- Comments field accepts text
- Character counter displays
- "Submit Denial" button is disabled if < 20 characters
- Button becomes enabled at 20+ characters
- Success message displays
- User is redirected
- Denial is logged in database

**Business Validation:**
- Entry can be denied with reason
- Detailed comments are required
- Denial is recorded for audit
- Visitor is notified of denial
- Reason helps with compliance

**Denial Scenarios:**
- [ ] Invalid ID
- [ ] Expired Pass
- [ ] Unauthorized Access
- [ ] Watchlist Match
- [ ] Materials Missing
- [ ] Security Concern

---

### Test Case 4.8: Security Dashboard - Visitor Overview
**Type:** Business  
**Priority:** High  
**Preconditions:** Multiple requests exist

**Steps:**
1. Navigate to Checkpoint → Security Dashboard
2. Verify three statistics cards:
   - "Visitors Expected Today"
   - "Visitors Waiting Check-In"
   - "Active Visitors Inside"
3. Click on each card
4. Verify detailed list opens

**Expected Results:**
- Dashboard loads successfully
- Statistics display correct counts
- Counts are real-time
- Cards are clickable
- Clicking card shows detailed list
- List shows visitor names, times, zones
- No stale data

**Business Validation:**
- Security team has quick overview
- Can see pending visitors
- Can see active visitors
- Helps with resource planning

---

## 5. Approval Workflow

### Test Case 5.1: Approvals Dashboard - View Pending Requests
**Type:** Business  
**Priority:** Critical  
**Preconditions:** User is logged in as Approver, pending requests exist

**Steps:**
1. Navigate to Approvals module
2. Verify pending requests list displays
3. Verify each request shows:
   - Request Number
   - Visitor Name
   - Company
   - Requested Date
   - Access Zone
   - Status (Pending)
   - Days until SLA breach (if applicable)
4. Verify requests are sorted by urgency (SLA)

**Expected Results:**
- Pending requests list displays
- All required information is visible
- Requests are sorted by SLA (urgent first)
- SLA warning is shown if < 15 minutes remaining
- Color coding indicates urgency:
  - Green: > 1 day remaining
  - Yellow: < 1 day remaining
  - Red: < 15 minutes remaining

**Business Validation:**
- Approver can see all pending requests
- Urgent requests are highlighted
- SLA tracking helps with compliance
- Workflow is efficient

---

### Test Case 5.2: Approve Request - Full Workflow
**Type:** Business  
**Priority:** Critical  
**Preconditions:** Pending request exists

**Steps:**
1. Click on pending request
2. Request details page opens
3. Verify all information displays:
   - Visitor details
   - Access details
   - Materials list
   - Purpose and department
4. Review information
5. Click "Approve" button
6. Approval confirmation dialog appears
7. Click "Confirm Approval"
8. Verify success message
9. Check request status changed to "Approved"

**Expected Results:**
- Request details display clearly
- All information is accurate
- "Approve" button is visible
- Confirmation dialog appears
- Success message: "Request approved successfully"
- Request status changes to "Approved"
- Approval timestamp is recorded
- Approver name is recorded
- Request moves to approved list

**Business Validation:**
- Approver can approve requests
- Approval is recorded with timestamp
- Visitor receives notification
- Checkpoint staff can see approved requests
- Audit trail is maintained

---

### Test Case 5.3: Reject Request - Full Workflow
**Type:** Business  
**Priority:** Critical  
**Preconditions:** Pending request exists

**Steps:**
1. Click on pending request
2. Click "Reject" button
3. Rejection form appears with fields:
   - Rejection Reason (dropdown)
   - Comments (textarea)
4. Select reason: "Insufficient access justification"
5. Enter comments: "Please provide more details about the purpose of visit and what systems need to be accessed."
6. Click "Submit Rejection"
7. Verify success message
8. Check request status changed to "Rejected"

**Expected Results:**
- Rejection form displays
- Reason dropdown shows options
- Comments field accepts text
- "Submit Rejection" button is clickable
- Success message displays
- Request status changes to "Rejected"
- Rejection reason and comments are recorded
- Rejection timestamp is recorded
- Requester receives notification

**Business Validation:**
- Approver can reject requests with reason
- Feedback is provided to requester
- Rejection is recorded for audit
- Requester can resubmit with corrections

**Rejection Reasons:**
- [ ] Insufficient access justification
- [ ] Visitor not authorized
- [ ] Conflicting with maintenance window
- [ ] Materials not approved
- [ ] Other

---

### Test Case 5.4: Send Back Request - Conditional Routing
**Type:** Business  
**Priority:** High  
**Preconditions:** Pending request exists

**Steps:**
1. Click on pending request
2. Click "Send Back" button
3. Dialog appears with options:
   - Send to Requester (for modifications)
   - Send to Security Team (for review)
   - Send to Manager (for approval)
4. Select "Send to Requester"
5. Enter comments: "Please clarify the materials needed for this visit."
6. Click "Send Back"
7. Verify success message
8. Check request status changed to "Pending Requester Action"

**Expected Results:**
- "Send Back" button is visible
- Dialog shows routing options
- Comments field accepts text
- Request is routed to selected group
- Status changes to "Pending [Group] Action"
- Notification is sent to recipient
- Original approver can see request status
- Audit trail shows routing

**Business Validation:**
- Requests can be routed for additional information
- Workflow is flexible
- Communication is tracked
- Prevents approval delays

---

### Test Case 5.5: Add Internal Notes
**Type:** Business  
**Priority:** Medium  
**Preconditions:** Request details page is open

**Steps:**
1. Scroll to "Internal Notes" section
2. Click "Add Note" button
3. Enter note: "Visitor is high-profile, ensure extra security measures"
4. Click "Save Note"
5. Verify note appears in list
6. Add another note
7. Verify both notes display with timestamps

**Expected Results:**
- Internal Notes section is visible
- "Add Note" button is clickable
- Note textarea accepts text
- Note is saved successfully
- Note displays with timestamp
- Note displays with author name
- Multiple notes can be added
- Notes are not visible to external users
- Notes are included in audit trail

**Business Validation:**
- Internal communication is tracked
- Notes help with decision-making
- Security-sensitive information is protected
- Audit trail is maintained

---

### Test Case 5.6: SLA Tracking & Warnings
**Type:** Technical & Business  
**Priority:** High  
**Preconditions:** Multiple requests with different SLA times

**Steps:**
1. Navigate to Approvals dashboard
2. Observe SLA indicators on each request:
   - Green: > 1 day remaining
   - Yellow: < 1 day remaining
   - Red: < 15 minutes remaining
3. Verify requests are sorted by SLA (urgent first)
4. Wait for SLA warning notification (if configured)
5. Verify notification appears

**Expected Results:**
- SLA is calculated correctly
- Color coding is accurate
- Requests are sorted by urgency
- SLA warning appears when < 15 minutes
- Notification is sent to approver
- SLA is displayed in hours:minutes format
- Expired SLA shows in red with "OVERDUE" label

**Business Validation:**
- SLA compliance is tracked
- Approvers are alerted to urgent requests
- Workflow efficiency is improved
- Compliance requirements are met

---

## 6. Facilities Management

### Test Case 6.1: Sites Management - Create New Site
**Type:** Business  
**Priority:** High  
**Preconditions:** User is logged in as Admin

**Steps:**
1. Navigate to Facilities → Sites
2. Click "Add New Site" button
3. Fill in site information:
   - Site Name: "Riyadh Data Center"
   - Location: "Riyadh, Saudi Arabia"
   - Address: "123 Tech Street, Riyadh"
   - Contact Person: "Ahmed Al-Rashid"
   - Contact Email: "ahmed@company.com"
   - Contact Phone: "+966501234567"
4. Click "Save"
5. Verify site appears in list

**Expected Results:**
- Site form displays correctly
- All fields are present
- Form validation works
- Site is saved successfully
- Confirmation message displays
- Site appears in list
- Site can be edited
- Site can be deleted

**Business Validation:**
- Sites can be created and managed
- Contact information is captured
- Sites are used for request routing
- Multiple sites are supported

---

### Test Case 6.2: Zones Management - Create Zone in Site
**Type:** Business  
**Priority:** High  
**Preconditions:** Site exists

**Steps:**
1. Navigate to Facilities → Zones
2. Click "Add New Zone" button
3. Fill in zone information:
   - Zone Name: "MMR (Maintenance & Repair)"
   - Site: Select site from dropdown
   - Security Level: "High"
   - Description: "Maintenance and repair area"
4. Click "Save"
5. Verify zone appears in list

**Expected Results:**
- Zone form displays correctly
- Site dropdown shows available sites
- Security level dropdown shows options
- Zone is saved successfully
- Zone appears in list
- Zone can be edited
- Zone can be deleted

**Business Validation:**
- Zones define access areas
- Security levels are enforced
- Zones are used for access control
- Multiple zones per site are supported

**Zone Types:**
- [ ] MMR (Maintenance & Repair)
- [ ] White Zone (Low Security)
- [ ] Grey Zone (Medium Security)
- [ ] Red Zone (High Security)

---

### Test Case 6.3: Areas Management - Create Area in Zone
**Type:** Business  
**Priority:** High  
**Preconditions:** Zone exists

**Steps:**
1. Navigate to Facilities → Areas
2. Click "Add New Area" button
3. Fill in area information:
   - Area Name: "Server Room A"
   - Zone: Select zone from dropdown
   - Capacity: 5
   - Description: "Primary server room"
4. Click "Save"
5. Verify area appears in list

**Expected Results:**
- Area form displays correctly
- Zone dropdown shows available zones
- Capacity field accepts numeric input
- Area is saved successfully
- Area appears in list
- Area can be edited
- Area can be deleted

**Business Validation:**
- Areas define specific locations
- Capacity is tracked
- Areas are used for access control
- Multiple areas per zone are supported

---

### Test Case 6.4: Facilities Hierarchy - View Complete Structure
**Type:** Business  
**Priority:** Medium  
**Preconditions:** Sites, zones, and areas exist

**Steps:**
1. Navigate to Facilities module
2. View hierarchical structure:
   - Site 1
     - Zone 1
       - Area 1
       - Area 2
     - Zone 2
       - Area 3
3. Verify all levels display correctly
4. Verify relationships are accurate

**Expected Results:**
- Hierarchy displays correctly
- All levels are visible
- Relationships are accurate
- Can navigate through hierarchy
- Can edit at each level
- Can delete at each level (with validation)

**Business Validation:**
- Facility structure is clear
- Access control is hierarchical
- Requests are routed based on hierarchy

---

## 7. User & Group Management

### Test Case 7.1: Create New User
**Type:** Business  
**Priority:** Critical  
**Preconditions:** User is logged in as Super Admin

**Steps:**
1. Navigate to Administration → Users & Roles
2. Click "Add New User" button
3. Fill in user information:
   - First Name: "Mohammed"
   - Last Name: "Ahmed"
   - Email: "mohammed.ahmed@company.com"
   - Phone: "+966501234567"
   - Role: Select "Approver" from dropdown
   - Department: Select "Operations"
   - Status: "Active"
4. Click "Save"
5. Verify user appears in list
6. Verify welcome email is sent

**Expected Results:**
- User form displays correctly
- All fields are present and editable
- Email validation works
- Role dropdown shows available roles
- User is saved successfully
- Confirmation message displays
- User appears in list
- Welcome email is sent to user
- User can login with temporary password

**Business Validation:**
- Users can be created and managed
- Users are assigned roles
- Users can be activated/deactivated
- User list is maintained

---

### Test Case 7.2: Edit User Information
**Type:** Business  
**Priority:** High  
**Preconditions:** User exists

**Steps:**
1. Navigate to Users & Roles
2. Click on user to edit
3. Modify information:
   - Department: Change to "Security"
   - Phone: Update phone number
4. Click "Save"
5. Verify changes are saved
6. Verify audit log records change

**Expected Results:**
- User details page displays
- Fields are editable
- Changes are saved successfully
- Confirmation message displays
- Audit log records change with timestamp
- Changed fields are highlighted
- User is notified of changes (if configured)

**Business Validation:**
- User information can be updated
- Changes are tracked for compliance
- Users are kept current

---

### Test Case 7.3: Assign Role to User
**Type:** Business  
**Priority:** Critical  
**Preconditions:** User exists

**Steps:**
1. Navigate to Users & Roles
2. Click on user
3. Scroll to "Assigned Roles" section
4. Click "Add Role" button
5. Select role: "Approver"
6. Click "Save"
7. Verify role is assigned
8. Logout and login as user
9. Verify user has access to Approver functions

**Expected Results:**
- Role assignment form displays
- Available roles are shown
- Role is assigned successfully
- Confirmation message displays
- User now has access to role-specific functions
- Menu items for role are visible
- User cannot access restricted functions

**Business Validation:**
- Roles control access
- Users can have multiple roles
- Role changes are immediate
- RBAC is enforced

---

### Test Case 7.4: Create User Group
**Type:** Business  
**Priority:** High  
**Preconditions:** Multiple users exist

**Steps:**
1. Navigate to Administration → Groups
2. Click "Add New Group" button
3. Fill in group information:
   - Group Name: "Riyadh Approvers"
   - Description: "Approvers for Riyadh facility"
   - Site: Select "Riyadh Data Center"
4. Click "Add Members" button
5. Select users to add:
   - Mohammed Ahmed
   - Fatima Al-Rashid
   - Ali Khan
6. Click "Save"
7. Verify group appears in list

**Expected Results:**
- Group form displays correctly
- Group is saved successfully
- Members are added successfully
- Group appears in list
- Group can be edited
- Members can be added/removed
- Group can be deleted

**Business Validation:**
- Groups simplify user management
- Groups are used for notifications
- Groups are used for approval routing
- Multiple groups can be created

---

### Test Case 7.5: Assign Group to Approval Workflow
**Type:** Business  
**Priority:** High  
**Preconditions:** Group exists, workflow builder is available

**Steps:**
1. Navigate to Workflow Builder
2. Create new workflow
3. In approval step, select "Route to Group"
4. Select group: "Riyadh Approvers"
5. Save workflow
6. Create request that triggers workflow
7. Verify request is routed to all group members

**Expected Results:**
- Group can be selected in workflow
- Request is routed to all group members
- All members can see request
- First member to approve/reject completes workflow
- Other members are notified of action
- Workflow continues correctly

**Business Validation:**
- Requests are routed to groups
- Multiple approvers can see request
- Workflow is efficient
- Notifications are sent to all members

---

## 8. Workflow Builder

### Test Case 8.1: Create Basic Approval Workflow
**Type:** Business  
**Priority:** Critical  
**Preconditions:** User is logged in as Admin, groups exist

**Steps:**
1. Navigate to Process Configuration → Workflow Builder
2. Click "Create New Workflow" button
3. Fill in workflow information:
   - Workflow Name: "Standard Approval"
   - Description: "Standard approval for all requests"
   - Trigger: "Request Created"
4. Add approval step:
   - Step Name: "Manager Approval"
   - Route to: "Managers Group"
   - SLA: 24 hours
   - Required: Yes
5. Add second approval step:
   - Step Name: "Security Review"
   - Route to: "Security Team"
   - SLA: 12 hours
   - Required: Yes
6. Click "Save Workflow"
7. Verify workflow appears in list

**Expected Results:**
- Workflow form displays correctly
- Steps can be added
- Steps can be configured
- Workflow is saved successfully
- Workflow appears in list
- Workflow can be edited
- Workflow can be activated/deactivated

**Business Validation:**
- Workflows define approval processes
- Multiple approval steps are supported
- SLA is enforced at each step
- Workflows are reusable

---

### Test Case 8.2: Conditional Routing in Workflow
**Type:** Business  
**Priority:** High  
**Preconditions:** Workflow builder is open

**Steps:**
1. In workflow builder, add conditional step
2. Set condition: "If Access Zone = MMR"
3. Set action: "Route to Security Team"
4. Add else condition: "Route to Managers Group"
5. Save workflow
6. Create request with MMR zone
7. Verify request routes to Security Team
8. Create request with different zone
9. Verify request routes to Managers Group

**Expected Results:**
- Conditional logic can be added
- Conditions are evaluated correctly
- Routing is based on conditions
- Both conditions are executed correctly
- Workflow is flexible and powerful

**Business Validation:**
- Requests are routed based on criteria
- Workflow is intelligent
- Reduces manual routing
- Improves efficiency

**Condition Types:**
- [ ] Access Zone
- [ ] Request Type
- [ ] Visitor Nationality
- [ ] Risk Level
- [ ] Materials Count

---

### Test Case 8.3: Workflow Activation & Testing
**Type:** Technical & Business  
**Priority:** High  
**Preconditions:** Workflow is created

**Steps:**
1. In workflow builder, click "Test Workflow" button
2. Select test request
3. Verify workflow executes correctly
4. Check each step is executed
5. Verify notifications are sent
6. Click "Activate Workflow" button
7. Verify workflow status changes to "Active"
8. Create new request
9. Verify workflow is applied

**Expected Results:**
- Workflow can be tested
- Test shows execution flow
- Workflow can be activated
- Active workflows are applied to new requests
- Notifications are sent
- Audit trail shows workflow execution

**Business Validation:**
- Workflows can be tested before activation
- Workflows are applied consistently
- Notifications keep users informed

---

## 9. Security Operations

### Test Case 9.1: Global Overwatch - Real-time Monitoring
**Type:** Business  
**Priority:** High  
**Preconditions:** User is logged in as Security Manager

**Steps:**
1. Navigate to Security Operations → Global Overwatch
2. Verify dashboard displays:
   - Active visitors count
   - Pending requests count
   - High-risk visitors count
   - Security alerts count
   - Real-time activity feed
3. Verify data updates in real-time
4. Verify color coding for risk levels

**Expected Results:**
- Dashboard displays all metrics
- Metrics are accurate
- Data updates in real-time (no refresh needed)
- Activity feed shows recent events
- Color coding indicates status:
  - Green: Normal
  - Yellow: Warning
  - Red: Alert
- No stale data

**Business Validation:**
- Security team has real-time visibility
- Can quickly identify issues
- Can respond to incidents
- Improves facility security

---

### Test Case 9.2: Security Alerts - View & Acknowledge
**Type:** Business  
**Priority:** High  
**Preconditions:** Security alerts exist

**Steps:**
1. Navigate to Security Operations → Security Alerts
2. Verify alert list displays:
   - Alert Type
   - Triggered Time
   - Visitor Name
   - Status (New, Acknowledged, Resolved)
3. Click on alert to view details
4. Click "Acknowledge" button
5. Verify status changes to "Acknowledged"
6. Add comment: "Visitor verified, no security concern"
7. Click "Resolve Alert"
8. Verify status changes to "Resolved"

**Expected Results:**
- Alert list displays correctly
- Alerts show all relevant information
- Alert details page opens
- "Acknowledge" button works
- Status changes to "Acknowledged"
- Comments can be added
- "Resolve Alert" button works
- Status changes to "Resolved"
- Audit trail records actions

**Business Validation:**
- Alerts are tracked and managed
- Security team can respond to alerts
- Alert history is maintained
- Compliance is documented

---

### Test Case 9.3: Watchlist Management
**Type:** Business  
**Priority:** High  
**Preconditions:** User is logged in as Admin

**Steps:**
1. Navigate to Security Operations → Watchlist
2. Click "Add to Watchlist" button
3. Fill in watchlist entry:
   - Entry Type: "Person"
   - Name: "Ahmed Al-Rashid"
   - ID Number: "1234567890"
   - Reason: "Unauthorized access attempt"
   - Risk Level: "High"
   - Date Added: Auto-filled
4. Click "Save"
5. Verify entry appears in watchlist
6. Search for watchlist entry
7. Verify entry is found

**Expected Results:**
- Watchlist form displays correctly
- Entry is saved successfully
- Entry appears in watchlist
- Entry can be searched
- Entry can be edited
- Entry can be removed
- When watchlist person arrives, alert is triggered

**Business Validation:**
- Watchlist prevents unauthorized access
- Alerts are triggered automatically
- Security is enhanced
- Compliance is maintained

**Watchlist Entry Types:**
- [ ] Person (by ID)
- [ ] Vehicle (by Plate)
- [ ] Company
- [ ] Reason for listing

---

## 10. Reports & Analytics

### Test Case 10.1: Access Reports - Generate Report
**Type:** Business  
**Priority:** High  
**Preconditions:** User is logged in as Manager

**Steps:**
1. Navigate to Reports → Access Reports
2. Select report type: "Visitor Access Summary"
3. Select date range: "Last 30 days"
4. Select site: "All Sites"
5. Click "Generate Report"
6. Verify report displays:
   - Total visitors
   - Approved requests
   - Denied requests
   - Pending requests
   - By zone breakdown
   - By department breakdown
7. Click "Export to PDF"
8. Verify PDF downloads

**Expected Results:**
- Report form displays correctly
- Report generates successfully
- Report shows all metrics
- Data is accurate
- Report can be exported to PDF
- Report can be exported to Excel
- Report can be printed
- Report includes timestamp

**Business Validation:**
- Reports provide insights
- Management can track operations
- Compliance reports are generated
- Data-driven decisions are possible

---

### Test Case 10.2: Security Reports - Incidents & Denials
**Type:** Business  
**Priority:** High  
**Preconditions:** Incidents and denials exist

**Steps:**
1. Navigate to Reports → Security Reports
2. Select report type: "Denial Summary"
3. Select date range: "Last 7 days"
4. Click "Generate Report"
5. Verify report shows:
   - Total denials
   - Denial reasons breakdown
   - Denied visitors
   - Denial trends
6. Generate "Incident Report"
7. Verify report shows:
   - Total incidents
   - Incident types
   - Incident severity
   - Incident timeline

**Expected Results:**
- Reports display correctly
- Data is accurate
- Reports can be filtered
- Reports can be exported
- Reports provide insights
- Trends are visible

**Business Validation:**
- Security team can analyze incidents
- Patterns can be identified
- Preventive measures can be taken
- Compliance is documented

---

### Test Case 10.3: Audit Logs - View System Activity
**Type:** Technical  
**Priority:** High  
**Preconditions:** User is logged in as Super Admin

**Steps:**
1. Navigate to Reports → Audit Logs
2. Verify log displays:
   - Timestamp
   - User
   - Action
   - Object (what was changed)
   - Old Value
   - New Value
   - IP Address
3. Filter by:
   - User
   - Action Type
   - Date Range
4. Verify filtering works
5. Export logs to CSV

**Expected Results:**
- Audit log displays all activities
- All required information is present
- Filtering works correctly
- Logs can be exported
- Logs are immutable (cannot be deleted)
- Logs include all system changes
- Logs include all user actions

**Business Validation:**
- Complete audit trail is maintained
- Compliance requirements are met
- Security is enhanced
- Investigations are possible

---

## 11. Integration & Settings

### Test Case 11.1: Integration Hub - Communications
**Type:** Business  
**Priority:** High  
**Preconditions:** User is logged in as Admin

**Steps:**
1. Navigate to Administration → Integration Hub
2. Click "Communications" card
3. Verify integration details:
   - Status: Active
   - Connected Channels: Email, SMS, WhatsApp
   - Last Sync: [timestamp]
4. Click "Configure" button
5. Verify configuration options:
   - Email Settings
   - SMS Settings
   - WhatsApp Settings
6. Test email notification:
   - Click "Send Test Email"
   - Verify email is received

**Expected Results:**
- Integration hub displays all integrations
- Communications integration is active
- Configuration options are available
- Test email is sent successfully
- Test email is received
- Status is updated

**Business Validation:**
- Integrations are configured
- Notifications are sent correctly
- Communication channels are working
- System is operational

---

### Test Case 11.2: Settings - System Configuration
**Type:** Business  
**Priority:** High  
**Preconditions:** User is logged in as Super Admin

**Steps:**
1. Navigate to Administration → Settings
2. Verify settings sections:
   - General Settings
   - Security Settings
   - Notification Settings
   - Workflow Settings
3. Update general settings:
   - System Name: "Centre3 Security Ops"
   - Support Email: "support@centre3.com"
   - Time Zone: "Asia/Riyadh"
4. Click "Save"
5. Verify changes are saved
6. Logout and login
7. Verify new settings are applied

**Expected Results:**
- Settings page displays correctly
- All settings are editable
- Changes are saved successfully
- Settings are applied system-wide
- Settings persist after logout/login
- Confirmation message displays

**Business Validation:**
- System can be configured
- Settings are applied consistently
- System is flexible
- Configuration is easy

---

### Test Case 11.3: Translation Management
**Type:** Technical & Business  
**Priority:** Medium  
**Preconditions:** User is logged in as Admin

**Steps:**
1. Navigate to Administration → Settings → Translation Management
2. Select language: "Arabic"
3. Verify translation keys are displayed
4. Edit translation:
   - Key: "approval.button.approve"
   - Current: "Approve"
   - New: "وافق"
5. Click "Save"
6. Switch language to Arabic
7. Verify button text is updated

**Expected Results:**
- Translation management page displays
- All keys are listed
- Translations can be edited
- Changes are saved successfully
- Language switch works
- Translations are applied immediately
- All UI elements are translated

**Business Validation:**
- System supports multiple languages
- Translations can be managed
- Arabic support is available
- RTL layout is applied for Arabic

---

## 12. MCM (Material Card Management)

### Test Case 12.1: Card Request - Create New Request
**Type:** Business  
**Priority:** High  
**Preconditions:** User is logged in

**Steps:**
1. Navigate to MCM → New Card Request
2. Fill in card request information:
   - Card Type: "Access Card"
   - Employee Name: "Mohammed Ahmed"
   - Department: "Security"
   - Access Zones: Select "MMR", "White Zone"
   - Valid From: [Today]
   - Valid To: [30 days from today]
   - Card Status: "Active"
3. Click "Submit Request"
4. Verify request appears in card directory

**Expected Results:**
- Card request form displays correctly
- All fields are present
- Request is submitted successfully
- Confirmation message displays
- Request appears in card directory
- Request status is "Pending"
- Card number is generated

**Business Validation:**
- Cards can be requested
- Access zones are assigned
- Card validity is set
- Cards are tracked

---

### Test Case 12.2: Card Directory - Search & Filter
**Type:** Business  
**Priority:** High  
**Preconditions:** Multiple card requests exist

**Steps:**
1. Navigate to MCM → Card Directory
2. Verify card list displays
3. Search by:
   - Card Number
   - Employee Name
   - Department
4. Filter by:
   - Card Status (Active, Inactive, Expired)
   - Access Zone
   - Issue Date Range
5. Verify results are accurate

**Expected Results:**
- Card list displays correctly
- Search works for all fields
- Filters work correctly
- Multiple filters can be combined
- Results update immediately
- No duplicate results

**Business Validation:**
- Cards can be easily found
- Card management is efficient
- Filtering helps with operations

---

## 13. AI Integration

### Test Case 13.1: AI Services Configuration
**Type:** Technical & Business  
**Priority:** High  
**Preconditions:** User is logged in as Admin

**Steps:**
1. Navigate to Administration → Integration Hub
2. Click "AI Services" card
3. Click "AI Services" tab
4. Verify toggles for:
   - Enable AI Services
   - Document Validation
   - Face Matching
   - Anomaly Detection
   - Plate Recognition
5. Toggle "Document Validation" ON
6. Enter Claude API Key: [valid_key]
7. Click "Save Settings"
8. Refresh page
9. Verify settings persist

**Expected Results:**
- AI Services tab displays
- All toggles are present
- Toggles can be switched on/off
- API key field accepts input
- Settings are saved successfully
- Settings persist after refresh
- Confirmation message displays

**Business Validation:**
- AI features can be enabled/disabled
- Configuration is flexible
- Settings are persistent
- Admin has full control

---

### Test Case 13.2: Document Validation - Upload & Verify
**Type:** Technical & Business  
**Priority:** High  
**Preconditions:** Document Validation is enabled, Claude API key is configured

**Steps:**
1. On Check-In screen, click "Validate Document" button
2. Document validation modal opens
3. Select document type: "National ID"
4. Upload document image (JPG/PNG)
5. System analyzes document using Claude Vision API
6. Results display:
   - Document Type: "National ID"
   - Name: "Mohammed Ahmed"
   - ID Number: "1234567890"
   - Expiry Date: "2027-12-31"
   - Confidence Score: "95%"
7. Verify results match visitor information

**Expected Results:**
- Modal displays correctly
- Document upload works
- API processes document
- Results display clearly
- Confidence score is shown
- Results can be verified
- Results can be rejected
- Mismatch alerts are triggered

**Business Validation:**
- Documents can be validated
- AI improves verification accuracy
- Fraud detection is improved
- Process is faster

---

### Test Case 13.3: Face Matching - Compare Photos
**Type:** Technical & Business  
**Priority:** High  
**Preconditions:** Face Matching is enabled

**Steps:**
1. On Check-In screen, capture visitor photo
2. System compares with ID document photo
3. Results display:
   - Match Confidence: "92%"
   - Status: "Match"
   - Recommendation: "Approve"
4. If match confidence < 80%:
   - Status: "No Match"
   - Recommendation: "Manual Review Required"

**Expected Results:**
- Photos can be captured
- Comparison is performed
- Results display clearly
- Confidence score is shown
- Recommendation is provided
- Manual override is available
- Results are logged

**Business Validation:**
- Face matching improves security
- Fraud is prevented
- Process is faster
- Manual review is available if needed

---

## 14. Security Alerts

### Test Case 14.1: Create Security Alert Configuration
**Type:** Business  
**Priority:** Critical  
**Preconditions:** User is logged in as Admin

**Steps:**
1. Navigate to Process Configuration → Security Alerts
2. Click "Create New Alert Configuration"
3. Modal opens with tabs: Basic, Conditions, Actions, Viewers, Notify
4. **Basic Tab:**
   - Alert Type: Select "Watchlist Match"
   - Configuration Name: "Watchlist Alert"
   - Description: "Alert when watchlist person arrives"
   - Impact Level: "High"
5. **Conditions Tab:**
   - Add Condition: "Watchlist Match"
6. **Actions Tab:**
   - Add Action: "Deny Entry"
   - Add Action: "Alert Supervisor"
7. **Viewers Tab:**
   - Add Viewer: Role "Security Team"
8. **Notify Tab:**
   - Add Notification: Email to "Security Manager"
   - Add Notification: SMS to "Security Manager"
9. Click "Save Configuration"

**Expected Results:**
- Modal displays all tabs
- All fields are present and editable
- Conditions dropdown shows predefined options
- Actions dropdown shows available actions
- Viewers can be selected
- Notifications can be configured
- Configuration is saved successfully
- Alert appears in list

**Business Validation:**
- Alerts can be configured
- Multiple conditions are supported
- Multiple actions are supported
- Notifications are sent to right people
- Security is enhanced

---

### Test Case 14.2: Alert Trigger - Watchlist Match
**Type:** Business  
**Priority:** Critical  
**Preconditions:** Watchlist alert is configured, watchlist person exists

**Steps:**
1. Watchlist person arrives at facility
2. Security team searches for visitor
3. System detects watchlist match
4. Alert is triggered automatically
5. Configured actions are executed:
   - Entry is denied
   - Supervisor is alerted
6. Notifications are sent:
   - Email to Security Manager
   - SMS to Security Manager
7. Alert appears in Security Alerts dashboard

**Expected Results:**
- Watchlist match is detected
- Alert is triggered immediately
- Actions are executed
- Entry is denied
- Notifications are sent
- Alert appears in dashboard
- Audit trail records alert
- Alert can be acknowledged

**Business Validation:**
- Watchlist alerts work correctly
- Security is enhanced
- Unauthorized persons are prevented
- Notifications keep team informed

---

### Test Case 14.3: Alert Escalation - Multiple Denials
**Type:** Business  
**Priority:** High  
**Preconditions:** Alert for "Multiple Denials" is configured

**Steps:**
1. Visitor is denied entry 3 times in 24 hours
2. System detects pattern
3. Alert is triggered: "Multiple Denials Alert"
4. Escalation actions are executed:
   - Alert Supervisor
   - Create Incident
   - Notify Security Manager
5. Verify alert in dashboard

**Expected Results:**
- Pattern is detected correctly
- Alert is triggered
- Escalation actions are executed
- Notifications are sent
- Alert appears in dashboard
- Audit trail records alert
- Supervisor can investigate

**Business Validation:**
- Anomaly detection works
- Suspicious behavior is flagged
- Escalation improves response
- Security is enhanced

---

## 15. Data Validation & Error Handling

### Test Case 15.1: Form Validation - Required Fields
**Type:** Technical  
**Priority:** High  
**Preconditions:** Request form is open

**Steps:**
1. Leave all required fields empty
2. Click "Submit"
3. Observe validation errors

**Expected Results:**
- Validation errors display for each empty field
- Error messages are clear:
  - "Visitor Name is required"
  - "Email is required"
  - "Access Zone is required"
- Fields with errors are highlighted in red
- Form is not submitted
- User can correct errors

---

### Test Case 15.2: Email Validation
**Type:** Technical  
**Priority:** High  
**Preconditions:** Email field is visible

**Steps:**
1. Enter invalid email: "invalid.email"
2. Click outside field
3. Observe validation error
4. Enter valid email: "test@example.com"
5. Observe error clears

**Expected Results:**
- Invalid email shows error: "Please enter a valid email address"
- Valid email passes validation
- Validation happens on blur
- Error message is clear

---

### Test Case 15.3: Date Validation - Future Date Required
**Type:** Technical  
**Priority:** High  
**Preconditions:** Visit date field is visible

**Steps:**
1. Select past date (yesterday)
2. Click outside field
3. Observe validation error
4. Select future date
5. Observe error clears

**Expected Results:**
- Past date shows error: "Visit date must be in the future"
- Future date passes validation
- Date picker prevents past dates
- Error message is clear

---

### Test Case 15.4: Time Validation - End Time After Start Time
**Type:** Technical  
**Priority:** High  
**Preconditions:** Time fields are visible

**Steps:**
1. Set Start Time: 05:00 PM
2. Set End Time: 09:00 AM
3. Click outside field
4. Observe validation error
5. Set End Time: 06:00 PM
6. Observe error clears

**Expected Results:**
- Invalid time range shows error: "End time must be after start time"
- Valid time range passes validation
- Error message is clear

---

### Test Case 15.5: Error Handling - API Failure
**Type:** Technical  
**Priority:** High  
**Preconditions:** Network is available

**Steps:**
1. Simulate API failure (disconnect network)
2. Try to submit form
3. Observe error handling

**Expected Results:**
- Error message displays: "Unable to connect to server. Please try again."
- Form is not submitted
- Retry button is available
- User can retry after reconnecting
- No data is lost

---

### Test Case 15.6: Error Handling - Duplicate Entry
**Type:** Technical  
**Priority:** High  
**Preconditions:** Request exists

**Steps:**
1. Try to create request with same visitor ID and date
2. System detects duplicate
3. Observe error handling

**Expected Results:**
- Error message displays: "A request for this visitor on this date already exists"
- Form is not submitted
- User can modify date or visitor
- Option to view existing request is provided

---

## 16. Performance & Load Testing

### Test Case 16.1: Page Load Performance
**Type:** Technical  
**Priority:** High  
**Preconditions:** System is running

**Steps:**
1. Navigate to each major page:
   - Dashboard
   - Requests List
   - Approvals
   - Checkpoint
   - Reports
2. Measure load time using browser DevTools
3. Verify performance metrics

**Expected Results:**
- Dashboard: < 2 seconds
- Requests List: < 2 seconds
- Approvals: < 2 seconds
- Checkpoint: < 2 seconds
- Reports: < 3 seconds
- No console errors
- No memory leaks

**Performance Targets:**
- First Contentful Paint (FCP): < 1 second
- Largest Contentful Paint (LCP): < 2.5 seconds
- Cumulative Layout Shift (CLS): < 0.1

---

### Test Case 16.2: List Performance - Large Dataset
**Type:** Technical  
**Priority:** High  
**Preconditions:** 1000+ requests exist

**Steps:**
1. Navigate to Requests list
2. Verify list loads quickly
3. Apply filter
4. Verify filter results display quickly
5. Sort list
6. Verify sort completes quickly
7. Scroll through list
8. Verify smooth scrolling

**Expected Results:**
- Initial load: < 2 seconds
- Filter results: < 1 second
- Sort: < 1 second
- Smooth scrolling (60 FPS)
- No lag or jank
- Pagination works correctly

---

### Test Case 16.3: Search Performance
**Type:** Technical  
**Priority:** High  
**Preconditions:** 10000+ requests exist

**Steps:**
1. Navigate to Checkpoint search
2. Search for request
3. Measure search time
4. Verify results are accurate

**Expected Results:**
- Search completes within 1 second
- Results are accurate
- No false positives
- No false negatives
- Search is case-insensitive
- Partial matches work

---

### Test Case 16.4: Concurrent Users - System Stability
**Type:** Technical  
**Priority:** High  
**Preconditions:** Load testing tool is available

**Steps:**
1. Simulate 50 concurrent users
2. Each user performs:
   - Login
   - View dashboard
   - Create request
   - View approvals
   - Logout
3. Monitor system performance
4. Check for errors

**Expected Results:**
- All users can login successfully
- No timeouts
- No 500 errors
- Response times remain acceptable
- Database connections are managed
- No data corruption

---

## 17. Security & Compliance

### Test Case 17.1: SQL Injection Prevention
**Type:** Security  
**Priority:** Critical  
**Preconditions:** Search form is available

**Steps:**
1. In search field, enter: `' OR '1'='1`
2. Click search
3. Observe system response

**Expected Results:**
- Search is treated as literal string
- No SQL injection occurs
- No data is exposed
- Error message is generic
- Injection attempt is logged

---

### Test Case 17.2: XSS Prevention
**Type:** Security  
**Priority:** Critical  
**Preconditions:** Text input field is available

**Steps:**
1. In text field, enter: `<script>alert('XSS')</script>`
2. Submit form
3. Verify script is not executed

**Expected Results:**
- Script is not executed
- Text is displayed as literal string
- No alert appears
- HTML is escaped
- Input is sanitized

---

### Test Case 17.3: CSRF Prevention
**Type:** Security  
**Priority:** High  
**Preconditions:** User is logged in

**Steps:**
1. Create form on external website
2. Try to submit form to Centre3
3. Observe system response

**Expected Results:**
- Request is rejected
- CSRF token is validated
- Error message displays
- Request is logged
- No action is taken

---

### Test Case 17.4: Password Security
**Type:** Security  
**Priority:** High  
**Preconditions:** User management is available

**Steps:**
1. Create user with weak password: "123456"
2. Observe password validation

**Expected Results:**
- Weak password is rejected
- Error message: "Password must be at least 8 characters and contain uppercase, lowercase, numbers, and special characters"
- Strong password is accepted
- Password is hashed in database
- Password is never logged

---

### Test Case 17.5: Data Encryption - In Transit
**Type:** Security  
**Priority:** High  
**Preconditions:** System is running

**Steps:**
1. Monitor network traffic
2. Verify HTTPS is used
3. Check SSL certificate

**Expected Results:**
- All traffic is encrypted (HTTPS)
- SSL certificate is valid
- Certificate is from trusted CA
- No unencrypted data is transmitted
- Certificate is not expired

---

### Test Case 17.6: Data Encryption - At Rest
**Type:** Security  
**Priority:** High  
**Preconditions:** Database is accessible

**Steps:**
1. Check database for sensitive data
2. Verify encryption is applied
3. Check encryption keys

**Expected Results:**
- Sensitive data is encrypted:
  - Passwords
  - API keys
  - Personal information
- Encryption keys are secure
- Keys are rotated regularly
- Decryption works correctly

---

### Test Case 17.7: Audit Trail - Completeness
**Type:** Compliance  
**Priority:** High  
**Preconditions:** Audit logs are available

**Steps:**
1. Perform actions:
   - Create request
   - Approve request
   - Deny request
   - Edit user
   - Create alert
2. Check audit logs
3. Verify all actions are logged

**Expected Results:**
- All actions are logged
- Logs include:
  - Timestamp
  - User
  - Action
  - Object
  - Old value
  - New value
  - IP address
- Logs are immutable
- Logs are complete

---

### Test Case 17.8: Compliance - Data Retention
**Type:** Compliance  
**Priority:** High  
**Preconditions:** Data retention policy is defined

**Steps:**
1. Check data retention settings
2. Verify old data is archived
3. Verify archived data is secure

**Expected Results:**
- Data retention policy is defined
- Old data is archived after 1 year
- Archived data is encrypted
- Archived data can be retrieved
- Deleted data cannot be recovered

---

## Test Execution Summary

### Test Metrics to Track

| Metric | Target | Actual |
|--------|--------|--------|
| Total Test Cases | 100+ | |
| Pass Rate | 95%+ | |
| Critical Issues | 0 | |
| High Priority Issues | < 5 | |
| Medium Priority Issues | < 20 | |
| Low Priority Issues | < 50 | |
| Code Coverage | 80%+ | |
| Performance (Page Load) | < 2s | |
| Performance (API Response) | < 500ms | |

### Test Execution Checklist

- [ ] All test cases executed
- [ ] All failures documented
- [ ] Screenshots captured for failures
- [ ] Bugs logged in issue tracker
- [ ] Performance metrics recorded
- [ ] Security tests passed
- [ ] Compliance verified
- [ ] User acceptance obtained
- [ ] Production readiness confirmed

### Known Issues & Limitations

| Issue | Severity | Status | Workaround |
|-------|----------|--------|-----------|
| [Issue #1] | High | Open | [Workaround] |
| [Issue #2] | Medium | In Progress | [Workaround] |

### Recommendations

1. **Performance Optimization** - Implement caching for frequently accessed data
2. **Security Hardening** - Implement rate limiting on login attempts
3. **User Experience** - Add loading indicators for long-running operations
4. **Documentation** - Create user guides for each module
5. **Training** - Conduct training sessions for end users

---

**Document Prepared By:** QA Team  
**Date:** February 20, 2026  
**Version:** 1.0  
**Status:** Ready for Testing

