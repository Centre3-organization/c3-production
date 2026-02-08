# UI/UX Audit Findings

## Standard Header Pattern (Reference: My Approvals)
```
<h1 className="text-2xl font-medium text-[#2C2C2C] leading-8">Title</h1>
<p className="text-sm text-[#6B6B6B]">Single subtitle line</p>
```

## Issues Found

### 1. Duplicate Subtitles
- Users.tsx:651-652 - TWO subtitle lines
- Groups.tsx:378-381 - TWO subtitle lines  
- ShiftManagement.tsx:171-172 - TWO subtitle lines
- McmDashboard.tsx:76-79 - TWO subtitle lines (different text)

### 2. Missing text-sm on subtitle
- DelegationManagement.tsx:103 - missing text-sm
- Companies.tsx:157 - missing text-sm, has mt-1 instead
- CardDirectory.tsx:165 - missing text-sm
- Groups.tsx:379 - missing text-sm on second p

### 3. Sites/Zones/Areas - SAP Fiori style headers (inconsistent with rest)
- Sites.tsx:243-250 - has back arrow + inline subtitle + ChevronDown
- Zones.tsx:297-306 - same SAP Fiori pattern
- Areas.tsx - same pattern

### 4. Edit Zone/Site/Area - IBM Maximo dark header
- Sites.tsx:407-445 - dark bg-[#2C2C2C] header with "LOGGED IN AS: ADMIN USER"
- Zones.tsx:489-527 - same dark header
- Areas.tsx:433-466 - same dark header

### 5. Security Level Badges - Light text on light bg
- Zones.tsx:276-279 - text-[#FFB84D] on bg-[#FFF4E5] (poor contrast)

### 6. Material Types in sidebar
- Layout.tsx:216-218 - Master Data section with Material Types link

### 7. Inconsistent page wrapper
- Some pages use p-6 space-y-6
- Sites/Zones/Areas use flex flex-col h-[calc(100vh-6rem)]
