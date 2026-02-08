import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  // ============================================================
  // PLAN:
  // WP (requestTypeId=3): Currently has work_details(11,order=1), visitors(12,order=2), method_statement(13,order=3), risk_assessment(14,order=4)
  //   -> Add basic_info at order=1, location at order=2, shift existing to order=3,4,5,6
  //
  // MOP (requestTypeId=4): Currently has project_info(15,order=1), location(16,order=2), contractor(17,order=3), activity_impact(18,order=4), affected_systems(19,order=5)
  //   -> Add basic_info at order=1, shift project_info to order=2, update location to have proper cascading fields at order=3, shift rest
  //
  // MHV (requestTypeId=5): Currently has decision(20,order=1), materials(21,order=2), person(22,order=3), vehicle(23,order=4)
  //   -> Add basic_info at order=1, location at order=2, shift existing to order=3,4,5,6
  // ============================================================

  // --- STEP 1: Reorder existing WP sections ---
  console.log('=== Reordering WP sections ===');
  await conn.execute('UPDATE formSections SET displayOrder = 3 WHERE id = 11'); // work_details -> 3
  await conn.execute('UPDATE formSections SET displayOrder = 4 WHERE id = 12'); // visitors -> 4
  await conn.execute('UPDATE formSections SET displayOrder = 5 WHERE id = 13'); // method_statement -> 5
  await conn.execute('UPDATE formSections SET displayOrder = 6 WHERE id = 14'); // risk_assessment -> 6
  console.log('WP sections reordered');

  // --- STEP 2: Reorder existing MOP sections ---
  console.log('=== Reordering MOP sections ===');
  await conn.execute('UPDATE formSections SET displayOrder = 2 WHERE id = 15'); // project_info -> 2
  await conn.execute('UPDATE formSections SET displayOrder = 3 WHERE id = 16'); // location -> 3
  await conn.execute('UPDATE formSections SET displayOrder = 4 WHERE id = 17'); // contractor -> 4
  await conn.execute('UPDATE formSections SET displayOrder = 5 WHERE id = 18'); // activity_impact -> 5
  await conn.execute('UPDATE formSections SET displayOrder = 6 WHERE id = 19'); // affected_systems -> 6
  console.log('MOP sections reordered');

  // --- STEP 3: Reorder existing MHV sections ---
  console.log('=== Reordering MHV sections ===');
  await conn.execute('UPDATE formSections SET displayOrder = 3 WHERE id = 20'); // decision -> 3
  await conn.execute('UPDATE formSections SET displayOrder = 4 WHERE id = 21'); // materials -> 4
  await conn.execute('UPDATE formSections SET displayOrder = 5 WHERE id = 22'); // person -> 5
  await conn.execute('UPDATE formSections SET displayOrder = 6 WHERE id = 23'); // vehicle -> 6
  console.log('MHV sections reordered');

  // --- STEP 4: Insert new sections ---
  console.log('=== Inserting new sections ===');
  
  // WP Basic Information (order=1)
  const [wpBasicSec] = await conn.execute(
    "INSERT INTO formSections (requestTypeId, code, name, displayOrder, isActive) VALUES (3, 'basic_info', 'Basic Information', 1, 1)"
  );
  const wpBasicSecId = wpBasicSec.insertId;
  console.log('WP Basic Info section ID:', wpBasicSecId);

  // WP Location (order=2)
  const [wpLocSec] = await conn.execute(
    "INSERT INTO formSections (requestTypeId, code, name, displayOrder, isActive) VALUES (3, 'location', 'Location', 2, 1)"
  );
  const wpLocSecId = wpLocSec.insertId;
  console.log('WP Location section ID:', wpLocSecId);

  // MOP Basic Information (order=1)
  const [mopBasicSec] = await conn.execute(
    "INSERT INTO formSections (requestTypeId, code, name, displayOrder, isActive) VALUES (4, 'basic_info', 'Basic Information', 1, 1)"
  );
  const mopBasicSecId = mopBasicSec.insertId;
  console.log('MOP Basic Info section ID:', mopBasicSecId);

  // MHV Basic Information (order=1)
  const [mhvBasicSec] = await conn.execute(
    "INSERT INTO formSections (requestTypeId, code, name, displayOrder, isActive) VALUES (5, 'basic_info', 'Basic Information', 1, 1)"
  );
  const mhvBasicSecId = mhvBasicSec.insertId;
  console.log('MHV Basic Info section ID:', mhvBasicSecId);

  // MHV Location (order=2)
  const [mhvLocSec] = await conn.execute(
    "INSERT INTO formSections (requestTypeId, code, name, displayOrder, isActive) VALUES (5, 'location', 'Location', 2, 1)"
  );
  const mhvLocSecId = mhvLocSec.insertId;
  console.log('MHV Location section ID:', mhvLocSecId);

  // --- STEP 5: Insert Basic Information fields for WP, MOP, MHV ---
  // Template: Requestor Name, Company, Email, Department, Purpose of Entry, Description
  const basicInfoFields = [
    { code: 'requestor_name', name: 'Requestor Name', fieldType: 'readonly', isRequired: 1, columnSpan: 6, displayOrder: 1, optionsSource: 'user_profile' },
    { code: 'company', name: 'Company', fieldType: 'readonly', isRequired: 1, columnSpan: 6, displayOrder: 2, optionsSource: 'user_profile' },
    { code: 'email', name: 'Email', fieldType: 'readonly', isRequired: 1, columnSpan: 6, displayOrder: 3, optionsSource: 'user_profile' },
    { code: 'department', name: 'Department', fieldType: 'readonly', isRequired: 1, columnSpan: 6, displayOrder: 4, optionsSource: 'user_profile' },
    { code: 'purpose', name: 'Purpose of Entry', fieldType: 'dropdown', isRequired: 1, columnSpan: 6, displayOrder: 5, optionsSource: 'static' },
    { code: 'description', name: 'Description', fieldType: 'textarea', isRequired: 0, columnSpan: 12, displayOrder: 6, optionsSource: 'static' },
  ];

  // Location fields template (matching TEP Location)
  const locationFields = [
    { code: 'country', name: 'Country', fieldType: 'dropdown', isRequired: 1, columnSpan: 6, displayOrder: 1, optionsSource: 'countries', dependsOnField: null, filterByField: null },
    { code: 'region', name: 'Region', fieldType: 'dropdown', isRequired: 0, columnSpan: 6, displayOrder: 2, optionsSource: 'regions', dependsOnField: 'country', filterByField: null },
    { code: 'city', name: 'City', fieldType: 'dropdown', isRequired: 1, columnSpan: 6, displayOrder: 3, optionsSource: 'cities', dependsOnField: 'country', filterByField: 'country' },
    { code: 'site', name: 'Site', fieldType: 'dropdown', isRequired: 1, columnSpan: 6, displayOrder: 4, optionsSource: 'sites', dependsOnField: 'city', filterByField: 'city' },
    { code: 'Zone', name: 'Zone', fieldType: 'dropdown', isRequired: 1, columnSpan: 6, displayOrder: 5, optionsSource: 'zones', dependsOnField: 'site', filterByField: 'site' },
    { code: 'area', name: 'Area', fieldType: 'dropdown', isRequired: 0, columnSpan: 6, displayOrder: 6, optionsSource: 'areas', dependsOnField: 'zone', filterByField: 'zone' },
  ];

  const insertBasicField = async (sectionId, field) => {
    await conn.execute(
      "INSERT INTO formFields (sectionId, code, name, fieldType, isRequired, columnSpan, displayOrder, isActive, optionsSource) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)",
      [sectionId, field.code, field.name, field.fieldType, field.isRequired, field.columnSpan, field.displayOrder, field.optionsSource]
    );
  };

  const insertLocationField = async (sectionId, field) => {
    await conn.execute(
      "INSERT INTO formFields (sectionId, code, name, fieldType, isRequired, columnSpan, displayOrder, isActive, optionsSource, dependsOnField, filterByField) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)",
      [sectionId, field.code, field.name, field.fieldType, field.isRequired, field.columnSpan, field.displayOrder, field.optionsSource, field.dependsOnField, field.filterByField]
    );
  };

  // WP Basic Info fields
  console.log('=== Inserting WP Basic Info fields ===');
  for (const field of basicInfoFields) {
    await insertBasicField(wpBasicSecId, field);
  }
  console.log('WP Basic Info fields inserted');

  // WP Location fields
  console.log('=== Inserting WP Location fields ===');
  for (const field of locationFields) {
    await insertLocationField(wpLocSecId, field);
  }
  console.log('WP Location fields inserted');

  // MOP Basic Info fields
  console.log('=== Inserting MOP Basic Info fields ===');
  for (const field of basicInfoFields) {
    await insertBasicField(mopBasicSecId, field);
  }
  console.log('MOP Basic Info fields inserted');

  // Update MOP existing location section (id=16) to have proper cascading fields
  // First, delete existing location fields and replace with proper cascading ones
  console.log('=== Updating MOP Location fields ===');
  // Keep existing fields but add country, region, zone, area before them
  // Actually, we need to restructure: add country+region at top, update city/site to have cascading, add zone+area
  // Current MOP location: city(74), site(75), white_space(76), facility_space(77), outdoor(78), stakeholders(79)
  
  // Update city to depend on country
  await conn.execute("UPDATE formFields SET optionsSource = 'cities', dependsOnField = 'country', filterByField = 'country', displayOrder = 3 WHERE id = 74");
  // Update site to depend on city
  await conn.execute("UPDATE formFields SET optionsSource = 'sites', dependsOnField = 'city', filterByField = 'city', displayOrder = 4 WHERE id = 75");
  // Shift existing fields down
  await conn.execute("UPDATE formFields SET displayOrder = 7 WHERE id = 76"); // white_space
  await conn.execute("UPDATE formFields SET displayOrder = 8 WHERE id = 77"); // facility_space
  await conn.execute("UPDATE formFields SET displayOrder = 9 WHERE id = 78"); // outdoor
  await conn.execute("UPDATE formFields SET displayOrder = 10 WHERE id = 79"); // stakeholders

  // Insert country and region at top of MOP location
  await conn.execute(
    "INSERT INTO formFields (sectionId, code, name, fieldType, isRequired, columnSpan, displayOrder, isActive, optionsSource, dependsOnField, filterByField) VALUES (16, 'country', 'Country', 'dropdown', 1, 6, 1, 1, 'countries', NULL, NULL)"
  );
  await conn.execute(
    "INSERT INTO formFields (sectionId, code, name, fieldType, isRequired, columnSpan, displayOrder, isActive, optionsSource, dependsOnField, filterByField) VALUES (16, 'region', 'Region', 'dropdown', 0, 6, 2, 1, 'regions', 'country', NULL)"
  );
  // Insert zone and area after site
  await conn.execute(
    "INSERT INTO formFields (sectionId, code, name, fieldType, isRequired, columnSpan, displayOrder, isActive, optionsSource, dependsOnField, filterByField) VALUES (16, 'Zone', 'Zone', 'dropdown', 1, 6, 5, 1, 'zones', 'site', 'site')"
  );
  await conn.execute(
    "INSERT INTO formFields (sectionId, code, name, fieldType, isRequired, columnSpan, displayOrder, isActive, optionsSource, dependsOnField, filterByField) VALUES (16, 'area', 'Area', 'dropdown', 0, 6, 6, 1, 'areas', 'zone', 'zone')"
  );
  console.log('MOP Location fields updated with cascading');

  // MHV Basic Info fields
  console.log('=== Inserting MHV Basic Info fields ===');
  for (const field of basicInfoFields) {
    await insertBasicField(mhvBasicSecId, field);
  }
  console.log('MHV Basic Info fields inserted');

  // MHV Location fields
  console.log('=== Inserting MHV Location fields ===');
  for (const field of locationFields) {
    await insertLocationField(mhvLocSecId, field);
  }
  console.log('MHV Location fields inserted');

  // --- STEP 6: Verify ---
  console.log('\n=== VERIFICATION ===');
  
  const [wpSections] = await conn.execute('SELECT id, code, name, displayOrder FROM formSections WHERE requestTypeId = 3 ORDER BY displayOrder');
  console.log('WP Sections:', JSON.stringify(wpSections));
  
  const [mopSections] = await conn.execute('SELECT id, code, name, displayOrder FROM formSections WHERE requestTypeId = 4 ORDER BY displayOrder');
  console.log('MOP Sections:', JSON.stringify(mopSections));
  
  const [mhvSections] = await conn.execute('SELECT id, code, name, displayOrder FROM formSections WHERE requestTypeId = 5 ORDER BY displayOrder');
  console.log('MHV Sections:', JSON.stringify(mhvSections));

  await conn.end();
  console.log('\nDone!');
}

main().catch(console.error);
