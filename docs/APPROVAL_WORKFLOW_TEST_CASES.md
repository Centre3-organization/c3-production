# Approval Workflow Test Cases

## Overview

This document defines 20 comprehensive test cases for the Centre3 approval workflow system. Each test case covers a specific scenario for Admin Visit, Visitor, and other request types with various approval chains.

## Test Users

### Centre3 Internal Users (Password: Test@123)

| Email | Name | Role | Description |
|-------|------|------|-------------|
| securityofficer@centre3.com | Ahmed Al-Security | Security Officer | General security officer for all sites |
| sitemanager@centre3.com | Mohammed Al-Site | Site Manager | General site manager |
| securitymanager@centre3.com | Khalid Al-Manager | Security Manager | Final approver for security matters |
| riyadhsecurityofficer@centre3.com | Faisal Al-Riyadh | Security Officer | Riyadh-specific security officer |
| jaborofficer@centre3.com | Omar Al-Jabor | Security Officer | Jabor site security officer |
| facilitymanager@centre3.com | Sultan Al-Facility | Facility Manager | Manages facility operations |
| accesscontroller@centre3.com | Nasser Al-Access | Access Controller | Controls physical access |
| shiftlead@centre3.com | Turki Al-Shift | Shift Lead | Leads security shifts |
| dutymanager@centre3.com | Saad Al-Duty | Duty Manager | On-duty manager |
| operationsmanager@centre3.com | Abdulaziz Al-Operations | Operations Manager | Operations oversight |

### Amazon Users (Password: Test@123)

| Email | Name | Role |
|-------|------|------|
| user1@aws.com | John Smith | Cloud Engineer |
| user2@aws.com | Sarah Johnson | Solutions Architect |
| manager@aws.com | Michael Brown | Technical Account Manager |
| engineer@aws.com | Emily Davis | DevOps Engineer |
| admin@aws.com | David Wilson | AWS Administrator |

### Google Cloud Users (Password: Test@123)

| Email | Name | Role |
|-------|------|------|
| user1@google.com | James Anderson | Cloud Architect |
| user2@google.com | Jennifer Taylor | Site Reliability Engineer |
| manager@google.com | Robert Martinez | Customer Engineer Manager |
| engineer@google.com | Lisa Garcia | Platform Engineer |
| admin@google.com | William Lee | GCP Administrator |

---

## Test Cases

### Case 1: Basic Admin Visit - Standard Approval Chain

**Scenario:** Internal user requests an Admin Visit with standard 3-level approval.

**Request Details:**
- Request Type: Admin Visit
- Requester: Any internal user
- Site: Any site

**Approval Flow:**
1. Security Officer (securityofficer@centre3.com) → Approves
2. Site Manager (sitemanager@centre3.com) → Approves
3. Security Manager (securitymanager@centre3.com) → Final Approval

**Expected Result:** Request approved after all 3 levels approve.

**Admin/Super-Admin Override:** Administrators can intervene at any step to approve or reject.

---

### Case 2: Riyadh Site Admin Visit - Site-Specific Approval

**Scenario:** Admin Visit request specifically for Riyadh site with dedicated approvers.

**Request Details:**
- Request Type: Admin Visit
- Requester: Any user
- Site: RDC46 (Riyadh Data Centre)

**Approval Flow:**
1. Riyadh Security Officer (riyadhsecurityofficer@centre3.com) → Approves
2. Security Manager (securitymanager@centre3.com) → Final Approval

**Expected Result:** Request approved after Riyadh-specific officer and security manager approve.

**Admin/Super-Admin Override:** Administrators can intervene at any step.

---

### Case 3: External Company Request - Amazon

**Scenario:** Amazon employee requests access, requiring company manager approval first.

**Request Details:**
- Request Type: Admin Visit
- Requester: user1@aws.com (John Smith)
- Site: Any site

**Approval Flow:**
1. Amazon Manager (manager@aws.com) → Company-level approval
2. Site Manager (sitemanager@centre3.com) → Centre3 site approval
3. Security Manager (securitymanager@centre3.com) → Final Approval

**Expected Result:** Request approved after Amazon manager and Centre3 approvers sign off.

**Admin/Super-Admin Override:** Administrators can intervene at any step.

---

### Case 4: External Company Request - Google Cloud

**Scenario:** Google Cloud employee requests access, requiring company manager approval first.

**Request Details:**
- Request Type: Admin Visit
- Requester: user1@google.com (James Anderson)
- Site: Any site

**Approval Flow:**
1. Google Manager (manager@google.com) → Company-level approval
2. Site Manager (sitemanager@centre3.com) → Centre3 site approval
3. Security Manager (securitymanager@centre3.com) → Final Approval

**Expected Result:** Request approved after Google manager and Centre3 approvers sign off.

**Admin/Super-Admin Override:** Administrators can intervene at any step.

---

### Case 5: Visitor Registration - Basic Flow

**Scenario:** Internal employee registers a visitor for a meeting.

**Request Details:**
- Request Type: Visitor
- Requester: Any internal user
- Visitor: External person (not in system)
- Site: Any site

**Approval Flow:**
1. Security Officer (securityofficer@centre3.com) → Verifies visitor details
2. Site Manager (sitemanager@centre3.com) → Approves visit

**Expected Result:** Visitor registration approved, access pass generated.

**Admin/Super-Admin Override:** Administrators can intervene at any step.

---

### Case 6: VIP Visitor - Expedited Approval

**Scenario:** VIP visitor requires expedited approval with senior management.

**Request Details:**
- Request Type: Admin Visit (VIP)
- Requester: Any internal user
- VIP Flag: Yes
- Site: Any site

**Approval Flow:**
1. Security Manager (securitymanager@centre3.com) → Direct senior approval
2. Operations Manager (operationsmanager@centre3.com) → Final Approval

**Expected Result:** VIP request fast-tracked through senior approvers.

**Admin/Super-Admin Override:** Administrators can intervene at any step.

---

### Case 7: Multi-Site Visit Request

**Scenario:** Visitor needs access to multiple sites in a single request.

**Request Details:**
- Request Type: Admin Visit
- Requester: manager@aws.com
- Sites: RDC46, RDC05, ITCC

**Approval Flow:**
1. Amazon Manager (manager@aws.com) → Self-approval as manager
2. Site Manager (sitemanager@centre3.com) → Approves for all sites
3. Security Manager (securitymanager@centre3.com) → Final Approval

**Expected Result:** Multi-site access granted after full approval chain.

**Admin/Super-Admin Override:** Administrators can intervene at any step.

---

### Case 8: Contractor Access Request

**Scenario:** Contractor needs access for maintenance work.

**Request Details:**
- Request Type: Work Permit
- Requester: External contractor
- Site: RDC301

**Approval Flow:**
1. Facility Manager (facilitymanager@centre3.com) → Verifies work scope
2. Security Officer (securityofficer@centre3.com) → Security clearance
3. Site Manager (sitemanager@centre3.com) → Final Approval

**Expected Result:** Contractor access approved with work permit.

**Admin/Super-Admin Override:** Administrators can intervene at any step.

---

### Case 9: Emergency Access Request

**Scenario:** Emergency access needed outside normal hours.

**Request Details:**
- Request Type: Admin Visit (Emergency)
- Requester: engineer@aws.com
- Site: ITCC
- Time: After hours

**Approval Flow:**
1. Duty Manager (dutymanager@centre3.com) → On-call approval
2. Security Manager (securitymanager@centre3.com) → Emergency authorization

**Expected Result:** Emergency access granted with expedited approval.

**Admin/Super-Admin Override:** Administrators can intervene at any step.

---

### Case 10: Shift-Based Approval

**Scenario:** Request routed based on current shift personnel.

**Request Details:**
- Request Type: Admin Visit
- Requester: user2@google.com
- Site: RDC46
- Time: During shift hours

**Approval Flow:**
1. Shift Lead (shiftlead@centre3.com) → Current shift approval
2. Security Officer (securityofficer@centre3.com) → Security verification
3. Site Manager (sitemanager@centre3.com) → Final Approval

**Expected Result:** Request approved by on-shift personnel.

**Admin/Super-Admin Override:** Administrators can intervene at any step.

---

### Case 11: Jabor Site Specific Request

**Scenario:** Request for Jabor site with dedicated officer.

**Request Details:**
- Request Type: Admin Visit
- Requester: admin@aws.com
- Site: JDC04 (Jabor Data Centre)

**Approval Flow:**
1. Jabor Officer (jaborofficer@centre3.com) → Site-specific approval
2. Site Manager (sitemanager@centre3.com) → Management approval
3. Security Manager (securitymanager@centre3.com) → Final Approval

**Expected Result:** Request approved through Jabor-specific chain.

**Admin/Super-Admin Override:** Administrators can intervene at any step.

---

### Case 12: Access Controller Verification

**Scenario:** Request requiring physical access control verification.

**Request Details:**
- Request Type: Admin Visit
- Requester: engineer@google.com
- Site: RDC05
- Access Type: Restricted Zone

**Approval Flow:**
1. Security Officer (securityofficer@centre3.com) → Initial approval
2. Access Controller (accesscontroller@centre3.com) → Physical access verification
3. Security Manager (securitymanager@centre3.com) → Final Approval

**Expected Result:** Access granted with physical verification complete.

**Admin/Super-Admin Override:** Administrators can intervene at any step.

---

### Case 13: Facility Manager Approval Chain

**Scenario:** Request involving facility operations.

**Request Details:**
- Request Type: Admin Visit
- Requester: user2@aws.com
- Site: DDC21
- Purpose: Facility inspection

**Approval Flow:**
1. Facility Manager (facilitymanager@centre3.com) → Facility approval
2. Site Manager (sitemanager@centre3.com) → Site approval
3. Operations Manager (operationsmanager@centre3.com) → Final Approval

**Expected Result:** Facility inspection access approved.

**Admin/Super-Admin Override:** Administrators can intervene at any step.

---

### Case 14: Cross-Company Collaboration

**Scenario:** Amazon and Google employees visiting together.

**Request Details:**
- Request Type: Admin Visit (Group)
- Requester: manager@aws.com
- Visitors: user1@google.com, engineer@google.com
- Site: ITCC

**Approval Flow:**
1. Amazon Manager (manager@aws.com) → Requester company approval
2. Google Manager (manager@google.com) → Visitor company approval
3. Site Manager (sitemanager@centre3.com) → Centre3 approval
4. Security Manager (securitymanager@centre3.com) → Final Approval

**Expected Result:** Cross-company visit approved.

**Admin/Super-Admin Override:** Administrators can intervene at any step.

---

### Case 15: Weekend Access Request

**Scenario:** Access needed during weekend hours.

**Request Details:**
- Request Type: Admin Visit
- Requester: admin@google.com
- Site: RDC102
- Time: Saturday

**Approval Flow:**
1. Duty Manager (dutymanager@centre3.com) → Weekend duty approval
2. Security Manager (securitymanager@centre3.com) → Final Approval

**Expected Result:** Weekend access approved.

**Admin/Super-Admin Override:** Administrators can intervene at any step.

---

### Case 16: Rejection with Clarification Request

**Scenario:** Request rejected and sent back for clarification.

**Request Details:**
- Request Type: Admin Visit
- Requester: user1@aws.com
- Site: RDC103

**Approval Flow:**
1. Security Officer (securityofficer@centre3.com) → Requests clarification
2. Requester provides additional information
3. Security Officer (securityofficer@centre3.com) → Approves after clarification
4. Site Manager (sitemanager@centre3.com) → Final Approval

**Expected Result:** Request approved after clarification provided.

**Admin/Super-Admin Override:** Administrators can intervene at any step.

---

### Case 17: Escalation Due to SLA Breach

**Scenario:** Request escalated due to no response within SLA.

**Request Details:**
- Request Type: Admin Visit
- Requester: user2@aws.com
- Site: RDC104
- SLA: 4 hours

**Approval Flow:**
1. Security Officer (securityofficer@centre3.com) → No response (SLA breach)
2. Auto-escalate to Site Manager (sitemanager@centre3.com)
3. Security Manager (securitymanager@centre3.com) → Final Approval

**Expected Result:** Request escalated and approved after SLA breach.

**Admin/Super-Admin Override:** Administrators can intervene at any step.

---

### Case 18: Delegation Scenario

**Scenario:** Approver delegates authority during absence.

**Request Details:**
- Request Type: Admin Visit
- Requester: engineer@aws.com
- Site: DDC352
- Delegation: Security Officer delegates to Shift Lead

**Approval Flow:**
1. Shift Lead (shiftlead@centre3.com) → Acting as delegated Security Officer
2. Site Manager (sitemanager@centre3.com) → Approves
3. Security Manager (securitymanager@centre3.com) → Final Approval

**Expected Result:** Request approved through delegation.

**Admin/Super-Admin Override:** Administrators can intervene at any step.

---

### Case 19: Bulk Visitor Registration

**Scenario:** Multiple visitors registered in a single request.

**Request Details:**
- Request Type: Visitor (Bulk)
- Requester: manager@google.com
- Visitors: 5 Google employees
- Site: QDC26

**Approval Flow:**
1. Google Manager (manager@google.com) → Bulk approval for company
2. Security Officer (securityofficer@centre3.com) → Verifies all visitors
3. Site Manager (sitemanager@centre3.com) → Final Approval

**Expected Result:** All 5 visitors approved in single request.

**Admin/Super-Admin Override:** Administrators can intervene at any step.

---

### Case 20: Admin Override Scenario

**Scenario:** Administrator intervenes to expedite approval.

**Request Details:**
- Request Type: Admin Visit (Urgent)
- Requester: admin@aws.com
- Site: MDC20
- Priority: High

**Approval Flow:**
1. Security Officer (securityofficer@centre3.com) → Pending
2. **Administrator/Super-Admin intervenes** → Approves directly

**Expected Result:** Request approved via admin override, bypassing normal chain.

**Admin/Super-Admin Override:** This case specifically tests admin intervention capability.

---

## Workflow Configuration Summary

### Required Workflows to Create

1. **Standard Admin Visit Workflow** (Cases 1, 5)
   - Condition: process_type = admin_visit
   - Stages: Security Officer → Site Manager → Security Manager

2. **Riyadh Site Workflow** (Case 2)
   - Condition: site_id = RDC46
   - Stages: Riyadh Security Officer → Security Manager

3. **External Company Workflow** (Cases 3, 4)
   - Condition: requester_type = client
   - Stages: External Manager → Site Manager → Security Manager

4. **VIP Workflow** (Case 6)
   - Condition: vip_visit = true
   - Stages: Security Manager → Operations Manager

5. **Emergency Workflow** (Case 9)
   - Condition: working_hours = false
   - Stages: Duty Manager → Security Manager

6. **Jabor Site Workflow** (Case 11)
   - Condition: site_id = JDC04
   - Stages: Jabor Officer → Site Manager → Security Manager

7. **Facility Inspection Workflow** (Case 13)
   - Condition: category = facility_inspection
   - Stages: Facility Manager → Site Manager → Operations Manager

8. **Weekend Workflow** (Case 15)
   - Condition: day_of_week IN [5, 6] (Friday, Saturday)
   - Stages: Duty Manager → Security Manager

---

## Testing Checklist

For each test case, verify:

- [ ] Request can be created by the specified requester
- [ ] Request routes to correct first approver
- [ ] Each approver can approve/reject/request clarification
- [ ] Request advances to next stage after approval
- [ ] Final approval grants access
- [ ] Admin/Super-Admin can intervene at any stage
- [ ] Rejection stops the workflow with mandatory comments
- [ ] Clarification request sends back to appropriate party
- [ ] SLA tracking works correctly
- [ ] Notifications are sent to approvers
- [ ] Audit trail is maintained

---

## Notes

1. **All users have password: Test@123**
2. **Administrators and Super-Admins can approve at any step** - This is a system-wide override capability
3. **Rejection requires mandatory comments** - Per system requirements
4. **Clarification can be sent to last approver or original requestor**
5. **SLA breach triggers automatic escalation**
