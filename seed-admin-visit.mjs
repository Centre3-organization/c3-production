import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

async function seedAdminVisitForms() {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  try {
    console.log('Seeding Admin Visit form sections and fields...');
    
    // Get Admin Visit type ID
    const [types] = await connection.execute(
      `SELECT id FROM requestTypes WHERE code = 'admin_visit' LIMIT 1`
    );
    
    if (types.length === 0) {
      console.log('Admin Visit type not found, creating it...');
      // Get Admin Visit category ID
      const [categories] = await connection.execute(
        `SELECT id FROM requestCategories WHERE code = 'admin_visit' LIMIT 1`
      );
      
      if (categories.length === 0) {
        throw new Error('Admin Visit category not found');
      }
      
      const categoryId = categories[0].id;
      
      // Create Admin Visit type
      await connection.execute(`
        INSERT INTO requestTypes (categoryId, code, name, nameAr, shortCode, description, isExclusive, maxDurationDays, sortOrder, isActive)
        VALUES (?, 'admin_visit', 'Administrative Visit', 'زيارة إدارية', 'AV', 'Standard administrative visit for internal employees and guests', false, 30, 1, true)
      `, [categoryId]);
    }
    
    // Get the Admin Visit type ID again
    const [adminVisitType] = await connection.execute(
      `SELECT id FROM requestTypes WHERE code = 'admin_visit' LIMIT 1`
    );
    
    const typeId = adminVisitType[0].id;
    console.log('Admin Visit type ID:', typeId);
    
    // Check if sections already exist
    const [existingSections] = await connection.execute(
      `SELECT id FROM formSections WHERE requestTypeId = ?`,
      [typeId]
    );
    
    if (existingSections.length > 0) {
      console.log('Admin Visit sections already exist, skipping...');
      await connection.end();
      return;
    }
    
    // Create form sections for Admin Visit
    const sections = [
      {
        code: 'visit_info',
        name: 'Visit Information',
        nameAr: 'معلومات الزيارة',
        description: 'Basic visit details and scheduling',
        sortOrder: 1,
        isRepeatable: false,
      },
      {
        code: 'visitors',
        name: 'Visitors',
        nameAr: 'الزوار',
        description: 'Visitor details (1-20 visitors)',
        sortOrder: 2,
        isRepeatable: true,
        minItems: 1,
        maxItems: 20,
      },
      {
        code: 'host_info',
        name: 'Host Information',
        nameAr: 'معلومات المضيف',
        description: 'Host and department details',
        sortOrder: 3,
        isRepeatable: false,
      },
      {
        code: 'access_areas',
        name: 'Access Areas',
        nameAr: 'مناطق الوصول',
        description: 'Areas the visitor needs to access',
        sortOrder: 4,
        isRepeatable: false,
      },
    ];
    
    for (const section of sections) {
      await connection.execute(`
        INSERT INTO formSections (requestTypeId, code, name, nameAr, icon, displayOrder, isRepeatable, minItems, maxItems, isActive)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, true)
      `, [
        typeId,
        section.code,
        section.name,
        section.nameAr,
        section.icon || null,
        section.sortOrder,
        section.isRepeatable || false,
        section.minItems || null,
        section.maxItems || null,
      ]);
    }
    
    console.log('Created form sections');
    
    // Get section IDs
    const [sectionRows] = await connection.execute(
      `SELECT id, code FROM formSections WHERE requestTypeId = ?`,
      [typeId]
    );
    
    const sectionMap = {};
    sectionRows.forEach(row => {
      sectionMap[row.code] = row.id;
    });
    
    // Create form fields
    const fields = [
      // Visit Information fields
      {
        sectionId: sectionMap['visit_info'],
        code: 'site_id',
        name: 'Site',
        nameAr: 'الموقع',
        fieldType: 'select',
        isRequired: true,
        sortOrder: 1,
        options: JSON.stringify({ source: 'api', endpoint: '/api/sites' }),
        placeholder: 'Select site',
      },
      {
        sectionId: sectionMap['visit_info'],
        code: 'visit_purpose',
        name: 'Purpose of Visit',
        nameAr: 'الغرض من الزيارة',
        fieldType: 'select',
        isRequired: true,
        sortOrder: 2,
        options: JSON.stringify([
          { value: 'meeting', label: 'Meeting', labelAr: 'اجتماع' },
          { value: 'interview', label: 'Interview', labelAr: 'مقابلة' },
          { value: 'delivery', label: 'Delivery', labelAr: 'توصيل' },
          { value: 'maintenance', label: 'Maintenance', labelAr: 'صيانة' },
          { value: 'audit', label: 'Audit', labelAr: 'تدقيق' },
          { value: 'training', label: 'Training', labelAr: 'تدريب' },
          { value: 'other', label: 'Other', labelAr: 'أخرى' },
        ]),
      },
      {
        sectionId: sectionMap['visit_info'],
        code: 'purpose_details',
        name: 'Purpose Details',
        nameAr: 'تفاصيل الغرض',
        fieldType: 'textarea',
        isRequired: false,
        sortOrder: 3,
        placeholder: 'Provide additional details about the visit purpose',
      },
      {
        sectionId: sectionMap['visit_info'],
        code: 'start_date',
        name: 'Start Date',
        nameAr: 'تاريخ البداية',
        fieldType: 'date',
        isRequired: true,
        sortOrder: 4,
      },
      {
        sectionId: sectionMap['visit_info'],
        code: 'end_date',
        name: 'End Date',
        nameAr: 'تاريخ النهاية',
        fieldType: 'date',
        isRequired: true,
        sortOrder: 5,
      },
      {
        sectionId: sectionMap['visit_info'],
        code: 'start_time',
        name: 'Start Time',
        nameAr: 'وقت البداية',
        fieldType: 'time',
        isRequired: false,
        sortOrder: 6,
      },
      {
        sectionId: sectionMap['visit_info'],
        code: 'end_time',
        name: 'End Time',
        nameAr: 'وقت النهاية',
        fieldType: 'time',
        isRequired: false,
        sortOrder: 7,
      },
      
      // Visitors fields (repeatable)
      {
        sectionId: sectionMap['visitors'],
        code: 'full_name',
        name: 'Full Name',
        nameAr: 'الاسم الكامل',
        fieldType: 'text',
        isRequired: true,
        sortOrder: 1,
        placeholder: 'Enter visitor full name',
      },
      {
        sectionId: sectionMap['visitors'],
        code: 'nationality',
        name: 'Nationality',
        nameAr: 'الجنسية',
        fieldType: 'select',
        isRequired: true,
        sortOrder: 2,
        options: JSON.stringify({ source: 'api', endpoint: '/api/countries' }),
      },
      {
        sectionId: sectionMap['visitors'],
        code: 'id_type',
        name: 'ID Type',
        nameAr: 'نوع الهوية',
        fieldType: 'select',
        isRequired: true,
        sortOrder: 3,
        options: JSON.stringify([
          { value: 'national_id', label: 'National ID', labelAr: 'هوية وطنية' },
          { value: 'iqama', label: 'Iqama', labelAr: 'إقامة' },
          { value: 'passport', label: 'Passport', labelAr: 'جواز سفر' },
        ]),
      },
      {
        sectionId: sectionMap['visitors'],
        code: 'id_number',
        name: 'ID Number',
        nameAr: 'رقم الهوية',
        fieldType: 'text',
        isRequired: true,
        sortOrder: 4,
        placeholder: 'Enter ID number',
      },
      {
        sectionId: sectionMap['visitors'],
        code: 'company',
        name: 'Company',
        nameAr: 'الشركة',
        fieldType: 'text',
        isRequired: false,
        sortOrder: 5,
        placeholder: 'Enter company name',
      },
      {
        sectionId: sectionMap['visitors'],
        code: 'phone',
        name: 'Phone Number',
        nameAr: 'رقم الهاتف',
        fieldType: 'phone',
        isRequired: false,
        sortOrder: 6,
        placeholder: '+966 5XX XXX XXXX',
      },
      {
        sectionId: sectionMap['visitors'],
        code: 'email',
        name: 'Email',
        nameAr: 'البريد الإلكتروني',
        fieldType: 'email',
        isRequired: false,
        sortOrder: 7,
        placeholder: 'visitor@example.com',
      },
      
      // Host Information fields
      {
        sectionId: sectionMap['host_info'],
        code: 'host_name',
        name: 'Host Name',
        nameAr: 'اسم المضيف',
        fieldType: 'text',
        isRequired: true,
        sortOrder: 1,
        placeholder: 'Enter host name',
      },
      {
        sectionId: sectionMap['host_info'],
        code: 'host_department',
        name: 'Department',
        nameAr: 'القسم',
        fieldType: 'select',
        isRequired: true,
        sortOrder: 2,
        options: JSON.stringify({ source: 'api', endpoint: '/api/departments' }),
      },
      {
        sectionId: sectionMap['host_info'],
        code: 'host_phone',
        name: 'Host Phone',
        nameAr: 'هاتف المضيف',
        fieldType: 'phone',
        isRequired: false,
        sortOrder: 3,
        placeholder: '+966 5XX XXX XXXX',
      },
      {
        sectionId: sectionMap['host_info'],
        code: 'host_email',
        name: 'Host Email',
        nameAr: 'بريد المضيف',
        fieldType: 'email',
        isRequired: false,
        sortOrder: 4,
        placeholder: 'host@centre3.com',
      },
      
      // Access Areas fields
      {
        sectionId: sectionMap['access_areas'],
        code: 'zones',
        name: 'Access Zones',
        nameAr: 'مناطق الوصول',
        fieldType: 'multiselect',
        isRequired: false,
        sortOrder: 1,
        options: JSON.stringify({ source: 'api', endpoint: '/api/zones' }),
        helpText: 'Select the zones the visitor needs to access',
      },
      {
        sectionId: sectionMap['access_areas'],
        code: 'escort_required',
        name: 'Escort Required',
        nameAr: 'مرافقة مطلوبة',
        fieldType: 'checkbox',
        isRequired: false,
        sortOrder: 2,
        defaultValue: 'false',
      },
      {
        sectionId: sectionMap['access_areas'],
        code: 'special_instructions',
        name: 'Special Instructions',
        nameAr: 'تعليمات خاصة',
        fieldType: 'textarea',
        isRequired: false,
        sortOrder: 3,
        placeholder: 'Any special access requirements or instructions',
      },
    ];
    
    for (const field of fields) {
      await connection.execute(`
        INSERT INTO formFields (sectionId, code, name, nameAr, fieldType, isRequired, displayOrder, options, placeholder, helpText, defaultValue, isActive)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true)
      `, [
        field.sectionId,
        field.code,
        field.name,
        field.nameAr,
        field.fieldType,
        field.isRequired,
        field.sortOrder,
        field.options || null,
        field.placeholder || null,
        field.helpText || null,
        field.defaultValue || null,
      ]);
    }
    
    console.log('Created form fields');
    console.log('Admin Visit form seeding completed successfully!');
    
  } catch (error) {
    console.error('Error seeding Admin Visit forms:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

seedAdminVisitForms();
