import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  // ============================================================
  // 1) Convert Contractor Line Manager (id=84) to user_lookup
  // ============================================================
  console.log('=== Updating Contractor Line Manager to user_lookup ===');
  await conn.execute("UPDATE formFields SET fieldType = 'user_lookup', optionsSource = 'users' WHERE id = 84");
  console.log('Line Manager updated to user_lookup');

  // ============================================================
  // 2) Update Activity Details (id=85) - checkbox_group
  //    From screenshot: HW Install/Replace/Remove, SW Configure/Upgrade,
  //    Corrective Maintenance, Preventive Maintenance,
  //    Testing & Commissioning, Fit Out/Rehab, Snag Clearance
  // ============================================================
  console.log('=== Updating Activity Details options ===');
  const activityDetailsOptions = JSON.stringify([
    { label: "HW Install/Replace/Remove", labelAr: "تركيب/استبدال/إزالة أجهزة", value: "hw_install_replace_remove" },
    { label: "SW Configure/Upgrade", labelAr: "تكوين/ترقية البرامج", value: "sw_configure_upgrade" },
    { label: "Corrective Maintenance", labelAr: "صيانة تصحيحية", value: "corrective_maintenance" },
    { label: "Preventive Maintenance", labelAr: "صيانة وقائية", value: "preventive_maintenance" },
    { label: "Testing & Commissioning", labelAr: "اختبار وتشغيل", value: "testing_commissioning" },
    { label: "Fit Out/Rehab", labelAr: "تجهيز/إعادة تأهيل", value: "fit_out_rehab" },
    { label: "Snag Clearance", labelAr: "إزالة العيوب", value: "snag_clearance" },
  ]);
  await conn.execute(
    "UPDATE formFields SET options = ?, name = 'Activity Details', columnSpan = 6 WHERE id = 85",
    [activityDetailsOptions]
  );
  console.log('Activity Details updated');

  // ============================================================
  // 3) Update Activity Type (id=86) → "Type of Activity" checkbox_group
  //    From screenshot: Electrical, Civil works, Architectural Fit Out,
  //    Racking/Stacking and ICT, Security System,
  //    Mechanical/HVAC, Plumbing, Fire System, Structured Cabling, BMS/DCI M
  // ============================================================
  console.log('=== Updating Type of Activity options ===');
  const typeOfActivityOptions = JSON.stringify([
    { label: "Electrical", labelAr: "كهربائي", value: "electrical" },
    { label: "Civil works", labelAr: "أعمال مدنية", value: "civil_works" },
    { label: "Architectural Fit Out", labelAr: "تجهيز معماري", value: "architectural_fit_out" },
    { label: "Racking / Stacking and ICT", labelAr: "رفوف/تكديس وتقنية", value: "racking_stacking_ict" },
    { label: "Security System", labelAr: "نظام أمني", value: "security_system" },
    { label: "Mechanical/HVAC", labelAr: "ميكانيكي/تكييف", value: "mechanical_hvac" },
    { label: "Plumbing", labelAr: "سباكة", value: "plumbing" },
    { label: "Fire System", labelAr: "نظام إطفاء", value: "fire_system" },
    { label: "Structured Cabling", labelAr: "تمديد كابلات", value: "structured_cabling" },
    { label: "BMS/DCI M", labelAr: "نظام إدارة المبنى", value: "bms_dci_m" },
  ]);
  await conn.execute(
    "UPDATE formFields SET options = ?, name = 'Type of Activity', columnSpan = 6 WHERE id = 86",
    [typeOfActivityOptions]
  );
  console.log('Type of Activity updated');

  // ============================================================
  // 4) Update Service/System Outage (id=87) - rename
  // ============================================================
  console.log('=== Updating Service/System Outage ===');
  await conn.execute("UPDATE formFields SET name = 'Service / System Outage', displayOrder = 3 WHERE id = 87");
  console.log('Service/System Outage updated');

  // ============================================================
  // 5) Update Impact Level (id=89) - new options from screenshot
  //    Data hall(s), Row(s)/Racks(s), No Impact
  // ============================================================
  console.log('=== Updating Impact Level ===');
  const impactLevelOptions = JSON.stringify([
    { label: "Data hall(s)", labelAr: "قاعة بيانات", value: "data_halls" },
    { label: "Row(s)/Racks(s)", labelAr: "صفوف/خزائن", value: "rows_racks" },
    { label: "No Impact", labelAr: "لا تأثير", value: "no_impact" },
  ]);
  await conn.execute(
    "UPDATE formFields SET options = ?, name = 'Impact Level', displayOrder = 4 WHERE id = 89",
    [impactLevelOptions]
  );
  console.log('Impact Level updated');

  // ============================================================
  // 6) Update Activity Severity (id=88) - new options from screenshot
  //    Low, Medium, High, Emergency
  // ============================================================
  console.log('=== Updating Activity Severity ===');
  const severityOptions = JSON.stringify([
    { label: "Low", labelAr: "منخفض", value: "low" },
    { label: "Medium", labelAr: "متوسط", value: "medium" },
    { label: "High", labelAr: "عالي", value: "high" },
    { label: "Emergency", labelAr: "طوارئ", value: "emergency" },
  ]);
  await conn.execute(
    "UPDATE formFields SET options = ?, name = 'Activity Severity', displayOrder = 5 WHERE id = 88",
    [severityOptions]
  );
  console.log('Activity Severity updated');

  // ============================================================
  // 7) Add Required Permissions checkbox_group (new field)
  //    Work Permit, EPT, MHV
  // ============================================================
  console.log('=== Adding Required Permissions field ===');
  const requiredPermissionsOptions = JSON.stringify([
    { label: "Work Permit", labelAr: "تصريح عمل", value: "work_permit" },
    { label: "EPT", labelAr: "تصريح دخول مؤقت", value: "ept" },
    { label: "MHV", labelAr: "تصريح مواد/مركبات", value: "mhv" },
  ]);
  await conn.execute(
    "INSERT INTO formFields (sectionId, code, name, fieldType, isRequired, columnSpan, displayOrder, isActive, optionsSource, options) VALUES (18, 'required_permissions', 'Required Permissions', 'checkbox_group', 0, 6, 6, 1, 'static', ?)",
    [requiredPermissionsOptions]
  );
  console.log('Required Permissions added');

  // ============================================================
  // 8) Rename Description (id=90) to "Activity High-Level Description"
  //    and update display order
  // ============================================================
  console.log('=== Updating Description field ===');
  await conn.execute("UPDATE formFields SET name = 'Activity High-Level Description', displayOrder = 7 WHERE id = 90");
  console.log('Description renamed to Activity High-Level Description');

  // ============================================================
  // 9) Rename section to match screenshot: "E. Planned Activity and Impact"
  // ============================================================
  console.log('=== Renaming section ===');
  await conn.execute("UPDATE formSections SET name = 'E. Planned Activity and Impact' WHERE id = 18");
  console.log('Section renamed');

  // ============================================================
  // VERIFY
  // ============================================================
  console.log('\n=== VERIFICATION ===');
  
  const [contractorFields] = await conn.execute('SELECT id, code, name, fieldType, optionsSource FROM formFields WHERE id = 84');
  console.log('Line Manager:', JSON.stringify(contractorFields));
  
  const [actFields] = await conn.execute('SELECT id, code, name, fieldType, columnSpan, displayOrder FROM formFields WHERE sectionId = 18 ORDER BY displayOrder');
  console.log('Activity & Impact fields:', JSON.stringify(actFields, null, 2));

  await conn.end();
  console.log('\nDone!');
}

main().catch(console.error);
