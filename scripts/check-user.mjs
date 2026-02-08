import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await conn.execute('SELECT id, email, name, role, openId, passwordHash FROM users WHERE email = "mohsiin@gmail.com"');
rows.forEach(r => {
  console.log('id:', r.id);
  console.log('email:', r.email);
  console.log('name:', r.name);
  console.log('role:', r.role);
  console.log('openId:', r.openId);
  console.log('hasPassword:', !!r.passwordHash);
});
await conn.end();
