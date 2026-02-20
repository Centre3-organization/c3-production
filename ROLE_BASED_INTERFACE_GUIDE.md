# Centre3 Role-Based Interface Guide

## System Overview

Centre3 is a **multi-role access control system** designed for facility management with three distinct user interfaces, each optimized for their specific responsibilities:

1. **Customer Interface** - External vendors/clients submitting and tracking requests
2. **Employee Interface** - Internal approvers managing request workflows
3. **Security Team Interface** - Checkpoint guards verifying visitors and materials

---

## 1. CUSTOMER INTERFACE (External Users / Vendors / Clients)

### Purpose
Customers submit access requests, track their visits, and stay informed about facility policies without seeing internal operations.

### Dashboard Components

#### **My Upcoming Visits**
- List of approved visits with dates, times, and access zones
- Quick action: "Check-in" button when visit time approaches
- Shows: Visit ID, Date, Time Window, Duration, Access Zone
- Hides: Risk scoring, internal notes, SLA metrics

#### **My Pending Requests**
- Requests awaiting approval from internal team
- Shows: Request ID, Submission Date, Expected Decision Date
- Hides: Approver names, internal comments, why it's pending

#### **Freeze Window Notifications**
- Read-only calendar showing when facility is unavailable
- Examples: Maintenance windows, drills, VIP visits, high-load periods
- Customers cannot book during freeze periods
- Shows: Freeze date, duration, reason (generic: "Facility Maintenance" or "Scheduled Closure")
- Hides: Detailed maintenance plans, security drills, VIP names

#### **Announcements**
- Important updates from facility management
- Examples: New safety rules, policy changes, facility upgrades
- One-way communication (no customer replies)

#### **Calendar View**
- Visual representation of their approved visits
- Site availability status (Available/Unavailable)
- Freeze periods displayed in read-only mode
- Hides: Employee schedules, internal events, maintenance details

#### **Request Tracking Timeline**
- Historical record of all their requests
- Shows: Submission → Approval → Check-in → Completion
- Includes: Request status, approver decision, visit dates
- Hides: Internal comments, security assessments, risk evaluations

#### **More (Settings)**
- Profile management (name, company, contact info)
- Notification preferences (email, SMS, in-app)
- Document uploads (company certifications, insurance)
- Hides: Account history, access logs, security flags

### What Customers SHOULD NOT See

| Hidden Information | Why |
|---|---|
| **Risk Scoring** | Internal security assessment, could bias customer behavior |
| **Internal Comments** | Approver notes about customer or request quality |
| **SLA Breach Metrics** | Internal performance metrics not relevant to customers |
| **Other Vendors** | Competitive information and privacy |
| **Internal Security Alerts** | Operational security details (e.g., "High anomaly detected") |
| **Employee Names** | Privacy and security (don't expose approver identities) |
| **Facility Layout Details** | Security risk to show exact zones and access points |
| **Visitor Lists** | Privacy of other visitors |
| **Denial Reasons (Detailed)** | Generic message: "Request not approved" without specifics |

### Key Workflows

**Submitting a Request:**
1. Customer fills form: Name, Company, Purpose, Dates, Materials, Access Zone
2. System validates: Freeze windows, materials list, duration limits
3. Request submitted → Awaiting Approval
4. Customer receives notification when approved/rejected

**Tracking Visit:**
1. Customer sees upcoming visit in dashboard
2. Day of visit: "Check-in" button appears
3. Customer clicks check-in → Notifies security team
4. Security verifies visitor and materials
5. Timeline updates: "Checked In" → "Completed"

---

## 2. EMPLOYEE INTERFACE (Operations / Approvers)

### Purpose
Internal team members approve requests, manage workflows, and oversee facility operations with full visibility into SLAs and operational metrics.

### Dashboard Components

#### **Operational Dashboard**
NOT customer-style stats. Shows operational urgency:

**Access Requests Near SLA Breach**
- Hub time varies by group (e.g., Finance: 24 hours, IT: 48 hours, HR: 72 hours)
- **Critical Alert**: Requests reaching SLA in < 15 minutes
- Shows: Request ID, Customer, Submission Time, Time Remaining, Assigned Group
- Color coding: 
  - 🔴 Red: < 15 minutes to SLA breach
  - 🟡 Yellow: 15-60 minutes to SLA breach
  - 🟢 Green: > 60 minutes remaining

**Freeze Window Active**
- Current active freeze periods
- Shows: Freeze name, duration, reason, affected zones
- Action: Can extend freeze if needed

**Visitors Inside Facility**
- Real-time count of active visitors
- Shows: Visitor name, check-in time, access zone, materials verification status
- Action: Can view detailed visitor info

**High Risk Requests**
- Requests flagged by security system
- Shows: Request ID, Risk level, Reason for flag, Assigned to
- Action: Can review details, escalate, or approve with notes

**Security Alerts Impacting Access**
- Alerts triggered by security team
- Shows: Alert type, visitor involved, severity, impact on access
- Action: Can acknowledge, take action, or escalate

#### **Requests Queue**
- All requests in workflow (Pending, Approved, Rejected, Escalated)
- Filterable by: Status, Group, Date, Risk Level, Customer

**Actions on Each Request:**

| Action | When to Use | Result |
|---|---|---|
| **Approve** | Request meets all criteria | Visitor can proceed with visit |
| **Reject** | Request violates policy or safety | Customer notified with reason |
| **Send Back** | Request needs clarification or modification | Sent to specific group for review/revision |
| **Add Internal Notes** | Document decision reasoning | Hidden from customer, visible to team |
| **Escalate** | High-risk or policy exception needed | Sent to supervisor/security |

**Send Back Options (Choose Group):**
- **Back to Customer** - Request more info or modification
- **To Security Team** - For risk assessment
- **To Finance** - For budget/cost verification
- **To Compliance** - For policy/legal review
- **To Facilities** - For access zone availability

#### **Add Internal Notes**
- Rich text editor for approver comments
- Examples:
  - "Customer has history of bringing unauthorized items"
  - "Approved with condition: Must use escort in Zone A"
  - "Requires additional insurance verification"
- Completely hidden from customer
- Visible to all approvers and security team

#### **Calendar (Employee Version)**
Full operational calendar showing:
- **Maintenance Windows** - Facility downtime, what's being maintained
- **Drills** - Security drills, fire drills, evacuation procedures
- **High-Load Periods** - Expected high visitor volume
- **VIP Visits** - Important client visits (names visible to employees)
- **Freeze Periods** - When facility is closed to external visitors
- **Team Events** - All-hands meetings, training sessions

#### **Request Tracking Timeline**
- Historical view of all requests (not just their own)
- Can filter by: Approver, Customer, Date Range, Status
- Shows: Full decision history, notes, escalations
- Audit trail for compliance

#### **More (Settings)**
- Team management (add/remove approvers)
- SLA configuration per group
- Notification preferences
- Report generation
- Access logs

### What Employees CAN See (vs. Customers)

| Information | Customers | Employees |
|---|---|---|
| Risk Scoring | ❌ No | ✅ Yes |
| Internal Comments | ❌ No | ✅ Yes |
| SLA Metrics | ❌ No | ✅ Yes |
| Other Vendors | ❌ No | ✅ Yes (for coordination) |
| Security Alerts | ❌ No | ✅ Yes |
| Employee Names | ❌ No | ✅ Yes |
| Facility Details | ❌ No | ✅ Yes |
| Visitor Lists | ❌ No | ✅ Yes (for coordination) |
| Denial Reasons | Generic | ✅ Detailed |
| Approval History | ❌ No | ✅ Yes |

### Key Workflows

**Approving a Request:**
1. Request appears in queue (sorted by SLA urgency)
2. Approver reviews: Customer, Purpose, Materials, Access Zone, Risk Flag
3. Approver can:
   - **Approve** → Visitor can proceed
   - **Reject** → Customer notified with reason
   - **Send Back** → To specific group for review
   - **Add Notes** → Document reasoning
4. System logs decision and timestamps

**Managing SLA Breach Risk:**
1. Dashboard shows requests near SLA breach
2. Approver prioritizes red/yellow items
3. If cannot approve: Send back to appropriate group with reason
4. System tracks SLA compliance metrics per approver

**Escalating High-Risk Request:**
1. Security team flags request as high-risk
2. Appears in "High Risk Requests" section
3. Approver can review risk assessment
4. Options: Approve with conditions, Reject, Escalate to supervisor

---

## 3. SECURITY TEAM INTERFACE (Checkpoint Guards)

### Purpose
Guards verify visitors, check materials, and manage real-time access at checkpoints with full operational context.

### Dashboard Components

#### **Security Dashboard**
Real-time operational status:

**Visitors Expected Today**
- List of approved visitors scheduled for today
- Shows: Visitor Name, Company, Check-in Time, Access Zone, Risk Level
- Action: Can view full request details, materials list

**Visitors Waiting Check-In**
- Visitors who have arrived but not yet checked in
- Shows: Visitor Name, Arrival Time, Time Waiting, Access Zone
- Action: Can initiate check-in process

**Active Visitors Inside**
- Currently checked-in visitors
- Shows: Visitor Name, Check-in Time, Duration Remaining, Access Zone, Materials Status
- Action: Can view details, log escalations

#### **Check-In Screen**
When a visitor arrives, security opens the request and sees:

**Request Information:**
- **Request ID** - Unique identifier for tracking
- **Visitor Name** - Full name of visitor
- **Company** - Visitor's company/organization
- **Access Zone** - Where visitor can access (MMR / White / Grey / etc.)
- **Valid Time Window** - Approved hours for access
- **Risk Level** - System assessment (Low/Medium/High)
- **Materials Expected** - What visitor should bring

**Materials Verification Checklist:**
- Itemized list of expected materials
- Examples: Laptop, Fiber cables (X4), Hard drives, USB devices
- Guard checks off each item as verified
- **Important**: If visitor doesn't have all materials:
  - Visitor can still be approved
  - Requester can bring missing materials during approved duration
  - Guard records which materials are missing
  - Timeline shows: "Approved - Partial Materials"

**Photo Capture:**
- Camera integration to capture visitor photo
- Stored with request for audit trail
- Used for face matching (if AI enabled)

**AI-Powered Verification (Optional):**
- Document validation (ID, Iqama, Passport)
- Face matching against ID photo
- Anomaly detection alerts
- Plate recognition for vehicles

#### **Live Requests**
Real-time view of all active requests:

| Column | Shows | Purpose |
|---|---|---|
| **Request ID** | Unique identifier | Quick reference |
| **Status** | Pending/Approved/Completed/Escalated | Workflow state |
| **Duration Remaining** | Time left for access | Countdown to expiry |
| **Visitor Name** | Full name | Identification |
| **Access Zone** | Where they can go | Boundary enforcement |
| **Materials Status** | Complete/Partial/Missing | Verification tracking |
| **Check-in Time** | When they arrived | Duration tracking |

**Actions on Live Requests:**

| Action | When to Use | Result |
|---|---|---|
| **Approve** | All materials verified, ID valid | Visitor granted access |
| **Deny** | Risk detected, materials missing, ID invalid | Visitor denied entry, logged |
| **Escalate** | Behavior concern, unauthorized extra person, expired ID | Sent to supervisor |
| **Log Escalation** | Document incident | Creates alert for approvers |

**Escalation Types:**
- **Behavior Concern** - Visitor acting suspiciously
- **Unauthorized Extra Person** - Visitor brought someone not approved
- **Expired ID** - Visitor's ID/Iqama expired
- **Materials Mismatch** - Brought different materials than approved
- **Access Zone Violation** - Attempting to access unauthorized area
- **Watchlist Match** - Visitor flagged in security database
- **Multiple Denials** - Visitor has been denied multiple times
- **Anomaly Detected** - AI flagged unusual pattern

#### **Materials Verification Checklist**
- Detailed list per request
- Guard physically verifies each item
- Can mark: ✅ Present, ❌ Missing, ⚠️ Damaged
- Notes field for details
- **Key Point**: Partial materials doesn't block approval
  - Requester can deliver missing items later
  - Guard records what's missing
  - Timeline shows complete history

#### **Request Tracking Timeline**
- Full history of request from submission to completion
- Shows: All decisions, notes, escalations, materials verification
- Visible to: Security team, approvers, customer (partial)

#### **More (Settings)**
- Camera settings (resolution, storage)
- AI feature toggles (document validation, face matching, anomaly detection)
- Notification preferences
- Checkpoint configuration

### What Security Team Sees

| Information | Customers | Employees | Security |
|---|---|---|---|
| Risk Scoring | ❌ | ✅ | ✅ |
| Internal Comments | ❌ | ✅ | ✅ |
| SLA Metrics | ❌ | ✅ | ❌ |
| Other Vendors | ❌ | ✅ | ✅ |
| Security Alerts | ❌ | ✅ | ✅ |
| Visitor Details | ❌ | ✅ | ✅ |
| Materials List | ❌ | ✅ | ✅ |
| Access Zones | ❌ | ✅ | ✅ |
| Watchlist Status | ❌ | ✅ | ✅ |
| Approval History | ❌ | ✅ | ✅ |

### Key Workflows

**Visitor Check-In:**
1. Visitor arrives at checkpoint
2. Guard opens request by ID/name
3. Guard verifies:
   - Visitor identity (photo match, ID check)
   - Time window (is visit still valid?)
   - Access zone (can they go where they requested?)
   - Risk level (any alerts?)
4. Guard checks materials:
   - Verifies each item in checklist
   - Records missing items if any
5. Guard can:
   - **Approve** → Visitor proceeds
   - **Deny** → Visitor denied entry
   - **Escalate** → Alert supervisor
6. System logs decision with timestamp

**Handling Partial Materials:**
1. Visitor arrives without all approved materials
2. Guard checks available materials
3. Guard can still approve visit
4. System records: "Approved - Partial Materials"
5. Requester can deliver missing items during approved window
6. Guard logs when missing items arrive
7. Timeline shows complete materials history

**Escalating Incident:**
1. Guard detects issue (behavior, unauthorized person, expired ID)
2. Guard selects escalation type
3. Guard adds notes describing incident
4. System creates alert for approvers/supervisors
5. Incident logged for audit trail
6. Approver receives notification

---

## Data Flow & Privacy Model

### What Each Role Sees

```
CUSTOMER INTERFACE
├── My Upcoming Visits (own approved visits)
├── My Pending Requests (own requests awaiting approval)
├── Freeze Windows (read-only facility closures)
├── Announcements (facility updates)
├── Calendar (own visits + freeze periods)
└── Request Timeline (own request history)

EMPLOYEE INTERFACE
├── Operational Dashboard (all requests, SLA metrics, alerts)
├── Requests Queue (all pending requests)
├── Approval Actions (approve, reject, send back, notes)
├── Full Calendar (maintenance, drills, VIP, freeze periods)
├── Request Timeline (all requests, full history)
└── Team Management (approvers, SLA config)

SECURITY INTERFACE
├── Security Dashboard (today's visitors, active visitors)
├── Check-In Screen (request details, materials, risk)
├── Live Requests (all active visitors)
├── Materials Verification (checklist, tracking)
├── Escalation Management (incident logging)
└── Request Timeline (full history for audit)
```

### Hidden Information by Role

**CUSTOMERS CANNOT SEE:**
- Risk scoring or security assessments
- Internal approver comments or notes
- SLA metrics or performance data
- Other vendors or visitors
- Detailed denial reasons
- Facility security details
- Employee names or contact info

**EMPLOYEES CANNOT SEE:**
- Customer financial information
- Detailed security alert specifics (only summary)
- Checkpoint guard identities (privacy)

**SECURITY TEAM CANNOT SEE:**
- SLA metrics (not their responsibility)
- Approver identities (operational need-to-know)
- Financial/billing information

---

## Key Design Principles

### 1. **Role-Based Access Control (RBAC)**
- Each role sees only what they need to do their job
- Information is hidden, not just disabled
- No "you don't have permission" messages to customers

### 2. **Operational Transparency**
- Employees see full context for decision-making
- Security team sees risk indicators for safety
- Customers see only their own requests

### 3. **Audit Trail**
- Every action logged with timestamp and user
- Full history visible to appropriate roles
- Compliance-ready for regulatory requirements

### 4. **SLA Management**
- Employees see SLA urgency (red/yellow/green)
- Automatic escalation before SLA breach
- Notifications 15 minutes before breach

### 5. **Material Tracking**
- Flexible material verification (partial approval allowed)
- Complete history of what was brought/missing
- Requester can deliver items during visit window

### 6. **Security Integration**
- Real-time risk assessment
- AI-powered verification (optional)
- Escalation workflow for incidents
- Watchlist integration

---

## Implementation Checklist

- [ ] Customer Interface Dashboard (Upcoming Visits, Pending Requests, Freeze Windows)
- [ ] Customer Calendar View (Approved Visits + Freeze Periods)
- [ ] Customer Request Tracking Timeline
- [ ] Employee Operational Dashboard (SLA, High Risk, Security Alerts)
- [ ] Employee Requests Queue with Actions (Approve, Reject, Send Back, Notes)
- [ ] Employee Calendar (Full Operational View)
- [ ] Security Check-In Screen (Request Details + Materials Checklist)
- [ ] Security Live Requests Dashboard
- [ ] Security Escalation Management
- [ ] Role-Based Access Control (RBAC) System
- [ ] Audit Logging (All Actions with Timestamps)
- [ ] SLA Tracking & Notifications (15-min before breach)
- [ ] Material Verification Workflow (Partial Approval Support)
- [ ] AI Integration (Optional: Document Validation, Face Matching, Anomaly Detection)
- [ ] Notification System (Email, SMS, In-App per Role)

---

## Summary Table

| Feature | Customer | Employee | Security |
|---|---|---|---|
| **Submit Request** | ✅ | ❌ | ❌ |
| **Approve Request** | ❌ | ✅ | ❌ |
| **Check-In Visitor** | ❌ | ❌ | ✅ |
| **View SLA Metrics** | ❌ | ✅ | ❌ |
| **See Risk Scores** | ❌ | ✅ | ✅ |
| **View Other Vendors** | ❌ | ✅ | ✅ |
| **Manage Materials** | ❌ | ✅ | ✅ |
| **Escalate Incidents** | ❌ | ✅ | ✅ |
| **View Internal Notes** | ❌ | ✅ | ✅ |
| **Access Calendar** | ✅ (Limited) | ✅ (Full) | ✅ (Operational) |
| **Track Timeline** | ✅ (Own) | ✅ (All) | ✅ (All) |
