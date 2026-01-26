import mysql from 'mysql2/promise';

async function checkTables() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  const [tables] = await connection.execute('SHOW TABLES');
  console.log('Existing tables:');
  tables.forEach(t => console.log('  -', Object.values(t)[0]));
  
  // Check if our new tables exist
  const newTables = ['requestCategories', 'requestTypes', 'formSections', 'formFields', 'fieldOptions', 'requestVisitors', 'requestMaterials', 'requestVehicles'];
  const tableNames = tables.map(t => Object.values(t)[0]);
  
  console.log('\nNew tables status:');
  for (const table of newTables) {
    const exists = tableNames.includes(table);
    console.log(`  ${table}: ${exists ? '✓ exists' : '✗ missing'}`);
  }
  
  await connection.end();
}

checkTables().catch(console.error);
