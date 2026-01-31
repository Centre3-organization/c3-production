# CENTRE3 - Facility Access Management System TODO

## Core Infrastructure
- [x] Database schema for users, departments, roles
- [x] Database schema for sites, zones, areas (hierarchical)
- [x] Database schema for access requests and approvals
- [x] Database schema for security alerts
- [x] Custom email/password authentication system

## User Management
- [x] User CRUD operations
- [x] Department management
- [x] Role management with permissions
- [x] Profile management page
- [x] Role-based access control (RBAC)

## Facility Management
- [x] Sites management (CRUD)
- [x] Zones management (linked to sites)
- [x] Areas management (linked to zones)
- [x] Hierarchical facility view

## Access Request Workflow
- [x] Request creation form
- [x] Request list with filtering
- [x] L1 Approval stage
- [x] L2 Approval stage
- [x] Request status tracking

## Security Operations
- [x] Real-time security alerts dashboard
- [x] Badge notifications for alerts
- [x] Global overwatch map view
- [x] Alert management (acknowledge, resolve)

## Dashboard & Reports
- [x] Main dashboard with statistics
- [x] Reports page with analytics
- [x] Activity logs

## Authentication
- [x] Email/password login page
- [x] Access denied page
- [x] 404 Not Found page
- [x] Session management

## UI/UX
- [x] Sidebar navigation layout
- [x] Theme configuration (professional enterprise style)
- [x] Responsive design
- [x] Loading states and error handling

## Migration Notes
- [x] Migrated from old project structure
- [x] Fixed TypeScript errors for simplified user schema
- [x] Database tables preserved from existing data

## Bug Fixes
- [x] User mohsiin@gmail.com not found in database - added user as admin

## Password Authentication Implementation
- [x] Add passwordHash column to users table
- [x] Implement password hashing with bcrypt
- [x] Update login router to verify password
- [x] Set password for admin mohsiin@gmail.com

## Session Bug Fix
- [x] Login authenticates but redirects back to login page - fixed by setting JWT cookie on server side

## Font Update
- [x] Change default font to Montserrat across the entire website

## Brand Guidelines Compliance
- [x] Extract brand specifications from guidelines PDF
- [x] Update color palette (primary, secondary, accent colors)
- [x] Update typography to match brand fonts
- [x] Replace logo with brand-compliant logo
- [x] Update icons to match brand style
- [x] Update UI components styling
- [x] Ensure imagery follows brand guidelines
- [x] Verify 100% brand compliance

## Logo Size Update
- [x] Increase sidebar logo size to 200x50px

## Font Update - STC Forward
- [x] Add STC Forward font file to project
- [x] Update CSS to use STC Forward as primary font with Montserrat fallback

## Group Management System Expansion
### Database Schema
- [x] Create groups table with hierarchy support
- [x] Create user_group_membership table
- [x] Create group_access_policy table
- [x] Create group_security_settings table
- [x] Seed initial group hierarchy (Center3 Employees, External Vendors)

### Backend Routers
- [x] Groups CRUD operations router
- [x] User-Group membership management router
- [x] Group access policy management router
- [x] Group security settings router
### Frontend UI
- [x] Groups management page with hierarchy view
- [x] Group creation/edit dialog
- [x] User-group membership management dialog
- [x] Access policy configuration dialog
- [x] Security settings dialog
- [x] Navigation integration to show group memberships

### Integration
- [x] Update navigation to include Groups
- [x] Integrate group access with existing permission system
- [x] Add Groups column to Users table
- [x] Add group-based access evaluation logic
- [x] Write and pass unit tests for Groups module

## User Management Updates
- [x] Remove all unknown users from database (keep only mohsiin@gmail.com)
- [x] Update users table schema to add firstName, lastName, phone, departmentId fields
- [x] Update Add User form with: First name, Last name, Email, Phone Number, Temporary Password, Role, Department
- [x] Update backend to handle new user fields

## Fix Automatic User Creation (Jan 26, 2026)
- [x] Fix automatic user creation on OAuth callback - only update existing users
- [x] Fix automatic user creation in SDK authenticateRequest - only update existing users  
- [x] Clean database to keep only admin account (mohsiin@gmail.com)
- [x] Verify no new users are created automatically on page visits

## UI Fixes (Jan 26, 2026)
- [x] Fix Access Policies dialog - make it wider for better visibility

## Bug Fixes (Jan 26, 2026)
- [x] Fix Parent Group dropdown showing deleted groups - filter to only show active groups

## Dynamic Approval Workflow Module (Jan 26, 2026)

### Phase 1: Database Schema
- [x] Create approval_workflows table
- [x] Create workflow_conditions table
- [x] Create approval_stages table
- [x] Create stage_approvers table
- [x] Create approval_roles table
- [x] Create user_approval_roles table
- [x] Create shift_schedules table
- [x] Create shift_definitions table
- [x] Create shift_assignments table
- [x] Create approval_delegations table
- [x] Create approval_instances table
- [x] Create approval_tasks table
- [x] Create approval_history table
- [x] Create escalation_rules table

### Phase 2: User & Group Enhancements
- [x] Add manager_id, employee_type, work_schedule_id to users
- [x] Add can_delegate, out_of_office_delegate_id to users
- [x] Add approval_config, internal_liaison_user_id to groups
- [x] Add working_hours, sla_override_hours to groups
- [x] Add role_in_group, reports_to_user_id, can_approve to group_members

### Phase 3: Approval Workflow Engine
- [x] Create workflow selection algorithm
- [x] Create condition evaluation engine
- [x] Create approver resolution logic
- [x] Create stage progression logic
- [x] Create approval orchestrator

### Phase 4: Shift Management
- [x] Create shift schedule CRUD operations
- [x] Create shift assignment management
- [x] Create current shift resolution algorithm
- [x] Create time-based routing logic

### Phase 5: Delegation System
- [x] Create delegation CRUD operations
- [x] Create delegation validation logic
- [x] Create delegation resolution in approval routing

### Phase 6: Admin UI
- [x] Create Workflow Builder page
- [x] Create Workflow Conditions builder
- [x] Create Stage Configuration panel
- [x] Create Shift Management page
- [x] Create Delegation Dashboard
- [x] Create Approval Roles management

### Phase 7: Update Approval Pages
- [x] Update L1 Approval to use new workflow
- [x] Update L2 Approval to use new workflow
- [x] Create unified Approval Dashboard
- [x] Add approval history view

### Phase 8: Testing
- [x] Test workflow selection
- [x] Test condition evaluation
- [x] Test shift-based routing
- [x] Test delegation system
- [x] Test escalation logic

## Approval Process Documentation & Migration (Jan 26, 2026)

### Documentation
- [x] Write comprehensive approval process documentation
- [x] Document all approval workflow components
- [x] Document approver types and resolution logic
- [x] Document shift-based routing
- [x] Document delegation system
- [x] Document escalation rules
- [x] Create test cases for all scenarios

### Migration to New Workflow System
- [x] Remove old L1/L2 hardcoded approval logic
- [x] Create "Standard Access Request" workflow with L1 stage
- [x] Create "Standard Access Request" workflow with L2 stage
- [x] Seed example workflows in database
- [x] Update L1Approval page to use workflow engine
- [x] Update L2Approval page to use workflow engine
- [x] Test complete approval flow

## Workflow Fixes (Jan 26, 2026)
- [x] Add duplicate name validation to workflow creation
- [x] Delete duplicate "Standard Access Request" workflows from database
- [x] Create 5 test cases for L3 approval workflow testing

## Error Handling & Dialogs (Jan 26, 2026)
- [x] Fix date formatting issue in request submission (passing Date objects instead of strings)
- [x] Create reusable ErrorDialog component with proper branding
- [x] Create reusable ConfirmDialog component with proper branding
- [x] Update request submission to use proper error dialogs
- [x] Update user deletion to use confirmation dialogs
- [x] Update workflow deletion to use confirmation dialogs
- [x] Update group deletion to use confirmation dialogs
- [x] Replace all toast.error calls with proper error dialogs for critical errors

## Request Submission Bug Fix (Jan 26, 2026)
- [x] Fix "try again or contact administrator" error when submitting requests
- [x] Add missing requestType field to approvalInstances insert
- [x] Fix instanceId extraction from insert result (use correct result structure)

## Approvals UI & Database Cleanup (Jan 26, 2026)
- [x] Create Approvals page UI showing all approval tasks
- [x] Add approval level column to show L1/L2/L3 etc.
- [x] Add Approvals link to sidebar navigation
- [x] Delete all existing requests from database for clean testing

## Login Page Redesign (Jan 26, 2026)
- [x] Redesign login page with split layout (image left, form right)
- [x] Use dark background with dramatic data center image
- [x] Apply center3 brand colors (purple gradient)
- [x] Add center3 logo and tagline on left side
- [x] Style form panel with dark theme

## Login Page Fixes (Jan 26, 2026)
- [x] Remove "Haven't joined yet? Register now" footer text
- [x] Remove "To manage your own personal and business access, go to myaccess" text
- [x] Update logo with new high-def version
- [x] Create white version of logo for dark backgrounds
- [x] Fix auto-login after logout issue (added /api/auth/logout route)
- [x] Make text color white for better visibility

## STC Forward Font for Arabic (Jan 26, 2026)
- [x] Add STC Forward font for Arabic text support
- [x] Configure font-family to use STC Forward for Arabic content
- [x] Test Arabic text rendering with the new font

## Multi-Language Support Implementation (Jan 26, 2026)
- [x] Install i18next and react-i18next dependencies
- [x] Set up i18next configuration with language detection
- [x] Create English translation file (en.json)
- [x] Create Arabic translation file (ar.json)
- [x] Implement language selector component in header
- [x] Add RTL layout support for Arabic
- [x] Integrate translations into navigation menu
- [x] Integrate translations into login page
- [x] Integrate translations into dashboard
- [x] Integrate translations into forms and buttons
- [x] Store language preference in localStorage and user profile

## i18n Fixes & Enhancements (Jan 26, 2026)
- [x] Fix language dropdown on login page - ensure it works in both directions (EN→AR and AR→EN)
- [x] Fix RTL accent bar position - move to right side in Arabic mode
- [x] Create Translation Management page in Settings for manual string editing
- [x] Extend Arabic translations to Requests pages
- [x] Extend Arabic translations to Approvals pages
- [x] Extend Arabic translations to Sites/Zones/Areas pages
- [x] Extend Arabic translations to Settings pages
- [x] Extend Arabic translations to sidebar navigation

## Translation & RTL Fixes (Jan 26, 2026)
- [x] Remove EN/AR download buttons from Translation Management page
- [x] Add status filter (Done/Missing/Modified) to Translation Management
- [x] Fix sidebar to move to right side in RTL (Arabic) mode
- [x] Add sidebar navigation translations for Arabic
- [x] Add profile dropdown translations (Profile, Settings, Logout)
- [x] Ensure section headers in sidebar are translated

## Complete Translation Coverage (Jan 26, 2026)
- [x] Add translations for request form (all tabs, fields, buttons)
- [x] Add translations for visitor management dialogs
- [x] Add translations for approval action dialogs (approve/reject)
- [x] Add translations for L1/L2 approval pages
- [x] Add translations for Settings page tabs (General, Departments, Master Data, etc.)
- [x] Add translations for Sites/Zones/Areas management pages
- [x] Add translations for Users & Roles management page
- [x] Add translations for Groups management page
- [x] Add translations for Workflow Builder page
- [x] Add translations for error messages and validation text
- [x] Integrate useTranslation hook into all remaining components

## Login Page Image & Design Update (Jan 26, 2026)
- [x] Replace licensed data center image with new blue neon mainframe image
- [x] Make login form panel (black part) bigger (now 55% width)
- [x] Style login form like STC reference with icons and underline inputs
- [x] Add footer links (Privacy Notice, Terms of use, FAQ)
- [x] Remove Register tab from login screen

## Login Page Additional Updates (Jan 26, 2026)
- [x] Add proper description text on left panel
- [x] Move language selector down on white panel (below login form)
- [x] Make language selector bigger with border styling

## Translation Improvements (Jan 26, 2026)
- [x] Fix missing translation strings (webhooks, language names)
- [x] Add translation completeness progress bar to Translation Management
- [ ] Implement server-side translation for dynamic database content
- [ ] Add translatable fields to database schema (departments, sites, workflow stages)

## Dynamic Request Type System (Jan 26, 2026)

### Phase 1: Database Schema
- [x] Create request_categories table (base processes)
- [x] Create request_types table (sub-processes like TEP, WP, MOP, MHV)
- [x] Create form_sections table (tabs for each type)
- [x] Create form_fields table (dynamic fields per section)
- [x] Create field_options table (dropdown options)
- [x] Create request_visitors table (fixes bug: only 1 visitor saved)
- [x] Create request_materials table (for MHV)
- [x] Create request_vehicles table (for VIP/MHV)
- [x] Add category_id, selected_type_ids, form_data columns to requests table

### Phase 2: Seed Data
- [x] Seed Admin Visit category
- [x] Seed Technical & Delivery category with combination rules
- [x] Seed request types (Admin Visit, TEP, WP, MOP, MHV)
- [x] Seed form sections for Admin Visit
- [x] Seed form sections for TEP
- [x] Seed form sections for WP
- [x] Seed form sections for MOP
- [x] Seed form sections for MHV
- [x] Seed form fields for all sections

### Phase 3: Backend APIs
- [x] Create requestCategories router (CRUD)
- [x] Create requestTypes router (CRUD)
- [x] Create formDefinition router (get form structure)
- [x] Create fieldOptions router (dependent dropdown options)
- [ ] Modify request submission to handle dynamic form data
- [ ] Add request visitors, materials, vehicles to submission

### Phase 4: Frontend Components
- [x] Create CategorySelector component
- [x] Create TypeSelector component with combination rules
- [x] Create DynamicForm component with tabs
- [x] Create SectionRenderer component (merged into DynamicForm)
- [x] Create FieldRenderer component for all field types
- [x] Create RepeatableSection component for visitors/materials
- [x] Create condition evaluator for show/hide logic (in FieldRenderer)

### Phase 5: Integration
- [x] Update NewRequest page to use dynamic form
- [x] Integrate with existing approval workflow
- [x] Test all request type combinations
- [x] Verify visitor data is properly saved (multiple visitors)

## Dynamic Request Type System Enhancements (Jan 26, 2026)

### Phase 1: UI Enhancement - Pop-up Dialogs
- [x] Convert category selection to pop-up dialog
- [x] Convert type selection to pop-up dialog
- [x] Maintain current styling in dialog format

### Phase 2: Complete Request Submission
- [x] Wire up form data to save visitors to request_visitors table
- [x] Wire up form data to save materials to request_materials table
- [x] Wire up form data to save vehicles to request_vehicles table
- [x] Store dynamic form fields in form_data JSON column

### Phase 3: Admin Visit Form Sections
- [x] Seed form sections for Admin Visit type (already seeded with 6 sections)
- [x] Seed form fields for Admin Visit sections (30 fields total)
- [x] Test Admin Visit form rendering

### Phase 4: Request Type Configuration Admin UI
- [x] Create Request Types page in Settings
- [x] Build Category management UI (CRUD)
- [x] Build Type management UI (CRUD)
- [x] Build Section management UI (CRUD)
- [x] Build Field management UI (CRUD)
- [x] Add field options editor for dropdowns

## Request Type Configuration Enhancements (Jan 26, 2026)

### Phase 1: Field Options Editor
- [x] Create FieldOptionsEditor component for managing dropdown/radio options
- [x] Support adding, editing, removing options with label/value pairs
- [x] Support Arabic translations for option labels
- [x] Integrate into field edit dialog

### Phase 2: Drag-and-Drop Reordering
- [x] Install @dnd-kit/core and @dnd-kit/sortable
- [x] Add drag-and-drop to sections list
- [x] Add drag-and-drop to fields list
- [x] Create backend endpoint to update sort orders in batch

### Phase 3: Form Preview Mode
- [x] Create FormPreview component that renders the form as users will see it
- [x] Add Preview button to type detail view
- [x] Show all sections as tabs with their fields
- [x] Display field types, required indicators, and placeholders

## Conditional Field Logic UI (Jan 26, 2026)

### Phase 1: Design & Component Structure
- [x] Create ConditionBuilder component for visual rule editing
- [x] Support single conditions (field → operator → value)
- [x] Support condition groups with AND/OR logic
- [x] Show available fields from same section for selection

### Phase 2: Integration
- [x] Add ConditionBuilder to field edit dialog
- [x] Convert visual conditions to JSON for storage
- [x] Parse existing JSON conditions for editing
- [x] Update field preview to show condition summary

### Phase 3: Testing
- [ ] Test creating new conditions visually
- [ ] Test editing existing conditions
- [ ] Test condition evaluation in form rendering

## Dynamic Approvals UI Redesign (Jan 26, 2026)

### Phase 1: Sidebar Navigation
- [x] Remove hardcoded "L1 Approval" and "L2 Approval" menu items
- [x] Keep single "Approvals" menu item → Shows ALL pending tasks
- [x] Add "Approval History" menu item for past decisions

### Phase 2: Backend API Updates
- [x] Update approval tasks API to include stageName from workflow config
- [x] Add stageOrder and totalStages to approval task response
- [x] Add getMyApprovalHistory endpoint for approval history
- [x] Add getApprovalStats endpoint for dashboard cards

### Phase 3: Approvals Dashboard Redesign
- [x] Replace fixed L1/L2/L3 cards with dynamic cards (My Pending, Awaiting Others, Completed Today)
- [x] Replace L1/L2/L3 badges with actual stage names
- [x] Add stage filter dropdown
- [x] Add stage breakdown chips with click-to-filter
- [x] Add search by stage name

### Phase 4: Stage Progress Visualization
- [x] Add visual stage progress indicator to task cards
- [x] Show stage progress bar (current/total)
- [x] Highlight current stage
- [x] Show workflow name in task details

### Phase 5: Approval History Page
- [x] Create ApprovalHistory page for past decisions
- [x] Add pagination support
- [x] Add status filter (approved/rejected)
- [x] Show decision date and details


## Hierarchical Master Data Types (Jan 27, 2026)

### Phase 1: Database Schema
- [x] Add parentId column to siteTypes table for self-referencing hierarchy
- [x] Add parentId column to zoneTypes table for self-referencing hierarchy
- [x] Add parentId column to areaTypes table for self-referencing hierarchy
- [x] Add level/depth column to track hierarchy depth
- [x] Add nameAr column for Arabic translations
- [x] Add sortOrder column for ordering

### Phase 2: Backend APIs
- [x] Update siteTypes router to support parent-child CRUD
- [x] Update zoneTypes router to support parent-child CRUD
- [x] Update areaTypes router to support parent-child CRUD
- [x] Add getHierarchy endpoint to return tree structure (getSiteTypesTree, etc.)
- [x] Add getChildren endpoint to get children of a parent type
- [x] Add updateOrder endpoint for drag-and-drop reordering

### Phase 3: Master Data UI
- [x] Redesign type management with tree/hierarchy view
- [x] Add expand/collapse for parent types
- [x] Add "Add Child" action to parent types
- [x] Show level indicator (L0, L1, L2, etc.)
- [x] Support Arabic name display

### Phase 4: Request Creation Integration
- [x] Create HierarchicalTypeSelector component for cascading selection
- [x] Add site_type, zone_type, area_type field types to FieldRenderer
- [x] Show parent → child dropdown chain with breadcrumb path
- [x] Store selected type ID and path in form data


## User Management Enhancements (Jan 27, 2026)

### Phase 1: New User Actions
- [x] Add "Email User" action to dropdown menu
- [x] Add "Change Password" action with dialog
- [x] Add "Activate" action for inactive users
- [x] Add "Deactivate" action for active users

### Phase 2: Filters
- [x] Add Groups filter dropdown
- [x] Add Status filter (Active/Inactive/All)
- [x] Add Role filter dropdown
- [x] Add Department filter dropdown
- [x] Add clear filters button


## Workflow Builder Condition Enhancement (Jan 27, 2026)

### Phase 1: Investigation
- [ ] Review current workflow condition implementation
- [ ] Identify issues with Add Condition functionality

### Phase 2: Enhanced Condition Types
- [ ] Add Site condition type
- [ ] Add Zone condition type  
- [ ] Add Area condition type
- [ ] Add Group condition type
- [ ] Add Process/Request Type condition type
- [ ] Add User Role condition type
- [ ] Add Department condition type
- [ ] Add Time-based conditions (working hours, shifts)
- [ ] Add Value-based conditions (visitor count, duration)

### Phase 3: Condition Builder UI
- [ ] Fix Add Condition button functionality
- [ ] Create condition type selector dropdown
- [ ] Create dynamic value selector based on condition type
- [ ] Add condition operator selection (equals, contains, greater than, etc.)
- [ ] Add condition grouping (AND/OR logic)
- [ ] Add condition preview/summary

### Phase 4: Backend Updates
- [ ] Update workflow conditions schema if needed
- [ ] Add condition evaluation logic for all types
- [ ] Add validation for condition configurations


## Workflow Builder Condition Enhancement - COMPLETED (Jan 27, 2026)

### Phase 1: Fix Add Condition Dialog
- [x] Investigated why Add Condition wasn't working
- [x] Fixed the condition dialog to open properly
- [x] Ensured condition type dropdown shows all options

### Phase 2: Enhanced Condition Types (All 23 types now available)
Location conditions:
- [x] Site
- [x] Zone
- [x] Area
- [x] Region

Request conditions:
- [x] Process Type
- [x] Category
- [x] Sub-Category
- [x] Activity Risk Level
- [x] Visitor Count
- [x] Request Duration (hours)
- [x] VIP Visit
- [x] Escort Required
- [x] Access Level

Requester conditions:
- [x] Requester Group
- [x] Requester Type
- [x] Requester Department
- [x] Requester Role

Special conditions:
- [x] Has MOP
- [x] Has MHV

Time conditions:
- [x] Time Range
- [x] Working Hours
- [x] Shift
- [x] Day of Week

### Phase 3: UI Improvements
- [x] Added categorized condition type dropdown with icons
- [x] Added dynamic value selection based on condition type
- [x] Added logical grouping (AND/OR) support with Group 0, 1, 2, etc.
- [x] Display conditions with proper labels in table format
- [x] Added delete button for each condition

### Phase 4: Testing
- [x] Created 16 unit tests for workflow conditions
- [x] All tests passing
- [x] Verified UI works correctly in browser


## Access Grant Options Feature (Jan 27, 2026)

### Phase 1: Database & Backend
- [x] Add entryMethod field to approvalInstances table (qr_code, rfid, card)
- [x] Add qrCodeData field to store generated QR code information
- [x] Add cardNumber field for card-based access
- [x] Add rfidTag field for RFID-based access
- [x] Add accessGrantedBy and accessGrantedAt fields
- [x] Create QR code generation utility (using qrcode npm package)
- [x] Update approval completion endpoint to accept entry method
- [x] Create updateAccessMethod endpoint for changing method on approved requests

### Phase 2: Final Approval UI
- [x] Add entry method selection dialog on final stage approval
- [x] Implement QR Code option with generation
- [x] Implement RFID option with tag input
- [x] Implement Card option with card number input
- [x] Show generated QR code after approval

### Phase 3: Approved Request View
- [x] Add "Access Method" section to request details (green highlighted box)
- [x] Display current entry method (QR/RFID/Card) with icon badges
- [x] Show QR code image if QR method selected
- [x] Add "Change Method" button to modify entry method
- [x] Add "Regenerate QR" button for QR method
- [x] Show who granted access and when
- [x] Copy QR code data to clipboard functionality

## Resend Access Credentials Feature (Jan 27, 2026)

### UI Implementation
- [x] Add "Resend" button to Access Method section in request details
- [x] Create dropdown menu with Email/SMS/WhatsApp options
- [x] Show loading state while sending
- [x] Display success/error toast after sending

### Channel Implementation
- [x] Email option - validates visitor email before sending
- [x] SMS option - validates visitor phone before sending  
- [x] WhatsApp option - opens WhatsApp with pre-filled message containing access details

## Login Page Text Update (Jan 27, 2026)
- [x] Update login page title to "Welcome to Centre3"
- [x] Update login page description text
- [x] Add Arabic translation for new text

## Approval History QR Code Fix (Jan 27, 2026)
- [x] Add QR code display to Decision Details dialog in Approval History
- [x] Add resend credentials button (Email/SMS/WhatsApp) to Decision Details dialog
- [x] Fetch access method data for approved requests in history view

## Board-Level Presentation (Jan 27, 2026)
- [ ] Gather brand guidelines (colors, fonts, logo)
- [ ] Compile key features of Centre3 system
- [ ] Create slide content outline
- [ ] Generate professional presentation slides

## Board-Level Presentation (Jan 27, 2026)
- [x] Create Centre3 board presentation following brand guidelines
- [x] Include all major modules and features (13 modules)
- [x] Add business value metrics and ROI information
- [x] Include implementation roadmap (4 phases)
- [x] Design 15 professional slides with Swiss International Tech aesthetic

## Enhanced Approval Dialog (Jan 28, 2026)

### Backend Updates
- [x] Add "need_clarification" status to approvalInstances
- [x] Add clarificationTarget field (last_approver / requestor)
- [x] Update approveTask endpoint to handle optional comments
- [x] Update rejectTask endpoint to require mandatory comments
- [x] Create needClarification endpoint with routing logic
- [x] Store comments in approval history with proper tagging

### Frontend Updates
- [x] Create unified ApprovalDialog component with pop-up
- [x] Approve action: pop-up with optional comments field
- [x] Reject action: pop-up with mandatory comments field (validation)
- [x] Need Clarification action: pop-up with sub-options (Last Approver / Requestor)
- [x] Display comments on request details tagged to the action
- [x] Update Approvals page to use new dialog
- [x] Update L1/L2 approval pages to use new dialog


## Database Fresh Start Cleanup (Jan 28, 2026)
- [x] Delete all requests and related data (visitors, materials, vehicles)
- [x] Delete all approval instances, tasks, and history
- [x] Delete all sites, zones, and areas
- [x] Delete all workflows, conditions, stages, and approvers
- [x] Delete all schedules, shifts, and delegations
- [x] Delete all groups and group memberships
- [x] Delete all master data (departments, roles, etc.)
- [x] Keep translations intact
- [x] Keep request type configurations intact
- [x] Keep users intact


## Master Data - Countries & Cities (Jan 28, 2026)
- [x] Add all MENA countries (Saudi Arabia, UAE, Qatar, Kuwait, Bahrain, Oman, Egypt, Jordan, Lebanon, Iraq, Syria, Yemen, Libya, Tunisia, Algeria, Morocco, Sudan, Palestine)
- [x] Add Turkey and Pakistan
- [x] Add major cities for each country
- [x] Preserve existing data (e.g., Riyadh if already exists)
- [x] Remove duplicate cities (Riyadh, Manama, Tripoli)


## Sites, Zones & Areas Setup (Jan 28, 2026)
- [x] Read Excel file to extract 17 sites data
- [x] Create all 17 sites with type = Data Centre
- [x] Create zones for each site (GF, 1F, 2F, 3F, Others)
- [x] Set zone properties: Access Policy = Open, Security = Medium, Security Controls = None, Infra Specs = None
- [x] Create areas for each zone based on Excel data (Building Gate, Main Gate, Employee Office, Loading Area, Data Halls, MMRs, Rooftop, Building Facilities)

**Summary:**
- 17 Sites created (RDC46, RDC05, RDC301, ITCC, RDCKAFD, RDC102, RDC103, RDC104, DDC21, DDC352, DDC371, JDC04, JDC55, JDC203, MDC20, QDC26, MKDC34)
- 85 Zones created (5 per site: GF, 1F, 2F, 3F, Others)
- 300+ Areas created (Building Gate, Main Gate, Employee Office, Loading Area, Data Halls, MMRs, Rooftop, Building Facilities)


## Sites Region & City Update (Jan 28, 2026)
- [x] Update all sites with country = Saudi Arabia
- [x] Update all sites with type = Data Centre
- [x] Update Central region sites (RDC46, RDC05, RDC301, ITCC, RDCKAFD, RDC102, RDC103, RDC104) with city = Riyadh
- [x] Update Eastern region site (QDC26) with city = Qassim
- [x] Update Eastern region sites (DDC21, DDC352, DDC371) with city = Dammam
- [x] Update Western region sites (JDC04, JDC55, JDC203) with city = Jeddah
- [x] Update Western region site (MDC20) with city = Madinah
- [x] Update Western region site (MKDC34) with city = Makkah


## Master Data UI - Missing Menu Items (Jan 28, 2026)
- [x] Investigate current Master Data navigation structure
- [x] Add Activities tab (with Main Activities and Sub-Activities sub-tabs)
- [x] Add Role Types tab to Master Data
- [x] Add Approvers tab to Master Data
- [x] Create backend endpoints for Activities CRUD
- [x] Create backend endpoints for Role Types CRUD
- [x] Create backend endpoints for Approvers CRUD
- [x] Reorder tabs: Activities, Role Types, Approvers, Countries, Regions, Cities, Site Types, Zone Types, Area Types
- [x] Create database tables for mainActivities, subActivities, roleTypes, approvers
- [x] Add unit tests for new Master Data endpoints


## Activities Data Migration from Excel (Jan 28, 2026)
- [x] Clear existing main activities and sub-activities from database
- [x] Add Main Activities: Cabling Changes, Checks/Visit/Audit, Facilities & Civil Work, HW Changes, Input/Output, Security & Safety Changes, IT System & Software
- [x] Add Sub-Activities with requirements (Needs RFC, HRS, MOP, MHV, Room Selection)
- [x] Update subActivities schema to include requirement fields
- [x] Verify all 67 sub-activities are properly linked to main activities


## Sub-Activities UI and Access Request Integration (Jan 29, 2026)
- [x] Update Sub-Activities UI table to display requirement columns (RFC, HRS, MOP, MHV, Room Selection) as badges
- [x] Add Arabic translations for all main activity and sub-activity names
- [x] Integrate requirements into Access Request form - show/hide RFC, HRS, MOP, MHV fields based on selected sub-activity
- [x] Create ActivitySelectorField component with cascading main/sub-activity selection
- [x] Display requirement badges when sub-activity is selected


## Magnetic Card Management (MCM) Module (Jan 29, 2026)

### Phase 1: Database Schema
- [x] Create magneticCards table (card info, status, dates)
- [x] Create cardholders table (personal info, ID details) - merged into magneticCards
- [x] Create cardAccessLevels table (card-to-access mapping)
- [x] Create cardAuditLog table (all card operations)
- [x] Create cardCompanies table (contractor/client companies)
- [x] Create mcmAccessLevels table (predefined access levels)
- [x] Create mcmRequests table (card operation requests)

### Phase 2: Backend API
- [x] Create MCM router with CRUD operations
- [x] Implement card creation flow
- [x] Implement card modification flow
- [x] Implement card deactivation flow
- [x] Implement lost/damaged card flow
- [x] Implement block/unblock (admin only, no workflow)
- [x] Implement card renewal flow
- [ ] Implement bulk import/export
- [x] Add card search and filtering

### Phase 3: Workflow Integration
- [ ] Add MCM operation types to workflow system
- [ ] Configure workflow triggers for MCM operations
- [ ] Handle immediate actions (block, lost card deactivation)
- [ ] Implement approval callbacks for Siport sync

### Phase 4: Frontend UI
- [x] Create MCM Dashboard page
- [x] Create Card Request Form (5-tab wizard)
- [x] Create Card Directory page with filters
- [ ] Create My Card page for employees
- [x] Create Admin views (blocked cards, expiring cards)
- [ ] Create Bulk Operations page

### Phase 5: Navigation & Translations
- [x] Add MCM to sidebar navigation
- [x] Add English translations (basic)
- [ ] Add Arabic translations
- [ ] Add role-based menu visibility


## MCM UI Updates (Jan 30, 2026)
- [x] Update MCM New Card Request UI to match existing New Request form design

- [x] Remove MCM Dashboard and move statistics to Card Directory page

- [x] Remove MCM Dashboard from sidebar and rename Card Directory to Card Control

- [x] Add Integration Hub menu under Administration with Coming Soon page

- [x] Make User Lookup field type default to logged-in user in request forms


## User Creation Form Update (Jan 30, 2026)
- [ ] Add new user fields to database schema (userType, employeeId, department, contractorCompany, parentContractor, subContractorCompany, clientCompany, contractReference, contractExpiry, reportingTo, accountManager)
- [ ] Update backend router to handle new user fields
- [ ] Create multi-step wizard for user creation (Step 1: User Type, Step 2: User Info based on type, Step 3: System Access, Step 4: Photo, Step 5: Review)
- [ ] Implement conditional fields based on user type (Centre3 Employee, Contractor, Sub-Contractor, Client)
- [ ] Add validation rules (email unique, Centre3 email domain, contract expiry auto-deactivation)


## User Creation Form Update (Jan 30, 2026)
- [x] Add userType field (enum: centre3_employee, contractor, sub_contractor, client)
- [x] Add employeeId, jobTitle, contractorCompanyId, parentContractorId fields
- [x] Add subContractorCompany, clientCompanyId, contractReference, contractExpiry fields
- [x] Add reportingToId, accountManagerId, profilePhotoUrl fields
- [x] Update create user procedure with new fields and validation
- [x] Create multi-step wizard form (5 steps: User Type, Personal Details, System Access, Photo, Options)
- [x] Step 2 shows different fields based on user type selection


## Documentation - How To Guide (Jan 30, 2026)
- [x] Write How-To section for creating new request forms
- [x] Write How-To section for configuring approval workflows based on site/area/zone
- [x] Create 30 comprehensive test cases


## User Creation Form Updates (Jan 30, 2026)
- [x] Merge User Type & Personal Information into one step with dropdown
- [x] System Access step to pull roles from Roles and Permissions
- [x] Add cascading Site → Zone → Area dropdowns for site access
- [x] Add Contractor/Client companies to Master Data settings
- [x] Auto-populate contract reference/expiry from selected company


## Yakeen Verification Integration (Jan 30, 2026)
- [x] Create Yakeen verification backend endpoint (mock for now)
- [x] Add ID Type selection (National ID / Iqama) to user form
- [x] Add "Verify by Yakeen" button next to User Type dropdown
- [x] Auto-populate user data on successful verification
- [x] Show manual entry fields if verification fails
- [x] Add Arabic name fields (firstNameAr, lastNameAr)
- [x] Make Job Title field optional (not mandatory)
- [x] Add multi-site selection with "All Sites" option
- [x] Update cascading to work with multiple sites


## User Form UI Updates (Jan 30, 2026)
- [x] Restore left-side section navigation (like previous version)
- [x] Add ID/Iqama validation: ID starts with 1, Iqama starts with 2, max 10 digits
- [x] Update verify button text to "Verify with Yakeen"
- [x] Simplify User Type to 3 options: Centre3 Employee, Contractor, Client
- [x] Add Sub-Contractor as checkbox/dropdown within Contractor section


## User Form UI Enhancement (Jan 31, 2026)
- [x] Make form wider for better readability (min-w-[900px] max-w-[1200px])
- [x] Add Next/Previous navigation between sections (not just Create User)
- [x] Enhance overall visual design and polish (gradient header, progress bar, section summary)


## Companies Tab in Master Data (Jan 31, 2026)
### Database Schema
- [ ] Add company type field (contractor, sub_contractor, client)
- [ ] Add contact person fields (name, email, phone, position)
- [ ] Add contract fields (reference, start date, end date, value)
- [ ] Add company details (address, city, country, registration number)
- [ ] Add status field (active, inactive, suspended)

### Backend Router
- [ ] Update companies CRUD with new fields
- [ ] Add company search and filtering

### Frontend UI
- [ ] Add Companies tab to Master Data settings
- [ ] Create company list with filters
- [ ] Create add/edit company dialog with all fields
- [ ] Add contract status indicators (active, expiring soon, expired)

### Integration
- [ ] Update user form to fetch and display company details
- [ ] Auto-populate contract info when company is selected

## Companies Management in Master Data (Jan 30, 2026)
- [x] Add Companies tab to Master Data settings
- [x] Update cardCompanies schema with new fields (contactPersonName, contactPersonEmail, contactPersonPhone, contactPersonPosition, city, country, registrationNumber, status, notes)
- [x] Create getAllCompanies API endpoint
- [x] Create createCompany API endpoint with full company details
- [x] Create updateCompany API endpoint
- [x] Create getCompanyById API endpoint
- [x] Create deleteCompany API endpoint (soft delete/deactivate)
- [x] Create Companies UI with table view showing code, name, type, contract reference, contract period, contact person, status
- [x] Add filter buttons for All/Contractors/Sub-Contractors/Clients
- [x] Create Add Company dialog with sections: Basic Info, Contract Information, Contact Person, Additional Information
- [x] Create Edit Company dialog with same sections
- [x] Support parent company selection for sub-contractors
- [x] Add unit tests for companies CRUD operations

## User Creation Form Improvements (Jan 30, 2026)
- [x] Verify company integration with user creation form
- [x] Auto-populate contract details when company is selected
- [x] Redesign user creation form to be simpler and match previous form style
- [x] Remove complex wizard steps, use single-page form layout
- [x] Test form functionality

## SAP Fiori Design Implementation (Jan 30, 2026)
- [x] Research SAP Fiori design patterns (forms, inputs, layout)
- [x] Redesign user creation form with SAP Fiori patterns
- [x] Use Object Page layout with header and sections
- [x] Implement Form Groups with clear labels and mandatory indicators
- [x] Apply SAP Fiori spacing and typography while keeping Centre3 branding
- [x] Test the redesigned form

## User Form Left-Side Tabs (Jan 31, 2026)
- [x] Move tabs to left side as vertical navigation
- [x] Add Next/Previous buttons for section navigation
- [x] Ensure buttons use Centre3 branding colors (pink gradient)
- [x] Test form navigation flow

## User Form Fixes (Jan 31, 2026)
- [x] Fix Verify with Yakeen button position alignment
- [x] Remove duplicate Cancel (X and Cancel button)
- [x] Update colors to match Centre3 brand guidelines
- [x] Move sub-contractor checkbox from General to Organization tab
- [x] Add user role selection field
- [x] Change site access to dropdown with cascading Zone/Area selection
- [x] Create View User dialog with tabbed format showing all information
- [x] Create Edit User popup with same form structure
- [x] Test all form functionality

## User Form Styling Fixes (Jan 31, 2026)
- [x] Make font color black in form
- [x] Update sidebar button colors to match brand
- [x] Make ID Number input field bigger
- [x] Change Yakeen button to proper button labeled "Get Data with Yakeen"
- [x] Remove search icon from Yakeen button
- [x] Add Date of Birth field for Yakeen verification

## User Form Button and Layout Fixes (Jan 31, 2026)
- [x] Remove gradients from all buttons, use solid purple (#4f008c)
- [x] Fix scroll issue so Next/Previous buttons are visible
- [x] Remove X button from dialog header, keep only Cancel button

## Next Button Fix (Jan 31, 2026)
- [x] Fix bottom navigation bar to stay fixed at bottom when form content overflows

## View/Edit Dialog Fixes and Roles Integration (Jan 31, 2026)
- [x] Apply layout fix (min-h-0) to ViewUserDialog
- [x] Apply layout fix (min-h-0) to EditUserDialog
- [x] Integrate proper roles from Roles & Permissions system in NewUserForm
- [x] Integrate proper roles from Roles & Permissions system in EditUserDialog
- [x] Remove hardcoded user/admin role options

## View/Edit Dialog Button Style Fix (Jan 31, 2026)
- [x] Remove gradient from ViewUserDialog buttons, use solid purple (#4f008c)
- [x] Remove gradient from EditUserDialog buttons, use solid purple (#4f008c)
- [x] Populate Edit form with existing user data when opening (already implemented in useEffect)

## Groups-Companies Integration (Jan 31, 2026)
- [x] Review current Groups and Companies schema structure
- [x] Update Groups schema to link with Companies master data (companyId)
- [x] Add group type field (internal/contractor/client) to Groups
- [x] Update Groups UI to auto-populate from Companies for external groups
- [x] Update User form to use integrated Groups with company data (already uses companies directly)
- [x] Test the Groups-Companies integration

## Groups Creation Bug Fix (Jan 31, 2026)
- [x] Fix companyId column issue when creating groups
- [x] Verify groups table has companyId column in database

## Groups Creation Bug Fix 2 (Jan 31, 2026)
- [x] Fix database column mismatch in groups table insert query (added default values for timezone, createdAt, updatedAt, workingHours)

## Groups Creation Bug Fix 3 (Jan 31, 2026)
- [x] Set default values for all remaining columns in groups table (groupCategory, requiresApprovalChain, defaultWorkflowId, approvalConfig, internalLiaisonUserId, internalLiaisonGroupId, slaOverrideHours)

## Groups Creation Test (Jan 31, 2026)
- [x] Create 10 test groups to verify the fix works (4 internal, 3 contractor, 3 client - all created successfully)

## Groups Company Auto-Populate Fix (Jan 31, 2026)
- [x] Fix company selection to auto-populate contact information fields from Master Data (was working - client companies just didn't have contact info in Master Data)

## Groups UI Tooltip (Jan 31, 2026)
- [x] Add tooltip explaining Primary/Secondary member designation in Manage Members dialog (added help icon with tooltip next to Primary label)

## Security Hardening Implementation (Jan 31, 2026)

### Phase 1: Critical Security
- [x] Install security dependencies (helmet, express-rate-limit, xss, etc.)
- [x] Implement rate limiting middleware for all endpoints
- [x] Add authentication rate limiting (5 attempts per 15 minutes)
- [x] Add password reset rate limiting (3 attempts per hour)
- [x] Implement CSRF protection middleware
- [x] Add security headers using Helmet.js
- [x] Configure secure cookie settings
- [x] Add foreign key constraints to database schema

### Phase 2: Authentication Security
- [x] Create password validator with strong policy (12+ chars, complexity)
- [x] Implement secure session management with session IDs
- [x] Add session revocation capability
- [x] Create MFA service infrastructure (TOTP)
- [x] Add backup codes generation for MFA
- [x] Implement RBAC (Role-Based Access Control) system
- [x] Add tenant isolation middleware

### Phase 3: Input Validation & Injection Prevention
- [x] Create comprehensive input validation utilities
- [x] Add XSS sanitization for all string inputs
- [x] Implement safe ID validation
- [x] Add Saudi National ID and Iqama validation
- [x] Create safe search string utility for LIKE queries
- [x] Add SQL injection prevention helpers

### Phase 4: Data Protection
- [x] Implement AES-256-GCM encryption utilities
- [x] Create PII masking utilities for logging
- [x] Add encryption for sensitive fields (ID numbers, etc.)
- [x] Implement hash-for-search functionality

### Phase 5: Security Monitoring
- [x] Create security events table in database
- [x] Implement security event logging service
- [x] Add event types (login success/failure, MFA, password changes, etc.)
- [x] Create security alerting for high/critical events
- [x] Implement audit trail for compliance (all data changes logged)

### Phase 6: Testing & Verification
- [x] Write unit tests for password validator (12 tests)
- [x] Write unit tests for encryption utilities (22 tests)
- [x] Write unit tests for input validation (24 tests)
- [x] Test rate limiting functionality
- [x] Verify CSRF protection works

### Phase 7: Documentation
- [x] Create detailed release notes document in Word format


## Workflow Builder Documentation (Jan 31, 2026)
- [x] Document how the workflow builder works
- [x] Analyze 50 use cases for feature coverage
- [x] Identify implemented vs missing features
- [x] Create comprehensive Word document with recommendations

### Use Case Analysis Summary:
- ✅ 40 use cases PASS (fully implemented)
- ⚠️ 6 use cases PARTIAL (need minor additions)
- ❌ 4 use cases MISSING (require new features)

### Missing Features Identified:
- [ ] Parallel approval stages
- [ ] Conditional stage skipping
- [ ] Return to previous stage for revision
- [ ] Workflow branching logic


## RBAC System Implementation (Jan 31, 2026) - APPROVED & COMPLETED

### Phase 1: Database Schema
- [x] Create system_roles table with predefined roles (9 roles seeded)
- [x] Create permissions table with module:action structure (40 permissions)
- [x] Create role_permissions junction table
- [x] Create userSystemRoles assignment table
- [x] Create dataScopeRules table
- [x] Create userSiteAssignments table
- [x] Create userZoneAssignments table

### Phase 2: Core Services
- [x] Create enterprise-rbac.service.ts with permission checking
- [x] Implement getDataScopeFilter for visibility rules
- [x] Create permissionMiddleware.ts for API protection
- [x] Implement role-based data filtering in requests router

### Phase 3: Workflow Engine Enhancement
- [x] Add Send Back action to workflow stages (sendBackRequest function)
- [x] Implement send back target types (requestor, previous_stage, specific_stage, specific_person, group)
- [x] Add approval modes (single, any, all, majority, sequential)
- [x] Add clarification response endpoint (respondToClarification)
- [x] Update approvalTasks schema with send_back statuses
- [x] Update approvalHistory schema with send_back actions

### Phase 4: API Routes & Integration
- [x] Add sendBack endpoint to workflows router
- [x] Add respondToClarification endpoint to workflows router
- [x] Integrate RBAC data scoping in requests.router.ts
- [x] Export permission functions from enterprise-rbac.service.ts

### Phase 5: Testing
- [x] Write unit tests for RBAC service (19 tests passing)
- [x] Write unit tests for workflow send back (16 tests passing)
- [x] Total: 35 tests passing

### Phase 6: Documentation
- [x] Create comprehensive documentation with 50 use cases
- [x] Document all components (roles, permissions, scopes, modes)
- [x] Create Word document for release


## Enterprise RBAC System Roles Update (Jan 31, 2026)
- [x] Add seedSystemRoles function to seed 9 enterprise roles (Super Admin, Administrator, Security Manager, Site Manager, Zone Manager, Approver, Requestor, Viewer, Guest)
- [x] Add seedPermissions function to seed 29 granular permissions across 8 modules
- [x] Add seedRolePermissions function to link roles to permissions
- [x] Add assignOwnerSuperAdmin function to auto-assign Super Admin role to owner
- [x] Update users.router.ts to include systemRole in user response
- [x] Update Layout.tsx to display systemRole name instead of legacy role
- [x] Test user profile displays correct system role name (Super Admin shown in UI)


## RBAC UI Features (Jan 31, 2026)

### Feature 1: Role Assignment UI
- [x] Create RoleAssignmentDialog component for assigning roles to users
- [x] Add backend endpoint for assigning/removing user roles (users.assignRole)
- [x] Integrate dialog into Users page with role column
- [x] Show current role and allow role changes

### Feature 2: Permission-based UI Visibility
- [x] Create usePermissions hook to check user permissions (via trpc.users.getMyPermissions)
- [x] Update Layout.tsx to hide menu items based on permissions
- [x] Add permission checks to navigation items (requiredPermission property)
- [x] Filter navigation sections based on user permissions

### Feature 3: Role Management Page
- [x] Create Roles page to list all system roles (Roles & Permissions tab in Users page)
- [x] Add RolePermissionsEditor component to view/edit role permissions (Edit Role dialog)
- [x] Add backend endpoints for updating role permissions (roles.updatePermissions)
- [x] Add route and navigation for Roles page (Users & Roles in sidebar)


## Bug Fix: Roles Tab Showing Old Roles (Jan 31, 2026)
- [x] Update roles.router.ts to query systemRoles table instead of old roles table
- [x] Update Users.tsx Roles tab to display systemRoles with proper permissions
- [x] Show user counts from userSystemRoles table


## RBAC Permission Fixes (Jan 31, 2026)

### Issue 1: Missing Permission Modules
- [x] Add Card Management permissions (view, control, issue, revoke)
- [x] Add Workflow Builder permissions (view, create, update, delete)
- [x] Add Request Types permissions (view, create, update, delete)
- [x] Add Shift Management permissions (view, create, update, delete)
- [x] Add Delegations permissions (view, create, update, delete)
- [x] Add Groups permissions (view, create, update, delete)
- [x] Add Settings permissions (view, update)
- [x] Add Integration Hub permissions (view, configure)
- [x] Update seed functions to include new permissions
- [x] Update UI permission checkboxes to show all modules

### Issue 2: Requestor Dashboard Shows Full Data
- [x] Implement role-based dashboard data filtering
- [x] Show only relevant statistics for Requestor role (Total Requests, Approval Rate)
- [x] Hide admin-only dashboard widgets for non-admin users (Sites, Zones, Alerts, etc.)

### Issue 3: Requestor Cannot See All Requests
- [x] Update Requestor role to have "View All Requests" permission (scoped to own data)
- [x] Implement data scoping so Requestors only see their own requests (via getDataScopeFilter)
- [x] Ensure "All Requests" menu item is visible for Requestors


## Comprehensive Data Source System (Jan 31, 2026)

### Feature: Portal-wide Dynamic Data Source for Dropdown Fields
Create a unified data source system that can pull options from anywhere in the portal.

**Available Data Sources:**
- static: Manual options defined in field configuration
- countries: Master data countries table
- regions: Master data regions (filtered by country)
- cities: Master data cities (filtered by region)
- sites: Sites table (all or user's assigned sites)
- zones: Zones table (filtered by site)
- areas: Areas table (filtered by zone)
- departments: Departments table
- groups: Groups table (all or user's groups)
- users: Users table (for user lookup)
- contractors: Contractor companies
- request_types: Request types for category
- approval_roles: Approval roles
- user_profile: Current user's profile data

**Implementation Tasks:**
- [x] Update optionsSource enum in schema to include all data sources
- [x] Create unified /api/data-source endpoint with type and filter params (getDataSourceOptions)
- [x] Update Edit Field dialog with Data Source dropdown selector
- [x] Add "Depends On Field" selector for cascading dropdowns (filterByField)
- [x] Update DynamicForm FieldRenderer to fetch from data source API
- [x] Implement cascading logic (parent field change triggers child refresh)
- [ ] Test Country → Region → City → Site → Zone → Area cascade (manual testing required)


## Visitors Form Improvements (Jan 31, 2026)

### Feature: Improve Visitors Form UI
- [x] Improve form layout with better spacing and grouping
- [x] Add visual separation between visitor entries (collapsible cards with badges)
- [x] Improve field labels and styling (uppercase labels, proper spacing)
- [x] Add better validation feedback (error badges, toast messages)

### Feature: Yakeen Verification for Visitors
- [x] Add "Verify from Yakeen" button to visitor section
- [x] Integrate with Yakeen API for ID verification (simulated)
- [x] Auto-populate visitor details from Yakeen response
- [x] Show verification status indicator (Verified/Manual badges)


## Field Type Validation Bug Fix (Jan 31, 2026)

### Bug: Invalid fieldType validation error
- [x] Fix frontend fieldType value from 'select' to 'dropdown' in RequestTypeConfig.tsx
- [x] Ensure all field types are properly accepted (dropdown, text, etc.)

### UI Improvement: Options Source Section
- [x] Improve Options Source UI styling with better visual hierarchy (grouped cards)
- [x] Add clearer labels and descriptions for data source options (icons, categories)
- [x] Add cascading filter UI with blue highlight and link icon
- [x] Show selected data source info with confirmation message


## Admin Visit Form Fix (Jan 31, 2026)

### Basic Info Section
- [x] Auto-populate Requestor Name from user profile
- [x] Auto-populate Company from user profile
- [x] Auto-populate Email from user profile
- [x] Auto-populate Mobile from user profile
- [x] Auto-populate Department from user profile
- [x] Keep Purpose of entry, Visit description, additional notes as-is

### Location Section
- [x] Update Country field to dropdown with data source = countries
- [x] Update Region field to dropdown filtered by selected country
- [x] Update City field to dropdown filtered by selected region
- [x] Update Site field to dropdown filtered by selected city
- [x] Make Area field optional dropdown filtered by site
- [x] Make Zone field optional dropdown filtered by area

### Host Section
- [x] Add user search/select field for Host (mandatory)
- [x] Show host user details after selection
- [x] Implement user search with autocomplete functionality

### VIP Visit Section (NEW)
- [x] Add VIP Visit Yes/No toggle field
- [x] Add conditional visibility for VIP form when Yes is selected
- [x] Add Driver Name field (VARCHAR)
- [x] Add Nationality field (dropdown)
- [x] Add ID field (VARCHAR)
- [x] Add Company field (VARCHAR)
- [x] Add Phone # field (VARCHAR)
- [x] Add Vehicle Plate # field (VARCHAR)

### Visitors Section Enhancement
- [x] Add Iqama Expiry Date field from Yakeen response
- [x] Save visitor data changes (company, etc.) after Yakeen verification
- [x] Nationality auto-populated from Yakeen


## Draft Editing Fix (Jan 31, 2026)

### Bug: Drafts are not editable
- [x] Investigate current draft handling in requests module
- [x] Add edit button/action for draft requests
- [x] Load draft data into request form for editing
- [x] Allow updating draft or submitting as new request
- [x] Add route for /requests/:id/edit
- [x] Add update mutation in requests router
- [x] Update getById to return formData, categoryId, selectedTypeIds
- [ ] Test draft editing workflow (manual testing required)


## Admin Visit Form Bugs (Jan 31, 2026)

### Bug: Field labels showing '0' suffix (e.g., VISIT DESCRIPTION0, ADDITIONAL NOTES0) - FIXED
- [x] Investigate why non-mandatory fields show '0' suffix in labels
- [x] Fix field label rendering in FieldRenderer component (changed to Boolean(field.isRequired))

### Bug: Form not reflecting updated configuration
- [x] Check if form definition query is returning updated sections
- [ ] Verify VIP Details section is being returned from API (7 sections exist but VIP Details not showing)

### Bug: Iqama Expiry Date in Attachments section
- [x] Remove Iqama Expiry Date field from Attachments section in database


## Login Bug from Different Location (Jan 31, 2026)

### Bug: Correct credentials don't redirect after login from different location
- [x] Investigate authentication flow and cookie settings
- [x] Check SameSite cookie attribute for cross-origin access
- [x] Check Secure cookie flag for HTTPS
- [x] Verify JWT token is being set correctly
- [x] Fix cross-origin cookie issue (SameSite=none requires Secure=true)


## Admin Visit Form Critical Issues (Jan 31, 2026)

### Issue 1: Country dropdown is empty - FIXED
- [x] Check if countries data exists in database
- [x] Seed countries, regions, cities data (20 countries, 25 cities for Saudi Arabia)
- [x] Fix dropdown to fetch from correct data source API
- [x] Fix LIMIT clause SQL errors in data source queries

### Issue 2: VIP Details section not showing in sidebar
- [x] Check if VIP Details section exists in database (it does)
- [x] Moved vip_visit toggle to Basic Information section
- [ ] VIP Details section conditional visibility needs frontend fix

### Issue 3: Host user search not returning results - FIXED
- [x] Check user search API endpoint
- [x] Fix UserLookupField component to properly search users
- [x] Test with existing users in database - working

### Issue 4: Basic Information auto-populated - PARTIALLY FIXED
- [x] Requestor Name, Email, Mobile auto-populate from user profile
- [ ] Company/Department empty because user doesn't have these set in profile


## Location Cascade Fix (Jan 31, 2026) - COMPLETED

### Change location cascade to Country → City → Site (skip Region filtering)
- [x] Make Region field optional and show all regions (no filtering)
- [x] Update City field to filter by Country instead of Region
- [x] Verify Site filters by City
- [x] Test the updated location cascade - WORKING
- [ ] Clean up duplicate cities in database (Dammam, Dhahran, Jeddah, etc. appear twice)
