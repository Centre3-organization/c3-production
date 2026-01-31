# Admin Visit Form Test Findings - Jan 31, 2026 v2

## Country Dropdown - WORKING
- Countries are now loading correctly
- Selected Saudi Arabia successfully

## Region Dropdown - WORKING
- Regions are filtering by country correctly
- Shows Central, Eastern, Western for Saudi Arabia

## City Dropdown - BUG FOUND
- Cities are NOT filtering by region correctly
- Showing Kuwait cities (Ahmadi, Hawalli, Jahra, Kuwait City, Salmiya) instead of Saudi Arabia Eastern region cities
- The filterByField is set to "country" but should be filtering by "region"

## Issue Analysis
The city dropdown is configured with filterByField = "country" but the cities table uses countryId column, not regionId.
Need to either:
1. Add regionId to cities table and update the data
2. Or change the cascade to Country -> City -> Site (skip region)

## Basic Information - PARTIALLY WORKING
- Requestor Name is auto-populated from user profile
- Email is auto-populated
- Mobile is auto-populated
- Company and Department are NOT populated (likely user profile doesn't have these values)

## VIP Visit Section - VISIBLE
- VIP Visit Yes/No toggle is showing in Basic Information section
- Need to test if VIP Details section appears when Yes is selected
