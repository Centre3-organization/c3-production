import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Check current password
const [rows] = await conn.execute('SELECT id, email, passwordHash FROM users WHERE email = "mohsiin@gmail.com"');
const user = rows[0];
console.log('User found:', user.email);
console.log('Current hash:', user.passwordHash);

// Test the password
const testPasswords = ['Admin@123', 'Centre3@Admin2025', 'Test@123', 'admin123'];
for (const pwd of testPasswords) {
  const match = await bcrypt.compare(pwd, user.passwordHash);
  console.log(`Password "${pwd}" matches:`, match);
}

// Reset password to a known value
const newPassword = 'Admin@123';
const newHash = await bcrypt.hash(newPassword, 10);
await conn.execute('UPDATE users SET passwordHash = ? WHERE email = "mohsiin@gmail.com"', [newHash]);
console.log('\nPassword reset to:', newPassword);
console.log('New hash:', newHash);

// Verify the new hash works
const verifyMatch = await bcrypt.compare(newPassword, newHash);
console.log('Verification:', verifyMatch);

// Also reset ali@techbanq.net admin password
await conn.execute('UPDATE users SET passwordHash = ? WHERE email = "ali@techbanq.net"', [newHash]);
console.log('Also reset ali@techbanq.net password to:', newPassword);

await conn.end();
