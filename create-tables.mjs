import mysql from 'mysql2/promise';

async function createTables() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  // Create requestCategories table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS requestCategories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(50) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      nameAr VARCHAR(255),
      description TEXT,
      icon VARCHAR(100),
      displayOrder INT DEFAULT 0 NOT NULL,
      isActive BOOLEAN DEFAULT true NOT NULL,
      requiresInternalOnly BOOLEAN DEFAULT false NOT NULL,
      allowedGroupIds JSON,
      allowMultipleTypes BOOLEAN DEFAULT false NOT NULL,
      typeCombinationRules JSON,
      hasRequestorSection BOOLEAN DEFAULT true NOT NULL,
      hasLocationSection BOOLEAN DEFAULT true NOT NULL,
      hasScheduleSection BOOLEAN DEFAULT true NOT NULL,
      hasVisitorSection BOOLEAN DEFAULT true NOT NULL,
      hasAttachmentSection BOOLEAN DEFAULT true NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
    )
  `);
  console.log('✓ Created requestCategories');
  
  // Create requestTypes table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS requestTypes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      categoryId INT NOT NULL,
      code VARCHAR(50) NOT NULL,
      name VARCHAR(255) NOT NULL,
      nameAr VARCHAR(255),
      shortCode VARCHAR(10),
      description TEXT,
      displayOrder INT DEFAULT 0 NOT NULL,
      isActive BOOLEAN DEFAULT true NOT NULL,
      isExclusive BOOLEAN DEFAULT false NOT NULL,
      maxDurationDays INT,
      workflowId INT,
      generateQrCode BOOLEAN DEFAULT true NOT NULL,
      generateDcpForm BOOLEAN DEFAULT true NOT NULL,
      notifyEmail BOOLEAN DEFAULT true NOT NULL,
      notifySms BOOLEAN DEFAULT true NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
    )
  `);
  console.log('✓ Created requestTypes');
  
  // Create formSections table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS formSections (
      id INT AUTO_INCREMENT PRIMARY KEY,
      requestTypeId INT NOT NULL,
      code VARCHAR(50) NOT NULL,
      name VARCHAR(255) NOT NULL,
      nameAr VARCHAR(255),
      icon VARCHAR(100),
      displayOrder INT DEFAULT 0 NOT NULL,
      isRepeatable BOOLEAN DEFAULT false NOT NULL,
      minItems INT DEFAULT 0 NOT NULL,
      maxItems INT DEFAULT 100 NOT NULL,
      showCondition JSON,
      isActive BOOLEAN DEFAULT true NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
    )
  `);
  console.log('✓ Created formSections');
  
  // Create formFields table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS formFields (
      id INT AUTO_INCREMENT PRIMARY KEY,
      sectionId INT NOT NULL,
      code VARCHAR(100) NOT NULL,
      name VARCHAR(255) NOT NULL,
      nameAr VARCHAR(255),
      fieldType ENUM('text', 'textarea', 'number', 'email', 'phone', 'date', 'datetime', 'dropdown', 'dropdown_multi', 'radio', 'checkbox', 'checkbox_group', 'file', 'file_multi', 'user_lookup', 'readonly') NOT NULL,
      isRequired BOOLEAN DEFAULT false NOT NULL,
      displayOrder INT DEFAULT 0 NOT NULL,
      columnSpan INT DEFAULT 6 NOT NULL,
      placeholder VARCHAR(255),
      placeholderAr VARCHAR(255),
      helpText TEXT,
      helpTextAr TEXT,
      defaultValue VARCHAR(500),
      options JSON,
      optionsSource ENUM('static', 'api', 'dependent') DEFAULT 'static',
      optionsApi VARCHAR(500),
      dependsOnField VARCHAR(100),
      validation JSON,
      showCondition JSON,
      isActive BOOLEAN DEFAULT true NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
    )
  `);
  console.log('✓ Created formFields');
  
  // Create fieldOptions table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS fieldOptions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      fieldId INT NOT NULL,
      value VARCHAR(255) NOT NULL,
      label VARCHAR(255) NOT NULL,
      labelAr VARCHAR(255),
      parentValue VARCHAR(255),
      displayOrder INT DEFAULT 0 NOT NULL,
      isActive BOOLEAN DEFAULT true NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    )
  `);
  console.log('✓ Created fieldOptions');
  
  // Create requestVisitors table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS requestVisitors (
      id INT AUTO_INCREMENT PRIMARY KEY,
      requestId INT NOT NULL,
      visitorIndex INT NOT NULL,
      fullName VARCHAR(255) NOT NULL,
      nationality VARCHAR(100),
      idType ENUM('national_id', 'iqama', 'passport'),
      idNumber VARCHAR(50) NOT NULL,
      company VARCHAR(255),
      jobTitle VARCHAR(255),
      mobile VARCHAR(20),
      email VARCHAR(320),
      isVerified BOOLEAN DEFAULT false NOT NULL,
      verificationSource ENUM('yaqeen', 'manual'),
      idAttachmentUrl VARCHAR(500),
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    )
  `);
  console.log('✓ Created requestVisitors');
  
  // Create requestMaterials table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS requestMaterials (
      id INT AUTO_INCREMENT PRIMARY KEY,
      requestId INT NOT NULL,
      materialIndex INT NOT NULL,
      direction ENUM('entry', 'exit') NOT NULL,
      materialType VARCHAR(100) NOT NULL,
      model VARCHAR(255),
      serialNumber VARCHAR(255),
      quantity INT DEFAULT 1 NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    )
  `);
  console.log('✓ Created requestMaterials');
  
  // Create requestVehicles table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS requestVehicles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      requestId INT NOT NULL,
      driverName VARCHAR(255),
      driverNationality VARCHAR(100),
      driverId VARCHAR(50),
      driverCompany VARCHAR(255),
      driverPhone VARCHAR(20),
      vehiclePlate VARCHAR(50),
      vehicleType VARCHAR(100),
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    )
  `);
  console.log('✓ Created requestVehicles');
  
  // Add new columns to requests table
  try {
    await connection.execute(`ALTER TABLE requests ADD COLUMN categoryId INT`);
    console.log('✓ Added categoryId to requests');
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log('  categoryId already exists in requests');
    } else throw e;
  }
  
  try {
    await connection.execute(`ALTER TABLE requests ADD COLUMN selectedTypeIds JSON`);
    console.log('✓ Added selectedTypeIds to requests');
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log('  selectedTypeIds already exists in requests');
    } else throw e;
  }
  
  try {
    await connection.execute(`ALTER TABLE requests ADD COLUMN formData JSON`);
    console.log('✓ Added formData to requests');
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log('  formData already exists in requests');
    } else throw e;
  }
  
  console.log('\nAll tables created successfully!');
  await connection.end();
}

createTables().catch(console.error);
