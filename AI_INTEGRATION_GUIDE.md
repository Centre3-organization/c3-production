# Centre3 AI Integration & Checkpoint Features Guide

## Overview

Centre3 Security Operations platform includes comprehensive AI-powered verification, real-time monitoring, and intelligent alerting capabilities. This document explains the four core integration modules and their implementation status.

---

## 1. Camera Service

### Purpose
Enable guards to capture visitor photos during checkpoint verification for identity verification, audit trails, and face matching.

### Features Implemented ✅

| Feature | Status | Details |
|---------|--------|---------|
| **Photo Capture** | ✅ Implemented | Browser-based camera access via WebRTC API |
| **Resolution Settings** | ✅ Implemented | Configurable: VGA (640x480), HD (1280x720), Full HD (1920x1080) |
| **Camera Selection** | ✅ Implemented | Front camera (selfie) or back camera support |
| **Photo Storage** | ✅ Implemented | Photos uploaded to S3 with signed URLs |
| **Browser Permissions** | ✅ Implemented | Graceful handling of camera permission denials |
| **Settings Persistence** | ✅ Implemented | Camera settings saved to localStorage |

### Features Not Yet Implemented ❌

| Feature | Reason | Priority |
|---------|--------|----------|
| **Photo Compression** | Reduce upload size for slow networks | Medium |
| **Real-time Preview** | Show live camera feed before capture | Medium |
| **Multiple Photo Capture** | Allow multiple angles per visitor | Low |
| **Photo Annotation** | Add notes/marks to photos | Low |
| **Batch Photo Upload** | Queue and upload multiple photos | Medium |

### Configuration Location
- **UI Path**: Administration → Integration Hub → Camera tab
- **Settings Stored**: `localStorage['checkpoint_integrations'].camera`
- **Configurable Options**:
  - Enable/disable camera service
  - Default resolution
  - Default camera (front/back)

### Code Files
- **Frontend**: `/client/src/pages/IntegrationsDashboard.tsx` (lines 139-197)
- **Component**: `/client/src/components/DocumentValidationModal.tsx` (camera capture logic)
- **Service**: `/client/src/services/aiService.ts` (photo handling)

---

## 2. AI Services

### Purpose
Automate identity verification using Claude Vision API for document validation, face matching, and anomaly detection.

### Features Implemented ✅

| Feature | Status | Details |
|---------|--------|---------|
| **Document Validation** | ✅ Implemented | Extract text from ID, Iqama, Passport using Claude Vision |
| **Face Matching** | ✅ Implemented | Compare visitor photo with ID document photo |
| **Anomaly Detection** | ✅ Implemented | Analyze visitor data for suspicious patterns |
| **Claude API Integration** | ✅ Implemented | Server-side LLM calls with JSON Schema responses |
| **API Key Management** | ✅ Implemented | Secure storage in environment variables |
| **Error Handling** | ✅ Implemented | Graceful fallback when AI is disabled |
| **Settings UI** | ✅ Implemented | Enable/disable individual AI features |

### Features Not Yet Implemented ❌

| Feature | Reason | Priority |
|---------|--------|----------|
| **Plate Recognition** | Vehicle identification for parking/access | High |
| **Behavioral Analysis** | Detect suspicious movement patterns | Medium |
| **Real-time Alerts** | Immediate notification when anomalies detected | High |
| **Confidence Scoring** | Display confidence % for each AI decision | Medium |
| **Audit Trail** | Log all AI decisions for compliance | High |
| **Batch Processing** | Process multiple requests asynchronously | Medium |
| **Model Fine-tuning** | Customize Claude model for specific use cases | Low |

### Configuration Location
- **UI Path**: Administration → Integration Hub → AI Services tab
- **Settings Stored**: `localStorage['checkpoint_integrations'].ai`
- **Configurable Options**:
  - Enable/disable AI services
  - Claude API key (password field)
  - Enable/disable individual features:
    - Face Matching
    - Document Validation
    - Anomaly Detection
    - Plate Recognition (UI ready, backend not implemented)

### API Endpoints
- **Document Validation**: `POST /api/trpc/checkpoint.validateDocument`
  - Input: Document image URL, document type
  - Output: Extracted fields, confidence score, validity status
  
- **Face Matching**: `POST /api/trpc/checkpoint.matchFaces`
  - Input: Visitor photo URL, ID photo URL
  - Output: Match score (0-100), match result (match/no-match/unclear)

- **Anomaly Detection**: `POST /api/trpc/checkpoint.detectAnomalies`
  - Input: Visitor data (name, ID, access history)
  - Output: Risk score, anomalies detected, recommendations

### Code Files
- **Frontend UI**: `/client/src/pages/IntegrationsDashboard.tsx` (lines 199-300)
- **Modal Component**: `/client/src/components/DocumentValidationModal.tsx`
- **Service Layer**: `/client/src/services/aiService.ts`
- **Backend Router**: `/server/modules/checkpoint/checkpoint-settings.router.ts`
- **Backend LLM Integration**: `/server/_core/llm.ts`
- **Shared Conditions**: `/shared/trigger-conditions.ts`

### Example: Document Validation Flow
```typescript
// 1. Guard captures document photo in DocumentValidationModal
// 2. Photo uploaded to S3
// 3. Frontend calls: trpc.checkpoint.validateDocument({ imageUrl, documentType })
// 4. Backend calls Claude Vision API with JSON Schema
// 5. Claude extracts: name, ID number, nationality, expiry date, etc.
// 6. Returns confidence score and validity status
// 7. Guard sees results and can approve/reject
```

---

## 3. Notifications

### Purpose
Alert supervisors and security teams about security incidents, access denials, and system events via multiple channels.

### Features Implemented ✅

| Feature | Status | Details |
|---------|--------|---------|
| **Email Notifications** | ✅ Implemented | SMTP integration for alert emails |
| **SMS Notifications** | ✅ Implemented | SMS gateway integration for text alerts |
| **In-App Notifications** | ✅ Implemented | Real-time notifications in dashboard |
| **Webhook Integration** | ✅ Implemented | Send alerts to external systems |
| **Notification Templates** | ✅ Implemented | Customizable message templates |
| **Recipient Management** | ✅ Implemented | Configure who receives which alerts |
| **Notification Settings** | ✅ Implemented | Enable/disable channels per alert type |

### Features Not Yet Implemented ❌

| Feature | Reason | Priority |
|---------|--------|----------|
| **WhatsApp Integration** | Send alerts via WhatsApp Business API | High |
| **Push Notifications** | Mobile app push notifications | Medium |
| **Notification Scheduling** | Send alerts at specific times | Low |
| **Escalation Rules** | Auto-escalate if not acknowledged | High |
| **Notification History** | View all sent notifications | Medium |
| **Delivery Confirmation** | Track if notifications were read | Medium |
| **Batch Notifications** | Send to multiple recipients | Medium |
| **Rich Media Support** | Include photos/videos in notifications | Low |

### Configuration Location
- **UI Path**: Administration → Integration Hub → Notifications tab
- **Settings Stored**: `localStorage['checkpoint_integrations'].notifications`
- **Configurable Options**:
  - Enable/disable email notifications
  - Enable/disable SMS notifications
  - Supervisor email address
  - Supervisor phone number

### Code Files
- **Frontend UI**: `/client/src/pages/IntegrationsDashboard.tsx` (lines 300-380)
- **Backend Service**: `/server/_core/notification.ts`
- **tRPC Procedure**: `trpc.system.notifyOwner` (owner notifications)
- **Notification Router**: `/server/modules/security/alerts.router.ts`

### Example: Alert Notification Flow
```typescript
// 1. Security alert triggered (e.g., watchlist match)
// 2. Alert configuration checked for notification rules
// 3. For each configured recipient:
//    - Email sent via SMTP
//    - SMS sent via gateway
//    - In-app notification created
// 4. Notification logged to database
// 5. Recipient can acknowledge/dismiss
```

---

## 4. Watchlist

### Purpose
Track flagged persons and vehicles for security monitoring, with automatic alerts when watchlist entries attempt access.

### Features Implemented ✅

| Feature | Status | Details |
|---------|--------|---------|
| **Watchlist Management** | ✅ Implemented | Add/remove persons and vehicles |
| **High-Risk Flagging** | ✅ Implemented | Auto-flag high-risk incidents |
| **Watchlist Search** | ✅ Implemented | Search by name, ID, plate |
| **Retention Policy** | ✅ Implemented | Auto-archive old entries (configurable days) |
| **Watchlist Alerts** | ✅ Implemented | Trigger alerts on watchlist matches |
| **Status Tracking** | ✅ Implemented | Track entry status (active, archived, resolved) |
| **Audit Trail** | ✅ Implemented | Log all watchlist changes |

### Features Not Yet Implemented ❌

| Feature | Reason | Priority |
|---------|--------|----------|
| **Facial Recognition Match** | Auto-match photos to watchlist faces | High |
| **Plate Recognition Match** | Auto-match vehicle plates | High |
| **Risk Scoring** | Calculate risk level per watchlist entry | Medium |
| **Watchlist Categories** | Organize by threat level (critical, high, medium) | Medium |
| **Bulk Import** | Import watchlist from CSV/Excel | Medium |
| **Bulk Export** | Export watchlist for reporting | Medium |
| **Integration with Law Enforcement** | Connect to national databases | Low |
| **Real-time Sync** | Sync with external watchlist sources | Low |

### Configuration Location
- **UI Path**: Administration → Integration Hub → Watchlist tab
- **Settings Stored**: `localStorage['checkpoint_integrations'].watchlist`
- **Configurable Options**:
  - Enable/disable watchlist
  - Auto-flag high-risk entries
  - Retention period (days before archival)

### Code Files
- **Frontend UI**: `/client/src/pages/IntegrationsDashboard.tsx` (lines 380-450)
- **Watchlist Router**: `/server/modules/security/watchlist.router.ts`
- **Watchlist Service**: `/server/modules/security/watchlist.service.ts`
- **Database Schema**: `/drizzle/schema.ts` (watchlist tables)

### Example: Watchlist Alert Flow
```typescript
// 1. Guard searches for visitor at checkpoint
// 2. System checks watchlist for matches
// 3. If match found:
//    - Alert displayed to guard
//    - Notification sent to supervisors
//    - Access denied (unless override)
//    - Incident logged
// 4. Supervisor can review and update watchlist status
```

---

## Security Alert Configuration System

### Purpose
Create custom security rules that automatically trigger alerts when specific conditions are met during checkpoint operations.

### Features Implemented ✅

| Feature | Status | Details |
|---------|--------|---------|
| **Alert Type Management** | ✅ Implemented | 8 default alert types seeded |
| **Trigger Conditions** | ✅ Implemented | 14 predefined conditions with dropdowns |
| **Action Configuration** | ✅ Implemented | Define actions when alert triggers |
| **Viewer Management** | ✅ Implemented | Control who sees each alert |
| **Notification Rules** | ✅ Implemented | Configure channels and recipients |
| **Modal UI** | ✅ Implemented | 5-tab workflow builder interface |
| **Database Schema** | ✅ Implemented | 4 tables for alert management |
| **Backend Procedures** | ✅ Implemented | 13 tRPC procedures for CRUD |

### Features Not Yet Implemented ❌

| Feature | Reason | Priority |
|---------|--------|----------|
| **Alert Trigger Engine** | Background job to execute alerts | **CRITICAL** |
| **Real-time Alert Dashboard** | Display triggered alerts with status | **CRITICAL** |
| **Alert Escalation** | Auto-escalate unacknowledged alerts | High |
| **Alert Deduplication** | Prevent duplicate alerts | High |
| **Alert Suppression** | Temporarily suppress alerts | Medium |
| **Alert Analytics** | Dashboard showing alert trends | Medium |
| **Bulk Alert Creation** | Template-based alert creation | Low |

### Configuration Location
- **UI Path**: Process Configuration → Security Alerts
- **Database Tables**:
  - `securityAlertTypes` - Alert type definitions
  - `securityAlertConfigs` - Alert configurations
  - `securityAlertNotifications` - Notification rules
  - `securityAlertLogs` - Alert execution history

### Default Alert Types Seeded
1. **Unauthorized Access Attempt** (breach, high severity)
2. **Suspicious Activity** (impact, medium severity)
3. **Access Denied** (status, low severity)
4. **Document Validation Failed** (view, high severity)
5. **Face Match Failed** (action, high severity)
6. **Plate Recognition Alert** (breach, medium severity)
7. **After-Hours Access** (impact, medium severity)
8. **Duplicate Entry** (status, low severity)

### Predefined Trigger Conditions (14 total)

**Visitor Conditions:**
- Same-day visit count exceeds threshold
- Visitor on watchlist
- Document expired
- Face match failed

**Request Conditions:**
- Multiple denials in timeframe
- Access outside business hours
- Unusual access pattern
- High-risk zone access

**Checkpoint Conditions:**
- High denial rate
- System error rate high
- Unauthorized camera disable
- Configuration changed

**System Conditions:**
- Database connection failed
- API rate limit exceeded
- Backup failed
- Security audit triggered

### Code Files
- **Frontend Modal**: `/client/src/components/SecurityAlertConfigModal.tsx`
- **Frontend Page**: `/client/src/pages/SecurityAlertConfig.tsx`
- **Backend Router**: `/server/modules/security/alertConfig.router.ts`
- **Conditions Library**: `/shared/trigger-conditions.ts`
- **Database Schema**: `/drizzle/schema.ts` (lines 2691-2800)

---

## Implementation Roadmap

### Phase 1: Foundation ✅ COMPLETE
- [x] Camera service with photo capture
- [x] AI Services UI with feature toggles
- [x] Notifications configuration
- [x] Watchlist management UI
- [x] Security Alert Configuration modal
- [x] 8 default alert types seeded
- [x] 14 predefined trigger conditions

### Phase 2: Integration (IN PROGRESS)
- [ ] **URGENT**: Build Alert Trigger Engine
  - Monitor checkpoint requests in real-time
  - Evaluate conditions against configured rules
  - Execute actions when conditions match
  - Log results to securityAlertLogs

- [ ] **URGENT**: Real-time Alert Dashboard
  - Display triggered alerts with status
  - Show alert history and escalation
  - Allow acknowledgment and resolution
  - Bulk actions (acknowledge all, resolve all)

- [ ] Plate Recognition Implementation
  - Integrate with vehicle recognition API
  - Match plates against watchlist
  - Auto-flag suspicious vehicles

### Phase 3: Enhancement (PLANNED)
- [ ] WhatsApp notification integration
- [ ] Alert escalation rules
- [ ] Notification delivery confirmation
- [ ] Batch operations
- [ ] Advanced analytics dashboard

---

## Integration Points

### Checkpoint Search Flow
```
Guard searches for visitor
  ↓
System checks watchlist → Watchlist Alert triggered
  ↓
Guard captures photo → Camera Service
  ↓
AI validates document → Document Validation Alert triggered
  ↓
AI matches faces → Face Match Alert triggered
  ↓
Guard approves/denies entry
  ↓
Anomaly detection runs → Anomaly Alert triggered
  ↓
Notifications sent to supervisors
  ↓
Alert logged to database
```

### Configuration Hierarchy
```
Integration Hub (Admin Settings)
├── Camera Configuration
├── AI Services Configuration
├── Notifications Configuration
└── Watchlist Configuration

Security Alert Configuration (Process Configuration)
├── Alert Type Selection
├── Trigger Conditions (14 predefined)
├── Action Points
├── Viewer Management
└── Notification Rules
```

---

## Security Considerations

### Data Privacy
- Photos stored in S3 with encryption
- Claude API calls use HTTPS
- API keys stored in environment variables (not localStorage in production)
- Watchlist entries encrypted in database

### Access Control
- AI Integrations accessible only to super-admin
- Security Alerts configurable by admins
- Notifications sent based on role permissions
- Audit trail for all configuration changes

### API Security
- Claude API key validation before use
- Rate limiting on AI endpoints
- Request signing for S3 operations
- CSRF protection on all forms

---

## Troubleshooting

### Camera Not Working
1. Check browser permissions (Settings → Privacy → Camera)
2. Verify HTTPS connection (required for camera access)
3. Try different camera (front/back toggle)
4. Check browser console for errors

### AI Services Returning Errors
1. Verify Claude API key is valid
2. Check API key has sufficient credits
3. Verify image URL is accessible
4. Check file size (max 20MB)

### Notifications Not Sending
1. Verify SMTP/SMS credentials
2. Check recipient email/phone format
3. Review notification settings in Integration Hub
4. Check server logs for delivery errors

### Watchlist Alerts Not Triggering
1. Verify watchlist is enabled
2. Check entry is marked as active
3. Verify alert configuration exists
4. Check trigger conditions match

---

## Support & Documentation

- **API Documentation**: `/server/modules/checkpoint/checkpoint-settings.router.ts`
- **Component Documentation**: JSDoc comments in component files
- **Database Schema**: `/drizzle/schema.ts`
- **Configuration Files**: `.env.example`

For additional support, contact the security operations team.
