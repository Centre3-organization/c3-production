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
