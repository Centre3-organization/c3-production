# CENTRE3 Access Request System Analysis

## Complete Field Documentation & Amendment Recommendations

**Document Version:** 1.0  
**Date:** January 26, 2026  
**Author:** Manus AI  
**Purpose:** Comprehensive analysis of current request fields, workflow flows, and recommendations for system amendments

---

## Executive Summary

This document provides a complete analysis of the CENTRE3 Access Request Management System, including all current form fields, database schema structures, workflow processes for each request type, and recommendations for potential amendments. The system currently supports six request types with a dynamic approval workflow engine that replaced the legacy L1/L2 hardcoded process.

---

## 1. Request Types Overview

The CENTRE3 system supports the following access request types, each designed for specific facility access scenarios:

| Request Type | Code | Description | Primary Use Case |
|--------------|------|-------------|------------------|
| **Admin Visit** | `admin_visit` | Standard administrative visits | General business meetings, tours, audits |
| **Temporary Entry Permit (TEP)** | `tep` | Zone-level temporary access | Short-term contractor access to specific zones |
| **Work Permit (WP)** | `work_permit` | Physical work authorization | Electrical, mechanical, civil, IT infrastructure work |
| **Method of Procedure (MOP)** | `mop` | Controlled change execution | CAB-approved changes with step-by-step procedures |
| **Material Entry Permit (MVP)** | `material_entry` | Equipment/material ingress | Bringing laptops, tools, materials into facility |
| **Escort Request** | `escort` | Accompanied access | Visitors requiring continuous escort |

---

## 2. Current Field Structure by Section

### 2.1 Basic Information Section

This section captures requestor details and the fundamental purpose of the visit.

| Field Name | Database Column | Data Type | Required | Current Implementation |
|------------|-----------------|-----------|----------|------------------------|
| Requestor Full Name | `requestorId` → `users.name` | Reference | Yes | Auto-populated from logged-in user |
| Requestor Company | - | Static | Yes | Hardcoded as "Centre3" |
| Email Address | `requestorId` → `users.email` | Reference | Yes | Auto-populated from logged-in user |
| Mobile Number | - | String | No | Form field only, not stored in database |
| Department | - | Reference | Yes | Dropdown from `departments` table |
| Request Sub-Type | - | Enum | No | Options: Contractor, Vendor/Supplier, Customer, Government/Regulatory |
| Purpose of Visit | `purpose` | Text | Yes | Free-text description |
| Additional Notes | - | Text | No | Form field only, not stored in database |

**Gap Identified:** Mobile number and additional notes are captured in the form but not persisted to the database.

### 2.2 Location Section

The location section uses a hierarchical structure: Site → Zone → Area.

| Field Name | Database Column | Data Type | Required | Current Implementation |
|------------|-----------------|-----------|----------|------------------------|
| Site | `siteId` | Integer (FK) | Yes | Dropdown from `sites` table |
| Country | Auto-populated | Display | - | Derived from selected site |
| Region | Auto-populated | Display | - | Derived from selected site |
| City | Auto-populated | Display | - | Derived from selected site |
| Zone | `requestZones.zoneId` | Integer (FK) | No | Optional, enables zone-level access |
| Area | - | Integer (FK) | No | Optional, enables area-level access |
| Rack Reference | - | String | No | For WP/MOP only, not stored in database |

**Gap Identified:** Area selection and rack reference are captured in the form but not persisted to the database.

### 2.3 Schedule Section

| Field Name | Database Column | Data Type | Required | Current Implementation |
|------------|-----------------|-----------|----------|------------------------|
| Start Date | `startDate` | String (YYYY-MM-DD) | Yes | Date picker |
| Start Time | `startTime` | String (HH:MM) | No | Time picker |
| End Date | `endDate` | String (YYYY-MM-DD) | Yes | Date picker |
| End Time | `endTime` | String (HH:MM) | No | Time picker |
| After-Hours Access | - | Boolean | No | Checkbox, not stored in database |
| Weekend Access | - | Boolean | No | Checkbox, not stored in database |
| Recurring | - | Boolean | No | TEP only, not stored in database |

**Gap Identified:** After-hours, weekend, and recurring flags are captured but not persisted.

### 2.4 Visitor Information Section

Visitors are stored in the main `requests` table with single-visitor fields:

| Field Name | Database Column | Data Type | Required | Current Implementation |
|------------|-----------------|-----------|----------|------------------------|
| Visitor Name | `visitorName` | String (100) | Yes | From Yakeen or manual entry |
| ID Type | `visitorIdType` | Enum | Yes | National ID, Iqama, Passport |
| ID Number | `visitorIdNumber` | String (50) | Yes | Validated format per ID type |
| Company | `visitorCompany` | String (100) | No | Visitor's employer |
| Phone | `visitorPhone` | String (20) | No | Contact number |
| Email | `visitorEmail` | String (320) | No | Email address |
| Nationality | - | String | No | Captured in form, not stored |
| Verification Status | - | Boolean | No | Yakeen verified vs manual, not stored |

**Critical Gap:** The current schema only supports a single visitor per request, but the UI allows adding multiple visitors. Additional visitors beyond the first are not persisted to the database.

### 2.5 Type-Specific Fields

#### Admin Visit
No additional fields required beyond the standard sections.

#### Temporary Entry Permit (TEP)

| Field Name | Database Column | Data Type | Required | Current Implementation |
|------------|-----------------|-----------|----------|------------------------|
| Work Order Reference | - | String | No | Form field only, not stored |
| Escort Required | - | Enum | No | Yes/No, form field only |

#### Work Permit (WP)

| Field Name | Database Column | Data Type | Required | Current Implementation |
|------------|-----------------|-----------|----------|------------------------|
| Work Type | - | Enum | No | Electrical, Mechanical, Civil, IT |
| Risk Level | - | Enum | No | Low, Medium, High |

#### Method of Procedure (MOP)

| Field Name | Database Column | Data Type | Required | Current Implementation |
|------------|-----------------|-----------|----------|------------------------|
| Change Ticket | - | String | No | CHG-XXXX format |
| Impact Level | - | Enum | No | None, Minor, Major, Critical |

#### Material Entry Permit (MVP)

| Field Name | Database Column | Data Type | Required | Current Implementation |
|------------|-----------------|-----------|----------|------------------------|
| Materials List | `requestAssets` | Table | No | Separate table for materials |

The `requestAssets` table structure:

| Column | Data Type | Description |
|--------|-----------|-------------|
| `assetType` | Enum | laptop, camera, tool, material, other |
| `description` | String (200) | Item description |
| `serialNumber` | String (100) | Serial/asset number |
| `quantity` | Integer | Number of items |

### 2.6 Attachments Section

| Field Name | Database Column | Data Type | Required | Current Implementation |
|------------|-----------------|-----------|----------|------------------------|
| Visitor ID Copies | - | File | No | UI placeholder, not implemented |
| Method Statement | - | File | No | WP/MOP only, not implemented |
| Risk Assessment | - | File | No | WP/MOP only, not implemented |

**Gap Identified:** File attachment functionality is shown in the UI but not implemented in the backend.

---

## 3. Complete Workflow Flow by Request Type

### 3.1 Standard Approval Flow (All Request Types)

The CENTRE3 system uses a dynamic workflow engine that routes requests through configurable approval stages. The standard flow is:

```
┌──────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  DRAFT       │───▶│  PENDING_L1      │───▶│  PENDING_MANUAL │
│  (Created)   │    │  (L1 Review)     │    │  (L2 Review)    │
└──────────────┘    └──────────────────┘    └─────────────────┘
                           │                        │
                           ▼                        ▼
                    ┌──────────────┐         ┌──────────────┐
                    │  REJECTED    │         │  APPROVED    │
                    └──────────────┘         └──────────────┘
```

### 3.2 Request Status Values

| Status | Code | Description | Next Actions |
|--------|------|-------------|--------------|
| Draft | `draft` | Request created but not submitted | Submit, Edit, Delete |
| Pending L1 | `pending_l1` | Awaiting L1 approver review | L1 Approve/Reject |
| Pending Manual | `pending_manual` | Awaiting L2/Security review | L2 Approve/Reject |
| Pending Approval | `pending_approval` | Generic pending state | Approve/Reject |
| Approved | `approved` | Fully approved, access granted | Check-in, Print Badge |
| Rejected | `rejected` | Denied at any stage | View reason, Resubmit |
| Cancelled | `cancelled` | Withdrawn by requestor | None |
| Expired | `expired` | Past end date without use | None |

### 3.3 Admin Visit Workflow

**Standard 2-Stage Approval:**

1. **Stage 1 - L1 Approval (Initial Review)**
   - Approvers: Users with L1 Approver role
   - SLA: 24 hours
   - Actions: Approve (→ Stage 2), Reject (→ End)

2. **Stage 2 - L2 Approval (Security Verification)**
   - Approvers: Security Manager role
   - SLA: 48 hours
   - Actions: Approve (→ Complete), Reject (→ End)

### 3.4 TEP Workflow

**Zone-Level Access Approval:**

1. **Stage 1 - L1 Approval**
   - Standard initial review
   - Validates zone access requirements

2. **Stage 2 - Zone Owner Approval** (if critical zone)
   - Approvers: Zone owner or security manager
   - Additional verification for high-security zones

### 3.5 Work Permit (WP) Workflow

**Safety-Enhanced Approval:**

1. **Stage 1 - L1 Approval**
   - Initial review of work scope

2. **Stage 2 - Safety Review**
   - Risk assessment verification
   - Method statement review

3. **Stage 3 - Site Manager Approval** (for high-risk work)
   - Final authorization for physical work

### 3.6 MOP Workflow

**Change Management Integration:**

1. **Stage 1 - L1 Approval**
   - Initial review

2. **Stage 2 - CAB Verification**
   - Change ticket validation
   - Impact assessment review

3. **Stage 3 - Security/Operations Approval**
   - Final sign-off

### 3.7 Material Entry Permit (MVP) Workflow

**Asset Tracking Approval:**

1. **Stage 1 - L1 Approval**
   - Material list review

2. **Stage 2 - Security Screening**
   - Asset verification
   - Serial number logging

### 3.8 Escort Request Workflow

**Accompanied Access Approval:**

1. **Stage 1 - L1 Approval**
   - Escort requirement validation

2. **Stage 2 - Escort Assignment**
   - Escort personnel confirmation

---

## 4. Database Schema Summary

### 4.1 Core Request Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `requests` | Main request data | id, requestNumber, type, status, requestorId, siteId, startDate, endDate |
| `requestZones` | Zone access mapping | requestId, zoneId |
| `requestAssets` | Material/equipment list | requestId, assetType, description, serialNumber, quantity |

### 4.2 Approval Workflow Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `approvalWorkflows` | Workflow definitions | id, name, processType, priority, isDefault |
| `approvalStages` | Stage configurations | workflowId, name, stageOrder, approvalMode, slaHours |
| `stageApprovers` | Approver assignments | stageId, approverType, approverValue |
| `approvalInstances` | Active workflow instances | requestId, workflowId, currentStageId, status |
| `approvalTasks` | Individual approval tasks | instanceId, stageId, assignedUserId, status |
| `approvalHistory` | Audit trail | instanceId, action, userId, comments, timestamp |

### 4.3 Supporting Tables

| Table | Purpose |
|-------|---------|
| `approvalRoles` | Approval role definitions |
| `userApprovalRoles` | User-to-role assignments |
| `shiftSchedules` | Shift schedule definitions |
| `shiftAssignments` | User shift assignments |
| `approvalDelegations` | Temporary delegation records |
| `escalationRules` | Escalation configurations |

---

## 5. Identified Gaps & Amendment Recommendations

### 5.1 Critical Gaps (High Priority)

#### Gap 1: Multiple Visitors Not Persisted

**Current State:** The UI allows adding multiple visitors, but only the first visitor's data is stored in the `requests` table.

**Recommendation:** Create a `requestVisitors` table:

```sql
CREATE TABLE requestVisitors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  requestId INT NOT NULL,
  visitorName VARCHAR(100) NOT NULL,
  visitorIdType ENUM('national_id', 'iqama', 'passport') NOT NULL,
  visitorIdNumber VARCHAR(50) NOT NULL,
  visitorNationality VARCHAR(100),
  visitorCompany VARCHAR(100),
  visitorPhone VARCHAR(20),
  visitorEmail VARCHAR(320),
  isVerified BOOLEAN DEFAULT FALSE,
  verificationMethod ENUM('yakeen', 'manual'),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (requestId) REFERENCES requests(id)
);
```

#### Gap 2: Type-Specific Fields Not Stored

**Current State:** TEP, WP, and MOP have type-specific fields in the UI that are not persisted.

**Recommendation:** Create a `requestTypeDetails` table:

```sql
CREATE TABLE requestTypeDetails (
  id INT AUTO_INCREMENT PRIMARY KEY,
  requestId INT NOT NULL UNIQUE,
  -- TEP fields
  workOrderReference VARCHAR(50),
  escortRequired ENUM('yes', 'no'),
  -- WP fields
  workType ENUM('electrical', 'mechanical', 'civil', 'it'),
  riskLevel ENUM('low', 'medium', 'high'),
  -- MOP fields
  changeTicket VARCHAR(50),
  impactLevel ENUM('none', 'minor', 'major', 'critical'),
  -- Common
  additionalData JSON,
  FOREIGN KEY (requestId) REFERENCES requests(id)
);
```

#### Gap 3: Schedule Flags Not Stored

**Current State:** After-hours, weekend, and recurring flags are captured but not persisted.

**Recommendation:** Add columns to the `requests` table:

```sql
ALTER TABLE requests ADD COLUMN afterHoursAccess BOOLEAN DEFAULT FALSE;
ALTER TABLE requests ADD COLUMN weekendAccess BOOLEAN DEFAULT FALSE;
ALTER TABLE requests ADD COLUMN isRecurring BOOLEAN DEFAULT FALSE;
ALTER TABLE requests ADD COLUMN recurringPattern JSON; -- For recurring schedule details
```

### 5.2 Medium Priority Gaps

#### Gap 4: Area-Level Access Not Stored

**Current State:** Area selection is available but not persisted.

**Recommendation:** Create a `requestAreas` table similar to `requestZones`:

```sql
CREATE TABLE requestAreas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  requestId INT NOT NULL,
  areaId INT NOT NULL,
  rackReference VARCHAR(50),
  FOREIGN KEY (requestId) REFERENCES requests(id),
  FOREIGN KEY (areaId) REFERENCES areas(id)
);
```

#### Gap 5: File Attachments Not Implemented

**Current State:** Attachment UI exists but backend storage is not implemented.

**Recommendation:** Create a `requestAttachments` table:

```sql
CREATE TABLE requestAttachments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  requestId INT NOT NULL,
  attachmentType ENUM('visitor_id', 'method_statement', 'risk_assessment', 'other'),
  fileName VARCHAR(255) NOT NULL,
  fileUrl VARCHAR(500) NOT NULL,
  fileSize INT,
  mimeType VARCHAR(100),
  uploadedBy INT,
  uploadedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (requestId) REFERENCES requests(id)
);
```

#### Gap 6: Requestor Contact Information

**Current State:** Mobile number and additional notes are form-only fields.

**Recommendation:** Add to `requests` table:

```sql
ALTER TABLE requests ADD COLUMN requestorMobile VARCHAR(20);
ALTER TABLE requests ADD COLUMN additionalNotes TEXT;
ALTER TABLE requests ADD COLUMN subType ENUM('contractor', 'vendor', 'customer', 'government');
```

### 5.3 Enhancement Recommendations

#### Enhancement 1: Host/Sponsor Tracking

**Current State:** `hostId` column exists but is not utilized in the UI.

**Recommendation:** Add host selection to the form and make it mandatory for certain request types.

#### Enhancement 2: Visitor Pre-Registration

**Recommendation:** Allow visitors to be pre-registered in the system for faster request creation:

```sql
CREATE TABLE preRegisteredVisitors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  visitorName VARCHAR(100) NOT NULL,
  visitorIdType ENUM('national_id', 'iqama', 'passport') NOT NULL,
  visitorIdNumber VARCHAR(50) NOT NULL,
  visitorNationality VARCHAR(100),
  visitorCompany VARCHAR(100),
  visitorPhone VARCHAR(20),
  visitorEmail VARCHAR(320),
  isVerified BOOLEAN DEFAULT FALSE,
  verificationDate TIMESTAMP,
  createdBy INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expiresAt TIMESTAMP,
  UNIQUE KEY (visitorIdType, visitorIdNumber)
);
```

#### Enhancement 3: Request Templates

**Recommendation:** Allow saving request configurations as templates for frequent visitors or recurring work:

```sql
CREATE TABLE requestTemplates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  createdBy INT NOT NULL,
  requestType ENUM('admin_visit', 'work_permit', 'material_entry', 'tep', 'mop', 'escort'),
  templateData JSON NOT NULL,
  isShared BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 6. Field Comparison Matrix

The following matrix shows which fields are captured in the UI versus stored in the database:

| Field | UI Captured | DB Stored | Gap Status |
|-------|-------------|-----------|------------|
| Request Type | ✅ | ✅ | OK |
| Requestor Name | ✅ | ✅ (via FK) | OK |
| Requestor Email | ✅ | ✅ (via FK) | OK |
| Requestor Mobile | ✅ | ❌ | **GAP** |
| Department | ✅ | ❌ | **GAP** |
| Sub-Type | ✅ | ❌ | **GAP** |
| Purpose | ✅ | ✅ | OK |
| Additional Notes | ✅ | ❌ | **GAP** |
| Site | ✅ | ✅ | OK |
| Zone | ✅ | ✅ | OK |
| Area | ✅ | ❌ | **GAP** |
| Rack Reference | ✅ | ❌ | **GAP** |
| Start Date | ✅ | ✅ | OK |
| End Date | ✅ | ✅ | OK |
| Start Time | ✅ | ✅ | OK |
| End Time | ✅ | ✅ | OK |
| After-Hours | ✅ | ❌ | **GAP** |
| Weekend Access | ✅ | ❌ | **GAP** |
| Recurring | ✅ | ❌ | **GAP** |
| Primary Visitor | ✅ | ✅ | OK |
| Additional Visitors | ✅ | ❌ | **CRITICAL GAP** |
| Visitor Nationality | ✅ | ❌ | **GAP** |
| Verification Status | ✅ | ❌ | **GAP** |
| Work Order Ref (TEP) | ✅ | ❌ | **GAP** |
| Escort Required (TEP) | ✅ | ❌ | **GAP** |
| Work Type (WP) | ✅ | ❌ | **GAP** |
| Risk Level (WP) | ✅ | ❌ | **GAP** |
| Change Ticket (MOP) | ✅ | ❌ | **GAP** |
| Impact Level (MOP) | ✅ | ❌ | **GAP** |
| Materials List (MVP) | ✅ | ✅ | OK |
| File Attachments | ✅ | ❌ | **GAP** |

---

## 7. Recommended Amendment Priority

Based on the analysis, the following amendment priorities are recommended:

### Priority 1 - Critical (Implement Immediately)

1. **Multiple Visitors Storage** - Create `requestVisitors` table
2. **Type-Specific Fields** - Create `requestTypeDetails` table

### Priority 2 - High (Implement Soon)

3. **Schedule Flags** - Add after-hours, weekend, recurring columns
4. **Area-Level Access** - Create `requestAreas` table
5. **Requestor Contact** - Add mobile and notes columns

### Priority 3 - Medium (Plan for Future)

6. **File Attachments** - Implement S3 storage integration
7. **Visitor Pre-Registration** - Create pre-registration system
8. **Request Templates** - Enable template functionality

### Priority 4 - Enhancement (Nice to Have)

9. **Host/Sponsor Tracking** - Activate existing hostId field
10. **Visitor Verification History** - Track Yakeen verification attempts

---

## 8. Conclusion

The CENTRE3 Access Request System has a solid foundation with a dynamic workflow engine and comprehensive UI. However, there are significant gaps between what the UI captures and what is persisted to the database. The most critical issue is the inability to store multiple visitors per request, followed by the lack of persistence for type-specific fields.

Implementing the recommended amendments will ensure data integrity, enable proper reporting, and support future enhancements such as visitor analytics and compliance auditing.

---

**Document End**

*For questions or clarifications regarding this analysis, please contact the system administrator.*
