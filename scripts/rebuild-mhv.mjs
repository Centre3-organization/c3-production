import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  // MHV requestTypeId = 5
  // Existing sections: 60005 (Basic Info), 60006 (Location), 20 (Decision), 21 (Materials), 22 (Person), 23 (Vehicle)
  
  // 1. Update material_type field (id=97) to be a dropdown sourced from materialTypes master data
  await conn.execute(`UPDATE formFields SET fieldType = 'dropdown', optionsSource = 'material_types' WHERE id = 97`);
  console.log('Updated material_type field to dropdown with material_types source');
  
  // 2. Add "direction" options to the direction field (id=96) - Entry/Exit
  await conn.execute(`UPDATE formFields SET options = ? WHERE id = 96`, [
    JSON.stringify([
      { value: 'entry', label: 'Entry', labelAr: 'دخول' },
      { value: 'exit', label: 'Exit', labelAr: 'خروج' }
    ])
  ]);
  console.log('Updated direction field options');
  
  // 3. Restructure sections to match the spreadsheet:
  // The spreadsheet shows:
  //   - Decision section (Material Gate Pass Yes/No, With Vehicle Yes/No)
  //   - Material Entry Details table (repeatable rows with #, Type, Model, Serial#, Qty)
  //   - Material Entry Person Details (Name, Nationality, ID, Company, Phone, Email, ID Attachment)
  //   - Material Exit Details table (repeatable rows)
  //   - Vehicle Entry Details (Driver Name, Nationality, ID, Company, Phone, Vehicle Plate)
  //   - Vehicle Exit Details (same fields)
  
  // We need to split Materials (21) into Entry and Exit, and Vehicle (23) into Entry and Exit
  // Also split Person (22) into entry person and exit person
  
  // First, let's get max section ID
  const [maxSec] = await conn.execute('SELECT MAX(id) as maxId FROM formSections');
  let nextSecId = Math.max(maxSec[0].maxId + 1, 70001);
  
  // Get max field ID
  const [maxField] = await conn.execute('SELECT MAX(id) as maxId FROM formFields');
  let nextFieldId = Math.max(maxField[0].maxId + 1, 70001);
  
  // Update existing Materials section (21) to be "Material Entry Details"
  await conn.execute(`UPDATE formSections SET name = 'Material Entry Details', nameAr = 'تفاصيل دخول المواد', code = 'material_entry', displayOrder = 4 WHERE id = 21`);
  console.log('Updated section 21 to Material Entry Details');
  
  // Update existing Person section (22) to be "Material Entry - Person Details"
  await conn.execute(`UPDATE formSections SET name = 'Material Entry - Person Details', nameAr = 'تفاصيل شخص دخول المواد', code = 'material_entry_person', displayOrder = 5 WHERE id = 22`);
  console.log('Updated section 22 to Material Entry Person Details');
  
  // Create Material Exit Details section
  const matExitSecId = nextSecId++;
  await conn.execute(`INSERT INTO formSections (id, requestTypeId, code, name, nameAr, icon, displayOrder, isRepeatable, minItems, maxItems, showCondition, isActive) VALUES (?, 5, 'material_exit', 'Material Exit Details', 'تفاصيل خروج المواد', 'package', 6, 1, 1, 50, ?, 1)`, [
    matExitSecId,
    JSON.stringify({ field: 'material_gate_pass', operator: 'equals', value: 'yes' })
  ]);
  console.log('Created Material Exit Details section:', matExitSecId);
  
  // Add fields to Material Exit Details (same as entry: direction, type, model, serial, qty)
  const exitFields = [
    { code: 'material_type', name: 'Type', fieldType: 'dropdown', isRequired: 1, colSpan: 3, order: 1, optionsSource: 'material_types' },
    { code: 'model', name: 'Model', fieldType: 'text', isRequired: 0, colSpan: 3, order: 2, optionsSource: 'static' },
    { code: 'serial_number', name: 'Serial #', fieldType: 'text', isRequired: 0, colSpan: 3, order: 3, optionsSource: 'static' },
    { code: 'quantity', name: 'Qty', fieldType: 'number', isRequired: 1, colSpan: 3, order: 4, optionsSource: 'static' },
  ];
  
  for (const f of exitFields) {
    await conn.execute(`INSERT INTO formFields (id, sectionId, code, name, fieldType, isRequired, displayOrder, columnSpan, optionsSource, isActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`, [
      nextFieldId++, matExitSecId, f.code, f.name, f.fieldType, f.isRequired, f.order, f.colSpan, f.optionsSource
    ]);
  }
  console.log('Added fields to Material Exit Details');
  
  // Remove direction field from Material Entry (since we split into separate sections)
  await conn.execute(`UPDATE formFields SET isActive = 0 WHERE id = 96`);
  console.log('Deactivated direction field from entry section');
  
  // Update existing Vehicle section (23) to be "Vehicle Entry Details"
  await conn.execute(`UPDATE formSections SET name = 'Vehicle Entry Details', nameAr = 'تفاصيل دخول المركبة', code = 'vehicle_entry', displayOrder = 7 WHERE id = 23`);
  console.log('Updated section 23 to Vehicle Entry Details');
  
  // Create Vehicle Exit Details section
  const vehExitSecId = nextSecId++;
  await conn.execute(`INSERT INTO formSections (id, requestTypeId, code, name, nameAr, icon, displayOrder, isRepeatable, minItems, maxItems, showCondition, isActive) VALUES (?, 5, 'vehicle_exit', 'Vehicle Exit Details', 'تفاصيل خروج المركبة', 'truck', 8, 0, 0, 100, ?, 1)`, [
    vehExitSecId,
    JSON.stringify({ field: 'with_vehicle', operator: 'equals', value: 'yes' })
  ]);
  console.log('Created Vehicle Exit Details section:', vehExitSecId);
  
  // Add fields to Vehicle Exit Details (same as entry)
  const vehExitFields = [
    { code: 'driver_name', name: 'Driver Name', fieldType: 'text', isRequired: 1, colSpan: 6, order: 1 },
    { code: 'driver_nationality', name: 'Nationality', fieldType: 'dropdown', isRequired: 0, colSpan: 6, order: 2, optionsSource: 'api' },
    { code: 'driver_id', name: 'ID Number', fieldType: 'text', isRequired: 1, colSpan: 6, order: 3 },
    { code: 'driver_company', name: 'Company', fieldType: 'text', isRequired: 0, colSpan: 6, order: 4 },
    { code: 'driver_phone', name: 'Phone #', fieldType: 'phone', isRequired: 0, colSpan: 6, order: 5 },
    { code: 'vehicle_plate', name: 'Vehicle Plate #', fieldType: 'text', isRequired: 1, colSpan: 6, order: 6 },
  ];
  
  for (const f of vehExitFields) {
    await conn.execute(`INSERT INTO formFields (id, sectionId, code, name, fieldType, isRequired, displayOrder, columnSpan, optionsSource, isActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`, [
      nextFieldId++, vehExitSecId, f.code, f.name, f.fieldType, f.isRequired, f.order, f.colSpan, f.optionsSource || 'static'
    ]);
  }
  console.log('Added fields to Vehicle Exit Details');
  
  // Verify final structure
  const [sections] = await conn.execute('SELECT id, code, name, displayOrder, isRepeatable, showCondition FROM formSections WHERE requestTypeId = 5 AND isActive = 1 ORDER BY displayOrder');
  console.log('\nFinal MHV Sections:');
  for (const s of sections) {
    console.log(`  ${s.displayOrder}. [${s.id}] ${s.name} (${s.code}) repeatable=${s.isRepeatable} condition=${JSON.stringify(s.showCondition)}`);
    const [fields] = await conn.execute('SELECT id, code, name, fieldType, isRequired, isActive, columnSpan, optionsSource FROM formFields WHERE sectionId = ? AND isActive = 1 ORDER BY displayOrder', [s.id]);
    for (const f of fields) {
      console.log(`     - ${f.name} (${f.code}) type=${f.fieldType} required=${f.isRequired} col=${f.columnSpan} source=${f.optionsSource}`);
    }
  }
  
  await conn.end();
  console.log('\nDone!');
}

main().catch(console.error);
