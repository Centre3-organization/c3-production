import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const [tables] = await connection.execute('SHOW TABLES');
  console.log('Tables:', tables);
  
  // Check users table structure
  const [columns] = await connection.execute('DESCRIBE users');
  console.log('\nUsers table columns:', columns);
  
  // Get all users
  const [users] = await connection.execute('SELECT * FROM users');
  console.log('\nAll users:', users);
  
  await connection.end();
}
main().catch(console.error);
