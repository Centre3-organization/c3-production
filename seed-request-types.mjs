import mysql from 'mysql2/promise';

async function seedRequestTypes() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  console.log('Seeding Dynamic Request Type System...\n');
  
  // ============================================================================
  // 1. SEED CATEGORIES
  // ============================================================================
  
  // Admin Visit Category
  const [adminVisitResult] = await connection.execute(`
    INSERT INTO requestCategories (code, name, nameAr, description, icon, displayOrder, requiresInternalOnly, allowMultipleTypes, typeCombinationRules, hasRequestorSection, hasLocationSection, hasScheduleSection, hasVisitorSection, hasAttachmentSection)
    VALUES ('admin_visit', 'Admin Visit', 'زيارة إدارية', 'Administrative visits for internal employees', 'clipboard-check', 1, true, false, NULL, true, true, true, true, true)
    ON DUPLICATE KEY UPDATE name = VALUES(name)
  `);
  console.log('✓ Created Admin Visit category');
  
  // Technical & Delivery Category
  const typeCombinationRules = JSON.stringify({
    tep: { exclusive: true, disables: ['wp', 'mop', 'mhv'] },
    wp: { exclusive: false, canCombine: ['mop', 'mhv'], disables: ['tep'] },
    mop: { exclusive: false, canCombine: ['mhv'], disables: ['tep', 'wp'] },
    mhv: { exclusive: false, canCombine: ['wp', 'mop'], disables: ['tep'] }
  });
  
  const [techDeliveryResult] = await connection.execute(`
    INSERT INTO requestCategories (code, name, nameAr, description, icon, displayOrder, requiresInternalOnly, allowMultipleTypes, typeCombinationRules, hasRequestorSection, hasLocationSection, hasScheduleSection, hasVisitorSection, hasAttachmentSection)
    VALUES ('technical_delivery', 'Technical & Delivery', 'التقني والتسليم', 'Technical work and delivery permits', 'wrench', 2, false, true, ?, true, true, true, true, true)
    ON DUPLICATE KEY UPDATE name = VALUES(name)
  `, [typeCombinationRules]);
  console.log('✓ Created Technical & Delivery category');
  
  // Get category IDs
  const [[adminVisitCat]] = await connection.execute(`SELECT id FROM requestCategories WHERE code = 'admin_visit'`);
  const [[techDeliveryCat]] = await connection.execute(`SELECT id FROM requestCategories WHERE code = 'technical_delivery'`);
  
  // ============================================================================
  // 2. SEED REQUEST TYPES
  // ============================================================================
  
  // Admin Visit Type (single type under Admin Visit category)
  await connection.execute(`
    INSERT INTO requestTypes (categoryId, code, name, nameAr, shortCode, description, displayOrder, isExclusive, maxDurationDays, generateQrCode, generateDcpForm)
    VALUES (?, 'admin_visit', 'Admin Visit', 'زيارة إدارية', 'AV', 'Standard administrative visit', 1, true, NULL, true, true)
    ON DUPLICATE KEY UPDATE name = VALUES(name)
  `, [adminVisitCat.id]);
  console.log('✓ Created Admin Visit type');
  
  // TEP - Temporary Entry Permission
  await connection.execute(`
    INSERT INTO requestTypes (categoryId, code, name, nameAr, shortCode, description, displayOrder, isExclusive, maxDurationDays, generateQrCode, generateDcpForm)
    VALUES (?, 'tep', 'Temporary Entry Permission', 'تصريح دخول مؤقت', 'TEP', 'Long-term entry permission up to 6 months', 1, true, 180, true, true)
    ON DUPLICATE KEY UPDATE name = VALUES(name)
  `, [techDeliveryCat.id]);
  console.log('✓ Created TEP type');
  
  // WP - Work Permission
  await connection.execute(`
    INSERT INTO requestTypes (categoryId, code, name, nameAr, shortCode, description, displayOrder, isExclusive, maxDurationDays, generateQrCode, generateDcpForm)
    VALUES (?, 'wp', 'Work Permission', 'تصريح عمل', 'WP', 'Work permit for technical activities', 2, false, 14, true, true)
    ON DUPLICATE KEY UPDATE name = VALUES(name)
  `, [techDeliveryCat.id]);
  console.log('✓ Created WP type');
  
  // MOP - Method of Procedure
  await connection.execute(`
    INSERT INTO requestTypes (categoryId, code, name, nameAr, shortCode, description, displayOrder, isExclusive, maxDurationDays, generateQrCode, generateDcpForm)
    VALUES (?, 'mop', 'Method of Procedure', 'طريقة الإجراء', 'MOP', 'Detailed procedure for technical work', 3, false, 14, true, true)
    ON DUPLICATE KEY UPDATE name = VALUES(name)
  `, [techDeliveryCat.id]);
  console.log('✓ Created MOP type');
  
  // MHV - Material/Vehicle Permit
  await connection.execute(`
    INSERT INTO requestTypes (categoryId, code, name, nameAr, shortCode, description, displayOrder, isExclusive, maxDurationDays, generateQrCode, generateDcpForm)
    VALUES (?, 'mhv', 'Material/Vehicle Permit', 'تصريح مواد/مركبات', 'MHV', 'Permit for materials entry/exit and vehicle access', 4, false, 14, true, true)
    ON DUPLICATE KEY UPDATE name = VALUES(name)
  `, [techDeliveryCat.id]);
  console.log('✓ Created MHV type');
  
  // Get type IDs
  const [[adminVisitType]] = await connection.execute(`SELECT id FROM requestTypes WHERE code = 'admin_visit'`);
  const [[tepType]] = await connection.execute(`SELECT id FROM requestTypes WHERE code = 'tep'`);
  const [[wpType]] = await connection.execute(`SELECT id FROM requestTypes WHERE code = 'wp'`);
  const [[mopType]] = await connection.execute(`SELECT id FROM requestTypes WHERE code = 'mop'`);
  const [[mhvType]] = await connection.execute(`SELECT id FROM requestTypes WHERE code = 'mhv'`);
  
  console.log('\n--- Seeding Form Sections and Fields ---\n');
  
  // ============================================================================
  // 3. SEED FORM SECTIONS AND FIELDS FOR ADMIN VISIT
  // ============================================================================
  
  // Admin Visit - Basic Info Section
  await connection.execute(`
    INSERT INTO formSections (requestTypeId, code, name, nameAr, icon, displayOrder, isRepeatable)
    VALUES (?, 'basic_info', 'Basic Information', 'المعلومات الأساسية', 'info', 1, false)
    ON DUPLICATE KEY UPDATE name = VALUES(name)
  `, [adminVisitType.id]);
  const [[basicInfoSection]] = await connection.execute(`SELECT id FROM formSections WHERE requestTypeId = ? AND code = 'basic_info'`, [adminVisitType.id]);
  
  // Basic Info Fields
  const basicInfoFields = [
    { code: 'requestor_name', name: 'Requestor Name', nameAr: 'اسم مقدم الطلب', fieldType: 'readonly', isRequired: true, displayOrder: 1, columnSpan: 6 },
    { code: 'company', name: 'Company', nameAr: 'الشركة', fieldType: 'text', isRequired: true, displayOrder: 2, columnSpan: 6 },
    { code: 'email', name: 'Email', nameAr: 'البريد الإلكتروني', fieldType: 'email', isRequired: true, displayOrder: 3, columnSpan: 6 },
    { code: 'mobile', name: 'Mobile', nameAr: 'الجوال', fieldType: 'phone', isRequired: false, displayOrder: 4, columnSpan: 6 },
    { code: 'department', name: 'Department', nameAr: 'القسم', fieldType: 'dropdown', isRequired: true, displayOrder: 5, columnSpan: 6, optionsSource: 'api', optionsApi: '/api/departments' },
    { code: 'sub_type', name: 'Sub Type', nameAr: 'النوع الفرعي', fieldType: 'dropdown', isRequired: false, displayOrder: 6, columnSpan: 6, options: JSON.stringify([
      { value: 'meeting', label: 'Meeting', labelAr: 'اجتماع' },
      { value: 'audit', label: 'Audit', labelAr: 'تدقيق' },
      { value: 'inspection', label: 'Inspection', labelAr: 'فحص' },
      { value: 'training', label: 'Training', labelAr: 'تدريب' }
    ])},
    { code: 'purpose', name: 'Purpose of Visit', nameAr: 'الغرض من الزيارة', fieldType: 'textarea', isRequired: true, displayOrder: 7, columnSpan: 12 },
    { code: 'notes', name: 'Additional Notes', nameAr: 'ملاحظات إضافية', fieldType: 'textarea', isRequired: false, displayOrder: 8, columnSpan: 12 }
  ];
  
  for (const field of basicInfoFields) {
    await connection.execute(`
      INSERT INTO formFields (sectionId, code, name, nameAr, fieldType, isRequired, displayOrder, columnSpan, options, optionsSource, optionsApi)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE name = VALUES(name)
    `, [basicInfoSection.id, field.code, field.name, field.nameAr, field.fieldType, field.isRequired, field.displayOrder, field.columnSpan, field.options || null, field.optionsSource || 'static', field.optionsApi || null]);
  }
  console.log('✓ Created Admin Visit - Basic Info section with fields');
  
  // Admin Visit - Location Section
  await connection.execute(`
    INSERT INTO formSections (requestTypeId, code, name, nameAr, icon, displayOrder, isRepeatable)
    VALUES (?, 'location', 'Location', 'الموقع', 'map-pin', 2, false)
    ON DUPLICATE KEY UPDATE name = VALUES(name)
  `, [adminVisitType.id]);
  const [[locationSection]] = await connection.execute(`SELECT id FROM formSections WHERE requestTypeId = ? AND code = 'location'`, [adminVisitType.id]);
  
  const locationFields = [
    { code: 'country', name: 'Country', nameAr: 'الدولة', fieldType: 'dropdown', isRequired: true, displayOrder: 1, columnSpan: 6, optionsSource: 'api', optionsApi: '/api/countries' },
    { code: 'region', name: 'Region', nameAr: 'المنطقة', fieldType: 'dropdown', isRequired: true, displayOrder: 2, columnSpan: 6, optionsSource: 'dependent', dependsOnField: 'country', optionsApi: '/api/regions?countryId={country}' },
    { code: 'city', name: 'City', nameAr: 'المدينة', fieldType: 'dropdown', isRequired: true, displayOrder: 3, columnSpan: 6, optionsSource: 'dependent', dependsOnField: 'region', optionsApi: '/api/cities?regionId={region}' },
    { code: 'site', name: 'Site', nameAr: 'الموقع', fieldType: 'dropdown', isRequired: true, displayOrder: 4, columnSpan: 6, optionsSource: 'dependent', dependsOnField: 'city', optionsApi: '/api/sites?cityId={city}' }
  ];
  
  for (const field of locationFields) {
    await connection.execute(`
      INSERT INTO formFields (sectionId, code, name, nameAr, fieldType, isRequired, displayOrder, columnSpan, optionsSource, optionsApi, dependsOnField)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE name = VALUES(name)
    `, [locationSection.id, field.code, field.name, field.nameAr, field.fieldType, field.isRequired, field.displayOrder, field.columnSpan, field.optionsSource || 'static', field.optionsApi || null, field.dependsOnField || null]);
  }
  console.log('✓ Created Admin Visit - Location section with fields');
  
  // Admin Visit - Schedule Section
  await connection.execute(`
    INSERT INTO formSections (requestTypeId, code, name, nameAr, icon, displayOrder, isRepeatable)
    VALUES (?, 'schedule', 'Schedule', 'الجدول الزمني', 'calendar', 3, false)
    ON DUPLICATE KEY UPDATE name = VALUES(name)
  `, [adminVisitType.id]);
  const [[scheduleSection]] = await connection.execute(`SELECT id FROM formSections WHERE requestTypeId = ? AND code = 'schedule'`, [adminVisitType.id]);
  
  const scheduleFields = [
    { code: 'start_date', name: 'Start Date', nameAr: 'تاريخ البدء', fieldType: 'date', isRequired: true, displayOrder: 1, columnSpan: 6 },
    { code: 'end_date', name: 'End Date', nameAr: 'تاريخ الانتهاء', fieldType: 'date', isRequired: true, displayOrder: 2, columnSpan: 6 },
    { code: 'start_time', name: 'Start Time', nameAr: 'وقت البدء', fieldType: 'text', isRequired: false, displayOrder: 3, columnSpan: 6, placeholder: 'HH:MM' },
    { code: 'end_time', name: 'End Time', nameAr: 'وقت الانتهاء', fieldType: 'text', isRequired: false, displayOrder: 4, columnSpan: 6, placeholder: 'HH:MM' }
  ];
  
  for (const field of scheduleFields) {
    await connection.execute(`
      INSERT INTO formFields (sectionId, code, name, nameAr, fieldType, isRequired, displayOrder, columnSpan, placeholder)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE name = VALUES(name)
    `, [scheduleSection.id, field.code, field.name, field.nameAr, field.fieldType, field.isRequired, field.displayOrder, field.columnSpan, field.placeholder || null]);
  }
  console.log('✓ Created Admin Visit - Schedule section with fields');
  
  // Admin Visit - Visitors Section (Repeatable)
  await connection.execute(`
    INSERT INTO formSections (requestTypeId, code, name, nameAr, icon, displayOrder, isRepeatable, minItems, maxItems)
    VALUES (?, 'visitors', 'Visitors', 'الزوار', 'users', 4, true, 1, 20)
    ON DUPLICATE KEY UPDATE name = VALUES(name)
  `, [adminVisitType.id]);
  const [[visitorsSection]] = await connection.execute(`SELECT id FROM formSections WHERE requestTypeId = ? AND code = 'visitors'`, [adminVisitType.id]);
  
  const visitorFields = [
    { code: 'full_name', name: 'Full Name', nameAr: 'الاسم الكامل', fieldType: 'text', isRequired: true, displayOrder: 1, columnSpan: 6 },
    { code: 'nationality', name: 'Nationality', nameAr: 'الجنسية', fieldType: 'dropdown', isRequired: false, displayOrder: 2, columnSpan: 6, optionsSource: 'api', optionsApi: '/api/nationalities' },
    { code: 'id_type', name: 'ID Type', nameAr: 'نوع الهوية', fieldType: 'dropdown', isRequired: true, displayOrder: 3, columnSpan: 6, options: JSON.stringify([
      { value: 'national_id', label: 'National ID', labelAr: 'هوية وطنية' },
      { value: 'iqama', label: 'Iqama', labelAr: 'إقامة' },
      { value: 'passport', label: 'Passport', labelAr: 'جواز سفر' }
    ])},
    { code: 'id_number', name: 'ID Number', nameAr: 'رقم الهوية', fieldType: 'text', isRequired: true, displayOrder: 4, columnSpan: 6 },
    { code: 'company', name: 'Company', nameAr: 'الشركة', fieldType: 'text', isRequired: false, displayOrder: 5, columnSpan: 6 },
    { code: 'job_title', name: 'Job Title', nameAr: 'المسمى الوظيفي', fieldType: 'text', isRequired: false, displayOrder: 6, columnSpan: 6 },
    { code: 'mobile', name: 'Mobile', nameAr: 'الجوال', fieldType: 'phone', isRequired: false, displayOrder: 7, columnSpan: 6 },
    { code: 'email', name: 'Email', nameAr: 'البريد الإلكتروني', fieldType: 'email', isRequired: false, displayOrder: 8, columnSpan: 6 },
    { code: 'id_attachment', name: 'ID Attachment', nameAr: 'مرفق الهوية', fieldType: 'file', isRequired: false, displayOrder: 9, columnSpan: 12 }
  ];
  
  for (const field of visitorFields) {
    await connection.execute(`
      INSERT INTO formFields (sectionId, code, name, nameAr, fieldType, isRequired, displayOrder, columnSpan, options, optionsSource, optionsApi)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE name = VALUES(name)
    `, [visitorsSection.id, field.code, field.name, field.nameAr, field.fieldType, field.isRequired, field.displayOrder, field.columnSpan, field.options || null, field.optionsSource || 'static', field.optionsApi || null]);
  }
  console.log('✓ Created Admin Visit - Visitors section with fields');
  
  // Admin Visit - VIP Details Section (Conditional)
  await connection.execute(`
    INSERT INTO formSections (requestTypeId, code, name, nameAr, icon, displayOrder, isRepeatable, showCondition)
    VALUES (?, 'vip_details', 'VIP Details', 'تفاصيل كبار الشخصيات', 'star', 5, false, ?)
    ON DUPLICATE KEY UPDATE name = VALUES(name)
  `, [adminVisitType.id, JSON.stringify({ field: 'vip_visit', operator: 'equals', value: 'yes' })]);
  const [[vipSection]] = await connection.execute(`SELECT id FROM formSections WHERE requestTypeId = ? AND code = 'vip_details'`, [adminVisitType.id]);
  
  const vipFields = [
    { code: 'vip_visit', name: 'VIP Visit', nameAr: 'زيارة كبار الشخصيات', fieldType: 'radio', isRequired: true, displayOrder: 1, columnSpan: 12, options: JSON.stringify([
      { value: 'yes', label: 'Yes', labelAr: 'نعم' },
      { value: 'no', label: 'No', labelAr: 'لا' }
    ])},
    { code: 'driver_name', name: 'Driver Name', nameAr: 'اسم السائق', fieldType: 'text', isRequired: false, displayOrder: 2, columnSpan: 6, showCondition: JSON.stringify({ field: 'vip_visit', operator: 'equals', value: 'yes' }) },
    { code: 'driver_id', name: 'Driver ID', nameAr: 'هوية السائق', fieldType: 'text', isRequired: false, displayOrder: 3, columnSpan: 6, showCondition: JSON.stringify({ field: 'vip_visit', operator: 'equals', value: 'yes' }) },
    { code: 'vehicle_plate', name: 'Vehicle Plate', nameAr: 'لوحة المركبة', fieldType: 'text', isRequired: false, displayOrder: 4, columnSpan: 6, showCondition: JSON.stringify({ field: 'vip_visit', operator: 'equals', value: 'yes' }) }
  ];
  
  for (const field of vipFields) {
    await connection.execute(`
      INSERT INTO formFields (sectionId, code, name, nameAr, fieldType, isRequired, displayOrder, columnSpan, options, showCondition)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE name = VALUES(name)
    `, [vipSection.id, field.code, field.name, field.nameAr, field.fieldType, field.isRequired, field.displayOrder, field.columnSpan, field.options || null, field.showCondition || null]);
  }
  console.log('✓ Created Admin Visit - VIP Details section with fields');
  
  // Admin Visit - Attachments Section
  await connection.execute(`
    INSERT INTO formSections (requestTypeId, code, name, nameAr, icon, displayOrder, isRepeatable)
    VALUES (?, 'attachments', 'Attachments', 'المرفقات', 'paperclip', 6, false)
    ON DUPLICATE KEY UPDATE name = VALUES(name)
  `, [adminVisitType.id]);
  const [[attachmentsSection]] = await connection.execute(`SELECT id FROM formSections WHERE requestTypeId = ? AND code = 'attachments'`, [adminVisitType.id]);
  
  await connection.execute(`
    INSERT INTO formFields (sectionId, code, name, nameAr, fieldType, isRequired, displayOrder, columnSpan, validation)
    VALUES (?, 'supporting_documents', 'Supporting Documents', 'المستندات الداعمة', 'file_multi', false, 1, 12, ?)
    ON DUPLICATE KEY UPDATE name = VALUES(name)
  `, [attachmentsSection.id, JSON.stringify({ maxFiles: 10, maxSizeMB: 10, accept: '.pdf,.doc,.docx,.jpg,.jpeg,.png' })]);
  console.log('✓ Created Admin Visit - Attachments section with fields');
  
  // ============================================================================
  // 4. SEED FORM SECTIONS AND FIELDS FOR TEP
  // ============================================================================
  
  // TEP - Visit Details Section
  await connection.execute(`
    INSERT INTO formSections (requestTypeId, code, name, nameAr, icon, displayOrder, isRepeatable)
    VALUES (?, 'visit_details', 'Visit Details', 'تفاصيل الزيارة', 'info', 1, false)
    ON DUPLICATE KEY UPDATE name = VALUES(name)
  `, [tepType.id]);
  const [[tepVisitSection]] = await connection.execute(`SELECT id FROM formSections WHERE requestTypeId = ? AND code = 'visit_details'`, [tepType.id]);
  
  const tepVisitFields = [
    { code: 'purpose', name: 'Purpose of Entry', nameAr: 'الغرض من الدخول', fieldType: 'dropdown', isRequired: true, displayOrder: 1, columnSpan: 6, options: JSON.stringify([
      { value: 'checks', label: 'Checks', labelAr: 'فحوصات' },
      { value: 'testing', label: 'Testing', labelAr: 'اختبارات' },
      { value: 'visit_audit', label: 'Visit & Audit', labelAr: 'زيارة وتدقيق' },
      { value: 'maintenance', label: 'Maintenance', labelAr: 'صيانة' },
      { value: 'installation', label: 'Installation', labelAr: 'تركيب' }
    ])},
    { code: 'target_room', name: 'Target Room', nameAr: 'الغرفة المستهدفة', fieldType: 'text', isRequired: true, displayOrder: 2, columnSpan: 6, placeholder: 'e.g., RDC46_1_A' },
    { code: 'host_name', name: 'Host Name', nameAr: 'اسم المضيف', fieldType: 'user_lookup', isRequired: true, displayOrder: 3, columnSpan: 6 },
    { code: 'description', name: 'Description', nameAr: 'الوصف', fieldType: 'textarea', isRequired: false, displayOrder: 4, columnSpan: 12 }
  ];
  
  for (const field of tepVisitFields) {
    await connection.execute(`
      INSERT INTO formFields (sectionId, code, name, nameAr, fieldType, isRequired, displayOrder, columnSpan, options, placeholder)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE name = VALUES(name)
    `, [tepVisitSection.id, field.code, field.name, field.nameAr, field.fieldType, field.isRequired, field.displayOrder, field.columnSpan, field.options || null, field.placeholder || null]);
  }
  console.log('✓ Created TEP - Visit Details section with fields');
  
  // TEP - Location Section (reuse similar structure)
  await connection.execute(`
    INSERT INTO formSections (requestTypeId, code, name, nameAr, icon, displayOrder, isRepeatable)
    VALUES (?, 'location', 'Location', 'الموقع', 'map-pin', 2, false)
    ON DUPLICATE KEY UPDATE name = VALUES(name)
  `, [tepType.id]);
  const [[tepLocationSection]] = await connection.execute(`SELECT id FROM formSections WHERE requestTypeId = ? AND code = 'location'`, [tepType.id]);
  
  for (const field of locationFields) {
    await connection.execute(`
      INSERT INTO formFields (sectionId, code, name, nameAr, fieldType, isRequired, displayOrder, columnSpan, optionsSource, optionsApi, dependsOnField)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE name = VALUES(name)
    `, [tepLocationSection.id, field.code, field.name, field.nameAr, field.fieldType, field.isRequired, field.displayOrder, field.columnSpan, field.optionsSource || 'static', field.optionsApi || null, field.dependsOnField || null]);
  }
  console.log('✓ Created TEP - Location section with fields');
  
  // TEP - Schedule Section
  await connection.execute(`
    INSERT INTO formSections (requestTypeId, code, name, nameAr, icon, displayOrder, isRepeatable)
    VALUES (?, 'schedule', 'Schedule', 'الجدول الزمني', 'calendar', 3, false)
    ON DUPLICATE KEY UPDATE name = VALUES(name)
  `, [tepType.id]);
  const [[tepScheduleSection]] = await connection.execute(`SELECT id FROM formSections WHERE requestTypeId = ? AND code = 'schedule'`, [tepType.id]);
  
  const tepScheduleFields = [
    { code: 'start_date', name: 'Start Date', nameAr: 'تاريخ البدء', fieldType: 'date', isRequired: true, displayOrder: 1, columnSpan: 6 },
    { code: 'end_date', name: 'End Date', nameAr: 'تاريخ الانتهاء', fieldType: 'date', isRequired: true, displayOrder: 2, columnSpan: 6, helpText: 'Maximum 180 days from start date' }
  ];
  
  for (const field of tepScheduleFields) {
    await connection.execute(`
      INSERT INTO formFields (sectionId, code, name, nameAr, fieldType, isRequired, displayOrder, columnSpan, helpText)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE name = VALUES(name)
    `, [tepScheduleSection.id, field.code, field.name, field.nameAr, field.fieldType, field.isRequired, field.displayOrder, field.columnSpan, field.helpText || null]);
  }
  console.log('✓ Created TEP - Schedule section with fields');
  
  // TEP - Visitors Section (Repeatable)
  await connection.execute(`
    INSERT INTO formSections (requestTypeId, code, name, nameAr, icon, displayOrder, isRepeatable, minItems, maxItems)
    VALUES (?, 'visitors', 'Visitors', 'الزوار', 'users', 4, true, 1, 20)
    ON DUPLICATE KEY UPDATE name = VALUES(name)
  `, [tepType.id]);
  const [[tepVisitorsSection]] = await connection.execute(`SELECT id FROM formSections WHERE requestTypeId = ? AND code = 'visitors'`, [tepType.id]);
  
  for (const field of visitorFields) {
    await connection.execute(`
      INSERT INTO formFields (sectionId, code, name, nameAr, fieldType, isRequired, displayOrder, columnSpan, options, optionsSource, optionsApi)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE name = VALUES(name)
    `, [tepVisitorsSection.id, field.code, field.name, field.nameAr, field.fieldType, field.isRequired, field.displayOrder, field.columnSpan, field.options || null, field.optionsSource || 'static', field.optionsApi || null]);
  }
  console.log('✓ Created TEP - Visitors section with fields');
  
  // ============================================================================
  // 5. SEED FORM SECTIONS AND FIELDS FOR WP (Work Permission)
  // ============================================================================
  
  // WP - Work Details Section
  await connection.execute(`
    INSERT INTO formSections (requestTypeId, code, name, nameAr, icon, displayOrder, isRepeatable)
    VALUES (?, 'work_details', 'Work Details', 'تفاصيل العمل', 'wrench', 1, false)
    ON DUPLICATE KEY UPDATE name = VALUES(name)
  `, [wpType.id]);
  const [[wpWorkSection]] = await connection.execute(`SELECT id FROM formSections WHERE requestTypeId = ? AND code = 'work_details'`, [wpType.id]);
  
  const wpWorkFields = [
    { code: 'change_number', name: 'Change #', nameAr: 'رقم التغيير', fieldType: 'text', isRequired: false, displayOrder: 1, columnSpan: 6 },
    { code: 'hosting_number', name: 'Hosting #', nameAr: 'رقم الاستضافة', fieldType: 'text', isRequired: false, displayOrder: 2, columnSpan: 6 },
    { code: 'pod_dh', name: 'POD/DH', nameAr: 'POD/DH', fieldType: 'text', isRequired: true, displayOrder: 3, columnSpan: 6 },
    { code: 'cabinets', name: 'Cabinets', nameAr: 'الخزائن', fieldType: 'text', isRequired: false, displayOrder: 4, columnSpan: 6 },
    { code: 'comment', name: 'Comment', nameAr: 'تعليق', fieldType: 'textarea', isRequired: false, displayOrder: 5, columnSpan: 12 }
  ];
  
  for (const field of wpWorkFields) {
    await connection.execute(`
      INSERT INTO formFields (sectionId, code, name, nameAr, fieldType, isRequired, displayOrder, columnSpan)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE name = VALUES(name)
    `, [wpWorkSection.id, field.code, field.name, field.nameAr, field.fieldType, field.isRequired, field.displayOrder, field.columnSpan]);
  }
  console.log('✓ Created WP - Work Details section with fields');
  
  // WP - Visitors Section
  await connection.execute(`
    INSERT INTO formSections (requestTypeId, code, name, nameAr, icon, displayOrder, isRepeatable, minItems, maxItems)
    VALUES (?, 'visitors', 'Visitors', 'الزوار', 'users', 2, true, 1, 20)
    ON DUPLICATE KEY UPDATE name = VALUES(name)
  `, [wpType.id]);
  const [[wpVisitorsSection]] = await connection.execute(`SELECT id FROM formSections WHERE requestTypeId = ? AND code = 'visitors'`, [wpType.id]);
  
  for (const field of visitorFields) {
    await connection.execute(`
      INSERT INTO formFields (sectionId, code, name, nameAr, fieldType, isRequired, displayOrder, columnSpan, options, optionsSource, optionsApi)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE name = VALUES(name)
    `, [wpVisitorsSection.id, field.code, field.name, field.nameAr, field.fieldType, field.isRequired, field.displayOrder, field.columnSpan, field.options || null, field.optionsSource || 'static', field.optionsApi || null]);
  }
  console.log('✓ Created WP - Visitors section with fields');
  
  // WP - Method Statement Section (Repeatable)
  await connection.execute(`
    INSERT INTO formSections (requestTypeId, code, name, nameAr, icon, displayOrder, isRepeatable, minItems, maxItems)
    VALUES (?, 'method_statement', 'Method Statement', 'بيان الطريقة', 'list', 3, true, 1, 50)
    ON DUPLICATE KEY UPDATE name = VALUES(name)
  `, [wpType.id]);
  const [[wpMethodSection]] = await connection.execute(`SELECT id FROM formSections WHERE requestTypeId = ? AND code = 'method_statement'`, [wpType.id]);
  
  await connection.execute(`
    INSERT INTO formFields (sectionId, code, name, nameAr, fieldType, isRequired, displayOrder, columnSpan)
    VALUES (?, 'step_description', 'Step Description', 'وصف الخطوة', 'textarea', true, 1, 12)
    ON DUPLICATE KEY UPDATE name = VALUES(name)
  `, [wpMethodSection.id]);
  console.log('✓ Created WP - Method Statement section with fields');
  
  // WP - Risk Assessment Section (Repeatable)
  await connection.execute(`
    INSERT INTO formSections (requestTypeId, code, name, nameAr, icon, displayOrder, isRepeatable, minItems, maxItems)
    VALUES (?, 'risk_assessment', 'Risk Assessment', 'تقييم المخاطر', 'alert-triangle', 4, true, 1, 20)
    ON DUPLICATE KEY UPDATE name = VALUES(name)
  `, [wpType.id]);
  const [[wpRiskSection]] = await connection.execute(`SELECT id FROM formSections WHERE requestTypeId = ? AND code = 'risk_assessment'`, [wpType.id]);
  
  const wpRiskFields = [
    { code: 'risk', name: 'Risk', nameAr: 'المخاطر', fieldType: 'text', isRequired: true, displayOrder: 1, columnSpan: 4 },
    { code: 'impact', name: 'Impact', nameAr: 'التأثير', fieldType: 'dropdown', isRequired: true, displayOrder: 2, columnSpan: 4, options: JSON.stringify([
      { value: 'minor', label: 'Minor', labelAr: 'طفيف' },
      { value: 'significant', label: 'Significant', labelAr: 'كبير' },
      { value: 'major', label: 'Major', labelAr: 'رئيسي' }
    ])},
    { code: 'control', name: 'Control', nameAr: 'التحكم', fieldType: 'text', isRequired: true, displayOrder: 3, columnSpan: 4 }
  ];
  
  for (const field of wpRiskFields) {
    await connection.execute(`
      INSERT INTO formFields (sectionId, code, name, nameAr, fieldType, isRequired, displayOrder, columnSpan, options)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE name = VALUES(name)
    `, [wpRiskSection.id, field.code, field.name, field.nameAr, field.fieldType, field.isRequired, field.displayOrder, field.columnSpan, field.options || null]);
  }
  console.log('✓ Created WP - Risk Assessment section with fields');
  
  // ============================================================================
  // 6. SEED FORM SECTIONS AND FIELDS FOR MOP (Method of Procedure)
  // ============================================================================
  
  // MOP - Project Info Section
  await connection.execute(`
    INSERT INTO formSections (requestTypeId, code, name, nameAr, icon, displayOrder, isRepeatable)
    VALUES (?, 'project_info', 'A. Project Info', 'أ. معلومات المشروع', 'folder', 1, false)
    ON DUPLICATE KEY UPDATE name = VALUES(name)
  `, [mopType.id]);
  const [[mopProjectSection]] = await connection.execute(`SELECT id FROM formSections WHERE requestTypeId = ? AND code = 'project_info'`, [mopType.id]);
  
  const mopProjectFields = [
    { code: 'project_name', name: 'Project Name', nameAr: 'اسم المشروع', fieldType: 'text', isRequired: true, displayOrder: 1, columnSpan: 6 },
    { code: 'project_no', name: 'Project No', nameAr: 'رقم المشروع', fieldType: 'text', isRequired: false, displayOrder: 2, columnSpan: 6 },
    { code: 'owner', name: 'Owner', nameAr: 'المالك', fieldType: 'text', isRequired: false, displayOrder: 3, columnSpan: 6 },
    { code: 'main_service', name: 'Main Service', nameAr: 'الخدمة الرئيسية', fieldType: 'text', isRequired: false, displayOrder: 4, columnSpan: 6 },
    { code: 'status', name: 'Status', nameAr: 'الحالة', fieldType: 'dropdown', isRequired: true, displayOrder: 5, columnSpan: 6, options: JSON.stringify([
      { value: 'planning', label: 'Planning', labelAr: 'تخطيط' },
      { value: 'in_progress', label: 'In Progress', labelAr: 'قيد التنفيذ' },
      { value: 'completed', label: 'Completed', labelAr: 'مكتمل' }
    ])},
    { code: 'facility_manager', name: 'Facility Manager', nameAr: 'مدير المنشأة', fieldType: 'user_lookup', isRequired: false, displayOrder: 6, columnSpan: 6 }
  ];
  
  for (const field of mopProjectFields) {
    await connection.execute(`
      INSERT INTO formFields (sectionId, code, name, nameAr, fieldType, isRequired, displayOrder, columnSpan, options)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE name = VALUES(name)
    `, [mopProjectSection.id, field.code, field.name, field.nameAr, field.fieldType, field.isRequired, field.displayOrder, field.columnSpan, field.options || null]);
  }
  console.log('✓ Created MOP - Project Info section with fields');
  
  // MOP - Location Section
  await connection.execute(`
    INSERT INTO formSections (requestTypeId, code, name, nameAr, icon, displayOrder, isRepeatable)
    VALUES (?, 'location', 'B. Location', 'ب. الموقع', 'map-pin', 2, false)
    ON DUPLICATE KEY UPDATE name = VALUES(name)
  `, [mopType.id]);
  const [[mopLocationSection]] = await connection.execute(`SELECT id FROM formSections WHERE requestTypeId = ? AND code = 'location'`, [mopType.id]);
  
  const mopLocationFields = [
    { code: 'city', name: 'City', nameAr: 'المدينة', fieldType: 'dropdown', isRequired: true, displayOrder: 1, columnSpan: 6, optionsSource: 'api', optionsApi: '/api/cities' },
    { code: 'site', name: 'Site', nameAr: 'الموقع', fieldType: 'dropdown', isRequired: true, displayOrder: 2, columnSpan: 6, optionsSource: 'dependent', dependsOnField: 'city', optionsApi: '/api/sites?cityId={city}' },
    { code: 'white_space', name: 'White Space?', nameAr: 'مساحة بيضاء؟', fieldType: 'checkbox', isRequired: false, displayOrder: 3, columnSpan: 4 },
    { code: 'facility_space', name: 'Facility Space?', nameAr: 'مساحة المنشأة؟', fieldType: 'checkbox', isRequired: false, displayOrder: 4, columnSpan: 4 },
    { code: 'outdoor', name: 'Outdoor?', nameAr: 'خارجي؟', fieldType: 'checkbox', isRequired: false, displayOrder: 5, columnSpan: 4 },
    { code: 'stakeholders', name: 'Stakeholders', nameAr: 'أصحاب المصلحة', fieldType: 'textarea', isRequired: false, displayOrder: 6, columnSpan: 12 }
  ];
  
  for (const field of mopLocationFields) {
    await connection.execute(`
      INSERT INTO formFields (sectionId, code, name, nameAr, fieldType, isRequired, displayOrder, columnSpan, optionsSource, optionsApi, dependsOnField)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE name = VALUES(name)
    `, [mopLocationSection.id, field.code, field.name, field.nameAr, field.fieldType, field.isRequired, field.displayOrder, field.columnSpan, field.optionsSource || 'static', field.optionsApi || null, field.dependsOnField || null]);
  }
  console.log('✓ Created MOP - Location section with fields');
  
  // MOP - Contractor Section
  await connection.execute(`
    INSERT INTO formSections (requestTypeId, code, name, nameAr, icon, displayOrder, isRepeatable)
    VALUES (?, 'contractor', 'C. Contractor', 'ج. المقاول', 'building', 3, false)
    ON DUPLICATE KEY UPDATE name = VALUES(name)
  `, [mopType.id]);
  const [[mopContractorSection]] = await connection.execute(`SELECT id FROM formSections WHERE requestTypeId = ? AND code = 'contractor'`, [mopType.id]);
  
  const mopContractorFields = [
    { code: 'company', name: 'Company', nameAr: 'الشركة', fieldType: 'text', isRequired: true, displayOrder: 1, columnSpan: 6 },
    { code: 'contact_person', name: 'Contact Person', nameAr: 'شخص الاتصال', fieldType: 'text', isRequired: true, displayOrder: 2, columnSpan: 6 },
    { code: 'mobile', name: 'Mobile', nameAr: 'الجوال', fieldType: 'phone', isRequired: false, displayOrder: 3, columnSpan: 6 },
    { code: 'email', name: 'Email', nameAr: 'البريد الإلكتروني', fieldType: 'email', isRequired: false, displayOrder: 4, columnSpan: 6 },
    { code: 'line_manager', name: 'Line Manager', nameAr: 'المدير المباشر', fieldType: 'text', isRequired: false, displayOrder: 5, columnSpan: 6 }
  ];
  
  for (const field of mopContractorFields) {
    await connection.execute(`
      INSERT INTO formFields (sectionId, code, name, nameAr, fieldType, isRequired, displayOrder, columnSpan)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE name = VALUES(name)
    `, [mopContractorSection.id, field.code, field.name, field.nameAr, field.fieldType, field.isRequired, field.displayOrder, field.columnSpan]);
  }
  console.log('✓ Created MOP - Contractor section with fields');
  
  // MOP - Activity & Impact Section
  await connection.execute(`
    INSERT INTO formSections (requestTypeId, code, name, nameAr, icon, displayOrder, isRepeatable)
    VALUES (?, 'activity_impact', 'E. Activity & Impact', 'هـ. النشاط والتأثير', 'zap', 4, false)
    ON DUPLICATE KEY UPDATE name = VALUES(name)
  `, [mopType.id]);
  const [[mopActivitySection]] = await connection.execute(`SELECT id FROM formSections WHERE requestTypeId = ? AND code = 'activity_impact'`, [mopType.id]);
  
  const mopActivityFields = [
    { code: 'activity_details', name: 'Activity Details', nameAr: 'تفاصيل النشاط', fieldType: 'checkbox_group', isRequired: false, displayOrder: 1, columnSpan: 12, options: JSON.stringify([
      { value: 'electrical', label: 'Electrical', labelAr: 'كهربائي' },
      { value: 'mechanical', label: 'Mechanical', labelAr: 'ميكانيكي' },
      { value: 'civil', label: 'Civil', labelAr: 'مدني' },
      { value: 'it_network', label: 'IT/Network', labelAr: 'تقنية المعلومات/الشبكة' }
    ])},
    { code: 'activity_type', name: 'Activity Type', nameAr: 'نوع النشاط', fieldType: 'checkbox_group', isRequired: false, displayOrder: 2, columnSpan: 12, options: JSON.stringify([
      { value: 'installation', label: 'Installation', labelAr: 'تركيب' },
      { value: 'maintenance', label: 'Maintenance', labelAr: 'صيانة' },
      { value: 'testing', label: 'Testing', labelAr: 'اختبار' },
      { value: 'decommission', label: 'Decommission', labelAr: 'إيقاف' }
    ])},
    { code: 'outage', name: 'Outage Required?', nameAr: 'هل يتطلب انقطاع؟', fieldType: 'radio', isRequired: true, displayOrder: 3, columnSpan: 6, options: JSON.stringify([
      { value: 'yes', label: 'Yes', labelAr: 'نعم' },
      { value: 'no', label: 'No', labelAr: 'لا' }
    ])},
    { code: 'severity', name: 'Severity', nameAr: 'الشدة', fieldType: 'dropdown', isRequired: false, displayOrder: 4, columnSpan: 6, options: JSON.stringify([
      { value: 'low', label: 'Low', labelAr: 'منخفض' },
      { value: 'medium', label: 'Medium', labelAr: 'متوسط' },
      { value: 'high', label: 'High', labelAr: 'عالي' },
      { value: 'critical', label: 'Critical', labelAr: 'حرج' }
    ])},
    { code: 'impact_level', name: 'Impact Level', nameAr: 'مستوى التأثير', fieldType: 'dropdown', isRequired: false, displayOrder: 5, columnSpan: 6, options: JSON.stringify([
      { value: 'none', label: 'None', labelAr: 'لا يوجد' },
      { value: 'minor', label: 'Minor', labelAr: 'طفيف' },
      { value: 'moderate', label: 'Moderate', labelAr: 'معتدل' },
      { value: 'major', label: 'Major', labelAr: 'كبير' }
    ])},
    { code: 'description', name: 'Description', nameAr: 'الوصف', fieldType: 'textarea', isRequired: true, displayOrder: 6, columnSpan: 12 }
  ];
  
  for (const field of mopActivityFields) {
    await connection.execute(`
      INSERT INTO formFields (sectionId, code, name, nameAr, fieldType, isRequired, displayOrder, columnSpan, options)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE name = VALUES(name)
    `, [mopActivitySection.id, field.code, field.name, field.nameAr, field.fieldType, field.isRequired, field.displayOrder, field.columnSpan, field.options || null]);
  }
  console.log('✓ Created MOP - Activity & Impact section with fields');
  
  // MOP - Affected Systems Section (Repeatable)
  await connection.execute(`
    INSERT INTO formSections (requestTypeId, code, name, nameAr, icon, displayOrder, isRepeatable, minItems, maxItems)
    VALUES (?, 'affected_systems', 'F. Affected Systems', 'و. الأنظمة المتأثرة', 'server', 5, true, 0, 50)
    ON DUPLICATE KEY UPDATE name = VALUES(name)
  `, [mopType.id]);
  const [[mopSystemsSection]] = await connection.execute(`SELECT id FROM formSections WHERE requestTypeId = ? AND code = 'affected_systems'`, [mopType.id]);
  
  const mopSystemsFields = [
    { code: 'system', name: 'System', nameAr: 'النظام', fieldType: 'text', isRequired: true, displayOrder: 1, columnSpan: 4 },
    { code: 'label_tag', name: 'Label/Tag', nameAr: 'التسمية/العلامة', fieldType: 'text', isRequired: false, displayOrder: 2, columnSpan: 4 },
    { code: 'location', name: 'Location', nameAr: 'الموقع', fieldType: 'text', isRequired: false, displayOrder: 3, columnSpan: 4 }
  ];
  
  for (const field of mopSystemsFields) {
    await connection.execute(`
      INSERT INTO formFields (sectionId, code, name, nameAr, fieldType, isRequired, displayOrder, columnSpan)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE name = VALUES(name)
    `, [mopSystemsSection.id, field.code, field.name, field.nameAr, field.fieldType, field.isRequired, field.displayOrder, field.columnSpan]);
  }
  console.log('✓ Created MOP - Affected Systems section with fields');
  
  // ============================================================================
  // 7. SEED FORM SECTIONS AND FIELDS FOR MHV (Material/Vehicle Permit)
  // ============================================================================
  
  // MHV - Decision Section
  await connection.execute(`
    INSERT INTO formSections (requestTypeId, code, name, nameAr, icon, displayOrder, isRepeatable)
    VALUES (?, 'decision', 'Decision', 'القرار', 'check-circle', 1, false)
    ON DUPLICATE KEY UPDATE name = VALUES(name)
  `, [mhvType.id]);
  const [[mhvDecisionSection]] = await connection.execute(`SELECT id FROM formSections WHERE requestTypeId = ? AND code = 'decision'`, [mhvType.id]);
  
  const mhvDecisionFields = [
    { code: 'material_gate_pass', name: 'Material Gate Pass', nameAr: 'تصريح بوابة المواد', fieldType: 'radio', isRequired: true, displayOrder: 1, columnSpan: 6, options: JSON.stringify([
      { value: 'yes', label: 'Yes', labelAr: 'نعم' },
      { value: 'no', label: 'No', labelAr: 'لا' }
    ])},
    { code: 'with_vehicle', name: 'With Vehicle', nameAr: 'مع مركبة', fieldType: 'radio', isRequired: true, displayOrder: 2, columnSpan: 6, options: JSON.stringify([
      { value: 'yes', label: 'Yes', labelAr: 'نعم' },
      { value: 'no', label: 'No', labelAr: 'لا' }
    ]), showCondition: JSON.stringify({ field: 'material_gate_pass', operator: 'equals', value: 'yes' }) }
  ];
  
  for (const field of mhvDecisionFields) {
    await connection.execute(`
      INSERT INTO formFields (sectionId, code, name, nameAr, fieldType, isRequired, displayOrder, columnSpan, options, showCondition)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE name = VALUES(name)
    `, [mhvDecisionSection.id, field.code, field.name, field.nameAr, field.fieldType, field.isRequired, field.displayOrder, field.columnSpan, field.options || null, field.showCondition || null]);
  }
  console.log('✓ Created MHV - Decision section with fields');
  
  // MHV - Materials Section (Repeatable, Conditional)
  await connection.execute(`
    INSERT INTO formSections (requestTypeId, code, name, nameAr, icon, displayOrder, isRepeatable, minItems, maxItems, showCondition)
    VALUES (?, 'materials', 'Materials', 'المواد', 'package', 2, true, 1, 50, ?)
    ON DUPLICATE KEY UPDATE name = VALUES(name)
  `, [mhvType.id, JSON.stringify({ field: 'material_gate_pass', operator: 'equals', value: 'yes' })]);
  const [[mhvMaterialsSection]] = await connection.execute(`SELECT id FROM formSections WHERE requestTypeId = ? AND code = 'materials'`, [mhvType.id]);
  
  const mhvMaterialsFields = [
    { code: 'direction', name: 'Direction', nameAr: 'الاتجاه', fieldType: 'dropdown', isRequired: true, displayOrder: 1, columnSpan: 3, options: JSON.stringify([
      { value: 'entry', label: 'Entry', labelAr: 'دخول' },
      { value: 'exit', label: 'Exit', labelAr: 'خروج' }
    ])},
    { code: 'material_type', name: 'Type', nameAr: 'النوع', fieldType: 'text', isRequired: true, displayOrder: 2, columnSpan: 3 },
    { code: 'model', name: 'Model', nameAr: 'الموديل', fieldType: 'text', isRequired: false, displayOrder: 3, columnSpan: 2 },
    { code: 'serial_number', name: 'Serial #', nameAr: 'الرقم التسلسلي', fieldType: 'text', isRequired: false, displayOrder: 4, columnSpan: 2 },
    { code: 'quantity', name: 'Qty', nameAr: 'الكمية', fieldType: 'number', isRequired: true, displayOrder: 5, columnSpan: 2, validation: JSON.stringify({ min: 1, max: 1000 }) }
  ];
  
  for (const field of mhvMaterialsFields) {
    await connection.execute(`
      INSERT INTO formFields (sectionId, code, name, nameAr, fieldType, isRequired, displayOrder, columnSpan, options, validation)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE name = VALUES(name)
    `, [mhvMaterialsSection.id, field.code, field.name, field.nameAr, field.fieldType, field.isRequired, field.displayOrder, field.columnSpan, field.options || null, field.validation || null]);
  }
  console.log('✓ Created MHV - Materials section with fields');
  
  // MHV - Person Section (Conditional)
  await connection.execute(`
    INSERT INTO formSections (requestTypeId, code, name, nameAr, icon, displayOrder, isRepeatable, showCondition)
    VALUES (?, 'person', 'Person', 'الشخص', 'user', 3, false, ?)
    ON DUPLICATE KEY UPDATE name = VALUES(name)
  `, [mhvType.id, JSON.stringify({ field: 'material_gate_pass', operator: 'equals', value: 'yes' })]);
  const [[mhvPersonSection]] = await connection.execute(`SELECT id FROM formSections WHERE requestTypeId = ? AND code = 'person'`, [mhvType.id]);
  
  const mhvPersonFields = [
    { code: 'full_name', name: 'Full Name', nameAr: 'الاسم الكامل', fieldType: 'text', isRequired: true, displayOrder: 1, columnSpan: 6 },
    { code: 'nationality', name: 'Nationality', nameAr: 'الجنسية', fieldType: 'dropdown', isRequired: false, displayOrder: 2, columnSpan: 6, optionsSource: 'api', optionsApi: '/api/nationalities' },
    { code: 'id_number', name: 'ID Number', nameAr: 'رقم الهوية', fieldType: 'text', isRequired: true, displayOrder: 3, columnSpan: 6 },
    { code: 'company', name: 'Company', nameAr: 'الشركة', fieldType: 'text', isRequired: false, displayOrder: 4, columnSpan: 6 },
    { code: 'mobile', name: 'Mobile', nameAr: 'الجوال', fieldType: 'phone', isRequired: false, displayOrder: 5, columnSpan: 6 },
    { code: 'email', name: 'Email', nameAr: 'البريد الإلكتروني', fieldType: 'email', isRequired: false, displayOrder: 6, columnSpan: 6 },
    { code: 'id_attachment', name: 'ID Attachment', nameAr: 'مرفق الهوية', fieldType: 'file', isRequired: false, displayOrder: 7, columnSpan: 12 }
  ];
  
  for (const field of mhvPersonFields) {
    await connection.execute(`
      INSERT INTO formFields (sectionId, code, name, nameAr, fieldType, isRequired, displayOrder, columnSpan, optionsSource, optionsApi)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE name = VALUES(name)
    `, [mhvPersonSection.id, field.code, field.name, field.nameAr, field.fieldType, field.isRequired, field.displayOrder, field.columnSpan, field.optionsSource || 'static', field.optionsApi || null]);
  }
  console.log('✓ Created MHV - Person section with fields');
  
  // MHV - Vehicle Section (Conditional)
  await connection.execute(`
    INSERT INTO formSections (requestTypeId, code, name, nameAr, icon, displayOrder, isRepeatable, showCondition)
    VALUES (?, 'vehicle', 'Vehicle', 'المركبة', 'truck', 4, false, ?)
    ON DUPLICATE KEY UPDATE name = VALUES(name)
  `, [mhvType.id, JSON.stringify({ field: 'with_vehicle', operator: 'equals', value: 'yes' })]);
  const [[mhvVehicleSection]] = await connection.execute(`SELECT id FROM formSections WHERE requestTypeId = ? AND code = 'vehicle'`, [mhvType.id]);
  
  const mhvVehicleFields = [
    { code: 'driver_name', name: 'Driver Name', nameAr: 'اسم السائق', fieldType: 'text', isRequired: true, displayOrder: 1, columnSpan: 6 },
    { code: 'driver_id', name: 'Driver ID', nameAr: 'هوية السائق', fieldType: 'text', isRequired: true, displayOrder: 2, columnSpan: 6 },
    { code: 'driver_nationality', name: 'Driver Nationality', nameAr: 'جنسية السائق', fieldType: 'dropdown', isRequired: false, displayOrder: 3, columnSpan: 6, optionsSource: 'api', optionsApi: '/api/nationalities' },
    { code: 'driver_company', name: 'Driver Company', nameAr: 'شركة السائق', fieldType: 'text', isRequired: false, displayOrder: 4, columnSpan: 6 },
    { code: 'driver_phone', name: 'Driver Phone', nameAr: 'هاتف السائق', fieldType: 'phone', isRequired: false, displayOrder: 5, columnSpan: 6 },
    { code: 'vehicle_plate', name: 'Vehicle Plate', nameAr: 'لوحة المركبة', fieldType: 'text', isRequired: true, displayOrder: 6, columnSpan: 6 },
    { code: 'vehicle_type', name: 'Vehicle Type', nameAr: 'نوع المركبة', fieldType: 'dropdown', isRequired: false, displayOrder: 7, columnSpan: 6, options: JSON.stringify([
      { value: 'sedan', label: 'Sedan', labelAr: 'سيدان' },
      { value: 'suv', label: 'SUV', labelAr: 'دفع رباعي' },
      { value: 'van', label: 'Van', labelAr: 'فان' },
      { value: 'truck', label: 'Truck', labelAr: 'شاحنة' },
      { value: 'pickup', label: 'Pickup', labelAr: 'بيك أب' }
    ])}
  ];
  
  for (const field of mhvVehicleFields) {
    await connection.execute(`
      INSERT INTO formFields (sectionId, code, name, nameAr, fieldType, isRequired, displayOrder, columnSpan, options, optionsSource, optionsApi)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE name = VALUES(name)
    `, [mhvVehicleSection.id, field.code, field.name, field.nameAr, field.fieldType, field.isRequired, field.displayOrder, field.columnSpan, field.options || null, field.optionsSource || 'static', field.optionsApi || null]);
  }
  console.log('✓ Created MHV - Vehicle section with fields');
  
  console.log('\n========================================');
  console.log('✅ Dynamic Request Type System seeded successfully!');
  console.log('========================================\n');
  
  // Print summary
  const [[catCount]] = await connection.execute(`SELECT COUNT(*) as count FROM requestCategories`);
  const [[typeCount]] = await connection.execute(`SELECT COUNT(*) as count FROM requestTypes`);
  const [[sectionCount]] = await connection.execute(`SELECT COUNT(*) as count FROM formSections`);
  const [[fieldCount]] = await connection.execute(`SELECT COUNT(*) as count FROM formFields`);
  
  console.log('Summary:');
  console.log(`  Categories: ${catCount.count}`);
  console.log(`  Types: ${typeCount.count}`);
  console.log(`  Sections: ${sectionCount.count}`);
  console.log(`  Fields: ${fieldCount.count}`);
  
  await connection.end();
}

seedRequestTypes().catch(console.error);
