# Admin Visit Form Test Findings - Jan 31, 2026 (v3)

## Location Cascade - WORKING
- Country dropdown shows all 20 countries
- Selected Saudi Arabia
- City dropdown now shows only Saudi Arabia cities (Abha, Buraidah, Dammam, Dhahran, Jeddah, Jubail, etc.)
- Note: Some cities appear duplicated (Dammam x2, Dhahran x2, Jeddah x2, Khobar x2, etc.) - may need to clean up database

## Basic Information - WORKING
- Requestor Name: Full User (auto-populated)
- Email: full-user-1769869316102@centre3.com (auto-populated)
- Mobile: +966 50 123 4567 (auto-populated)
- Company: empty (user may not have company set)
- Department: empty (user may not have department set)

## Host Section - WORKING
- Shows "Full User" with email already selected
- User search is working

## VIP Visit Toggle - VISIBLE
- Yes/No radio buttons are visible in Basic Information section

## Issues to Address
1. Duplicate cities in database need cleanup
2. Region dropdown is optional but shows "Select" - should show all regions
3. VIP Details section still not showing in sidebar when VIP Visit = Yes
