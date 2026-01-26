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
- [ ] Update Add User form with: First name, Last name, Email, Phone Number, Temporary Password, Role, Department
- [ ] Update backend to handle new user fields

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
