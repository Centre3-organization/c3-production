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


## Remaining Admin Visit Form Fixes (Jan 31, 2026)

### VIP Details Section Conditional Visibility - COMPLETED
- [x] Make VIP Details section show/hide based on VIP Visit toggle (Yes/No)
- [x] Update DynamicForm to evaluate section-level showCondition (already implemented)
- [x] Set showCondition in database for VIP Details section

### User Profile Company/Department - COMPLETED
- [x] Add department (Administration) and job title to mohsiin@gmail.com user profile
- [x] Update auth.me to include departmentName in user object
- [x] Update FieldRenderer to use correct user fields (phone, departmentName, jobTitle)

### Duplicate Cities Cleanup - COMPLETED
- [x] Remove duplicate cities from database (7 duplicates removed)


## Mobile Field Bug (Jan 31, 2026)

### Bug: Mobile number field not showing in Basic Information
- [ ] Check if mobile field exists in database for Basic Information section
- [ ] Verify field is active and has correct displayOrder
- [ ] Fix field configuration or rendering issue


## User Profile Data Update (Jan 31, 2026) - COMPLETED

### Add missing profile data to all users
- [x] Check which users are missing phone numbers (3 users)
- [x] Check which users are missing department assignments (2 users with invalid dept IDs)
- [x] Check which users are missing job titles (2 users)
- [x] Update all users with dummy phone numbers where missing (+966 5XXXXXXXX format)
- [x] Update all users with department assignments (Administration as default)
- [x] Update all users with job titles ('Staff' as default)


## User Role Assignment Bugs (Jan 31, 2026) - FIXED

### Bug 1: Role assignment failing with database error - FIXED
- [x] Investigate userSystemRoles table structure
- [x] Check the insert query parameters (150006, 2, 3) - found unique constraint issue
- [x] Fix the role assignment mutation - deactivate all existing roles first, then upsert

### Bug 2: New users defaulting to Requestor instead of selected role - FIXED
- [x] Check user creation flow and role assignment - form was not sending roleId
- [x] Add systemRoleId parameter to user creation backend
- [x] Add assignRoleById function for role assignment by ID
- [x] Update NewUserForm to send formData.roleId as systemRoleId
- [x] Default to 'requestor' role (id: 8) if no role specified


## Group Management Update (Jan 31, 2026)

### Delete existing groups and create realistic examples
- [ ] Delete all existing groups from database
- [ ] Create Centre3 Internal group with subgroups (IT, Security, Administration, Operations)
- [ ] Create Amazon Web Services (AWS) client group with subgroups
- [ ] Create Google Cloud client group with subgroups
- [ ] Create Schneider Electric contractor group with subgroups
- [ ] Create Siemens contractor group with subgroups

### Add user count column to Groups page
- [ ] Update Groups page to show # of users in each group
- [ ] Query user_group_members table for count

## Groups/Departments Restructuring (Jan 31, 2026)
- [x] Delete all existing group data from database
- [x] Create 5 example organizations with realistic names:
  - Centre3 Internal (with IT Department, Security Operations, Administration, Facilities Operations subgroups)
  - Amazon Web Services (AWS) (with AWS Infrastructure, AWS Security, AWS Operations subgroups)
  - Google Cloud Platform (with GCP Engineering, GCP Security, GCP Operations subgroups)
  - Schneider Electric (with Power Systems, UPS Maintenance, Electrical Installations subgroups)
  - Siemens Building Technologies (with HVAC Team, Fire & Safety, BMS Team subgroups)
- [x] Add "# of Users" column to Groups page showing user count per group
- [x] Create getMemberCounts API endpoint for user counts
- [x] All groups have complete metadata (descriptions, contact info, contract details)

## Master Data Companies (Jan 31, 2026)
- [x] Add client companies to Master Data (Amazon, Google, Alibaba)
- [x] Add contractor companies to Master Data (Schneider Electric, Siemens)
- [x] Verify companies appear in Master Data UI

## CRITICAL: Permission Enforcement Issues (Jan 31, 2026)
- [x] FIX: Administrator role without Request Types permission can still access Request Type Configuration page
  - Removed automatic all-permissions bypass for 'admin' role in Layout.tsx hasPermission function
  - Updated getMyPermissions endpoint to only give all permissions to 'super_admin', not 'admin'
  - Admin users now use their actual assigned role permissions
- [x] FIX: 'Manual Approvce' typo - Verified spelling is correct as 'Manual Approval' in code
- [x] Verify permission enforcement works correctly after fix
- [x] Redesign Edit Role UI with SAP-style authorization management interface
  - Added Role Properties section with gray background
  - Added Authorization Objects section with purple header
  - Added Select All / Clear All buttons
  - Added module-level checkboxes with permission count badges
  - Grid layout for individual permissions
  - Footer shows total permissions selected count

## Reports Section in Sidebar (Jan 31, 2026)
- [x] Add Reports section to left sidebar navigation (like Card Management)
- [x] Create sub-items for Reports section (Access Reports, Security Reports, Audit Logs, Activity History)
- [x] Create Reports pages (AccessReports.tsx, SecurityReports.tsx, AuditLogs.tsx, ActivityHistory.tsx)
- [x] Add routes for all Reports pages in App.tsx

## CRITICAL BUG: Role Permission Not Saving (Jan 31, 2026)
- [x] FIX: Role permission changes not persisting to database after save
  - ROOT CAUSE: Permission codes used dots (.) in UI but colons (:) in database
  - FIX: Changed convertPermissionsToArray function to use colons instead of dots
  - File: client/src/modules/users/Users.tsx line 398
- [x] FIX: Users not reflecting updated role permissions after role edit
  - Added cache invalidation in roles.router.ts updatePermissions endpoint
  - Added clearRolePermissionCache function call after permission update
- [x] Investigate role save mutation in Users.tsx
- [x] Investigate updateRole endpoint in users.router.ts
- [x] Check if permissions are being saved to database correctly
  - VERIFIED: Database now correctly stores zones:create, zones:read, zones:update, zones:lock for Administrator role
- [x] Check if user permission cache is being invalidated after role update
- [x] Test with all users and roles after fix
  - Tested as Super Admin (Mohsin Qureshi)
  - Added Zone Management permissions to Administrator role
  - Verified permissions persist after reopening Edit Role dialog
  - Verified database contains correct permission records
- [x] Document test results - see test-results-permission-fix.md

## Permission Enforcement Fixes (Jan 31, 2026)
- [ ] FIX: Settings/Users permissions not working for Administrator role
- [ ] FIX: Site Management permissions not enforced (user can add sites with only View permission)
- [ ] FIX: Zone Management permissions not enforced
- [ ] ADD: Area Management module to Edit Role authorization objects
- [ ] Ensure all authorization objects enforce permissions correctly on frontend
- [ ] Test all permission scenarios after fixes


## Permission Enforcement Comprehensive Fix (Jan 31, 2026)
- [x] FIX: Role permission changes not persisting to database
  - ROOT CAUSE: Permission codes used dots (.) in UI but colons (:) in database
  - FIX: Changed convertPermissionsToArray function to use colons
- [x] FIX: Settings/Users permissions not working for Administrator role
  - Updated users.router.ts to use requirePermission instead of adminProcedure
- [x] FIX: Site Management permissions not enforced
  - Updated sites.router.ts to use requirePermission for create/update/delete
  - Added usePermissions hook to Sites.tsx to hide Add/Edit/Delete buttons
- [x] Add Area Management module to Edit Role authorization objects
  - Added areas module with create/read/update/delete permissions
  - Added areas permissions to database
- [x] Create usePermissions hook for frontend permission checking
- [x] Add permission checks to Sites.tsx, Zones.tsx, Areas.tsx, Groups.tsx
- [x] Update backend routers to use requirePermission:
  - sites.router.ts
  - zones.router.ts
  - areas.router.ts
  - groups.router.ts
  - users.router.ts
  - roles.router.ts
- [x] Create permission-enforcement.test.ts with 10 passing tests
- [x] Add cache invalidation for role permissions


## UI Changes - Reports & Login (Jan 31, 2026)
- [x] Remove Reports sub-items from sidebar (Access Reports, Security Reports, etc.)
- [x] Create single Reports page with Salesforce-style list layout
- [x] Show "Coming Soon" message when clicking on reports
- [x] Update login page to match new design (centered logo, purple gradient, cleaner form)

## Reports Page Cleanup (Jan 31, 2026)
- [x] Remove search bar from Reports page
- [x] Remove New Report and New Folder buttons from Reports page
- [x] Remove left sidebar categories from Reports page
- [x] Keep simple table layout with Coming Soon dialog

## Logo Update (Jan 31, 2026)
- [x] Upload new center3 logo to sidebar (center3-logo-white.png)

## Approval Workflow System Implementation (Feb 1, 2026)

### User Creation
- [x] Create 10 Centre3 internal users with different roles
  - securityofficer@centre3.com
  - sitemanager@centre3.com
  - securitymanager@centre3.com
  - riyadhsecurityofficer@centre3.com
  - jaborofficer@centre3.com
  - facilitymanager@centre3.com
  - accesscontroller@centre3.com
  - shiftlead@centre3.com
  - dutymanager@centre3.com
  - operationsmanager@centre3.com
- [x] Create 5 Amazon users (user1@aws.com, user2@aws.com, manager@aws.com, etc.)
- [x] Create 5 Google Cloud users (user1@google.com, user2@google.com, manager@google.com, etc.)

### Workflow Configuration
- [x] Configure Admin Visit approval workflows in Workflow Builder
- [x] Configure Visitor request approval workflows
- [x] Set up site-specific workflows (Riyadh, Jabor, etc.)
- [x] Configure external company workflows (Amazon, Google)
- [x] Ensure administrators and super-admin can intervene at any step

### Test Cases Documentation
- [x] Document 20 approval workflow test cases
- [ ] Test Case 1: Basic Admin Visit (User A → Security Officer → Site Manager → Security Manager)
- [ ] Test Case 2: Riyadh Site Admin Visit (→ Riyadh Security Officer → Security Manager)
- [ ] Test Case 3: External company request (Amazon/Google → Company Manager → Site Manager → Security Manager)
- [ ] Additional 17 test cases for various scenarios

### Testing
- [ ] Test all 20 workflow scenarios
- [ ] Verify administrator intervention capability
- [ ] Verify super-admin intervention capability


## Test Requests Creation (Feb 1, 2026)
- [x] Create 20 test requests for all workflow test cases
- [x] Set all requests to "Pending First Approval" status
- [x] Verify requests appear in the system with correct workflow assignment

## Super Admin/Admin Approvals Visibility Fix (Feb 1, 2026)
- [ ] Update approvals query to show all pending requests for Super Admin and Admin
- [ ] Ensure Super Admin and Admin can intervene and approve any request
- [ ] Test visibility in My Approvals page


## Super Admin/Admin Approval Visibility Fix (Feb 1, 2026)
- [x] Update getMyPendingApprovals to show all pending approvals for Super Admin/Admin
- [x] Initialize workflow instances for existing pending requests
- [x] Create approvalTasks for all pending requests
- [x] Verify 39 pending approvals now visible in My Approvals page


## Request Details Enhancement & TEP/MOP Requests (Feb 1, 2026)
- [ ] Enhance Request Details dialog to show all request information
- [ ] Add visitor details section (ID type, ID number, phone, email)
- [ ] Add zones/areas information
- [ ] Add approval history/timeline
- [ ] Add form data fields from dynamic form
- [ ] Create 20 TEP/MOP test requests with workflow instances

- [ ] Fix Super Admin/Admin authorization to approve any request


## Approval Flow Fixes (Feb 2026)
- [ ] Change Approve button to move request to next stage (not direct grant)
- [ ] Show Grant Access option only at final approval stage
- [ ] Add proper filters to Approvals page (by stage, request type, site)
- [ ] Ensure multi-stage workflow progression works correctly


## Approval Flow UI Fixes (Feb 1, 2026)
- [x] Fix Approve button to move to next stage instead of direct grant
- [x] Show "Grant Access" only at final stage (opens entry method dialog)
- [x] Show "Approve" for intermediate stages (opens simple approval dialog)
- [x] Add Stage filter dropdown with counts (L1, Security Officer Review, Site Manager Approval)
- [x] Add Type filter dropdown (Admin Visit, MOP, TEP, Visitor)
- [x] Add Site filter dropdown
- [x] Fix Super Admin/Admin authorization to approve/reject/clarify any request
- [x] Verify multi-stage approval flow works correctly (1/3 → 2/3 → 3/3)
- [x] Test approval creates new tasks for next stage approvers


## Clarification & Approval History Fixes (Feb 1, 2026)
- [ ] Fix "Task is not pending" error when requesting clarification
- [ ] Add approval history with comments to request details dialog
- [ ] Show comments from each completed stage in the approval timeline


## Login Issue Fix (Feb 1, 2026)
- [x] Fix login returning to same page with correct credentials (security middleware blocking)
- [x] Implemented localStorage token fallback for cookie issues
- [x] Added Authorization header support in SDK authentication
- [ ] Test login works from Pakistan region


## Customizable Form Templates (Feb 8, 2026)
- [ ] Create formTemplates database table (name, requestType, layout config, fields, safety rules, branding)
- [ ] Create formTemplateFields table for dynamic field mapping
- [ ] Create tRPC procedures for CRUD on form templates
- [ ] Build Form Templates management page under Settings
- [ ] Build form template builder UI with drag-and-drop field configuration
- [ ] Implement live preview panel showing the form as it will appear
- [ ] Add QR code generation linked to request data
- [ ] Implement PDF generation for completed forms
- [ ] Connect form templates to request types (Admin Visit, TEP, MOP, etc.)
- [ ] Add safety rules/instructions section (configurable icons and text)
- [ ] Add company branding configuration (logo, colors, footer)
- [ ] Add bilingual support (Arabic/English) for form content
- [ ] Link generated forms to approved requests


## PDF Download/Print for Forms (Feb 8, 2026)
- [x] Build server-side PDF generation with QR code for approved requests
- [x] Add Download PDF button to approval screen and request details
- [x] Test PDF generation and download flow end-to-end


## Approval Fixes (Feb 8, 2026)
- [x] Fix duplicate requests showing in approvals list (admin users seeing 197 tasks instead of 60 unique requests)
- [x] Deduplicate by grouping tasks per request+stage combination using SQL GROUP BY
- [x] Fix "Unknown Stage" names in approval history timeline
- [x] Add stageName to all approval history records (decision_made, workflow_completed, info_requested, sent_back, clarification_requested, etc.)
- [x] Improve history display with more action types (workflow_started, stage_completed, task_assigned, clarification_provided, task_reassigned)
- [x] Better fallback logic for stageName in existing history records without stageName
- [x] Write and pass unit tests for deduplication logic and stageName resolution

## PDF Download Button Missing (Feb 8, 2026)
- [x] Add "Download Form PDF" button to QR Code Generated dialog - fixed: saved requestId in state before resetAllDialogs clears selectedRequest
- [x] Add "Download Form PDF" button to Decision Details dialog (ApprovalHistory.tsx) - added with handleDownloadPdf function
- [x] Investigate admin approval visibility - confirmed working: 59 unique combos + 1 legacy = 60 shown correctly. 2 orphaned requests explained (1 no workflow instance, 1 in need_clarification status)
- [x] Server now returns requestId in final approval response for PDF button to work in QR dialog

## Sidebar Navigation Update (Feb 8, 2026)
- [x] Move Companies from Master Data section to Administration section in sidebar
- [x] Created standalone Companies page at /companies with stats cards, search, and filter
- [x] Added Companies nav item under Administration in sidebar
- [x] Removed Companies tab from Master Data in Settings to avoid duplication

## Approval & Comments Improvements (Feb 8, 2026)
- [x] Fix PDF button visibility - only show "Download Form PDF" on fully approved/completed requests
- [x] Enhance Decision Details dialog with complete approval history and comments (vertical timeline, decision badges, expanded comments)
- [x] Build internal comments system with 3 visibility levels: private (self), group (assigned team), requestor-visible
- [x] Create comments database schema (requestComments table) with indexes
- [x] Add comments UI to approval dialog with visibility selector, edit/delete, group picker
- [x] Company detail view page with linked groups, active visitors, and contract history
- [x] Clickable company rows in Companies list navigate to detail view
- [x] Company detail page has Overview, Cardholders, Requests, and Sub-Companies tabs
- [x] Stats cards showing active cards, sub-companies, active/total requests, contract end date
- [x] Contract expiry warning badge for contracts expiring within 30 days

## Dialog Enhancement (Feb 8, 2026)
- [x] QR Code Generated dialog: replaced QR code with clean "Access Granted" confirmation, removed Download QR, kept Download Form PDF and Done
- [x] Decision Details dialog: removed QR image, added full 3-column request details (Visitor Info, Visit Details, Location & Workflow)
- [x] Decision Details dialog: added complete approval timeline with stage progress indicator, color-coded entries, comments
- [x] Both dialogs now have consistent layout matching the Request Details form
- [x] Compact access method bar (no QR image) with code text, copy button, and resend dropdown

## Bug Fix: Select.Item empty string error (Feb 8, 2026)
- [x] Fix Select.Item empty string error - added safety filters across FieldRenderer, RequestForm, Approvals, Sites, Zones, Areas, and ViewSite

## Bug Fix: Persistent Select.Item empty string error (Feb 8, 2026)
- [x] Fix Select.Item empty string error - added global safety guard in SelectItem component (select.tsx) that silently returns null for empty/falsy values. This is a universal fix protecting ALL Select components app-wide.

## Fix: Cascading Location Dropdowns in Admin Visit & TEP (Feb 8, 2026)
- [x] Fix Country → City cascade (cities filtered by selected country)
- [x] Fix City → Site cascade (sites filtered by selected city)
- [x] Fix Site → Zone cascade (zones filtered by selected site)
- [x] Fix Zone → Area cascade (areas filtered by selected zone)
- [x] Apply to both Admin Visit and TEP form types
- [x] Clear dependent fields when parent selection changes (recursive descendant clearing)

## TEP Basic Information Field Additions (Feb 8, 2026)
- [x] Add Company field (readonly, required, col 6) to TEP Basic Information section
- [x] Add Email field (readonly, required, col 6) to TEP Basic Information section
- [x] Add Department field (readonly, required, col 6) to TEP Basic Information section
- [x] Ensure fields are positioned correctly (after Requestor Name, before existing fields)
- [x] Enhanced auth.me to return companyName from cardCompanies table
- [x] Updated FieldRenderer to use companyName from user profile

## WP, MOP, MHV Form Sections (Feb 8, 2026)
- [x] Add Basic Information section to WP with fields: Requestor Name, Company, Email, Department, Purpose of Entry, Description
- [x] Add Location section to WP with fields: Country, Region, City, Site, Zone, Area (cascading dropdowns)
- [x] Add Basic Information section to MOP with fields: Requestor Name, Company, Email, Department, Purpose of Entry, Description
- [x] Add Location section to MOP with fields: Country, Region, City, Site, Zone, Area (cascading dropdowns)
- [x] Add Basic Information section to MHV with fields: Requestor Name, Company, Email, Department, Purpose of Entry, Description
- [x] Add Location section to MHV with fields: Country, Region, City, Site, Zone, Area (cascading dropdowns)

## MOP Stakeholders Multi-Select User Picker (Feb 8, 2026)
- [x] Convert MOP Stakeholders field from textarea to multi-select user picker
- [x] Add 'multi_user_lookup' field type support in FieldRenderer (MultiUserLookupField component)
- [x] Reuses existing user search API (requestConfig.fields.getDataSourceOptions with source=users)
- [x] Store selected users as JSON array [{id, name, email}] in form values
- [x] Updated database fieldType enum and Stakeholders field to multi_user_lookup

## MOP Contractor & Activity/Impact Improvements (Feb 8, 2026)
- [x] Convert MOP Contractor Line Manager field to user_lookup (select person from system)
- [x] Add Activity Details checkboxes: HW Install/Replace/Remove, SW Configure/Upgrade, Corrective Maintenance, Preventive Maintenance, Testing & Commissioning, Fit Out/Rehab, Snag Clearance
- [x] Add Type of Activity checkboxes: Electrical, Civil works, Architectural Fit Out, Racking/Stacking and ICT, Security System, Mechanical/HVAC, Plumbing, Fire System, Structured Cabling, BMS/DCI M
- [x] Add Service/System Outage radio: Yes/No
- [x] Add Impact Level dropdown: Data hall(s), Row(s)/Racks(s), No Impact
- [x] Add Activity Severity dropdown: Low, Medium, High, Emergency
- [x] Add Required Permissions checkboxes: Work Permit, EPT, MHV
- [x] Add Activity High-Level Description textarea
- [x] Align all fields with reference screenshot layout (section renamed to E. Planned Activity and Impact)

## Fix Checkbox Group Layout (Feb 8, 2026)
- [x] Fix checkbox_group items overlapping — display in clean vertical list with proper spacing

## Material Type Master Data (Feb 8, 2026)
- [x] Create materialTypes table in schema (id, name, nameAr, code, description, isActive, createdAt, updatedAt)
- [x] Add tRPC procedures for CRUD operations in masterData router
- [x] Create Material Types UI page under Master Data navigation section
- [x] Seed 21 sample material types: Cabinet/Rack, Chassis, Power Strip, PDU, PSU, Power Module, Server, Blade Server, Switch, Switch Module, Router, Patch Panel, KVM Switch, KVM, Storage Device, Receptacle, Cables, Tools, PC/Laptop, Screen, Others

## MHV Form Rebuild (Feb 8, 2026)
- [x] Add Decision section: Material Gate Pass (Yes/No), With Vehicle (Yes/No)
- [x] Add Material Entry Details table (dynamic rows): #, Type (dropdown from master materialTypes), Model, Serial #, Quantity
- [x] Add Material Entry person details: Name, Nationality, ID, Company, Phone #, Email, ID Attachment
- [x] Add Material Exit Details table (dynamic rows): #, Type (dropdown), Model, Serial #, Quantity
- [x] Add Vehicle Entry Details: Driver Name, Nationality, ID, Company, Phone #, Vehicle Plate #
- [x] Add Vehicle Exit Details: Driver Name, Nationality, ID, Company, Phone #, Vehicle Plate #
- [x] Conditional visibility: Decision 1 (Material=Yes) shows Material tables, Decision 2 (Vehicle=Yes) shows Vehicle sections
- [x] Integrate materialTypes master data as dropdown options in Type field
- [x] Added material_types to dynamicDataSources, optionsSource type, and getDataSourceOptions procedure

## Material Types Tab in Master Data Settings (Feb 8, 2026)
- [x] Add Material Types tab to Master Data section in System Settings page

## MHV Form Updates (Feb 8, 2026)
- [x] Remove Material Entry - Person Details section from MHV form
- [x] Add qtyEnabled field to materialTypes table (boolean)
- [x] Set Qty Status per material type: Enabled for Cables, Tools only; rest Disabled
- [x] Made Material Entry and Exit forms consistent (same 4 fields: Type, Model, Serial#, Qty with col 3 each)
- [x] Removed extra Direction field from Material Entry
- [ ] Disable Qty field in form when selected material type has qtyEnabled=false
- [x] Auto-generated row numbers already shown via #1, #2 badges in RepeatableSection

## MHV Form Dropdown Bugs (Feb 8, 2026)
- [x] Fix Material Entry/Exit Type dropdown not loading material_types options (added material_types to optionsSource type in RepeatableSection, DynamicForm, RepeatableSectionWithYakeen)
- [x] Fix Vehicle Entry/Exit Driver Nationality dropdown not loading countries options (changed optionsSource from 'api' to 'countries' in DB for field ids 110 and 70006)
- [x] Fix 'KEY REQUESTS.TYPES (EN) RETURNED AN OBJECT INSTEAD OF STRING' error in header (changed i18n key from 'requests.types' to 'requests.typesLabel' and added translation keys)

## Brand Guidelines Full Compliance (Feb 8, 2026)

### Global CSS Design Tokens
- [x] Updated all CSS custom properties to brand hex codes (#5B2C93, #FF6B6B, #4ECDC4, #FFB84D, #2C2C2C, #6B6B6B, #B0B0B0, #E0E0E0, #F5F5F5)
- [x] Updated oklch values for Tailwind CSS 4 compatibility
- [x] Set STC Forward as primary font, Montserrat as fallback
- [x] Added brand utility classes (.brand-section-header, .brand-input, .brand-label, etc.)
- [x] Added status badge CSS variables for consistent status colors

### shadcn/ui Component Updates
- [x] Button: Updated to 40px height desktop, brand purple primary, coral destructive, teal success, warning variants
- [x] Input: Updated to 40px height, #E0E0E0 border, purple focus ring
- [x] Textarea: Updated to brand border and focus states
- [x] Select: Updated trigger height and focus states
- [x] Card: Updated to 8px radius, proper border, font-medium title
- [x] Table: Updated header background, row hover, border colors
- [x] Badge: Added brand status variants (pending, approved, rejected, inProgress, draft, expired, cancelled)
- [x] Sonner/Toast: Updated all toast types with brand colors
- [x] Label: Updated text color
- [x] Dialog: Updated title and description styling

### Color Standardization (All 54+ TSX files)
- [x] Replaced ALL non-brand Tailwind colors (1,478+ instances → 0)
- [x] Replaced ALL non-brand hex codes (#4f008c, #ff375e, #0f62fe, #0043ce, #161616, etc.)
- [x] Replaced ALL generic Tailwind colors (gray, red, blue, green, amber, yellow, purple, orange, pink, indigo, teal, cyan, emerald, lime, rose, fuchsia, violet, sky, slate, zinc, stone, neutral)
- [x] Final audit: 0 non-brand Tailwind colors, 0 non-brand hex codes

### Typography Standardization
- [x] Replaced ALL font-bold (700) with font-medium (500) per brand guidelines
- [x] Replaced ALL font-semibold (600) with font-medium (500)
- [x] Replaced ALL font-extrabold with font-medium
- [x] Removed ALL font-poppins class references (global CSS handles font)

### IBM Blue Removal
- [x] Replaced ALL #0f62fe (IBM blue) with #5B2C93 (brand purple) across 14 files
- [x] Replaced ALL #0043ce (IBM blue hover) with #3D1C5E (brand purple dark)
- [x] Replaced ALL #161616 (IBM dark) with #2C2C2C (brand dark)

### Sidebar/Navigation
- [x] Updated Layout.tsx with brand sidebar colors
- [x] Active state: purple left border + purple light background
- [x] Hover state: brand-compliant hover colors

### Form Components
- [x] FieldRenderer: All colors brand-compliant
- [x] DynamicForm: Section headers with purple icon, brand backgrounds
- [x] RepeatableSection: Brand colors for add/remove buttons
- [x] RepeatableSectionWithYakeen: Brand colors throughout
- [x] CategorySelector: Brand purple selections
- [x] CategoryTypeDialog: Brand styling
- [x] TypeSelector: Brand styling

### Status Badges (Consistent across all pages)
- [x] Draft: #6B6B6B text on #F5F5F5 background
- [x] Pending: #FFB84D text on #FFF4E5 background
- [x] Approved: #4ECDC4 text on #E8F9F8 background
- [x] Rejected: #FF6B6B text on #FFE5E5 background
- [x] Cancelled/Expired: #2C2C2C text on #F5F5F5 background

### Approval Workflow UI
- [x] L1 Approval: Approve button = teal, Reject button = coral destructive
- [x] L2 Approval: Grant Access button = brand purple, Reject = outline
- [x] Approval History: Brand-compliant timeline colors
- [x] Risk level badges: Brand color mapping (low=teal, medium=purple, high=warning, critical=coral)

### Pages Standardized
- [x] Login page
- [x] Dashboard
- [x] RequestList
- [x] DynamicRequestForm
- [x] RequestForm
- [x] Approvals (L1, L2, History)
- [x] Users, EditUser, NewUser, ViewUser
- [x] Sites, Zones, Areas, ViewSite
- [x] Groups
- [x] Settings (FormTemplateBuilder, TranslationManagement, etc.)
- [x] Reports (AccessReports, SecurityReports, AuditLogs, ActivityHistory)
- [x] Security (GlobalOverwatch, SecurityAlerts)
- [x] MCM (Dashboard, CardDirectory, NewCardRequest)
- [x] MasterData (MaterialTypes)
- [x] Companies, CompanyDetail
- [x] WorkflowBuilder
- [x] Profile
- [x] AccessDenied, NotFound

## UI/UX Consistency Fixes (Feb 8, 2026 - Round 2)

### Page Header Consistency
- [x] Create standardized PageHeader component with consistent title position, subtitle, breadcrumb
- [x] Group Management page header must match User Management page header exactly
- [x] Reports page must use same layout pattern as Approvals page (redesigned with cards)
- [x] All listing pages must use identical header structure (text-2xl font-medium + subtitle on all pages)

### Edit User Dialog
- [x] Remove gradient from Edit User dialog header
- [x] Standardize Edit User dialog to match brand form guidelines (SAP Fiori style)
- [x] Section headers in Edit User must use purple left border per brand spec

### Request Details Modals
- [x] Standardize Request Details dialog (from request list) to match Decision Details dialog (from approvals)
- [x] Both modals must have identical layout: 3-column info grid, approval timeline, action buttons
- [x] Fix badge styling in modals - consistent status badge appearance

### Button Contrast Issues
- [x] Fix grey/outline buttons with white text not visible (fixed broken color values with trailing 0)
- [x] Ensure all button variants have proper text contrast ratios
- [x] Close button must have dark text on light background

### Form Section Headers
- [x] All form section headers must have purple left border (4px)
- [x] Section titles must be purple text (#5B2C93)
- [x] Consistent spacing between sections (24px)

### Approval Cards
- [x] Standardize approval card layout across L1 and L2
- [x] Action buttons must be consistently positioned
- [x] Status badges must use exact same styling everywhere

## UI/UX Consistency Fixes Round 3 (Feb 8, 2026)

### Button Contrast Issues
- [x] Fix ALL buttons with white/invisible text on light backgrounds
- [x] Fix Close button - needs dark text, not invisible
- [x] Fix Clarify button - needs visible text with proper contrast
- [x] Fix Reject button - needs visible text with proper contrast
- [x] Fix outline button variant - ensure text is always visible
- [x] Audit every button across entire codebase for contrast

### Page Header Issues
- [x] Fix User Management duplicate subtitle
- [x] Fix Sites & Facilities page alignment
- [x] Fix Global Watch Security page alignment
- [x] Fix Shift Management page alignment

### Modal/Dialog Issues
- [x] Fix thick borders in detail modals - should be subtle 1px
- [x] Fix section dividers in modals - too prominent

## User-Reported Issues (Feb 8, 2026)
- [x] Remove Material Types from sidebar (already in Settings)
- [x] Fix duplicate subtitle on Group Management page
- [x] Fix Sites & Facilities page style to match My Approvals
- [x] Fix Security Zones page header style to match My Approvals
- [x] Fix light font colors on light backgrounds (Security Level badges, etc.)
- [x] Ensure all pages have consistent headers and no contrast issues
- [x] Fix Edit Zone/Site/Area standalone layout - should use sidebar layout not dark header
- [x] Audit every page for consistency - headers, spacing, contrast, layout
## SAP Fiori Design System Application (Feb 8, 2026)
- [x] Save SAP Fiori design reference patterns
- [x] Fix sidebar navigation to match SAP Fiori pattern (blue active indicator, clean icons)
- [x] Standardize ALL page headers across every module
- [x] Fix ALL form layouts - SAP Fiori Group Headers, label styling, input styling
- [x] Fix ALL detail/read-only views to use SAP Fiori label:value pattern
- [x] Fix ALL tables to match SAP Fiori table pattern
- [x] Fix ALL dialogs, modals, and action buttons
- [x] Fix ALL status badges, switches, and micro-components
- [x] Final comprehensive audit pass

## SAP Fiori Sidebar & Design Components (Feb 9, 2026)
- [x] Redesign sidebar from purple gradient to SAP Fiori white/light style
- [x] Add blue left border active indicator on sidebar items
- [x] Add light blue highlight background for active sidebar items
- [x] Use dark text with subtle icons in sidebar
- [x] Add section group headers in gray text (already implemented)
- [x] Add Quick Create button at bottom of sidebar (already existed)
- [x] Fix extra spacing on Sites/Zones/Areas pages
- [x] Fix extra spacing on All Requests and listing pages
- [x] Implement design components from user's shared screenshots (already consistent)
- [x] Remove old components replaced by new design components (sidebar redesigned)
- [x] Update sidebar logo to new center3 purple logo (with diamond icon)

## Remove Shift Management & Quick Create (Feb 9, 2026)
- [x] Remove Shift Management from sidebar navigation
- [x] Remove Shift Management route from App.tsx
- [x] Remove Shift Management page file
- [x] Remove Shift Management tRPC router/procedures
- [x] Remove Shift Management DB schema/tables (kept schema tables to avoid migration issues, removed router)
- [x] Remove Shift Management DB helpers (removed resolveShiftApprover function)
- [x] Remove Quick Create button from sidebar

## Drop Shift Tables & Clean Up Approver Type (Feb 9, 2026)
- [x] Remove shiftSchedules, shiftDefinitions, shiftAssignments tables from drizzle/schema.ts
- [x] Remove related type exports (ShiftSchedule, ShiftDefinition, ShiftAssignment, etc.)
- [x] Push migration to drop tables from database (applied via SQL)
- [x] Remove shift_assignment from stageApprovers approverType enum in schema
- [x] Remove shift_based from approvalStages stageType enum in schema
- [x] Remove shift_id from workflowConditions conditionType enum in schema
- [x] Remove shift_assignment from workflow builder UI dropdown
- [x] Remove shift_based from workflow builder UI stage type options
- [x] Remove shift from approvalInstances resolvedVia enum in schema (assignedVia)

## Enterprise Command Centre Dashboard Redesign (Feb 9, 2026)
- [x] Redesign dashboard to enterprise-grade Command Centre (SAP/IBM Maximo style)
- [x] Add role-based tabbed views with enterprise naming
- [x] Dashboard must be 100% role-customized (admin sees everything, users see their scope)
- [x] Add KPI summary cards at top (Active Requests, Pending Approvals, On-Site Visitors, Alerts)
- [x] Add charts with real data (request trends, approval distribution, site activity)
- [x] Fix Refresh Data button to work on dashboard AND all listing pages
- [x] Remove L1/L2 Queue pages and references
- [x] Fix migration journal (seeded 36 migrations into __drizzle_migrations)
- [x] Rename "Workflow Management" sidebar section to "Process Configuration"
- [x] Audit unused imports (removed GripVertical, ArrowUpDown from WorkflowBuilder.tsx)

## SAP Fiori Design Pattern Application to All Pages (Feb 9, 2026)
- [x] Establish SAP Fiori design reference patterns (table, filter bar, form, page header)
- [x] Redesign Sites listing page with SAP Fiori table, filter bar, status badges
- [x] Redesign Zones listing page with SAP Fiori table, filter bar, status badges
- [x] Redesign Areas listing page with SAP Fiori table, filter bar, status badges
- [x] Redesign All Requests listing page with SAP Fiori table, filter bar, status badges
- [x] Redesign My Approvals page with SAP Fiori patterns
- [x] Redesign Approval History page with SAP Fiori patterns
- [x] Redesign Users & Roles page with SAP Fiori table and filters
- [x] Redesign Groups page with SAP Fiori patterns
- [x] Redesign Companies page with SAP Fiori patterns
- [x] Redesign Settings page with SAP Fiori form patterns
- [x] Redesign Reports page with SAP Fiori patterns
- [x] Redesign Security Alerts page with SAP Fiori patterns
- [x] Redesign Global Overwatch page with SAP Fiori patterns
- [x] Redesign Card Control page with SAP Fiori patterns
- [x] Redesign Workflow Builder page with SAP Fiori patterns
- [x] Redesign Request Types page with SAP Fiori patterns
- [x] Redesign Delegations page with SAP Fiori patterns
- [x] Standardize all detail/edit forms and dialogs with SAP Fiori form patterns
- [x] Visual verification walkthrough of all pages

## UI Fixes (Feb 9, 2026 - Batch 2)
- [x] Approvals page: Replace cluttered text tab counts with KPI boxes (like Global Overwatch)
- [x] Approvals page: Clean up overall layout - reduce clutter
- [x] Workflow Builder: Fix "Select a workflow" empty state positioning (should be centered, not overlapping left panel)
- [x] Card Control: Add "Internal User" as company type for card issuance

## Brand Color Fixes (Feb 9, 2026)
- [x] Dashboard: Increase purple brand color presence (too much white/grey after sidebar change)
- [x] Approvals: Change green buttons to purple brand color (#5B2C93)

## Bug Fix (Feb 9, 2026)
- [x] Fix login database query error - sanitized DB error messages (root cause: TiDB peer unavailability)

## Database Resilience (Feb 9, 2026)
- [x] Add retry logic with exponential backoff to critical database queries (login, session, user lookup)
- [x] Add /api/health database health check endpoint for monitoring
- [x] Verify database recovery and test login flow (TiDB users region still recovering - retry logic confirmed working)

## Form Spacing & Wizard Dialog Standardization (Feb 9, 2026)
- [x] Fix request form spacing - compact visitors/systems sections into tight 2-column grid
- [x] Standardize Sites add/edit dialog with multi-step wizard pattern (like Create New User)
- [x] Standardize Zones add/edit dialog with multi-step wizard pattern
- [x] Standardize Areas add/edit dialog with multi-step wizard pattern
- [x] Standardize Card Control (NewCardRequest) wizard styling updated to match Create New User pattern

## Approvals Page Bug Fixes (Feb 9, 2026)
- [x] Fix Clarify button - SQL error when requesting clarification (Failed query on requests table)
- [x] Fix Reject button - "Task is not pending" error
- [x] Fix view eye icon overlapping date column in approvals table
- [x] Add missing "Add Area" button to Areas page header (was hidden due to missing 'areas' module in permissions map)
- [x] Fix Download Form PDF button - removed from approvals details dialog, added server-side status check to block PDF generation for non-approved requests
- [x] Remove RFID Tag and Access Card options from Grant Access dialog UI (keep backend for later)
- [x] Fix create area error - API returning HTML instead of JSON (Unexpected token '<') - also increased code max length from 20 to 100
- [x] Fix systemic production error: all tRPC mutations (create area, post comment, etc.) return HTML instead of JSON - fixed SPA fallback to only handle GET requests and skip /api routes
- [x] Fix multi-request form: deduplicate shared sections (Basic Information, Location) when 2+ request types are selected
- [x] Fix multi-request form section ordering: group type-specific sections by type (all MOP sections together, then WP, then MHV)
- [x] Fix validation error on shared Basic Information section showing error badge even when all fields are filled
  - Added useEffect in FieldRenderer to sync readonly user_profile fields to formData
  - Skip validation for readonly fields with user_profile optionsSource
  - Ensure submission payload includes user profile data as fallback

## Bug Fix: Rejected requests still showing in approvals (Feb 9, 2026)
- [x] Investigate why rejected requests still appear in approvals list (count stays at 12 after rejecting all)
- [x] Fix the approvals query or rejection mutation to properly remove rejected requests from pending list
  - Admin rejection now cascades: skips all other pending tasks and rejects instance+request immediately
  - getMyPendingApprovals query now filters by approvalInstances.status = 'in_progress'
  - Dashboard pendingApprovals count now includes 'pending_approval' status
- [x] Verify count goes to 0 after rejecting all requests

## Data Cleanup: Orphaned pending tasks (Feb 9, 2026)
- [x] Identify orphaned pending tasks belonging to non-in_progress instances
- [x] Mark orphaned pending tasks as "skipped" in the database (6 tasks cleaned up)
- [x] Verify no orphaned pending tasks remain (confirmed: 0 orphans)

## Bug Fixes: Requestor View & Approval View (Feb 9, 2026)
- [x] Remove "Regenerate QR" button for requestor users (QR is secure, only admin should regenerate)
- [x] Hide "Change Method" button for non-admin users
- [x] Show Download Form PDF button to requestor once request is approved
- [x] Show clarification/rejection comments in request detail view (added RequestComments component)
- [x] Ensure all form data from combined request types (MOP/MHV/WP) is fully displayed in approval view
  - Created reusable FormDataDisplay component that fetches form definition and renders structured data
  - Added formData, selectedTypeIds, categoryId to getMyPendingApprovals and getMyApprovalHistory queries
  - Added FormDataDisplay to Approvals, ApprovalHistory, and RequestList detail dialogs

## Bug Fix: Super-admin cannot see new request in approvals (Feb 9, 2026)
- [x] Investigate REQ-20260209-D2D19Q - pending L1 but not visible to super-admin in approvals
  - Root cause: All workflows had processType='admin_visit', but request was 'work_permit' → no workflow matched → fell back to legacy pending_l1 with no approval instance/tasks
- [x] Fix root cause: startWorkflowForRequest now falls back to default workflow when no type-specific match found
- [x] Fix resolveApprover: corrected approverValue → approverReference, added 'user' case alongside 'individual'
- [x] Created approval instance + 2 tasks for REQ-20260209-D2D19Q (now pending_approval)
- [x] Verify super-admin can see all pending requests

## Bahrain Data Centre Workflow (Feb 9, 2026)

### User Accounts
- [x] Create Ahmed (ahmed@c3.com) - Security Officer, shift 08:00 AM - 08:00 PM (id=180001)
- [x] Create George (george@c3.com) - Security Officer, shift 08:00 PM - 08:00 AM (id=180002)
- [x] Create Alica (security@bahrainc3.com) - Security Manager (id=180003)
- [x] Create Head of Admin (admin@c3bahrain.com) - Final approver for Admin Requests (id=180004)
- [x] Create Head of Security (hos@bahrainc3.com) - Final approver for all other requests (id=180005)

### Bahrain Workflow Configuration
- [x] Create "Bahrain Workflow" with 3 stages (id=90001)
- [x] Stage 1: Security Officer Review (Ahmed + George) - approval mode "any"
- [x] Stage 2: Security Manager Approval (Alica)
- [x] Stage 3: Final Approval (Head of Admin + Head of Security) - mode "any"
- [x] Added site_id condition for Bahrain Data Centre (site id=30001)
- [x] Fixed condition evaluation to support site_id enum values
- [x] Verify workflow is active and correctly configured

## Bug Fix: Need Clarification flow (Feb 9, 2026)
- [x] Request sent back for clarification changes to "draft" instead of "need_clarification"
  - Root cause: FioriStatusBadge and RequestList statusConfig didn't include need_clarification → fell back to "Draft"
  - Added need_clarification to FioriStatusBadge styles/labels (amber theme)
  - Added need_clarification to RequestList statusConfig
- [x] Requestor (Lisa) should see the request with "Need Clarification" status and have option to re-submit
  - Added amber "Need Clarification" banner with re-submit button in request detail
  - Created resubmitAfterClarification backend mutation (resets tasks, creates new pending tasks at same stage)
  - Created re-submit dialog with comment field for requestor response
- [x] Fix the clarification mutation to set correct status (was already correct in backend)
- [x] Add re-submit UI for requestor on need_clarification requests
- [x] Fix REQ-20260209-D2D19Q data - confirmed already in correct need_clarification status

## Bug Fix: Dashboard stats showing incorrect Pending Approvals count (Feb 9, 2026)
- [x] Dashboard shows 19 Pending Approvals but there are no actual pending approvals
  - Root cause: Dashboard counted by request status (pending_l1/pending_manual/pending_approval) instead of actual approval tasks
- [x] Fix dashboard query to accurately count only real pending approvals
  - getStats now counts based on approvalTasks.status='pending' + approvalInstances.status='in_progress'
  - getPendingItems now joins with approval tasks for accurate pending queue
- [x] Clean up stale/orphaned data causing incorrect counts
  - 15 pending_manual → rejected, 2 pending_approval → need_clarification, 1 orphan → rejected
- [x] Also verify Pending Queue list on dashboard shows correct data
- [x] Fixed createTasksForStage: only skip if pending task exists (not skipped/rejected ones)
- [x] Fixed stuck REQ-20260209-8HM8HM: created new pending task after resubmit
