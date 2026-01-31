# Admin Visit Form Test Findings - Jan 31, 2026

## Basic Information Section - WORKING
- Requestor Name: Full User ✅
- Company: Manager (showing jobTitle as fallback) ✅
- Email: full-user-1769869316102@centre3.com ✅
- Mobile: +966 50 123 4567 ✅
- Department: Empty (user doesn't have departmentId set) ⚠️
- Purpose of Entry: Dropdown visible ✅
- Visit Description: Textarea visible ✅
- Additional Notes: Textarea visible ✅
- VIP Visit: Yes/No radio buttons visible ✅

## Sections in Sidebar
- Basic Information ✅
- Location ✅
- Host ✅
- Schedule ✅
- Visitors ✅
- Attachments ✅
- VIP Details: NOT VISIBLE (should appear when VIP Visit = Yes)

## Issues Found
1. VIP Details section not showing in sidebar even though showCondition is set
2. Department field empty because test user doesn't have departmentId
3. Company showing "Manager" (jobTitle) instead of actual company name

## Next Steps
- Check if VIP Details section showCondition is being evaluated correctly
- Need to test clicking VIP Visit = Yes to see if VIP Details appears
