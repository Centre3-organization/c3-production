import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const [rows] = await connection.execute('SELECT * FROM users');
  console.log('Users in database:', JSON.stringify(rows, null, 2));
  await connection.end();
}
main().catch(console.error);
