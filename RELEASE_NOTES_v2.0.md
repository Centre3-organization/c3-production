# CENTRE3 Release Notes - Version 2.0

**Release Date:** January 26, 2026  
**Module:** Dynamic Approval Workflow System  
**Author:** Manus AI

---

## Executive Summary

This release introduces a comprehensive **Dynamic Approval Workflow Module** that transforms CENTRE3's approval process from a static two-stage system into a fully configurable, enterprise-grade workflow engine. The new system supports process-specific workflows, multi-dimensional routing, shift-based assignments, and a complete delegation system for managing approval authority during absences.

---

## What's New

### 1. Dynamic Approval Workflow Engine

The core of this release is a powerful workflow engine that enables administrators to create and manage approval workflows tailored to specific business processes.

| Feature | Description |
|---------|-------------|
| **Process-Specific Workflows** | Create different approval chains for MCM, TDP, MOP, Work Permits, Material Entry, Admin Visits, and more |
| **Multi-Stage Approvals** | Configure unlimited approval stages with custom names, descriptions, and requirements |
| **Flexible Approval Modes** | Choose between "Any" (single approval), "All" (unanimous), or "Percentage" (configurable threshold) |
| **Condition-Based Routing** | Route requests to different workflows based on category, location, risk level, or custom fields |
| **Priority System** | Assign workflow priorities to ensure the most specific workflow is selected |

#### Supported Process Types

- Admin Visit
- Work Permit
- Material Entry
- TEP (Temporary Entry Pass)
- MOP (Method of Procedure)
- Escort Request
- MCM (Managed Change Management)
- TDP (Technical Data Package)
- MHV (Material Handling Vehicle)

---

### 2. Advanced Approver Resolution

The system now supports multiple methods for determining who should approve a request at each stage.

| Approver Type | Description |
|---------------|-------------|
| **Individual User** | Assign specific users as approvers |
| **System Role** | Route to users with specific system roles (admin, user) |
| **Approval Role** | Route to users with designated approval roles (WS Regional Manager, GS Manager, etc.) |
| **Group Members** | Route to all members of a specific group |
| **Group Role** | Route to users with specific roles within a group |
| **Group Hierarchy** | Navigate up the group hierarchy (External Vendor → Manager → Center3 Admin → Security) |
| **Dynamic Field** | Route based on request fields (e.g., Host user) |
| **Shift-Based** | Route to users currently on shift |
| **Manager** | Route to the requestor's manager |
| **External Manager** | Route to the external company's manager |
| **Site Manager** | Route to the site manager where access is requested |
| **Zone Owner** | Route to the owner of the requested zone |

---

### 3. Shift Management System

A complete shift management system enables time-based approval routing.

| Feature | Description |
|---------|-------------|
| **Shift Schedules** | Create named schedules (e.g., "24/7 Security", "Business Hours") |
| **Shift Definitions** | Define shifts with start/end times and working days |
| **User Assignments** | Assign users to specific shifts with effective dates |
| **Automatic Routing** | Requests are automatically routed to users on the current shift |
| **Timezone Support** | Shifts respect the configured timezone |

#### Default Shift Types

- Day Shift (06:00 - 18:00)
- Night Shift (18:00 - 06:00)
- Morning Shift (06:00 - 14:00)
- Afternoon Shift (14:00 - 22:00)
- Night Watch (22:00 - 06:00)

---

### 4. Delegation System

Users can now delegate their approval authority to colleagues during planned absences.

| Feature | Description |
|---------|-------------|
| **Full Delegation** | Transfer all approval authority to another user |
| **Partial Delegation** | Delegate only specific process types or sites |
| **Time-Bound** | Set precise start and end dates for delegations |
| **Overlap Prevention** | System prevents conflicting delegations |
| **Maximum Duration** | Configurable maximum delegation period (default: 30 days) |
| **Audit Trail** | Complete history of all delegations |

#### Delegation Dashboard

The new Delegation Management page provides:
- Summary cards showing active delegations, delegations to you, and scheduled delegations
- Table view of all delegations with status indicators
- Quick actions to create, revoke, or extend delegations

---

### 5. Approval Roles

A new approval roles system allows fine-grained control over who can approve what.

| Role | Description |
|------|-------------|
| **WS Regional Manager** | Workspace regional management approvals |
| **GS Manager** | General Services manager approvals |
| **Security Manager** | Security-related approvals |
| **Site Manager** | Site-level approvals |
| **Zone Owner** | Zone-specific approvals |
| **Escort Coordinator** | Escort request approvals |
| **Material Handler** | Material entry approvals |
| **Emergency Responder** | Emergency access approvals |
| **Compliance Officer** | Compliance-related approvals |
| **IT Administrator** | IT access approvals |

Users can be assigned multiple approval roles with scope restrictions (specific sites or regions).

---

### 6. Escalation Rules

Configure automatic escalation when approvals are delayed.

| Feature | Description |
|---------|-------------|
| **SLA Configuration** | Set time limits for each approval stage |
| **Reminder Notifications** | Send reminders before SLA breach |
| **Auto-Escalation** | Automatically escalate to backup approvers |
| **Auto-Actions** | Configure auto-approve or auto-reject on timeout |
| **Escalation Chain** | Define escalation hierarchy |

---

### 7. Enhanced User & Group Fields

#### New User Fields

| Field | Purpose |
|-------|---------|
| `manager_id` | Links to user's direct manager for hierarchy navigation |
| `employee_type` | Distinguishes internal vs external employees |
| `work_schedule_id` | Links to user's shift schedule |
| `can_delegate` | Controls whether user can delegate approvals |
| `out_of_office_delegate_id` | Default delegate when out of office |
| `max_delegation_days` | Maximum allowed delegation duration |

#### New Group Fields

| Field | Purpose |
|-------|---------|
| `approval_config` | JSON configuration for group-specific approval rules |
| `internal_liaison_user_id` | Internal contact for external groups |
| `working_hours` | Group's standard working hours |
| `sla_override_hours` | Custom SLA for this group |

#### New Group Membership Fields

| Field | Purpose |
|-------|---------|
| `role_in_group` | User's role within the group |
| `reports_to_user_id` | Reporting hierarchy within group |
| `can_approve` | Whether user can approve for this group |
| `is_group_admin` | Administrative privileges for group |

---

## Database Schema Changes

### New Tables

| Table | Purpose |
|-------|---------|
| `approval_workflows` | Stores workflow definitions |
| `workflow_conditions` | Stores routing conditions |
| `approval_stages` | Stores stage configurations |
| `stage_approvers` | Maps approvers to stages |
| `approval_roles` | Defines approval role types |
| `user_approval_roles` | Assigns roles to users |
| `shift_schedules` | Stores shift schedule definitions |
| `shift_definitions` | Stores individual shift configurations |
| `shift_assignments` | Maps users to shifts |
| `approval_delegations` | Stores delegation records |
| `approval_instances` | Tracks workflow instances |
| `approval_tasks` | Tracks individual approval tasks |
| `approval_history` | Audit trail for all actions |
| `escalation_rules` | Stores escalation configurations |

---

## Admin UI Components

### Workflow Builder (`/workflows`)

A visual workflow builder that allows administrators to:
- Create and edit approval workflows
- Configure stages with drag-and-drop ordering
- Set up conditions for workflow selection
- Preview workflow execution paths
- Clone existing workflows as templates

### Shift Management (`/shifts`)

A dedicated interface for managing shifts:
- Create shift schedules with multiple shifts
- Define shift times and working days
- Assign users to shifts
- View current shift assignments
- Calendar view of shift coverage

### Delegation Management (`/delegations`)

A user-friendly delegation dashboard:
- Create new delegations with date pickers
- View active and scheduled delegations
- Revoke delegations when needed
- See delegations assigned to you
- Track delegation history

---

## Navigation Updates

A new **Workflow Management** section has been added to the sidebar navigation:

- **Workflow Builder** - Create and manage approval workflows
- **Shift Management** - Configure shifts and assignments
- **Delegations** - Manage approval authority delegations

---

## API Endpoints

### Workflow Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `workflows.list` | Query | List all workflows |
| `workflows.getDetails` | Query | Get workflow with stages |
| `workflows.create` | Mutation | Create new workflow |
| `workflows.update` | Mutation | Update workflow |
| `workflows.delete` | Mutation | Delete workflow |
| `workflows.addStage` | Mutation | Add stage to workflow |
| `workflows.updateStage` | Mutation | Update stage |
| `workflows.deleteStage` | Mutation | Delete stage |

### Shift Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `workflows.shifts.listSchedules` | Query | List shift schedules |
| `workflows.shifts.getScheduleDetails` | Query | Get schedule with shifts |
| `workflows.shifts.createSchedule` | Mutation | Create schedule |
| `workflows.shifts.createShift` | Mutation | Add shift to schedule |
| `workflows.shifts.assignUser` | Mutation | Assign user to shift |

### Delegation Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `workflows.delegations.myDelegations` | Query | Get user's delegations |
| `workflows.delegations.listAll` | Query | List all delegations (admin) |
| `workflows.delegations.create` | Mutation | Create delegation |
| `workflows.delegations.revoke` | Mutation | Revoke delegation |
| `workflows.delegations.extend` | Mutation | Extend delegation |

---

## Migration Notes

### Backward Compatibility

The existing L1 and L2 approval system continues to function. The new workflow system operates alongside the existing system, allowing gradual migration.

### Recommended Migration Steps

1. **Create Default Workflows** - Set up workflows that mirror the current L1/L2 process
2. **Configure Approval Roles** - Assign approval roles to existing approvers
3. **Set Up Shifts** - Configure shifts if time-based routing is needed
4. **Test with New Requests** - Create test requests to verify workflow execution
5. **Enable for Production** - Mark workflows as default for each process type

---

## Known Limitations

1. **Workflow Versioning** - Currently, editing a workflow affects all in-progress requests. Future versions will support workflow versioning.

2. **Parallel Stages** - The current implementation supports sequential stages only. Parallel stage execution is planned for a future release.

3. **External Notifications** - Email/SMS notifications for approvals are not yet integrated. Currently, approvals appear in the in-app queue only.

---

## Future Roadmap

| Feature | Target Release |
|---------|----------------|
| Workflow Versioning | v2.1 |
| Parallel Stage Execution | v2.1 |
| Email/SMS Notifications | v2.2 |
| Mobile Approval App | v2.3 |
| Approval Analytics Dashboard | v2.2 |
| Bulk Approval Actions | v2.1 |

---

## Technical Support

For questions or issues related to this release, please contact the development team or refer to the in-app documentation.

---

**Document Version:** 1.0  
**Last Updated:** January 26, 2026
