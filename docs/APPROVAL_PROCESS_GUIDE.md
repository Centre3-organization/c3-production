# CENTRE3 Dynamic Approval Workflow System

## Complete Technical Documentation & Test Guide

**Version:** 2.0  
**Last Updated:** January 26, 2026  
**Author:** Manus AI

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Core Concepts](#2-core-concepts)
3. [Workflow Configuration](#3-workflow-configuration)
4. [Approver Resolution](#4-approver-resolution)
5. [Shift Management](#5-shift-management)
6. [Delegation System](#6-delegation-system)
7. [Escalation Rules](#7-escalation-rules)
8. [Approval Execution Flow](#8-approval-execution-flow)
9. [Test Cases](#9-test-cases)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. System Overview

### 1.1 Introduction

The CENTRE3 Dynamic Approval Workflow System replaces the legacy hardcoded L1/L2 approval process with a fully configurable, enterprise-grade workflow engine. This system enables administrators to create custom approval chains tailored to specific business processes, locations, risk levels, and organizational structures.

### 1.2 Architecture

The approval system consists of five interconnected modules that work together to route, assign, and track approval requests:

| Module | Purpose | Key Tables |
|--------|---------|------------|
| **Workflow Engine** | Selects and executes workflows based on request attributes | `approval_workflows`, `workflow_conditions`, `approval_stages` |
| **Approver Resolution** | Determines who should approve at each stage | `stage_approvers`, `approval_roles`, `user_approval_roles` |
| **Shift Management** | Routes to users based on current shift | `shift_schedules`, `shift_definitions`, `shift_assignments` |
| **Delegation System** | Handles temporary authority transfers | `approval_delegations` |
| **Execution Tracking** | Tracks progress and maintains audit trail | `approval_instances`, `approval_tasks`, `approval_history` |

### 1.3 Request Lifecycle

Every access request in CENTRE3 follows this lifecycle:

```
┌─────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   CREATED   │────▶│ WORKFLOW SELECT │────▶│  STAGE 1 QUEUE  │
└─────────────┘     └─────────────────┘     └─────────────────┘
                                                    │
                    ┌───────────────────────────────┘
                    ▼
            ┌───────────────┐     ┌───────────────┐
            │  APPROVED?    │─YES─▶│ NEXT STAGE?   │
            └───────────────┘     └───────────────┘
                    │                     │
                   NO                    YES
                    │                     │
                    ▼                     ▼
            ┌───────────────┐     ┌───────────────┐
            │   REJECTED    │     │ STAGE N QUEUE │
            └───────────────┘     └───────────────┘
                                          │
                                         ...
                                          │
                                          ▼
                                  ┌───────────────┐
                                  │   APPROVED    │
                                  └───────────────┘
```

---

## 2. Core Concepts

### 2.1 Workflows

A **workflow** is a named approval process that defines how requests of a specific type should be handled. Each workflow contains one or more stages that must be completed in sequence.

| Property | Description | Example |
|----------|-------------|---------|
| `name` | Human-readable workflow name | "Standard Admin Visit Approval" |
| `processType` | Type of request this workflow handles | "admin_visit", "work_permit", "material_entry" |
| `description` | Detailed description of the workflow | "Two-stage approval for admin visits" |
| `priority` | Selection priority (higher = more specific) | 100 |
| `isDefault` | Whether this is the default for its process type | true |
| `isActive` | Whether the workflow is currently active | true |

### 2.2 Stages

A **stage** represents a single approval step within a workflow. Stages are executed in order based on their `stageOrder` property.

| Property | Description | Example |
|----------|-------------|---------|
| `name` | Stage name | "L1 Approval" |
| `stageOrder` | Execution order (1, 2, 3...) | 1 |
| `approvalMode` | How approvals are counted | "any", "all", "percentage" |
| `requiredApprovals` | Number/percentage needed | 1 (for "any") or 100 (for "percentage") |
| `slaHours` | Time limit for this stage | 24 |
| `allowSkip` | Can this stage be skipped? | false |
| `requireComment` | Is comment required? | true |

### 2.3 Approval Modes

The system supports three approval modes that determine how many approvals are needed to advance:

| Mode | Description | Use Case |
|------|-------------|----------|
| **Any** | Single approval from any assigned approver advances the stage | Standard approvals where any authorized person can approve |
| **All** | Every assigned approver must approve | High-security scenarios requiring unanimous consent |
| **Percentage** | Specified percentage of approvers must approve | Committee decisions (e.g., 60% must approve) |

### 2.4 Workflow Conditions

**Conditions** determine which workflow is selected for a given request. The system evaluates conditions and selects the workflow with the highest priority that matches.

| Condition Type | Description | Example |
|----------------|-------------|---------|
| `processType` | Match by request type | "admin_visit" |
| `siteId` | Match by specific site | Site ID 5 |
| `zoneSecurityLevel` | Match by zone security | "critical" |
| `groupId` | Match by requestor's group | External Vendors group |
| `riskLevel` | Match by assessed risk | "high" |
| `category` | Match by request category | "maintenance" |

---

## 3. Workflow Configuration

### 3.1 Creating a Workflow

To create a new workflow, navigate to **Workflow Management → Workflow Builder** and click **New**.

**Step 1: Basic Information**

Enter the workflow name, description, and select the process type. Set the priority (higher numbers take precedence when multiple workflows match).

**Step 2: Add Stages**

Click "Add Stage" to create approval stages. For each stage, configure:

1. **Stage Name** - Descriptive name (e.g., "Manager Approval")
2. **Stage Order** - Execution sequence (1, 2, 3...)
3. **Approval Mode** - Any, All, or Percentage
4. **SLA Hours** - Time limit before escalation
5. **Approvers** - Who can approve this stage

**Step 3: Configure Approvers**

For each stage, add one or more approver configurations. The system will resolve these to actual users when a request enters the stage.

**Step 4: Set Conditions (Optional)**

Add conditions to make this workflow apply only to specific scenarios (e.g., only for critical zones, only for external vendors).

**Step 5: Activate**

Toggle the workflow to active and optionally set it as the default for its process type.

### 3.2 Example: Standard Access Request Workflow

This example recreates the legacy L1/L2 approval process using the new workflow system:

```
Workflow: Standard Access Request Approval
Process Type: admin_visit
Priority: 50
Default: Yes

Stage 1: L1 Approval (Initial Review)
├── Stage Order: 1
├── Approval Mode: Any
├── Required Approvals: 1
├── SLA Hours: 24
├── Approvers:
│   └── Type: approval_role
│       └── Role: "L1 Approver"
└── Actions: Approve → Stage 2, Reject → End

Stage 2: L2 Approval (Security Verification)
├── Stage Order: 2
├── Approval Mode: Any
├── Required Approvals: 1
├── SLA Hours: 48
├── Approvers:
│   └── Type: approval_role
│       └── Role: "Security Manager"
└── Actions: Approve → Complete, Reject → End
```

### 3.3 Example: High-Security Zone Workflow

For critical zones, a more rigorous approval process:

```
Workflow: Critical Zone Access Approval
Process Type: admin_visit
Priority: 100 (higher than standard)
Conditions:
└── Zone Security Level = "critical"

Stage 1: Manager Pre-Approval
├── Approval Mode: Any
├── Approvers: requestor's manager
└── SLA: 12 hours

Stage 2: Security Review
├── Approval Mode: Any
├── Approvers: Security Manager role
└── SLA: 24 hours

Stage 3: Site Director Final Approval
├── Approval Mode: Any
├── Approvers: Site Manager role
└── SLA: 48 hours
```

---

## 4. Approver Resolution

### 4.1 Approver Types

The system supports multiple methods for determining who should approve at each stage:

| Type | Code | Description |
|------|------|-------------|
| Individual User | `individual` | Specific user by ID |
| System Role | `role` | Users with admin/user role |
| Approval Role | `approval_role` | Users assigned specific approval roles |
| Group Members | `group` | All members of a group |
| Group Role | `group_role` | Users with specific role in a group |
| Group Hierarchy | `group_hierarchy` | Navigate up group hierarchy |
| Dynamic Field | `dynamic_field` | Based on request field (e.g., host) |
| Shift-Based | `shift_based` | Users currently on shift |
| Manager | `manager` | Requestor's direct manager |
| External Manager | `external_manager` | External company's manager |
| Site Manager | `site_manager` | Manager of the requested site |
| Zone Owner | `zone_owner` | Owner of the requested zone |

### 4.2 Resolution Algorithm

When a request enters a stage, the system resolves approvers using this algorithm:

```
function resolveApprovers(stage, request):
    approvers = []
    
    for each approverConfig in stage.approvers:
        switch approverConfig.type:
            case "individual":
                approvers.add(getUserById(approverConfig.userId))
                
            case "approval_role":
                users = getUsersWithApprovalRole(approverConfig.roleId)
                // Filter by scope (site, region)
                approvers.addAll(filterByScope(users, request))
                
            case "shift_based":
                currentShift = getCurrentShift(approverConfig.scheduleId)
                approvers.addAll(getUsersOnShift(currentShift))
                
            case "manager":
                approvers.add(getManager(request.requestorId))
                
            case "group_hierarchy":
                group = getRequestorGroup(request)
                while group.parentId:
                    liaison = group.internalLiaisonUserId
                    if liaison:
                        approvers.add(liaison)
                    group = getParentGroup(group)
                    
            // ... other types
    
    // Apply delegation substitutions
    approvers = applyDelegations(approvers)
    
    return unique(approvers)
```

### 4.3 Approval Roles

Approval roles provide a flexible way to assign approval authority independent of system roles:

| Role | Code | Typical Scope |
|------|------|---------------|
| L1 Approver | `l1_approver` | Initial request screening |
| Security Manager | `security_manager` | Security verification |
| Site Manager | `site_manager` | Site-level approvals |
| Zone Owner | `zone_owner` | Zone-specific access |
| WS Regional Manager | `ws_regional_manager` | Regional workspace approvals |
| GS Manager | `gs_manager` | General services approvals |
| Escort Coordinator | `escort_coordinator` | Escort assignments |
| Material Handler | `material_handler` | Material entry approvals |
| Emergency Responder | `emergency_responder` | Emergency access grants |
| Compliance Officer | `compliance_officer` | Compliance reviews |
| IT Administrator | `it_admin` | IT access approvals |

### 4.4 Assigning Approval Roles to Users

Administrators can assign approval roles to users through the Workflow Builder:

1. Navigate to **Workflow Builder**
2. Click **Approval Roles** tab
3. Select a role and click **Assign Users**
4. Choose users and optionally restrict scope (specific sites/regions)

---

## 5. Shift Management

### 5.1 Overview

The shift management system enables time-based approval routing, ensuring requests are handled by personnel currently on duty.

### 5.2 Components

| Component | Description |
|-----------|-------------|
| **Schedule** | Named collection of shifts (e.g., "24/7 Security Coverage") |
| **Shift** | Time period definition (e.g., "Day Shift: 06:00-18:00") |
| **Assignment** | Links users to shifts with effective dates |

### 5.3 Creating a Shift Schedule

**Step 1: Create Schedule**

Navigate to **Workflow Management → Shift Management** and click **New Schedule**.

Enter:
- Schedule Name (e.g., "Security Operations")
- Description
- Timezone

**Step 2: Define Shifts**

Add shifts to the schedule:

| Shift Name | Start Time | End Time | Working Days |
|------------|------------|----------|--------------|
| Day Shift | 06:00 | 18:00 | Mon-Fri |
| Night Shift | 18:00 | 06:00 | Mon-Fri |
| Weekend Day | 06:00 | 18:00 | Sat-Sun |
| Weekend Night | 18:00 | 06:00 | Sat-Sun |

**Step 3: Assign Users**

For each shift, assign users who work that shift:

| User | Shift | Effective From | Effective Until |
|------|-------|----------------|-----------------|
| John Smith | Day Shift | 2026-01-01 | 2026-12-31 |
| Jane Doe | Night Shift | 2026-01-01 | 2026-12-31 |

### 5.4 Shift-Based Routing

When a stage uses shift-based approvers:

1. System determines current time
2. Finds active schedule for the stage
3. Identifies which shift is currently active
4. Returns users assigned to that shift
5. Applies delegation substitutions if any

```
Example:
Current Time: 2026-01-26 14:30 (Monday)
Schedule: Security Operations
Active Shift: Day Shift (06:00-18:00, Mon-Fri)
Assigned Users: John Smith, Mary Johnson
Result: Request routed to John Smith and Mary Johnson
```

---

## 6. Delegation System

### 6.1 Overview

The delegation system allows users to temporarily transfer their approval authority to colleagues during planned absences (vacation, sick leave, training, etc.).

### 6.2 Delegation Types

| Type | Description | Use Case |
|------|-------------|----------|
| **Full** | All approval authority transferred | Extended vacation |
| **Partial** | Only specific process types/sites | Temporary coverage for specific area |

### 6.3 Creating a Delegation

**Step 1: Navigate to Delegations**

Go to **Workflow Management → Delegations** and click **Create Delegation**.

**Step 2: Configure Delegation**

| Field | Description | Example |
|-------|-------------|---------|
| Delegate To | User receiving authority | Jane Doe |
| Delegation Type | Full or Partial | Full |
| Start Date | When delegation begins | 2026-02-01 |
| End Date | When delegation ends | 2026-02-15 |
| Reason | Why delegating | "Annual leave" |

**Step 3: Partial Delegation Options** (if applicable)

| Field | Description |
|-------|-------------|
| Process Types | Only these request types |
| Sites | Only these sites |
| Approval Roles | Only these roles |

### 6.4 Delegation Rules

The system enforces these rules:

1. **No Self-Delegation** - Users cannot delegate to themselves
2. **No Circular Delegation** - A→B→A is not allowed
3. **Maximum Duration** - Configurable limit (default: 30 days)
4. **No Overlapping** - Cannot have two active delegations for same period
5. **Revocable** - Delegator can revoke at any time

### 6.5 Delegation Resolution

When resolving approvers, the system checks for active delegations:

```
function applyDelegations(approvers):
    result = []
    for each approver in approvers:
        delegation = findActiveDelegation(approver.id)
        if delegation:
            // Check if delegation covers this request
            if delegationCoversRequest(delegation, request):
                result.add(delegation.delegate)
            else:
                result.add(approver)
        else:
            result.add(approver)
    return result
```

---

## 7. Escalation Rules

### 7.1 Overview

Escalation rules define what happens when approvals are not completed within the SLA timeframe.

### 7.2 Escalation Actions

| Action | Description |
|--------|-------------|
| **Notify** | Send reminder to current approvers |
| **Escalate** | Add backup approvers to the stage |
| **Reassign** | Replace current approvers with escalation target |
| **Auto-Approve** | Automatically approve (use with caution) |
| **Auto-Reject** | Automatically reject |

### 7.3 Configuring Escalation

For each stage, configure escalation rules:

| Setting | Description | Example |
|---------|-------------|---------|
| SLA Hours | Time limit | 24 |
| Reminder After | Send reminder at | 18 hours |
| Escalate After | Escalate at | 24 hours |
| Escalation Target | Who to escalate to | Manager of approver |
| Final Action | If still not resolved | Auto-reject at 72 hours |

### 7.4 Escalation Flow

```
Request enters Stage 1 at T=0
├── T+18h: Reminder sent to approvers
├── T+24h: SLA breached, escalate to backup approvers
├── T+48h: Second escalation to department head
└── T+72h: Auto-reject if still pending
```

---

## 8. Approval Execution Flow

### 8.1 Complete Flow Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                    REQUEST SUBMITTED                            │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                 WORKFLOW SELECTION                              │
│  1. Get request attributes (type, site, zone, group, risk)     │
│  2. Find workflows matching conditions                          │
│  3. Select highest priority workflow                            │
│  4. If no match, use default workflow for process type          │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│              CREATE APPROVAL INSTANCE                           │
│  1. Create instance record linked to request                    │
│  2. Set current stage to first stage                            │
│  3. Record start timestamp                                      │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│              RESOLVE STAGE APPROVERS                            │
│  1. Get approver configurations for current stage               │
│  2. Resolve each configuration to actual users                  │
│  3. Apply delegation substitutions                              │
│  4. Create approval tasks for each approver                     │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                 AWAIT APPROVALS                                 │
│  Tasks appear in approvers' queues                              │
│  Escalation timer starts                                        │
└────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌──────────┐   ┌──────────┐   ┌──────────┐
        │ APPROVED │   │ REJECTED │   │ ESCALATE │
        └──────────┘   └──────────┘   └──────────┘
              │               │               │
              ▼               │               ▼
┌─────────────────────┐       │    ┌─────────────────────┐
│ CHECK APPROVAL MODE │       │    │ ADD BACKUP APPROVERS│
│ Any: 1 approval OK  │       │    │ Reset escalation    │
│ All: All must OK    │       │    │ timer               │
│ %: Check threshold  │       │    └─────────────────────┘
└─────────────────────┘       │               │
              │               │               │
              ▼               ▼               │
        ┌──────────┐   ┌──────────┐           │
        │ ADVANCE? │   │  REJECT  │◀──────────┘
        └──────────┘   │ REQUEST  │   (if final escalation)
              │        └──────────┘
              ▼
┌────────────────────────────────────────────────────────────────┐
│                    NEXT STAGE?                                  │
│  YES: Go to "RESOLVE STAGE APPROVERS"                          │
│  NO: Request APPROVED                                           │
└────────────────────────────────────────────────────────────────┘
```

### 8.2 Status Transitions

| From Status | Action | To Status |
|-------------|--------|-----------|
| `draft` | Submit | `pending_approval` |
| `pending_approval` | Enter Stage 1 | `stage_1_pending` |
| `stage_1_pending` | Approve (Any mode) | `stage_2_pending` or `approved` |
| `stage_1_pending` | Reject | `rejected` |
| `stage_N_pending` | Final Approve | `approved` |
| Any pending | Escalation timeout | `escalated` → back to pending |
| Any pending | Auto-reject | `rejected` |

---

## 9. Test Cases

### 9.1 Workflow Selection Tests

#### TC-WF-001: Default Workflow Selection

**Precondition:** Default workflow exists for "admin_visit" process type

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create admin visit request | Request created |
| 2 | Submit request | Workflow engine triggered |
| 3 | Check assigned workflow | Default admin_visit workflow selected |
| 4 | Check first stage | Request enters Stage 1 |

#### TC-WF-002: Condition-Based Workflow Selection

**Precondition:** Two workflows exist:
- Standard (priority 50, no conditions)
- Critical Zone (priority 100, condition: zone_security_level = "critical")

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create request for critical zone | Request created |
| 2 | Submit request | Workflow engine evaluates conditions |
| 3 | Check assigned workflow | Critical Zone workflow selected (higher priority) |

#### TC-WF-003: No Matching Workflow

**Precondition:** No workflow exists for "custom_process" type

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create request with custom process type | Request created |
| 2 | Submit request | Error: No workflow found |
| 3 | Check request status | Request remains in draft |

### 9.2 Approver Resolution Tests

#### TC-AR-001: Individual User Approver

**Precondition:** Stage configured with individual user (ID: 5)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Request enters stage | Approver resolution triggered |
| 2 | Check approval tasks | Task created for user ID 5 |
| 3 | Login as user 5 | Task visible in approval queue |

#### TC-AR-002: Approval Role Approver

**Precondition:** Stage configured with "Security Manager" role, 3 users have this role

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Request enters stage | Approver resolution triggered |
| 2 | Check approval tasks | Tasks created for all 3 users |
| 3 | Any user approves | Stage advances (Any mode) |

#### TC-AR-003: Shift-Based Approver

**Precondition:** 
- Schedule "Security Ops" with Day/Night shifts
- Day shift: User A, User B
- Night shift: User C, User D
- Current time: 14:00 (Day shift)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Request enters stage | Shift resolution triggered |
| 2 | Check current shift | Day shift identified |
| 3 | Check approval tasks | Tasks for User A and User B only |

#### TC-AR-004: Manager Approver

**Precondition:** Requestor (User X) has manager (User Y)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | User X submits request | Request created |
| 2 | Request enters manager stage | Manager resolution triggered |
| 3 | Check approval tasks | Task created for User Y |

#### TC-AR-005: Group Hierarchy Approver

**Precondition:**
- User X is in "External Vendor - Alibaba" group
- Alibaba's parent is "External Vendors"
- External Vendors' liaison is User Y

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | User X submits request | Request created |
| 2 | Request enters hierarchy stage | Hierarchy navigation triggered |
| 3 | Check approval tasks | Task created for User Y (liaison) |

### 9.3 Approval Mode Tests

#### TC-AM-001: Any Mode - Single Approval

**Precondition:** Stage with "Any" mode, 3 approvers

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Request enters stage | 3 tasks created |
| 2 | Approver 1 approves | Stage advances |
| 3 | Check other tasks | Remaining tasks cancelled |

#### TC-AM-002: All Mode - Unanimous Required

**Precondition:** Stage with "All" mode, 3 approvers

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Request enters stage | 3 tasks created |
| 2 | Approver 1 approves | Stage still pending (2 remaining) |
| 3 | Approver 2 approves | Stage still pending (1 remaining) |
| 4 | Approver 3 approves | Stage advances |

#### TC-AM-003: All Mode - Single Rejection

**Precondition:** Stage with "All" mode, 3 approvers

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Request enters stage | 3 tasks created |
| 2 | Approver 1 approves | Stage still pending |
| 3 | Approver 2 rejects | Request rejected immediately |
| 4 | Check other tasks | Remaining tasks cancelled |

#### TC-AM-004: Percentage Mode - 60% Threshold

**Precondition:** Stage with "Percentage" mode, 60% required, 5 approvers

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Request enters stage | 5 tasks created |
| 2 | 2 approve (40%) | Stage still pending |
| 3 | 3rd approves (60%) | Stage advances |

### 9.4 Delegation Tests

#### TC-DL-001: Full Delegation

**Precondition:** User A delegates to User B (full delegation, active)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Request would route to User A | Delegation check triggered |
| 2 | Check active delegations | User A → User B found |
| 3 | Check approval tasks | Task created for User B (not A) |

#### TC-DL-002: Partial Delegation - Process Type

**Precondition:** User A delegates to User B for "work_permit" only

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Work permit request routes to A | Task created for User B |
| 2 | Admin visit request routes to A | Task created for User A (no delegation) |

#### TC-DL-003: Delegation Period

**Precondition:** Delegation from Feb 1-15

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Request on Jan 31 | Task for original approver |
| 2 | Request on Feb 5 | Task for delegate |
| 3 | Request on Feb 16 | Task for original approver |

#### TC-DL-004: Revoked Delegation

**Precondition:** Active delegation exists

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Delegator revokes delegation | Delegation marked inactive |
| 2 | New request routes to delegator | Task for original approver |

### 9.5 Escalation Tests

#### TC-ES-001: SLA Reminder

**Precondition:** Stage SLA = 24h, reminder at 18h

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Request enters stage at T=0 | Task created |
| 2 | Wait until T+18h | Reminder notification sent |
| 3 | Check task status | Still pending |

#### TC-ES-002: SLA Escalation

**Precondition:** Stage SLA = 24h, escalate to manager

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Request enters stage at T=0 | Task for User A |
| 2 | Wait until T+24h | Escalation triggered |
| 3 | Check tasks | Additional task for User A's manager |

#### TC-ES-003: Auto-Reject on Final Timeout

**Precondition:** Final timeout = 72h with auto-reject

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Request pending for 72h | Auto-reject triggered |
| 2 | Check request status | Status = "rejected" |
| 3 | Check history | "Auto-rejected due to SLA breach" |

### 9.6 Multi-Stage Tests

#### TC-MS-001: Two-Stage Approval (L1 → L2)

**Precondition:** Workflow with L1 and L2 stages

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Submit request | Enters L1 stage |
| 2 | L1 approves | Advances to L2 stage |
| 3 | L2 approves | Request approved |

#### TC-MS-002: Rejection at Stage 2

**Precondition:** Workflow with L1 and L2 stages

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Submit request | Enters L1 stage |
| 2 | L1 approves | Advances to L2 stage |
| 3 | L2 rejects | Request rejected |
| 4 | Check status | Final status = "rejected" |

#### TC-MS-003: Three-Stage Critical Approval

**Precondition:** Critical zone workflow with 3 stages

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Submit critical zone request | Enters Stage 1 |
| 2 | Manager approves | Advances to Stage 2 |
| 3 | Security approves | Advances to Stage 3 |
| 4 | Site Director approves | Request approved |

### 9.7 Edge Case Tests

#### TC-EC-001: Approver is Requestor

**Precondition:** User submits request, same user is in approver group

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | User A submits request | Request created |
| 2 | Stage resolves to include User A | User A excluded from approvers |
| 3 | Check tasks | No self-approval task |

#### TC-EC-002: No Available Approvers

**Precondition:** Shift-based stage, no one on current shift

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Request enters stage | Approver resolution fails |
| 2 | Check fallback | Escalation to backup approvers |
| 3 | If no backup | Admin notification triggered |

#### TC-EC-003: Concurrent Approvals

**Precondition:** "Any" mode, 2 approvers approve simultaneously

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Approver A clicks approve | Processing |
| 2 | Approver B clicks approve | Processing |
| 3 | Check result | First approval wins, second ignored |
| 4 | Check history | Both attempts logged |

#### TC-EC-004: Workflow Deactivated Mid-Process

**Precondition:** Request in progress, workflow deactivated

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Request at Stage 2 | In progress |
| 2 | Admin deactivates workflow | Workflow marked inactive |
| 3 | Approver approves Stage 2 | Approval succeeds |
| 4 | Check behavior | In-progress requests continue |

---

## 10. Troubleshooting

### 10.1 Common Issues

| Issue | Possible Cause | Solution |
|-------|----------------|----------|
| Request stuck in pending | No approvers resolved | Check approver configuration |
| Wrong workflow selected | Priority misconfigured | Review workflow priorities |
| Delegation not working | Date range incorrect | Verify delegation dates |
| Shift routing wrong | Timezone mismatch | Check schedule timezone |
| Escalation not triggering | SLA not configured | Set SLA hours on stage |

### 10.2 Diagnostic Queries

**Check workflow selection:**
```sql
SELECT * FROM approval_instances 
WHERE request_id = ? 
ORDER BY created_at DESC;
```

**Check approver resolution:**
```sql
SELECT * FROM approval_tasks 
WHERE instance_id = ? 
ORDER BY created_at;
```

**Check delegation status:**
```sql
SELECT * FROM approval_delegations 
WHERE delegator_id = ? 
AND is_active = true 
AND valid_from <= NOW() 
AND valid_until >= NOW();
```

### 10.3 Audit Trail

All approval actions are logged in `approval_history`:

| Field | Description |
|-------|-------------|
| `instanceId` | Which approval instance |
| `taskId` | Which task (if applicable) |
| `action` | What happened |
| `performedBy` | Who did it |
| `details` | Additional context (JSON) |
| `ipAddress` | Client IP |
| `userAgent` | Browser info |
| `createdAt` | When it happened |

---

## Appendix A: Database Schema Reference

### approval_workflows

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key |
| name | VARCHAR(255) | Workflow name |
| description | TEXT | Description |
| processType | VARCHAR(100) | Process type |
| priority | INT | Selection priority |
| isDefault | BOOLEAN | Default for type |
| isActive | BOOLEAN | Currently active |
| createdAt | TIMESTAMP | Created date |
| updatedAt | TIMESTAMP | Last updated |

### approval_stages

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key |
| workflowId | INT | Parent workflow |
| name | VARCHAR(255) | Stage name |
| stageOrder | INT | Execution order |
| approvalMode | ENUM | any/all/percentage |
| requiredApprovals | INT | Number needed |
| slaHours | INT | Time limit |
| allowSkip | BOOLEAN | Can skip |
| requireComment | BOOLEAN | Comment required |

### stage_approvers

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key |
| stageId | INT | Parent stage |
| approverType | VARCHAR(50) | Type code |
| approverValue | VARCHAR(255) | Type-specific value |
| priority | INT | Resolution order |

### approval_delegations

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key |
| delegatorId | INT | Who is delegating |
| delegateId | INT | Who receives authority |
| delegationType | ENUM | full/partial |
| processTypes | JSON | Partial: which types |
| siteIds | JSON | Partial: which sites |
| validFrom | DATETIME | Start date |
| validUntil | DATETIME | End date |
| reason | TEXT | Why delegating |
| isActive | BOOLEAN | Currently active |

---

## Appendix B: API Reference

### Workflow Management

```typescript
// List workflows
trpc.workflows.list.useQuery({ includeInactive?: boolean })

// Get workflow details
trpc.workflows.getDetails.useQuery({ workflowId: number })

// Create workflow
trpc.workflows.create.useMutation({
  name: string,
  description?: string,
  processType?: string,
  priority?: number,
  isDefault?: boolean
})

// Add stage
trpc.workflows.addStage.useMutation({
  workflowId: number,
  name: string,
  stageOrder: number,
  approvalMode: 'any' | 'all' | 'percentage',
  requiredApprovals?: number,
  slaHours?: number
})
```

### Delegation Management

```typescript
// Get my delegations
trpc.workflows.delegations.myDelegations.useQuery()

// Create delegation
trpc.workflows.delegations.create.useMutation({
  delegateId: number,
  delegationType: 'full' | 'partial',
  validFrom: string,
  validUntil: string,
  processTypes?: string[],
  siteIds?: number[],
  reason?: string
})

// Revoke delegation
trpc.workflows.delegations.revoke.useMutation({ id: number })
```

---

**End of Document**
