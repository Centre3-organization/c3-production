# L3 Approval Workflow Test Cases

This document provides 5 detailed test cases to validate the L3 (Admin) approval stage in the CENTRE3 approval workflow system.

---

## Prerequisites

Before running these test cases, ensure:

1. **Workflow Configuration**: The "Standard Access Request" workflow has 3 stages:
   - L1 - Initial Review (Stage 1)
   - L2 - Security Approval (Stage 2)
   - L3 - Admin (Stage 3)

2. **User Accounts**: You have access to:
   - **Admin User** (mohsiin@gmail.com) - Can approve at all levels
   - Additional test users assigned to specific approval roles (optional)

3. **Test Data**: At least one site and zone configured in the system

---

## Test Case 1: Complete L1 → L2 → L3 Approval Flow

### Objective
Verify that an access request successfully progresses through all three approval stages (L1 → L2 → L3) and reaches "Approved" status.

### Steps

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to **New Request** page | Request form loads |
| 2 | Fill in request details: Visitor Name: "Test Visitor 1", Email: "test1@example.com", Site: (select any), Zone: (select any), Purpose: "Testing L3 workflow", Visit Date: (tomorrow) | Form accepts all inputs |
| 3 | Click **Submit Request** | Request created with status "Pending Approval" or "Pending L1" |
| 4 | Navigate to **L1 Approval** page | Request appears in the L1 queue |
| 5 | Click on the request to view details | Request details modal opens |
| 6 | Click **Approve** button | Request moves to L2 stage |
| 7 | Navigate to **L2 Approval** page | Request appears in the L2 queue |
| 8 | Click on the request and click **Approve** | Request moves to L3 stage |
| 9 | Navigate to **L1 Approval** or **L2 Approval** page (L3 tasks appear in the same queue based on assigned approver) | Request appears with "L3 - Admin" stage indicator |
| 10 | Click on the request and click **Approve** | Request status changes to "Approved" |
| 11 | Navigate to **All Requests** page | Request shows "Approved" status |

### Pass Criteria
- Request successfully moves through L1 → L2 → L3
- Final status is "Approved"
- Approval history shows all three approval actions

---

## Test Case 2: L3 Rejection After L1 and L2 Approval

### Objective
Verify that an L3 approver can reject a request even after L1 and L2 have approved it.

### Steps

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create a new access request (same as Test Case 1, Steps 1-3) | Request created |
| 2 | Approve at L1 stage | Request moves to L2 |
| 3 | Approve at L2 stage | Request moves to L3 |
| 4 | At L3 stage, click **Reject** button | Rejection dialog opens |
| 5 | Enter rejection reason: "Admin review found security concerns" | Reason field accepts input |
| 6 | Click **Confirm Reject** | Request status changes to "Rejected" |
| 7 | Navigate to **All Requests** page | Request shows "Rejected" status |
| 8 | Click on the rejected request to view details | Rejection reason is visible in the history |

### Pass Criteria
- Request can be rejected at L3 stage
- Rejection reason is recorded
- Request status is "Rejected"
- L1 and L2 approvals are still visible in history

---

## Test Case 3: Request Info at L3 Stage

### Objective
Verify that an L3 approver can request additional information before making a decision.

### Steps

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create a new access request | Request created |
| 2 | Approve at L1 and L2 stages | Request reaches L3 |
| 3 | At L3 stage, click **Request Info** button (if available) | Request info dialog opens |
| 4 | Enter question: "Please provide company registration documents" | Question field accepts input |
| 5 | Click **Send Request** | Request status changes to "Info Requested" or similar |
| 6 | Navigate to **All Requests** page | Request shows pending info status |
| 7 | (As requestor) View the request and provide the requested information | Information submitted |
| 8 | (As L3 approver) Review the response and approve | Request approved |

### Pass Criteria
- L3 approver can request additional information
- Request is put on hold until info is provided
- Workflow resumes after info is submitted

**Note**: If "Request Info" is not implemented, this test case should be marked as "Feature Not Available" and documented for future implementation.

---

## Test Case 4: SLA Tracking for L3 Stage

### Objective
Verify that the L3 stage has proper SLA tracking and displays time remaining.

### Steps

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create a new access request | Request created |
| 2 | Approve at L1 stage | Request moves to L2 |
| 3 | Approve at L2 stage | Request moves to L3 |
| 4 | Navigate to the approval queue | L3 task is visible |
| 5 | Check the SLA indicator on the task | Shows "24h SLA" or configured SLA time |
| 6 | Note the time remaining display | Shows countdown or due time |
| 7 | Wait or simulate time passage | SLA indicator updates |
| 8 | If SLA is breached, check for escalation notification | Escalation triggered (if configured) |

### Pass Criteria
- L3 stage displays configured SLA (24h as per workflow)
- Time remaining is visible
- SLA breach triggers appropriate action (if escalation is configured)

---

## Test Case 5: Approval History and Audit Trail

### Objective
Verify that the complete approval history is maintained and accessible for audit purposes.

### Steps

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create and complete a request through L1 → L2 → L3 (approve all) | Request approved |
| 2 | Navigate to **All Requests** page | Request visible |
| 3 | Click on the approved request | Request details open |
| 4 | Look for "Approval History" or "Activity Log" section | History section visible |
| 5 | Verify L1 approval entry | Shows: Stage "L1 - Initial Review", Action "Approved", Approver name, Timestamp |
| 6 | Verify L2 approval entry | Shows: Stage "L2 - Security Approval", Action "Approved", Approver name, Timestamp |
| 7 | Verify L3 approval entry | Shows: Stage "L3 - Admin", Action "Approved", Approver name, Timestamp |
| 8 | Check for any comments added during approvals | Comments visible in history |

### Pass Criteria
- All three approval stages are recorded
- Each entry shows: stage name, action, approver, timestamp
- Comments are preserved
- History is in chronological order

---

## Quick Reference: How to Access Each Stage

| Stage | How to Access | What You'll See |
|-------|---------------|-----------------|
| **L1 Approval** | Sidebar → Approvals → L1 Approval | Requests pending initial review |
| **L2 Approval** | Sidebar → Approvals → L2 Approval | Requests pending security approval |
| **L3 Approval** | Same queue as L1/L2 (tasks assigned to you) | Requests pending admin approval |
| **All Requests** | Sidebar → Requests → All Requests | Complete list with status filters |

---

## Troubleshooting

### Issue: Request doesn't appear in L3 queue

**Possible Causes:**
1. L3 stage approver not configured
2. User not assigned to L3 approval role
3. Request stuck in previous stage

**Solution:**
1. Go to Workflow Builder → Standard Access Request
2. Click on L3 - Admin stage
3. Verify approver is configured (System Role or specific user)
4. Ensure current user has the required approval role

### Issue: Cannot approve at L3

**Possible Causes:**
1. User lacks permission
2. Request not in L3 stage yet

**Solution:**
1. Check request status in All Requests
2. Verify user has admin role or L3 approval role
3. Ensure L1 and L2 are completed first

---

## Test Results Template

| Test Case | Status | Date | Tester | Notes |
|-----------|--------|------|--------|-------|
| TC1: Complete L1→L2→L3 Flow | ☐ Pass / ☐ Fail | | | |
| TC2: L3 Rejection | ☐ Pass / ☐ Fail | | | |
| TC3: Request Info at L3 | ☐ Pass / ☐ Fail / ☐ N/A | | | |
| TC4: SLA Tracking | ☐ Pass / ☐ Fail | | | |
| TC5: Approval History | ☐ Pass / ☐ Fail | | | |

---

## Summary

These 5 test cases cover the essential functionality of the L3 approval stage:

1. **Happy Path** - Complete approval flow through all stages
2. **Rejection** - L3 can reject even after L1/L2 approval
3. **Information Request** - L3 can request more info before deciding
4. **SLA Compliance** - Time tracking and escalation
5. **Audit Trail** - Complete history for compliance

Run these tests after any changes to the approval workflow to ensure the L3 stage functions correctly.
