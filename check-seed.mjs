import mysql from 'mysql2/promise';

async function checkSeed() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  const [[catCount]] = await connection.execute(`SELECT COUNT(*) as count FROM requestCategories`);
  const [[typeCount]] = await connection.execute(`SELECT COUNT(*) as count FROM requestTypes`);
  const [[sectionCount]] = await connection.execute(`SELECT COUNT(*) as count FROM formSections`);
  const [[fieldCount]] = await connection.execute(`SELECT COUNT(*) as count FROM formFields`);
  
  console.log('Seed Status:');
  console.log(`  Categories: ${catCount.count}`);
  console.log(`  Types: ${typeCount.count}`);
  console.log(`  Sections: ${sectionCount.count}`);
  console.log(`  Fields: ${fieldCount.count}`);
  
  // List categories
  const [cats] = await connection.execute(`SELECT code, name FROM requestCategories`);
  console.log('\nCategories:');
  cats.forEach(c => console.log(`  - ${c.code}: ${c.name}`));
  
  // List types
  const [types] = await connection.execute(`SELECT code, name, shortCode FROM requestTypes`);
  console.log('\nTypes:');
  types.forEach(t => console.log(`  - ${t.code}: ${t.name} (${t.shortCode})`));
  
  await connection.end();
}

checkSeed().catch(console.error);
