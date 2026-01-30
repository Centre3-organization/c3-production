# Centre3 Access Management System - How To Guide

**Version:** 1.0  
**Author:** Manus AI  
**Last Updated:** January 30, 2026

---

## Table of Contents

1. [Introduction](#introduction)
2. [How to Create a New Request Form](#how-to-create-a-new-request-form)
   - [Step 1: Create a Request Category](#step-1-create-a-request-category)
   - [Step 2: Create Request Types](#step-2-create-request-types)
   - [Step 3: Define Form Sections](#step-3-define-form-sections)
   - [Step 4: Add Form Fields](#step-4-add-form-fields)
   - [Step 5: Configure Field Options](#step-5-configure-field-options)
   - [Step 6: Test the Form](#step-6-test-the-form)
3. [How to Configure Approval Workflows](#how-to-configure-approval-workflows)
   - [Understanding Workflow Components](#understanding-workflow-components)
   - [Creating a New Workflow](#creating-a-new-workflow)
   - [Configuring Workflow Conditions](#configuring-workflow-conditions)
   - [Setting Up Approval Stages](#setting-up-approval-stages)
   - [Site/Zone/Area-Based Routing](#sitezonearea-based-routing)
4. [Test Cases](#test-cases)
5. [Troubleshooting](#troubleshooting)

---

## Introduction

The Centre3 Access Management System provides a flexible, configurable platform for managing facility access requests. This guide covers two essential administrative tasks: creating custom request forms and configuring approval workflows that route requests based on facility hierarchy (sites, zones, and areas).

The system follows a modular architecture where request forms are dynamically generated from database configurations, and approval workflows can be tailored to match your organization's specific requirements without any code changes.

---

## How to Create a New Request Form

The request form system in Centre3 uses a hierarchical structure consisting of Categories, Types, Sections, and Fields. Understanding this hierarchy is essential for creating effective request forms.

| Level | Description | Example |
|-------|-------------|---------|
| **Category** | The top-level grouping for related request types | "Technical & Delivery Process" |
| **Type** | Specific request variations within a category | "TEP", "WP", "MOP", "MHV" |
| **Section** | Tabs or groups within a form | "Requestor Information", "Visit Details" |
| **Field** | Individual input elements | "Requestor Name", "Visit Date", "Purpose" |

### Step 1: Create a Request Category

Navigate to **Settings → Request Types** in the sidebar. The Request Types page displays all existing categories and their associated types.

To create a new category, click the **"Add Category"** button in the top-right corner. A dialog will appear with the following fields:

| Field | Required | Description |
|-------|----------|-------------|
| Code | Yes | Unique identifier (e.g., "ADMIN_VISIT", "TECH_DELIVERY") |
| Name (English) | Yes | Display name in English |
| Name (Arabic) | Yes | Display name in Arabic |
| Description | No | Brief explanation of the category's purpose |
| Icon | No | Visual icon for the category card |
| Color | No | Theme color for the category |
| Active | Yes | Whether the category is available for selection |

After filling in the required information, click **"Create"** to save the category. The new category will appear in the category list and will be available when users create new requests.

### Step 2: Create Request Types

Within each category, you can define multiple request types. Some categories may have a single type (like "Admin Visit"), while others may have multiple combinable types (like "Technical & Delivery" with TEP, WP, MOP, and MHV).

Click on a category card to expand it, then click **"Add Type"** to create a new request type. Configure the following:

| Field | Required | Description |
|-------|----------|-------------|
| Code | Yes | Unique identifier within the category |
| Name (English) | Yes | Display name in English |
| Name (Arabic) | Yes | Display name in Arabic |
| Description | No | Explanation of when to use this type |
| Can Combine | No | Whether this type can be selected with others |
| Display Order | No | Order in the type selection list |
| Active | Yes | Whether the type is available |

For categories where users can select multiple types (e.g., a delivery that requires both TEP and MHV), enable the **"Can Combine"** option on each type that supports combination.

### Step 3: Define Form Sections

Form sections organize fields into logical groups, typically displayed as tabs in the request form. Each request type can have its own set of sections, or sections can be shared across types within a category.

To add a section, select a request type and click **"Add Section"**. Configure:

| Field | Required | Description |
|-------|----------|-------------|
| Code | Yes | Unique identifier (e.g., "requestor_info") |
| Title (English) | Yes | Tab/section title in English |
| Title (Arabic) | Yes | Tab/section title in Arabic |
| Display Order | Yes | Order of the tab (1, 2, 3, etc.) |
| Description | No | Help text shown at the top of the section |
| Is Repeatable | No | Whether users can add multiple instances (e.g., multiple visitors) |
| Min Instances | No | Minimum required instances for repeatable sections |
| Max Instances | No | Maximum allowed instances |

Common section patterns include:

- **Requestor Information** - Who is submitting the request
- **Visit Details** - When, where, and why
- **Visitor Information** - Details about each visitor (repeatable)
- **Materials/Equipment** - Items being brought in (repeatable)
- **Documents** - Required attachments
- **Review & Submit** - Summary before submission

### Step 4: Add Form Fields

Fields are the individual input elements within each section. Centre3 supports a comprehensive set of field types to handle various data requirements.

Navigate to a section and click **"Add Field"** to create a new field. The field configuration includes:

| Field | Required | Description |
|-------|----------|-------------|
| Code | Yes | Unique field identifier (used in form data) |
| Field Type | Yes | The type of input control |
| Name (English) | Yes | Field label in English |
| Name (Arabic) | Yes | Field label in Arabic |
| Display Order | Yes | Position within the section |
| Placeholder | No | Hint text shown in empty fields |
| Help Text | No | Additional guidance below the field |
| Default Value | No | Pre-filled value |
| Required | Yes | Whether the field must be completed |
| Active | Yes | Whether the field is visible |

The available field types are:

| Field Type | Use Case | Example |
|------------|----------|---------|
| Text | Short text input | Name, ID number |
| Text Area | Multi-line text | Purpose, description |
| Number | Numeric values | Quantity, age |
| Email | Email addresses | Contact email |
| Phone | Phone numbers | Mobile number |
| Date | Date selection | Visit date |
| Date & Time | Date with time | Appointment time |
| Dropdown | Single selection from list | Country, department |
| Multi-Select | Multiple selections | Access areas |
| Checkbox | Yes/No toggle | Agreement acceptance |
| Checkbox Group | Multiple checkboxes | Services required |
| Radio Buttons | Single choice from options | Gender, priority |
| File Upload | Single file attachment | ID scan |
| Multi-File Upload | Multiple attachments | Supporting documents |
| User Lookup | Select system user | Requestor, approver |
| Read Only | Display-only information | Request number |
| Activity Selector | Main/Sub activity selection | Work activity type |

### Step 5: Configure Field Options

For Dropdown, Multi-Select, Checkbox Group, and Radio Button fields, you must define the available options. After creating a field with one of these types, click the **"Options"** button to manage the selection choices.

Each option requires:

| Field | Required | Description |
|-------|----------|-------------|
| Value | Yes | Internal value stored in the database |
| Label (English) | Yes | Display text in English |
| Label (Arabic) | Yes | Display text in Arabic |
| Display Order | Yes | Order in the dropdown/list |
| Active | Yes | Whether the option is available |

For dependent dropdowns (where options change based on another field's selection), configure the **"Depends On"** relationship to link the child field to its parent.

### Step 6: Test the Form

After configuring all sections and fields, test the form by navigating to **Requests → New Request** and selecting your new category and type. Verify that:

1. All sections appear as tabs in the correct order
2. All fields display with proper labels and help text
3. Required field validation works correctly
4. Dropdown options load properly
5. Repeatable sections allow adding/removing instances
6. The form submits successfully and creates a request record

---

## How to Configure Approval Workflows

The Centre3 Workflow Builder allows you to create sophisticated approval processes that route requests to the appropriate approvers based on various conditions, including the facility hierarchy (site, zone, area).

### Understanding Workflow Components

A workflow in Centre3 consists of several interconnected components:

| Component | Purpose |
|-----------|---------|
| **Workflow** | The top-level container defining the approval process |
| **Conditions** | Rules that determine when this workflow applies |
| **Stages** | Sequential approval steps (e.g., L1, L2, L3) |
| **Approvers** | Users or roles assigned to each stage |
| **Escalation Rules** | Actions when approvals are delayed |

The workflow engine evaluates conditions to select the appropriate workflow, then progresses through stages sequentially, resolving approvers at each stage based on the configured rules.

### Creating a New Workflow

Navigate to **Settings → Workflow Builder** to access the workflow management interface. Click **"Create Workflow"** to start a new workflow configuration.

Basic workflow settings include:

| Field | Required | Description |
|-------|----------|-------------|
| Name | Yes | Descriptive workflow name |
| Description | No | Explanation of when this workflow is used |
| Request Category | Yes | Which request category this workflow handles |
| Priority | Yes | Order of evaluation (higher = checked first) |
| Active | Yes | Whether the workflow is in use |

After creating the workflow, you'll configure its conditions, stages, and approvers.

### Configuring Workflow Conditions

Conditions determine when a specific workflow is triggered. Multiple conditions can be combined using AND/OR logic. Click **"Add Condition"** within your workflow to define matching criteria.

Available condition types:

| Condition Type | Description | Example |
|----------------|-------------|---------|
| Site | Match specific sites | "Riyadh Data Center" |
| Zone | Match specific zones | "Server Hall A" |
| Area | Match specific areas | "Rack Row 1-10" |
| Request Type | Match request types | "TEP", "MOP" |
| Requestor Group | Match user groups | "External Vendors" |
| Requestor Department | Match departments | "IT Operations" |
| Risk Level | Match risk classification | "High", "Critical" |
| Custom Field | Match any form field value | "Purpose = Maintenance" |

To create a site-based condition:

1. Click **"Add Condition"**
2. Select **"Site"** as the condition type
3. Choose the operator (equals, in list, not equals)
4. Select the target site(s)
5. Save the condition

Multiple conditions are evaluated together. For example, to create a workflow that applies only to high-risk requests at the Riyadh site:

- Condition 1: Site = "Riyadh Data Center"
- Condition 2: Risk Level = "High"
- Logic: AND (both must match)

### Setting Up Approval Stages

Stages represent the sequential steps in the approval process. Each stage can have multiple approvers, and the stage completes when the required number of approvals is received.

Click **"Add Stage"** to create a new approval stage:

| Field | Required | Description |
|-------|----------|-------------|
| Name | Yes | Stage identifier (e.g., "L1 - Manager Approval") |
| Stage Order | Yes | Sequence number (1, 2, 3, etc.) |
| Approval Type | Yes | How approvals are counted |
| Required Approvals | No | Number needed (for "Count" type) |
| SLA Hours | No | Time limit before escalation |
| Can Reject | Yes | Whether approvers can reject at this stage |

Approval types include:

| Type | Behavior |
|------|----------|
| Any | First approval completes the stage |
| All | All assigned approvers must approve |
| Count | Specific number of approvals required |
| Percentage | Percentage of approvers must approve |

### Site/Zone/Area-Based Routing

One of the most powerful features of the Centre3 workflow system is the ability to route approvals based on facility hierarchy. This ensures that requests are reviewed by personnel responsible for the specific location.

**Scenario: Different approvers for different sites**

To configure site-based approval routing:

1. Create separate workflows for each site, OR
2. Use a single workflow with dynamic approver resolution

**Method 1: Separate Workflows**

Create multiple workflows with site-specific conditions:

- Workflow: "Riyadh Site Approval"
  - Condition: Site = "Riyadh Data Center"
  - Stage 1: Riyadh Site Manager
  - Stage 2: Riyadh Security Team

- Workflow: "Jeddah Site Approval"
  - Condition: Site = "Jeddah Data Center"
  - Stage 1: Jeddah Site Manager
  - Stage 2: Jeddah Security Team

**Method 2: Dynamic Approver Resolution**

Use approver types that automatically resolve based on the request context:

| Approver Type | Resolution Logic |
|---------------|------------------|
| Site Manager | Resolves to the manager of the selected site |
| Zone Supervisor | Resolves to the supervisor of the selected zone |
| Area Coordinator | Resolves to the coordinator of the selected area |
| Requestor Manager | Resolves to the requestor's direct manager |
| Group Liaison | Resolves to the internal liaison for the requestor's group |

To configure dynamic approvers:

1. In the stage configuration, click **"Add Approver"**
2. Select **"Dynamic - Site Manager"** as the approver type
3. The system will automatically identify the correct person based on the request's site selection

**Zone and Area-Based Conditions**

For more granular control, add zone or area conditions:

```
Workflow: "High Security Zone Approval"
Conditions:
  - Zone IN ("Server Hall A", "Network Operations Center")
  - OR Area IN ("Cage 1", "Cage 2", "Cage 3")
Stages:
  1. Zone Supervisor (dynamic)
  2. Security Manager (static)
  3. Facility Director (static)
```

This workflow triggers only for requests targeting high-security zones or specific caged areas, ensuring additional scrutiny for sensitive locations.

**Combining Location with Other Criteria**

Complex routing scenarios can combine location with other factors:

```
Workflow: "External Vendor - Critical Infrastructure"
Conditions:
  - Requestor Group = "External Vendors"
  - AND Zone = "Critical Infrastructure"
  - AND Risk Level IN ("High", "Critical")
Stages:
  1. Vendor Manager (from requestor's group)
  2. Zone Supervisor (dynamic)
  3. Security Director (static)
  4. COO Approval (static)
```

---

## Test Cases

The following 30 test cases cover various scenarios for request form creation and approval workflow configuration. Each test case includes the scenario, steps to execute, and expected results.

### Request Form Test Cases (TC-RF-001 to TC-RF-010)

| ID | Scenario | Steps | Expected Result |
|----|----------|-------|-----------------|
| TC-RF-001 | Create new request category | 1. Navigate to Settings → Request Types<br>2. Click "Add Category"<br>3. Enter code "TEST_CAT", names, description<br>4. Click Create | Category appears in the list and is selectable in New Request |
| TC-RF-002 | Create request type within category | 1. Select existing category<br>2. Click "Add Type"<br>3. Enter code "TEST_TYPE", names<br>4. Enable "Can Combine"<br>5. Click Create | Type appears under category, combination checkbox works |
| TC-RF-003 | Add form section to request type | 1. Select request type<br>2. Click "Add Section"<br>3. Enter code "test_section", title, order=1<br>4. Click Create | Section appears as tab in the request form |
| TC-RF-004 | Add required text field | 1. Select section<br>2. Click "Add Field"<br>3. Type=Text, Required=Yes<br>4. Enter code, labels<br>5. Click Create | Field appears in form, validation prevents empty submission |
| TC-RF-005 | Add dropdown field with options | 1. Create field with Type=Dropdown<br>2. Click "Options"<br>3. Add 3 options with values and labels<br>4. Save | Dropdown shows all options, selection saves correctly |
| TC-RF-006 | Configure repeatable section | 1. Create section with Is Repeatable=Yes<br>2. Set Min=1, Max=5<br>3. Add fields to section | Users can add 1-5 instances, cannot exceed max |
| TC-RF-007 | Test User Lookup field auto-population | 1. Create User Lookup field<br>2. Open request form as logged-in user | Field auto-populates with current user's name and email |
| TC-RF-008 | Test Activity Selector field | 1. Create Activity Selector field<br>2. Open request form<br>3. Select main activity, then sub-activity | Sub-activities filter based on main activity, requirements badges display |
| TC-RF-009 | Test file upload field | 1. Create File Upload field<br>2. Open request form<br>3. Upload a PDF file | File uploads successfully, filename displays |
| TC-RF-010 | Test form submission with all field types | 1. Create form with all 16 field types<br>2. Fill all fields<br>3. Submit request | Request saves with all data, appears in request list |

### Approval Workflow Test Cases (TC-WF-001 to TC-WF-010)

| ID | Scenario | Steps | Expected Result |
|----|----------|-------|-----------------|
| TC-WF-001 | Create basic workflow | 1. Navigate to Workflow Builder<br>2. Click "Create Workflow"<br>3. Enter name, select category<br>4. Add one stage with static approver | Workflow saves, appears in workflow list |
| TC-WF-002 | Add site-based condition | 1. Open workflow<br>2. Click "Add Condition"<br>3. Type=Site, Operator=Equals<br>4. Select specific site | Workflow only triggers for requests to that site |
| TC-WF-003 | Add zone-based condition | 1. Add condition Type=Zone<br>2. Select multiple zones using "In List" operator | Workflow triggers for any of the selected zones |
| TC-WF-004 | Add area-based condition | 1. Add condition Type=Area<br>2. Select specific areas | Workflow triggers only for those areas |
| TC-WF-005 | Configure multi-stage workflow | 1. Create workflow with 3 stages<br>2. Stage 1: Any approval<br>3. Stage 2: All approvals<br>4. Stage 3: 2 of 3 approvals | Stages progress correctly based on approval rules |
| TC-WF-006 | Test dynamic Site Manager approver | 1. Add stage with approver type "Site Manager"<br>2. Submit request for Site A<br>3. Check approval task | Task assigned to Site A's manager |
| TC-WF-007 | Test workflow priority | 1. Create two workflows for same category<br>2. Set priorities 10 and 20<br>3. Submit matching request | Higher priority workflow (20) is selected |
| TC-WF-008 | Test condition AND logic | 1. Add two conditions with AND<br>2. Submit request matching both<br>3. Submit request matching only one | First triggers workflow, second does not |
| TC-WF-009 | Test condition OR logic | 1. Add two conditions with OR<br>2. Submit request matching either | Workflow triggers for both scenarios |
| TC-WF-010 | Test workflow with no matching conditions | 1. Create workflow with specific conditions<br>2. Submit request that doesn't match | Default workflow is used, or error if none exists |

### Integration Test Cases (TC-INT-001 to TC-INT-010)

| ID | Scenario | Steps | Expected Result |
|----|----------|-------|-----------------|
| TC-INT-001 | End-to-end: Admin Visit request | 1. Create Admin Visit request<br>2. Select site, zone, area<br>3. Add visitor details<br>4. Submit | Request created, routed to correct approvers |
| TC-INT-002 | End-to-end: TEP + MOP combination | 1. Select Technical & Delivery category<br>2. Check both TEP and MOP types<br>3. Fill combined form<br>4. Submit | Single request with both type sections |
| TC-INT-003 | Approval with site-specific routing | 1. Submit request for Riyadh site<br>2. Login as Riyadh approver<br>3. Approve request | Request progresses, Jeddah approver not notified |
| TC-INT-004 | Multi-level approval progression | 1. Submit request triggering 3-stage workflow<br>2. Approve at L1<br>3. Approve at L2<br>4. Approve at L3 | Status updates at each stage, final approval completes request |
| TC-INT-005 | Rejection at intermediate stage | 1. Submit request<br>2. Approve L1<br>3. Reject at L2 | Request status = Rejected, no L3 task created |
| TC-INT-006 | Request with high-risk zone | 1. Submit request for Critical Infrastructure zone<br>2. Verify additional approval stages | Extra security approval stage is added |
| TC-INT-007 | External vendor request routing | 1. Login as external vendor user<br>2. Submit access request<br>3. Check approval routing | Request routed to vendor's internal liaison first |
| TC-INT-008 | Request modification after submission | 1. Submit request<br>2. Before approval, modify details<br>3. Save changes | Changes saved, audit log updated |
| TC-INT-009 | Bulk visitor request | 1. Create request with 10 visitors<br>2. Fill all visitor details<br>3. Submit | All 10 visitors saved in request_visitors table |
| TC-INT-010 | Request with material handling | 1. Select MHV type<br>2. Add 5 materials with details<br>3. Submit | Materials saved in request_materials table |

---

## Troubleshooting

### Common Issues and Solutions

**Issue: New category not appearing in request form**

Verify that the category has `Active = true` and at least one active request type with at least one active section containing at least one active field.

**Issue: Workflow not triggering for requests**

Check the following in order:
1. Workflow is active
2. Workflow is assigned to the correct request category
3. Conditions match the request data (site, zone, area, etc.)
4. Workflow priority is higher than competing workflows

**Issue: Approver not receiving tasks**

Verify that:
1. The user is correctly assigned as an approver in the stage
2. For dynamic approvers, the resolution data exists (e.g., site has a manager assigned)
3. The user has the necessary permissions to view approval tasks

**Issue: Form fields not saving data**

Ensure that:
1. Field codes are unique within the form
2. Field types match the expected data format
3. Required fields have values before submission

---

*This document is maintained by the Centre3 development team. For questions or updates, contact the system administrator.*
