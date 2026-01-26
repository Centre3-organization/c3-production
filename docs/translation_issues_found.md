# Translation Issues Found (Jan 26, 2026)

## Working Translations (Sidebar)
- ✅ لوحة التحكم (Dashboard)
- ✅ جميع الطلبات (All Requests)
- ✅ طلب جديد (New Request)
- ✅ الموافقات (Approvals)
- ✅ موافقة المستوى الأول (L1 Approval)
- ✅ موافقة المستوى الثاني (L2 Approval)
- ✅ المواقع (Sites)
- ✅ المناطق (Zones)
- ✅ الأقسام (Areas)
- ✅ المراقبة العالمية (Global Overwatch)
- ✅ تنبيهات الأمان (Security Alerts)
- ✅ منشئ سير العمل (Workflow Builder)
- ✅ إدارة الورديات (Shift Management) - NOW WORKING!
- ✅ التفويضات (Delegations)
- ✅ المجموعات (Groups)
- ✅ المستخدمين والأدوار (Users & Roles)
- ✅ الإعدادات (Settings)
- ✅ تسجيل الخروج (Logout)

## Dashboard Translations Working
- ✅ مركز القيادة (Command Center)
- ✅ رؤية تشغيلية وتحكم في الوقت الفعلي (Real-time operational visibility & control)
- ✅ تحديث البيانات (Refresh Data)
- ✅ الموافقات المعلقة (Pending Approvals)
- ✅ إجمالي الطلبات (Total Requests)
- ✅ المرافق (Facilities)
- ✅ قائمة المستوى الأول (L1 Queue)
- ✅ إجراءات سريعة (Quick Actions)

## Issues Found - Need Fixing
1. "Action Required" - not translated (should be "إجراء مطلوب")
2. "This Month" - not translated (should be "هذا الشهر")
3. "zones · areas" - not translated
4. "L2 Queue (0)" - not translated (should be "قائمة المستوى الثاني")
5. "Global Overwatch" in quick actions - not translated
6. "View" buttons - not translated (should be "عرض")
7. "Manage" button - not translated (should be "إدارة")
8. "View All" - not translated (should be "عرض الكل")
9. "View All Requests" - not translated
10. "Pending L1/L2" cards - not translated
11. "Awaiting initial/final review" - not translated
12. Request table columns not translated
13. "Approved" status not translated
14. "minutes ago" not translated

## Root Cause
The Dashboard component is not using the useTranslation hook for all strings.
Some strings are hardcoded in the component instead of using t() function.
