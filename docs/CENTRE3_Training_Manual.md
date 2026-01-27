# CENTRE3 Facility Access Management System
## Comprehensive Training Manual

**Version:** 1.0  
**Last Updated:** January 27, 2026  
**Author:** Manus AI

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Authentication Module](#2-authentication-module)
3. [Dashboard Module](#3-dashboard-module)
4. [Facility Management Module](#4-facility-management-module)
5. [Access Request Module](#5-access-request-module)
6. [Approval Workflow Module](#6-approval-workflow-module)
7. [User Management Module](#7-user-management-module)
8. [Group Management Module](#8-group-management-module)
9. [Security Operations Module](#9-security-operations-module)
10. [Settings & Configuration Module](#10-settings--configuration-module)
11. [Workflow Builder Module](#11-workflow-builder-module)
12. [Shift Management Module](#12-shift-management-module)
13. [Delegation Management Module](#13-delegation-management-module)
14. [Appendix: Test Cases](#appendix-test-cases)

---

## 1. System Overview

CENTRE3 is an enterprise-grade Facility Access Management System designed specifically for data centers and critical infrastructure facilities. The system provides comprehensive visitor management, access control, approval workflows, and security monitoring capabilities.

### 1.1 Key Features

The platform delivers end-to-end facility access management through several integrated modules. The authentication system supports email/password login with role-based access control, ensuring only authorized personnel can access specific functions. The hierarchical facility structure organizes locations into Sites, Zones, and Areas, each with configurable security levels and access policies.

The dynamic request system allows administrators to configure custom request types with flexible form fields, while the workflow engine routes approvals based on configurable conditions including location, requester attributes, and time-based rules. Real-time security monitoring provides alerts for unauthorized access attempts, door forcing, and other security events.

### 1.2 System Architecture

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React 19 + TypeScript | User interface and interactions |
| Styling | Tailwind CSS 4 + shadcn/ui | Consistent design system |
| API Layer | tRPC 11 | Type-safe API communication |
| Backend | Express 4 + Node.js | Server-side logic |
| Database | MySQL/TiDB | Data persistence |
| Authentication | JWT + Custom Auth | Session management |

### 1.3 User Roles

The system supports two primary user roles with distinct permissions:

**Administrator** users have full access to all system functions including user management, workflow configuration, facility setup, and system settings. They can create and modify approval workflows, manage security alerts, and configure request types.

**Standard User** accounts can submit access requests, view their request history, and perform approvals if assigned as an approver in a workflow stage. They cannot access administrative functions or modify system configuration.

---

## 2. Authentication Module

The Authentication Module handles user login, session management, and access control throughout the application.

### 2.1 Module Description

This module provides secure authentication using email and password credentials. Upon successful login, the system generates a JWT token stored as an HTTP-only cookie, maintaining the user session across page navigations. The module also handles logout functionality, session expiration, and access denial for unauthorized routes.

### 2.2 Key Components

| Component | File Location | Purpose |
|-----------|---------------|---------|
| Login Page | `modules/auth/Login.tsx` | User authentication interface |
| Access Denied | `modules/auth/AccessDenied.tsx` | Unauthorized access handling |
| Not Found | `modules/auth/NotFound.tsx` | 404 error page |
| Profile | `modules/auth/Profile.tsx` | User profile management |

### 2.3 How-To Guide

**Logging into the System:**

1. Navigate to the application URL in your web browser
2. Enter your registered email address in the Email field
3. Enter your password in the Password field
4. Click the "Login" button
5. Upon successful authentication, you will be redirected to the Dashboard

**Changing Your Password:**

1. Log into the system
2. Click on your profile name in the top-right corner
3. Select "Profile" from the dropdown menu
4. Navigate to the Security section
5. Enter your current password
6. Enter and confirm your new password
7. Click "Update Password"

**Logging Out:**

1. Click on your profile name in the top-right corner
2. Select "Logout" from the dropdown menu
3. You will be redirected to the login page

### 2.4 Test Cases

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| AUTH-001 | Valid Login | Enter valid email and password, click Login | User redirected to Dashboard |
| AUTH-002 | Invalid Password | Enter valid email with wrong password | Error message displayed |
| AUTH-003 | Empty Fields | Click Login without entering credentials | Validation error shown |
| AUTH-004 | Session Persistence | Login, close browser, reopen application | User remains logged in |
| AUTH-005 | Logout | Click Logout from profile menu | User redirected to login page |
| AUTH-006 | Access Denied | Navigate to admin page as regular user | Access Denied page shown |
| AUTH-007 | Invalid Email Format | Enter malformed email address | Validation error displayed |

---

## 3. Dashboard Module

The Dashboard Module provides a centralized view of facility operations, key metrics, and pending actions.

### 3.1 Module Description

The Dashboard serves as the primary landing page after login, presenting real-time statistics about facility access, visitor traffic, and security status. It aggregates data from multiple modules to provide administrators and users with an at-a-glance overview of current operations.

### 3.2 Key Metrics Displayed

| Metric | Description | Data Source |
|--------|-------------|-------------|
| Active Visitors | Current visitors on-site | Requests table |
| Pending Approvals | Requests awaiting approval | Approval instances |
| Security Alerts | Unresolved security events | Security alerts table |
| Today's Requests | Requests submitted today | Requests table |
| Zone Occupancy | Current occupancy by zone | Zones table |
| Visitor Traffic | Hourly visitor count trend | Requests table |

### 3.3 How-To Guide

**Viewing Dashboard Statistics:**

1. Log into the system
2. The Dashboard loads automatically as the home page
3. Review the KPI cards at the top for quick metrics
4. Scroll down to view detailed charts and tables

**Refreshing Dashboard Data:**

1. Click the "Refresh Data" button in the top-right corner
2. All statistics and charts will update with current data

**Navigating to Detailed Views:**

1. Click on any KPI card to navigate to the related module
2. For example, clicking "Pending Approvals" opens the Approvals page
3. Click "View All" links in tables to see complete lists

### 3.4 Test Cases

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| DASH-001 | Initial Load | Login and view Dashboard | All KPIs display current values |
| DASH-002 | Data Refresh | Click Refresh Data button | Statistics update without page reload |
| DASH-003 | KPI Navigation | Click on Active Visitors card | Navigate to Requests page |
| DASH-004 | Alert Badge | Create new security alert | Alert count increments |
| DASH-005 | Zone Occupancy Chart | View zone occupancy section | Bar chart displays correctly |
| DASH-006 | Recent Activity | Submit new request | Activity appears in recent list |

---

## 4. Facility Management Module

The Facility Management Module handles the hierarchical organization of physical locations including Sites, Zones, and Areas.

### 4.1 Module Description

This module enables administrators to define and manage the facility hierarchy. Sites represent top-level locations (e.g., data centers), Zones are subdivisions within sites (e.g., server halls), and Areas are specific locations within zones (e.g., individual cages or racks). Each level supports configurable security settings and access policies.

### 4.2 Hierarchy Structure

```
Site (Data Center)
├── Zone (Server Hall A)
│   ├── Area (Cage 1)
│   ├── Area (Cage 2)
│   └── Area (Network Room)
├── Zone (Server Hall B)
│   ├── Area (Cage 3)
│   └── Area (Cage 4)
└── Zone (Support Areas)
    ├── Area (Loading Dock)
    └── Area (Security Office)
```

### 4.3 Key Components

| Component | File Location | Purpose |
|-----------|---------------|---------|
| Sites | `modules/facilities/Sites.tsx` | Site management interface |
| Zones | `modules/facilities/Zones.tsx` | Zone management interface |
| Areas | `modules/facilities/Areas.tsx` | Area management interface |
| View Site | `modules/facilities/ViewSite.tsx` | Detailed site view |

### 4.4 How-To Guide

**Creating a New Site:**

1. Navigate to Site and Facilities → Sites
2. Click the "Add Site" button
3. Fill in the required fields:
   - Site Code (unique identifier)
   - Site Name
   - Country and Region
   - Address
   - Site Type
   - Maximum Capacity
4. Click "Create" to save the site

**Adding a Zone to a Site:**

1. Navigate to Site and Facilities → Zones
2. Click "Add Zone"
3. Select the parent Site from the dropdown
4. Enter Zone details:
   - Zone Code
   - Zone Name
   - Security Level (Low/Medium/High/Critical)
   - Access Policy (Open/Supervised/Restricted/Prohibited)
   - Maximum Capacity
5. Configure security controls (CCTV, Biometric, Badge)
6. Click "Create"

**Creating an Area within a Zone:**

1. Navigate to Site and Facilities → Areas
2. Click "Add Area"
3. Select the parent Zone
4. Enter Area details:
   - Area Code
   - Area Name
   - Floor number
   - Area Type
   - Maximum Capacity
5. Configure infrastructure specifications if applicable
6. Click "Create"

**Locking a Zone:**

1. Navigate to Zones
2. Find the zone to lock
3. Click the lock icon in the Actions column
4. Enter a reason for locking
5. Confirm the action
6. The zone will show as locked and prevent new access requests

### 4.5 Test Cases

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| FAC-001 | Create Site | Fill all required fields, click Create | Site appears in list |
| FAC-002 | Duplicate Site Code | Create site with existing code | Error: Code already exists |
| FAC-003 | Create Zone | Select site, fill zone details | Zone linked to site |
| FAC-004 | Zone Security Level | Set security level to Critical | Badge shows Critical |
| FAC-005 | Create Area | Select zone, fill area details | Area linked to zone |
| FAC-006 | Lock Zone | Click lock icon, enter reason | Zone shows locked status |
| FAC-007 | Unlock Zone | Click unlock on locked zone | Zone returns to active |
| FAC-008 | Delete Site with Zones | Try to delete site with zones | Error: Remove zones first |
| FAC-009 | Edit Site | Modify site name, save | Name updated in list |
| FAC-010 | Filter by Site Type | Select site type filter | Only matching sites shown |

---

## 5. Access Request Module

The Access Request Module handles the creation, submission, and tracking of facility access requests.

### 5.1 Module Description

This module provides a dynamic form system for submitting various types of access requests. The form structure adapts based on the selected request category and type, displaying only relevant fields. Requests flow through configurable approval workflows before granting access.

### 5.2 Request Types

| Category | Types | Description |
|----------|-------|-------------|
| Admin Visit | Standard Visit | General administrative access |
| Technical & Delivery | TEP, WP, MOP, MHV | Technical work and material handling |
| Escort | Escort Request | Accompanied visitor access |

### 5.3 Request Lifecycle

The request follows a defined lifecycle from creation to completion:

1. **Draft** - Request created but not submitted
2. **Pending Approval** - Submitted and awaiting approvals
3. **Approved** - All approval stages completed
4. **Rejected** - Declined by an approver
5. **Cancelled** - Withdrawn by requestor
6. **Expired** - Access period has passed

### 5.4 How-To Guide

**Submitting a New Request:**

1. Navigate to Requests → New Request
2. Select the Request Category (e.g., Admin Visit)
3. Select the specific Request Type(s)
4. Click "Continue" to proceed to the form
5. Complete all required tabs:
   - **Visit Details**: Purpose, dates, times
   - **Visitor Information**: Name, ID, company
   - **Location**: Site, zones, areas to access
   - **Additional Info**: Assets, special requirements
6. Review all information
7. Click "Submit Request"

**Adding Multiple Visitors:**

1. In the Visitor Information tab, click "Add Visitor"
2. Fill in visitor details for each person
3. Repeat for all visitors
4. Each visitor will be tracked separately

**Tracking Request Status:**

1. Navigate to Requests → All Requests
2. Use filters to find your request:
   - Status filter
   - Date range
   - Request type
3. Click on a request to view details
4. The timeline shows approval progress

**Cancelling a Request:**

1. Find the request in All Requests
2. Click the Actions menu (three dots)
3. Select "Cancel Request"
4. Confirm the cancellation
5. Request status changes to Cancelled

### 5.5 Test Cases

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| REQ-001 | Create Request | Complete form, submit | Request created with pending status |
| REQ-002 | Required Fields | Submit with empty required fields | Validation errors shown |
| REQ-003 | Date Validation | Set end date before start date | Error: Invalid date range |
| REQ-004 | Add Visitor | Click Add Visitor, fill details | Visitor added to list |
| REQ-005 | Remove Visitor | Click remove on visitor row | Visitor removed |
| REQ-006 | Multiple Zones | Select multiple zones | All zones saved to request |
| REQ-007 | Cancel Request | Cancel pending request | Status changes to Cancelled |
| REQ-008 | View Request | Click on request row | Details page opens |
| REQ-009 | Filter by Status | Select Approved filter | Only approved requests shown |
| REQ-010 | Search Request | Enter request number | Matching request displayed |

---

## 6. Approval Workflow Module

The Approval Workflow Module manages the review and approval process for access requests.

### 6.1 Module Description

This module provides interfaces for approvers to review, approve, or reject access requests. The workflow engine automatically routes requests to appropriate approvers based on configured conditions. Approvers receive notifications and can take action through the Approvals interface.

### 6.2 Approval Stages

| Stage Type | Description | Approvers |
|------------|-------------|-----------|
| Individual | Specific user approval | Named user |
| Role | Any user with role | Role members |
| Group | Group-based approval | Group members |
| Manager | Requestor's manager | Manager chain |
| Shift-based | Current shift personnel | On-duty staff |

### 6.3 Key Components

| Component | File Location | Purpose |
|-----------|---------------|---------|
| My Approvals | `modules/approvals/Approvals.tsx` | Pending approval tasks |
| Approval History | `modules/approvals/ApprovalHistory.tsx` | Past approval decisions |
| L1 Approval | `modules/approvals/L1Approval.tsx` | Level 1 approval interface |
| L2 Approval | `modules/approvals/L2Approval.tsx` | Level 2 approval interface |

### 6.4 How-To Guide

**Reviewing Pending Approvals:**

1. Navigate to Approvals → My Approvals
2. View the list of requests awaiting your approval
3. Click on a request to see full details
4. Review visitor information, purpose, and requested access

**Approving a Request:**

1. Open the request details
2. Review all information carefully
3. Click the "Approve" button
4. Add optional comments
5. Confirm the approval
6. Request advances to next stage or becomes Approved

**Rejecting a Request:**

1. Open the request details
2. Click the "Reject" button
3. Enter a reason for rejection (required)
4. Confirm the rejection
5. Request status changes to Rejected
6. Requestor is notified of the decision

**Requesting Additional Information:**

1. Open the request details
2. Click "Request Info" button
3. Enter your question or information needed
4. Submit the request
5. Requestor receives notification to provide information

**Viewing Approval History:**

1. Navigate to Approvals → Approval History
2. View all past approval decisions
3. Filter by date range, status, or request type
4. Click on any entry to see full details

### 6.5 Test Cases

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| APR-001 | View Pending | Open My Approvals | List shows pending tasks |
| APR-002 | Approve Request | Click Approve, confirm | Status advances to next stage |
| APR-003 | Reject Request | Click Reject, enter reason | Status changes to Rejected |
| APR-004 | Reject Without Reason | Click Reject, leave reason empty | Validation error shown |
| APR-005 | Request Info | Click Request Info, enter question | Notification sent to requestor |
| APR-006 | View History | Open Approval History | Past decisions displayed |
| APR-007 | Filter History | Apply status filter | Filtered results shown |
| APR-008 | Approval Notification | Submit request | Approver receives notification |
| APR-009 | Multi-stage Approval | Approve L1, check L2 | Request moves to L2 queue |
| APR-010 | SLA Warning | Wait past SLA time | Warning indicator shown |

---

## 7. User Management Module

The User Management Module handles user accounts, roles, and permissions.

### 7.1 Module Description

This module enables administrators to create and manage user accounts, assign roles, and configure permissions. It supports filtering users by various criteria and provides bulk actions for efficient management.

### 7.2 User Attributes

| Attribute | Description | Required |
|-----------|-------------|----------|
| First Name | User's first name | Yes |
| Last Name | User's last name | Yes |
| Email | Login email address | Yes |
| Phone | Contact number | No |
| Department | Organizational unit | No |
| Role | System role (Admin/User) | Yes |
| Status | Active or Inactive | Yes |

### 7.3 How-To Guide

**Creating a New User:**

1. Navigate to Administration → Users & Roles
2. Click "Add User" button
3. Fill in user details:
   - First Name and Last Name
   - Email address
   - Phone number (optional)
   - Select Department
   - Select Role
   - Set temporary password
4. Click "Create User"
5. User receives email with login credentials

**Editing User Information:**

1. Find the user in the list
2. Click the Actions menu (three dots)
3. Select "Edit"
4. Modify the desired fields
5. Click "Save Changes"

**Deactivating a User:**

1. Find the user in the list
2. Click the Actions menu
3. Select "Deactivate"
4. Confirm the action
5. User can no longer log in

**Changing User Role:**

1. Find the user in the list
2. Click the Actions menu
3. Select "Change Role"
4. Select the new role
5. Confirm the change

**Filtering Users:**

1. Click the "Filters" button
2. Select filter criteria:
   - Status (Active/Inactive)
   - Role (Admin/User)
   - Department
   - Group membership
3. Click "Apply Filters"
4. Use "Clear Filters" to reset

### 7.4 Test Cases

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| USR-001 | Create User | Fill all fields, click Create | User appears in list |
| USR-002 | Duplicate Email | Create user with existing email | Error: Email already exists |
| USR-003 | Edit User | Modify name, save | Name updated |
| USR-004 | Deactivate User | Click Deactivate, confirm | Status changes to Inactive |
| USR-005 | Activate User | Click Activate on inactive user | Status changes to Active |
| USR-006 | Change Role | Change from User to Admin | Role updated |
| USR-007 | Filter by Status | Select Active filter | Only active users shown |
| USR-008 | Filter by Department | Select department | Filtered results |
| USR-009 | Search User | Enter name in search | Matching users displayed |
| USR-010 | Reset Password | Click Change Password | Password reset email sent |

---

## 8. Group Management Module

The Group Management Module organizes users into hierarchical groups with configurable access policies.

### 8.1 Module Description

Groups provide a way to organize users and apply collective access policies. Groups can be nested to create hierarchies (e.g., External Vendors → IT Contractors → Network Team). Each group can have its own security settings and approval configurations.

### 8.2 Group Hierarchy

Groups support parent-child relationships allowing for organizational structure:

```
Center3 Employees
├── IT Operations
│   ├── Network Team
│   └── Security Team
├── Facilities
└── Management

External Vendors
├── IT Contractors
├── Maintenance
└── Delivery Services
```

### 8.3 How-To Guide

**Creating a New Group:**

1. Navigate to Administration → Groups
2. Click "Create Group" button
3. Enter group details:
   - Group Name
   - Description
   - Parent Group (optional)
   - Access Policy
4. Click "Create"

**Adding Users to a Group:**

1. Find the group in the list
2. Click on the group name to open details
3. Click "Manage Members"
4. Search for users to add
5. Click "Add" next to each user
6. Close the dialog

**Configuring Group Access Policy:**

1. Open the group details
2. Click "Access Policies" tab
3. Click "Add Policy"
4. Select:
   - Sites allowed
   - Zones allowed
   - Time restrictions
   - Escort requirements
5. Save the policy

**Setting Group Security Settings:**

1. Open the group details
2. Click "Security Settings" tab
3. Configure:
   - Maximum visit duration
   - Advance booking required
   - Background check required
   - Escort always required
4. Save settings

### 8.4 Test Cases

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| GRP-001 | Create Group | Enter name, click Create | Group appears in list |
| GRP-002 | Create Child Group | Select parent, create group | Group nested under parent |
| GRP-003 | Add Member | Add user to group | User appears in members |
| GRP-004 | Remove Member | Remove user from group | User removed from members |
| GRP-005 | Set Access Policy | Configure site access | Policy saved |
| GRP-006 | Delete Empty Group | Delete group with no members | Group deleted |
| GRP-007 | Delete Group with Members | Try to delete group with users | Warning: Remove members first |
| GRP-008 | Edit Group | Modify group name | Name updated |
| GRP-009 | View Hierarchy | Expand parent group | Child groups visible |
| GRP-010 | Security Settings | Set escort required | Setting saved |

---

## 9. Security Operations Module

The Security Operations Module provides real-time monitoring and alert management for facility security.

### 9.1 Module Description

This module enables security personnel to monitor facility access, respond to alerts, and maintain situational awareness. It includes a global overwatch view showing all sites and a detailed alert management interface.

### 9.2 Alert Types

| Alert Type | Severity | Description |
|------------|----------|-------------|
| Door Forced | Critical | Unauthorized door opening |
| Unauthorized Access | High | Access attempt without permission |
| Tailgating | Medium | Multiple entries on single badge |
| Fire | Critical | Fire detection system triggered |
| Intrusion | Critical | Perimeter breach detected |
| System Failure | High | Security system malfunction |
| Manual Trigger | Variable | Manually created alert |

### 9.3 Key Components

| Component | File Location | Purpose |
|-----------|---------------|---------|
| Global Overwatch | `modules/security/GlobalOverwatch.tsx` | Multi-site monitoring |
| Security Alerts | `modules/security/SecurityAlerts.tsx` | Alert management |

### 9.4 How-To Guide

**Viewing Global Overwatch:**

1. Navigate to Security Operations → Global Overwatch
2. View the map showing all site locations
3. Color indicators show site status:
   - Green: Normal operations
   - Yellow: Active alerts
   - Red: Critical alerts
4. Click on a site marker for details

**Managing Security Alerts:**

1. Navigate to Security Operations → Security Alerts
2. View the list of active alerts
3. Alerts are sorted by severity and time
4. Click on an alert to view details

**Acknowledging an Alert:**

1. Open the alert details
2. Review the alert information
3. Click "Acknowledge"
4. Add notes if needed
5. Alert status changes to "In Progress"

**Resolving an Alert:**

1. Open an acknowledged alert
2. Click "Resolve"
3. Enter resolution details:
   - Resolution type (Resolved/False Alarm)
   - Resolution notes
4. Confirm resolution
5. Alert moves to resolved status

**Creating a Manual Alert:**

1. Click "Create Alert" button
2. Select:
   - Site and Zone
   - Alert type
   - Severity level
3. Enter description
4. Click "Create"

### 9.5 Test Cases

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| SEC-001 | View Alerts | Open Security Alerts | List displays active alerts |
| SEC-002 | Acknowledge Alert | Click Acknowledge | Status changes to In Progress |
| SEC-003 | Resolve Alert | Enter resolution, confirm | Alert marked resolved |
| SEC-004 | Mark False Alarm | Select False Alarm option | Alert marked as false alarm |
| SEC-005 | Create Manual Alert | Fill form, create | Alert appears in list |
| SEC-006 | Filter by Severity | Select Critical filter | Only critical alerts shown |
| SEC-007 | Filter by Site | Select specific site | Site alerts displayed |
| SEC-008 | Alert Notification | New alert created | Badge count updates |
| SEC-009 | View Overwatch | Open Global Overwatch | Map displays sites |
| SEC-010 | Site Status | Create critical alert | Site marker turns red |

---

## 10. Settings & Configuration Module

The Settings Module provides system-wide configuration options and administrative tools.

### 10.1 Module Description

This module allows administrators to configure system settings, manage master data, and customize the application behavior. It includes department management, translation settings, and request type configuration.

### 10.2 Settings Categories

| Category | Description | Access |
|----------|-------------|--------|
| General | System-wide settings | Admin |
| Departments | Organizational units | Admin |
| Master Data | Lookup values | Admin |
| Translations | Language strings | Admin |
| Request Types | Form configuration | Admin |

### 10.3 How-To Guide

**Managing Departments:**

1. Navigate to Settings → Departments tab
2. View existing departments
3. Click "Add Department" to create new
4. Enter:
   - Department Name
   - Cost Center
   - Description
5. Click "Create"

**Configuring Master Data:**

1. Navigate to Settings → Master Data tab
2. Select the data type (Site Types, Zone Types, etc.)
3. View and edit existing values
4. Add new values as needed
5. Arrange sort order by dragging

**Managing Translations:**

1. Navigate to Settings → Translation Management
2. Select the language to edit
3. Search for specific strings
4. Edit translations inline
5. Changes save automatically

**Configuring Request Types:**

1. Navigate to Settings → Request Types
2. View existing categories and types
3. Click on a type to edit its form
4. Add/remove form sections
5. Configure fields within sections
6. Set field validation rules

### 10.4 Test Cases

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| SET-001 | Create Department | Enter name, create | Department added |
| SET-002 | Edit Department | Modify name, save | Name updated |
| SET-003 | Delete Department | Delete unused department | Department removed |
| SET-004 | Add Site Type | Create new site type | Type available in dropdown |
| SET-005 | Edit Translation | Modify Arabic text | Translation updated |
| SET-006 | Add Form Section | Create section in request type | Section appears in form |
| SET-007 | Add Form Field | Add field to section | Field appears in form |
| SET-008 | Reorder Fields | Drag field to new position | Order updated |
| SET-009 | Set Required Field | Mark field as required | Validation enforced |
| SET-010 | Preview Form | Click Preview | Form renders correctly |

---

## 11. Workflow Builder Module

The Workflow Builder Module enables administrators to create and configure approval workflows.

### 11.1 Module Description

This powerful module allows the creation of dynamic approval workflows with multiple stages, conditions, and approver types. Workflows can be configured to route requests based on location, requester attributes, time, and other criteria.

### 11.2 Workflow Components

| Component | Description |
|-----------|-------------|
| Workflow | Container for stages and conditions |
| Stage | Single approval step with approvers |
| Condition | Rule determining when workflow applies |
| Approver | Person or role responsible for approval |
| Escalation | Rules for handling delayed approvals |

### 11.3 Condition Types

The system supports 23 condition types organized into categories:

**Location Conditions:** Site, Zone, Area, Region

**Request Conditions:** Process Type, Category, Sub-Category, Activity Risk Level, Visitor Count, Request Duration, VIP Visit, Escort Required, Access Level

**Requester Conditions:** Requester Group, Requester Type, Requester Department, Requester Role

**Special Conditions:** Has MOP, Has MHV

**Time Conditions:** Time Range, Working Hours, Shift, Day of Week

### 11.4 How-To Guide

**Creating a New Workflow:**

1. Navigate to Workflow Management → Workflow Builder
2. Click "New" button
3. Enter workflow details:
   - Name
   - Description
   - Process Type
   - Priority (higher = evaluated first)
4. Click "Create"

**Adding Approval Stages:**

1. Select the workflow
2. Click "Add Stage"
3. Configure stage:
   - Stage Name (e.g., "L1 - Initial Review")
   - Stage Type (Individual, Role, Group, etc.)
   - Approval Mode (Any, All, Percentage)
   - SLA Hours
4. Add approvers to the stage
5. Save the stage

**Adding Routing Conditions:**

1. Select the workflow
2. Click the "Conditions" tab
3. Click "Add Condition"
4. Select:
   - Condition Type (e.g., Site)
   - Operator (Equals, In, etc.)
   - Value (select from dropdown)
   - Logical Group (for AND/OR logic)
5. Click "Add Condition"

**Configuring Escalation Rules:**

1. Open a stage configuration
2. Click "Add Escalation Rule"
3. Configure:
   - Trigger Type (No Response, SLA Warning)
   - Trigger Value (hours)
   - Action (Notify, Escalate, Auto-approve)
4. Save the rule

**Setting Workflow as Default:**

1. Select the workflow
2. Click the "Settings" tab
3. Toggle "Set as Default"
4. This workflow will be used when no conditions match

### 11.5 Test Cases

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| WFL-001 | Create Workflow | Enter name, create | Workflow appears in list |
| WFL-002 | Duplicate Name | Create with existing name | Error: Name already exists |
| WFL-003 | Add Stage | Configure stage, save | Stage added to workflow |
| WFL-004 | Add Condition | Select type and value | Condition saved |
| WFL-005 | Multiple Conditions | Add conditions in same group | AND logic applied |
| WFL-006 | Condition Groups | Add conditions in different groups | OR logic applied |
| WFL-007 | Delete Condition | Click delete on condition | Condition removed |
| WFL-008 | Reorder Stages | Drag stage to new position | Order updated |
| WFL-009 | Set Default | Toggle default setting | Workflow marked default |
| WFL-010 | Deactivate Workflow | Click Deactivate | Workflow no longer routes |
| WFL-011 | Site Condition | Add site_id equals condition | Condition evaluates correctly |
| WFL-012 | Zone Condition | Add zone_id in condition | Multiple zones matched |
| WFL-013 | Department Condition | Add requester_department | Department filter works |
| WFL-014 | VIP Condition | Add vip_visit equals true | VIP requests routed |
| WFL-015 | Day of Week | Add day_of_week condition | Time-based routing works |

---

## 12. Shift Management Module

The Shift Management Module handles work schedules and shift-based approver assignments.

### 12.1 Module Description

This module enables the configuration of shift schedules and assignment of personnel to shifts. Shift-based routing allows approval workflows to automatically select approvers based on who is currently on duty.

### 12.2 Shift Components

| Component | Description |
|-----------|-------------|
| Shift Schedule | Definition of shift times |
| Shift Assignment | User assigned to specific shift |
| Rotation | Recurring shift patterns |

### 12.3 How-To Guide

**Creating a Shift Schedule:**

1. Navigate to Workflow Management → Shift Management
2. Click "Add Schedule"
3. Enter schedule details:
   - Name (e.g., "Day Shift")
   - Start Time
   - End Time
   - Days of Week
4. Click "Create"

**Assigning Users to Shifts:**

1. Select the shift schedule
2. Click "Manage Assignments"
3. Search for users
4. Click "Assign" next to each user
5. Set effective dates if needed
6. Save assignments

**Configuring Shift Rotation:**

1. Open shift schedule
2. Click "Rotation Settings"
3. Configure:
   - Rotation frequency
   - Team assignments
   - Handover time
4. Save rotation

### 12.4 Test Cases

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| SHF-001 | Create Schedule | Enter times, create | Schedule appears in list |
| SHF-002 | Assign User | Add user to shift | User appears in assignments |
| SHF-003 | Remove Assignment | Remove user from shift | User removed |
| SHF-004 | Overlapping Shifts | Assign user to overlapping shifts | Warning displayed |
| SHF-005 | Current Shift | Check current shift | Correct shift returned |
| SHF-006 | Shift-based Routing | Submit request during shift | On-duty approver assigned |

---

## 13. Delegation Management Module

The Delegation Management Module allows users to delegate their approval authority to others.

### 13.1 Module Description

This module enables approvers to delegate their approval responsibilities when they are unavailable. Delegations can be temporary (vacation) or permanent, and can be restricted to specific request types or sites.

### 13.2 Delegation Types

| Type | Description | Duration |
|------|-------------|----------|
| Temporary | Time-limited delegation | Start/End dates |
| Permanent | Ongoing delegation | Until revoked |
| Partial | Limited scope | Specific types only |

### 13.3 How-To Guide

**Creating a Delegation:**

1. Navigate to Workflow Management → Delegations
2. Click "Create Delegation"
3. Select delegate (person receiving authority)
4. Configure:
   - Start Date
   - End Date (or leave empty for permanent)
   - Scope (All or specific types)
5. Click "Create"

**Viewing Active Delegations:**

1. Open Delegations page
2. View "My Delegations" tab for delegations you created
3. View "Delegated to Me" tab for authority received
4. Active delegations show green status

**Revoking a Delegation:**

1. Find the delegation in the list
2. Click "Revoke"
3. Confirm the action
4. Delegation becomes inactive immediately

### 13.4 Test Cases

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| DEL-001 | Create Delegation | Select delegate, set dates | Delegation created |
| DEL-002 | Temporary Delegation | Set end date | Delegation expires automatically |
| DEL-003 | Revoke Delegation | Click Revoke | Delegation deactivated |
| DEL-004 | Delegation Routing | Submit request | Delegate receives task |
| DEL-005 | Expired Delegation | Wait past end date | Original approver receives task |
| DEL-006 | Self Delegation | Try to delegate to self | Error: Cannot delegate to self |

---

## Appendix: Test Cases

### Complete Test Case Summary

This appendix provides a consolidated list of all test cases organized by module for quality assurance and regression testing purposes.

### Test Execution Guidelines

Before executing test cases, ensure the following prerequisites are met:

1. Test environment is properly configured
2. Test user accounts are created with appropriate roles
3. Test data is seeded in the database
4. All dependent services are running

### Test Case Categories

| Category | Count | Priority |
|----------|-------|----------|
| Authentication | 7 | Critical |
| Dashboard | 6 | High |
| Facility Management | 10 | High |
| Access Requests | 10 | Critical |
| Approvals | 10 | Critical |
| User Management | 10 | High |
| Group Management | 10 | Medium |
| Security Operations | 10 | High |
| Settings | 10 | Medium |
| Workflow Builder | 15 | Critical |
| Shift Management | 6 | Medium |
| Delegation Management | 6 | Medium |
| **Total** | **110** | |

### Regression Test Suite

For each release, execute the following critical path tests:

1. AUTH-001: Valid Login
2. REQ-001: Create Request
3. APR-002: Approve Request
4. WFL-001: Create Workflow
5. WFL-004: Add Condition
6. SEC-001: View Alerts

### Performance Benchmarks

| Operation | Expected Time | Threshold |
|-----------|---------------|-----------|
| Login | < 2 seconds | 3 seconds |
| Dashboard Load | < 3 seconds | 5 seconds |
| Request Submission | < 2 seconds | 3 seconds |
| Approval Action | < 1 second | 2 seconds |
| Search Results | < 1 second | 2 seconds |

---

## Document Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Jan 27, 2026 | Manus AI | Initial release |

---

*This document is confidential and intended for authorized CENTRE3 system users only.*
